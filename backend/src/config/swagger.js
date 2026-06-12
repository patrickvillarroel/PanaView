const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PanaView API',
      version: '1.0.0',
      description:
        'API REST para PanaView — app de turismo inteligente en Panamá. ' +
        'Las rutas protegidas requieren un token JWT en el header `Authorization: Bearer <token>`.',
      contact: {
        name: 'PanaView Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT obtenido en /api/auth/login',
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                usuario: { $ref: '#/components/schemas/UsuarioPerfil' },
              },
            },
          },
        },
        UsuarioPerfil: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', example: 'juan@example.com' },
            rol: {
              type: 'string',
              enum: ['turista', 'negocio', 'admin'],
              example: 'turista',
            },
            foto_url: { type: 'string', nullable: true },
            creado_en: { type: 'string', format: 'date-time' },
          },
        },

        // ── Lugares ───────────────────────────────────────────────
        Lugar: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Casco Viejo' },
            descripcion: { type: 'string' },
            historia: { type: 'string' },
            latitud: { type: 'number', example: 8.9524 },
            longitud: { type: 'number', example: -79.5354 },
            direccion: { type: 'string', example: 'Casco Antiguo, Ciudad de Panamá' },
            provincia: { type: 'string', example: 'Panamá' },
            distancia_metros: { type: 'number', example: 320 },
            calificacion_promedio: { type: 'number', example: 4.5 },
            total_resenas: { type: 'integer', example: 12 },
            categoria: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nombre: { type: 'string', example: 'Historia' },
                icono: { type: 'string', example: 'building' },
              },
            },
            imagenes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  es_portada: { type: 'boolean' },
                  orden: { type: 'integer' },
                },
              },
            },
          },
        },
        LugarInput: {
          type: 'object',
          required: ['nombre', 'descripcion', 'latitud', 'longitud', 'categoria_id'],
          properties: {
            nombre: { type: 'string', example: 'Casco Viejo' },
            descripcion: { type: 'string' },
            historia: { type: 'string' },
            latitud: { type: 'number', example: 8.9524 },
            longitud: { type: 'number', example: -79.5354 },
            direccion: { type: 'string' },
            provincia: { type: 'string' },
            categoria_id: { type: 'integer', example: 1 },
          },
        },

        // ── Negocios ──────────────────────────────────────────────
        NegocioInput: {
          type: 'object',
          required: ['nombre', 'descripcion', 'latitud', 'longitud', 'categoria_id'],
          properties: {
            nombre: { type: 'string', example: 'Restaurante El Trapiche' },
            descripcion: { type: 'string' },
            latitud: { type: 'number', example: 8.994 },
            longitud: { type: 'number', example: -79.519 },
            direccion: { type: 'string' },
            horario: { type: 'string', example: 'Lun - Dom: 8:00 AM - 10:00 PM' },
            categoria_id: { type: 'integer', example: 1 },
          },
        },
      },
    },
  },
  // Archivos donde están los comentarios @swagger
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
