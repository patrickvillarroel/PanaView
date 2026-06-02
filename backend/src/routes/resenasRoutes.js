const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getResenasPorLugar, createResena, updateResena } = require('../controllers/resenasController');

// GET /api/resenas/:lugarId
router.get('/:lugarId', getResenasPorLugar);

// POST /api/resenas (solo autenticado)
router.post('/', authMiddleware, createResena);

// PUT /api/resenas/:id (solo autenticado)
router.put('/:id', authMiddleware, updateResena);

module.exports = router;
