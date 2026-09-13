import pool from '../config/db.js';
import { createSignedDniUrl, deleteDniObject, uploadDniObject } from '../services/dniStorageService.js';

const SIDE_COLUMN = {
  front: 'dni_front_path',
  back: 'dni_back_path',
};

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const getSideColumn = (side) => SIDE_COLUMN[String(side || '').toLowerCase()] || null;

const getClientDocumentPaths = async (clientId) => {
  const { rows } = await pool.query(
    'SELECT id, dni_front_path, dni_back_path FROM clients WHERE id::text = $1',
    [String(clientId)]
  );
  return rows[0] || null;
};

const ensureDocumentColumns = async () => {
  await pool.query('ALTER TABLE clients ADD COLUMN IF NOT EXISTS dni_front_path TEXT NULL');
  await pool.query('ALTER TABLE clients ADD COLUMN IF NOT EXISTS dni_back_path TEXT NULL');
};

export const clientDniController = {
  async get(req, res) {
    try {
      await ensureDocumentColumns();
      const client = await getClientDocumentPaths(req.params.id);
      if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

      const [frontUrl, backUrl] = await Promise.all([
        client.dni_front_path ? createSignedDniUrl(client.dni_front_path, 300) : null,
        client.dni_back_path ? createSignedDniUrl(client.dni_back_path, 300) : null,
      ]);

      return res.json({
        clientId: client.id,
        front: { exists: Boolean(client.dni_front_path), url: frontUrl },
        back: { exists: Boolean(client.dni_back_path), url: backUrl },
      });
    } catch (error) {
      console.error('Error obteniendo documentos DNI:', error.message);
      return res.status(500).json({ error: 'No se pudieron cargar las fotos del DNI' });
    }
  },

  async upload(req, res) {
    try {
      await ensureDocumentColumns();
      const side = String(req.params.side || '').toLowerCase();
      const column = getSideColumn(side);
      if (!column) return res.status(400).json({ error: 'Lado de DNI inválido' });

      const mimeType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (!ALLOWED_MIME.has(mimeType)) {
        return res.status(415).json({ error: 'Formato no permitido. Usa JPG, PNG o WEBP.' });
      }

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'No se recibió una imagen válida' });
      }
      if (req.body.length > MAX_IMAGE_BYTES) {
        return res.status(413).json({ error: 'La imagen supera el máximo de 5 MB' });
      }

      const client = await getClientDocumentPaths(req.params.id);
      if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

      const oldPath = client[column];
      const extension = MIME_EXTENSION[mimeType];
      const newPath = `clients/${client.id}/dni-${side}.${extension}`;

      await uploadDniObject(newPath, req.body, mimeType);
      await pool.query(`UPDATE clients SET ${column} = $1 WHERE id::text = $2`, [newPath, String(client.id)]);

      if (oldPath && oldPath !== newPath) {
        deleteDniObject(oldPath).catch((deleteError) => {
          console.warn('No se pudo limpiar el DNI anterior:', deleteError.message);
        });
      }

      const url = await createSignedDniUrl(newPath, 300);
      return res.json({ success: true, side, exists: true, url });
    } catch (error) {
      console.error('Error subiendo documento DNI:', error.message);
      return res.status(500).json({ error: 'No se pudo guardar la foto del DNI' });
    }
  },

  async remove(req, res) {
    try {
      await ensureDocumentColumns();
      const side = String(req.params.side || '').toLowerCase();
      const column = getSideColumn(side);
      if (!column) return res.status(400).json({ error: 'Lado de DNI inválido' });

      const client = await getClientDocumentPaths(req.params.id);
      if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

      const oldPath = client[column];
      if (oldPath) await deleteDniObject(oldPath);
      await pool.query(`UPDATE clients SET ${column} = NULL WHERE id::text = $1`, [String(client.id)]);

      return res.json({ success: true, side, exists: false, url: null });
    } catch (error) {
      console.error('Error eliminando documento DNI:', error.message);
      return res.status(500).json({ error: 'No se pudo eliminar la foto del DNI' });
    }
  },
};

export default clientDniController;
