import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

function generateUUID() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export const userController = {
  // GET /api/users - List all users (ADMIN only)
  async listUsers(req, res) {
    try {
      const { role } = req.query;
      let query = 'SELECT id, name, email, role, created_at FROM users';
      let params = [];
      if (role) {
        query += ' WHERE UPPER(role) = $1';
        params.push(String(role).toUpperCase());
      }
      query += ' ORDER BY created_at DESC';
      const { rows } = await pool.query(query, params);
      return res.json({ success: true, users: rows, collectors: rows, data: rows });
    } catch (error) {
      console.error('Error listando usuarios:', error);
      return res.status(500).json({ error: 'Error interno al listar usuarios' });
    }
  },

  // POST /api/users - Create new user (ADMIN only)
  async createUser(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos' });
      }

      const validRoles = ['ADMIN', 'COBRADOR'];
      const userRole = validRoles.includes(role) ? role : 'COBRADOR';

      const normalizedEmail = String(email).trim().toLowerCase();
      const { rows: existing } = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);

      if (existing && existing.length > 0) {
        return res.status(409).json({ error: 'Ya existe un usuario con ese correo electrónico' });
      }

      const passwordHash = await bcrypt.hash(String(password), 10);
      const userId = generateUUID();
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await pool.query(
        'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, name.trim(), normalizedEmail, passwordHash, userRole, createdAt]
      );

      return res.status(201).json({
        success: true,
        user: { id: userId, name: name.trim(), email: normalizedEmail, role: userRole, createdAt },
      });
    } catch (error) {
      console.error('Error creando usuario:', error);
      return res.status(500).json({ error: 'Error interno al crear usuario' });
    }
  },

  // DELETE /api/users/:id - Delete user (ADMIN only, cannot self-delete)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const requestingUserId = req.user?.id;

      if (id === requestingUserId) {
        return res.status(400).json({ error: 'No puedes eliminar tu propio usuario administrador' });
      }

      const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      return res.status(500).json({ error: 'Error interno al eliminar usuario' });
    }
  },
};
