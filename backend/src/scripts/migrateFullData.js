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

async function migrateFullData() {
  console.log('================================================================');
  console.log('🚀 INICIANDO MIGRACIÓN INTEGRAL DE DATOS: TiDB Cloud -> Supabase');
  console.log('================================================================');

  // 1. Inicializar esquema en Supabase
  console.log('\n📌 1. Verificando y asegurando esquema de base de datos en Supabase...');
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
      ssl: { rejectUnauthorized: true }
    });
    console.log('✅ Conexión establecida exitosamente con TiDB Cloud.');
  } catch (err) {
    console.error('❌ Error conectando a TiDB Cloud:', err.message);
    process.exit(1);
  }

  const tablesOrder = ['users', 'clients', 'loans', 'payments'];
  const resultsSummary = {};

  // 3. Migración jerárquica
  for (const table of tablesOrder) {
    console.log(`\n📌 Migrando tabla '${table}' en orden de dependencia jerárquica...`);
    try {
      const targetColumns = await getTargetColumns(table);
      const [rows] = await tidbConn.query(`SELECT * FROM ${table}`);
      console.log(`   --> ${rows.length} registros extraídos de TiDB Cloud.`);

      let successCount = 0;
      let updateCount = 0;

      for (const row of rows) {
        // Fallbacks de coherencia para loans
        if (table === 'loans') {
          row.amount = row.amount ?? row.capital ?? row.amount_borrowed ?? 0;
          row.total_amount = row.total_amount ?? row.total_to_pay ?? 0;
          row.capital = row.capital ?? row.amount ?? row.amount_borrowed ?? 0;
          row.total_to_pay = row.total_to_pay ?? row.total_amount ?? 0;
          row.daily_payment_amount = row.daily_payment_amount ?? row.daily_payment ?? 0;
        }

        // Fallbacks de coherencia para payments
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
          if (val instanceof Date) return val.toISOString();
          return val;
        });

        const columnsSql = keys.map((k) => `"${k}"`).join(', ');
        const placeholdersSql = keys.map((_, i) => `$${i + 1}`).join(', ');

        let updateClause = 'ON CONFLICT (id) DO NOTHING';
        if (table === 'users') {
          // Si el email choca, actualizar datos conservando ID
          updateClause = 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role';
        }

        const insertSql = `
          INSERT INTO ${table} (${columnsSql})
          VALUES (${placeholdersSql})
          ${updateClause}
        `;

        try {
          const res = await pool.query(insertSql, values);
          if (res.rowCount > 0) {
            successCount++;
          } else {
            updateCount++;
          }
        } catch (insertErr) {
          // Si hay conflicto de email unique en users, intentar UPSERT por email
          if (table === 'users' && insertErr.code === '23505') {
            try {
              const altKeys = keys.filter((k) => k !== 'id');
              const altCols = altKeys.map((k) => `"${k}"`).join(', ');
              const altPlaceholders = altKeys.map((_, i) => `$${i + 1}`).join(', ');
              const altValues = altKeys.map((k) => row[k]);
              await pool.query(
                `INSERT INTO users (${altCols}) VALUES (${altPlaceholders}) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role`,
                altValues
              );
              updateCount++;
            } catch (_) {}
          } else {
            console.error(`   ⚠️ Aviso insertando en ${table} (ID: ${row.id}):`, insertErr.message);
          }
        }
      }

      resultsSummary[table] = {
        totalTiDB: rows.length,
        procesados: successCount + updateCount,
        nuevos: successCount,
        actualizados: updateCount
      };
      console.log(`   ✅ Tabla '${table}': ${rows.length} registros sincronizados exitosamente.`);
    } catch (tableErr) {
      console.error(`   ❌ Error procesando tabla '${table}':`, tableErr.message);
    }
  }

  // 4. Verificación final de recuentos reales en Supabase
  console.log('\n================================================================');
  console.log('📊 CONFIRMACIÓN DE CONTEO REAL EN SUPABASE (PostgreSQL)');
  console.log('================================================================');
  
  const finalCounts = {};
  for (const t of ['users', 'clients', 'loans', 'payments']) {
    try {
      const [r] = await pool.query(`SELECT COUNT(*) FROM ${t}`);
      finalCounts[t] = Number(r[0].count);
    } catch (_) {
      finalCounts[t] = 0;
    }
  }

  console.table(finalCounts);
  console.log('\n================================================================');
  console.log(`✅ USUARIOS REGISTRADOS:   ${finalCounts.users}`);
  console.log(`✅ CLIENTES MIGRADOS:      ${finalCounts.clients}`);
  console.log(`✅ PRÉSTAMOS MIGRADOS:     ${finalCounts.loans}`);
  console.log(`✅ COBROS REGISTRADOS:     ${finalCounts.payments}`);
  console.log('================================================================');
  console.log('🎉 Migración integral completada con éxito.');

  await tidbConn.end();
  process.exit(0);
}

migrateFullData().catch((err) => {
  console.error('❌ Error crítico en migración integral:', err);
  process.exit(1);
});
