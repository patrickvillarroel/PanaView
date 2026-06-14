const express = require('express');
const router = express.Router();
const { getResenasPorNegocio, createResena, updateResena } = require('../controllers/resenasNegociosController');

// Obtener reseñas de un negocio
router.get('/:negocioId', getResenasPorNegocio);

// Crear reseña (sin auth por ahora — dev mode)
router.post('/', createResena);

// Actualizar reseña
router.put('/:id', updateResena);

module.exports = router;
