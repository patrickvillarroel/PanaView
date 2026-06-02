// Middleware global para manejo de errores
function errorMiddleware(err, req, res, next) {
  console.error('Error:', err);
  
  // Errores de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors.map(e => e.message),
    });
  }
  
  // Errores de restricción única
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'El recurso ya existe',
    });
  }
  
  // Errores genéricos
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorMiddleware;
