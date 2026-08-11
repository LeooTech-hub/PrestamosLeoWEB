import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import pool from '../config/db.js';
import { initDb } from '../config/initDb.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

async function getTargetColumns(tableName) {
  try {
    const [rows] = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [tableName]
    );
    return new Set(rows.map((r) => r.column_name));
  } catch (err) {
    console.warn(`   ⚠️ No se pudieron obtener columnas para ${tableName}:`, err.message);
    return null;
  }
}

async function migrateData() {
  console.log('=======================================================');
  console.log('🚀 INICIANDO MIGRACIÓN DE DATOS: TiDB Cloud -> Supabase');
  console.log('=======================================================');

  // 1. Inicializar y asegurar todas las tablas y columnas en Supabase
  console.log('\n📌 1. Verificando/Creando tablas y columnas en Supabase...');
  await initDb();

  // 2. Conectar a TiDB Cloud
  console.log('\n📌 2. Conectando a TiDB Cloud...');
  let tidbConn;

  const tidbHost = process.env.TIDB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com';
  const tidbPort = Number(process.env.TIDB_PORT) || 4000;
  const tidbUser = process.env.TIDB_USER || '4NZ4uKvMLnLgnoC.root';
  const tidbPassword = process.env.TIDB_PASSWORD || 'sCpSZnmab2Mdthw7';
  const tidbDatabase = process.env.TIDB_DATABASE || 'test';

  try {
    tidbConn = await mysql.createConnection({
      host: tidbHost,
      port: tidbPort,
      user: tidbUser,
      password: tidbPassword,
      database: tidbDatabase,
      ssl: {
        rejectUnauthorized: true
      }
    });
    console.log('✅ Conexión exitosa a TiDB Cloud.');
  } catch (err) {
    console.error('❌ Error conectando a TiDB Cloud:', err.message);
    process.exit(1);
  }

  // 3. Lista de tablas a migrar en orden de dependencia
  const tables = ['users', 'clients', 'loans', 'payments', 'expenses', 'activity_logs'];
  const summary = {};

  for (const table of tables) {
    console.log(`\n📦 Migrando tabla '${table}'...`);
    try {
      const targetColumns = await getTargetColumns(table);
      const [rows] = await tidbConn.query(`SELECT * FROM ${table}`);
      console.log(`   Hallados ${rows.length} registros en TiDB Cloud.`);

      let insertedCount = 0;
      let skippedCount = 0;

      for (const row of rows) {
        // Mapear campos complementarios para mantener compatibilidad
        if (table === 'loans') {
          row.amount = row.amount ?? row.capital ?? row.amount_borrowed ?? 0;
          row.total_amount = row.total_amount ?? row.total_to_pay ?? 0;
          row.capital = row.capital ?? row.amount ?? row.amount_borrowed ?? 0;
          row.total_to_pay = row.total_to_pay ?? row.total_amount ?? 0;
          row.daily_payment_amount = row.daily_payment_amount ?? row.daily_payment ?? 0;
        }

        if (table === 'payments') {
          row.date = row.date ?? row.payment_date ?? row.created_at;
          row.payment_date = row.payment_date ?? row.date ?? row.created_at;
        }

        let keys = Object.keys(row);
        if (targetColumns && targetColumns.size > 0) {
          keys = keys.filter((k) => targetColumns.has(k));
        }

        if (keys.length === 0) continue;

        const values = keys.map((k) => {
          const val = row[k];
          if (val instanceof Date) {
            return val.toISOString();
          }
          return val;
        });

        const columnsSql = keys.map((k) => `"${k}"`).join(', ');
        const placeholdersSql = keys.map((_, i) => `$${i + 1}`).join(', ');

        const conflictClause = 'ON CONFLICT (id) DO NOTHING';

        const insertQuery = `
          INSERT INTO ${table} (${columnsSql})
          VALUES (${placeholdersSql})
          ${conflictClause}
        `;

        try {
          const result = await pool.query(insertQuery, values);
          if (result.rowCount > 0) {
            insertedCount++;
          } else {
            skippedCount++;
          }
        } catch (insertErr) {
          console.error(`   ⚠️ Error insertando registro en ${table} (ID: ${row.id}):`, insertErr.message);
        }
      }

      summary[table] = { total: rows.length, inserted: insertedCount, skipped: skippedCount };
      console.log(`   ✅ Tabla '${table}': ${insertedCount} insertados, ${skippedCount} omitidos/ya existentes.`);
    } catch (tableErr) {
      console.error(`   ⚠️ Tabla '${table}' no encontrada en TiDB o error al consultar:`, tableErr.message);
      summary[table] = { total: 0, inserted: 0, skipped: 0, note: tableErr.message };
    }
  }

  // 4. Cerrar conexiones y mostrar resumen
  await tidbConn.end();
  console.log('\n=======================================================');
  console.log('📊 RESUMEN FINAL DE LA MIGRACIÓN');
  console.log('=======================================================');
  console.table(summary);
  console.log('\n🎉 Migración completada con éxito.');

  process.exit(0);
}

migrateData().catch((err) => {
  console.error('❌ Error fatal durante la migración:', err);
  process.exit(1);
});
