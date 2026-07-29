import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import apiRoutes from './routes/apiRoutes.js';
import { initDbSchema } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración explícita de CORS para Vercel y entorno local
const allowedOrigins = [
  'https://prestamos-leo-web.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como Postman o curl) o si está en la lista permitida
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // O cambiar por callback(new Error('No permitido por CORS')) tras probar
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Responder explícitamente a las peticiones Preflight (OPTIONS)
app.options('*', cors());

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PrestamosLeoWEB API REST activa (S/.)' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Error interno en el servidor:', err);
  res.status(500).json({ status: 'error', message: err.message || 'Error interno del servidor' });
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor backend Express.js escuchando en puerto ${PORT}`);
  console.log(`🔗 API REST base: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
  await initDbSchema();
});