const { ResenaNegocio, Usuario, Negocio } = require('../models');
const { success, error } = require('../utils/responseHelper');

// Obtener reseñas de un negocio
async function getResenasPorNegocio(req, res, next) {
  try {
    const { negocioId } = req.params;

    const resenas = await ResenaNegocio.findAll({
      where: { negocio_id: negocioId },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'foto_url'],
        },
      ],
      order: [['creado_en', 'DESC']],
      limit: 50,
    });

    return success(res, resenas);
  } catch (err) {
    next(err);
  }
}

// Crear reseña de un negocio (sin auth por ahora — dev mode)
async function createResena(req, res, next) {
  try {
    const { negocio_id, calificacion, comentario } = req.body;

    if (!negocio_id || !calificacion) {
      return error(res, 'negocio_id y calificacion son requeridos', 400);
    }

    if (calificacion < 1 || calificacion > 5 || !Number.isInteger(calificacion)) {
      return error(res, 'La calificacion debe ser un número entero entre 1 y 5', 400);
    }

    // Verificar que el negocio existe
    const negocio = await Negocio.findByPk(negocio_id);
    if (!negocio) {
      return error(res, 'Negocio no encontrado', 404);
    }

    // En dev mode: buscar cualquier usuario (sin auth)
    const usuario = await Usuario.findOne();
    if (!usuario) {
      return error(res, 'No hay usuarios disponibles', 500);
    }
    const usuarioId = req.user?.id || usuario.id;

    // Verificar si el usuario ya tiene una reseña en este negocio
    const resenaExistente = await ResenaNegocio.findOne({
      where: {
        negocio_id,
        usuario_id: usuarioId,
      },
    });

    if (resenaExistente) {
      return error(res, 'Ya has dejado una reseña para este negocio', 409);
    }

    // Crear reseña
    const resena = await ResenaNegocio.create({
      negocio_id,
      usuario_id: usuarioId,
      calificacion,
      comentario: comentario || null,
    });

    // Incluir datos del usuario
    const resenaConUsuario = await ResenaNegocio.findByPk(resena.id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'foto_url'],
        },
      ],
    });

    return success(res, resenaConUsuario, 201);
  } catch (err) {
    console.error('[createResenaNegocio]', err);
    next(err);
  }
}

// Actualizar reseña (solo el autor)
async function updateResena(req, res, next) {
  try {
    const { id } = req.params;
    const { calificacion, comentario } = req.body;

    const resena = await ResenaNegocio.findByPk(id);
    if (!resena) {
      return error(res, 'Reseña no encontrada', 404);
    }

    // En dev mode, permitir actualizar sin validación de usuario
    if (calificacion !== undefined && (calificacion < 1 || calificacion > 5)) {
      return error(res, 'La calificacion debe estar entre 1 y 5', 400);
    }

    await resena.update({
      calificacion: calificacion || resena.calificacion,
      comentario: comentario !== undefined ? comentario : resena.comentario,
    });

    const resenaActualizada = await ResenaNegocio.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'foto_url'],
        },
      ],
    });

    return success(res, resenaActualizada);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getResenasPorNegocio,
  createResena,
  updateResena,
};
