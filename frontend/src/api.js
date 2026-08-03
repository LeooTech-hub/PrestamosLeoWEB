import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones: asegura que todas las peticiones salientes adjunten el token guardado
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas: captura 401 (Unauthorized), limpia localStorage y notifica redirección a Login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        // Limpiar sesión en localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Disparar evento para actualizar el estado global en App.jsx y redirigir a VistaLogin
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;