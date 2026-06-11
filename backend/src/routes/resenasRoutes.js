const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getResenasPorLugar, createResena, updateResena } = require('../controllers/resenasController');

/**
 * @swagger
 * tags:
 *   name: Reseñas
 *   description: Reseñas y calificaciones de lugares
 */

/**
 * @swagger
 * /api/resenas/{lugarId}:
 *   get:
 *     summary: Obtener reseñas de un lugar
 *     tags: [Reseñas]
 *     parameters:
 *       - in: path
 *         name: lugarId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del lugar
 *     responses:
 *       200:
 *         description: Lista de reseñas del lugar
 *       404:
 *         description: Lugar no encontrado
 */
router.get('/:lugarId', getResenasPorLugar);

/**
 * @swagger
 * /api/resenas:
 *   post:
 *     summary: Crear reseña (usuario autenticado)
 *     tags: [Reseñas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lugar_id, calificacion]
 *             properties:
 *               lugar_id:
 *                 type: integer
 *                 example: 1
 *               calificacion:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comentario:
 *                 type: string
 *                 example: Excelente lugar, muy recomendado
 *     responses:
 *       201:
 *         description: Reseña creada exitosamente
 *       401:
 *         description: Token requerido
 */
router.post('/', authMiddleware, createResena);

/**
 * @swagger
 * /api/resenas/{id}:
 *   put:
 *     summary: Actualizar reseña propia (usuario autenticado)
 *     tags: [Reseñas]
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
 *             type: object
 *             properties:
 *               calificacion:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comentario:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reseña actualizada
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Solo puedes editar tus propias reseñas
 */
router.put('/:id', authMiddleware, updateResena);

module.exports = router;
