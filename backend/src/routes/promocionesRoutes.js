const express = require('express');
const router = express.Router();
const promocionesController = require('../controllers/promocionesController');
const authMiddleware = require('../middlewares/authMiddleware');

// Listar promociones de un negocio
router.get('/negocios/:negocioId', promocionesController.listarPromociones);

// Crear promocion (requiere autenticacion y que sea propietario) - simplified for now
router.post('/negocios/:negocioId', authMiddleware, promocionesController.crearPromocion);

// Obtener detalle promocion
router.get('/:promoId', promocionesController.obtenerPromocion);

// Redeem endpoints
router.post('/:promoId/redeem', authMiddleware, promocionesController.redeemById);
router.post('/redeem-by-qr', authMiddleware, promocionesController.redeemByQR);

module.exports = router;
