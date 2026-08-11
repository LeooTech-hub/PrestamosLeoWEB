import pool from './src/config/db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

function generateUUID() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

async function createAdminUser() {
  console.log('⏳ Conectando a TiDB Cloud para inicializar usuario administrador...');

  try {
    // 1. Asegurar que la tabla 'users' existe
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
    console.log('✅ Tabla "users" verificada/creada exitosamente en TiDB Cloud.');

    const adminEmail = 'admin@prestamosleo.com';
    const rawPassword = 'password123';
    const adminName = 'Leo Admin';

    // 2. Verificar si el usuario admin ya existe
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [adminEmail.toLowerCase()]);

    // Hashear la contraseña obligatoriamente con bcrypt
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    if (rows.length === 0) {
      // Inserción de nuevo usuario administrador
      const userId = generateUUID();
      await pool.query(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [userId, adminName, adminEmail, passwordHash, 'ADMIN']
      );
      console.log('🎉 Usuario Administrador creado exitosamente:');
      console.log(`   - Nombre: ${adminName}`);
      console.log(`   - Email: ${adminEmail}`);
      console.log(`   - Password: ${rawPassword}`);
    } else {
      // Actualizar el hash de contraseña y nombre si ya existe para asegurar acceso con password123
      const existingUser = rows[0];
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2 WHERE id = $3',
        [passwordHash, 'ADMIN', rows[0].id]
      );
      console.log('🔄 Usuario Administrador existente actualizado con las nuevas credenciales:');
      console.log(`   - Nombre: ${adminName}`);
      console.log(`   - Email: ${adminEmail}`);
      console.log(`   - Password: ${rawPassword}`);
    }
  } catch (error) {
    console.error('❌ Error al ejecutar el script de inicialización del Administrador:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔒 Conexión a la base de datos cerrada.');
  }
}

createAdminUser();
