export class ClientRestrictionError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ClientRestrictionError';
    this.statusCode = statusCode;
  }
}

function normalizeReason(reason) {
  const normalized = String(reason ?? '').trim();
  return normalized || null;
}

export async function setClientRestriction(db, {
  clientId,
  isRestricted,
  reason,
  adminId,
  adminName = 'Administrador',
  ip = null,
}) {
  const client = await db.connect();
  let transactionStarted = false;
  try {
    await client.query('BEGIN');
    transactionStarted = true;

    const currentResult = await client.query(`
  SELECT c.*, COALESCE(u.name, '') AS restricted_by_name
  FROM clients AS c
  LEFT JOIN users AS u ON c.restricted_by::text = u.id::text
  WHERE c.id::text = $1
  FOR UPDATE OF c
`, [String(clientId)]);
    const current = currentResult.rows[0];
    if (!current) throw new ClientRestrictionError(404, 'Cliente no encontrado');

    const normalizedReason = isRestricted ? normalizeReason(reason) : null;
    const previousReason = normalizeReason(current.restriction_reason);
    const updatedResult = await client.query(`
      UPDATE clients
      SET
        is_restricted = $1,
        restricted_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END,
        restricted_by = CASE WHEN $1 THEN $2 ELSE NULL END,
        restriction_reason = CASE WHEN $1 THEN $3 ELSE NULL END
      WHERE id::text = $4
      RETURNING *
    `, [Boolean(isRestricted), String(adminId), normalizedReason, String(clientId)]);

    const auditReason = isRestricted ? normalizedReason : previousReason;
    const actionType = isRestricted ? 'CLIENT_RESTRICTED' : 'CLIENT_RESTRICTION_REMOVED';
    const description = isRestricted
      ? `Cliente restringido${auditReason ? `. Motivo: ${auditReason}` : ' sin motivo registrado'}`
      : `Restricción de cliente eliminada${auditReason ? `. Motivo anterior: ${auditReason}` : ''}`;
    await client.query(`
      INSERT INTO activity_logs (
        user_id, user_name, action_type, description, amount, client_id, ip
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [String(adminId), String(adminName || 'Administrador'), actionType, description, 0, String(clientId), ip]);

    await client.query('COMMIT');
    transactionStarted = false;
    return updatedResult.rows[0];
  } catch (error) {
    if (transactionStarted) {
      try { await client.query('ROLLBACK'); } catch (_) {}
    }
    throw error;
  } finally {
    client.release();
  }
}
