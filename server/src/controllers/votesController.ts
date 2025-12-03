import { Response } from 'express';
import pool from '../config/database';
import { generateUUID } from '../utils/uuid';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const createVote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { pollId, candidateId } = req.body;

  if (!pollId || !candidateId) {
    return res.status(400).json({ error: 'pollId y candidateId son requeridos' });
  }

  // Verificar que el usuario está activo
  const [users] = await pool.execute(
    'SELECT status FROM users WHERE id = ?',
    [userId]
  ) as any[];

  if (!Array.isArray(users) || users.length === 0 || users[0].status !== 'active') {
    return res.status(403).json({ error: 'Tu cuenta no está activa' });
  }

  // Verificar que la encuesta está activa y vigente
  const [polls] = await pool.execute(
    'SELECT * FROM polls WHERE id = ?',
    [pollId]
  ) as any[];

  if (!Array.isArray(polls) || polls.length === 0) {
    return res.status(404).json({ error: 'Encuesta no encontrada' });
  }

  const poll = polls[0];

  if (!poll.is_active) {
    return res.status(400).json({ error: 'Esta encuesta no está activa' });
  }

  if (new Date(poll.end_date) < new Date()) {
    return res.status(400).json({ error: 'Esta encuesta ya ha finalizado' });
  }

  // Verificar edad mínima si aplica
  if (poll.min_age) {
    const [userData] = await pool.execute(
      'SELECT age FROM users WHERE id = ?',
      [userId]
    ) as any[];

    const userAge = userData[0]?.age;
    if (userAge && userAge < poll.min_age) {
      return res.status(403).json({ error: 'No cumples con la edad mínima requerida' });
    }
  }

  // Verificar que el candidato pertenece a la encuesta
  const [candidates] = await pool.execute(
    'SELECT id FROM candidates WHERE id = ? AND poll_id = ?',
    [candidateId, pollId]
  ) as any[];

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(404).json({ error: 'Candidato no encontrado en esta encuesta' });
  }

  // Verificar que no haya votado antes (la constraint única lo previene, pero mejor verificar antes)
  const [existingVotes] = await pool.execute(
    'SELECT id FROM votes WHERE poll_id = ? AND user_id = ?',
    [pollId, userId]
  ) as any[];

  if (Array.isArray(existingVotes) && existingVotes.length > 0) {
    return res.status(400).json({ error: 'Ya has votado en esta encuesta' });
  }

  // Crear el voto
  const voteId = generateUUID();

  try {
    await pool.execute(
      'INSERT INTO votes (id, poll_id, candidate_id, user_id) VALUES (?, ?, ?, ?)',
      [voteId, pollId, candidateId, userId]
    );

    res.status(201).json({
      id: voteId,
      poll_id: pollId,
      candidate_id: candidateId,
      user_id: userId,
      message: 'Voto registrado exitosamente'
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya has votado en esta encuesta' });
    }
    throw error;
  }
});

export const getUserVotes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  const [votes] = await pool.execute(
    'SELECT poll_id FROM votes WHERE user_id = ?',
    [userId]
  ) as any[];

  res.json(votes);
});

export const getVoteCounts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pollId } = req.params;
  const userId = req.user?.userId;
  const role = req.user?.role;

  // Verificar permisos - solo creador de la encuesta o admin puede ver resultados
  const [polls] = await pool.execute(
    'SELECT created_by FROM polls WHERE id = ?',
    [pollId]
  ) as any[];

  if (!Array.isArray(polls) || polls.length === 0) {
    return res.status(404).json({ error: 'Encuesta no encontrada' });
  }

  const poll = polls[0];

  if (role !== 'admin' && poll.created_by !== userId) {
    return res.status(403).json({ error: 'No tienes permiso para ver los resultados de esta encuesta' });
  }

  // Obtener conteo de votos por candidato
  const [voteCounts] = await pool.execute(
    `SELECT 
      c.id as candidate_id,
      c.name as candidate_name,
      COUNT(v.id) as count
    FROM candidates c
    LEFT JOIN votes v ON c.id = v.candidate_id AND v.poll_id = ?
    WHERE c.poll_id = ?
    GROUP BY c.id, c.name
    ORDER BY count DESC`,
    [pollId, pollId]
  ) as any[];

  res.json(voteCounts);
});

