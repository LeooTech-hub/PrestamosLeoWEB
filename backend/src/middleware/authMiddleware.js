import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado, token no provisto' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'prestamos_leo_jwt_secret_key_2026_super_secure';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error al verificar JWT:', error.message);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const requireAdmin = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(403).json({ message: 'Acceso restringido a administradores' });
  }

  // Comparación insensible a mayúsculas del rol en el token
  const roleFromToken = String(req.user.role || '').toUpperCase();

  if (roleFromToken === 'ADMIN') {
    return next();
  }

  // Fallback: si el token no trae rol ADMIN (token antiguo o rol actualizado en BD),
  // consultar el rol real del usuario directamente en la base de datos
  try {
    const pool = (await import('../config/db.js')).default;
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.user.id]);

    if (rows && rows.length > 0 && String(rows[0].role || '').toUpperCase() === 'ADMIN') {
      return next();
    }
  } catch (dbError) {
    console.error('Error consultando rol de usuario en DB:', dbError.message);
  }

  return res.status(403).json({ message: 'Acceso restringido a administradores' });
};
