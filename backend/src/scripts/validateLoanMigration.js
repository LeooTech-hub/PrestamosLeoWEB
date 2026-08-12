import { readFile } from 'node:fs/promises';
import pool from '../config/db.js';

async function validate() {
  const migrationUrl = new URL('../../migrations/20260812_repair_loan_compatibility.sql', import.meta.url);
  const sql = (await readFile(migrationUrl, 'utf8')).replace(/COMMIT;\s*$/i, 'ROLLBACK;');
  await pool.query(sql);
  console.log('Migración validada dentro de una transacción revertida; no se modificaron datos.');
}

validate()
  .catch((error) => {
    console.error('Migración inválida:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
