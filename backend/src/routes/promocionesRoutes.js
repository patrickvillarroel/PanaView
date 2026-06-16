const express = require('express');
const router = express.Router();
const promocionesController = require('../controllers/promocionesController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Listar promociones de un negocio
router.get('/negocios/:negocioId', promocionesController.listarPromociones);

// Crear promocion (solo el propietario del negocio o admin)
router.post('/negocios/:negocioId', authMiddleware, roleMiddleware('negocio'), promocionesController.crearPromocion);

// Redeem endpoints (antes de /:promoId para evitar conflicto)
router.post('/redeem-by-qr', authMiddleware, promocionesController.redeemByQR);

// Obtener detalle promocion
router.get('/:promoId', promocionesController.obtenerPromocion);

// Actualizar promocion (solo el propietario del negocio o admin)
router.put('/:promoId', authMiddleware, roleMiddleware('negocio'), promocionesController.actualizarPromocion);

// Eliminar promocion (solo el propietario del negocio o admin)
router.delete('/:promoId', authMiddleware, roleMiddleware('negocio'), promocionesController.eliminarPromocion);

// Redeem by id
router.post('/:promoId/redeem', authMiddleware, promocionesController.redeemById);

module.exports = router;
