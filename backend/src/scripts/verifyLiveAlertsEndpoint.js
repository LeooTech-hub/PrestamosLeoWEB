import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

async function verify() {
  const { rows } = await pool.query(`
    SELECT id, email, name, role
    FROM users
    ORDER BY CASE WHEN UPPER(role) = 'ADMIN' THEN 0 ELSE 1 END, created_at
    LIMIT 1
  `);
  if (!rows[0]) throw new Error('No existe un usuario para verificar el endpoint');

  const user = rows[0];
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET || 'prestamos_leo_jwt_secret_key_2026_super_secure',
    { expiresIn: '2m' }
  );
  const response = await fetch('http://localhost:5000/api/alerts', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  if (!Array.isArray(body)) throw new Error('La respuesta no es un arreglo');

  const invalid = body.filter((alert) =>
    !['DUE_TOMORROW', 'DUE_TODAY', 'OVERDUE'].includes(alert.type)
    || typeof alert.daysRemaining !== 'number'
    || typeof alert.remainingAmount !== 'number'
    || !Object.hasOwn(alert, 'dueDate')
  );
  if (invalid.length) throw new Error(`Respuesta incompleta: ${JSON.stringify(invalid)}`);

  console.log(JSON.stringify({
    url: 'http://localhost:5000/api/alerts',
    status: response.status,
    count: body.length,
    alerts: body,
  }, null, 2));
}

verify()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
