import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import apiRoutes from './routes/apiRoutes.js';
import { initDbSchema } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PrestamosLeoWEB API REST activa (S/.)' });
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor backend Express.js escuchando en puerto ${PORT}`);
  console.log(`🔗 API REST base: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
  await initDbSchema();
});