const { FavoritoNegocio, Negocio, CategoriaNegocio, Usuario } = require('../models');
const { success, error } = require('../utils/responseHelper');

// Verificar si un negocio es favorito del usuario
async function checkFavorito(req, res, next) {
  try {
    const { negocioId } = req.params;
    console.log('[checkFavorito] negocioId:', negocioId);

    const usuario = await Usuario.findOne();
    console.log('[checkFavorito] usuario:', usuario ? usuario.id : 'NINGUNO');

    if (!usuario) {
      return error(res, 'No hay usuarios en el sistema', 400);
    }

    const favorito = await FavoritoNegocio.findOne({
      where: { usuario_id: usuario.id, negocio_id: negocioId },
    });
    console.log('[checkFavorito] favorito:', favorito);

    return success(res, { es_favorito: !!favorito });
  } catch (err) {
    console.error('[checkFavorito] ERROR:', err.message, err.stack);
    next(err);
  }
}

// Toggle favorito (agregar/quitar)
async function toggleFavorito(req, res, next) {
  try {
    const { negocioId } = req.params;
    console.log('[toggleFavorito] negocioId:', negocioId);

    const usuario = await Usuario.findOne();
    console.log('[toggleFavorito] usuario:', usuario ? usuario.id : 'NINGUNO');

    if (!usuario) {
      return error(res, 'No hay usuarios en el sistema', 400);
    }
    const usuario_id = usuario.id;

    const existente = await FavoritoNegocio.findOne({
      where: { usuario_id, negocio_id: negocioId },
    });
    console.log('[toggleFavorito] existente:', existente);

    if (existente) {
      await existente.destroy();
      return success(res, { es_favorito: false, mensaje: 'Eliminado de favoritos' });
    }

    const nuevo = await FavoritoNegocio.create({
      usuario_id,
      negocio_id: negocioId,
    });
    console.log('[toggleFavorito] creado:', nuevo);

    return success(res, { es_favorito: true, mensaje: 'Agregado a favoritos' }, 201);
  } catch (err) {
    console.error('[toggleFavorito] ERROR:', err.message, err.stack);
    next(err);
  }
}

// Obtener todos los favoritos del usuario
async function getFavoritos(req, res, next) {
  try {
    const usuario = await Usuario.findOne();
    if (!usuario) {
      return error(res, 'No hay usuarios en el sistema', 400);
    }

    const user = await Usuario.findByPk(usuario.id, {
      include: [
        {
          model: Negocio,
          as: 'negociosFavoritos',
          include: [
            {
              model: CategoriaNegocio,
              as: 'categoria',
              attributes: ['id', 'nombre', 'icono'],
            },
          ],
        },
      ],
    });

    return success(res, user ? user.negociosFavoritos : []);
  } catch (err) {
    console.error('[getFavoritos] ERROR:', err.message, err.stack);
    next(err);
  }
}

module.exports = {
  checkFavorito,
  toggleFavorito,
  getFavoritos,
};
