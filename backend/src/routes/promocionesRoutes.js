const express = require('express');
const router = express.Router();
const promocionesController = require('../controllers/promocionesController');
const authMiddleware = require('../middlewares/authMiddleware');

// Listar promociones de un negocio
router.get('/negocios/:negocioId', promocionesController.listarPromociones);

// Crear promocion (requiere autenticacion y que sea propietario) - simplified for now
router.post('/negocios/:negocioId', authMiddleware, promocionesController.crearPromocion);

// Redeem endpoints (antes de /:promoId para evitar conflicto)
router.post('/redeem-by-qr', authMiddleware, promocionesController.redeemByQR);

// Obtener detalle promocion
router.get('/:promoId', promocionesController.obtenerPromocion);

// Actualizar promocion (sin auth para dev)
router.put('/:promoId', promocionesController.actualizarPromocion);

// Eliminar promocion (sin auth para dev)
router.delete('/:promoId', promocionesController.eliminarPromocion);

// Redeem by id
router.post('/:promoId/redeem', authMiddleware, promocionesController.redeemById);

module.exports = router;
