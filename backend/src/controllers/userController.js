import { pool } from '../database/db.js';

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver todos los usuarios' });
    }

    const [users] = await pool.query(
      `SELECT id, dni, full_name, phone, age, role, status, created_at, updated_at 
       FROM users 
       WHERE id != ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(users);
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const getPendingUsers = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Usuario no autenticado o token inválido' });
    }

    const { role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver usuarios pendientes' });
    }

    const [users] = await pool.query(
      `SELECT id, dni, full_name, phone, age, role, status, created_at 
       FROM users 
       WHERE status = 'pending' AND role = 'supervisor'
       ORDER BY created_at DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Error en getPendingUsers:', error);
    res.status(500).json({ error: 'Error al obtener usuarios pendientes', details: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden actualizar usuarios' });
    }

    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // No permitir cambiar el status del propio admin
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio status' });
    }

    await pool.query(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, userId]
    );

    const [updatedUser] = await pool.query(
      'SELECT id, dni, full_name, role, status FROM users WHERE id = ?',
      [userId]
    );

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error en updateUserStatus:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

