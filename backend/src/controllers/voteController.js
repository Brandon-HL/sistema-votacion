import { pool } from '../database/db.js';

export const createVote = async (req, res) => {
  try {
    const { pollId, candidateId } = req.body;
    const userId = req.user.id;

    if (!pollId || !candidateId) {
      return res.status(400).json({ error: 'pollId y candidateId son requeridos' });
    }

    // Verificar que la votación existe y está activa
    const [polls] = await pool.query(
      'SELECT * FROM polls WHERE id = ? AND is_active = TRUE AND end_date > NOW()',
      [pollId]
    );

    if (polls.length === 0) {
      return res.status(400).json({ error: 'Esta votación no está disponible' });
    }

    const poll = polls[0];

    // Verificar edad mínima
    const [users] = await pool.query('SELECT age FROM users WHERE id = ?', [userId]);
    const userAge = users[0]?.age || 0;

    if (poll.min_age && userAge < poll.min_age) {
      return res.status(403).json({ error: 'No cumples con la edad mínima requerida' });
    }

    // Verificar que el candidato pertenece a esta votación
    const [candidates] = await pool.query(
      'SELECT id FROM candidates WHERE id = ? AND poll_id = ?',
      [candidateId, pollId]
    );

    if (candidates.length === 0) {
      return res.status(400).json({ error: 'Candidato no válido para esta votación' });
    }

    // Verificar que el usuario no haya votado ya
    const [existingVotes] = await pool.query(
      'SELECT id FROM votes WHERE poll_id = ? AND user_id = ?',
      [pollId, userId]
    );

    if (existingVotes.length > 0) {
      return res.status(400).json({ error: 'Ya has votado en esta votación' });
    }

    // Crear voto - NO enviar ID, MySQL lo genera automáticamente
    const [result] = await pool.query(
      'INSERT INTO votes (poll_id, candidate_id, user_id) VALUES (?, ?, ?)',
      [pollId, candidateId, userId]
    );

    const voteId = result.insertId;
    res.status(201).json({ message: 'Voto registrado exitosamente', id: voteId });
  } catch (error) {
    console.error('Error en createVote:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya has votado en esta votación' });
    }
    res.status(500).json({ error: 'Error al registrar voto' });
  }
};

export const getUserVotes = async (req, res) => {
  try {
    const userId = req.user.id;

    const [votes] = await pool.query(
      'SELECT poll_id FROM votes WHERE user_id = ?',
      [userId]
    );

    res.json(votes);
  } catch (error) {
    console.error('Error en getUserVotes:', error);
    res.status(500).json({ error: 'Error al obtener votos' });
  }
};

export const getVoteCounts = async (req, res) => {
  try {
    const { pollId } = req.params;
    // CORRECCIÓN: Usamos req.user.id, igual que en createVote
    const role = req.user.role;
    const userId = req.user.id;

    // Verificar permisos
    if (role === 'supervisor') {
      const [polls] = await pool.query(
        'SELECT created_by FROM polls WHERE id = ?',
        [pollId]
      );

      if (polls.length === 0 || polls[0].created_by !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para ver estos resultados' });
      }
    } else if (role === 'voter') {
      return res.status(403).json({ error: 'No tienes permiso para ver estos resultados' });
    }

    const [voteCounts] = await pool.query(
      `SELECT 
        c.id as candidate_id,
        c.name as candidate_name,
        COUNT(v.id) as count
      FROM candidates c
      LEFT JOIN votes v ON c.id = v.candidate_id
      WHERE c.poll_id = ?
      GROUP BY c.id, c.name
      ORDER BY count DESC`,
      [pollId]
    );

    res.json(voteCounts);
  } catch (error) {
    console.error('Error en getVoteCounts:', error);
    res.status(500).json({ error: 'Error al obtener conteo de votos' });
  }
};

