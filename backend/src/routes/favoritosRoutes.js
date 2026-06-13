const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { toggleFavorito } = require('../controllers/favoritosController');

router.post('/:lugarId', authMiddleware, toggleFavorito);

module.exports = router;