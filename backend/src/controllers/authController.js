import { pool } from '../database/db.js';
import { generateToken } from '../utils/jwt.js';

export const signUp = async (req, res) => {
  try {
    const { dni, password, full_name, phone, age, role } = req.body;

    // Validaciones básicas
    if (!dni || !password || !full_name) {
      return res.status(400).json({ error: 'DNI, contraseña y nombre completo son requeridos' });
    }

    // Verificar si el DNI ya existe
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE dni = ?',
      [dni]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Este DNI ya está registrado' });
    }

    // Determinar status inicial
    const status = role === 'supervisor' ? 'pending' : 'active';
    const userRole = role || 'voter';

    // Crear usuario - NO enviar ID, MySQL lo genera automáticamente
    // Contraseña en texto plano
    const [result] = await pool.query(
      `INSERT INTO users (dni, password, full_name, phone, age, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dni,
        password,
        full_name,
        phone || null,
        age || null,
        userRole,
        status
      ]
    );

    const userId = result.insertId;

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: userId,
        dni,
        full_name,
        role: userRole,
        status
      }
    });
  } catch (error) {
    console.error('Error en signUp:', error);
    res.status(500).json({ error: 'Error al registrar usuario', details: error.message });
  }
};

export const signIn = async (req, res) => {
  try {
    const { dni, password } = req.body;

    if (!dni || !password) {
      return res.status(400).json({ error: 'DNI y contraseña son requeridos' });
    }

    // Buscar usuario
    const [users] = await pool.query(
      'SELECT * FROM users WHERE dni = ?',
      [dni]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'DNI o contraseña incorrectos' });
    }

    const user = users[0];

    // Verificar contraseña - comparación directa en texto plano
    if (user.password !== password) {
      return res.status(401).json({ error: 'DNI o contraseña incorrectos' });
    }

    // Verificar status
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Tu cuenta ha sido suspendida' });
    }

    // Generar token
    const token = generateToken(user.id);

    // Devolver datos del usuario (sin password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error en signIn:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      'SELECT id, dni, full_name, phone, age, role, status, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};
