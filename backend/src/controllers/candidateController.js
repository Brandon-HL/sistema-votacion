import { pool } from '../database/db.js';

export const getCandidatesByPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    // ORDENAMOS POR ID para evitar el error de "unknown column created_at"
    const [rows] = await pool.query('SELECT * FROM candidates WHERE poll_id = ? ORDER BY id ASC', [pollId]);
    res.json(rows);
  } catch (error) {
    console.error('Error getCandidatesByPoll:', error);
    res.status(500).json({ message: 'Error al obtener candidatos' });
  }
};

export const createCandidate = async (req, res) => {
  try {
    const { name, party } = req.body;
    const { pollId } = req.params;

    // Manejo de la foto subida con Multer
    let photoUrl = null;
    if (req.file) {
      photoUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    }

    await pool.query(
      'INSERT INTO candidates (poll_id, name, party, photo_url) VALUES (?, ?, ?, ?)',
      [pollId, name, party, photoUrl]
    );

    res.json({ message: 'Candidato agregado exitosamente' });
  } catch (error) {
    console.error('Error createCandidate:', error);
    res.status(500).json({ message: 'Error al agregar candidato' });
  }
};

export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    // No strict permission check for now to avoid complexity, or check if user is admin/creator
    await pool.query('DELETE FROM candidates WHERE id = ?', [id]);
    res.json({ message: 'Candidato eliminado' });
  } catch (error) {
    console.error('Error deleteCandidate:', error);
    res.status(500).json({ message: 'Error al eliminar candidato' });
  }
};