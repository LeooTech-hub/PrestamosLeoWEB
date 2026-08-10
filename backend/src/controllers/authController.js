import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendRecoveryEmail } from '../services/emailService.js';

export const authController = {
  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Correo o contraseña incorrectos' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);

      if (!users || users.length === 0) {
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(String(password), user.password_hash);

      if (!isMatch) {
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      }

      const secret = process.env.JWT_SECRET || 'prestamos_leo_jwt_secret_key_2026_super_secure';
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role || 'COBRADOR' },
        secret,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'COBRADOR',
        },
      });
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ error: 'Error interno del servidor en inicio de sesión' });
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Debes proporcionar un correo electrónico' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);

      if (!users || users.length === 0) {
        // Response generic success message to prevent user enumeration
        return res.json({
          success: true,
          message: 'Si el correo está registrado en el sistema, recibirás un enlace de recuperación.',
        });
      }

      const user = users[0];
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      const expiresFormatted = expires.toISOString().slice(0, 19).replace('T', ' ');

      await pool.query(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
        [resetToken, expiresFormatted, user.id]
      );

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

      await sendRecoveryEmail({
        to: user.email,
        name: user.name,
        resetLink,
      });

      return res.json({
        success: true,
        message: 'Si el correo está registrado en el sistema, recibirás un enlace de recuperación.',
      });
    } catch (error) {
      console.error('Error en forgot-password:', error);
      return res.status(500).json({ error: 'Error interno al procesar la solicitud de recuperación' });
    }
  },

  // POST /api/auth/reset-password
  async resetPassword(req, res) {
    try {
      const { token, password, newPassword } = req.body;
      const targetPassword = password || newPassword;

      if (!token || !targetPassword) {
        return res.status(400).json({ error: 'El token y la nueva contraseña son requeridos' });
      }

      if (String(targetPassword).length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const nowFormatted = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const [users] = await pool.query(
        'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?',
        [token, nowFormatted]
      );

      if (!users || users.length === 0) {
        return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado.' });
      }

      const user = users[0];
      const newHash = await bcrypt.hash(String(targetPassword), 10);

      await pool.query(
        'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [newHash, user.id]
      );

      return res.json({
        success: true,
        message: 'Contraseña restablecida con éxito. Ahora puedes iniciar sesión.',
      });
    } catch (error) {
      console.error('Error en reset-password:', error);
      return res.status(500).json({ error: 'Error interno al restablecer la contraseña' });
    }
  },

  // GET /api/auth/me
  async me(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const [users] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);

      if (!users || users.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = users[0];

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'COBRADOR',
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error('Error en auth/me:', error);
      return res.status(500).json({ error: 'Error obteniendo datos del usuario' });
    }
  },
};
