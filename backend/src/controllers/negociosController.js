const { Negocio, CategoriaNegocio, ImagenNegocio, ResenaNegocio, Promocion, ImagenPromocion, sequelize } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { calcularDistancia } = require('../utils/geoHelper');
const { fn, col, literal } = require('sequelize');

// Obtener categorías de negocios
async function getCategoriasNegocio(req, res, next) {
  try {
    const categorias = await CategoriaNegocio.findAll({
      attributes: ['id', 'nombre', 'icono'],
      order: [['id', 'ASC']],
    });
    return success(res, categorias);
  } catch (err) {
    next(err);
  }
}

// Obtener negocios cercanos por geolocalización
async function getNegociosCercanos(req, res, next) {
  try {
    const { lat, lng, radio } = req.query;

    if (!lat || !lng) {
      return error(res, 'Latitud y longitud son requeridas', 400);
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radioNum = parseInt(radio) || 500;

    if (isNaN(latNum) || isNaN(lngNum) || radioNum <= 0) {
      return error(res, 'Parámetros de geolocalización inválidos', 400);
    }

    // Obtener todos los negocios activos con imágenes
    const negocios = await Negocio.findAll({
      where: { activo: true },
      include: [
        {
          model: CategoriaNegocio,
          as: 'categoria',
          attributes: ['id', 'nombre', 'icono'],
        },
        {
          model: ImagenNegocio,
          as: 'imagenes',
          attributes: ['url', 'es_portada', 'orden'],
        },
      ],
    });

    // Obtener ratings de todos los negocios en una sola consulta
    const ratings = await ResenaNegocio.findAll({
      attributes: [
        'negocio_id',
        [fn('ROUND', fn('COALESCE', fn('AVG', col('calificacion')), 0), 1), 'calificacion_promedio'],
        [fn('COUNT', col('id')), 'total_resenas'],
      ],
      group: ['negocio_id'],
      raw: true,
    });

    // Map de ratings por negocio_id
    const ratingsMap = {};
    ratings.forEach(r => {
      ratingsMap[r.negocio_id] = {
        calificacion_promedio: parseFloat(r.calificacion_promedio),
        total_resenas: parseInt(r.total_resenas),
      };
    });

    // Filtrar por distancia y agregar ratings
    const negociosFiltrados = negocios
      .map(negocio => {
        const distancia = calcularDistancia(
          latNum,
          lngNum,
          parseFloat(negocio.latitud),
          parseFloat(negocio.longitud)
        );
        const rating = ratingsMap[negocio.id] || { calificacion_promedio: 0, total_resenas: 0 };

        return {
          ...negocio.toJSON(),
          distancia_metros: distancia,
          calificacion_promedio: rating.calificacion_promedio,
          total_resenas: rating.total_resenas,
        };
      })
      .filter(negocio => negocio.distancia_metros <= radioNum)
      .sort((a, b) => a.distancia_metros - b.distancia_metros);

    return success(res, negociosFiltrados);
  } catch (err) {
    next(err);
  }
}

// Obtener detalle de un negocio
async function getNegocioById(req, res, next) {
  try {
    const { id } = req.params;

    const negocio = await Negocio.findByPk(id, {
      include: [
        {
          model: CategoriaNegocio,
          as: 'categoria',
          attributes: ['id', 'nombre', 'icono'],
        },
        {
          model: ImagenNegocio,
          as: 'imagenes',
          attributes: ['url', 'es_portada', 'orden'],
          order: [['orden', 'ASC']],
        },
        {
          model: ResenaNegocio,
          as: 'resenas',
          include: [
            {
              model: require('../models').Usuario,
              as: 'usuario',
              attributes: ['id', 'nombre', 'foto_url'],
            },
          ],
          order: [['creado_en', 'DESC']],
        },
      ],
    });

    if (!negocio) {
      return error(res, 'Negocio no encontrado', 404);
    }

    // Calcular rating desde las reseñas incluidas
    const negocioJson = negocio.toJSON();
    const resenasList = negocioJson.resenas || [];
    const totalResenas = resenasList.length;
    const calificacionPromedio = totalResenas > 0
      ? parseFloat((resenasList.reduce((sum, r) => sum + r.calificacion, 0) / totalResenas).toFixed(1))
      : 0;

    negocioJson.calificacion_promedio = calificacionPromedio;
    negocioJson.total_resenas = totalResenas;

    return success(res, negocioJson);
  } catch (err) {
    next(err);
  }
}

// Obtener negocios del propietario autenticado
async function getMisNegocios(req, res, next) {
  try {
    const jwt = require('jsonwebtoken');
    let usuarioId = null;

    // Intentar obtener usuarioId del token JWT
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        usuarioId = decoded.id;
      } catch {
        // Token inválido, continuar sin usuarioId
      }
    }

    console.log('[getMisNegocios] usuarioId:', usuarioId);

    if (!usuarioId) {
      return success(res, []);
    }

    const negocios = await Negocio.findAll({
      where: { propietario_id: usuarioId },
      include: [
        {
          model: CategoriaNegocio,
          as: 'categoria',
          attributes: ['id', 'nombre', 'icono'],
        },
        {
          model: ImagenNegocio,
          as: 'imagenes',
          attributes: ['id', 'url', 'es_portada', 'orden'],
          separate: true,
          order: [['orden', 'ASC'], ['id', 'ASC']],
        },
      ],
      order: [['creado_en', 'DESC']],
    });

    console.log('[getMisNegocios] encontrados:', negocios.length);
    return success(res, negocios);
  } catch (err) {
    console.error('[getMisNegocios]', err);
    next(err);
  }
}

