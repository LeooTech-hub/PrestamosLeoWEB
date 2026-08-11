import pool from '../config/db.js';
import crypto from 'crypto';

function generateUUID() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
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
  if (userRole === 'ADMIN' && userId) {
    return userId;
  }
  if (userRole === 'COBRADOR' && userId) {
    return userId;
  }
  return userId || 1;
}

function mapRowToClient(row) {
  const dniVal = row.dni ?? row.documento ?? row.identification ?? undefined;
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    alias: row.alias ? String(row.alias) : undefined,
    phone: String(row.phone || ''),
    address: String(row.address || ''),
    dni: dniVal ? String(dniVal) : undefined,
    documento: row.documento ? String(row.documento) : dniVal ? String(dniVal) : undefined,
    identification: row.identification ? String(row.identification) : dniVal ? String(dniVal) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    status: row.status || 'ACTIVE',
    routeOrder: Number(row.route_order ?? row.routeOrder ?? 0),
    assignedTo: row.assigned_to || row.assigned_to_user_id || undefined,
    assignedToName: row.assigned_to_name || row.collector_name || undefined,
    createdBy: row.created_by || row.created_by_user_id || undefined
  };
}

function mapRowToLoan(row) {
  const capital = Number(row.capital ?? row.amount_borrowed ?? 0);
  const interestRate = Number(row.interest_rate ?? 20);
  const interestAmount = Number(row.interest_amount ?? Math.round(capital * 0.20));
  const penaltyAmount = Number(row.penalty_amount ?? row.penaltyAmount ?? row.mora ?? 0);
  const totalToPay = Number(row.total_to_pay ?? row.total_amount ?? capital + interestAmount + penaltyAmount);
  const paymentDays = Number(row.payment_days ?? row.days_agreed ?? 20);
  const dailyPaymentAmount = Number(row.daily_payment_amount ?? row.daily_payment ?? Math.round(totalToPay / (paymentDays || 1)));

  const clientName = String(row.client_name || row.joined_client_name || row.name || 'Cliente');
  const clientAlias = row.client_alias || row.joined_client_alias || row.alias || undefined;
  const clientPhone = String(row.client_phone || row.joined_client_phone || row.phone || '');
  const clientAddress = String(row.client_address || row.joined_client_address || row.address || '');
  const routeOrder = Number(row.route_order ?? row.joined_client_route_order ?? 0);

  return {
    id: String(row.id || ''),
    clientId: String(row.client_id || ''),
    clientName,
    clientAlias: clientAlias ? String(clientAlias) : undefined,
    clientPhone,
    clientAddress,
    routeOrder,
    capital,
    interestRate,
    interestAmount,
    penaltyAmount,
    totalToPay,
    paymentDays,
    dailyPaymentAmount,
    startDate: String(row.start_date || new Date().toISOString().split('T')[0]),
    dueDate: String(row.due_date || new Date().toISOString().split('T')[0]),
    status: row.status || 'ACTIVE',
    paidAmount: Number(row.paid_amount ?? 0),
    remainingAmount: Number(row.remaining_amount ?? Math.max(0, totalToPay - Number(row.paid_amount ?? 0))),
    paidDaysCount: Number(row.paid_days_count ?? 0),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    lastPaymentDate: row.last_payment_date ? String(row.last_payment_date) : undefined,
    isArchived: Boolean(row.is_archived),
    assignedTo: row.assigned_to || row.assigned_to_user_id || undefined,
    assignedToName: row.assigned_to_name || row.collector_name || undefined,
    createdBy: row.created_by || row.created_by_user_id || undefined
  };
}

