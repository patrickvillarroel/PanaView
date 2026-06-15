const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/facturacionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Negocio: ver su propio resumen de facturación
router.get('/negocio/:negocioId', authMiddleware, ctrl.resumenNegocio);

// Negocio: historial de canjeos (filtrable por ?cicloId=)
router.get('/negocio/:negocioId/canjeos', authMiddleware, ctrl.historialCanjeos);

// Admin: CRM global
router.get('/crm', authMiddleware, ctrl.crmResumen);

// Admin: marcar ciclo como pagado
router.post('/:cicloId/pagar', authMiddleware, ctrl.marcarPagado);

// Admin: configurar comisión y ciclo de un negocio
router.put('/negocio/:negocioId/config', authMiddleware, ctrl.configurarNegocio);

// Admin / cron: revisar vencimientos globalmente
router.post('/check-vencimientos', authMiddleware, ctrl.checkVencimientos);

module.exports = router;
