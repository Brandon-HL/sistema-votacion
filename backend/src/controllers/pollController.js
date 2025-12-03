import { pool } from '../database/db.js';

// 1. OBTENER ENCUESTAS (Con filtros de Rol)
export const getAllPolls = async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = '';
    let params = [];

    // Lógica simplificada de filtrado
    if (role === 'admin') {
      // Admin ve todo
      query = 'SELECT * FROM polls ORDER BY id DESC';
    } else if (role === 'supervisor') {
      // Supervisor ve SOLO lo que creó
      query = 'SELECT * FROM polls WHERE created_by = ? ORDER BY id DESC';
      params = [id];
    } else {
      // Votante ve encuestas activas
      query = 'SELECT * FROM polls WHERE is_active = TRUE ORDER BY id DESC';
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error en getAllPolls:', error);
    res.status(500).json({ message: 'Error al obtener encuestas' });
  }
};

export const getPollById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM polls WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Votación no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error en getPollById:', error);
    res.status(500).json({ message: 'Error al obtener votación' });
  }
};

// 2. CREAR ENCUESTA
export const createPoll = async (req, res) => {
  try {
    const { title, description, closingDate, minAge } = req.body;
    const createdBy = req.user.id;

    // Insertamos la votación
    const [result] = await pool.query(
      'INSERT INTO polls (title, description, created_by, end_date, min_age, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
      [title, description, createdBy, closingDate, minAge]
    );

    res.json({ id: result.insertId, message: 'Votación creada correctamente' });
  } catch (error) {
    console.error('Error en createPoll:', error);
    res.status(500).json({ message: 'Error al crear votación' });
  }
};

export const updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, closingDate, minAge, isActive } = req.body;

    // Simple update for now
    await pool.query(
      'UPDATE polls SET title = ?, description = ?, end_date = ?, min_age = ?, is_active = ? WHERE id = ?',
      [title, description, closingDate, minAge, isActive, id]
    );

    const [rows] = await pool.query('SELECT * FROM polls WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error en updatePoll:', error);
    res.status(500).json({ message: 'Error al actualizar votación' });
  }
};

// 3. ELIMINAR ENCUESTA
export const deletePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = 'DELETE FROM polls WHERE id = ?';
    let params = [id];

    // Seguridad: Si es supervisor, solo puede borrar SUS encuestas
    if (userRole !== 'admin') {
      query += ' AND created_by = ?';
      params.push(userId);
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Votación no encontrada o no tienes permiso' });
    }

    res.json({ message: 'Votación eliminada correctamente' });
  } catch (error) {
    console.error('Error deletePoll:', error);
    res.status(500).json({ message: 'Error al eliminar votación' });
  }
};