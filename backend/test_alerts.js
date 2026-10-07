import { pool } from './src/config/db.js';
import loanController from './src/controllers/loanController.js';

async function testAlerts() {
  const req = {
    user: { role: 'ADMIN' },
    query: {}
  };

  const res = {
    json: (data) => {
      console.log(JSON.stringify(data.filter(d => d.operation_number === 'OP-000092' || d.clientName.includes('Christin Aracely')), null, 2));
    },
    status: (code) => ({
      json: (data) => console.log('ERROR:', code, data)
    })
  };

  await loanController.getAlerts(req, res);
  pool.end();
}

testAlerts();
