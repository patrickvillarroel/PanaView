const { error } = require('../utils/responseHelper');

// Middleware de fábrica para verificar rol específico
function roleMiddleware(rolRequerido) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Usuario no autenticado', 401);
    }
    
    if (req.user.rol !== rolRequerido && req.user.rol !== 'admin') {
      return error(res, 'No tienes permisos para esta acción', 403);
    }
    
    next();
  };
}

module.exports = roleMiddleware;
