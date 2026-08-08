import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones: lee 'token' o 'jwt' de localStorage y agrega query param anti-caché a GET
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Usar únicamente parámetro timestamp query string en peticiones GET para refresco de datos
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas: captura 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        // Borrar token y datos del usuario de localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');

        // Notificar cambio de estado a no autenticado para redirigir de inmediato al login
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;