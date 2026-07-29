import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carga .env si existe en desarrollo local; si está en Render, usará process.env directamente
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'test',
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDbSchema() {
  // Tu lógica de inicialización de tablas aquí...
}

export default pool;