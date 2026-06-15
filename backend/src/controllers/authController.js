const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario, Lugar, CategoriaLugar, ImagenLugar, Negocio, CategoriaNegocio, ImagenNegocio } = require('../models');
const { success, error } = require('../utils/responseHelper');

function formatearFavorito(lugar) {
  const imagenPortada = lugar.imagenes?.find((imagen) => imagen.es_portada)?.url
    ?? lugar.imagenes?.[0]?.url
    ?? null;

  return {
    id: lugar.id,
    nombre: lugar.nombre,
    direccion: lugar.direccion,
    provincia: lugar.provincia,
    categoria: lugar.categoria
      ? {
          id: lugar.categoria.id,
          nombre: lugar.categoria.nombre,
          icono: lugar.categoria.icono,
        }
      : null,
    imagen_portada: imagenPortada,
  };
}

function formatearNegocioFavorito(negocio) {
  const imagenPortada = negocio.imagenes?.find((imagen) => imagen.es_portada)?.url
    ?? negocio.imagenes?.[0]?.url
    ?? null;

  return {
    id: negocio.id,
    nombre: negocio.nombre,
    direccion: negocio.direccion,
    categoria: negocio.categoria
      ? {
          id: negocio.categoria.id,
          nombre: negocio.categoria.nombre,
          icono: negocio.categoria.icono,
        }
      : null,
    imagen_portada: imagenPortada,
  };
}

const ROLES = ['turista', 'negocio', 'admin'];

// Registrar nuevo usuario
async function register(req, res, next) {
  try {
    const { nombre, email, password, rol_id, terminos_aceptados } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !email || !password) {
      return error(res, 'Nombre, email y contraseña son requeridos', 400);
    }
    
    // Validar longitud de contraseña
    if (password.length < 8) {
      return error(res, 'La contraseña debe tener al menos 8 caracteres', 400);
    }

    // Validar rol_id
    const rolValido = [1, 2].includes(Number(rol_id));
    if (!rolValido) {
      return error(res, 'Debes seleccionar un rol válido (turista o negocio)', 400);
    }

    // Validar términos y condiciones
    if (!terminos_aceptados) {
      return error(res, 'Debes aceptar los términos y condiciones', 400);
    }
    
    // Validar email único
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return error(res, 'El email ya está registrado', 409);
    }
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    const rolFinal = Number(rol_id);
    const rolNombre = ROLES[rolFinal - 1];
    
    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      password_hash: passwordHash,
      rol_id: rolFinal,
    });
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        nombre: usuario.nombre,
        rol: rolNombre,
        rol_id: rolFinal
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    return success(res, {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: rolNombre,
        rol_id: rolFinal,
      },
    }, 201);
  } catch (err) {
    next(err);
  }
}

// Login de usuario
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // Validar campos requeridos
    if (!email || !password) {
      return error(res, 'Email y contraseña son requeridos', 400);
    }
    
    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return error(res, 'Credenciales inválidas', 401);
    }
    
    // Validar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return error(res, 'Credenciales inválidas', 401);
    }
    
    // Determinar rol
    const roles = ['turista', 'negocio', 'admin'];
    const rolNombre = roles[usuario.rol_id - 1] || 'turista';
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        nombre: usuario.nombre,
        rol: rolNombre,
        rol_id: usuario.rol_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    return success(res, {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: rolNombre,
        rol_id: usuario.rol_id,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Obtener perfil del usuario autenticado
async function me(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: ['id', 'nombre', 'email', 'foto_url', 'creado_en'],
      include: [
        {
          model: Lugar,
          as: 'favoritos',
          attributes: ['id', 'nombre', 'direccion', 'provincia'],
          through: { attributes: [] },
          include: [
            {
              model: CategoriaLugar,
              as: 'categoria',
              attributes: ['id', 'nombre', 'icono'],
            },
            {
              model: ImagenLugar,
              as: 'imagenes',
              attributes: ['url', 'es_portada', 'orden'],
            },
          ],
        },
        {
          model: Negocio,
          as: 'negociosFavoritos',
          attributes: ['id', 'nombre', 'direccion'],
          through: { attributes: [] },
          include: [
            {
              model: CategoriaNegocio,
              as: 'categoria',
              attributes: ['id', 'nombre', 'icono'],
            },
            {
              model: ImagenNegocio,
              as: 'imagenes',
              attributes: ['url', 'es_portada', 'orden'],
            },
          ],
        },
      ],
    });

    if (!usuario) {
      return error(res, 'Usuario no encontrado', 404);
    }

    const usuarioJson = usuario.toJSON();

    return success(res, {
      ...usuarioJson,
      rol: req.user.rol,
      rol_id: usuarioJson.rol_id,
      favoritos: (usuarioJson.favoritos || []).map(formatearFavorito),
      negociosFavoritos: (usuarioJson.negociosFavoritos || []).map(formatearNegocioFavorito),
    });
  } catch (err) {
    next(err);
  }
}

// Actualizar perfil del usuario autenticado
async function updateMe(req, res, next) {
  try {
    const { nombre, foto_url: fotoUrlRaw } = req.body;

    const usuario = await Usuario.findByPk(req.user.id, {
      attributes: ['id', 'nombre', 'email', 'foto_url', 'creado_en'],
    });

    if (!usuario) {
      return error(res, 'Usuario no encontrado', 404);
    }

    if (nombre !== undefined) {
      const nombreLimpio = String(nombre).trim();

      if (!nombreLimpio) {
        return error(res, 'El nombre no puede estar vacío', 400);
      }

      if (nombreLimpio.length < 2 || nombreLimpio.length > 100) {
        return error(res, 'El nombre debe tener entre 2 y 100 caracteres', 400);
      }

      usuario.nombre = nombreLimpio;
    }

    if (fotoUrlRaw !== undefined) {
      const fotoUrl = typeof fotoUrlRaw === 'string' ? fotoUrlRaw.trim() : fotoUrlRaw;
      usuario.foto_url = fotoUrl ? fotoUrl : null;
    }

    await usuario.save();

    return success(res, {
      ...usuario.toJSON(),
      rol: req.user.rol,
      rol_id: usuario.rol_id,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  me,
  updateMe,
};
