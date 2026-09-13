import express from 'express';
import clientDniController from '../controllers/clientDniController.js';
import { requireAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const safe = (handler) => handler || ((req, res) => res.status(501).json({ error: 'Ruta no implementada' }));

const dniRawImage = express.raw({
  type: ['image/jpeg', 'image/png', 'image/webp'],
  limit: '5mb',
});

// The application currently supports ADMIN and COBRADOR accounts.
// Both roles are authenticated users and may view/upload DNI images.
router.get('/clients/:id/dni', verifyToken, safe(clientDniController?.get));
router.put('/clients/:id/dni/:side', verifyToken, dniRawImage, safe(clientDniController?.upload));

// DNI deletion is intentionally restricted to ADMIN.
router.delete('/clients/:id/dni/:side', verifyToken, requireAdmin, safe(clientDniController?.remove));

export default router;
