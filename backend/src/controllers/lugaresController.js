const { Lugar, CategoriaLugar, ImagenLugar, ResenaLugar, sequelize } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { calcularDistancia } = require('../utils/geoHelper');
const { Op } = require('sequelize');

// Crea o actualiza la imagen de portada de un lugar a partir de una URL.
// Si la URL viene vacía/null, no hace nada (mantiene la portada actual).
async function upsertPortadaLugar(lugarId, urlPortada) {
  if (urlPortada === undefined || urlPortada === null) return;
  const url = String(urlPortada).trim();
  if (!url) return;

  const portadaActual = await ImagenLugar.findOne({
    where: { lugar_id: lugarId, es_portada: true },
  });

  if (portadaActual) {
    portadaActual.url = url;
    await portadaActual.save();
  } else {
    await ImagenLugar.create({
      lugar_id: lugarId,
      url,
      es_portada: true,
      orden: 0,
    });
  }
}

// Obtener lugares cercanos por geolocalización
async function getLugaresCercanos(req, res, next) {
  try {
    const { lat, lng, radio } = req.query;
    
    // Validar parámetros
    if (!lat || !lng) {
      return error(res, 'Latitud y longitud son requeridas', 400);
    }
    
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radioNum = parseInt(radio) || 500;
    
    if (isNaN(latNum) || isNaN(lngNum) || radioNum <= 0) {
      return error(res, 'Parámetros de geolocalización inválidos', 400);
    }
    
    // Obtener todos los lugares activos
    const lugares = await Lugar.findAll({
      where: { activo: true },
      include: [
        {
          model: CategoriaLugar,
          as: 'categoria',
          attributes: ['id', 'nombre', 'icono'],
        },
        {
          model: ImagenLugar,
          as: 'imagenes',
          attributes: ['url', 'es_portada', 'orden'],
        },
      ],
    });
    
    // Filtrar por distancia y calcular
    const lugaresFiltrados = lugares
      .map(lugar => {
        const distancia = calcularDistancia(
          latNum,
          lngNum,
          parseFloat(lugar.latitud),
          parseFloat(lugar.longitud)
        );
        
        return {
          ...lugar.toJSON(),
          distancia_metros: distancia,
        };
      })
      .filter(lugar => lugar.distancia_metros <= radioNum)
      .sort((a, b) => a.distancia_metros - b.distancia_metros);
    
    // Obtener calificaciones
    const lugaresFinal = await Promise.all(
      lugaresFiltrados.map(async (lugar) => {
        const [resultados] = await sequelize.query(
          `SELECT ROUND(AVG(calificacion), 1) as promedio, COUNT(*) as total 
           FROM resenas_lugar WHERE lugar_id = ?`,
          { replacements: [lugar.id] }
        );
        
        return {
          ...lugar,
          calificacion_promedio: parseFloat(resultados[0]?.promedio || 0),
          total_resenas: parseInt(resultados[0]?.total || 0),
        };
      })
    );
    
    return success(res, lugaresFinal);
  } catch (err) {
    next(err);
  }
}

// Obtener detalle de un lugar
async function getLugarById(req, res, next) {
  try {
    const { id } = req.params;
    
    const lugar = await Lugar.findByPk(id, {
      include: [
        {
          model: CategoriaLugar,
          as: 'categoria',
          attributes: ['id', 'nombre', 'icono'],
        },
        {
          model: ImagenLugar,
          as: 'imagenes',
          attributes: ['url', 'es_portada', 'orden'],
        },
        {
          model: ResenaLugar,
          as: 'resenas',
          attributes: ['id', 'calificacion', 'comentario', 'creado_en'],
          include: [
            {
              model: require('../models').Usuario,
              as: 'usuario',
              attributes: ['id', 'nombre', 'foto_url'],
            },
          ],
          limit: 10,
          order: [['creado_en', 'DESC']],
        },
      ],
    });
    
    if (!lugar) {
      return error(res, 'Lugar no encontrado', 404);
    }
    
    // Obtener calificación promedio
    const [resultados] = await sequelize.query(
      `SELECT ROUND(AVG(calificacion), 1) as promedio, COUNT(*) as total 
       FROM resenas_lugar WHERE lugar_id = ?`,
      { replacements: [id] }
    );
    
    const lugarConRating = {
      ...lugar.toJSON(),
      calificacion_promedio: parseFloat(resultados[0]?.promedio || 0),
      total_resenas: parseInt(resultados[0]?.total || 0),
    };
    
    return success(res, lugarConRating);
  } catch (err) {
    next(err);
  }
}

// Listar todos los lugares (solo admin) — sin filtro geográfico
async function getAllLugares(req, res, next) {
  try {
    const lugares = await Lugar.findAll({
      include: [
        {
          model: CategoriaLugar,
          as: 'categoria',
          attributes: ['id', 'nombre', 'icono'],
        },
        {
          model: ImagenLugar,
          as: 'imagenes',
          attributes: ['url', 'es_portada', 'orden'],
        },
      ],
      order: [['creado_en', 'DESC']],
    });

    return success(res, lugares.map((l) => l.toJSON()));
  } catch (err) {
    next(err);
  }
}

// Crear lugar (solo admin)
async function createLugar(req, res, next) {
  try {
    const { nombre, descripcion, historia, latitud, longitud, direccion, provincia, categoria_id, audio_url, imagen_portada } = req.body;

    if (!nombre || !descripcion || !latitud || !longitud || !categoria_id) {
      return error(res, 'Faltan campos requeridos', 400);
    }

    const lugar = await Lugar.create({
      nombre,
      descripcion,
      historia,
      latitud,
      longitud,
      direccion,
      provincia,
      audio_url,
      categoria_id,
    });

    await upsertPortadaLugar(lugar.id, imagen_portada);

    return success(res, lugar, 201);
  } catch (err) {
    next(err);
  }
}

// Actualizar lugar (solo admin)
async function updateLugar(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, historia, latitud, longitud, direccion, provincia, categoria_id, audio_url, imagen_portada } = req.body;

    const lugar = await Lugar.findByPk(id);
    if (!lugar) {
      return error(res, 'Lugar no encontrado', 404);
    }

    await lugar.update({
      nombre: nombre ?? lugar.nombre,
      descripcion: descripcion ?? lugar.descripcion,
      historia: historia ?? lugar.historia,
      latitud: latitud ?? lugar.latitud,
      longitud: longitud ?? lugar.longitud,
      direccion: direccion ?? lugar.direccion,
      provincia: provincia ?? lugar.provincia,
      audio_url: audio_url ?? lugar.audio_url,
      categoria_id: categoria_id ?? lugar.categoria_id,
    });

    await upsertPortadaLugar(lugar.id, imagen_portada);

    return success(res, lugar);
  } catch (err) {
    next(err);
  }
}

// Eliminar lugar (solo admin) — borra también sus imágenes por ON DELETE CASCADE
async function deleteLugar(req, res, next) {
  try {
    const { id } = req.params;

    const lugar = await Lugar.findByPk(id);
    if (!lugar) {
      return error(res, 'Lugar no encontrado', 404);
    }

    await lugar.destroy();

    return success(res, { id, eliminado: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLugaresCercanos,
  getAllLugares,
  getLugarById,
  createLugar,
  updateLugar,
  deleteLugar,
};
