import { pool } from './src/config/db.js';
import loanController from './src/controllers/loanController.js';

async function runTests() {
  try {
    console.log("== CORRIENDO PRUEBAS DEL CENTRO DE ALERTAS ==");
    
    // Begin transaction
    await pool.query('BEGIN');

    // Insert dummy client
    const clientRes = await pool.query(`
      INSERT INTO clients (name, phone) 
      VALUES ('Test Client Alerts', '999999999') 
      RETURNING id
    `);
    const clientId = clientRes.rows[0].id;

    // Define test cases
    // today is 2026-10-07 (peru_today)
    const testCases = [
      { name: '06/10 -> vence 08/10 (en 2 días)', due_date: '2026-10-09', status: 'ACTIVE', amount: 100, remaining: 100 }, // same diff as 06/10 -> 08/10
      { name: '07/10 -> vence 08/10 (vence mañana)', due_date: '2026-10-08', status: 'ACTIVE', amount: 100, remaining: 100 },
      { name: '08/10 -> vence 08/10 (vence hoy)', due_date: '2026-10-07', status: 'ACTIVE', amount: 100, remaining: 100 },
      { name: '09/10 -> vence 08/10 (vencido ayer)', due_date: '2026-10-06', status: 'ACTIVE', amount: 100, remaining: 100 },
      { name: 'Préstamo PAID vencido', due_date: '2026-10-06', status: 'PAID', amount: 100, remaining: 100 },
      { name: 'Préstamo con remaining_amount = 0', due_date: '2026-10-06', status: 'ACTIVE', amount: 100, remaining: 0 },
    ];

    const insertedLoans = [];

    for (const tc of testCases) {
      const res = await pool.query(`
        INSERT INTO loans (client_id, start_date, due_date, status, total_amount, paid_amount, remaining_amount, payment_frequency)
        VALUES ($1, '2026-10-01', $2, $3, $4, $5, $6, 'AGREED_DATE')
        RETURNING id
      `, [clientId, tc.due_date, tc.status, tc.amount, tc.amount - tc.remaining, tc.remaining]);
      insertedLoans.push({ id: res.rows[0].id, ...tc });
    }

    // Call getAlerts
    const req = { user: { role: 'ADMIN' }, query: {} };
    let responseData = [];
    const res = {
      json: (data) => { responseData = data; },
      status: (code) => ({ json: (data) => console.error(data) })
    };

    await loanController.getAlerts(req, res);

    const testAlerts = responseData.filter(a => insertedLoans.map(l => l.id).includes(a.loan_id));

    console.log("\\n== RESULTADOS DE PRUEBAS ==");
    for (const tc of insertedLoans) {
      const alert = testAlerts.find(a => a.loan_id === tc.id);
      console.log(`- Prueba: ${tc.name}`);
      if (alert) {
        console.log(`  Resultado: APARECE EN ALERTAS (Tipo: ${alert.type}, Remaining: ${alert.remaining_amount})`);
      } else {
        console.log(`  Resultado: NO APARECE EN ALERTAS`);
      }
    }

    // Assertions
    let passed = true;
    const check = (tcName, condition) => {
      if (!condition) {
        console.error(`❌ Falló la prueba: ${tcName}`);
        passed = false;
      } else {
        console.log(`✅ Pasó la prueba: ${tcName}`);
      }
    };

    console.log("\\n== VALIDACIONES ==");
    check('06/10 -> vence 08/10 (en 2 días) - NO alerta', !testAlerts.find(a => a.loan_id === insertedLoans[0].id));
    check('07/10 -> vence 08/10 (vence mañana) - NO alerta', !testAlerts.find(a => a.loan_id === insertedLoans[1].id));
    check('08/10 -> vence 08/10 (vence hoy) - VENCE HOY', testAlerts.find(a => a.loan_id === insertedLoans[2].id)?.type === 'DUE_TODAY');
    check('09/10 -> vence 08/10 (vencido ayer) - VENCIDO', testAlerts.find(a => a.loan_id === insertedLoans[3].id)?.type === 'OVERDUE');
    check('Préstamo PAID vencido - NO alerta', !testAlerts.find(a => a.loan_id === insertedLoans[4].id));
    check('Préstamo con remaining_amount = 0 - NO alerta', !testAlerts.find(a => a.loan_id === insertedLoans[5].id));

  } catch (err) {
    console.error("Error en pruebas:", err);
  } finally {
    await pool.query('ROLLBACK'); // Always rollback to keep DB clean
    pool.end();
  }
}

runTests();
