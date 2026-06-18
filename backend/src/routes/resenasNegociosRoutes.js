const express = require('express');
const router = express.Router();
const { getResenasPorNegocio, createResena, updateResena } = require('../controllers/resenasNegociosController');
const authMiddleware = require('../middlewares/authMiddleware');

// Obtener reseñas de un negocio
router.get('/:negocioId', getResenasPorNegocio);

// Crear reseña (requiere autenticación; el propietario no puede reseñar su propio negocio)
router.post('/', authMiddleware, createResena);

// Actualizar reseña
router.put('/:id', authMiddleware, updateResena);

module.exports = router;
