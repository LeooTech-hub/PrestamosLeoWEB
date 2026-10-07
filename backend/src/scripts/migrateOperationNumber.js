import pool from '../config/db.js';

export async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('[MIGRATION] Iniciando migración de operation_number...');
    await client.query('BEGIN');

    // 1. Crear secuencia para números correlativos si no existe
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS loan_operation_number_seq START WITH 1 INCREMENT BY 1;
    `);
    console.log('[MIGRATION] Secuencia loan_operation_number_seq asegurada.');

    // 2. Agregar columna operation_number si no existe (inicialmente sin NOT NULL para permitir backfill)
    await client.query(`
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS operation_number VARCHAR(32);
    `);
    console.log('[MIGRATION] Columna operation_number asegurada en loans.');

    // 3. Determinar el número máximo existente (base para backfill seguro sin colisiones)
    const maxExistingRes = await client.query(`
      SELECT COALESCE(MAX(SUBSTRING(operation_number FROM 4)::integer), 0) AS max_num
      FROM loans
      WHERE operation_number ~ '^OP-[0-9]+$'
    `);
    const baseMax = parseInt(maxExistingRes.rows[0].max_num, 10);
    console.log(`[MIGRATION] Máximo número pre-existente detectado: OP-${String(baseMax).padStart(6, '0')}`);

    // 4. Backfill ordenado cronológicamente para préstamos con operation_number NULL
    const unpopulatedRes = await client.query(`
      SELECT COUNT(*) as count FROM loans WHERE operation_number IS NULL
    `);
    const unpopulatedCount = parseInt(unpopulatedRes.rows[0].count, 10);
    console.log(`[MIGRATION] Préstamos pendientes de número de operación: ${unpopulatedCount}`);

    if (unpopulatedCount > 0) {
      // Ordenamiento por created_at si existe, o start_date como fallback, con id como desempate determinístico
      await client.query(`
        WITH unassigned AS (
          SELECT
            id,
            ROW_NUMBER() OVER (
              ORDER BY COALESCE(created_at, start_date::timestamp with time zone) ASC, id ASC
            ) AS rn
          FROM loans
          WHERE operation_number IS NULL
        )
        UPDATE loans l
        SET operation_number = 'OP-' || LPAD(($1 + unassigned.rn)::text, 6, '0')
        FROM unassigned
        WHERE l.id = unassigned.id;
      `, [baseMax]);
      console.log(`[MIGRATION] Backfill completado exitosamente para ${unpopulatedCount} préstamos a partir de OP-${String(baseMax + 1).padStart(6, '0')}.`);
    }

    // 5. Verificación obligatoria 1: SELECT COUNT(*) FROM loans WHERE operation_number IS NULL debe ser 0
    const nullCheckRes = await client.query(`
      SELECT COUNT(*) AS null_count FROM loans WHERE operation_number IS NULL
    `);
    const nullCount = parseInt(nullCheckRes.rows[0].null_count, 10);
    if (nullCount > 0) {
      throw new Error(`[MIGRATION ERROR] Existen ${nullCount} préstamos con operation_number NULL antes de aplicar constraints.`);
    }
    console.log('[MIGRATION] Verificación 1 aprobada: 0 préstamos con operation_number NULL.');

    // 6. Verificación obligatoria 2: SELECT operation_number, COUNT(*) ... HAVING COUNT(*) > 1 debe devolver 0 filas
    const dupCheckRes = await client.query(`
      SELECT operation_number, COUNT(*) AS cnt
      FROM loans
      GROUP BY operation_number
      HAVING COUNT(*) > 1
    `);
    if (dupCheckRes.rows.length > 0) {
      throw new Error(`[MIGRATION ERROR] Se detectaron números de operación duplicados: ${JSON.stringify(dupCheckRes.rows)}`);
    }
    console.log('[MIGRATION] Verificación 2 aprobada: 0 números de operación duplicados.');

    // 7. Sincronizar el valor actual de la secuencia con el máximo número existente
    const finalMaxRes = await client.query(`
      SELECT COALESCE(MAX(SUBSTRING(operation_number FROM 4)::integer), 0) AS max_val
      FROM loans
      WHERE operation_number ~ '^OP-[0-9]+$'
    `);
    const finalMax = parseInt(finalMaxRes.rows[0].max_val, 10);
    if (finalMax > 0) {
      await client.query(`SELECT setval('loan_operation_number_seq', $1, true)`, [finalMax]);
      console.log(`[MIGRATION] Secuencia sincronizada a ${finalMax}. El siguiente préstamo recibirá OP-${String(finalMax + 1).padStart(6, '0')}.`);
    }

    // 8. Configurar DEFAULT automático con la secuencia PostgreSQL para nuevas inserciones
    await client.query(`
      ALTER TABLE loans ALTER COLUMN operation_number
      SET DEFAULT ('OP-' || LPAD(nextval('loan_operation_number_seq')::text, 6, '0'));
    `);
    console.log('[MIGRATION] DEFAULT automático configurado en PostgreSQL.');

    // 9. Aplicar restricción NOT NULL
    await client.query(`
      ALTER TABLE loans ALTER COLUMN operation_number SET NOT NULL;
    `);
    console.log('[MIGRATION] Restricción NOT NULL aplicada a loans.operation_number.');

    // 10. Crear índice UNIQUE si no existe
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_operation_number_unique
      ON loans (operation_number);
    `);
    console.log('[MIGRATION] Índice UNIQUE idx_loans_operation_number_unique asegurado.');

    await client.query('COMMIT');
    console.log('[MIGRATION] Transacción completada con éxito.');

    // 11. Métricas finales de verificación
    const statsRes = await client.query(`
      SELECT
        COUNT(*) AS total_loans,
        COUNT(operation_number) AS with_op_number,
        COUNT(*) - COUNT(operation_number) AS without_op_number,
        COUNT(*) - COUNT(DISTINCT operation_number) AS duplicate_count,
        MIN(operation_number) AS first_op,
        MAX(operation_number) AS last_op
      FROM loans
    `);

    const stats = statsRes.rows[0];
    console.log('\n========================================');
    console.log('ESTADÍSTICAS FINALES DE LA MIGRACIÓN:');
    console.log(`Total préstamos:               ${stats.total_loans}`);
    console.log(`Con operation_number:          ${stats.with_op_number}`);
    console.log(`Sin operation_number:          ${stats.without_op_number}`);
    console.log(`Duplicados:                    ${stats.duplicate_count}`);
    console.log(`Primer número generado:        ${stats.first_op}`);
    console.log(`Último número generado:        ${stats.last_op}`);
    console.log('========================================\n');

    return stats;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION ERROR]:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith('migrateOperationNumber.js')) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
