module.exports = (sequelize, DataTypes) => {
  const ImagenUsuario = sequelize.define('ImagenUsuario', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: {
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
    tableName: 'imagenes_usuario',
    timestamps: false,
    indexes: [
      { fields: ['usuario_id'] },
    ],
  });

  return ImagenUsuario;
};
