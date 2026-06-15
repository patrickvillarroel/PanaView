const { CicloFacturacion, Negocio, Promocion, CompraPromocion, Usuario } = require('../models');
const { Op } = require('sequelize');
const { success, error } = require('../utils/responseHelper');

// ─── Helper interno ───────────────────────────────────────────────────────────

async function aplicarVencimientos(negocioId = null) {
  const hoy = new Date();
  const whereBase = negocioId ? { negocio_id: negocioId } : {};

  await CicloFacturacion.update(
    { estado: 'pendiente_pago' },
    { where: { ...whereBase, estado: 'activo', fecha_fin: { [Op.lt]: hoy } } }
  );

  const vencidos = await CicloFacturacion.findAll({
    where: { ...whereBase, estado: 'pendiente_pago', fecha_vencimiento: { [Op.lt]: hoy } },
  });

  for (const ciclo of vencidos) {
    await ciclo.update({ estado: 'vencido' });
    await Promocion.update(
      { activo: false },
      { where: { negocio_id: ciclo.negocio_id, activo: true } }
    );
  }

  return vencidos.length;
}

// ─── GET /api/facturacion/negocio/:negocioId ──────────────────────────────────
// Resumen completo para el dashboard del negocio

exports.resumenNegocio = async (req, res, next) => {
  try {
    const { negocioId } = req.params;
    await aplicarVencimientos(negocioId);

    const ciclos = await CicloFacturacion.findAll({
      where: { negocio_id: negocioId },
      order: [['creado_en', 'DESC']],
      limit: 12,
    });

    const cicloActual = ciclos.find((c) => c.estado === 'activo') ?? null;
    const pendientes = ciclos.filter((c) => c.estado === 'pendiente_pago' || c.estado === 'vencido');

    const totalGenerado = ciclos
      .filter((c) => c.estado === 'pagado')
      .reduce((s, c) => s + parseFloat(c.total_comisiones), 0);

    const totalAdeudado = pendientes.reduce((s, c) => s + parseFloat(c.total_comisiones), 0);

    // Contar canjeos sin ciclo (registros anteriores al sistema de facturación)
    const promosDelNegocio = await Promocion.findAll({
      where: { negocio_id: negocioId },
      attributes: ['id'],
    });
    const promoIds = promosDelNegocio.map((p) => p.id);
    const canjeosSinCiclo = promoIds.length > 0
      ? await CompraPromocion.count({ where: { promocion_id: { [Op.in]: promoIds }, ciclo_id: null } })
      : 0;

    return success(res, {
      cicloActual,
      historial: ciclos,
      estadisticas: {
        totalGenerado: +totalGenerado.toFixed(2),
        totalAdeudado: +totalAdeudado.toFixed(2),
        ciclosPendientes: pendientes.length,
        canjeosSinCiclo,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/facturacion/negocio/:negocioId/canjeos ─────────────────────────
// Historial de canjeos (filtrable por ciclo)

exports.historialCanjeos = async (req, res, next) => {
  try {
    const { negocioId } = req.params;
    const { cicloId, page = 1, limit = 30 } = req.query;

    // Obtener IDs de promociones del negocio para filtrar
    const promosDelNegocio = await Promocion.findAll({
      where: { negocio_id: negocioId },
      attributes: ['id'],
    });
    const promoIds = promosDelNegocio.map((p) => p.id);

    if (promoIds.length === 0) return success(res, []);

    const where = { promocion_id: { [Op.in]: promoIds } };
    if (cicloId) where.ciclo_id = cicloId;

    const canjeos = await CompraPromocion.findAll({
      where,
      include: [
        { model: Promocion, as: 'promocion', attributes: ['id', 'nombre', 'precio'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'], required: false },
      ],
      order: [['canjeado_en', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return success(res, canjeos);
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/facturacion/:cicloId/pagar ─────────────────────────────────────
// Admin: marcar ciclo como pagado (reactivar promos si aplica)

exports.marcarPagado = async (req, res, next) => {
  try {
    const { cicloId } = req.params;
    const ciclo = await CicloFacturacion.findByPk(cicloId);
    if (!ciclo) return error(res, 'Ciclo no encontrado', 404);
    if (ciclo.estado === 'pagado') return error(res, 'Este ciclo ya fue pagado', 400);

    await ciclo.update({ estado: 'pagado', pagado_en: new Date() });

    // Reactivar promociones si no hay otros ciclos sin pagar
    const otrasPendientes = await CicloFacturacion.count({
      where: {
        negocio_id: ciclo.negocio_id,
        estado: { [Op.in]: ['pendiente_pago', 'vencido'] },
        id: { [Op.ne]: cicloId },
      },
    });

    if (otrasPendientes === 0) {
      await Promocion.update(
        { activo: true },
        { where: { negocio_id: ciclo.negocio_id } }
      );
    }

    return success(res, { message: 'Ciclo marcado como pagado', ciclo });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/facturacion/check-vencimientos ─────────────────────────────────
// Admin / cron: revisar y aplicar vencimientos globalmente

exports.checkVencimientos = async (req, res, next) => {
  try {
    const hoy = new Date();

    const [activosActualizados] = await CicloFacturacion.update(
      { estado: 'pendiente_pago' },
      { where: { estado: 'activo', fecha_fin: { [Op.lt]: hoy } } }
    );

    const pendientesVencidos = await CicloFacturacion.findAll({
      where: { estado: 'pendiente_pago', fecha_vencimiento: { [Op.lt]: hoy } },
    });

    for (const ciclo of pendientesVencidos) {
      await ciclo.update({ estado: 'vencido' });
      await Promocion.update(
        { activo: false },
        { where: { negocio_id: ciclo.negocio_id, activo: true } }
      );
    }

    return success(res, {
      activosTransicionados: activosActualizados,
      vencidosDesactivados: pendientesVencidos.length,
      ejecutadoEn: hoy,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/facturacion/crm ─────────────────────────────────────────────────
// Admin CRM: resumen global de todos los negocios

exports.crmResumen = async (req, res, next) => {
  try {
    await aplicarVencimientos();

    const ciclosPendientes = await CicloFacturacion.findAll({
      where: { estado: { [Op.in]: ['pendiente_pago', 'vencido'] } },
      include: [
        {
          model: Negocio,
          as: 'negocio',
          attributes: ['id', 'nombre', 'comision_porcentaje', 'tipo_ciclo'],
          include: [{ model: Usuario, as: 'propietario', attributes: ['id', 'nombre', 'email'] }],
        },
      ],
      order: [
        ['estado', 'DESC'],
        ['fecha_vencimiento', 'ASC'],
      ],
    });

    const totalPendiente = ciclosPendientes
      .filter((c) => c.estado === 'pendiente_pago')
      .reduce((s, c) => s + parseFloat(c.total_comisiones), 0);

    const totalVencido = ciclosPendientes
      .filter((c) => c.estado === 'vencido')
      .reduce((s, c) => s + parseFloat(c.total_comisiones), 0);

    // Resumen de los últimos 6 meses (ingresos cobrados)
    const sequelize = CicloFacturacion.sequelize;
    const [resumenMensual] = await sequelize.query(`
      SELECT
        DATE_FORMAT(fecha_inicio, '%Y-%m') AS mes,
        SUM(total_comisiones)              AS comisiones,
        SUM(total_canjeos)                 AS canjeos,
        COUNT(*)                           AS ciclos,
        SUM(CASE WHEN estado = 'pagado' THEN total_comisiones ELSE 0 END) AS cobrado
      FROM ciclos_facturacion
      WHERE fecha_inicio >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes DESC
    `);

    return success(res, {
      ciclosPendientes,
      estadisticas: {
        totalPendiente: +totalPendiente.toFixed(2),
        totalVencido: +totalVencido.toFixed(2),
        totalDeudas: ciclosPendientes.length,
      },
      resumenMensual,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/facturacion/negocio/:negocioId/config ───────────────────────────
// Admin: configurar comisión y tipo de ciclo del negocio

exports.configurarNegocio = async (req, res, next) => {
  try {
    const { negocioId } = req.params;
    const { comision_porcentaje, tipo_ciclo } = req.body;

    const negocio = await Negocio.findByPk(negocioId);
    if (!negocio) return error(res, 'Negocio no encontrado', 404);

    const updates = {};
    if (comision_porcentaje !== undefined) updates.comision_porcentaje = comision_porcentaje;
    if (tipo_ciclo !== undefined) updates.tipo_ciclo = tipo_ciclo;

    await negocio.update(updates);
    return success(res, negocio);
  } catch (err) {
    next(err);
  }
};
