const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { success, error } = require('../utils/responseHelper');

// Registrar nuevo usuario
async function register(req, res, next) {
  try {
    const { nombre, email, password } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !email || !password) {
      return error(res, 'Nombre, email y contraseña son requeridos', 400);
    }
    
    // Validar longitud de contraseña
    if (password.length < 8) {
      return error(res, 'La contraseña debe tener al menos 8 caracteres', 400);
    }
    
    // Validar email único
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return error(res, 'El email ya está registrado', 409);
    }
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      password_hash: passwordHash,
      rol_id: 1, // turista por defecto
    });
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        nombre: usuario.nombre,
        rol: 'turista'
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
        rol: 'turista',
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
        rol: rolNombre
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
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
};
