module.exports = (sequelize, DataTypes) => {
  const ResenaNegocio = sequelize.define('ResenaNegocio', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    negocio_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    calificacion: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    actualizado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  }, {
    tableName: 'resenas_negocio',
    timestamps: false,
    indexes: [
      { fields: ['negocio_id'] },
      { fields: ['usuario_id'] },
      { fields: ['calificacion'] },
      { fields: ['negocio_id', 'usuario_id'], unique: true },
    ],
  });

  return ResenaNegocio;
};
