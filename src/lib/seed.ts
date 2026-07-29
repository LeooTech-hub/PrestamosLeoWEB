import { dbPool, initDbSchema } from './db';

export async function seedDatabaseIfEmpty() {
  await initDbSchema();

  const connection = await dbPool.getConnection();
  try {
    const [rows]: any = await connection.query('SELECT COUNT(*) as count FROM clients');
    const count = Number(rows[0]?.count || 0);

    if (count > 0) {
      return; // Already seeded
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Seed Clients
    await connection.execute(
      `INSERT INTO clients (id, name, phone, address, identification, notes, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['cli_1', 'Carlos Andrés Mendoza', '910456789', 'Av. Larco 450, Miraflores', '45987654', 'Cliente muy puntual. Cobrar en la mañana en la bodega.', new Date().toISOString(), 'ACTIVE']
    );
    await connection.execute(
      `INSERT INTO clients (id, name, phone, address, identification, notes, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['cli_2', 'María Fernanda Restrepo', '915987654', 'Jr. de la Unión 820, Cercado de Lima', '08345678', 'Puesto de ropa.', new Date().toISOString(), 'ACTIVE']
    );
    await connection.execute(
      `INSERT INTO clients (id, name, phone, address, identification, notes, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['cli_3', 'Jorge Luis Valencia', '920123456', 'Av. Arequipa 1200, Lince', '10876543', 'Taller mecánico.', new Date().toISOString(), 'ACTIVE']
    );

    // Seed Loans
    await connection.execute(
      `INSERT INTO loans (id, client_id, client_name, client_phone, client_address, capital, interest_rate, interest_amount, total_to_pay, payment_days, daily_payment_amount, start_date, due_date, status, paid_amount, remaining_amount, paid_days_count, notes, created_at, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['loan_1', 'cli_1', 'Carlos Andrés Mendoza', '910456789', 'Av. Larco 450, Miraflores', 500, 20, 100, 600, 20, 30, '2026-07-10', todayStr, 'ACTIVE', 360, 240, 12, 'Préstamo activo en Soles', new Date().toISOString(), 0]
    );
    await connection.execute(
      `INSERT INTO loans (id, client_id, client_name, client_phone, client_address, capital, interest_rate, interest_amount, total_to_pay, payment_days, daily_payment_amount, start_date, due_date, status, paid_amount, remaining_amount, paid_days_count, notes, created_at, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['loan_2', 'cli_2', 'María Fernanda Restrepo', '915987654', 'Jr. de la Unión 820, Cercado de Lima', 1000, 20, 200, 1200, 15, 80, '2026-07-05', '2026-07-20', 'OVERDUE', 640, 560, 8, 'En mora', new Date().toISOString(), 0]
    );
    await connection.execute(
      `INSERT INTO loans (id, client_id, client_name, client_phone, client_address, capital, interest_rate, interest_amount, total_to_pay, payment_days, daily_payment_amount, start_date, due_date, status, paid_amount, remaining_amount, paid_days_count, notes, created_at, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['loan_3', 'cli_3', 'Jorge Luis Valencia', '920123456', 'Av. Arequipa 1200, Lince', 2000, 20, 400, 2400, 20, 120, '2026-07-15', tomorrowStr, 'ACTIVE', 1200, 1200, 10, 'Vence mañana', new Date().toISOString(), 0]
    );

    // Seed Payments (payment_date) & Expenses (expense_date)
    await connection.execute(
      `INSERT INTO payments (id, loan_id, client_id, client_name, amount, payment_date, type, day_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['pay_1', 'loan_1', 'cli_1', 'Carlos Andrés Mendoza', 30, todayStr, 'FULL_DAY', 12, 'Pago del día']
    );
    await connection.execute(
      `INSERT INTO expenses (id, amount, category, description, expense_date, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['exp_1', 25, 'COMBUSTIBLE', 'Gasolina para moto de cobranza', todayStr, new Date().toISOString()]
    );
  } catch (error) {
    console.error('Error al insertar semilla MySQL', error);
  } finally {
    connection.release();
  }
}
