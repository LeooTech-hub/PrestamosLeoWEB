import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pkg;

// PostgreSQL DATE no representa una hora ni una zona horaria. Mantenerlo como
// YYYY-MM-DD evita desplazamientos UTC/local y conserva la fecha civil exacta.
types.setTypeParser(1082, (value) => value);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false
});

export default pool;
