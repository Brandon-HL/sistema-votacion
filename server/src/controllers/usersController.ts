import { Response } from 'express';
import pool from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = req.user?.userId;

  const [users] = await pool.execute(
    `SELECT id, dni, email, full_name, phone, age, role, status, created_at, updated_at
     FROM users
     WHERE id != ?
     ORDER BY created_at DESC`,
    [currentUserId]
  ) as any[];

  res.json(users);
});

export const getPendingUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [users] = await pool.execute(
    `SELECT id, dni, email, full_name, phone, age, role, status, created_at, updated_at
     FROM users
     WHERE status = 'pending' AND role = 'supervisor'
     ORDER BY created_at DESC`
  ) as any[];

  res.json(users);
});

export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  await pool.execute(
    'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, userId]
  );

  const [users] = await pool.execute(
    `SELECT id, dni, email, full_name, phone, age, role, status, created_at, updated_at
     FROM users
     WHERE id = ?`,
    [userId]
  ) as any[];

  res.json(users[0]);
});

