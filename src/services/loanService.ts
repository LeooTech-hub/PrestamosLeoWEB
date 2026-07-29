// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Función auxiliar para manejar peticiones HTTP
async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.statusText}`);
  }

  return response.json();
}

// Servicios para la aplicación
export const loanService = {
  // Clientes
  getClients: () => fetchAPI('/clients'),

  // Préstamos
  getLoans: () => fetchAPI('/loans'),
  createLoan: (data: Record<string, unknown>) =>
    fetchAPI('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Pagos
  getPayments: () => fetchAPI('/payments'),
  registerPayment: (data: Record<string, unknown>) =>
    fetchAPI('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Métricas del Dashboard y Colecciones del día
  getDashboardSummary: () => fetchAPI('/dashboard/summary'),
  getTodayCollections: () => fetchAPI('/today-collections'),
};

export default loanService;