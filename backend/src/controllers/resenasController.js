const { ResenaLugar, Usuario, Lugar } = require('../models');
const { success, error } = require('../utils/responseHelper');

// Obtener reseñas de un lugar
async function getResenasPorLugar(req, res, next) {
  try {
    const { lugarId } = req.params;
    
    const resenas = await ResenaLugar.findAll({
      where: { lugar_id: lugarId },
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

// Crear reseña de un lugar (solo autenticado)
async function createResena(req, res, next) {
  try {
    const { lugar_id, calificacion, comentario } = req.body;
    
    // Validar campos
    if (!lugar_id || !calificacion) {
      return error(res, 'lugar_id y calificacion son requeridos', 400);
    }
    
    // Validar rango de calificación
    if (calificacion < 1 || calificacion > 5 || !Number.isInteger(calificacion)) {
      return error(res, 'La calificacion debe ser un número entero entre 1 y 5', 400);
    }
    
    // Verificar que el lugar existe
    const lugar = await Lugar.findByPk(lugar_id);
    if (!lugar) {
      return error(res, 'Lugar no encontrado', 404);
    }
    
    // Verificar si el usuario ya tiene una reseña en este lugar
    const resenaExistente = await ResenaLugar.findOne({
      where: {
        lugar_id,
        usuario_id: req.user.id,
      },
    });
    
    if (resenaExistente) {
      return error(res, 'Ya has dejado una reseña para este lugar', 409);
    }
    
    // Crear reseña
    const resena = await ResenaLugar.create({
      lugar_id,
      usuario_id: req.user.id,
      calificacion,
      comentario: comentario || null,
    });
    
    // Incluir datos del usuario
    const resenaConUsuario = await ResenaLugar.findByPk(resena.id, {
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
    next(err);
  }
}

// Actualizar reseña (solo el autor)
async function updateResena(req, res, next) {
  try {
    const { id } = req.params;
    const { calificacion, comentario } = req.body;
    
    const resena = await ResenaLugar.findByPk(id);
    if (!resena) {
      return error(res, 'Reseña no encontrada', 404);
    }
    
    // Validar permisos
    if (resena.usuario_id !== req.user.id) {
      return error(res, 'No puedes actualizar una reseña que no escribiste', 403);
    }
    
    // Validar calificación si se proporciona
    if (calificacion !== undefined && (calificacion < 1 || calificacion > 5)) {
      return error(res, 'La calificacion debe estar entre 1 y 5', 400);
    }
    
    await resena.update({
      calificacion: calificacion || resena.calificacion,
      comentario: comentario || resena.comentario,
    });
    
    const resenaActualizada = await ResenaLugar.findByPk(id, {
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
  getResenasPorLugar,
  createResena,
  updateResena,
};
