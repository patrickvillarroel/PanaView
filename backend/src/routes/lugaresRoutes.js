const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getLugaresCercanos, getLugarById, createLugar, updateLugar } = require('../controllers/lugaresController');

// GET /api/lugares?lat=&lng=&radio=500
router.get('/', getLugaresCercanos);

// GET /api/lugares/:id
router.get('/:id', getLugarById);

// POST /api/lugares (solo admin)
router.post('/', authMiddleware, roleMiddleware('admin'), createLugar);

// PUT /api/lugares/:id (solo admin)
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateLugar);

module.exports = router;
