import mysql from 'mysql2/promise';

/**
 * TiDB Serverless (MySQL) Connection Pool configuration.
 * Configured with SSL support required by TiDB Cloud.
 */
function createDbPool() {
  if (process.env.DATABASE_URL) {
    return mysql.createPool({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return mysql.createPool({
    host: process.env.TIDB_HOST || 'localhost',
    port: Number(process.env.TIDB_PORT) || 4000,
    user: process.env.TIDB_USER || 'root',
    password: process.env.TIDB_PASSWORD || '',
    database: process.env.TIDB_DATABASE || 'prestamosleo',
    ssl: process.env.TIDB_HOST ? { rejectUnauthorized: true } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export const dbPool = createDbPool();

/**
 * MySQL / TiDB Schema Initialization.
 */
export async function initDbSchema() {
  const connection = await dbPool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(64) NOT NULL,
        address TEXT NOT NULL,
        identification VARCHAR(64),
        notes TEXT,
        created_at VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id VARCHAR(64) PRIMARY KEY,
        client_id VARCHAR(64) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        client_phone VARCHAR(64) NOT NULL,
        client_address TEXT,
        capital DECIMAL(12, 2) NOT NULL,
        interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
        interest_amount DECIMAL(12, 2) NOT NULL,
        total_to_pay DECIMAL(12, 2) NOT NULL,
        payment_days INT NOT NULL,
        daily_payment_amount DECIMAL(12, 2) NOT NULL,
        start_date VARCHAR(64) NOT NULL,
        due_date VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        remaining_amount DECIMAL(12, 2) NOT NULL,
        paid_days_count INT NOT NULL DEFAULT 0,
        notes TEXT,
        created_at VARCHAR(64) NOT NULL,
        last_payment_date VARCHAR(64),
        is_archived TINYINT(1) NOT NULL DEFAULT 0,
        INDEX idx_client_id (client_id),
        INDEX idx_status (status)
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(64) PRIMARY KEY,
        loan_id VARCHAR(64) NOT NULL,
        client_id VARCHAR(64) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        date VARCHAR(64) NOT NULL,
        type VARCHAR(64) NOT NULL,
        day_number INT NOT NULL,
        notes TEXT,
        INDEX idx_loan_id (loan_id),
        INDEX idx_client_id (client_id),
        INDEX idx_date (date)
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(64) PRIMARY KEY,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(64) NOT NULL,
        description TEXT NOT NULL,
        date VARCHAR(64) NOT NULL,
        created_at VARCHAR(64) NOT NULL,
        INDEX idx_date (date)
      );
    `);
  } catch (error) {
    console.error('Error al inicializar esquemas MySQL / TiDB', error);
  } finally {
    connection.release();
  }
}
