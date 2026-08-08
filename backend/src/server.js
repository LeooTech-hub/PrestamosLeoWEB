import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import apiRoutes from './routes/apiRoutes.js';
import pool from './config/db.js';
import { initDb } from './config/initDb.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración explícita de CORS para Vercel y entorno local
const allowedOrigins = [
  'https://prestamos-leo-web.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Requested-With',
    'Expires',
    'cache-control',
    'pragma'
  ],
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Anti-cache middleware for all API requests
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint con verificación de BD
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', message: 'PrestamosLeoWEB API REST activa (S/.)' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Error interno en el servidor:', err);
  res.status(500).json({ status: 'error', message: err.message || 'Error interno del servidor' });
});

// Start Express Server & initialize DB
const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor backend Express.js escuchando en puerto ${PORT}`);
  console.log(`🔗 API REST base: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
  
  // Auto-initialize DB tables if not present
  await initDb();
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\nCerrando servidor (${signal})...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('Conexiones de TiDB Cloud cerradas limpiamente.');
      process.exit(0);
    } catch (err) {
      console.error('Error cerrando el pool de conexiones:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));