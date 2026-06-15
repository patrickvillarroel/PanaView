const { Promocion, Negocio, Usuario, ImagenPromocion, CompraPromocion, CicloFacturacion } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../utils/responseHelper');

// ─── Helper: obtener o crear ciclo activo ────────────────────────────────────

async function getOrCreateCicloActivo(negocioId, tipoCiclo) {
  const hoy = new Date();

  // Activo cuyo período terminó → pendiente_pago
  await CicloFacturacion.update(
    { estado: 'pendiente_pago' },
    { where: { negocio_id: negocioId, estado: 'activo', fecha_fin: { [Op.lt]: hoy } } }
  );

  // Pendiente cuyo grace period terminó → vencido + desactivar promos
  const vencidos = await CicloFacturacion.findAll({
    where: { negocio_id: negocioId, estado: 'pendiente_pago', fecha_vencimiento: { [Op.lt]: hoy } },
  });
  for (const c of vencidos) {
    await c.update({ estado: 'vencido' });
    await Promocion.update({ activo: false }, { where: { negocio_id: negocioId, activo: true } });
  }

  let ciclo = await CicloFacturacion.findOne({
    where: { negocio_id: negocioId, estado: 'activo' },
  });

  if (!ciclo) {
    const dias = tipoCiclo === 'quincenal' ? 15 : 30;
    const fechaFin = new Date(hoy);
    fechaFin.setDate(hoy.getDate() + dias);
    const fechaVencimiento = new Date(fechaFin);
    fechaVencimiento.setDate(fechaFin.getDate() + 7); // 7 días de gracia para pagar

    ciclo = await CicloFacturacion.create({
      id: uuidv4(),
      negocio_id: negocioId,
      fecha_inicio: hoy,
      fecha_fin: fechaFin,
      tipo: tipoCiclo || 'mensual',
      fecha_vencimiento: fechaVencimiento,
    });
  }

  return ciclo;
}

exports.getOrCreateCicloActivo = getOrCreateCicloActivo;

// ─── Listar promociones de un negocio ────────────────────────────────────────

exports.listarPromociones = async (req, res, next) => {
  try {
    const { negocioId } = req.params;
    const promociones = await Promocion.findAll({
      where: { negocio_id: negocioId, activo: true },
      include: [
        { model: ImagenPromocion, as: 'imagenes', attributes: ['url', 'es_portada', 'orden'] },
      ],
    });
    return success(res, promociones);
  } catch (err) {
    next(err);
  }
};

// ─── Crear promoción ──────────────────────────────────────────────────────────

exports.crearPromocion = async (req, res, next) => {
  try {
    const { negocioId } = req.params;
    const { nombre, descripcion, precio, fecha_validez } = req.body;
    const nueva = await Promocion.create({
      negocio_id: negocioId,
      nombre,
      descripcion,
      precio,
      fecha_validez: fecha_validez || null,
      qr_codigo: uuidv4(),
    });
    return success(res, nueva, 201);
  } catch (err) {
    next(err);
  }
};

// ─── Detalle de una promoción ─────────────────────────────────────────────────

exports.obtenerPromocion = async (req, res, next) => {
  try {
    const { promoId } = req.params;
    const promocion = await Promocion.findByPk(promoId, {
      include: [
        { model: ImagenPromocion, as: 'imagenes', attributes: ['url', 'es_portada', 'orden'] },
      ],
    });
    if (!promocion) return error(res, 'Promoción no encontrada', 404);
    return success(res, promocion);
  } catch (err) {
    next(err);
  }
};

// ─── Redimir por ID de promoción ──────────────────────────────────────────────

exports.redeemById = async (req, res, next) => {
  try {
    const { promoId } = req.params;
    const usuarioId = req.user?.id || null;

    const promo = await Promocion.findByPk(promoId, {
      include: [{ model: Negocio, as: 'negocio', attributes: ['id', 'comision_porcentaje', 'tipo_ciclo'] }],
    });
    if (!promo || !promo.activo) return error(res, 'Promoción no disponible', 404);

    const negocio = promo.negocio;
    const comisionPct = parseFloat(negocio?.comision_porcentaje) || 10;
    const montoComision = parseFloat(promo.precio) * (comisionPct / 100);
    const ciclo = await getOrCreateCicloActivo(negocio.id, negocio.tipo_ciclo || 'mensual');

    await CompraPromocion.create({
      id: uuidv4(),
      promocion_id: promo.id,
      usuario_id: usuarioId,
      ciclo_id: ciclo.id,
      qr_codigo: promo.qr_codigo,
      metodo: 'app',
      monto_comision: montoComision,
    });

    await ciclo.increment({ total_canjeos: 1, total_comisiones: montoComision });

    return success(res, { message: 'Promoción registrada', comision: montoComision });
  } catch (err) {
    next(err);
  }
};

// ─── Redimir por QR — formato: PANAVIEW:{promo_id}:{usuario_id} ──────────────

exports.redeemByQR = async (req, res, next) => {
  try {
    const { qr_value } = req.body;
    if (!qr_value) return error(res, 'Código QR requerido', 400);

    const partes = String(qr_value).split(':');
    if (partes.length !== 3 || partes[0] !== 'PANAVIEW') {
      return error(res, 'Código QR no válido', 400);
    }
    const [, promoId, usuarioId] = partes;

    const promo = await Promocion.findByPk(promoId, {
      include: [{ model: Negocio, as: 'negocio', attributes: ['id', 'comision_porcentaje', 'tipo_ciclo'] }],
    });
    if (!promo || !promo.activo) return error(res, 'Promoción no disponible o expirada', 404);

    const existente = await CompraPromocion.findOne({
      where: { promocion_id: promoId, usuario_id: usuarioId },
    });
    if (existente) return error(res, 'Esta promoción ya fue canjeada por este cliente', 409);

    const negocio = promo.negocio;
    const comisionPct = parseFloat(negocio?.comision_porcentaje) || 10;
    const montoComision = parseFloat(promo.precio) * (comisionPct / 100);
    const ciclo = await getOrCreateCicloActivo(negocio.id, negocio.tipo_ciclo || 'mensual');

    await CompraPromocion.create({
      id: uuidv4(),
      promocion_id: promoId,
      usuario_id: usuarioId,
      ciclo_id: ciclo.id,
      qr_codigo: promo.qr_codigo,
      metodo: 'qr_scan',
      monto_comision: montoComision,
    });

    await ciclo.increment({ total_canjeos: 1, total_comisiones: montoComision });

    return success(res, {
      message: 'Promoción canjeada exitosamente',
      promo: { id: promo.id, nombre: promo.nombre },
      comision: montoComision,
    });
  } catch (err) {
    next(err);
  }
};
