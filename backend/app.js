require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const authRoutes = require('./src/routes/authRoutes');
const lugaresRoutes = require('./src/routes/lugaresRoutes');
const negociosRoutes = require('./src/routes/negociosRoutes');
const resenasRoutes = require('./src/routes/resenasRoutes');
const favoritosRoutes = require('./src/routes/favoritosRoutes');
const promocionesRoutes = require('./src/routes/promocionesRoutes');
const favoritosNegociosRoutes = require('./src/routes/favoritosNegociosRoutes');
const imagenesNegocioRoutes = require('./src/routes/imagenesNegocioRoutes');
const resenasNegociosRoutes = require('./src/routes/resenasNegociosRoutes');
const imagenesPromocionRoutes = require('./src/routes/imagenesPromocionRoutes');
const imagenesUsuarioRoutes = require('./src/routes/imagenesUsuarioRoutes');
const errorMiddleware = require('./src/middlewares/errorMiddleware');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // En producción, especificar orígenes permitidos
  credentials: true,
}));

// Archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por windowMs
  message: 'Demasiados intentos de autenticación, intenta más tarde',
});

app.use('/api/auth/', authLimiter);

// Swagger UI — disponible solo fuera de producción
if (process.env.NODE_ENV !== 'production') {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'PanaView API Docs',
      swaggerOptions: {
        persistAuthorization: true, // mantiene el token al recargar
      },
    })
  );
  // Endpoint para descargar el JSON de la especificación
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  console.log('📋 Swagger UI disponible en: http://localhost:3000/api/docs');
}

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/lugares', lugaresRoutes);
app.use('/api/negocios', negociosRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/promociones', promocionesRoutes);
app.use('/api/favoritos-negocios', favoritosNegociosRoutes);
app.use('/api/imagenes-negocio', imagenesNegocioRoutes);
app.use('/api/resenas-negocios', resenasNegociosRoutes);
app.use('/api/imagenes-promocion', imagenesPromocionRoutes);
app.use('/api/imagenes-usuario', imagenesUsuarioRoutes);

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
