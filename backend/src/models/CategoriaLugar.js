module.exports = (sequelize, DataTypes) => {
  const CategoriaLugar = sequelize.define('CategoriaLugar', {
    id: {
      type: DataTypes.TINYINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    icono: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'categorias_lugar',
    timestamps: false,
  });

  return CategoriaLugar;
};
