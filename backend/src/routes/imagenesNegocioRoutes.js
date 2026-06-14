const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware');
const { ImagenNegocio, Negocio } = require('../models');
const { success, error } = require('../utils/responseHelper');

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/negocios'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nombre = `negocio-${req.params.negocioId}-${Date.now()}${ext}`;
    cb(null, nombre);
  },
});

const fileFilter = (req, file, cb) => {
  const permitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (permitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos JPEG, PNG o WebP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * @swagger
 * tags:
 *   name: ImagenesNegocio
 *   description: Gestión de imágenes de negocios
 */

/**
 * @swagger
 * /api/imagenes-negocio/{negocioId}:
 *   post:
 *     summary: Subir imagen a un negocio
 *     tags: [ImagenesNegocio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: negocioId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *               es_portada:
 *                 type: boolean
 *               orden:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Imagen subida exitosamente
 *       400:
 *         description: Archivo no válido
 *       401:
 *         description: Token requerido
 */
router.post('/:negocioId', authMiddleware, upload.single('imagen'), async (req, res, next) => {
  try {
    const { negocioId } = req.params;
    const { es_portada, orden } = req.body;

    // Verificar que el negocio existe y el usuario es propietario
    const negocio = await Negocio.findByPk(negocioId);
    if (!negocio) {
      return error(res, 'Negocio no encontrado', 404);
    }

    if (negocio.propietario_id !== req.user.id && req.user.rol !== 'admin') {
      return error(res, 'No tienes permisos para subir imágenes a este negocio', 403);
    }

    if (!req.file) {
      return error(res, 'No se proporcionó ningún archivo', 400);
    }

    // Si es portada, quitar portada anterior
    if (es_portada === 'true' || es_portada === true) {
      await ImagenNegocio.update(
        { es_portada: false },
        { where: { negocio_id: negocioId, es_portada: true } }
      );
    }

    const imagen = await ImagenNegocio.create({
      negocio_id: negocioId,
      url: `/uploads/negocios/${req.file.filename}`,
      es_portada: es_portada === 'true' || es_portada === true,
      orden: parseInt(orden) || 0,
    });

    return success(res, imagen, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/imagenes-negocio/{negocioId}/{imagenId}:
 *   delete:
 *     summary: Eliminar imagen de un negocio
 *     tags: [ImagenesNegocio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: negocioId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imagenId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Imagen eliminada
 *       401:
 *         description: Token requerido
 */
router.delete('/:negocioId/:imagenId', authMiddleware, async (req, res, next) => {
  try {
    const { negocioId, imagenId } = req.params;

    const negocio = await Negocio.findByPk(negocioId);
    if (!negocio) {
      return error(res, 'Negocio no encontrado', 404);
    }

    if (negocio.propietario_id !== req.user.id && req.user.rol !== 'admin') {
      return error(res, 'No tienes permisos para eliminar imágenes de este negocio', 403);
    }

    const imagen = await ImagenNegocio.findOne({
      where: { id: imagenId, negocio_id: negocioId },
    });

    if (!imagen) {
      return error(res, 'Imagen no encontrada', 404);
    }

    // Eliminar archivo físico
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../uploads', imagen.url.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await imagen.destroy();
    return success(res, { mensaje: 'Imagen eliminada' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
