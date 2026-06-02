const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getNegociosCercanos, getNegocioById, createNegocio, updateNegocio } = require('../controllers/negociosController');

// GET /api/negocios?lat=&lng=&radio=500
router.get('/', getNegociosCercanos);

// GET /api/negocios/:id
router.get('/:id', getNegocioById);

// POST /api/negocios (solo negocio o admin)
router.post('/', authMiddleware, (req, res, next) => {
  if (req.user.rol !== 'negocio' && req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'No tienes permisos para crear negocios' });
  }
  next();
}, createNegocio);

// PUT /api/negocios/:id (solo el propietario o admin)
router.put('/:id', authMiddleware, updateNegocio);

module.exports = router;
