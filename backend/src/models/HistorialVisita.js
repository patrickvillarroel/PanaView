module.exports = (sequelize, DataTypes) => {
  const HistorialVisita = sequelize.define('HistorialVisita', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    lugar_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    visitado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'historial_visitas',
    timestamps: false,
    indexes: [
      { fields: ['usuario_id'] },
      { fields: ['lugar_id'] },
      { fields: ['visitado_en'] },
    ],
  });

  return HistorialVisita;
};
