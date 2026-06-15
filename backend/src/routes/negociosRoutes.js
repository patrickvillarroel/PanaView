const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getCategoriasNegocio, getMisNegocios, getNegociosCercanos, getAllNegocios, getNegocioById, createNegocio, updateNegocio, verifyNegocio, deleteNegocio } = require('../controllers/negociosController');

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

// Obtener categorías de negocios (público)
router.get('/categorias', getCategoriasNegocio);

// Listado completo para el panel de administración (?verificado=0|1)
router.get('/admin/todos', authMiddleware, roleMiddleware('admin'), getAllNegocios);

// Obtener negocios del propietario autenticado
router.get('/mis-negocios', (req, res, next) => {
  console.log('[ROUTE] /mis-negocios hit');
  next();
}, getMisNegocios);

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
router.post('/', authMiddleware, createNegocio);

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

/**
 * @swagger
 * /api/negocios/{id}/verificar:
 *   patch:
 *     summary: Verificar o rechazar un negocio (solo admin)
 *     tags: [Negocios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de verificación actualizado
 *       404:
 *         description: Negocio no encontrado
 */
router.patch('/:id/verificar', authMiddleware, roleMiddleware('admin'), verifyNegocio);

/**
 * @swagger
 * /api/negocios/{id}:
 *   delete:
 *     summary: Eliminar un negocio (solo admin)
 *     tags: [Negocios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Negocio eliminado
 *       404:
 *         description: Negocio no encontrado
 */
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteNegocio);

module.exports = router;
