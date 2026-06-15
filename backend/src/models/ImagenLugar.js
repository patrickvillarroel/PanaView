module.exports = (sequelize, DataTypes) => {
  const ImagenLugar = sequelize.define('ImagenLugar', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    lugar_id: {
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
    tableName: 'imagenes_lugar',
    timestamps: false,
    indexes: [
      { fields: ['lugar_id'] },
    ],
  });

  return ImagenLugar;
};
