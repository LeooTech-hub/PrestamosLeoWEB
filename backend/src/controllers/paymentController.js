import loanController from './loanController.js';

export const paymentController = {
  // GET /api/payments & GET /api/payments/recent
  getPayments: (req, res) => loanController.getPayments(req, res),

  // GET /api/payments/history
  getPaymentHistory: (req, res) => loanController.getPaymentHistory(req, res),

  // POST /api/payments
  registerPayment: (req, res) => loanController.registerPayment(req, res),

  // PUT /api/payments/:id
  updatePayment: (req, res) => loanController.updatePayment(req, res),

  // DELETE /api/payments/:id
  deletePayment: (req, res) => loanController.deletePayment(req, res),

  // POST /api/payments/revert
  revertLastPayment: (req, res) => loanController.revertLastPayment(req, res),
};

export default paymentController;
