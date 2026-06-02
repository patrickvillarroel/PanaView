const { Negocio, CategoriaNegocio } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { calcularDistancia } = require('../utils/geoHelper');

// Obtener negocios cercanos por geolocalización
async function getNegociosCercanos(req, res, next) {
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
    
    // Obtener todos los negocios activos
    const negocios = await Negocio.findAll({
      where: { activo: true },
      include: [
        {
          model: CategoriaNegocio,
          as: 'categoria',
          attributes: ['id', 'nombre', 'icono'],
        },
      ],
    });
    
    // Filtrar por distancia
    const negociosFiltrados = negocios
      .map(negocio => {
        const distancia = calcularDistancia(
          latNum,
          lngNum,
          parseFloat(negocio.latitud),
          parseFloat(negocio.longitud)
        );
        
        return {
          ...negocio.toJSON(),
          distancia_metros: distancia,
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
      ],
    });
    
    if (!negocio) {
      return error(res, 'Negocio no encontrado', 404);
    }
    
    return success(res, negocio);
  } catch (err) {
    next(err);
  }
}

// Crear negocio (solo negocio o admin)
async function createNegocio(req, res, next) {
  try {
    const { nombre, descripcion, latitud, longitud, direccion, telefono, whatsapp, horario, sitio_web, categoria_id } = req.body;
    
    if (!nombre || !latitud || !longitud || !categoria_id) {
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
      categoria_id,
      propietario_id: req.user.id, // El usuario del token es el propietario
    });
    
    return success(res, negocio, 201);
  } catch (err) {
    next(err);
  }
}

// Actualizar negocio (solo el propietario o admin)
async function updateNegocio(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, latitud, longitud, direccion, telefono, whatsapp, horario, sitio_web, categoria_id } = req.body;
    
    const negocio = await Negocio.findByPk(id);
    if (!negocio) {
      return error(res, 'Negocio no encontrado', 404);
    }
    
    // Validar permisos
    if (negocio.propietario_id !== req.user.id && req.user.rol !== 'admin') {
      return error(res, 'No tienes permisos para actualizar este negocio', 403);
    }
    
    await negocio.update({
      nombre: nombre || negocio.nombre,
      descripcion: descripcion || negocio.descripcion,
      latitud: latitud || negocio.latitud,
      longitud: longitud || negocio.longitud,
      direccion: direccion || negocio.direccion,
      telefono: telefono || negocio.telefono,
      whatsapp: whatsapp || negocio.whatsapp,
      horario: horario || negocio.horario,
      sitio_web: sitio_web || negocio.sitio_web,
      categoria_id: categoria_id || negocio.categoria_id,
    });
    
    return success(res, negocio);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNegociosCercanos,
  getNegocioById,
  createNegocio,
  updateNegocio,
};
