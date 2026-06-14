module.exports = (sequelize, DataTypes) => {
  const Promocion = sequelize.define('Promocion', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    negocio_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.0,
    },
    fecha_validez: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    qr_codigo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    actualizado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'promociones',
    timestamps: false,
    indexes: [
      { fields: ['negocio_id'] },
      { fields: ['qr_codigo'] },
      { fields: ['activo'] },
    ],
  });

  return Promocion;
};
