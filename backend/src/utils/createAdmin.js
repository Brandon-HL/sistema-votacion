import pool from '../config/database.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('🔧 Crear usuario administrador\n');

    const dni = await question('DNI del administrador (ej: 00000000): ');
    const fullName = await question('Nombre completo: ');
    const password = await question('Contraseña: ');

    if (!dni || !fullName || !password) {
      console.error('❌ Todos los campos son requeridos');
      process.exit(1);
    }

    // Verificar si el DNI ya existe
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE dni = ?',
      [dni]
    );

    if (existingUsers.length > 0) {
      console.error(`❌ Ya existe un usuario con DNI: ${dni}`);
      process.exit(1);
    }

    // Crear usuario admin - NO enviar ID, MySQL lo genera automáticamente
    // Contraseña en texto plano
    const [result] = await pool.query(
      `INSERT INTO users (dni, full_name, role, status, password)
       VALUES (?, ?, 'admin', 'active', ?)`,
      [dni, fullName, password]
    );

    const userId = result.insertId;

    console.log('\n✅ Usuario administrador creado exitosamente!');
    console.log(`   DNI: ${dni}`);
    console.log(`   Nombre: ${fullName}`);
    console.log(`   ID: ${userId}\n`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear administrador:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();

