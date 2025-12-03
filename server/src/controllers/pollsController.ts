import { Response } from 'express';
import pool from '../config/database';
import { generateUUID } from '../utils/uuid';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getPolls = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  let query = '';
  let params: any[] = [];

  if (role === 'admin') {
    // Admins ven todas las encuestas
    query = `
      SELECT p.*, u.full_name as creator_name
      FROM polls p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `;
  } else if (role === 'supervisor') {
    // Supervisores ven solo sus encuestas
    query = `
      SELECT p.*, u.full_name as creator_name
      FROM polls p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.created_by = ?
      ORDER BY p.created_at DESC
    `;
    params = [userId];
  } else {
    // Votantes ven solo encuestas activas y vigentes
    const [users] = await pool.execute(
      'SELECT age FROM users WHERE id = ?',
      [userId]
    ) as any[];

    const userAge = users[0]?.age || null;

    query = `
      SELECT p.*
      FROM polls p
      WHERE p.is_active = TRUE
      AND p.end_date > NOW()
      ${userAge ? 'AND (p.min_age IS NULL OR p.min_age <= ?)' : ''}
      ORDER BY p.created_at DESC
    `;
    if (userAge) params = [userAge];
  }

  const [polls] = await pool.execute(query, params) as any[];
  res.json(polls);
});

export const getPollById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const role = req.user?.role;

  const [polls] = await pool.execute(
    'SELECT * FROM polls WHERE id = ?',
    [id]
  ) as any[];

  if (!Array.isArray(polls) || polls.length === 0) {
    return res.status(404).json({ error: 'Encuesta no encontrada' });
  }

  const poll = polls[0];

  // Verificar permisos
  if (role === 'voter' && (!poll.is_active || new Date(poll.end_date) < new Date())) {
    return res.status(403).json({ error: 'Esta encuesta no está disponible' });
  }

  res.json(poll);
});

export const createPoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { title, description, end_date, min_age } = req.body;

  if (!title || !end_date) {
    return res.status(400).json({ error: 'Título y fecha de cierre son requeridos' });
  }

  const pollId = generateUUID();

  await pool.execute(
    `INSERT INTO polls (id, title, description, created_by, end_date, min_age, is_active)
     VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
    [pollId, title, description || null, userId, end_date, min_age || 18]
  );

  const [polls] = await pool.execute(
    'SELECT * FROM polls WHERE id = ?',
    [pollId]
  ) as any[];

  res.status(201).json(polls[0]);
});

export const updatePoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const role = req.user?.role;
  const { is_active } = req.body;

  // Verificar que el usuario tiene permiso
  const [polls] = await pool.execute(
    'SELECT * FROM polls WHERE id = ?',
    [id]
  ) as any[];

  if (!Array.isArray(polls) || polls.length === 0) {
    return res.status(404).json({ error: 'Encuesta no encontrada' });
  }

  const poll = polls[0];

  if (role !== 'admin' && poll.created_by !== userId) {
    return res.status(403).json({ error: 'No tienes permiso para modificar esta encuesta' });
  }

  // Actualizar solo is_active si se proporciona
  if (is_active !== undefined) {
    await pool.execute(
      'UPDATE polls SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, id]
    );
  }

  const [updatedPolls] = await pool.execute(
    'SELECT * FROM polls WHERE id = ?',
    [id]
  ) as any[];

  res.json(updatedPolls[0]);
});

