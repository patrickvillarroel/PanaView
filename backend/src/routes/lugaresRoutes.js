const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getLugaresCercanos, getAllLugares, getLugarById, createLugar, updateLugar, deleteLugar } = require('../controllers/lugaresController');

/**
 * @swagger
 * tags:
 *   name: Lugares
 *   description: Puntos turísticos e históricos de Panamá
 */

/**
 * @swagger
 * /api/lugares:
 *   get:
 *     summary: Obtener lugares cercanos a una coordenada
 *     tags: [Lugares]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         example: 9.0222775
 *         description: Latitud del punto de búsqueda
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         example: -79.5318078
 *         description: Longitud del punto de búsqueda
 *       - in: query
 *         name: radio
 *         schema:
 *           type: integer
 *           default: 500
 *         description: Radio de búsqueda en metros
 *     responses:
 *       200:
 *         description: Lista de lugares ordenados por distancia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lugar'
 *       400:
 *         description: Latitud y longitud son requeridas
 */
router.get('/', getLugaresCercanos);

// Listado completo para el panel de administración (debe ir antes de /:id)
router.get('/admin/todos', authMiddleware, roleMiddleware('admin'), getAllLugares);

/**
 * @swagger
 * /api/lugares/{id}:
 *   get:
 *     summary: Obtener detalle de un lugar por ID
 *     tags: [Lugares]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del lugar
 *     responses:
 *       200:
 *         description: Detalle completo del lugar con imágenes y reseñas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lugar'
 *       404:
 *         description: Lugar no encontrado
 */
router.get('/:id', getLugarById);

/**
 * @swagger
 * /api/lugares:
 *   post:
 *     summary: Crear nuevo lugar (solo admin)
 *     tags: [Lugares]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LugarInput'
 *     responses:
 *       201:
 *         description: Lugar creado exitosamente
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Solo administradores pueden crear lugares
 */
router.post('/', authMiddleware, roleMiddleware('admin'), createLugar);

/**
 * @swagger
 * /api/lugares/{id}:
 *   put:
 *     summary: Actualizar un lugar (solo admin)
 *     tags: [Lugares]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LugarInput'
 *     responses:
 *       200:
 *         description: Lugar actualizado
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Lugar no encontrado
 */
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateLugar);

/**
 * @swagger
 * /api/lugares/{id}:
 *   delete:
 *     summary: Eliminar un lugar (solo admin)
 *     tags: [Lugares]
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
 *         description: Lugar eliminado
 *       404:
 *         description: Lugar no encontrado
 */
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteLugar);

module.exports = router;
