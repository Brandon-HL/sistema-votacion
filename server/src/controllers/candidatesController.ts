import { Response } from 'express';
import pool from '../config/database';
import { generateUUID } from '../utils/uuid';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getCandidates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pollId } = req.params;

  const [candidates] = await pool.execute(
    'SELECT * FROM candidates WHERE poll_id = ? ORDER BY created_at ASC',
    [pollId]
  ) as any[];

  res.json(candidates);
});

export const createCandidate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pollId } = req.params;
  const userId = req.user?.userId;
  const { name, party, photo_url, age, description } = req.body;

  if (!name || !party) {
    return res.status(400).json({ error: 'Nombre y partido son requeridos' });
  }

  // Verificar que el usuario tiene permiso (es el creador de la encuesta o admin)
  const [polls] = await pool.execute(
    'SELECT created_by FROM polls WHERE id = ?',
    [pollId]
  ) as any[];

  if (!Array.isArray(polls) || polls.length === 0) {
    return res.status(404).json({ error: 'Encuesta no encontrada' });
  }

  const poll = polls[0];
  const role = req.user?.role;

  if (role !== 'admin' && poll.created_by !== userId) {
    return res.status(403).json({ error: 'No tienes permiso para agregar candidatos a esta encuesta' });
  }

  const candidateId = generateUUID();

  await pool.execute(
    `INSERT INTO candidates (id, poll_id, name, party, photo_url, age, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [candidateId, pollId, name, party, photo_url || null, age || null, description || null]
  );

  const [candidates] = await pool.execute(
    'SELECT * FROM candidates WHERE id = ?',
    [candidateId]
  ) as any[];

  res.status(201).json(candidates[0]);
});

export const deleteCandidate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const role = req.user?.role;

  // Verificar permisos
  const [candidates] = await pool.execute(
    `SELECT c.*, p.created_by 
     FROM candidates c
     JOIN polls p ON c.poll_id = p.id
     WHERE c.id = ?`,
    [id]
  ) as any[];

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(404).json({ error: 'Candidato no encontrado' });
  }

  const candidate = candidates[0];

  if (role !== 'admin' && candidate.created_by !== userId) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar este candidato' });
  }

  await pool.execute('DELETE FROM candidates WHERE id = ?', [id]);

  res.json({ message: 'Candidato eliminado exitosamente' });
});

