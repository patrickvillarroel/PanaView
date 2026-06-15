const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const compressImage = require('../middlewares/compressImage');
const { ImagenLugar, Lugar } = require('../models');
const { success, error } = require('../utils/responseHelper');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/lugares'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `lugar-${req.params.lugarId}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const permitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  permitidos.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Solo se permiten archivos JPEG, PNG o WebP'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/imagenes-lugar/:lugarId
router.post(
  '/:lugarId',
  authMiddleware,
  roleMiddleware('admin'),
  upload.single('imagen'),
  compressImage,
  async (req, res, next) => {
    try {
      const { lugarId } = req.params;
      const { es_portada, orden } = req.body;

      const lugar = await Lugar.findByPk(lugarId);
      if (!lugar) return error(res, 'Lugar no encontrado', 404);
      if (!req.file) return error(res, 'No se proporcionó ningún archivo', 400);

      if (es_portada === 'true' || es_portada === true) {
        await ImagenLugar.update(
          { es_portada: false },
          { where: { lugar_id: lugarId, es_portada: true } },
        );
      }

      const imagen = await ImagenLugar.create({
        lugar_id: lugarId,
        url: `/uploads/lugares/${req.file.filename}`,
        es_portada: es_portada === 'true' || es_portada === true,
        orden: parseInt(orden) || 0,
      });

      return success(res, imagen, 201);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/imagenes-lugar/:lugarId/:imagenId
router.delete('/:lugarId/:imagenId', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const { lugarId, imagenId } = req.params;

    const imagen = await ImagenLugar.findOne({ where: { id: imagenId, lugar_id: lugarId } });
    if (!imagen) return error(res, 'Imagen no encontrada', 404);

    const fs = require('fs');
    const filePath = path.join(__dirname, '../../uploads', imagen.url.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await imagen.destroy();
    return success(res, { mensaje: 'Imagen eliminada' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
