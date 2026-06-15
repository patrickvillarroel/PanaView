const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

// Importar modelos
const Role = require('./Role');
const Usuario = require('./Usuario');
const CategoriaLugar = require('./CategoriaLugar');
const Lugar = require('./Lugar');
const ImagenLugar = require('./ImagenLugar');
const CategoriaNegocio = require('./CategoriaNegocio');
const Negocio = require('./Negocio');
const ImagenNegocio = require('./ImagenNegocio');
const ResenaLugar = require('./ResenaLugar');
const Favorito = require('./Favorito');
const FavoritoNegocio = require('./FavoritoNegocio');
const HistorialVisita = require('./HistorialVisita');
const ResenaNegocio = require('./ResenaNegocio');
const ImagenPromocion = require('./ImagenPromocion');
const Promocion = require('./Promocion');
const CompraPromocion = require('./CompraPromocion');
const CicloFacturacion = require('./CicloFacturacion');

// Inicializar modelos
const role = Role(sequelize, DataTypes);
const usuario = Usuario(sequelize, DataTypes);
const categoriaLugar = CategoriaLugar(sequelize, DataTypes);
const lugar = Lugar(sequelize, DataTypes);
const imagenLugar = ImagenLugar(sequelize, DataTypes);
const categoriaNegocio = CategoriaNegocio(sequelize, DataTypes);
const negocio = Negocio(sequelize, DataTypes);
const imagenNegocio = ImagenNegocio(sequelize, DataTypes);
const resenaLugar = ResenaLugar(sequelize, DataTypes);
const favorito = Favorito(sequelize, DataTypes);
const favoritoNegocio = FavoritoNegocio(sequelize, DataTypes);
const historialVisita = HistorialVisita(sequelize, DataTypes);
const resenaNegocio = ResenaNegocio(sequelize, DataTypes);
const imagenPromocion = ImagenPromocion(sequelize, DataTypes);
const promocion = Promocion(sequelize, DataTypes);
const compraPromocion = CompraPromocion(sequelize, DataTypes);
const cicloFacturacion = CicloFacturacion(sequelize, DataTypes);

// Definir asociaciones
// Role -> Usuario
role.hasMany(usuario, { foreignKey: 'rol_id', as: 'usuarios' });
usuario.belongsTo(role, { foreignKey: 'rol_id', as: 'rol' });

// CategoriaLugar -> Lugar
categoriaLugar.hasMany(lugar, { foreignKey: 'categoria_id', as: 'lugares' });
lugar.belongsTo(categoriaLugar, { foreignKey: 'categoria_id', as: 'categoria' });

// Lugar -> ImagenLugar
lugar.hasMany(imagenLugar, { foreignKey: 'lugar_id', as: 'imagenes' });
imagenLugar.belongsTo(lugar, { foreignKey: 'lugar_id' });

// Usuario -> Negocio (propietario)
usuario.hasMany(negocio, { foreignKey: 'propietario_id', as: 'negocios' });
negocio.belongsTo(usuario, { foreignKey: 'propietario_id', as: 'propietario' });

// CategoriaNegocio -> Negocio
categoriaNegocio.hasMany(negocio, { foreignKey: 'categoria_id', as: 'negocios' });
negocio.belongsTo(categoriaNegocio, { foreignKey: 'categoria_id', as: 'categoria' });

// Negocio -> ImagenNegocio
negocio.hasMany(imagenNegocio, { foreignKey: 'negocio_id', as: 'imagenes' });
imagenNegocio.belongsTo(negocio, { foreignKey: 'negocio_id' });

// Negocio -> ResenaNegocio
negocio.hasMany(resenaNegocio, { foreignKey: 'negocio_id', as: 'resenas' });
resenaNegocio.belongsTo(negocio, { foreignKey: 'negocio_id' });

// Usuario -> ResenaNegocio
usuario.hasMany(resenaNegocio, { foreignKey: 'usuario_id', as: 'resenasNegocio' });
resenaNegocio.belongsTo(usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Lugar -> ResenaLugar
lugar.hasMany(resenaLugar, { foreignKey: 'lugar_id', as: 'resenas' });
resenaLugar.belongsTo(lugar, { foreignKey: 'lugar_id' });

// Usuario -> ResenaLugar
usuario.hasMany(resenaLugar, { foreignKey: 'usuario_id', as: 'resenas' });
resenaLugar.belongsTo(usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Favoritos (M2M)
usuario.belongsToMany(lugar, { through: favorito, foreignKey: 'usuario_id', otherKey: 'lugar_id', as: 'favoritos' });
lugar.belongsToMany(usuario, { through: favorito, foreignKey: 'lugar_id', otherKey: 'usuario_id', as: 'favoritos_usuarios' });

// Favoritos Negocio (M2M)
usuario.belongsToMany(negocio, { through: favoritoNegocio, foreignKey: 'usuario_id', otherKey: 'negocio_id', as: 'negociosFavoritos' });
negocio.belongsToMany(usuario, { through: favoritoNegocio, foreignKey: 'negocio_id', otherKey: 'usuario_id', as: 'usuariosFavoritos' });

// Historial de visitas (M2M)
usuario.belongsToMany(lugar, { through: historialVisita, foreignKey: 'usuario_id', otherKey: 'lugar_id', as: 'visitados' });
lugar.belongsToMany(usuario, { through: historialVisita, foreignKey: 'lugar_id', otherKey: 'usuario_id', as: 'visitantes' });

// Negocio -> Promocion
negocio.hasMany(promocion, { foreignKey: 'negocio_id', as: 'promociones' });
promocion.belongsTo(negocio, { foreignKey: 'negocio_id', as: 'negocio' });

// Promocion -> ImagenPromocion
promocion.hasMany(imagenPromocion, { foreignKey: 'promocion_id', as: 'imagenes' });
imagenPromocion.belongsTo(promocion, { foreignKey: 'promocion_id' });

// Promocion -> CompraPromocion
promocion.hasMany(compraPromocion, { foreignKey: 'promocion_id', as: 'compras' });
compraPromocion.belongsTo(promocion, { foreignKey: 'promocion_id', as: 'promocion' });

// Usuario -> CompraPromocion
usuario.hasMany(compraPromocion, { foreignKey: 'usuario_id', as: 'compras' });
compraPromocion.belongsTo(usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Negocio -> CicloFacturacion
negocio.hasMany(cicloFacturacion, { foreignKey: 'negocio_id', as: 'ciclos' });
cicloFacturacion.belongsTo(negocio, { foreignKey: 'negocio_id', as: 'negocio' });

// CicloFacturacion -> CompraPromocion
cicloFacturacion.hasMany(compraPromocion, { foreignKey: 'ciclo_id', as: 'compras' });
compraPromocion.belongsTo(cicloFacturacion, { foreignKey: 'ciclo_id', as: 'ciclo' });

module.exports = {
  sequelize,
  Role: role,
  Usuario: usuario,
  CategoriaLugar: categoriaLugar,
  Lugar: lugar,
  ImagenLugar: imagenLugar,
  CategoriaNegocio: categoriaNegocio,
  Negocio: negocio,
  ImagenNegocio: imagenNegocio,
  ResenaLugar: resenaLugar,
  ResenaNegocio: resenaNegocio,
  Favorito: favorito,
  FavoritoNegocio: favoritoNegocio,
  HistorialVisita: historialVisita,
  ImagenPromocion: imagenPromocion,
  Promocion: promocion,
  CompraPromocion: compraPromocion,
  CicloFacturacion: cicloFacturacion,
};