// Crear negocio (cualquier usuario autenticado)
async function createNegocio(req, res, next) {
  try {
    const { nombre, descripcion, latitud, longitud, direccion, telefono, whatsapp, horario, sitio_web, categoria_id, categoria } = req.body;

    const resolvedCategoriaId = categoria_id || categoria?.id;

    if (!nombre || !latitud || !longitud || !resolvedCategoriaId) {
      return error(res, 'Faltan campos requeridos', 400);
    }

    const negocio = await Negocio.create({
      nombre,
      descripcion,
      latitud,
      longitud,
      direccion,
      telefono,
      whatsapp,
      horario,
      sitio_web,
      categoria_id: resolvedCategoriaId,
      propietario_id: req.user.id,
    });

    // Si el usuario es turista, actualizarlo a negocio
    if (req.user.rol === 'turista') {
      const { Usuario } = require('../models');
      await Usuario.update({ rol: 'negocio', rol_id: 2 }, { where: { id: req.user.id } });
    }

    return success(res, negocio, 201);
  } catch (err) {
    next(err);
  }
}

// Actualizar negocio (solo el propietario o admin)
async function updateNegocio(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, latitud, longitud, direccion, telefono, whatsapp, horario, sitio_web, categoria_id, categoria } = req.body;

    const resolvedCategoriaId = categoria_id || categoria?.id;

    const negocio = await Negocio.findByPk(id);
    if (!negocio) {
      return error(res, 'Negocio no encontrado', 404);
    }

    await negocio.update({
      nombre: nombre || negocio.nombre,
      descripcion: descripcion ?? negocio.descripcion,
      latitud: latitud || negocio.latitud,
      longitud: longitud || negocio.longitud,
      direccion: direccion ?? negocio.direccion,
      telefono: telefono ?? negocio.telefono,
      whatsapp: whatsapp ?? negocio.whatsapp,
      horario: horario ?? negocio.horario,
      sitio_web: sitio_web ?? negocio.sitio_web,
      categoria_id: resolvedCategoriaId || negocio.categoria_id,
    });

    return success(res, negocio);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategoriasNegocio,
  getMisNegocios,
  getNegociosCercanos,
  getNegocioById,
  createNegocio,
  updateNegocio,
};
