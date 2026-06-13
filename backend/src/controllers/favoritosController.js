const { Favorito, Lugar } = require('../models');
const { success, error } = require('../utils/responseHelper');

async function toggleFavorito(req, res, next) {
  try {
    const { lugarId } = req.params;
    const usuarioId = req.user.id;

    const lugar = await Lugar.findByPk(lugarId, {
      attributes: ['id'],
    });

    if (!lugar) {
      return error(res, 'Lugar no encontrado', 404);
    }

    const favorito = await Favorito.findOne({
      where: {
        usuario_id: usuarioId,
        lugar_id: lugarId,
      },
    });

    if (favorito) {
      await favorito.destroy();
      return success(res, { lugar_id: lugarId, es_favorito: false });
    }

    await Favorito.create({
      usuario_id: usuarioId,
      lugar_id: lugarId,
    });

    return success(res, { lugar_id: lugarId, es_favorito: true }, 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  toggleFavorito,
};