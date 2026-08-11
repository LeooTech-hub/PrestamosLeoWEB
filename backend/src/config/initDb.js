import pool from './db.js';
import bcrypt from 'bcryptjs';

function generateUUID() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export async function initDb() {
  try {
    // 1. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'COBRADOR',
        reset_token VARCHAR(255) NULL,
        reset_token_expires TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        alias VARCHAR(100) NULL,
        phone VARCHAR(50) NULL,
        address TEXT NULL,
        identification VARCHAR(50) NULL,
        notes TEXT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        is_archived SMALLINT DEFAULT 0,
        route_order INT DEFAULT 0,
        assigned_to_user_id VARCHAR(255) NULL,
        created_by_user_id VARCHAR(255) NULL,
        assigned_to VARCHAR(255) NULL,
        created_by VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Loans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id VARCHAR(36) PRIMARY KEY,
        client_id VARCHAR(36) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        client_phone VARCHAR(50) NULL,
        client_address TEXT NULL,
        capital DECIMAL(10,2) NOT NULL,
        amount_borrowed DECIMAL(10,2) NULL,
        interest_rate DECIMAL(5,2) DEFAULT 20.00,
        interest_amount DECIMAL(10,2) NOT NULL,
        penalty_amount DECIMAL(10,2) DEFAULT 0.00,
        mora DECIMAL(10,2) DEFAULT 0.00,
        total_to_pay DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NULL,
        payment_days INT DEFAULT 20,
        days_agreed INT NULL,
        daily_payment_amount DECIMAL(10,2) NOT NULL,
        daily_payment DECIMAL(10,2) NULL,
        paid_amount DECIMAL(10,2) DEFAULT 0.00,
        remaining_amount DECIMAL(10,2) NOT NULL,
        paid_days_count INT DEFAULT 0,
        start_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        notes TEXT NULL,
        is_archived SMALLINT DEFAULT 0,
        assigned_to_user_id VARCHAR(255) NULL,
        created_by_user_id VARCHAR(255) NULL,
        assigned_to VARCHAR(255) NULL,
        created_by VARCHAR(255) NULL,
        last_payment_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        loan_id VARCHAR(36) NOT NULL,
        client_id VARCHAR(36) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        late_fee DECIMAL(10,2) DEFAULT 0.00,
        payment_date DATE NULL,
        date DATE NULL,
        type VARCHAR(50) DEFAULT 'FULL_DAY',
        day_number INT DEFAULT 1,
        notes TEXT NULL,
        collected_by VARCHAR(255) NULL,
        collected_by_user_id VARCHAR(255) NULL,
        created_by VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(36) PRIMARY KEY,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) DEFAULT 'OTROS',
        description TEXT NULL,
        expense_date DATE NULL,
        date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Activity logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) DEFAULT 0.00,
        client_id VARCHAR(255) NULL,
        ip VARCHAR(64) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Helper para agregar columnas de forma segura (PostgreSQL)
    const safeAddColumn = async (table, column, colDef) => {
      try {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${colDef}`);
      } catch (_) {}
    };

    // Remover NOT NULL de columnas en tablas heredadas de Supabase
    try { await pool.query(`ALTER TABLE loans ALTER COLUMN amount DROP NOT NULL`); } catch (_) {}
    try { await pool.query(`ALTER TABLE loans ALTER COLUMN total_amount DROP NOT NULL`); } catch (_) {}
    try { await pool.query(`ALTER TABLE payments ALTER COLUMN date DROP NOT NULL`); } catch (_) {}
    try { await pool.query(`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_loan_id_fkey`); } catch (_) {}

    // Asegurar columnas adicionales en clients
    await safeAddColumn('clients', 'alias', 'VARCHAR(100) NULL');
    await safeAddColumn('clients', 'dni', 'VARCHAR(50) NULL');
    await safeAddColumn('clients', 'documento', 'VARCHAR(50) NULL');
    await safeAddColumn('clients', 'route_order', 'INT DEFAULT 0');
    await safeAddColumn('clients', 'assigned_to_user_id', 'VARCHAR(255) NULL');
    await safeAddColumn('clients', 'created_by_user_id', 'VARCHAR(255) NULL');
    await safeAddColumn('clients', 'assigned_to', 'VARCHAR(255) NULL');
    await safeAddColumn('clients', 'created_by', 'VARCHAR(255) NULL');

    // Asegurar todas las columnas en loans
    await safeAddColumn('loans', 'capital', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'amount_borrowed', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'amount', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'interest_rate', 'DECIMAL(5,2) DEFAULT 20.00');
    await safeAddColumn('loans', 'interest_amount', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'penalty_amount', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'mora', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'total_to_pay', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'total_amount', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'payment_days', 'INT DEFAULT 20');
    await safeAddColumn('loans', 'days_agreed', 'INT NULL');
    await safeAddColumn('loans', 'days', 'INT DEFAULT 20');
    await safeAddColumn('loans', 'daily_payment_amount', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'daily_payment', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'daily_amount', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'paid_amount', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'remaining_amount', 'DECIMAL(10,2) DEFAULT 0.00');
    await safeAddColumn('loans', 'paid_days_count', 'INT DEFAULT 0');
    await safeAddColumn('loans', 'start_date', 'DATE NULL');
    await safeAddColumn('loans', 'due_date', 'DATE NULL');
    await safeAddColumn('loans', 'notes', 'TEXT NULL');
    await safeAddColumn('loans', 'is_archived', 'SMALLINT DEFAULT 0');
    await safeAddColumn('loans', 'client_phone', 'VARCHAR(50) NULL');
    await safeAddColumn('loans', 'client_address', 'TEXT NULL');
    await safeAddColumn('loans', 'client_name', 'VARCHAR(255) NULL');
    await safeAddColumn('loans', 'assigned_to_user_id', 'VARCHAR(255) NULL');
    await safeAddColumn('loans', 'created_by_user_id', 'VARCHAR(255) NULL');
    await safeAddColumn('loans', 'assigned_to', 'VARCHAR(255) NULL');
    await safeAddColumn('loans', 'created_by', 'VARCHAR(255) NULL');
    await safeAddColumn('loans', 'last_payment_date', 'DATE NULL');

    // Asegurar todas las columnas en payments
    await safeAddColumn('payments', 'client_name', 'VARCHAR(255) NULL');
    await safeAddColumn('payments', 'client_id', 'VARCHAR(36) NULL');
    await safeAddColumn('payments', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await safeAddColumn('payments', 'date', 'DATE NULL');
    await safeAddColumn('payments', 'payment_date', 'DATE NULL');
    await safeAddColumn('payments', 'collected_by', 'VARCHAR(255) NULL');
    await safeAddColumn('payments', 'collected_by_user_id', 'VARCHAR(255) NULL');
    await safeAddColumn('payments', 'created_by', 'VARCHAR(255) NULL');
    await safeAddColumn('payments', 'late_fee', 'DECIMAL(10,2) DEFAULT 0.00');

    await safeAddColumn('activity_logs', 'client_id', 'VARCHAR(255) NULL');
    await safeAddColumn('activity_logs', 'ip', 'VARCHAR(64) NULL');

    await safeAddColumn('users', 'role', "VARCHAR(20) NOT NULL DEFAULT 'COBRADOR'");

    // Asegurar que el admin tenga rol ADMIN
    await pool.query(
      `UPDATE users SET role = 'ADMIN' WHERE email = 'admin@prestamosleo.com' AND (role IS NULL OR role = 'COBRADOR')`
    );

    // ── Seed: Verificar si la tabla users está vacía e insertar admin inicial ──
    const { rows } = await pool.query('SELECT COUNT(*) AS count FROM users');
    const userCount = Number(rows[0]?.count ?? 0);

    if (userCount === 0) {
      const defaultPassword = 'admin123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const userId = generateUUID();

      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'Administrador Leo', 'admin@prestamosleo.com', passwordHash, 'ADMIN']
      );
      console.log('✅ Usuario por defecto creado: admin@prestamosleo.com / admin123');
    }

    console.log('✅ Tablas y columnas inicializadas correctamente en PostgreSQL / Supabase.');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
  }
}
