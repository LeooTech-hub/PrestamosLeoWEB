import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const _pgQuery = pool.query.bind(pool);

/**
 * Helper/adaptador que reemplaza placeholders estilo MySQL (?) por
 * el formato posicional de PostgreSQL ($1, $2, $3...) antes de ejecutar.
 * Devuelve [rows, fields] para mantener compatibilidad con la API de mysql2.
 *
 * @param {string|Object} sql - Sentencia SQL (con ? como placeholders)
 * @param {Array} params      - Parámetros opcionales
 * @returns {Promise<[Array, Array]>}
 */
export async function query(sql, params = []) {
  let counter = 0;
  const pgSql = typeof sql === 'string'
    ? sql.replace(/\?/g, () => `$${++counter}`)
    : sql;

  const actualParams = Array.isArray(params) && params.length > 0 ? params : undefined;
  const result = await _pgQuery(pgSql, actualParams);
  return [result.rows, result.fields ?? []];
}

export const execute = query;
pool.execute = query;
pool.query = query;

export default pool;