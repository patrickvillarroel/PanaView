const { Promocion, Negocio, Usuario } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../utils/responseHelper');

// Listar promociones de un negocio
exports.listarPromociones = async (req, res, next) => {
  try {
    const { negocioId } = req.params;
    const promociones = await Promocion.findAll({ where: { negocio_id: negocioId, activo: true } });
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
    const nueva = await Promocion.create({ negocio_id: negocioId, nombre, descripcion, precio, fecha_validez, qr_codigo });
    return success(res, nueva, 201);
  } catch (err) {
    next(err);
  }
};

// Detalle promocion
exports.obtenerPromocion = async (req, res, next) => {
  try {
    const { promoId } = req.params;
    const promocion = await Promocion.findByPk(promoId);
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

// Redeem by QR code
exports.redeemByQR = async (req, res, next) => {
  try {
    const { qr_codigo } = req.body;
    const usuarioId = req.user?.id || null;
    const promo = await Promocion.findOne({ where: { qr_codigo, activo: true } });
    if (!promo) return error(res, 'Código QR no válido', 404);
    await req.app.get('sequelize').query(
      'INSERT INTO compras_promociones (promocion_id, usuario_id, qr_codigo, metodo) VALUES (?, ?, ?, ?)',
      { replacements: [promo.id, usuarioId, qr_codigo, 'app'] }
    );
    return success(res, { message: 'Promoción registrada mediante QR' });
  } catch (err) {
    next(err);
  }
};
