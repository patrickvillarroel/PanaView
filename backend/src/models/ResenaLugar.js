module.exports = (sequelize, DataTypes) => {
  const ResenaLugar = sequelize.define('ResenaLugar', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    lugar_id: {
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
    tableName: 'resenas_lugar',
    timestamps: false,
    indexes: [
      { fields: ['lugar_id'] },
      { fields: ['usuario_id'] },
      { fields: ['calificacion'] },
      { fields: ['lugar_id', 'usuario_id'], unique: true },
    ],
  });

  return ResenaLugar;
};
