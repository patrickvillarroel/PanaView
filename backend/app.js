require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./src/routes/authRoutes');
const lugaresRoutes = require('./src/routes/lugaresRoutes');
const negociosRoutes = require('./src/routes/negociosRoutes');
const resenasRoutes = require('./src/routes/resenasRoutes');
const errorMiddleware = require('./src/middlewares/errorMiddleware');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // En producción, especificar orígenes permitidos
  credentials: true,
}));

// Rate limiting para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por windowMs
  message: 'Demasiados intentos de autenticación, intenta más tarde',
});

app.use('/api/auth/', authLimiter);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/lugares', lugaresRoutes);
app.use('/api/negocios', negociosRoutes);
app.use('/api/resenas', resenasRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Backend funcionando correctamente' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Middleware de errores (debe estar al final)
app.use(errorMiddleware);

module.exports = app;
