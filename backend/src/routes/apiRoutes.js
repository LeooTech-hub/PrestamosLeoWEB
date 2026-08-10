import express from 'express';
import loanController from '../controllers/loanController.js';
import reniecController from '../controllers/reniecController.js';
import { authController } from '../controllers/authController.js';
import { userController } from '../controllers/userController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// PUBLIC AUTH ROUTES
// ==========================================
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// ==========================================
// PROTECTED ROUTES (Middleware verifyToken)
// ==========================================

// User verification endpoint
router.get('/auth/me', verifyToken, authController.me);

// ==========================================
// USER MANAGEMENT ROUTES (ADMIN only)
// ==========================================
router.get('/users', verifyToken, requireAdmin, userController.listUsers);
router.post('/users', verifyToken, requireAdmin, userController.createUser);
router.delete('/users/:id', verifyToken, requireAdmin, userController.deleteUser);

// RENIEC Route
router.get('/reniec/:dni', verifyToken, reniecController.getDniInfo);

// Clients Routes
router.get('/clients', verifyToken, loanController.getClients);
router.post('/clients', verifyToken, loanController.createClient);
router.put('/clients/assign', verifyToken, requireAdmin, loanController.assignClients);
router.put('/clients/reorder', verifyToken, loanController.updateRouteOrders);
router.put('/clients/:id', verifyToken, loanController.updateClient);
router.put('/clients/:id/restore', verifyToken, loanController.restoreClient);
router.delete('/clients/:id', verifyToken, requireAdmin, loanController.deleteClient);

// Loans Routes
router.get('/loans', verifyToken, loanController.getLoans);
router.post('/loans', verifyToken, loanController.createClientAndLoan);
router.put('/loans/:id', verifyToken, loanController.updateLoan);
router.put('/loans/:id/restore', verifyToken, loanController.restoreLoan);
router.delete('/loans/:id', verifyToken, requireAdmin, loanController.deleteLoan);

// Trash Bin Route (ADMIN only)
router.get('/trash', verifyToken, requireAdmin, loanController.getTrash);

// Payments Routes
router.get('/payments', verifyToken, loanController.getPayments);
router.post('/payments', verifyToken, loanController.registerPayment);
router.put('/payments/:id', verifyToken, loanController.updatePayment);
router.delete('/payments/:id', verifyToken, requireAdmin, loanController.deletePayment);
router.post('/payments/revert', verifyToken, loanController.revertLastPayment);
router.post('/loans/:id/revert-payment', verifyToken, loanController.revertLastPayment);

// Expenses Routes
router.get('/expenses', verifyToken, loanController.getExpenses);
router.post('/expenses', verifyToken, loanController.addExpense);
router.put('/expenses/:id', verifyToken, loanController.updateExpense);
router.delete('/expenses/:id', verifyToken, requireAdmin, loanController.deleteExpense);

// Operations & Analytics Routes
router.get('/today-collections', verifyToken, loanController.getTodayCollections);
router.get('/alerts', verifyToken, loanController.getAlerts);
router.get('/dashboard/summary', verifyToken, loanController.getDashboardSummary);
router.get('/reports/financial', verifyToken, loanController.getFinancialReport);

// Admin Collector Management Routes
router.get('/admin/collectors/stats', verifyToken, requireAdmin, loanController.getCollectorStats);
router.get('/admin/collectors/:id/activity', verifyToken, requireAdmin, loanController.getCollectorActivity);

// Demo Data Seed Route
router.post('/seed', verifyToken, loanController.seedDatabase);

export default router;