module.exports = (sequelize, DataTypes) => {
  const FavoritoNegocio = sequelize.define('FavoritoNegocio', {
    usuario_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
    },
    negocio_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
    },
    guardado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'favoritos_negocio',
    timestamps: false,
    indexes: [
      { fields: ['usuario_id'] },
      { fields: ['negocio_id'] },
    ],
  });

  return FavoritoNegocio;
};