function mapRowToPayment(row) {
  const paymentDate = String(row.payment_date || row.date || row.created_at || new Date().toISOString().split('T')[0]).split('T')[0];
  const clientName = String(row.client_name || row.joined_client_name || row.name || 'Cliente');
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
    collectedBy: row.collected_by || row.collected_by_user_id || undefined,
    collected_by: row.collected_by || row.collected_by_user_id || undefined,
    createdBy: row.created_by || undefined,
    created_by: row.created_by || undefined,
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

// Controller Methods
const loanController = {
  // GET /api/clients
  async getClients(req, res) {
    try {
      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      const isTodos = req.query.filter === 'TODOS' || req.query.assignedTo === 'TODOS';
      const userId = req.user ? req.user.id : null;
      let rows = [];

      const baseQuery = `
        SELECT c.id, c.name, c.phone, c.address, c.dni, c.assigned_to_user_id, c.created_at,
               COALESCE(u.name, 'Sin Asignar') AS assigned_to_name
        FROM clients c
        LEFT JOIN users u ON (c.assigned_to_user_id = u.id OR c.assigned_to_user_id::text = u.id::text)
      `;

      if (isCobrador && userId && !isTodos) {
        try {
          const { rows: r } = await pool.query(
            `${baseQuery} WHERE (c.assigned_to = $1 OR c.assigned_to_user_id = $2 OR c.created_by = $3 OR c.created_by_user_id = $4) ORDER BY c.created_at DESC`,
            [userId, userId, userId, userId]
          );
          rows = r || [];
        } catch (err) {
          console.error("[ERROR GET /api/clients COBRADOR]:", err);
          const { rows: r } = await pool.query(`${baseQuery} ORDER BY c.created_at DESC`);
          rows = r || [];
        }
      } else {
        // ADMIN or TODOS: Retorna la totalidad de los 29 clientes sin filtros bloqueantes
        try {
          const { rows: r } = await pool.query(`${baseQuery} ORDER BY c.created_at DESC`);
          rows = r || [];
        } catch (err) {
          console.error("[ERROR GET /api/clients ADMIN]:", err);
          const { rows: r } = await pool.query(`SELECT * FROM clients ORDER BY created_at DESC`);
          rows = r || [];
        }
      }

      console.log("[CLIENTS API] Total clientes retornados:", rows.length);
      return res.json((rows || []).map(mapRowToClient));
    } catch (error) {
      console.error("[ERROR GET /api/clients]:", error);
      return res.json([]);
    }
  },

  // PUT /api/clients/assign
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
        try {
          await client.query(
            `UPDATE clients SET assigned_to = $1, assigned_to_user_id = $2 WHERE id = $3`,
            [assignedVal, assignedVal, String(cid)]
          );
        } catch (_) {
          try {
            await client.query(
              `UPDATE clients SET assigned_to = $1 WHERE id = $2`,
              [assignedVal, String(cid)]
            );
          } catch (__) {}
        }

        try {
          await client.query(
            `UPDATE loans SET assigned_to = $1, assigned_to_user_id = $2 WHERE client_id = $3`,
            [assignedVal, assignedVal, String(cid)]
          );
        } catch (_) {}
      }
      await client.query('COMMIT');

      return res.json({
        success: true,
        message: `${clientIds.length} cliente(s) asignados exitosamente`,
        assignedCount: clientIds.length,
        collectorId: assignedVal
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in assignClients:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // POST /api/clients
  async createClient(req, res) {
    try {
      const name = req.body.name || req.body.nombre || '';
      const alias = req.body.alias || req.body.apodo || '';
      const phone = req.body.phone || req.body.telefono || '';
      const dni = req.body.dni || req.body.documento || '';
      const address = req.body.address || req.body.direccion || '';
      const notes = req.body.notes || req.body.observaciones || '';
      const assigned_to_user_id = req.body.assigned_to_user_id || req.body.assignedTo || req.user?.id || null;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }

      const query = `
        INSERT INTO clients (name, alias, phone, dni, address, notes, assigned_to_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        name.trim(),
        alias.trim(),
        phone.trim(),
        dni.trim(),
        address.trim(),
        notes.trim(),
        assigned_to_user_id
      ];

      const result = await pool.query(query, values);
      const newClient = result.rows[0];

      return res.status(201).json(newClient);
    } catch (error) {
      console.error('[ERROR POST /api/clients]:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/clients/:id
  async updateClient(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { name, alias, phone, address, identification, notes, routeOrder } = req.body;

      await client.query('BEGIN');
      try {
        await client.query(
          `UPDATE clients SET name = $1, alias = $2, phone = $3, address = $4, identification = $5, notes = $6, route_order = $7 WHERE id = $8`,
          [name?.trim() || '', alias?.trim() || null, phone?.trim() || '', address?.trim() || '', identification?.trim() || null, notes?.trim() || null, Number(routeOrder) || 0, id]
        );
      } catch (_) {
        await client.query(
          `UPDATE clients SET name = $1, phone = $2, address = $3, identification = $4, notes = $5 WHERE id = $6`,
          [name?.trim() || '', phone?.trim() || '', address?.trim() || '', identification?.trim() || null, notes?.trim() || null, id]
        );
      }
      await client.query(
        `UPDATE loans SET client_name = $1, client_phone = $2, client_address = $3 WHERE client_id = $4`,
        [name?.trim() || '', phone?.trim() || '', address?.trim() || '', id]
      );
      await client.query(
        `UPDATE payments SET client_name = $1 WHERE client_id = $2`,
        [name?.trim() || '', id]
      );
      await client.query('COMMIT');

      // Log audit
      try {
        const actUserId = req.user?.id || 'unknown';
        const actUserName = req.user?.name || 'Usuario';
        const clientIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || null;
        await pool.query(
          `INSERT INTO activity_logs (user_id, user_name, action_type, description, amount, client_id, ip) VALUES ($1, $2, 'CLIENTE_EDITADO', $3, 0, $4, $5)`,
          [actUserId, actUserName, `Editó datos del cliente ID: ${id}`, id, clientIp]
        );
      } catch (_) {}

      return res.json({ success: true, message: 'Cliente actualizado' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in updateClient:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // PUT /api/clients/reorder
  async updateRouteOrders(req, res) {
    const client = await pool.connect();
    try {
      const { orders } = req.body; // Array of { id, routeOrder }
      if (!Array.isArray(orders)) {
        return res.status(400).json({ error: 'Formato inválido de órdenes' });
      }

      await client.query('BEGIN');
      for (const item of orders) {
        if (item.id) {
          try {
            await client.query(
              `UPDATE clients SET route_order = $1 WHERE id = $2`,
              [Number(item.routeOrder) || 0, item.id]
            );
          } catch (_) {}
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

  // PUT /api/clients/:id/restore
  async restoreClient(req, res) {
    try {
      const { id } = req.params;
      try {
        await pool.query(`UPDATE clients SET status = 'ACTIVE', is_archived = 0 WHERE id = $1`, [id]);
      } catch {
        await pool.query(`UPDATE clients SET status = 'ACTIVE' WHERE id = $1`, [id]);
      }
      return res.json({ success: true, message: 'Cliente restaurado' });
    } catch (error) {
      console.error('Error in restoreClient:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/loans/:id/restore
  async restoreLoan(req, res) {
    try {
      const { id } = req.params;
      await pool.query(`UPDATE loans SET is_archived = 0, status = 'ACTIVE' WHERE id = $1`, [id]);
      return res.json({ success: true, message: 'Préstamo restaurado' });
    } catch (error) {
      console.error('Error in restoreLoan:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // GET /api/trash
  async getTrash(req, res) {
    try {
      let clients = [];
      let loans = [];

      try {
        const { rows: cRows } = await pool.query(
          `SELECT * FROM clients WHERE status = 'INACTIVE' OR is_archived = 1 ORDER BY id DESC`
        );
        clients = cRows.map(mapRowToClient);
      } catch {
        const { rows: cRows } = await pool.query(
          `SELECT * FROM clients WHERE status = 'INACTIVE' ORDER BY id DESC`
        );
        clients = cRows.map(mapRowToClient);
      }

      const { rows: lRows } = await pool.query(
        `SELECT l.*, c.name AS joined_client_name, c.phone AS joined_client_phone, c.address AS joined_client_address 
         FROM loans l 
         LEFT JOIN clients c ON l.client_id = c.id 
         WHERE l.is_archived = 1 
         ORDER BY l.id DESC`
      );
      loans = lRows.map(mapRowToLoan);

      return res.json({ clients, loans });
    } catch (error) {
      console.error('Error in getTrash:', error);
      return res.json({ clients: [], loans: [] });
    }
  },

  // DELETE /api/clients/:id
  async deleteClient(req, res) {
    try {
      const { id } = req.params;
      const mode = req.query.mode || 'ARCHIVE';

      if (mode === 'ARCHIVE') {
        try {
          await pool.query(`UPDATE clients SET status = 'INACTIVE', is_archived = 1 WHERE id = $1`, [id]);
        } catch (_) {
          await pool.query(`UPDATE clients SET status = 'INACTIVE' WHERE id = $1`, [id]);
        }
      } else {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`DELETE FROM payments WHERE client_id = $1`, [id]);
          await client.query(`DELETE FROM loans WHERE client_id = $1`, [id]);
          await client.query(`DELETE FROM clients WHERE id = $1`, [id]);
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

  // GET /api/loans
  async getLoans(req, res) {
    try {
      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      const isTodos = req.query.filter === 'TODOS' || req.query.assignedTo === 'TODOS';
      const userId = req.user ? req.user.id : null;
      const statusFilter = req.query.status;
      const searchFilter = req.query.search;
      let rows = [];

      const baseQuery = `
        SELECT l.*, 
               COALESCE(c.name, l.client_name, 'Cliente') AS client_name,
               c.alias AS joined_client_alias,
               COALESCE(c.phone, l.client_phone) AS joined_client_phone,
               COALESCE(c.address, l.client_address) AS joined_client_address,
               c.route_order AS joined_client_route_order,
               COALESCE(u.name, 'Admin') AS collector_name
        FROM loans l
        LEFT JOIN clients c ON (l.client_id = c.id)
        LEFT JOIN users u ON (l.assigned_to_user_id = u.id OR l.assigned_to = u.id)
      `;

      if (isCobrador && userId && !isTodos) {
        try {
          const { rows: r } = await pool.query(`
            ${baseQuery}
            WHERE (l.assigned_to_user_id = $1 OR l.created_by_user_id = $2 OR l.assigned_to = $3 OR l.created_by = $4)
            ORDER BY l.created_at DESC
          `, [userId, userId, userId, userId]);
          rows = r || [];
        } catch (error) {
          console.error("[ERROR GET /api/loans COBRADOR]:", error);
          try {
            const { rows: r } = await pool.query(`${baseQuery} ORDER BY l.created_at DESC`);
            rows = r || [];
          } catch (innerErr) {
            console.error("[ERROR GET /api/loans]:", innerErr);
            rows = [];
          }
        }
      } else {
        // ADMIN or TODOS: Retorna la totalidad de los 45 préstamos para Administradores
        try {
          let queryStr = `${baseQuery}`;
          const params = [];
          const conditions = [];

          if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'TODOS') {
            conditions.push(`l.status = $${params.length + 1}`);
            params.push(statusFilter);
          }

          if (searchFilter && searchFilter.trim() !== '') {
            conditions.push(`(l.client_name LIKE $${params.length + 1} OR c.name LIKE $${params.length + 2})`);
            params.push(`%${searchFilter.trim()}%`, `%${searchFilter.trim()}%`);
          }

          if (conditions.length > 0) {
            queryStr += ` WHERE ` + conditions.join(' AND ');
          }

          queryStr += ` ORDER BY l.created_at DESC`;

          const { rows: r } = await pool.query(queryStr, params);
          rows = r || [];
        } catch (error) {
          console.error("[ERROR GET /api/loans ADMIN]:", error);
          try {
            const { rows: r } = await pool.query(`${baseQuery} ORDER BY l.created_at DESC`);
            rows = r || [];
          } catch (fallbackErr) {
            console.error("[ERROR GET /api/loans FALLBACK]:", fallbackErr);
            rows = [];
          }
        }
      }

      console.log("[LOANS API] Total préstamos retornados:", rows.length);
      return res.json((rows || []).map(mapRowToLoan));
    } catch (error) {
      console.error("[ERROR GET /api/loans]:", error);
      return res.json([]);
    }
  },

  // POST /api/loans (create loan or create client and loan)
  async createLoan(req, res) {
    return loanController.createClientAndLoan(req, res);
  },

  async createClientAndLoan(req, res) {
    try {
      console.log("[POST /api/loans PAYLOAD]:", req.body);

      const {
        clientName, client_name,
        clientAlias, alias,
        clientPhone, client_phone,
        clientAddress, client_address,
        clientIdentification, client_identification,
        initialPayment, firstPaymentAmount, initialPaymentAmount
      } = req.body || {};

      const userId = req.user ? req.user.id : null;
      const assigned_to_user_id = resolveAssignedUserId(req);

      const finalName = (clientName || client_name)?.trim() || 'Cliente Sin Nombre';
      const finalAlias = (clientAlias || alias)?.trim() || null;
      const finalPhone = (clientPhone || client_phone)?.trim() || '';
      const finalAddress = (clientAddress || client_address)?.trim() || '';
      const finalIdent = (clientIdentification || client_identification)?.trim() || null;

      let client_id = req.body.client_id || req.body.clientId;

      if (!client_id) {
        client_id = `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        try {
          await pool.query(
            `INSERT INTO clients (id, name, alias, phone, address, identification, notes, status, created_at, assigned_to_user_id, created_by_user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', CURRENT_TIMESTAMP, $8, $9)`,
            [client_id, finalName, finalAlias, finalPhone, finalAddress, finalIdent, req.body.notes || req.body.observaciones || null, assigned_to_user_id, userId]
          );
        } catch (_) {
          try {
            await pool.query(
              `INSERT INTO clients (id, name, alias, phone, address, identification, notes, status, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', CURRENT_TIMESTAMP)`,
              [client_id, finalName, finalAlias, finalPhone, finalAddress, finalIdent, req.body.notes || req.body.observaciones || null]
            );
          } catch (__) {}
        }
      } else {
        try {
          await pool.query(
            `UPDATE clients SET name = $1, alias = $2, phone = $3, address = $4, identification = $5 WHERE id = $6`,
            [finalName, finalAlias, finalPhone, finalAddress, finalIdent, client_id]
          );
        } catch (_) {}
      }

      const amount = parseFloat(req.body.amount || req.body.monto || req.body.capital || 0);
      const days = parseInt(req.body.days || req.body.dias || req.body.paymentDays || 20);
      const interest_rate = parseFloat(req.body.interest_rate || req.body.interestRate || 20);

      const total_amount = parseFloat(req.body.total_amount || req.body.totalAmount || req.body.total_to_pay || amount * 1.2);
      const daily_amount = parseFloat(req.body.daily_amount || req.body.dailyAmount || req.body.daily_payment_amount || total_amount / (days || 1));

      const todayStr = new Date().toISOString().split('T')[0];
      const start_date = req.body.start_date || req.body.startDate || todayStr;

      let due_date = req.body.due_date || req.body.dueDate;
      if (!due_date) {
        const start = new Date(start_date);
        const due = new Date(start);
        due.setDate(due.getDate() + days);
        due_date = due.toISOString().split('T')[0];
      }

      const status = req.body.status || 'vigente';
      const notes = req.body.notes || req.body.observaciones || '';

      const loanId = req.body.id || `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const calcInterest = Math.round(amount * (interest_rate / 100));

      let insertedRow = null;

      try {
        const { rows } = await pool.query(
          `INSERT INTO loans (
            id, client_id, client_name, client_phone, client_address,
            capital, amount_borrowed, amount,
            interest_rate, interest_amount, penalty_amount, mora,
            total_to_pay, total_amount,
            payment_days, days_agreed, days,
            daily_payment_amount, daily_payment, daily_amount,
            paid_amount, remaining_amount, paid_days_count,
            start_date, due_date, status, notes, is_archived, created_at,
            assigned_to_user_id, created_by_user_id
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14,
            $15, $16, $17,
            $18, $19, $20,
            $21, $22, $23,
            $24, $25, $26, $27, $28, CURRENT_TIMESTAMP,
            $29, $30
          ) RETURNING *`,
          [
          loanId, client_id, finalName, finalPhone, finalAddress,
          amount, amount, amount,
          interest_rate, calcInterest, 0.00, 0.00,
          total_amount, total_amount,
          days, days, days,
          daily_amount, daily_amount, daily_amount,
          0.00, total_amount, 0,
          start_date, due_date, status, notes, 0,
          assigned_to_user_id, userId]

        );
        insertedRow = rows && rows.length > 0 ? rows[0] : null;
      } catch (err1) {
        try {
          const { rows } = await pool.query(
            `INSERT INTO loans (
              client_id, amount, total_amount, daily_amount, days, interest_rate,
              start_date, due_date, status, assigned_to_user_id, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
            client_id, amount, total_amount, daily_amount, days, interest_rate,
            start_date, due_date, status, assigned_to_user_id, notes]

          );
          insertedRow = rows && rows.length > 0 ? rows[0] : null;
        } catch (err2) {
          console.error("[ERROR POST /api/loans CRÍTICO]:", err1);
          return res.status(500).json({ error: err1.message });
        }
      }

      const numInitialPayment = Number(initialPayment || firstPaymentAmount || initialPaymentAmount) || 0;
      if (numInitialPayment > 0 && userId) {
        const firstPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const nowLimaStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
        const todayLimaStr = nowLimaStr || todayStr;
        try {
          await pool.query(
            `INSERT INTO payments (id, loan_id, client_id, client_name, amount, late_fee, payment_date, date, type, day_number, notes, collected_by, collected_by_user_id, created_by, created_at)
             VALUES ($1, $2, $3, $4, $5, 0.00, $6, $7, 'PARTIAL', 1, 'Primer cobro inicial al crear préstamo', $8, $9, $10, CURRENT_TIMESTAMP)`,
            [firstPaymentId, insertedRow?.id || loanId, client_id, finalName, numInitialPayment, todayLimaStr, todayLimaStr, userId, userId, userId]
          );
        } catch (_) {}
      }

      const createdObj = insertedRow || {
        id: loanId,
        client_id,
        client_name: finalName,
        capital: amount,
        amount,
        total_to_pay: total_amount,
        total_amount,
        daily_payment_amount: daily_amount,
        daily_amount,
        payment_days: days,
        days,
        interest_rate,
        start_date,
        due_date,
        status,
        assigned_to_user_id,
        notes
      };

      return res.status(201).json(mapRowToLoan(createdObj));
    } catch (error) {
      console.error("[ERROR POST /api/loans CRÍTICO]:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/loans/:id
  async updateLoan(req, res) {
    try {
      const { id } = req.params;
      const {
        capital, amount,
        paymentDays, duration_days, days_agreed,
        startDate, start_date,
        dueDate, due_date,
        commission, interest, interestAmount,
        penaltyAmount, penalty_amount, mora,
        notes
      } = req.body;

      const { rows } = await pool.query(`SELECT * FROM loans WHERE id = $1`, [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Préstamo no encontrado' });

      const loan = mapRowToLoan(rows[0]);
      const newCapital = Number(capital ?? amount ?? loan.capital ?? 0);
      const startDateVal = startDate || start_date || loan.startDate;
      const startDateStr = formatToMySQLDate(startDateVal);
      const penaltyVal = Math.max(0, Number(mora ?? penaltyAmount ?? penalty_amount ?? loan.penaltyAmount ?? 0));

      let dueDateStr;
      let newDays;
      const explicitDueDate = dueDate || due_date;
      if (explicitDueDate) {
        dueDateStr = formatToMySQLDate(explicitDueDate);
        const start = new Date(startDateStr);
        const due = new Date(dueDateStr);
        const diffMs = due.getTime() - start.getTime();
        newDays = Math.max(1, Math.round(diffMs / 86_400_000));
      } else {
        newDays = Math.max(1, Number(paymentDays ?? duration_days ?? days_agreed) || loan.paymentDays || 20);
        const start = new Date(startDateStr);
        const due = new Date(start);
        due.setDate(due.getDate() + newDays);
        dueDateStr = due.toISOString().split('T')[0];
      }

      const customInterest = commission ?? interest ?? interestAmount;
      const interestRate = customInterest != null ? null : 20;
      const calculatedInterest = customInterest != null ?
      Math.round(Number(customInterest)) :
      Math.round(newCapital * 0.20);

      const totalToPay = newCapital + calculatedInterest + penaltyVal;
      const dailyPaymentAmount = Math.ceil(totalToPay / (newDays || 1));

      const todayStr = new Date().toISOString().split('T')[0];
      const newRemainingAmount = Math.max(0, totalToPay - loan.paidAmount);
      const newPaidDaysCount = Math.min(newDays, Math.floor(loan.paidAmount / (dailyPaymentAmount || 1)));

      let newStatus = loan.status;
      if (newRemainingAmount <= 0) {
        newStatus = 'PAID';
      } else if (new Date(dueDateStr) < new Date(todayStr)) {
        newStatus = 'OVERDUE';
      } else {
        newStatus = 'ACTIVE';
      }

      await pool.query(
        `UPDATE loans SET 
          capital = $1, amount_borrowed = $2, 
          interest_rate = $3, interest_amount = $4, 
          penalty_amount = $5, mora = $6, 
          total_to_pay = $7, total_amount = $8, 
          payment_days = $9, days_agreed = $10, 
          daily_payment_amount = $11, daily_payment = $12, 
          start_date = $13, due_date = $14, 
          remaining_amount = $15, paid_days_count = $16, 
          status = $17, notes = $18 
        WHERE id = $19`,
        [
        newCapital, newCapital,
        interestRate ?? 0, calculatedInterest,
        penaltyVal, penaltyVal,
        totalToPay, totalToPay,
        newDays, newDays,
        dailyPaymentAmount, dailyPaymentAmount,
        startDateStr, dueDateStr,
        newRemainingAmount, newPaidDaysCount,
        newStatus,
        notes?.trim() || null,
        id]

      );

      const { rows: updatedRows } = await pool.query(
        `SELECT l.*, c.name as joined_client_name, c.alias as joined_client_alias, c.phone as joined_client_phone, c.address as joined_client_address, c.route_order as joined_client_route_order
         FROM loans l
         LEFT JOIN clients c ON l.client_id = c.id
         WHERE l.id = $1`,
        [id]
      );

      const updatedLoan = mapRowToLoan(updatedRows[0] || rows[0]);

      return res.json({
        success: true,
        message: 'Préstamo actualizado exitosamente',
        loan: updatedLoan,
        updatedLoan
      });
    } catch (error) {
      console.error('Error in updateLoan:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // DELETE /api/loans/:id
  async deleteLoan(req, res) {
    try {
      const { id } = req.params;
      const mode = req.query.mode || 'ARCHIVE';

      if (mode === 'ARCHIVE') {
        await pool.query(`UPDATE loans SET is_archived = 1 WHERE id = $1`, [id]);
      } else {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`DELETE FROM payments WHERE loan_id = $1`, [id]);
          await client.query(`DELETE FROM loans WHERE id = $1`, [id]);
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

  // GET /api/payments
  async getPayments(req, res) {
    try {
      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      if (isCobrador) {
        return res.status(403).json({ error: 'Acceso denegado: Los usuarios con rol COBRADOR no tienen permiso para consultar el historial general de cobros.' });
      }

      let rows = [];
      try {
        const { rows: result } = await pool.query(`
          SELECT p.id, p.loan_id, p.client_id, p.amount, p.late_fee,
                 COALESCE(p.payment_date, p.date) as payment_date, p.date, p.created_at, p.notes,
                 p.day_number, p.type, p.collected_by, p.collected_by_user_id,
                 l.daily_payment_amount as daily_amount,
                 COALESCE(c.name, p.client_name, 'Cliente') as client_name,
                 c.alias as client_alias,
                 COALESCE(u.name, 'ADMIN') as collector_name
          FROM payments p
          LEFT JOIN loans l ON p.loan_id = l.id
          LEFT JOIN clients c ON (p.client_id = c.id OR l.client_id = c.id)
          LEFT JOIN users u ON (p.collected_by = u.id OR p.collected_by_user_id = u.id)
          ORDER BY COALESCE(p.payment_date, p.date) DESC, p.created_at DESC, p.id DESC
        `);
        rows = result || [];
      } catch (_) {
        const { rows: result } = await pool.query('SELECT * FROM payments');
        rows = result || [];
      }
      return res.status(200).json(rows.map(mapRowToPayment));
    } catch (error) {
      console.error('Error in getPayments:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // POST /api/payments
  async registerPayment(req, res) {
    const client = await pool.connect();
    try {
      const userId = req.user?.id || 'unknown';
      const userName = req.user?.name || 'Usuario';
      const { loanId, amount, notes, lateFee, mora } = req.body;

      const numericAmount = Number(amount);
      const numericLateFee = Math.max(0, Number(lateFee ?? mora ?? 0));
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'El monto del abono debe ser mayor a 0' });
      }

      const resLoan = await client.query(`SELECT * FROM loans WHERE id = $1`, [loanId]);
      if (resLoan.rows.length === 0) {
        return res.status(404).json({ error: 'Préstamo no encontrado' });
      }

      const loan = mapRowToLoan(resLoan.rows[0]);
      if (loan.status === 'PAID' || loan.remainingAmount <= 0) {
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

      const updatedLoan = {
        ...loan,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paidDaysCount: newPaidDaysCount,
        status: newStatus,
        lastPaymentDate: todayStr
      };

      const isFullDay = numericAmount >= loan.dailyPaymentAmount;
      const paymentId = generateUUID();
      const newPayment = {
        id: paymentId,
        loanId: loan.id,
        clientId: loan.clientId,
        clientName: loan.clientName,
        amount: numericAmount,
        lateFee: numericLateFee,
        date: todayStr,
        type: newRemainingAmount <= 0 ? 'FULL_PAYOFF' : isFullDay ? 'FULL_DAY' : 'PARTIAL',
        dayNumber: newPaidDaysCount + (isFullDay ? 0 : 1),
        notes: notes || (numericLateFee > 0 ? `Pago con mora de S/. ${numericLateFee.toFixed(2)}` : isFullDay ? 'Pago diario completo' : 'Abono parcial')
      };

      await client.query('BEGIN');
      await client.query(
        `UPDATE loans SET paid_amount = $1, remaining_amount = $2, paid_days_count = $3, status = $4, last_payment_date = $5 WHERE id = $6`,
        [newPaidAmount, newRemainingAmount, newPaidDaysCount, newStatus, todayStr, loanId]
      );

      try {
        await client.query(
          `INSERT INTO payments (id, loan_id, client_id, client_name, amount, late_fee, payment_date, type, day_number, notes, collected_by, collected_by_user_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [newPayment.id, newPayment.loanId, newPayment.clientId, newPayment.clientName, newPayment.amount, newPayment.lateFee, newPayment.date, newPayment.type, newPayment.dayNumber, newPayment.notes || null, userId, userId, userId]
        );
      } catch (_) {
        try {
          await client.query(
            `INSERT INTO payments (id, loan_id, client_id, client_name, amount, late_fee, payment_date, type, day_number, notes, collected_by_user_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [newPayment.id, newPayment.loanId, newPayment.clientId, newPayment.clientName, newPayment.amount, newPayment.lateFee, newPayment.date, newPayment.type, newPayment.dayNumber, newPayment.notes || null, userId, userId]
          );
        } catch (__) {
          try {
            await client.query(
              `INSERT INTO payments (id, loan_id, client_id, client_name, amount, late_fee, date, type, day_number, notes, collected_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [newPayment.id, newPayment.loanId, newPayment.clientId, newPayment.clientName, newPayment.amount, newPayment.lateFee, newPayment.date, newPayment.type, newPayment.dayNumber, newPayment.notes || null, userId]
            );
          } catch (___) {}
        }
      }
      await client.query('COMMIT');

      try {
        const clientIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || null;
        await pool.query(
          `INSERT INTO activity_logs (user_id, user_name, action_type, description, amount, client_id, ip) VALUES ($1, $2, 'PAGO_REGISTRADO', $3, $4, $5, $6)`,
          [userId, userName, `Cobró S/. ${numericAmount.toFixed(2)} a ${loan.clientName}`, numericAmount, loan.clientId, clientIp]
        );
      } catch (_) {}

      return res.status(201).json({ payment: newPayment, updatedLoan });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ERROR POST /api/payments]:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // POST /api/loans/:id/revert-payment or POST /api/payments/revert
  async revertLastPayment(req, res) {
    const client = await pool.connect();
    try {
      const loanId = req.params.id || req.body.loanId;
      if (!loanId) {
        return res.status(400).json({ error: 'ID de préstamo requerido' });
      }

      const resLoan = await client.query(`SELECT * FROM loans WHERE id = $1`, [loanId]);
      if (resLoan.rows.length === 0) {
        return res.status(404).json({ error: 'Préstamo no encontrado' });
      }

      const loan = mapRowToLoan(resLoan.rows[0]);

      if (loan.paidAmount <= 0) {
        return res.status(400).json({ error: 'El préstamo no tiene pagos para revertir' });
      }

      const resPay = await client.query(`SELECT * FROM payments WHERE loan_id = $1`, [loanId]);
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

        await client.query('BEGIN');
        await client.query(`DELETE FROM payments WHERE id = $1`, [lastPayment.id]);

        if (mappedPayments.length > 1) {
          newLastPaymentDate = mappedPayments[1].date;
        }
      } else {
        revertedAmount = loan.dailyPaymentAmount || loan.paidAmount;
        await client.query('BEGIN');
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
        `UPDATE loans SET paid_amount = $1, remaining_amount = $2, paid_days_count = $3, status = $4, last_payment_date = $5 WHERE id = $6`,
        [newPaidAmount, newRemainingAmount, newPaidDaysCount, newStatus, newLastPaymentDate, loanId]
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

  // DELETE /api/payments/:id
  async deletePayment(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;

      const resPay = await client.query(`SELECT * FROM payments WHERE id = $1`, [id]);
      if (resPay.rows.length === 0) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      const payment = mapRowToPayment(resPay.rows[0]);
      const loanId = payment.loanId;

      const resLoan = await client.query(`SELECT * FROM loans WHERE id = $1`, [loanId]);
      if (resLoan.rows.length === 0) {
        return res.status(404).json({ error: 'Préstamo asociado no encontrado' });
      }

      const loan = mapRowToLoan(resLoan.rows[0]);

      await client.query('BEGIN');
      await client.query(`DELETE FROM payments WHERE id = $1`, [id]);

      const remRes = await client.query(`SELECT * FROM payments WHERE loan_id = $1`, [loanId]);
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
        `UPDATE loans SET paid_amount = $1, remaining_amount = $2, paid_days_count = $3, status = $4, last_payment_date = $5 WHERE id = $6`,
        [newPaidAmount, newRemainingAmount, newPaidDaysCount, newStatus, newLastPaymentDate, loanId]
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

  // GET /api/expenses
  async getExpenses(req, res) {
    try {
      let rows = [];
      try {
        const { rows: result } = await pool.query('SELECT * FROM expenses ORDER BY id DESC');
        rows = result;
      } catch (_) {
        const { rows: result } = await pool.query('SELECT * FROM expenses');
        rows = result;
      }
      return res.json(rows.map(mapRowToExpense));
    } catch (error) {
      console.error('Error in getExpenses:', error);
      return res.json([]);
    }
  },

  // POST /api/expenses
  async addExpense(req, res) {
    try {
      const { amount, category, description, date } = req.body;
      const id = generateUUID();
      const createdAt = new Date().toISOString();
      const expenseDate = formatToMySQLDate(date);

      try {
        await pool.query(
          `INSERT INTO expenses (id, amount, category, description, expense_date, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, amount || 0, category || 'OTROS', description || '', expenseDate, createdAt]
        );
      } catch (_) {
        await pool.query(
          `INSERT INTO expenses (id, amount, category, description, date, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, amount || 0, category || 'OTROS', description || '', expenseDate, createdAt]
        );
      }

      return res.status(201).json({
        id,
        amount: amount || 0,
        category: category || 'OTROS',
        description: description || '',
        date: expenseDate,
        createdAt
      });
    } catch (error) {
      console.error('Error in addExpense:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // DELETE /api/expenses/:id
  async deleteExpense(req, res) {
    try {
      const { id } = req.params;
      await pool.query(`DELETE FROM expenses WHERE id = $1`, [id]);
      return res.json({ success: true, message: 'Gasto eliminado' });
    } catch (error) {
      console.error('Error in deleteExpense:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/expenses/:id
  async updateExpense(req, res) {
    try {
      const { id } = req.params;
      const { amount, category, description, date } = req.body;
      const expenseDate = formatToMySQLDate(date || new Date().toISOString().split('T')[0]);

      try {
        await pool.query(
          `UPDATE expenses SET amount = $1, category = $2, description = $3, expense_date = $4 WHERE id = $5`,
          [Number(amount) || 0, category || 'OTROS', description || '', expenseDate, id]
        );
      } catch (_) {
        await pool.query(
          `UPDATE expenses SET amount = $1, category = $2, description = $3, date = $4 WHERE id = $5`,
          [Number(amount) || 0, category || 'OTROS', description || '', expenseDate, id]
        );
      }

      return res.json({
        success: true,
        message: 'Gasto actualizado',
        id,
        amount: Number(amount) || 0,
        category: category || 'OTROS',
        description: description || '',
        date: expenseDate
      });
    } catch (error) {
      console.error('Error in updateExpense:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/payments/:id
  async updatePayment(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { amount, date, notes } = req.body;

      const resPay = await client.query(`SELECT * FROM payments WHERE id = $1`, [id]);
      if (resPay.rows.length === 0) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      const existingPayment = mapRowToPayment(resPay.rows[0]);
      const loanId = existingPayment.loanId;

      const resLoan = await client.query(`SELECT * FROM loans WHERE id = $1`, [loanId]);
      if (resLoan.rows.length === 0) {
        return res.status(404).json({ error: 'Préstamo asociado no encontrado' });
      }

      const loan = mapRowToLoan(resLoan.rows[0]);

      const newAmount = amount !== undefined ? Number(amount) : existingPayment.amount;
      const newDate = date || existingPayment.date;
      const newNotes = notes !== undefined ? notes : existingPayment.notes;

      if (isNaN(newAmount) || newAmount <= 0) {
        return res.status(400).json({ error: 'El monto del abono debe ser mayor a 0' });
      }

      await client.query('BEGIN');

      try {
        await client.query(
          `UPDATE payments SET amount = $1, payment_date = $2, notes = $3 WHERE id = $4`,
          [newAmount, newDate, newNotes || null, id]
        );
      } catch (_) {
        await client.query(
          `UPDATE payments SET amount = $1, date = $2, notes = $3 WHERE id = $4`,
          [newAmount, newDate, newNotes || null, id]
        );
      }

      const remRes = await client.query(`SELECT * FROM payments WHERE loan_id = $1`, [loanId]);
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
        `UPDATE loans SET paid_amount = $1, remaining_amount = $2, paid_days_count = $3, status = $4, last_payment_date = $5 WHERE id = $6`,
        [newPaidAmount, newRemainingAmount, newPaidDaysCount, newStatus, newLastPaymentDate, loanId]
      );

      await client.query('COMMIT');

      const updatedPayment = {
        ...existingPayment,
        amount: newAmount,
        date: newDate,
        notes: newNotes
      };

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
        message: 'Pago actualizado correctamente',
        payment: updatedPayment,
        updatedLoan
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in updatePayment:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // GET /api/today-collections
  async getTodayCollections(req, res) {
    try {
      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      const userId = req.user ? req.user.id : null;
      let rows;
      const baseSelect = `SELECT l.*, c.name AS joined_client_name, c.alias AS joined_client_alias, c.phone AS joined_client_phone, c.address AS joined_client_address, c.route_order AS joined_client_route_order FROM loans l LEFT JOIN clients c ON l.client_id = c.id`;
      if (isCobrador && userId) {
        try {
          ({ rows } = await pool.query(
            `${baseSelect} WHERE (l.is_archived = 0 OR l.is_archived IS NULL) AND (l.assigned_to_user_id = $1 OR l.created_by_user_id = $2 OR l.assigned_to = $3 OR l.created_by = $4) ORDER BY COALESCE(c.route_order, 0) ASC, l.id DESC`,
            [userId, userId, userId, userId]
          ));
        } catch (_) {
          ({ rows } = await pool.query(`${baseSelect} WHERE l.is_archived = 0 OR l.is_archived IS NULL ORDER BY COALESCE(c.route_order, 0) ASC, l.id DESC`));
        }
      } else {
        ({ rows } = await pool.query(`${baseSelect} WHERE l.is_archived = 0 OR l.is_archived IS NULL ORDER BY COALESCE(c.route_order, 0) ASC, l.id DESC`));
      }
      const loans = rows.map(mapRowToLoan);
      const activeLoans = loans.filter((l) => l.status !== 'PAID' && !l.isArchived);

      let pRows = [];
      try {
        if (isCobrador && userId && loans.length > 0) {
          const loanIds = loans.map((l) => l.id);
          const placeholders = loanIds.map((_, i) => '$' + (params.length + i + 1)).join(',');
          const { rows: result } = await pool.query(`SELECT * FROM payments WHERE loan_id IN (${placeholders})`, loanIds);
          pRows = result;
        } else {
          const { rows: result } = await pool.query('SELECT * FROM payments');
          pRows = result;
        }
      } catch (_) {
        try {
          const { rows: result } = await pool.query('SELECT * FROM payments');
          pRows = result;
        } catch (__) {}
      }
      const payments = pRows.map(mapRowToPayment);

      const todayStr = new Date().toISOString().split('T')[0];

      const result = activeLoans.map((loan) => {
        const todayPayments = payments.filter((p) => p.loanId === loan.id && p.date === todayStr);
        const amountPaidToday = todayPayments.reduce((acc, curr) => acc + curr.amount, 0);
        const isPaidToday = amountPaidToday >= loan.dailyPaymentAmount || loan.remainingAmount === 0;

        return {
          loan,
          isPaidToday,
          amountPaidToday
        };
      });

      return res.json(result);
    } catch (error) {
      console.error('Error in getTodayCollections:', error);
      return res.json([]);
    }
  },

  // GET /api/alerts
  async getAlerts(req, res) {
    try {
      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      const userId = req.user ? req.user.id : null;
      let rows = [];

      if (isCobrador && userId) {
        try {
          const { rows: r } = await pool.query(`
            SELECT l.*, c.name AS joined_client_name, c.phone AS joined_client_phone, c.address AS joined_client_address
            FROM loans l
            LEFT JOIN clients c ON l.client_id = c.id
            WHERE (l.is_archived = 0 OR l.is_archived IS NULL)
              AND (l.assigned_to_user_id = $1 OR l.created_by_user_id = $2 OR l.assigned_to = $3 OR l.created_by = $4)
          `, [userId, userId, userId, userId]);
          rows = r;
        } catch (_) {
          rows = [];
        }
      } else {
        const { rows: r } = await pool.query(`
          SELECT l.*, c.name AS joined_client_name, c.phone AS joined_client_phone, c.address AS joined_client_address
          FROM loans l
          LEFT JOIN clients c ON l.client_id = c.id
          WHERE l.is_archived = 0 OR l.is_archived IS NULL
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
        if (diffDays < 0 || loan.status === 'OVERDUE') {
          type = 'OVERDUE';
        } else if (diffDays === 0) {
          type = 'DUE_TODAY';
        } else if (diffDays === 1) {
          type = 'EXPIRING_SOON';
        }

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

  // GET /api/dashboard/summary
  async getDashboardSummary(req, res) {
    try {
      console.log("[DASHBOARD] Usuario en sesión:", req.user);
      console.log("--- AUDITORÍA DE PAGOS REGISTRADOS HOY ---");
      try {
        const { rows: pagosAudit } = await pool.query('SELECT * FROM payments ORDER BY id DESC LIMIT 10');
        console.dir(pagosAudit, { depth: null });
        const { rows: cntAudit } = await pool.query('SELECT COUNT(*) AS total FROM payments');
        console.log("Total pagos en tabla payments:", cntAudit[0]?.total);
        const { rows: loansAudit } = await pool.query("SELECT * FROM loans WHERE client_name LIKE '%PRUEBA%' OR id IN (SELECT loan_id FROM payments)");
        console.log("Préstamos auditados:", loansAudit.length);
      } catch (auditErr) {
        console.error("Error en auditoría:", auditErr);
      }

      const isCobrador = req.user && String(req.user.role || '').toUpperCase() === 'COBRADOR';
      const userId = req.user ? req.user.id : null;
      let lRows = [];
      if (isCobrador && userId) {
        try {
          ({ rows: lRows } = await pool.query(
            `SELECT l.*, c.name as joined_client_name, c.alias as joined_client_alias, c.phone as joined_client_phone, c.address as joined_client_address, c.route_order as joined_client_route_order
             FROM loans l
             LEFT JOIN clients c ON l.client_id = c.id
             WHERE (l.is_archived = 0 OR l.is_archived IS NULL)
               AND (l.assigned_to_user_id = $1 OR l.created_by_user_id = $2 OR l.assigned_to = $3 OR l.created_by = $4)
             ORDER BY l.created_at DESC`,
            [userId, userId, userId, userId]
          ));
        } catch (err) {
          console.error('[ERROR DASHBOARD LOANS COBRADOR]:', err);
          try {
            ({ rows: lRows } = await pool.query(
              `SELECT l.*, c.name as joined_client_name, c.alias as joined_client_alias, c.phone as joined_client_phone, c.address as joined_client_address, c.route_order as joined_client_route_order
               FROM loans l
               LEFT JOIN clients c ON l.client_id = c.id
               WHERE l.is_archived = 0 OR l.is_archived IS NULL
               ORDER BY l.created_at DESC`
            ));
          } catch (innerErr) {
            console.error('[ERROR DASHBOARD LOANS]:', innerErr);
            lRows = [];
          }
        }
      } else {
        try {
          ({ rows: lRows } = await pool.query(
            `SELECT l.*, c.name as joined_client_name, c.alias as joined_client_alias, c.phone as joined_client_phone, c.address as joined_client_address, c.route_order as joined_client_route_order
             FROM loans l
             LEFT JOIN clients c ON l.client_id = c.id
             WHERE l.is_archived = 0 OR l.is_archived IS NULL
             ORDER BY l.created_at DESC`
          ));
        } catch (err) {
          console.error('[ERROR DASHBOARD LOANS ADMIN]:', err);
          lRows = [];
        }
      }
      const loans = (lRows || []).map(mapRowToLoan);
      const activeLoans = loans.filter((l) => l.status !== 'PAID' && !l.isArchived);

      let pRows = [];
      try {
        if (isCobrador && userId) {
          try {
            const { rows: result } = await pool.query(
              `SELECT 
                 p.id, p.loan_id, p.client_id, p.amount, p.late_fee, p.date, p.type, p.day_number, p.notes, p.created_at, p.collected_by, p.collected_by_user_id, p.created_by,
                 COALESCE(c.name, l.client_name, p.client_name, 'Cliente') AS client_name,
                 COALESCE(u.name, 'ADMIN') AS collector_name
               FROM payments p
               LEFT JOIN loans l ON p.loan_id = l.id
               LEFT JOIN clients c ON (p.client_id = c.id OR l.client_id = c.id)
               LEFT JOIN users u ON (p.collected_by = u.id OR p.collected_by_user_id = u.id)
               WHERE p.collected_by = $1 
                  OR p.collected_by_user_id = $2 
                  OR p.created_by = $3 
                  OR l.assigned_to_user_id = $4 
                  OR l.assigned_to = $5
               ORDER BY p.date DESC, p.created_at DESC, p.id DESC
               LIMIT 15`,
              [userId, userId, userId, userId, userId]
            );
            pRows = result;
          } catch (err) {
            console.error('[ERROR PAYMENTS COBRADOR]:', err);
            try {
              const { rows: result } = await pool.query(
                `SELECT p.*, COALESCE(p.client_name, 'Cliente') AS client_name, 'ADMIN' AS collector_name
                 FROM payments p 
                 WHERE p.collected_by = $1 OR p.collected_by_user_id = $2 OR p.created_by = $3 
                 ORDER BY p.date DESC, p.created_at DESC, p.id DESC LIMIT 15`,
                [userId, userId, userId]
              );
              pRows = result;
            } catch (__) {
              pRows = [];
            }
          }
        } else {
          // ADMIN: Direct SQL without WHERE clause, joining loans, clients and users, ordered by date DESC, created_at DESC
          try {
            const { rows: result } = await pool.query(
              `SELECT 
                 p.id, p.loan_id, p.client_id, p.amount, p.late_fee, p.date, p.type, p.day_number, p.notes, p.created_at, p.collected_by, p.collected_by_user_id, p.created_by,
                 COALESCE(c.name, l.client_name, p.client_name, 'Cliente') AS client_name,
                 COALESCE(u.name, 'ADMIN') AS collector_name
               FROM payments p
               LEFT JOIN loans l ON p.loan_id = l.id
               LEFT JOIN clients c ON (p.client_id = c.id OR l.client_id = c.id)
               LEFT JOIN users u ON (p.collected_by = u.id OR p.collected_by_user_id = u.id)
               ORDER BY p.date DESC, p.created_at DESC, p.id DESC
               LIMIT 15`
            );
            pRows = result;
          } catch (err) {
            console.error('[ERROR PAYMENTS ADMIN]:', err);
            const { rows: result } = await pool.query(
              `SELECT p.* FROM payments p ORDER BY p.date DESC, p.created_at DESC, p.id DESC LIMIT 15`
            );
            pRows = result;
          }
        }
      } catch (err) {
        console.error('[ERROR QUERY PAYMENTS]:', err);
        pRows = [];
      }
      const payments = pRows.map(mapRowToPayment);

      console.log("[DASHBOARD] Cobros encontrados:", payments.length, payments);

      const totalCapitalLent = loans.reduce((sum, l) => sum + (l.capital || 0), 0);
      const totalEstimatedProfit = loans.reduce((sum, l) => sum + (l.interestAmount || 0), 0);

      let collectedTodayRaw = 0;
      try {
        if (isCobrador && userId) {
          const { rows: sumRows } = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total
             FROM payments
             WHERE (collected_by = $1 OR collected_by_user_id = $2 OR created_by = $3)
               AND (DATE(created_at) = CURRENT_DATE OR DATE(date) = CURRENT_DATE)`,
            [userId, userId, userId]
          );
          collectedTodayRaw = sumRows[0]?.total;
        } else {
          const { rows: sumRows } = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total
             FROM payments
             WHERE DATE(created_at) = CURRENT_DATE OR DATE(date) = CURRENT_DATE`
          );
          collectedTodayRaw = sumRows[0]?.total;
        }
      } catch (err) {
        console.error('[ERROR SUM RECAUDADO HOY]:', err);
        try {
          const { rows: sumRows } = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM payments`
          );
          collectedTodayRaw = sumRows[0]?.total;
        } catch (_) {
          collectedTodayRaw = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        }
      }

      const collectedToday = collectedTodayRaw === null || collectedTodayRaw === undefined || isNaN(Number(collectedTodayRaw)) ?
      0.00 :
      Number(Number(collectedTodayRaw).toFixed(2));

      const nowLimaStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
      const todayStr = nowLimaStr || new Date().toISOString().split('T')[0];

      const todayCollections = activeLoans.map((loan) => {
        const todayPayments = payments.filter((p) => p.loanId === loan.id && (p.date || '').split('T')[0] === todayStr);
        const amountPaidToday = todayPayments.reduce((acc, curr) => acc + curr.amount, 0);
        return amountPaidToday >= loan.dailyPaymentAmount || loan.remainingAmount === 0;
      });

      const pendingClientsTodayCount = todayCollections.filter((isPaid) => !isPaid).length;
      const totalTodayTargetCount = todayCollections.length;
      const paidTodayCount = totalTodayTargetCount - pendingClientsTodayCount;
      const collectionProgressPercent = totalTodayTargetCount > 0 ? Math.round(paidTodayCount / totalTodayTargetCount * 100) : 100;

      const overdueCount = loans.filter((l) => l.status === 'OVERDUE' && !l.isArchived).length;

      const recentLoans = loans.slice(0, 10);
      const recentPayments = payments;

      return res.json({
        totalCapitalLent,
        totalEstimatedProfit,
        collectedToday,
        todayCollected: collectedToday,
        pendingClientsTodayCount,
        totalActiveLoansCount: activeLoans.length,
        overdueCount,
        expiringSoonCount: 0,
        collectionProgressPercent,
        recentLoans,
        recentPayments,
        cobros: recentPayments,
        payments: recentPayments
      });
    } catch (error) {
      console.error("[ERROR DASHBOARD SUMMARY]:", error);
      return res.json({
        totalCapitalLent: 0,
        totalEstimatedProfit: 0,
        collectedToday: 0,
        todayCollected: 0,
        pendingClientsTodayCount: 0,
        totalActiveLoansCount: 0,
        overdueCount: 0,
        expiringSoonCount: 0,
        collectionProgressPercent: 100,
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
      try {
        const { rows: lRows } = await pool.query(`SELECT * FROM loans WHERE is_archived = 0 OR is_archived IS NULL`);
        loans = lRows.map(mapRowToLoan);
      } catch (err) {
        console.error('Error leyendo loans en reportes:', err.message);
      }

      let payments = [];
      try {
        const { rows: pRows } = await pool.query('SELECT * FROM payments');
        payments = pRows.map(mapRowToPayment);
      } catch (err) {
        console.error('Error leyendo payments en reportes:', err.message);
      }

      let expenses = [];
      try {
        const { rows: eRows } = await pool.query('SELECT * FROM expenses');
        expenses = eRows.map(mapRowToExpense);
      } catch (err) {
        console.error('Error leyendo expenses en reportes:', err.message);
      }

      const now = new Date();
      let startDate = new Date();
      let periodLabel = 'Semanal';

      if (period === 'WEEKLY') {
        startDate.setDate(now.getDate() - 7);
        periodLabel = 'Última Semana (7 Días)';
      } else if (period === 'BIWEEKLY') {
        startDate.setDate(now.getDate() - 15);
        periodLabel = 'Última Quincena (15 Días)';
      } else if (period === 'MONTHLY') {
        startDate.setDate(now.getDate() - 30);
        periodLabel = 'Último Mes (30 Días)';
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = now.toISOString().split('T')[0];

      const periodLoans = loans.filter((l) => l.startDate && l.startDate >= startDateStr);
      const periodPayments = payments.filter((p) => p.date && p.date >= startDateStr);
      const periodExpenses = expenses.filter((e) => e.date && e.date >= startDateStr);

      const capitalInvested = periodLoans.reduce((sum, l) => sum + (l.capital || 0), 0);
      const projectedCollection = periodLoans.reduce((sum, l) => sum + (l.totalToPay || 0), 0);
      const principalCollected = periodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalMoras = periodPayments.reduce((sum, p) => sum + (p.lateFee || 0), 0);
      const realCollected = principalCollected + totalMoras;
      const interestCollected = Math.round(principalCollected * (20 / 120));
      const grossProfit = interestCollected + totalMoras;
      const totalExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const netProfit = grossProfit - totalExpenses;
      const remainingToCollect = Math.max(0, projectedCollection - principalCollected);

      return res.json({
        period,
        periodLabel,
        startDate: formatDatePE(startDateStr),
        endDate: formatDatePE(endDateStr),
        capitalInvested,
        realCollected,
        principalCollected,
        totalMoras,
        projectedCollection,
        interestCollected,
        grossProfit,
        totalExpenses,
        netProfit,
        remainingToCollect,
        expensesList: periodExpenses
      });
    } catch (error) {
      console.error('Error in getFinancialReport:', error);
      // Retornar objeto seguro en lugar de estado 500 para evitar que caiga la app
      return res.json({
        period: req.query.period || 'WEEKLY',
        periodLabel: 'Última Semana (7 Días)',
        startDate: '',
        endDate: '',
        capitalInvested: 0,
        realCollected: 0,
        projectedCollection: 0,
        interestCollected: 0,
        totalExpenses: 0,
        netProfit: 0,
        remainingToCollect: 0,
        expensesList: []
      });
    }
  },

  // POST /api/seed
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

      const todayStr = new Date().toISOString().split('T')[0];
      const dueStr1 = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
      const dueStr2 = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
      const createdAt = new Date().toISOString();

      const cli1 = generateUUID();
      const cli2 = generateUUID();

      await pool.query(
        `INSERT INTO clients (id, name, phone, address, identification, notes, created_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cli1, 'Carlos Andrés Mendoza', '910456789', 'Av. Larco 450, Miraflores', '45987654', 'Cliente muy puntual. Cobrar en la mañana.', createdAt, 'ACTIVE']
      );

      await pool.query(
        `INSERT INTO clients (id, name, phone, address, identification, notes, created_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cli2, 'María Fernanda Restrepo', '915987654', 'Jr. de la Unión 820, Cercado de Lima', '08345678', 'Puesto de ropa.', createdAt, 'ACTIVE']
      );

      const loan1 = generateUUID();
      const loan2 = generateUUID();

      await pool.query(
        `INSERT INTO loans (
          id, client_id, client_name, client_phone, client_address,
          capital, amount_borrowed,
          interest_rate, interest_amount,
          total_to_pay, total_amount,
          payment_days, days_agreed,
          daily_payment_amount, daily_payment,
          start_date, due_date, status, paid_amount, remaining_amount, paid_days_count, notes, created_at, is_archived
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 0)`,
        [
        loan1, cli1, 'Carlos Andrés Mendoza', '910456789', 'Av. Larco 450, Miraflores',
        500, 500, 20, 100, 600, 600, 20, 20, 30, 30,
        '2026-07-10', dueStr1, 'ACTIVE', 360, 240, 12, 'Préstamo activo en Soles', createdAt]

      );

      await pool.query(
        `INSERT INTO loans (
          id, client_id, client_name, client_phone, client_address,
          capital, amount_borrowed,
          interest_rate, interest_amount,
          total_to_pay, total_amount,
          payment_days, days_agreed,
          daily_payment_amount, daily_payment,
          start_date, due_date, status, paid_amount, remaining_amount, paid_days_count, notes, created_at, is_archived
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 0)`,
        [
        loan2, cli2, 'María Fernanda Restrepo', '915987654', 'Jr. de la Unión 820, Cercado de Lima',
        1000, 1000, 20, 200, 1200, 1200, 15, 15, 80, 80,
        '2026-07-05', dueStr2, 'OVERDUE', 640, 560, 8, 'En mora', createdAt]

      );

      const pay1 = generateUUID();
      try {
        await pool.query(
          `INSERT INTO payments (id, loan_id, client_id, client_name, amount, payment_date, type, day_number, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [pay1, loan1, cli1, 'Carlos Andrés Mendoza', 30, todayStr, 'FULL_DAY', 12, 'Pago del día']
        );
      } catch (_) {
        await pool.query(
          `INSERT INTO payments (id, loan_id, client_id, client_name, amount, date, type, day_number, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [pay1, loan1, cli1, 'Carlos Andrés Mendoza', 30, todayStr, 'FULL_DAY', 12, 'Pago del día']
        );
      }

      const exp1 = generateUUID();
      try {
        await pool.query(
          `INSERT INTO expenses (id, amount, category, description, expense_date, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
          [exp1, 25, 'COMBUSTIBLE', 'Gasolina para moto de cobranza', todayStr, createdAt]
        );
      } catch (_) {
        await pool.query(
          `INSERT INTO expenses (id, amount, category, description, date, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
          [exp1, 25, 'COMBUSTIBLE', 'Gasolina para moto de cobranza', todayStr, createdAt]
        );
      }

      return res.json({ success: true, message: 'Datos demo restablecidos en Soles S/.' });
    } catch (error) {
      console.error('Error in seedDatabase:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // GET /api/admin/collectors/stats
  async getCollectorStats(req, res) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Get all collectors (role = COBRADOR or ADMIN)
      const { rows: collectors } = await pool.query(
        `SELECT id, name, email, role FROM users ORDER BY name ASC`
      );

      const stats = await Promise.all(collectors.map(async (collector) => {
        try {
          // Recaudado hoy by this collector
          let collectedToday = 0;
          try {
            const { rows: todayRows } = await pool.query(
              `SELECT COALESCE(SUM(a.amount), 0) as total FROM activity_logs a WHERE a.user_id = $1 AND DATE(a.created_at) = $2 AND a.action_type = 'PAGO_REGISTRADO'`,
              [collector.id, todayStr]
            );
            collectedToday = Number(todayRows[0]?.total || 0);
          } catch (_) {}

          // Recaudado histórico total
          let collectedTotal = 0;
          try {
            const { rows: totalRows } = await pool.query(
              `SELECT COALESCE(SUM(a.amount), 0) as total FROM activity_logs a WHERE a.user_id = $1 AND a.action_type = 'PAGO_REGISTRADO'`,
              [collector.id]
            );
            collectedTotal = Number(totalRows[0]?.total || 0);
          } catch (_) {}

          // Clientes asignados activos
          let assignedClients = 0;
          try {
            const { rows: clientRows } = await pool.query(
              `SELECT COUNT(*) as total FROM clients WHERE (assigned_to = $1 OR assigned_to_user_id = $2) AND (status != 'INACTIVE' OR status IS NULL) AND (is_archived = 0 OR is_archived IS NULL)`,
              [collector.id, collector.id]
            );
            assignedClients = Number(clientRows[0]?.total || 0);
          } catch {
            const { rows: clientRows } = await pool.query(
              `SELECT COUNT(*) as total FROM clients WHERE assigned_to = $1 AND status != 'INACTIVE'`,
              [collector.id]
            );
            assignedClients = Number(clientRows[0]?.total || 0);
          }

          return {
            id: collector.id,
            name: collector.name,
            email: collector.email,
            role: collector.role,
            collectedToday,
            collectedTotal,
            assignedClients
          };
        } catch (_) {
          return {
            id: collector.id,
            name: collector.name,
            email: collector.email,
            role: collector.role,
            collectedToday: 0,
            collectedTotal: 0,
            assignedClients: 0
          };
        }
      }));

      return res.json({ success: true, stats });
    } catch (error) {
      console.error('Error in getCollectorStats:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // GET /api/admin/collectors/:id/activity
  async getCollectorActivity(req, res) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      let activities = [];
      try {
        const { rows } = await pool.query(
          `SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
          [id, limit]
        );
        activities = rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          actionType: row.action_type,
          description: row.description,
          amount: Number(row.amount || 0),
          createdAt: row.created_at
        }));
      } catch (_) {
        activities = [];
      }

      return res.json({ success: true, activities });
    } catch (error) {
      console.error('Error in getCollectorActivity:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // GET /api/admin/collectors/list - List all collectors for portfolio filter
  async getCollectorsList(req, res) {
    try {
      const { role } = req.query;
      let sql = `SELECT id, name, email, role, created_at FROM users WHERE UPPER(role) IN ('ADMIN','COBRADOR')`;
      let params = [];
      if (role) {
        sql = `SELECT id, name, email, role, created_at FROM users WHERE UPPER(role) = $1`;
        params.push(String(role).toUpperCase());
      }
      sql += ` ORDER BY name ASC`;
      const { rows } = await pool.query(sql, params);
      return res.json({ success: true, collectors: rows, users: rows, data: rows });
    } catch (error) {
      console.error('Error in getCollectorsList:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // GET /api/admin/portfolio/filter?collectorId=X - Filter clients/loans by collector
  async getPortfolioByCollector(req, res) {
    try {
      const { collectorId } = req.query;
      let clientsQuery, loansQuery, params;

      if (!collectorId || collectorId === 'ALL') {
        // Return all active clients and loans
        const { rows: clientRows } = await pool.query(
          `SELECT c.*, u.name AS assigned_to_name FROM clients c LEFT JOIN users u ON (c.assigned_to_user_id = u.id OR c.assigned_to = u.id) WHERE (c.status != 'INACTIVE' OR c.status IS NULL) AND (c.is_archived = 0 OR c.is_archived IS NULL) ORDER BY c.route_order ASC, c.id DESC`
        );
        const { rows: loanRows } = await pool.query(
          `SELECT l.*, c.name as joined_client_name, c.alias as joined_client_alias, c.phone as joined_client_phone, c.address as joined_client_address, c.route_order as joined_client_route_order FROM loans l LEFT JOIN clients c ON l.client_id = c.id WHERE l.is_archived = 0 OR l.is_archived IS NULL ORDER BY l.created_at DESC`
        );
        return res.json({
          success: true,
          clients: clientRows.map(mapRowToClient),
          loans: loanRows.map(mapRowToLoan),
          collectorId: 'ALL'
        });
      }

      const { rows: clientRows } = await pool.query(
        `SELECT c.*, u.name AS assigned_to_name FROM clients c LEFT JOIN users u ON (c.assigned_to_user_id = u.id OR c.assigned_to = u.id) WHERE (c.assigned_to_user_id = $1 OR c.assigned_to = $2) AND (c.status != 'INACTIVE' OR c.status IS NULL) AND (c.is_archived = 0 OR c.is_archived IS NULL) ORDER BY c.route_order ASC, c.id DESC`,
        [collectorId, collectorId]
      );
      const { rows: loanRows } = await pool.query(
        `SELECT l.*, c.name as joined_client_name, c.alias as joined_client_alias, c.phone as joined_client_phone, c.address as joined_client_address, c.route_order as joined_client_route_order FROM loans l LEFT JOIN clients c ON l.client_id = c.id WHERE (l.assigned_to_user_id = $1 OR l.assigned_collector_id = $2) AND (l.is_archived = 0 OR l.is_archived IS NULL) ORDER BY l.created_at DESC`,
        [collectorId, collectorId]
      );
      return res.json({
        success: true,
        clients: clientRows.map(mapRowToClient),
        loans: loanRows.map(mapRowToLoan),
        collectorId
      });
    } catch (error) {
      console.error('Error in getPortfolioByCollector:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/admin/assign-portfolio - Atomically assign clients and loans to a collector
  async assignPortfolio(req, res) {
    const client = await pool.connect();
    try {
      const { clientIds = [], loanIds = [], collectorId } = req.body;

      if ((!Array.isArray(clientIds) || clientIds.length === 0) && (
      !Array.isArray(loanIds) || loanIds.length === 0)) {
        return res.status(400).json({ error: 'Debes proporcionar clientIds o loanIds' });
      }

      const assignedVal = collectorId && collectorId !== 'unassigned' ? String(collectorId) : null;

      await client.query('BEGIN');

      // Assign clients and cascade to their loans
      for (const cid of clientIds) {
        try {
          await client.query(
            `UPDATE clients SET assigned_to = $1, assigned_to_user_id = $2 WHERE id = $3`,
            [assignedVal, assignedVal, String(cid)]
          );
        } catch (_) {
          try {
            await client.query(
              `UPDATE clients SET assigned_to = $1 WHERE id = $2`,
              [assignedVal, String(cid)]
            );
          } catch (__) {}
        }
        // Cascade to loans of this client
        try {
          await client.query(
            `UPDATE loans SET assigned_to = $1, assigned_to_user_id = $2, assigned_collector_id = $3 WHERE client_id = $4`,
            [assignedVal, assignedVal, assignedVal, String(cid)]
          );
        } catch (_) {
          try {
            await client.query(
              `UPDATE loans SET assigned_to = $1, assigned_to_user_id = $2 WHERE client_id = $3`,
              [assignedVal, assignedVal, String(cid)]
            );
          } catch (__) {}
        }
      }

      // Assign specific loans directly
      for (const lid of loanIds) {
        try {
          await client.query(
            `UPDATE loans SET assigned_to = $1, assigned_to_user_id = $2, assigned_collector_id = $3 WHERE id = $4`,
            [assignedVal, assignedVal, assignedVal, String(lid)]
          );
        } catch (_) {
          try {
            await client.query(
              `UPDATE loans SET assigned_to = $1, assigned_to_user_id = $2 WHERE id = $3`,
              [assignedVal, assignedVal, String(lid)]
            );
          } catch (__) {}
        }
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: `Cartera asignada exitosamente: ${clientIds.length} cliente(s) y ${loanIds.length} préstamo(s)`,
        assignedClients: clientIds.length,
        assignedLoans: loanIds.length,
        collectorId: assignedVal
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in assignPortfolio:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // ── GET /api/payments/history ─────────────────────────────────────────────
  getPaymentHistory: async (req, res) => {
    try {
      const { collector_id, start_date, end_date, limit = 100 } = req.query;
      const userId = req.user?.id || req.user?.userId;
      const role = String(req.user?.role || '').toUpperCase();
      const isCobrador = role === 'COBRADOR';

      const conditions = [];
      const params = [];

      // Role restriction: COBRADOR only sees own payments
      if (isCobrador) {
        conditions.push(`(p.collected_by = $${params.length + 1} OR p.collected_by_user_id = $${params.length + 2} OR p.created_by = $${params.length + 3})`);
        params.push(userId, userId, userId);
      } else if (collector_id) {
        // ADMIN filtered by specific collector
        conditions.push(`(p.collected_by = $${params.length + 1} OR p.collected_by_user_id = $${params.length + 2})`);
        params.push(collector_id, collector_id);
      }

      if (start_date) {
        conditions.push(`(p.date >= $${params.length + 1} OR DATE(p.created_at) >= $${params.length + 2})`);
        params.push(start_date, start_date);
      }
      if (end_date) {
        conditions.push(`(p.date <= $${params.length + 1} OR DATE(p.created_at) <= $${params.length + 2})`);
        params.push(end_date, end_date);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);

      const { rows } = await pool.query(
        `SELECT
           p.id, p.loan_id, p.client_id, p.amount, p.late_fee,
           p.date, p.created_at, p.notes, p.day_number, p.type,
           p.collected_by, p.collected_by_user_id, p.created_by,
           COALESCE(c.name, l.client_name, p.client_name, 'Cliente') AS client_name,
           COALESCE(u.name, 'ADMIN') AS collector_name
         FROM payments p
         LEFT JOIN loans l ON p.loan_id = l.id
         LEFT JOIN clients c ON (p.client_id = c.id OR l.client_id = c.id)
         LEFT JOIN users u ON (p.collected_by = u.id OR p.collected_by_user_id = u.id)
         ${whereClause}
         ORDER BY p.date DESC, p.created_at DESC, p.id DESC
         LIMIT ${safeLimit}`,
        params
      );

      return res.json(rows);
    } catch (error) {
      console.error('[ERROR getPaymentHistory]:', error);
      return res.status(500).json({ error: 'Error obteniendo historial de cobros', detail: error.message });
    }
  }
};

export default loanController;