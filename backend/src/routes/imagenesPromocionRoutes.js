const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const compressImage = require('../middlewares/compressImage');
const { ImagenPromocion, Promocion, Negocio } = require('../models');
const { success, error } = require('../utils/responseHelper');

// Asegurar que existe el directorio
const uploadsDir = path.join(__dirname, '../../uploads/promociones');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nombre = `promo-${req.params.promocionId}-${Date.now()}${ext}`;
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Subir imagen a una promoción
router.post('/:promocionId', upload.single('imagen'), compressImage, async (req, res, next) => {
  try {
    const { promocionId } = req.params;
    const { es_portada, orden } = req.body;

    const promocion = await Promocion.findByPk(promocionId);
    if (!promocion) {
      return error(res, 'Promoción no encontrada', 404);
    }

    if (!req.file) {
      return error(res, 'No se proporcionó ningún archivo', 400);
    }

    console.log('[upload-promo] archivo subido:', req.file.filename);

    // Si es portada, quitar portada anterior
    if (es_portada === 'true' || es_portada === true) {
      await ImagenPromocion.update(
        { es_portada: false },
        { where: { promocion_id: promocionId, es_portada: true } }
      );
    }

    const imagen = await ImagenPromocion.create({
      promocion_id: promocionId,
      url: `/uploads/promociones/${req.file.filename}`,
      es_portada: es_portada === 'true' || es_portada === true,
      orden: parseInt(orden) || 0,
    });

    return success(res, imagen, 201);
  } catch (err) {
    next(err);
  }
});

// Eliminar imagen de una promoción
router.delete('/:promocionId/:imagenId', async (req, res, next) => {
  try {
    const { promocionId, imagenId } = req.params;

    const imagen = await ImagenPromocion.findOne({
      where: { id: imagenId, promocion_id: promocionId },
    });

    if (!imagen) {
      return error(res, 'Imagen no encontrada', 404);
    }

    // Eliminar archivo físico
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
