module.exports = (sequelize, DataTypes) => {
  const CicloFacturacion = sequelize.define('CicloFacturacion', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    negocio_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('quincenal', 'mensual'),
      defaultValue: 'mensual',
    },
    total_canjeos: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    total_comisiones: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    // activo     → dentro del período, acumulando
    // pendiente_pago → período terminado, esperando pago (grace period)
    // pagado     → pagado antes del vencimiento
    // vencido    → no pagado a tiempo → promos desactivadas
    estado: {
      type: DataTypes.ENUM('activo', 'pendiente_pago', 'pagado', 'vencido'),
      defaultValue: 'activo',
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    pagado_en: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'ciclos_facturacion',
    timestamps: false,
    indexes: [
      { fields: ['negocio_id'] },
      { fields: ['estado'] },
      { fields: ['fecha_vencimiento'] },
    ],
  });

  return CicloFacturacion;
};
