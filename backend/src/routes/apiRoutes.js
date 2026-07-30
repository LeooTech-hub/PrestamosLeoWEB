import express from 'express';
import loanController from '../controllers/loanController.js';

const router = express.Router();

// Clients Routes
router.get('/clients', loanController.getClients);
router.post('/clients', loanController.createClient);
router.put('/clients/:id', loanController.updateClient);
router.put('/clients/:id/restore', loanController.restoreClient);
router.delete('/clients/:id', loanController.deleteClient);

// Loans Routes
router.get('/loans', loanController.getLoans);
router.post('/loans', loanController.createClientAndLoan);
router.put('/loans/:id', loanController.updateLoan);
router.put('/loans/:id/restore', loanController.restoreLoan);
router.delete('/loans/:id', loanController.deleteLoan);

// Trash Bin Route
router.get('/trash', loanController.getTrash);

// Payments Routes
router.get('/payments', loanController.getPayments);
router.post('/payments', loanController.registerPayment);
router.post('/payments/revert', loanController.revertLastPayment);
router.post('/loans/:id/revert-payment', loanController.revertLastPayment);

// Expenses Routes
router.get('/expenses', loanController.getExpenses);
router.post('/expenses', loanController.addExpense);
router.delete('/expenses/:id', loanController.deleteExpense);

// Operations & Analytics Routes
router.get('/today-collections', loanController.getTodayCollections);
router.get('/alerts', loanController.getAlerts);
router.get('/dashboard/summary', loanController.getDashboardSummary);
router.get('/reports/financial', loanController.getFinancialReport);

// Demo Data Seed Route
router.post('/seed', loanController.seedDatabase);

export default router;