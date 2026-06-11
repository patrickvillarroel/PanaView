const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getNegociosCercanos, getNegocioById, createNegocio, updateNegocio } = require('../controllers/negociosController');

/**
 * @swagger
 * tags:
 *   name: Negocios
 *   description: Negocios turísticos registrados por propietarios
 */

/**
 * @swagger
 * /api/negocios:
 *   get:
 *     summary: Obtener negocios cercanos a una coordenada
 *     tags: [Negocios]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         example: 9.0222775
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         example: -79.5318078
 *       - in: query
 *         name: radio
 *         schema:
 *           type: integer
 *           default: 500
 *         description: Radio en metros
 *     responses:
 *       200:
 *         description: Lista de negocios ordenados por distancia
 *       400:
 *         description: Coordenadas requeridas
 */
router.get('/', getNegociosCercanos);

/**
 * @swagger
 * /api/negocios/{id}:
 *   get:
 *     summary: Obtener detalle de un negocio por ID
 *     tags: [Negocios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle del negocio
 *       404:
 *         description: Negocio no encontrado
 */
router.get('/:id', getNegocioById);

/**
 * @swagger
 * /api/negocios:
 *   post:
 *     summary: Crear negocio (rol negocio o admin)
 *     tags: [Negocios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NegocioInput'
 *     responses:
 *       201:
 *         description: Negocio creado
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Rol insuficiente
 */
router.post('/', authMiddleware, (req, res, next) => {
  if (req.user.rol !== 'negocio' && req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'No tienes permisos para crear negocios' });
  }
  next();
}, createNegocio);

/**
 * @swagger
 * /api/negocios/{id}:
 *   put:
 *     summary: Actualizar negocio (propietario o admin)
 *     tags: [Negocios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NegocioInput'
 *     responses:
 *       200:
 *         description: Negocio actualizado
 *       401:
 *         description: Token requerido
 *       404:
 *         description: Negocio no encontrado
 */
router.put('/:id', authMiddleware, updateNegocio);

module.exports = router;
