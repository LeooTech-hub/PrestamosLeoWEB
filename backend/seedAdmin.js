import pool from './src/config/db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

function generateUUID() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

async function seedAdmin() {
  console.log('🚀 Iniciando script de seeding para usuario administrador en TiDB Cloud...');

  try {
    // 1. Verificar y crear tabla 'users' si no existe
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255) NULL,
        reset_token_expires DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createUsersTableQuery);
    console.log('✅ Tabla "users" verificada / estructurada correctamente.');

    const adminEmail = 'admin@prestamosleo.com';
    const rawPassword = 'admin123';
    const adminName = 'Admin';

    // 2. Generar hash de la contraseña 'admin123' con 10 salts
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 3. Verificar si el usuario admin ya existe
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [adminEmail.toLowerCase()]);

    if (existingUsers.length === 0) {
      const userId = generateUUID();
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
        [userId, adminName, adminEmail, passwordHash, createdAt]
      );
      console.log('🎉 Usuario Administrador registrado exitosamente:');
      console.log(`   • Name: ${adminName}`);
      console.log(`   • Email: ${adminEmail}`);
      console.log(`   • Password: ${rawPassword}`);
    } else {
      const user = existingUsers[0];
      await pool.query(
        `UPDATE users SET name = ?, password_hash = ? WHERE id = ?`,
        [adminName, passwordHash, user.id]
      );
      console.log('🔄 Usuario Administrador actualizado exitosamente con la clave admin123:');
      console.log(`   • Name: ${adminName}`);
      console.log(`   • Email: ${adminEmail}`);
      console.log(`   • Password: ${rawPassword}`);
    }
  } catch (error) {
    console.error('❌ Error durante la ejecución del seeder admin:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔒 Conexión con TiDB Cloud finalizada limpiamente.');
  }
}

seedAdmin();
