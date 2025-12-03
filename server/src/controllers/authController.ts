import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { generateToken } from '../config/jwt';
import { generateUUID } from '../utils/uuid';
import { asyncHandler } from '../middleware/errorHandler';

interface SignUpRequest extends Request {
  body: {
    dni: string;
    password: string;
    email: string;
    full_name: string;
    phone: string;
    age: number;
    role: 'supervisor' | 'voter';
  };
}

interface SignInRequest extends Request {
  body: {
    dni: string;
    password: string;
  };
}

export const signUp = asyncHandler(async (req: SignUpRequest, res: Response) => {
  const { dni, password, email, full_name, phone, age, role } = req.body;

  // Verificar si el DNI ya existe
  const [existingUser] = await pool.execute(
    'SELECT id FROM users WHERE dni = ? OR email = ?',
    [dni, email]
  );

  if (Array.isArray(existingUser) && existingUser.length > 0) {
    return res.status(400).json({ error: 'El DNI o email ya está registrado' });
  }

  // Hashear contraseña
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = generateUUID();

  // Determinar status inicial
  const status = role === 'supervisor' ? 'pending' : 'active';

  // Crear usuario
  await pool.execute(
    `INSERT INTO users (id, dni, email, password_hash, full_name, phone, age, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, dni, email, passwordHash, full_name, phone || null, age || null, role, status]
  );

  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user: {
      id: userId,
      dni,
      email,
      full_name,
      role,
      status
    }
  });
});

export const signIn = asyncHandler(async (req: SignInRequest, res: Response) => {
  const { dni, password } = req.body;

  // Buscar usuario por DNI
  const [users] = await pool.execute(
    'SELECT * FROM users WHERE dni = ?',
    [dni]
  ) as any[];

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(401).json({ error: 'DNI o contraseña incorrectos' });
  }

  const user = users[0];

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    return res.status(401).json({ error: 'DNI o contraseña incorrectos' });
  }

  // Verificar si el usuario está activo
  if (user.status !== 'active') {
    return res.status(403).json({
      error: 'Tu cuenta está pendiente de aprobación o ha sido suspendida'
    });
  }

  // Generar token JWT
  const token = generateToken({
    userId: user.id,
    role: user.role,
    email: user.email
  });

  res.json({
    token,
    user: {
      id: user.id,
      dni: user.dni,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      age: user.age,
      role: user.role,
      status: user.status
    }
  });
});

export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;

  const [users] = await pool.execute(
    'SELECT id, dni, email, full_name, phone, age, role, status, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  ) as any[];

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json(users[0]);
});

export const signOut = asyncHandler(async (req: Request, res: Response) => {
  // Con JWT, simplemente respondemos exitosamente
  // El cliente debe eliminar el token del localStorage
  res.json({ message: 'Sesión cerrada exitosamente' });
});

