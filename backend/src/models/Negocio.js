module.exports = (sequelize, DataTypes) => {
  const Negocio = sequelize.define('Negocio', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    propietario_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
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
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    whatsapp: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    horario: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    sitio_web: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    verificado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'negocios',
    timestamps: false,
    indexes: [
      { fields: ['propietario_id'] },
      { fields: ['categoria_id'] },
      { fields: ['latitud', 'longitud'] },
      { fields: ['activo'] },
    ],
  });

  return Negocio;
};
