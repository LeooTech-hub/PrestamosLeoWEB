import pool from './db.js';
import bcrypt from 'bcryptjs';

function generateUUID() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export async function initDb() {
  try {
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

    // Check if any user exists
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count === 0) {
      const defaultPassword = 'admin123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const userId = generateUUID();
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
        [userId, 'Administrador Leo', 'admin@prestamosleo.com', passwordHash, createdAt]
      );
      console.log('✅ Usuario por defecto creado: admin@prestamosleo.com / admin123');
    }

    console.log('✅ Tabla "users" inicializada correctamente en TiDB Cloud.');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos (users table):', error.message);
  }
}
