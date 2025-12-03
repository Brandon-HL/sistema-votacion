import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    console.log('🔄 Iniciando migración de base de datos...');
    
    // Leer el archivo SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir el SQL en statements individuales
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    // Ejecutar cada statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (error) {
          // Ignorar errores de "table already exists" o similares
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate')) {
            console.warn('⚠️  Advertencia:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

migrate();

