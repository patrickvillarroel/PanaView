const { Negocio, CategoriaNegocio, ImagenNegocio, ResenaNegocio, Promocion, ImagenPromocion, Usuario, sequelize } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { calcularDistancia } = require('../utils/geoHelper');
const { fn, col, literal } = require('sequelize');

// Crea o actualiza la imagen de portada de un negocio a partir de una URL.
async function upsertPortadaNegocio(negocioId, urlPortada) {
  if (urlPortada === undefined || urlPortada === null) return;
  const url = String(urlPortada).trim();
  if (!url) return;

  const portadaActual = await ImagenNegocio.findOne({
    where: { negocio_id: negocioId, es_portada: true },
  });

  if (portadaActual) {
    portadaActual.url = url;
    await portadaActual.save();
  } else {
    await ImagenNegocio.create({
      negocio_id: negocioId,
      url,
      es_portada: true,
      orden: 0,
    });
  }
}

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

    // Obtener todos los negocios activos y verificados con imágenes
    const negocios = await Negocio.findAll({
      where: { activo: true, verificado: true },
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

// Listar todos los negocios (solo admin) — sin filtro geográfico.
// Soporta ?verificado=0|1 para separar solicitudes pendientes de negocios aprobados.
async function getAllNegocios(req, res, next) {
  try {
    const { verificado } = req.query;
    const where = {};

    if (verificado === '0' || verificado === 'false') {
      where.verificado = false;
    } else if (verificado === '1' || verificado === 'true') {
      where.verificado = true;
    }

    const negocios = await Negocio.findAll({
      where,
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
        {
          model: Usuario,
          as: 'propietario',
          attributes: ['id', 'nombre', 'email'],
        },
      ],
      order: [['creado_en', 'DESC']],
    });

    return success(res, negocios.map((n) => n.toJSON()));
  } catch (err) {
    next(err);
  }
}

// Verificar / des-verificar un negocio (solo admin) — aprobar solicitudes
async function verifyNegocio(req, res, next) {
  try {
    const { id } = req.params;
    const { verificado } = req.body;

    const negocio = await Negocio.findByPk(id);
    if (!negocio) {
      return error(res, 'Negocio no encontrado', 404);
    }

    negocio.verificado = verificado === undefined ? true : Boolean(verificado);
    await negocio.save();

    return success(res, { id, verificado: negocio.verificado });
  } catch (err) {
    next(err);
  }
}

// Eliminar negocio (solo admin)
async function deleteNegocio(req, res, next) {
  try {
    const { id } = req.params;

    const negocio = await Negocio.findByPk(id);
    if (!negocio) {
      return error(res, 'Negocio no encontrado', 404);
    }

    await negocio.destroy();

    return success(res, { id, eliminado: true });
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
    const { nombre, descripcion, latitud, longitud, direccion, telefono, whatsapp, horario, sitio_web, categoria_id, categoria, verificado, imagen_portada } = req.body;

    const resolvedCategoriaId = categoria_id || categoria?.id;

    if (!nombre || !latitud || !longitud || !resolvedCategoriaId) {
      return error(res, 'Faltan campos requeridos', 400);
    }

    // Un propietario solo puede tener un negocio registrado
    if (req.user.rol !== 'admin') {
      const negocioExistente = await Negocio.findOne({ where: { propietario_id: req.user.id } });
      if (negocioExistente) {
        return error(res, 'Ya tienes un negocio registrado. Solo se permite uno por propietario.', 400);
      }
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
      // Un admin puede crear el negocio ya verificado; un propietario entra como pendiente
      verificado: req.user.rol === 'admin' ? Boolean(verificado) : false,
      propietario_id: req.user.id,
    });

    await upsertPortadaNegocio(negocio.id, imagen_portada);

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
    const { nombre, descripcion, latitud, longitud, direccion, telefono, whatsapp, horario, sitio_web, categoria_id, imagen_portada } = req.body;

    const negocio = await Negocio.findByPk(id);
    if (!negocio) {
      return error(res, 'Negocio no encontrado', 404);
    }

    await negocio.update({
      nombre: nombre ?? negocio.nombre,
      descripcion: descripcion ?? negocio.descripcion,
      latitud: latitud ?? negocio.latitud,
      longitud: longitud ?? negocio.longitud,
      direccion: direccion ?? negocio.direccion,
      telefono: telefono ?? negocio.telefono,
      whatsapp: whatsapp ?? negocio.whatsapp,
      horario: horario ?? negocio.horario,
      sitio_web: sitio_web ?? negocio.sitio_web,
      categoria_id: categoria_id ?? negocio.categoria_id,
    });

    await upsertPortadaNegocio(negocio.id, imagen_portada);

    return success(res, negocio);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategoriasNegocio,
  getMisNegocios,
  getNegociosCercanos,
  getAllNegocios,
  getNegocioById,
  createNegocio,
  updateNegocio,
  verifyNegocio,
  deleteNegocio,
};
