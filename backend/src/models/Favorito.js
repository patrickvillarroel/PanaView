module.exports = (sequelize, DataTypes) => {
  const Favorito = sequelize.define('Favorito', {
    usuario_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
    },
    lugar_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
    },
    guardado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'favoritos',
    timestamps: false,
    indexes: [
      { fields: ['usuario_id'] },
      { fields: ['lugar_id'] },
    ],
  });

  return Favorito;
};
