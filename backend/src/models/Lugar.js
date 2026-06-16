module.exports = (sequelize, DataTypes) => {
  const Lugar = sequelize.define('Lugar', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    categoria_id: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    historia: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    historia_en: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitud: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitud: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: {
        min: -180,
        max: 180,
      },
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    provincia: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    audio_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
      onUpdate: DataTypes.NOW,
    },
  }, {
    tableName: 'lugares',
    timestamps: false,
    indexes: [
      { fields: ['categoria_id'] },
      { fields: ['latitud', 'longitud'] },
      { fields: ['activo'] },
    ],
  });

  return Lugar;
};
