const { Promocion, Negocio, Usuario, ImagenPromocion } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../utils/responseHelper');

// Listar promociones de un negocio
exports.listarPromociones = async (req, res, next) => {
  try {
    const { negocioId } = req.params;
    const promociones = await Promocion.findAll({
      where: { negocio_id: negocioId, activo: true },
      include: [
        {
          model: ImagenPromocion,
          as: 'imagenes',
          attributes: ['url', 'es_portada', 'orden'],
        },
      ],
    });
    return success(res, promociones);
  } catch (err) {
    next(err);
  }
};

// Crear promocion (propietario/negocio)
exports.crearPromocion = async (req, res, next) => {
  try {
    const { negocioId } = req.params;
    const { nombre, descripcion, precio, fecha_validez } = req.body;
    const qr_codigo = uuidv4();
    const nueva = await Promocion.create({
      negocio_id: negocioId,
      nombre,
      descripcion,
      precio,
      fecha_validez: fecha_validez || null,
      qr_codigo,
    });
    return success(res, nueva, 201);
  } catch (err) {
    next(err);
  }
};

// Detalle promocion
exports.obtenerPromocion = async (req, res, next) => {
  try {
    const { promoId } = req.params;
    const promocion = await Promocion.findByPk(promoId, {
      include: [
        {
          model: ImagenPromocion,
          as: 'imagenes',
          attributes: ['url', 'es_portada', 'orden'],
        },
      ],
    });
    if (!promocion) return error(res, 'Promoción no encontrada', 404);
    return success(res, promocion);
  } catch (err) {
    next(err);
  }
};

// Redeem by promo id (requires auth)
exports.redeemById = async (req, res, next) => {
  try {
    const { promoId } = req.params;
    const usuarioId = req.user?.id || null;
    const promo = await Promocion.findByPk(promoId);
    if (!promo || !promo.activo) return error(res, 'Promoción no disponible', 404);
    await req.app.get('sequelize').query(
      'INSERT INTO compras_promociones (promocion_id, usuario_id, qr_codigo, metodo) VALUES (?, ?, ?, ?)',
      { replacements: [promo.id, usuarioId, promo.qr_codigo, 'app'] }
    );
    return success(res, { message: 'Promoción registrada' });
  } catch (err) {
    next(err);
  }
};

// Redeem by QR code — formato: PANAVIEW:{promo_id}:{usuario_id}
exports.redeemByQR = async (req, res, next) => {
  try {
    const { qr_value } = req.body;
    if (!qr_value) return error(res, 'Código QR requerido', 400);

    const partes = String(qr_value).split(':');
    if (partes.length !== 3 || partes[0] !== 'PANAVIEW') {
      return error(res, 'Código QR no válido', 400);
    }
    const [, promoId, usuarioId] = partes;

    const promo = await Promocion.findByPk(promoId);
    if (!promo || !promo.activo) return error(res, 'Promoción no disponible o expirada', 404);

    const sequelize = req.app.get('sequelize');

    // Verificar si ya fue canjeado por este usuario
    const [existente] = await sequelize.query(
      'SELECT id FROM compras_promociones WHERE promocion_id = ? AND usuario_id = ?',
      { replacements: [promoId, usuarioId] }
    );
    if (existente.length > 0) {
      return error(res, 'Esta promoción ya fue canjeada por este cliente', 409);
    }

    await sequelize.query(
      'INSERT INTO compras_promociones (promocion_id, usuario_id, qr_codigo, metodo) VALUES (?, ?, ?, ?)',
      { replacements: [promoId, usuarioId, promo.qr_codigo, 'qr_scan'] }
    );

    return success(res, {
      message: 'Promoción canjeada exitosamente',
      promo: { id: promo.id, nombre: promo.nombre },
    });
  } catch (err) {
    next(err);
  }
};
