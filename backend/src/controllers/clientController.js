import pool from '../config/db.js';
import loanController from './loanController.js';

function mapRowToClient(row) {
  const dniVal = row.dni ?? row.documento ?? row.identification ?? undefined;
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    alias: row.alias ? String(row.alias) : undefined,
    phone: String(row.phone || ''),
    address: String(row.address || ''),
    dni: dniVal ? String(dniVal) : undefined,
    documento: row.documento ? String(row.documento) : (dniVal ? String(dniVal) : undefined),
    identification: row.identification ? String(row.identification) : (dniVal ? String(dniVal) : undefined),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    status: row.status || 'ACTIVE',
    routeOrder: Number(row.route_order ?? row.routeOrder ?? 0),
    assignedTo: row.assigned_to || row.assigned_to_user_id || undefined,
    assignedToName: row.assigned_to_name || row.collector_name || undefined,
    createdBy: row.created_by || row.created_by_user_id || undefined,
  };
}

export const getClients = async (req, res) => {
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
        const [r] = await pool.query(
          `${baseQuery} WHERE (c.assigned_to = ? OR c.assigned_to_user_id = ? OR c.created_by = ? OR c.created_by_user_id = ?) ORDER BY c.created_at DESC`,
          [userId, userId, userId, userId]
        );
        rows = r || [];
      } catch (err) {
        console.error("[ERROR GET /api/clients COBRADOR]:", err);
        const [r] = await pool.query(`${baseQuery} ORDER BY c.created_at DESC`);
        rows = r || [];
      }
    } else {
      try {
        const [r] = await pool.query(`${baseQuery} ORDER BY c.created_at DESC`);
        rows = r || [];
      } catch (err) {
        console.error("[ERROR GET /api/clients ADMIN]:", err);
        const [r] = await pool.query(`${baseQuery} ORDER BY c.created_at DESC`);
        rows = r || [];
      }
    }

    console.log("[CLIENTS API] Total clientes retornados:", rows.length);
    return res.json((rows || []).map(mapRowToClient));
  } catch (error) {
    console.error("[ERROR GET /api/clients]:", error);
    return res.json([]);
  }
};

export const createClient = loanController.createClient.bind(loanController);
export const updateClient = loanController.updateClient.bind(loanController);
export const deleteClient = loanController.deleteClient.bind(loanController);

export default {
  getClients,
  createClient,
  updateClient,
  deleteClient,
};

