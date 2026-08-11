import loanController from './loanController.js';

export const getClients = loanController.getClients.bind(loanController);
export const createClient = loanController.createClient.bind(loanController);
export const updateClient = loanController.updateClient.bind(loanController);
export const deleteClient = loanController.deleteClient.bind(loanController);

export default {
  getClients: loanController.getClients.bind(loanController),
  createClient: loanController.createClient.bind(loanController),
  updateClient: loanController.updateClient.bind(loanController),
  deleteClient: loanController.deleteClient.bind(loanController),
};
