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
  const capital = Number(row.capital ?? row.amount_borrowed ?? row.amount ?? 0);
  const interestRate = Number(row.interest_rate ?? 20);
  const interestAmount = Number(row.interest_amount ?? Math.round(capital * 0.20));
  const penaltyAmount = Number(row.penalty_amount ?? row.penaltyAmount ?? row.mora ?? 0);
  const totalToPay = Number(row.total_to_pay ?? row.total_amount ?? capital + interestAmount + penaltyAmount);
  const paymentDays = Number(row.payment_days ?? row.days_agreed ?? row.days ?? 20);
  const dailyPaymentAmount = Number(row.daily_payment_amount ?? row.daily_payment ?? row.daily_amount ?? Math.round(totalToPay / (paymentDays || 1)));

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
        try {
          const { rows: r } = await pool.query(`${baseQuery} ORDER BY c.created_at DESC`);
          rows = r || [];
        } catch (err) {
          console.error("[ERROR GET /api/clients ADMIN]:", err);
          const { rows: r } = await pool.query(`SELECT * FROM clients ORDER BY created_at DESC`);
          rows = r || [];
        }
      }

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
      const name = req.body.name || req.body.nombre || '';
      const alias = req.body.alias || req.body.apodo || null;
      const phone = req.body.phone || req.body.telefono || '';
      const address = req.body.address || req.body.direccion || '';
      const dni = req.body.dni || req.body.documento || req.body.identification || null;
      const notes = req.body.notes || req.body.observaciones || null;
      const routeOrder = req.body.routeOrder || req.body.route_order || 0;

      await client.query('BEGIN');
      await client.query(
        `UPDATE clients SET name = $1, alias = $2, phone = $3, address = $4, dni = $5, notes = $6, route_order = $7 WHERE id = $8`,
        [name.trim(), alias?.trim() || null, phone.trim(), address.trim(), dni?.trim() || null, notes?.trim() || null, Number(routeOrder) || 0, id]
      );

      await client.query(
        `UPDATE loans SET client_name = $1, client_phone = $2, client_address = $3 WHERE client_id = $4`,
        [name.trim(), phone.trim(), address.trim(), id]
      );
      await client.query(
        `UPDATE payments SET client_name = $1 WHERE client_id = $2`,
        [name.trim(), id]
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

  // PUT /api/clients/reorder
  async updateRouteOrders(req, res) {
    const client = await pool.connect();
    try {
      const { orders } = req.body;
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
          const { rows: r } = await pool.query(`${baseQuery} ORDER BY l.created_at DESC`);
          rows = r || [];
        }
      } else {
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
          const { rows: r } = await pool.query(`${baseQuery} ORDER BY l.created_at DESC`);
          rows = r || [];
        }
      }

      return res.json((rows || []).map(mapRowToLoan));
    } catch (error) {
      console.error("[ERROR GET /api/loans]:", error);
      return res.json([]);
    }
  },

  // POST /api/loans
  async createClientAndLoan(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let finalClientId = req.body.client_id || req.body.clientId || req.body.cliente_id;

      const clientName = 
        req.body.name || req.body.nombre || req.body.client_name || req.body.clientName || 'Sin Nombre';
      const clientAlias = req.body.alias || req.body.apodo || '';
      const clientPhone = req.body.phone || req.body.telefono || '';
      const clientDni = req.body.dni || req.body.documento || '';
      const clientAddress = req.body.address || req.body.direccion || '';
      const clientNotes = req.body.notes || req.body.observaciones || '';

      if (!finalClientId || String(finalClientId).startsWith('cli_')) {
        const insertClientQuery = `
          INSERT INTO clients (name, alias, phone, dni, address, notes, assigned_to_user_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;
        const clientValues = [
          clientName, clientAlias, clientPhone, clientDni, clientAddress, clientNotes,
          req.body.assigned_to_user_id || req.user?.id || null
        ];
        const clientRes = await client.query(insertClientQuery, clientValues);
        finalClientId = clientRes.rows[0].id;
      }

      const finalAmount = Number(req.body.amount ?? req.body.monto ?? req.body.loan_amount ?? 0);
      const finalTotalAmount = Number(req.body.total_amount ?? req.body.totalAmount ?? (finalAmount * 1.2));
      const finalDays = Number(req.body.days ?? req.body.dias ?? req.body.total_days ?? 24);
      const finalDailyAmount = Number(req.body.daily_amount ?? req.body.dailyAmount ?? req.body.cuota ?? (finalTotalAmount / finalDays));
      const finalRemainingDays = Number(req.body.remaining_days ?? req.body.remainingDays ?? finalDays);
      const finalInterest = Number(req.body.interest_rate ?? req.body.interestRate ?? 20);
      const finalStatus = req.body.status || 'ACTIVE';
      const startDate = req.body.start_date || new Date();

      const insertLoanQuery = `
        INSERT INTO loans (
          client_id, amount, total_amount, daily_amount, days, remaining_days,
          interest_rate, status, assigned_to_user_id, start_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const loanValues = [
        finalClientId, finalAmount, finalTotalAmount, finalDailyAmount,
        finalDays, finalRemainingDays, finalInterest, finalStatus,
        req.body.assigned_to_user_id || req.user?.id || null, startDate
      ];

      const loanRes = await client.query(insertLoanQuery, loanValues);

      await client.query('COMMIT');
      return res.status(201).json({ ...loanRes.rows[0], client_name: clientName });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ERROR POST /api/loans CRÍTICO]:', error);
      return res.status(500).json({ error: 'Error al registrar cliente y préstamo', details: error.message });
    } finally {
      client.release();
    }
  },

  // PUT /api/loans/:id
  async updateLoan(req, res) {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const finalAmount = Number(req.body.amount ?? req.body.monto ?? req.body.capital ?? 0);
      const finalTotalAmount = Number(req.body.total_amount ?? req.body.totalAmount ?? req.body.monto_total ?? (finalAmount * 1.2));
      const finalDays = Number(req.body.days ?? req.body.dias ?? req.body.total_days ?? 24);
      const finalDailyAmount = Number(req.body.daily_amount ?? req.body.dailyAmount ?? req.body.cuota ?? (finalTotalAmount / finalDays));
      const finalRemainingDays = Number(req.body.remaining_days ?? req.body.remainingDays ?? finalDays);
      const finalInterest = Number(req.body.interest_rate ?? req.body.interestRate ?? 20);
      const finalStatus = req.body.status || req.body.estado || 'ACTIVE';

      const updateLoanQuery = `
        UPDATE loans
        SET amount = $1, total_amount = $2, daily_amount = $3, days = $4,
            remaining_days = $5, interest_rate = $6, status = $7
        WHERE id = $8
        RETURNING client_id
      `;
      const loanValues = [
        finalAmount, finalTotalAmount, finalDailyAmount, finalDays,
        finalRemainingDays, finalInterest, finalStatus, id
      ];

      const loanRes = await client.query(updateLoanQuery, loanValues);

      if (loanRes.rowCount === 0) {
        throw new Error("Préstamo no encontrado");
      }

      const clientId = loanRes.rows[0].client_id;
      const clientName = req.body.name || req.body.nombre || req.body.client_name;

      if (clientName && clientId) {
        const clientAlias = req.body.alias || req.body.apodo || '';
        const clientPhone = req.body.phone || req.body.telefono || '';
        const clientDni = req.body.dni || req.body.documento || '';
        const clientAddress = req.body.address || req.body.direccion || '';
        const clientNotes = req.body.notes || req.body.observaciones || '';

        const updateClientQuery = `
          UPDATE clients
          SET name = $1, alias = $2, phone = $3, dni = $4, address = $5, notes = $6
          WHERE id = $7
        `;
        await client.query(updateClientQuery, [
          clientName, clientAlias, clientPhone, clientDni, clientAddress, clientNotes, clientId
        ]);
      }

      await client.query('COMMIT');
      return res.status(200).json({ message: 'Préstamo y cliente actualizados correctamente' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ERROR PUT /api/loans CRÍTICO]:', error);
      return res.status(500).json({ error: 'Error al actualizar el préstamo', details: error.message });
    } finally {
      client.release();
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
                 l.daily_amount,
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
        await client.query(
          `INSERT INTO payments (id, loan_id, client_id, client_name, amount, late_fee, payment_date, type, day_number, notes, collected_by_user_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [newPayment.id, newPayment.loanId, newPayment.clientId, newPayment.clientName, newPayment.amount, newPayment.lateFee, newPayment.date, newPayment.type, newPayment.dayNumber, newPayment.notes || null, userId, userId]
        );
      }
      await client.query('COMMIT');

      return res.status(201).json({ payment: newPayment, updatedLoan: { ...loan, paidAmount: newPaidAmount, remainingAmount: newRemainingAmount, status: newStatus } });
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

      return res.json({
        success: true,
        message: 'Pago actualizado correctamente',
        payment: { ...existingPayment, amount: newAmount, date: newDate, notes: newNotes },
        updatedLoan: { ...loan, paidAmount: newPaidAmount, remainingAmount: newRemainingAmount, status: newStatus }
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
        const { rows: result } = await pool.query('SELECT * FROM payments');
        pRows = result || [];
      } catch (_) {}
      
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
        } catch (_) {
          lRows = [];
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
        } catch (_) {
          lRows = [];
        }
      }
      const loans = (lRows || []).map(mapRowToLoan);
      const activeLoans = loans.filter((l) => l.status !== 'PAID' && !l.isArchived);

      let pRows = [];
      try {
        const { rows: result } = await pool.query(
          `SELECT p.*, COALESCE(c.name, l.client_name, p.client_name, 'Cliente') AS client_name, COALESCE(u.name, 'ADMIN') AS collector_name
           FROM payments p
           LEFT JOIN loans l ON p.loan_id = l.id
           LEFT JOIN clients c ON (p.client_id = c.id OR l.client_id = c.id)
           LEFT JOIN users u ON (p.collected_by = u.id OR p.collected_by_user_id = u.id)
           ORDER BY p.date DESC, p.created_at DESC, p.id DESC LIMIT 15`
        );
        pRows = result || [];
      } catch (_) {}

      const payments = pRows.map(mapRowToPayment);

      const totalCapitalLent = loans.reduce((sum, l) => sum + (l.capital || 0), 0);
      const totalEstimatedProfit = loans.reduce((sum, l) => sum + (l.interestAmount || 0), 0);

      let collectedTodayRaw = 0;
      try {
        const { rows: sumRows } = await pool.query(
          `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE DATE(created_at) = CURRENT_DATE OR DATE(payment_date) = CURRENT_DATE OR DATE(date) = CURRENT_DATE`
        );
        collectedTodayRaw = sumRows[0]?.total;
      } catch (_) {
        collectedTodayRaw = 0;
      }

      const collectedToday = Number(Number(collectedTodayRaw || 0).toFixed(2));
      const todayStr = new Date().toISOString().split('T')[0];

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
        recentLoans: loans.slice(0, 10),
        recentPayments: payments,
        cobros: payments,
        payments
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
      } catch (_) {}

      let payments = [];
      try {
        const { rows: pRows } = await pool.query('SELECT * FROM payments');
        payments = pRows.map(mapRowToPayment);
      } catch (_) {}

      let expenses = [];
      try {
        const { rows: eRows } = await pool.query('SELECT * FROM expenses');
        expenses = eRows.map(mapRowToExpense);
      } catch (_) {}

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

      return res.json({ success: true, message: 'Base de datos limpiada correctamente' });
    } catch (error) {
      console.error('Error in seedDatabase:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // GET /api/admin/collectors/stats
  async getCollectorStats(req, res) {
    try {
      const { rows: collectors } = await pool.query(
        `SELECT id, name, email, role FROM users ORDER BY name ASC`
      );

      const stats = collectors.map((collector) => ({
        id: collector.id,
        name: collector.name,
        email: collector.email,
        role: collector.role,
        collectedToday: 0,
        collectedTotal: 0,
        assignedClients: 0
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
      return res.json({ success: true, activities: [] });
    } catch (error) {
      console.error('Error in getCollectorActivity:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // GET /api/admin/collectors/list
  async getCollectorsList(req, res) {
    try {
      const { rows } = await pool.query(`SELECT id, name, email, role, created_at FROM users ORDER BY name ASC`);
      return res.json({ success: true, collectors: rows, users: rows, data: rows });
    } catch (error) {
      console.error('Error in getCollectorsList:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // GET /api/admin/portfolio/filter
  async getPortfolioByCollector(req, res) {
    try {
      const { rows: clientRows } = await pool.query(`SELECT * FROM clients ORDER BY id DESC`);
      const { rows: loanRows } = await pool.query(`SELECT * FROM loans ORDER BY id DESC`);
      return res.json({
        success: true,
        clients: clientRows.map(mapRowToClient),
        loans: loanRows.map(mapRowToLoan),
        collectorId: 'ALL'
      });
    } catch (error) {
      console.error('Error in getPortfolioByCollector:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/admin/assign-portfolio
  async assignPortfolio(req, res) {
    return res.json({ success: true, message: 'Portfolio asignado' });
  },

  // GET /api/payments/history
  getPaymentHistory: async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM payments ORDER BY id DESC LIMIT 100`);
      return res.json(rows.map(mapRowToPayment));
    } catch (error) {
      console.error('[ERROR getPaymentHistory]:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};

export default loanController;