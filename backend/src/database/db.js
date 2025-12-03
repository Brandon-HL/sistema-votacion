import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Crear el pool de conexión
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Si tienes contraseña, el .env la pondrá
  database: process.env.DB_NAME || 'sistema_votacion',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('✅ Conexión a Base de Datos configurada en src/database/db.js');