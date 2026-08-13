import express from 'express';
import loanController from '../controllers/loanController.js';
import reniecController from '../controllers/reniecController.js';
import { authController } from '../controllers/authController.js';
import { userController } from '../controllers/userController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

const safe = (handler) => handler || ((req, res) => res.status(501).json({ error: 'Ruta no implementada' }));

// PUBLIC AUTH ROUTES
router.post('/auth/login', safe(authController?.login));
router.post('/auth/forgot-password', safe(authController?.forgotPassword));
router.post('/auth/reset-password', safe(authController?.resetPassword));

// PROTECTED ROUTES
router.get('/auth/me', verifyToken, safe(authController?.me));

// USER MANAGEMENT
router.get('/users', verifyToken, requireAdmin, safe(userController?.listUsers));
router.post('/users', verifyToken, requireAdmin, safe(userController?.createUser));
router.delete('/users/:id', verifyToken, requireAdmin, safe(userController?.deleteUser));

// RENIEC
router.get('/reniec/:dni', verifyToken, safe(reniecController?.getDniInfo));

// CLIENTS
router.get('/clients', verifyToken, safe(loanController?.getClients));
router.post('/clients', verifyToken, safe(loanController?.createClient));
router.put('/clients/assign', verifyToken, requireAdmin, safe(loanController?.assignClients));
router.put('/clients/reorder', verifyToken, safe(loanController?.updateRouteOrders));
router.put('/clients/:id', verifyToken, safe(loanController?.updateClient));
router.put('/clients/:id/restore', verifyToken, safe(loanController?.restoreClient));
router.delete('/clients/:id', verifyToken, requireAdmin, safe(loanController?.deleteClient));

// LOANS
router.get('/loans', verifyToken, safe(loanController?.getLoans));
router.post('/loans', verifyToken, safe(loanController?.createClientAndLoan));
router.post('/clients-with-loan', verifyToken, safe(loanController?.createClientAndLoan));
router.put('/loans/:id', verifyToken, safe(loanController?.updateLoan));
router.put('/loans/:id/restore', verifyToken, safe(loanController?.restoreLoan));
router.delete('/loans/:id', verifyToken, requireAdmin, safe(loanController?.deleteLoan));

// TRASH
router.get('/trash', verifyToken, requireAdmin, safe(loanController?.getTrash));

// PAYMENTS
router.get('/payments', verifyToken, safe(loanController?.getPayments));
router.get('/payments/recent', verifyToken, safe(loanController?.getPayments));
router.get('/payments/history', verifyToken, safe(loanController?.getPaymentHistory));
router.post('/payments', verifyToken, safe(loanController?.registerPayment));
router.put('/payments/:id', verifyToken, safe(loanController?.updatePayment));
router.delete('/payments/:id', verifyToken, requireAdmin, safe(loanController?.deletePayment));
router.post('/payments/revert', verifyToken, safe(loanController?.revertLastPayment));
router.post('/loans/:id/revert-payment', verifyToken, safe(loanController?.revertLastPayment));

// EXPENSES
router.get('/expenses', verifyToken, safe(loanController?.getExpenses));
router.post('/expenses', verifyToken, safe(loanController?.addExpense));
router.put('/expenses/:id', verifyToken, safe(loanController?.updateExpense));
router.delete('/expenses/:id', verifyToken, requireAdmin, safe(loanController?.deleteExpense));

// OPERATIONS
router.get('/today-collections', verifyToken, safe(loanController?.getTodayCollections));
router.get('/alerts', verifyToken, safe(loanController?.getAlerts));
router.get('/loans/alerts', verifyToken, safe(loanController?.getAlerts));
router.get('/dashboard/summary', verifyToken, safe(loanController?.getDashboardSummary));
router.get('/reports/financial', verifyToken, safe(loanController?.getFinancialReport));

// COLLECTORS & PORTFOLIO
router.get('/admin/collectors/list', verifyToken, requireAdmin, safe(loanController?.getCollectorsList));
router.get('/admin/collectors', verifyToken, requireAdmin, safe(loanController?.getCollectorsList));
router.get('/admin/collectors/stats', verifyToken, requireAdmin, safe(loanController?.getCollectorStats));
router.get('/admin/collectors/:id/activity', verifyToken, requireAdmin, safe(loanController?.getCollectorActivity));
router.put('/admin/assign-portfolio', verifyToken, requireAdmin, safe(loanController?.assignPortfolio));
router.get('/admin/portfolio/filter', verifyToken, requireAdmin, safe(loanController?.getPortfolioByCollector));

// SEED
router.post('/seed', verifyToken, requireAdmin, safe(loanController?.seedDatabase));

export default router;
