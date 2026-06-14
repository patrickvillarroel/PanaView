const express = require('express');
const router = express.Router();
const { checkFavorito, toggleFavorito, getFavoritos } = require('../controllers/favoritosNegociosController');

/**
 * @swagger
 * tags:
 *   name: FavoritosNegocios
 *   description: Gestión de negocios favoritos del usuario
 */

/**
 * @swagger
 * /api/favoritos-negocios:
 *   get:
 *     summary: Obtener todos los negocios favoritos del usuario
 *     tags: [FavoritosNegocios]
 *     responses:
 *       200:
 *         description: Lista de negocios favoritos
 */
router.get('/', getFavoritos);

/**
 * @swagger
 * /api/favoritos-negocios/{negocioId}/check:
 *   get:
 *     summary: Verificar si un negocio es favorito
 *     tags: [FavoritosNegocios]
 *     parameters:
 *       - in: path
 *         name: negocioId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del negocio
 *     responses:
 *       200:
 *         description: Estado de favorito
 */
router.get('/:negocioId/check', checkFavorito);

/**
 * @swagger
 * /api/favoritos-negocios/{negocioId}:
 *   post:
 *     summary: Toggle favorito (agregar/quitar)
 *     tags: [FavoritosNegocios]
 *     parameters:
 *       - in: path
 *         name: negocioId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del negocio
 *     responses:
 *       200:
 *         description: Favorito toggled
 *       201:
 *         description: Agregado a favoritos
 */
router.post('/:negocioId', toggleFavorito);

module.exports = router;
