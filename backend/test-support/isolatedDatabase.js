// npm test never connects to the configured application database.
// Keep PostgreSQL DATE parsing identical to src/config/db.js.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { after } from 'node:test';
import pool from '../src/config/db.js';

const db = new PGlite({ parsers: { 1082: value => value, 20: value => value } });
const source = readFileSync(new URL('../src/config/initDb.js', import.meta.url), 'utf8');
for (const match of source.matchAll(/CREATE TABLE IF NOT EXISTS [\s\S]*?\n      \)/g)) await db.exec(match[0]);
for (const match of source.matchAll(/await safeAddColumn\('([^']+)', '([^']+)', (?:'([^']*)'|"([^"]*)")\)/g)) {
  await db.exec(`ALTER TABLE ${match[1]} ADD COLUMN IF NOT EXISTS ${match[2]} ${match[3] ?? match[4]}`);
}
await db.exec(readFileSync(new URL('../migrations/20261008_add_money_methods.sql', import.meta.url), 'utf8'));
await db.exec(`ALTER TABLE loans ADD COLUMN operation_number TEXT DEFAULT 'OP-000001';
  INSERT INTO users (id, name, email, password_hash, role) VALUES ('test-admin', 'Admin', 'test@example.test', 'test', 'ADMIN');
  INSERT INTO clients (id, name) VALUES ('test-client', 'Cliente de prueba');
  INSERT INTO loans (id,client_id,client_name,capital,interest_amount,total_to_pay,daily_payment_amount,remaining_amount,start_date,due_date)
  VALUES ('test-loan','test-client','Cliente de prueba',100,20,120,6,120,CURRENT_DATE,CURRENT_DATE + 20);`);

pool.query = (sql, params) => db.query(sql, params);
pool.connect = async () => ({ query: pool.query, release() {} });
after(async () => { await db.close(); await pool.end(); });
