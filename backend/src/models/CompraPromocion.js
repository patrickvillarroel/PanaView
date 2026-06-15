module.exports = (sequelize, DataTypes) => {
  const CompraPromocion = sequelize.define('CompraPromocion', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    promocion_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    ciclo_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    qr_codigo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    metodo: {
      type: DataTypes.ENUM('app', 'qr_scan'),
      defaultValue: 'qr_scan',
    },
    monto_comision: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    canjeado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'compras_promociones',
    timestamps: false,
    indexes: [
      { fields: ['promocion_id'] },
      { fields: ['usuario_id'] },
      { fields: ['ciclo_id'] },
      { fields: ['canjeado_en'] },
    ],
  });

  return CompraPromocion;
};
