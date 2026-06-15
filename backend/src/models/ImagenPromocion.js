module.exports = (sequelize, DataTypes) => {
  const ImagenPromocion = sequelize.define('ImagenPromocion', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    promocion_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    es_portada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    orden: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'imagenes_promocion',
    timestamps: false,
    indexes: [
      { fields: ['promocion_id'] },
    ],
  });

  return ImagenPromocion;
};
