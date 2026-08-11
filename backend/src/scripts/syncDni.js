import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import pool from '../config/db.js';
import { initDb } from '../config/initDb.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

async function syncDni() {
  console.log('=======================================================');
  console.log('🔄 INICIANDO SINCRONIZACIÓN DE DNI: TiDB Cloud -> Supabase');
  console.log('=======================================================');

  // Asegurar que la estructura de la base de datos y la columna 'dni' existan
  await initDb();

  const tidbHost = process.env.TIDB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com';
  const tidbPort = Number(process.env.TIDB_PORT) || 4000;
  const tidbUser = process.env.TIDB_USER || '4NZ4uKvMLnLgnoC.root';
  const tidbPassword = process.env.TIDB_PASSWORD || 'sCpSZnmab2Mdthw7';
  const tidbDatabase = process.env.TIDB_DATABASE || 'test';

  let tidbConn;
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

  try {
    // 1. LECTURA DESDE TIDB CLOUD
    const [rows] = await tidbConn.query(
      "SELECT id, identification FROM test.clients WHERE identification IS NOT NULL AND identification != ''"
    );
    console.log(`📌 Se encontraron ${rows.length} clientes con DNI/identificación en TiDB Cloud.`);

    let successCount = 0;

    // 2. ACTUALIZACIÓN EN SUPABASE
    for (const client of rows) {
      const { id, identification } = client;
      if (!id || !identification) continue;

      try {
        await pool.query(
          "UPDATE clients SET dni = $1 WHERE id = $2",
          [String(identification).trim(), String(id)]
        );
        successCount++;
      } catch (updateErr) {
        console.error(`⚠️ Error actualizando DNI para cliente ${id}:`, updateErr.message);
      }
    }

    // 3. LOG DE CONFIRMACIÓN
    console.log('=======================================================');
    console.log(`✅ Sincronización completada: ${successCount} DNI/identificaciones sincronizadas con éxito.`);
    console.log('=======================================================');
  } catch (err) {
    console.error('❌ Error durante la sincronización:', err.message);
  } finally {
    if (tidbConn) await tidbConn.end();
  }
}

syncDni()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error fatal en syncDni:', err);
    process.exit(1);
  });
