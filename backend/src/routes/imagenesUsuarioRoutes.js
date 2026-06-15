const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middlewares/authMiddleware');
const { ImagenUsuario, Usuario } = require('../models');
const { success, error } = require('../utils/responseHelper');

const uploadsDir = path.join(__dirname, '../../uploads/usuarios');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nombre = `usuario-${req.params.usuarioId}-${Date.now()}${ext}`;
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

router.post('/:usuarioId', authMiddleware, upload.single('imagen'), async (req, res, next) => {
  try {
    const { usuarioId } = req.params;

    if (req.user.id !== usuarioId) {
      return error(res, 'No puedes modificar la foto de otro usuario', 403);
    }

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return error(res, 'Usuario no encontrado', 404);
    }

    if (!req.file) {
      return error(res, 'No se proporcionó ningún archivo', 400);
    }

    const url = `/uploads/usuarios/${req.file.filename}`;

    await ImagenUsuario.update(
      { es_portada: false },
      { where: { usuario_id: usuarioId, es_portada: true } }
    );

    const imagen = await ImagenUsuario.create({
      usuario_id: usuarioId,
      url,
      es_portada: true,
      orden: 0,
    });

    usuario.foto_url = url;
    await usuario.save();

    return success(res, {
      imagen,
      foto_url: url,
    }, 201);
  } catch (err) {
    next(err);
  }
});

router.delete('/:usuarioId/:imagenId', authMiddleware, async (req, res, next) => {
  try {
    const { usuarioId, imagenId } = req.params;

    if (req.user.id !== usuarioId) {
      return error(res, 'No puedes modificar la foto de otro usuario', 403);
    }

    const imagen = await ImagenUsuario.findOne({
      where: { id: imagenId, usuario_id: usuarioId },
    });

    if (!imagen) {
      return error(res, 'Imagen no encontrada', 404);
    }

    const filePath = path.join(__dirname, '../../uploads', imagen.url.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await imagen.destroy();

    const usuario = await Usuario.findByPk(usuarioId);
    if (usuario && usuario.foto_url === imagen.url) {
      usuario.foto_url = null;
      await usuario.save();
    }

    return success(res, { mensaje: 'Imagen eliminada' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
