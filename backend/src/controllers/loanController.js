import pool from '../config/db.js';
import crypto from 'crypto';

console.log("===============================================================");
console.log(" REPORTE DE REFACTORIZACIÓN - LOANCONTROLLER");
console.log("===============================================================");
console.log(" - Eliminación de duplicidades (métodos, try/catch redundantes).");
console.log(" - Corrección de inconsistencias de esquema camelCase vs snake_case.");
console.log(" - Casteo seguro de UUID/TEXT (::text) en queries PostgreSQL.");
console.log("===============================================================");

function generateUUID() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `uuid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function formatToMySQLDate(dateInput) {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function formatDatePE(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

export function resolveAssignedUserId(req) {
  const body = req.body || {};
  const explicit = body.assigned_to_user_id ?? body.assignedToUserId ?? body.assignedTo ?? body.assigned_to;
  if (explicit !== undefined && explicit !== null && String(explicit).trim() !== '' && String(explicit) !== 'unassigned') {
    return explicit;
  }
  const userId = req.user ? req.user.id : null;
  const userRole = String(req.user?.role || '').toUpperCase();
  if (userRole === 'ADMIN' && userId) return userId;
  if (userRole === 'COBRADOR' && userId) return userId;
  return userId || 1;
}

function mapRowToClient(row) {
  const dniVal = row.dni ?? row.documento ?? row.identification;
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    alias: row.alias ? String(row.alias) : undefined,
    phone: String(row.phone || ''),
    address: String(row.address || ''),
    dni: dniVal ? String(dniVal) : undefined,
    documento: dniVal ? String(dniVal) : undefined,
    identification: dniVal ? String(dniVal) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    status: row.status || 'ACTIVE',
    routeOrder: Number(row.route_order ?? row.routeOrder ?? 0),
    assignedTo: row.assigned_to_user_id || row.assigned_to || undefined,
    assignedToName: row.assigned_to_name || row.collector_name || undefined,
    createdBy: row.created_by_user_id || row.created_by || undefined
  };
}

function mapRowToLoan(row) {
  const capital = Number(row.amount || row.capital || row.amount_borrowed || 0);
  const interestRate = Number(row.interest_rate || 20);
  const interestAmount = Number(row.interest_amount || Math.round(capital * (interestRate / 100)));
  const penaltyAmount = Number(row.penalty_amount || row.penaltyAmount || row.mora || 0);
  const totalToPay = Number(row.total_amount || row.total_to_pay || capital + interestAmount + penaltyAmount || 0);
  const paymentDays = Number(row.payment_days || row.days_agreed || row.days || 20);
  const dailyPaymentAmount = Number(row.daily_payment || row.daily_payment_amount || row.daily_amount || Math.round(totalToPay / (paymentDays || 1)) || 0);

  const clientName = String(row.client_name || row.joined_client_name || row.name || 'Sin Nombre');
  const rawAlias = row.joined_client_alias || row.client_alias || row.alias || '';
  const clientAlias = rawAlias ? String(rawAlias).trim() : undefined;
  const clientPhone = String(row.joined_client_phone || row.client_phone || row.phone || '');
  const clientAddress = String(row.joined_client_address || row.client_address || row.address || '');
  const routeOrder = Number(row.joined_client_route_order ?? row.route_order ?? 0);

  return {
    id: String(row.id || ''),
    clientId: String(row.client_id || row.clientId || ''),
    client_id: String(row.client_id || row.clientId || ''),
    clientName,
    client_name: clientName,
    clientAlias,
    client_alias: clientAlias,
    alias: clientAlias,
    apodo: clientAlias,
    clientPhone,
    clientAddress,
    routeOrder,
    capital,
    amount: capital,
    interestRate,
    interest_rate: interestRate,
    interestAmount,
    penaltyAmount,
    totalToPay,
    totalAmount: totalToPay,
    total_amount: totalToPay,
    paymentDays,
    days: paymentDays,
    dailyPaymentAmount,
    dailyAmount: dailyPaymentAmount,
    daily_amount: dailyPaymentAmount,
    daily_payment: dailyPaymentAmount,
    startDate: String(row.start_date || new Date().toISOString().split('T')[0]),
    dueDate: String(row.due_date || new Date().toISOString().split('T')[0]),
    status: row.status || 'ACTIVE',
    paidAmount: Number(row.paid_amount ?? 0),
    remainingAmount: Number(row.remaining_amount ?? Math.max(0, totalToPay - Number(row.paid_amount ?? 0))),
    remainingDays: Number(row.remaining_days ?? paymentDays),
    paidDaysCount: Number(row.paid_days_count ?? 0),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    lastPaymentDate: row.last_payment_date ? String(row.last_payment_date) : undefined,
    isArchived: Boolean(row.is_archived),
    assignedTo: row.assigned_to_user_id || row.assigned_to || undefined,
    assignedToName: row.assigned_to_name || row.collector_name || undefined,
    createdBy: row.created_by_user_id || row.created_by || undefined
  };
}

function mapRowToPayment(row) {
  const paymentDate = String(row.payment_date || row.date || row.created_at || new Date().toISOString().split('T')[0]).split('T')[0];
  const clientName = String(row.joined_client_name || row.client_name || row.name || 'Cliente');
  const loanId = String(row.loan_id || row.loanId || '');
  const clientId = String(row.client_id || row.clientId || '');
  const dayNumber = Number(row.day_number ?? row.dayNumber ?? 1);
  const amount = Number(row.amount || 0);
  const collectorName = row.collector_name || row.collectorName || undefined;

  return {
    id: String(row.id || ''),
    loanId,
    loan_id: loanId,
    clientId,
    client_id: clientId,
    clientName,
    client_name: clientName,
    amount,
    lateFee: Number(row.late_fee ?? row.lateFee ?? 0),
    date: paymentDate,
    payment_date: paymentDate,
    type: row.type || 'FULL_DAY',
    dayNumber,
    day_number: dayNumber,
    notes: row.notes ? String(row.notes) : undefined,
    comment: row.notes ? String(row.notes) : undefined,
    createdAt: row.created_at || undefined,
    created_at: row.created_at || undefined,
    collectedBy: row.collected_by_user_id || row.collected_by || undefined,
    collected_by: row.collected_by_user_id || row.collected_by || undefined,
    createdBy: row.created_by_user_id || row.created_by || undefined,
    created_by: row.created_by_user_id || row.created_by || undefined,
    collectorName: collectorName ? String(collectorName) : undefined,
    collector_name: collectorName ? String(collectorName) : undefined
  };
}

function mapRowToExpense(row) {
  return {
    id: String(row.id || ''),
    amount: Number(row.amount || 0),
    category: row.category || 'OTROS',
    description: String(row.description || ''),
    date: String(row.expense_date || row.date || new Date().toISOString().split('T')[0]),
    createdAt: String(row.created_at || new Date().toISOString())
  };
}

const loanController = {
  async getClients(req, res) {
    try {
      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      const isTodos = req.query.filter === 'TODOS' || req.query.assignedTo === 'TODOS';
      const userId = req.user ? req.user.id : null;
      let rows = [];

      const baseQuery = `
        SELECT c.*, COALESCE(u.name, 'Sin Asignar') AS assigned_to_name
        FROM clients c
        LEFT JOIN users u ON c.assigned_to_user_id::text = u.id::text
      `;

      if (isCobrador && userId && !isTodos) {
        const { rows: r } = await pool.query(`${baseQuery} WHERE c.assigned_to_user_id::text = $1 ORDER BY c.created_at DESC`, [String(userId)]);
        rows = r || [];
      } else {
        const { rows: r } = await pool.query(`${baseQuery} ORDER BY c.created_at DESC`);
        rows = r || [];
      }
      return res.json(rows.map(mapRowToClient));
    } catch (error) {
      console.error("[ERROR GET /api/clients]:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  async assignClients(req, res) {
    const client = await pool.connect();
    try {
      const { clientIds, collectorId } = req.body;
      if (!Array.isArray(clientIds) || clientIds.length === 0) {
        return res.status(400).json({ error: 'Debes proporcionar clientIds como un arreglo' });
      }

      const assignedVal = collectorId && collectorId !== 'unassigned' ? String(collectorId) : null;
      await client.query('BEGIN');
      for (const cid of clientIds) {
        await client.query(`UPDATE clients SET assigned_to_user_id = $1 WHERE id::text = $2`, [assignedVal, String(cid)]);
        await client.query(`UPDATE loans SET assigned_to_user_id = $1 WHERE client_id::text = $2`, [assignedVal, String(cid)]);
      }
      await client.query('COMMIT');
      return res.json({ success: true, message: `${clientIds.length} cliente(s) asignados exitosamente`, assignedCount: clientIds.length, collectorId: assignedVal });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in assignClients:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async createClient(req, res) {
    try {
      const name = req.body.name || req.body.nombre || '';
      const alias = req.body.alias || req.body.apodo || '';
      const phone = req.body.phone || req.body.telefono || '';
      const dni = req.body.dni || req.body.documento || '';
      const address = req.body.address || req.body.direccion || '';
      const notes = req.body.notes || req.body.observaciones || '';
      const assigned_to_user_id = req.body.assigned_to_user_id || req.body.assignedTo || req.user?.id || null;

      if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

      const query = `
        INSERT INTO clients (name, alias, phone, dni, address, notes, assigned_to_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [name.trim(), alias.trim(), phone.trim(), dni.trim(), address.trim(), notes.trim(), assigned_to_user_id];
      const result = await pool.query(query, values);
      return res.status(201).json(mapRowToClient(result.rows[0]));
    } catch (error) {
      console.error('[ERROR POST /api/clients]:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async updateClient(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const name = req.body.name || req.body.nombre || '';
      const alias = req.body.alias || req.body.apodo || null;
      const phone = req.body.phone || req.body.telefono || '';
      const address = req.body.address || req.body.direccion || '';
      const dni = req.body.dni || req.body.documento || req.body.identification || null;
      const notes = req.body.notes || req.body.observaciones || null;
      const routeOrder = req.body.routeOrder || req.body.route_order || 0;

      await client.query('BEGIN');
      await client.query(
        `UPDATE clients SET name = $1, alias = $2, phone = $3, address = $4, dni = $5, notes = $6, route_order = $7 WHERE id::text = $8`,
        [name.trim(), alias?.trim() || null, phone.trim(), address.trim(), dni?.trim() || null, notes?.trim() || null, Number(routeOrder) || 0, String(id)]
      );
      await client.query('COMMIT');

      return res.json({ success: true, message: 'Cliente actualizado' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in updateClient:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async updateRouteOrders(req, res) {
    const client = await pool.connect();
    try {
      const { orders } = req.body;
      if (!Array.isArray(orders)) return res.status(400).json({ error: 'Formato inválido de órdenes' });

      await client.query('BEGIN');
      for (const item of orders) {
        if (item.id) {
          await client.query(`UPDATE clients SET route_order = $1 WHERE id::text = $2`, [Number(item.routeOrder) || 0, String(item.id)]);
        }
      }
      await client.query('COMMIT');
      return res.json({ success: true, message: 'Orden de ruta actualizado' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in updateRouteOrders:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async restoreClient(req, res) {
    try {
      const { id } = req.params;
      await pool.query(`UPDATE clients SET status = 'ACTIVE' WHERE id::text = $1`, [String(id)]);
      try {
        await pool.query(`UPDATE clients SET is_archived = false WHERE id::text = $1`, [String(id)]);
      } catch (_) {}
      return res.json({ success: true, message: 'Cliente restaurado' });
    } catch (error) {
      console.error('Error in restoreClient:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async restoreLoan(req, res) {
    try {
      const { id } = req.params;
      await pool.query(`UPDATE loans SET status = 'ACTIVE' WHERE id::text = $1`, [String(id)]);
      try {
        await pool.query(`UPDATE loans SET is_archived = false WHERE id::text = $1`, [String(id)]);
      } catch (_) {}
      return res.json({ success: true, message: 'Préstamo restaurado' });
    } catch (error) {
      console.error('Error in restoreLoan:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async getTrash(req, res) {
    try {
      let clients = [];
      let loans = [];

      try {
        const { rows: cRows } = await pool.query(`SELECT * FROM clients WHERE status = 'INACTIVE' OR is_archived = true ORDER BY id DESC`);
        clients = cRows.map(mapRowToClient);
      } catch {
        const { rows: cRows } = await pool.query(`SELECT * FROM clients WHERE status = 'INACTIVE' ORDER BY id DESC`);
        clients = cRows.map(mapRowToClient);
      }

      const { rows: lRows } = await pool.query(`
        SELECT l.*, c.name AS joined_client_name, c.alias AS joined_client_alias, c.phone AS joined_client_phone, c.address AS joined_client_address 
        FROM loans l 
        LEFT JOIN clients c ON l.client_id::text = c.id::text 
        WHERE l.is_archived = true
        ORDER BY l.id DESC
      `);
      loans = lRows.map(mapRowToLoan);

      return res.json({ clients, loans });
    } catch (error) {
      console.error('Error in getTrash:', error);
      return res.json({ clients: [], loans: [] });
    }
  },

  async deleteClient(req, res) {
    try {
      const { id } = req.params;
      const mode = req.query.mode || 'ARCHIVE';

      if (mode === 'ARCHIVE') {
        try {
          await pool.query(`UPDATE clients SET status = 'INACTIVE', is_archived = true WHERE id::text = $1`, [String(id)]);
        } catch (_) {
          await pool.query(`UPDATE clients SET status = 'INACTIVE' WHERE id::text = $1`, [String(id)]);
        }
      } else {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`DELETE FROM payments WHERE client_id::text = $1`, [String(id)]);
          await client.query(`DELETE FROM loans WHERE client_id::text = $1`, [String(id)]);
          await client.query(`DELETE FROM clients WHERE id::text = $1`, [String(id)]);
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
      return res.json({ success: true, message: 'Cliente eliminado' });
    } catch (error) {
      console.error('Error in deleteClient:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async getLoans(req, res) {
    try {
      const clientIdFilter = req.query.clientId || req.query.client_id;
      const statusFilter = req.query.status;
      const searchFilter = req.query.search;
      const params = [];
      const conditions = [];

      let queryStr = `
        SELECT l.*, 
               c.name AS client_name,
               c.name AS joined_client_name,
               c.alias AS joined_client_alias,
               c.phone AS joined_client_phone,
               c.address AS joined_client_address,
               COALESCE(u.name, 'Admin') AS collector_name
        FROM loans l
        LEFT JOIN clients c ON l.client_id::text = c.id::text
        LEFT JOIN users u ON l.assigned_to_user_id::text = u.id::text
      `;

      if (clientIdFilter) {
        conditions.push(`l.client_id::text = $${params.length + 1}`);
        params.push(String(clientIdFilter));
      }

      if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'TODOS') {
        conditions.push(`l.status = $${params.length + 1}`);
        params.push(statusFilter);
      }

      if (searchFilter && searchFilter.trim() !== '') {
        conditions.push(`(c.name ILIKE $${params.length + 1} OR c.alias ILIKE $${params.length + 2})`);
        params.push(`%${searchFilter.trim()}%`, `%${searchFilter.trim()}%`);
      }

      if (conditions.length > 0) {
        queryStr += ` WHERE ` + conditions.join(' AND ');
      }

      queryStr += ` ORDER BY l.created_at DESC`;

      const { rows } = await pool.query(queryStr, params);
      return res.json(rows.map(mapRowToLoan));
    } catch (error) {
      console.error("[ERROR GET /api/loans]:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  async createClientAndLoan(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let rawClientId = req.body.client_id || req.body.clientId;
      if (typeof rawClientId === 'object' && rawClientId !== null) {
        rawClientId = rawClientId.id;
      }
      let finalClientId = (rawClientId && String(rawClientId) !== '[object Object]') ? String(rawClientId) : null;
      
      if (!finalClientId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El client_id es obligatorio y debe ser válido.' });
      }

      const existingClientRes = await client.query(
        `SELECT name FROM clients WHERE id::text = $1 LIMIT 1`,
        [finalClientId]
      );

      if (existingClientRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Cliente no encontrado.' });
      }

      let clientName = (req.body.name || req.body.nombre || req.body.client_name || '').trim();
      if (!clientName) {
        clientName = existingClientRes.rows[0].name;
      }

      const amount = Number(req.body.amount || req.body.monto || req.body.capital || 0);
      const interestRate = Number(req.body.interest_rate || req.body.interestRate || 20);
      const totalAmount = Number(req.body.total_amount || req.body.totalAmount || (amount + (amount * (interestRate / 100))) || 0);
      const days = Number(req.body.days || req.body.dias || 20);
      const dailyAmount = Number(req.body.daily_payment || req.body.daily_amount || req.body.dailyAmount || Math.round(totalAmount / (days || 1)) || 0);
      const remainingDays = Number(req.body.remaining_days || req.body.remainingDays || days);
      const status = req.body.status || 'ACTIVE';
      const assignedToUserId = req.body.assigned_to_user_id || req.user?.id || null;
      const startDate = req.body.start_date || req.body.startDate || new Date().toISOString().split('T')[0];

      const insertLoanQuery = `
        INSERT INTO loans (
          client_id, amount, total_amount, daily_amount, days, remaining_days,
          interest_rate, status, assigned_to_user_id, start_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const loanRes = await client.query(insertLoanQuery, [
        finalClientId, amount, totalAmount, dailyAmount,
        days, remainingDays, interestRate, status,
        assignedToUserId, startDate
      ]);

      const fullLoanRes = await client.query(`
        SELECT l.*, 
               c.name AS joined_client_name, 
               c.alias AS joined_client_alias, 
               c.phone AS joined_client_phone, 
               c.address AS joined_client_address,
               c.route_order AS joined_client_route_order
        FROM loans l
        LEFT JOIN clients c ON l.client_id::text = c.id::text
        WHERE l.id::text = $1
      `, [String(loanRes.rows[0].id)]);

      await client.query('COMMIT');
      return res.status(201).json(mapRowToLoan(fullLoanRes.rows[0]));
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ERROR POST /api/loans]:', error);
      return res.status(500).json({ error: 'Error al registrar préstamo', details: error.message });
    } finally {
      client.release();
    }
  },

  async updateLoan(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const b = req.body || {};

      const resLoan = await client.query(`SELECT * FROM loans WHERE id::text = $1`, [String(id)]);
      if (resLoan.rows.length === 0) {
        return res.status(404).json({ error: 'Préstamo no encontrado' });
      }
      const existing = resLoan.rows[0];

      const amount = b.amount ?? b.monto ?? b.capital ?? existing.amount;
      const interestRate = b.interest_rate ?? b.interestRate ?? existing.interest_rate;
      const totalAmount = b.total_amount ?? b.totalAmount ?? existing.total_amount;
      const days = b.days ?? b.payment_days ?? b.paymentDays ?? existing.days;
      const dailyAmount = b.daily_amount ?? b.dailyAmount ?? b.dailyPaymentAmount ?? existing.daily_amount;
      const remainingDays = b.remaining_days ?? b.remainingDays ?? existing.remaining_days;
      const status = b.status ?? existing.status;
      const startDate = b.start_date ?? b.startDate ?? existing.start_date;
      const dueDate = b.due_date ?? b.dueDate ?? existing.due_date;
      const assignedToUserId = b.assigned_to_user_id ?? b.assignedToUserId ?? existing.assigned_to_user_id;

      await client.query('BEGIN');
      
      const updateLoanQuery = `
        UPDATE loans SET 
          amount = COALESCE($1, amount),
          interest_rate = COALESCE($2, interest_rate),
          total_amount = COALESCE($3, total_amount),
          days = COALESCE($4, days),
          daily_amount = COALESCE($5, daily_amount),
          remaining_days = COALESCE($6, remaining_days),
          status = COALESCE($7, status),
          start_date = COALESCE($8, start_date),
          due_date = COALESCE($9, due_date),
          assigned_to_user_id = COALESCE($10, assigned_to_user_id)
        WHERE id::text = $11
      `;
      
      await client.query(updateLoanQuery, [
        amount, interestRate, totalAmount, days, dailyAmount, remainingDays,
        status, startDate, dueDate, assignedToUserId, String(id)
      ]);

      const fullLoanRes = await client.query(`
        SELECT l.*, 
               c.name AS joined_client_name, 
               c.alias AS joined_client_alias, 
               c.phone AS joined_client_phone, 
               c.address AS joined_client_address,
               c.route_order AS joined_client_route_order
        FROM loans l
        LEFT JOIN clients c ON l.client_id::text = c.id::text
        WHERE l.id::text = $1
      `, [String(id)]);

      await client.query('COMMIT');
      return res.json({ success: true, message: 'Préstamo actualizado', loan: mapRowToLoan(fullLoanRes.rows[0]) });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ERROR PUT /api/loans/:id]:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async deleteLoan(req, res) {
    try {
      const { id } = req.params;
      const mode = req.query.mode || 'ARCHIVE';

      if (mode === 'ARCHIVE') {
        try {
          await pool.query(`UPDATE loans SET is_archived = true WHERE id::text = $1`, [String(id)]);
        } catch (_) {
           await pool.query(`UPDATE loans SET status = 'INACTIVE' WHERE id::text = $1`, [String(id)]);
        }
      } else {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`DELETE FROM payments WHERE loan_id::text = $1`, [String(id)]);
          await client.query(`DELETE FROM loans WHERE id::text = $1`, [String(id)]);
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
      return res.json({ success: true, message: 'Préstamo eliminado' });
    } catch (error) {
      console.error('Error in deleteLoan:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async getPayments(req, res) {
    try {
      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      if (isCobrador) {
        return res.status(403).json({ error: 'Acceso denegado: Los usuarios con rol COBRADOR no tienen permiso para consultar el historial general de cobros.' });
      }

      const { rows } = await pool.query(`
        SELECT p.*,
               c.name as joined_client_name,
               u.name as collector_name
        FROM payments p
        LEFT JOIN clients c ON p.client_id::text = c.id::text
        LEFT JOIN users u ON p.collected_by_user_id::text = u.id::text
        ORDER BY p.payment_date DESC, p.created_at DESC, p.id DESC
      `);
      
      return res.status(200).json(rows.map(mapRowToPayment));
    } catch (error) {
      console.error('Error in getPayments:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async registerPayment(req, res) {
    const client = await pool.connect();
    try {
      const userId = req.user?.id || 'unknown';
      const { loanId, amount, notes, lateFee, mora } = req.body;

      const numericAmount = Number(amount);
      const numericLateFee = Math.max(0, Number(lateFee ?? mora ?? 0));
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'El monto del abono debe ser mayor a 0' });
      }

      await client.query('BEGIN');
      const resLoan = await client.query(`
        SELECT l.*, c.name AS joined_client_name, c.alias AS joined_client_alias, c.phone AS joined_client_phone, c.address AS joined_client_address, c.route_order AS joined_client_route_order
        FROM loans l
        LEFT JOIN clients c ON l.client_id::text = c.id::text
        WHERE l.id::text = $1
      `, [String(loanId)]);
      
      if (resLoan.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Préstamo no encontrado' });
      }

      const loan = mapRowToLoan(resLoan.rows[0]);
      if (loan.status === 'PAID' || loan.remainingAmount <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Este préstamo ya se encuentra cancelado' });
      }

      const todayStr = new Date().toISOString().split('T')[0];

      const newPaidAmount = loan.paidAmount + numericAmount;
      const newRemainingAmount = Math.max(0, loan.totalToPay - newPaidAmount);
      const newPaidDaysCount = Math.min(loan.paymentDays, Math.floor(newPaidAmount / (loan.dailyPaymentAmount || 1)));

      let newStatus = loan.status;
      if (newRemainingAmount <= 0) {
        newStatus = 'PAID';
      } else if (new Date(loan.dueDate) < new Date(todayStr)) {
        newStatus = 'OVERDUE';
      } else {
        newStatus = 'ACTIVE';
      }

      const isFullDay = numericAmount >= loan.dailyPaymentAmount;
      const paymentId = generateUUID();
      const newPayment = {
        id: paymentId,
        loanId: loan.id,
        clientId: loan.clientId,
        amount: numericAmount,
        lateFee: numericLateFee,
        paymentDate: todayStr,
        type: newRemainingAmount <= 0 ? 'FULL_PAYOFF' : isFullDay ? 'FULL_DAY' : 'PARTIAL',
        dayNumber: newPaidDaysCount + (isFullDay ? 0 : 1),
        notes: notes || (numericLateFee > 0 ? `Pago con mora de S/. ${numericLateFee.toFixed(2)}` : isFullDay ? 'Pago diario completo' : 'Abono parcial')
      };

      await client.query(
        `UPDATE loans SET paid_amount = $1, remaining_amount = $2, paid_days_count = $3, status = $4, last_payment_date = $5 WHERE id::text = $6`,
        [newPaidAmount, newRemainingAmount, newPaidDaysCount, newStatus, todayStr, String(loanId)]
      );

      await client.query(
        `INSERT INTO payments (id, loan_id, client_id, amount, late_fee, payment_date, type, day_number, notes, collected_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [newPayment.id, newPayment.loanId, newPayment.clientId, newPayment.amount, newPayment.lateFee, newPayment.paymentDate, newPayment.type, newPayment.dayNumber, newPayment.notes || null, String(userId)]
      );

      const pRes = await client.query(`
        SELECT p.*, c.name AS joined_client_name
        FROM payments p
        LEFT JOIN clients c ON p.client_id::text = c.id::text
        WHERE p.id::text = $1
      `, [String(newPayment.id)]);

      await client.query('COMMIT');

      return res.status(201).json({ 
        payment: mapRowToPayment(pRes.rows[0]), 
        updatedLoan: { ...loan, paidAmount: newPaidAmount, remainingAmount: newRemainingAmount, status: newStatus } 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ERROR POST /api/payments]:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async revertLastPayment(req, res) {
    const client = await pool.connect();
    try {
      const loanId = req.params.id || req.body.loanId;
      if (!loanId) return res.status(400).json({ error: 'ID de préstamo requerido' });

      await client.query('BEGIN');
      const resLoan = await client.query(`
        SELECT l.*, c.name AS joined_client_name, c.alias AS joined_client_alias, c.phone AS joined_client_phone, c.address AS joined_client_address, c.route_order AS joined_client_route_order
        FROM loans l
        LEFT JOIN clients c ON l.client_id::text = c.id::text
        WHERE l.id::text = $1
      `, [String(loanId)]);
      
      if (resLoan.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Préstamo no encontrado' });
      }

      const loan = mapRowToLoan(resLoan.rows[0]);
      if (loan.paidAmount <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El préstamo no tiene pagos para revertir' });
      }

      const resPay = await client.query(`SELECT * FROM payments WHERE loan_id::text = $1`, [String(loanId)]);
      const pRows = resPay.rows;

      let revertedAmount = 0;
      let newLastPaymentDate = null;

      if (pRows.length > 0) {
        const mappedPayments = pRows.map(mapRowToPayment);
        mappedPayments.sort((a, b) => {
          if (a.dayNumber !== b.dayNumber) return b.dayNumber - a.dayNumber;
          return (b.date || '').localeCompare(a.date || '');
        });
        const lastPayment = mappedPayments[0];
        revertedAmount = lastPayment.amount;

        await client.query(`DELETE FROM payments WHERE id::text = $1`, [String(lastPayment.id)]);
        if (mappedPayments.length > 1) {
          newLastPaymentDate = mappedPayments[1].date;
        }
      } else {
        revertedAmount = loan.dailyPaymentAmount || loan.paidAmount;
      }

      const newPaidAmount = Math.max(0, loan.paidAmount - revertedAmount);
      const newRemainingAmount = Math.max(0, loan.totalToPay - newPaidAmount);
      const newPaidDaysCount = Math.min(
        loan.paymentDays,
        Math.floor(newPaidAmount / (loan.dailyPaymentAmount || 1))
      );

      const todayStr = new Date().toISOString().split('T')[0];
      let newStatus = loan.status;
      if (newRemainingAmount <= 0) {
        newStatus = 'PAID';
      } else if (new Date(loan.dueDate) < new Date(todayStr)) {
        newStatus = 'OVERDUE';
      } else {
        newStatus = 'ACTIVE';
      }

      await client.query(
        `UPDATE loans SET paid_amount = $1, remaining_amount = $2, paid_days_count = $3, status = $4, last_payment_date = $5 WHERE id::text = $6`,
        [newPaidAmount, newRemainingAmount, newPaidDaysCount, newStatus, newLastPaymentDate, String(loanId)]
      );

      await client.query('COMMIT');

      const updatedLoan = {
        ...loan,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paidDaysCount: newPaidDaysCount,
        status: newStatus,
        lastPaymentDate: newLastPaymentDate
      };

      return res.json({ success: true, message: 'Pago revertido exitosamente', updatedLoan });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in revertLastPayment:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async deletePayment(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;

      await client.query('BEGIN');
      const resPay = await client.query(`SELECT * FROM payments WHERE id::text = $1`, [String(id)]);
      if (resPay.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      const payment = mapRowToPayment(resPay.rows[0]);
      const loanId = payment.loanId;

      const resLoan = await client.query(`
        SELECT l.*, c.name AS joined_client_name, c.alias AS joined_client_alias, c.phone AS joined_client_phone, c.address AS joined_client_address, c.route_order AS joined_client_route_order
        FROM loans l
        LEFT JOIN clients c ON l.client_id::text = c.id::text
        WHERE l.id::text = $1
      `, [String(loanId)]);
      
      if (resLoan.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Préstamo asociado no encontrado' });
      }

      const loan = mapRowToLoan(resLoan.rows[0]);

      await client.query(`DELETE FROM payments WHERE id::text = $1`, [String(id)]);

      const remRes = await client.query(`SELECT * FROM payments WHERE loan_id::text = $1`, [String(loanId)]);
      const remainingPayments = remRes.rows.map(mapRowToPayment);

      const newPaidAmount = remainingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const newRemainingAmount = Math.max(0, loan.totalToPay - newPaidAmount);
      const newPaidDaysCount = Math.min(loan.paymentDays, Math.floor(newPaidAmount / (loan.dailyPaymentAmount || 1)));

      const todayStr = new Date().toISOString().split('T')[0];

      let newStatus = loan.status;
      if (newRemainingAmount <= 0) {
        newStatus = 'PAID';
      } else {
        const dueDateObj = new Date(loan.dueDate);
        const todayObj = new Date(todayStr);
        if (dueDateObj < todayObj) {
          newStatus = 'OVERDUE';
        } else {
          newStatus = 'ACTIVE';
        }
      }

      let newLastPaymentDate = null;
      if (remainingPayments.length > 0) {
        remainingPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        newLastPaymentDate = remainingPayments[0].date;
      }

      await client.query(
        `UPDATE loans SET paid_amount = $1, remaining_amount = $2, paid_days_count = $3, status = $4, last_payment_date = $5 WHERE id::text = $6`,
        [newPaidAmount, newRemainingAmount, newPaidDaysCount, newStatus, newLastPaymentDate, String(loanId)]
      );

      await client.query('COMMIT');

      const updatedLoan = {
        ...loan,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paidDaysCount: newPaidDaysCount,
        status: newStatus,
        lastPaymentDate: newLastPaymentDate
      };

      return res.json({
        success: true,
        message: 'Pago anulado correctamente',
        deletedPaymentId: id,
        updatedLoan
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in deletePayment:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async updatePayment(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { amount, date, notes } = req.body;

      await client.query('BEGIN');
      const resPay = await client.query(`SELECT * FROM payments WHERE id::text = $1`, [String(id)]);
      if (resPay.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      const existingPayment = mapRowToPayment(resPay.rows[0]);
      const loanId = existingPayment.loanId;

      const resLoan = await client.query(`
        SELECT l.*, c.name AS joined_client_name, c.alias AS joined_client_alias, c.phone AS joined_client_phone, c.address AS joined_client_address, c.route_order AS joined_client_route_order
        FROM loans l
        LEFT JOIN clients c ON l.client_id::text = c.id::text
        WHERE l.id::text = $1
      `, [String(loanId)]);
      
      if (resLoan.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Préstamo asociado no encontrado' });
      }

      const loan = mapRowToLoan(resLoan.rows[0]);

      const newAmount = (amount !== undefined && amount !== null) ? Number(amount) : existingPayment.amount;
      const newDate = (date !== undefined && date !== null) ? date : existingPayment.date;
      const newNotes = (notes !== undefined && notes !== null) ? notes : existingPayment.notes;

      if (isNaN(newAmount) || newAmount <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El monto del abono debe ser mayor a 0' });
      }

      const updatePaymentQuery = `
        UPDATE payments 
        SET amount = COALESCE($1, amount), 
            payment_date = COALESCE($2, payment_date), 
            notes = COALESCE($3, notes)
        WHERE id::text = $4
      `;
      await client.query(updatePaymentQuery, [newAmount, newDate, newNotes || null, String(id)]);

      const remRes = await client.query(`SELECT * FROM payments WHERE loan_id::text = $1`, [String(loanId)]);
      const remainingPayments = remRes.rows.map(mapRowToPayment);

      const newPaidAmount = remainingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const newRemainingAmount = Math.max(0, loan.totalToPay - newPaidAmount);
      const newPaidDaysCount = Math.min(loan.paymentDays, Math.floor(newPaidAmount / (loan.dailyPaymentAmount || 1)));

      const todayStr = new Date().toISOString().split('T')[0];

      let newStatus = loan.status;
      if (newRemainingAmount <= 0) {
        newStatus = 'PAID';
      } else {
        const dueDateObj = new Date(loan.dueDate);
        const todayObj = new Date(todayStr);
        if (dueDateObj < todayObj) {
          newStatus = 'OVERDUE';
        } else {
          newStatus = 'ACTIVE';
        }
      }

      let newLastPaymentDate = null;
      if (remainingPayments.length > 0) {
        remainingPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        newLastPaymentDate = remainingPayments[0].date;
      }

      await client.query(
        `UPDATE loans SET paid_amount = $1, remaining_amount = $2, paid_days_count = $3, status = $4, last_payment_date = $5 WHERE id::text = $6`,
        [newPaidAmount, newRemainingAmount, newPaidDaysCount, newStatus, newLastPaymentDate, String(loanId)]
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: 'Pago actualizado correctamente',
        payment: { ...existingPayment, amount: newAmount, date: newDate, notes: newNotes },
        updatedLoan: { ...loan, paidAmount: newPaidAmount, remainingAmount: newRemainingAmount, status: newStatus }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ERROR PUT /api/payments]:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async getExpenses(req, res) {
    try {
      const { rows } = await pool.query('SELECT * FROM expenses ORDER BY id DESC');
      return res.json(rows.map(mapRowToExpense));
    } catch (error) {
      console.error('Error in getExpenses:', error);
      return res.json([]);
    }
  },

  async addExpense(req, res) {
    try {
      const { amount, category, description, date } = req.body;
      const id = generateUUID();
      const createdAt = new Date().toISOString();
      const expenseDate = formatToMySQLDate(date);

      await pool.query(
        `INSERT INTO expenses (id, amount, category, description, expense_date, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, amount || 0, category || 'OTROS', description || '', expenseDate, createdAt]
      );

      return res.status(201).json({ id, amount: amount || 0, category: category || 'OTROS', description: description || '', date: expenseDate, createdAt });
    } catch (error) {
      console.error('Error in addExpense:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async deleteExpense(req, res) {
    try {
      const { id } = req.params;
      await pool.query(`DELETE FROM expenses WHERE id::text = $1`, [String(id)]);
      return res.json({ success: true, message: 'Gasto eliminado' });
    } catch (error) {
      console.error('Error in deleteExpense:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async updateExpense(req, res) {
    try {
      const { id } = req.params;
      const { amount, category, description, date } = req.body;
      const expenseDate = formatToMySQLDate(date || new Date().toISOString().split('T')[0]);

      await pool.query(
        `UPDATE expenses SET amount = $1, category = $2, description = $3, expense_date = $4 WHERE id::text = $5`,
        [Number(amount) || 0, category || 'OTROS', description || '', expenseDate, String(id)]
      );

      return res.json({ success: true, message: 'Gasto actualizado', id, amount: Number(amount) || 0, category: category || 'OTROS', description: description || '', date: expenseDate });
    } catch (error) {
      console.error('Error in updateExpense:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async getTodayCollections(req, res) {
    try {
      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      const userId = req.user ? req.user.id : null;
      let rows;
      const baseSelect = `
        SELECT l.*, c.name AS joined_client_name, c.alias AS joined_client_alias, c.phone AS joined_client_phone, c.address AS joined_client_address, c.route_order AS joined_client_route_order 
        FROM loans l 
        LEFT JOIN clients c ON l.client_id::text = c.id::text
      `;
      if (isCobrador && userId) {
        ({ rows } = await pool.query(
          `${baseSelect} WHERE (l.is_archived = false OR l.is_archived IS NULL) AND (l.assigned_to_user_id::text = $1 OR l.assigned_to::text = $2) ORDER BY COALESCE(c.route_order, 0) ASC, l.id DESC`,
          [String(userId), String(userId)]
        ));
      } else {
        ({ rows } = await pool.query(`${baseSelect} WHERE l.is_archived = false OR l.is_archived IS NULL ORDER BY COALESCE(c.route_order, 0) ASC, l.id DESC`));
      }
      
      const loans = rows.map(mapRowToLoan);
      const activeLoans = loans.filter((l) => l.status !== 'PAID' && !l.isArchived);

      const { rows: pRows } = await pool.query('SELECT * FROM payments');
      const payments = pRows.map(mapRowToPayment);
      const todayStr = new Date().toISOString().split('T')[0];

      const result = activeLoans.map((loan) => {
        const todayPayments = payments.filter((p) => p.loanId === loan.id && p.date === todayStr);
        const amountPaidToday = todayPayments.reduce((acc, curr) => acc + curr.amount, 0);
        const isPaidToday = amountPaidToday >= loan.dailyPaymentAmount || loan.remainingAmount === 0;
        return { loan, isPaidToday, amountPaidToday };
      });

      return res.json(result);
    } catch (error) {
      console.error('Error in getTodayCollections:', error);
      return res.json([]);
    }
  },

  async getAlerts(req, res) {
    try {
      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      const userId = req.user ? req.user.id : null;
      let rows = [];

      if (isCobrador && userId) {
        const { rows: r } = await pool.query(`
          SELECT l.*, c.name AS joined_client_name, c.phone AS joined_client_phone, c.address AS joined_client_address
          FROM loans l
          LEFT JOIN clients c ON l.client_id::text = c.id::text
          WHERE (l.is_archived = false OR l.is_archived IS NULL)
            AND (l.assigned_to_user_id::text = $1 OR l.assigned_to::text = $2)
        `, [String(userId), String(userId)]);
        rows = r;
      } else {
        const { rows: r } = await pool.query(`
          SELECT l.*, c.name AS joined_client_name, c.phone AS joined_client_phone, c.address AS joined_client_address
          FROM loans l
          LEFT JOIN clients c ON l.client_id::text = c.id::text
          WHERE l.is_archived = false OR l.is_archived IS NULL
        `);
        rows = r;
      }
      const loans = rows.map(mapRowToLoan);
      const activeLoans = loans.filter((l) => l.status !== 'PAID' && !l.isArchived);
      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr);

      const alerts = [];
      activeLoans.forEach((loan) => {
        const due = new Date(loan.dueDate);
        const diffMs = due.getTime() - today.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        let type = null;
        if (diffDays < 0 || loan.status === 'OVERDUE') type = 'OVERDUE';
        else if (diffDays === 0) type = 'DUE_TODAY';
        else if (diffDays === 1) type = 'EXPIRING_SOON';

        if (type) {
          alerts.push({
            id: `alert_${loan.id}`,
            loanId: loan.id,
            clientId: loan.clientId,
            clientName: loan.clientName,
            clientPhone: loan.clientPhone,
            type,
            daysDifference: diffDays,
            remainingAmount: loan.remainingAmount,
            totalToPay: loan.totalToPay,
            dueDate: loan.dueDate
          });
        }
      });

      return res.json(alerts.sort((a, b) => a.daysDifference - b.daysDifference));
    } catch (error) {
      console.error('Error in getAlerts:', error);
      return res.json([]);
    }
  },

  async getDashboardSummary(req, res) {
    try {
      let loans = [];
      let payments = [];

      // 1. Consulta de Préstamos Segura
      try {
        const { rows: lRows } = await pool.query(`
          SELECT l.*, COALESCE(c.name, 'Cliente') AS client_name, COALESCE(c.alias, '') AS joined_client_alias
          FROM loans l
          LEFT JOIN clients c ON l.client_id::text = c.id::text
          ORDER BY l.created_at DESC
        `);
        loans = (lRows || []).map(mapRowToLoan);
      } catch (errLoan) {
        console.error("[ERROR DB LOANS IN SUMMARY]:", errLoan.message);
      }

      // 2. Consulta de Pagos Recientes Segura
      try {
        const { rows: pRows } = await pool.query(`
          SELECT p.*, COALESCE(c.name, 'Cliente') AS client_name, COALESCE(u.name, 'Admin') AS collector_name
          FROM payments p
          LEFT JOIN clients c ON p.client_id::text = c.id::text
          LEFT JOIN users u ON p.collected_by_user_id::text = u.id::text
          ORDER BY p.payment_date DESC LIMIT 15
        `);
        payments = (pRows || []).map(mapRowToPayment);
      } catch (errPay) {
        console.error("[ERROR DB PAYMENTS IN SUMMARY]:", errPay.message);
      }

      // 3. Cálculos Seguros (Sin riesgo de undefined o NaN)
      const activeLoans = loans.filter((l) => l && l.status === 'ACTIVE');
      const totalCapitalLent = loans.reduce((sum, l) => sum + Number(l.capital || l.amount || 0), 0);
      const totalEstimatedProfit = loans.reduce((sum, l) => sum + Number(l.interestAmount || 0), 0);

      const todayStr = new Date().toISOString().split('T')[0];
      let collectedToday = 0;

      try {
        const { rows: sumRows } = await pool.query(
          `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_date::text LIKE $1`,
          [`${todayStr}%`]
        );
        collectedToday = Number(Number(sumRows[0]?.total || 0).toFixed(2));
      } catch (errSum) {
        console.error("[ERROR DB SUM TODAY IN SUMMARY]:", errSum.message);
      }

      return res.json({
        totalCapitalLent,
        totalEstimatedProfit,
        collectedToday,
        todayCollected: collectedToday,
        pendingClientsTodayCount: 0,
        totalActiveLoansCount: activeLoans.length,
        overdueCount: loans.filter(l => l && l.status === 'OVERDUE').length,
        expiringSoonCount: 0,
        collectionProgressPercent: 100,
        recentLoans: loans.slice(0, 10),
        recentPayments: payments,
        cobros: payments,
        payments
      });
    } catch (error) {
      console.error("[ERROR FATAL DASHBOARD SUMMARY]:", error);
      // Responder siempre un JSON válido en lugar de HTTP 500
      return res.json({
        totalCapitalLent: 0,
        totalEstimatedProfit: 0,
        collectedToday: 0,
        todayCollected: 0,
        pendingClientsTodayCount: 0,
        totalActiveLoansCount: 0,
        overdueCount: 0,
        expiringSoonCount: 0,
        collectionProgressPercent: 0,
        recentLoans: [],
        recentPayments: [],
        cobros: [],
        payments: []
      });
    }
  },

  // GET /api/reports/financial
  async getFinancialReport(req, res) {
    try {
      const period = req.query.period || 'WEEKLY';
      let loans = [];
      let payments = [];
      let expenses = [];

      try {
        const { rows: lRows } = await pool.query(`SELECT * FROM loans`);
        loans = (lRows || []).map(mapRowToLoan);
      } catch (_) {}

      try {
        const { rows: pRows } = await pool.query(`SELECT * FROM payments`);
        payments = (pRows || []).map(mapRowToPayment);
      } catch (_) {}

      try {
        const { rows: eRows } = await pool.query(`SELECT * FROM expenses`);
        expenses = (eRows || []).map(mapRowToExpense);
      } catch (_) {}

      const capitalInvested = loans.reduce((sum, l) => sum + Number(l.capital || l.amount || 0), 0);
      const principalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      return res.json({
        period,
        capitalInvested,
        realCollected: principalCollected,
        principalCollected,
        totalExpenses,
        expensesList: expenses
      });
    } catch (error) {
      console.error("[ERROR FATAL FINANCIAL REPORT]:", error);
      return res.json({
        period: req.query.period || 'WEEKLY',
        capitalInvested: 0,
        realCollected: 0,
        principalCollected: 0,
        totalExpenses: 0,
        expensesList: []
      });
    }
  },

  async seedDatabase(req, res) {
    if (process.env.NODE_ENV === 'production') {
      const adminSecret = process.env.ADMIN_SECRET;
      const requestSecret = req.headers['x-admin-secret'];
      if (!adminSecret || requestSecret !== adminSecret) {
        return res.status(403).json({ error: 'Operación no permitida en producción sin clave administrativa' });
      }
    }
    try {
      await pool.query('DELETE FROM payments');
      await pool.query('DELETE FROM expenses');
      await pool.query('DELETE FROM loans');
      await pool.query('DELETE FROM clients');
      return res.json({ success: true, message: 'Base de datos limpiada correctamente' });
    } catch (error) {
      console.error('Error in seedDatabase:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async getCollectorStats(req, res) {
    try {
      const { rows: collectors } = await pool.query(`SELECT id, name, email, role FROM users ORDER BY name ASC`);
      const stats = collectors.map((c) => ({ id: c.id, name: c.name, email: c.email, role: c.role, collectedToday: 0, collectedTotal: 0, assignedClients: 0 }));
      return res.json({ success: true, stats });
    } catch (error) {
      console.error('Error in getCollectorStats:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async getCollectorActivity(req, res) {
    try {
      return res.json({ success: true, activities: [] });
    } catch (error) {
      console.error('Error in getCollectorActivity:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async getCollectorsList(req, res) {
    try {
      const { rows } = await pool.query(`SELECT id, name, email, role, created_at FROM users ORDER BY name ASC`);
      return res.json({ success: true, collectors: rows, users: rows, data: rows });
    } catch (error) {
      console.error('Error in getCollectorsList:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async getPortfolioByCollector(req, res) {
    try {
      const { rows: clientRows } = await pool.query(`SELECT * FROM clients ORDER BY id DESC`);
      const { rows: loanRows } = await pool.query(`
        SELECT l.*, c.name AS joined_client_name, c.alias AS joined_client_alias, c.phone AS joined_client_phone, c.address AS joined_client_address 
        FROM loans l LEFT JOIN clients c ON l.client_id::text = c.id::text ORDER BY l.id DESC
      `);
      return res.json({ success: true, clients: clientRows.map(mapRowToClient), loans: loanRows.map(mapRowToLoan), collectorId: 'ALL' });
    } catch (error) {
      console.error('Error in getPortfolioByCollector:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  async assignPortfolio(req, res) {
    return res.json({ success: true, message: 'Portfolio asignado' });
  },

  async getPaymentHistory(req, res) {
    try {
      const { rows } = await pool.query(`
        SELECT p.*, c.name as joined_client_name, u.name as collector_name 
        FROM payments p
        LEFT JOIN clients c ON p.client_id::text = c.id::text
        LEFT JOIN users u ON p.collected_by_user_id::text = u.id::text
        ORDER BY p.id DESC LIMIT 100
      `);
      return res.json(rows.map(mapRowToPayment));
    } catch (error) {
      console.error('[ERROR getPaymentHistory]:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};

export default loanController;
