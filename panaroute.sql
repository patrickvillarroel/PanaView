-- ===================================================================
-- PanaRoute Database Script
-- MySQL 8.0
-- ===================================================================

CREATE DATABASE IF NOT EXISTS panaroute CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE panaroute;

-- ===================================================================
-- TABLA: roles
-- ===================================================================

CREATE TABLE roles (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(30) UNIQUE NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (nombre) VALUES 
('turista'),
('negocio'),
('admin');

-- ===================================================================
-- TABLA: usuarios
-- ===================================================================

CREATE TABLE usuarios (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  rol_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  foto_url VARCHAR(500) NULL,
  activo TINYINT(1) DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  INDEX idx_email (email),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLA: categorias_lugar
-- ===================================================================

CREATE TABLE categorias_lugar (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(60) UNIQUE NOT NULL,
  icono VARCHAR(100) NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categorias_lugar (nombre, icono) VALUES 
('Historia y Cultura', 'history'),
('Naturaleza', 'leaf'),
('Playa', 'water'),
('Religioso', 'cross'),
('Mirador', 'eye'),
('Museo', 'building'),
('Entretenimiento', 'gamepad'),
('Gastronomía', 'utensils');

-- ===================================================================
-- TABLA: lugares
-- ===================================================================

CREATE TABLE lugares (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  categoria_id TINYINT UNSIGNED NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  historia LONGTEXT NULL,
  latitud DECIMAL(10, 7) NOT NULL,
  longitud DECIMAL(10, 7) NOT NULL,
  direccion VARCHAR(255) NULL,
  provincia VARCHAR(80) NULL,
  audio_url VARCHAR(500) NULL,
  activo TINYINT(1) DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias_lugar(id),
  INDEX idx_categoria (categoria_id),
  INDEX idx_latitud_longitud (latitud, longitud),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar los 8 lugares semilla
INSERT INTO lugares (categoria_id, nombre, descripcion, historia, latitud, longitud, direccion, provincia, activo) VALUES 
(
  1, 'Casco Antiguo', 
  'El corazón histórico de la Ciudad de Panamá, declarado Patrimonio de la Humanidad por la UNESCO en 1997.',
  'El Casco Antiguo fue fundado en 1673 tras la destrucción de la ciudad original por el pirata Henry Morgan. Se construyó en una pequeña península defensiva. A lo largo de los siglos ha sido testigo de importantes eventos históricos y es hoy un testimonio viviente de la arquitectura colonial y republicana panameña.',
  8.9524400, -79.5354600, 'Casco Antiguo, Ciudad de Panamá', 'Panamá', 1
),
(
  1, 'Ruinas de Panamá Viejo',
  'Los restos arqueológicos de la primera ciudad de Panamá, fundada en 1519. Sitio Patrimonio de la Humanidad.',
  'Panamá Viejo fue la primera ciudad europea permanente en la costa del Pacífico. Fue destruida por Henry Morgan en 1671. Las ruinas que permanecen hoy incluyen la catedral, conventos y fortificaciones, siendo un testimonio invaluable de la historia colonial panameña.',
  8.9929800, -79.4851200, 'Panamá Viejo, Ciudad de Panamá', 'Panamá', 1
),
(
  2, 'Parque Nacional de Soberanía',
  'Una de las reservas forestales más importantes de Panamá, hogar de jaguares, pumas y cientos de especies de aves.',
  'Establecido en 1980, el Parque Nacional de Soberanía protege 22,104 hectáreas de bosque tropical. Es especialmente conocido por el Camino de Cruces, un sendero histórico utilizado durante la época colonial. El parque es crítico para la preservación de la biodiversidad del istmo panameño.',
  9.1166700, -79.7166700, 'Provincia de Colón', 'Colón', 1
),
(
  2, 'Volcán Barú',
  'El pico más alto de Panamá con 3,475 metros de altura. En días despejados se pueden ver ambos océanos.',
  'El volcán Barú es el pico más prominente de Panamá y forma parte de la Cordillera de Talamanca. Su última erupción fue hace más de 1,000 años. Es un destino popular para el senderismo y ofrece vistas espectaculares del paisaje panameño desde su cumbre.',
  8.8080600, -82.5432100, 'Boquete, Chiriquí', 'Chiriquí', 1
),
(
  3, 'Bocas del Toro',
  'Un archipiélago paradisíaco en el Caribe panameño, famoso por sus playas, arrecifes de coral y vida marina.',
  'Bocas del Toro es una región costera ubicada en la provincia del mismo nombre. El archipiélago comprende la isla de Colón y otras pequeñas islas. Es conocida por sus aguas cristalinas, playas de arena blanca, y es un destino favorito para buceo, snorkel y relajación.',
  9.3400600, -82.2415200, 'Bocas del Toro, Bocas del Toro', 'Bocas del Toro', 1
),
(
  6, 'Esclusas de Miraflores',
  'Parte del icónico Canal de Panamá, un museo interactivo que explica la ingeniería y la historia del canal.',
  'Las Esclusas de Miraflores son el sistema de exclusas del Canal de Panamá más cercano a la ciudad de Panamá. Completadas en 1913, permiten que los barcos crucen el istmo. El Museo de Miraflores, ubicado adyacente, ofrece una experiencia interactiva sobre la historia, ingeniería y operación del canal.',
  8.9966700, -79.5833300, 'Miraflores, Ciudad de Panamá', 'Panamá', 1
),
(
  1, 'El Valle de Antón',
  'Una zona montañosa y fresca ubicada en una caldera volcánica, conocida por su clima templado y naturaleza.',
  'El Valle de Antón se encuentra en una depresión geológica a una altura de 600 metros. Es conocido por su clima más fresco en comparación con el resto de Panamá. Fue un popular destino de veraneo durante la época colonial. Hoy es un lugar ideal para escapar del calor y disfrutar de cascadas y senderos naturales.',
  8.6050000, -80.1316700, 'El Valle de Antón, Coclé', 'Coclé', 1
),
(
  4, 'Iglesia de San José',
  'Una iglesia colonial del siglo XVII ubicada en el Casco Antiguo, conocida por su altar dorado.',
  'La Iglesia de San José es una de las pocas estructuras que sobrevivió el incendio de 1671 en Panamá Viejo. Fue reconstruida en el Casco Antiguo. Su altar dorado es considerado uno de los más hermosos de América Latina y es un ejemplo extraordinario del arte religioso colonial.',
  8.9524000, -79.5355000, 'Casco Antiguo, Ciudad de Panamá', 'Panamá', 1
);

-- ===================================================================
-- TABLA: imagenes_lugar
-- ===================================================================

CREATE TABLE imagenes_lugar (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  lugar_id CHAR(36) NOT NULL,
  url VARCHAR(500) NOT NULL,
  es_portada TINYINT(1) DEFAULT 0,
  orden TINYINT DEFAULT 0,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lugar_id) REFERENCES lugares(id) ON DELETE CASCADE,
  INDEX idx_lugar (lugar_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar imágenes de ejemplo para los lugares (URLs de ejemplo)
-- En producción, estas serían URLs reales de imágenes
INSERT INTO imagenes_lugar (lugar_id, url, es_portada, orden) 
SELECT id, CONCAT('https://via.placeholder.com/800x600?text=', REPLACE(nombre, ' ', '+')) AS url, 1, 0 
FROM lugares;

-- ===================================================================
-- TABLA: categorias_negocio
-- ===================================================================

CREATE TABLE categorias_negocio (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(60) UNIQUE NOT NULL,
  icono VARCHAR(100) NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categorias_negocio (nombre, icono) VALUES 
('Restaurante', 'utensils'),
('Fonda / Comida típica', 'bowl'),
('Artesanías', 'palette'),
('Hospedaje', 'bed'),
('Transporte', 'car'),
('Tienda / Souvenir', 'shopping-bag'),
('Tour / Guía', 'map'),
('Cafetería', 'coffee');

-- ===================================================================
-- TABLA: negocios
-- ===================================================================

CREATE TABLE negocios (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  propietario_id CHAR(36) NOT NULL,
  categoria_id TINYINT UNSIGNED NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  latitud DECIMAL(10, 7) NOT NULL,
  longitud DECIMAL(10, 7) NOT NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(20) NULL,
  whatsapp VARCHAR(20) NULL,
  horario VARCHAR(200) NULL,
  sitio_web VARCHAR(300) NULL,
  verificado TINYINT(1) DEFAULT 0,
  activo TINYINT(1) DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (propietario_id) REFERENCES usuarios(id),
  FOREIGN KEY (categoria_id) REFERENCES categorias_negocio(id),
  INDEX idx_propietario (propietario_id),
  INDEX idx_categoria (categoria_id),
  INDEX idx_latitud_longitud (latitud, longitud),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLA: promociones
-- ===================================================================

CREATE TABLE promociones (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  negocio_id CHAR(36) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.0,
  fecha_validez DATETIME NULL,
  qr_codigo VARCHAR(255) UNIQUE NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  INDEX idx_negocio (negocio_id),
  INDEX idx_activo_prom (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para registrar compras/redenciones de promociones
CREATE TABLE compras_promociones (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  promocion_id CHAR(36) NOT NULL,
  usuario_id CHAR(36) NULL,
  qr_codigo VARCHAR(255) NULL,
  registrado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  metodo VARCHAR(50) DEFAULT 'app',
  FOREIGN KEY (promocion_id) REFERENCES promociones(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_promocion (promocion_id),
  INDEX idx_usuario_compra (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLA: resenas_lugar
-- ===================================================================

CREATE TABLE resenas_lugar (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  lugar_id CHAR(36) NOT NULL,
  usuario_id CHAR(36) NOT NULL,
  calificacion TINYINT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lugar_id) REFERENCES lugares(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  UNIQUE KEY uk_lugar_usuario (lugar_id, usuario_id),
  INDEX idx_lugar (lugar_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_calificacion (calificacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLA: favoritos
-- ===================================================================

CREATE TABLE favoritos (
  usuario_id CHAR(36) NOT NULL,
  lugar_id CHAR(36) NOT NULL,
  guardado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, lugar_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (lugar_id) REFERENCES lugares(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_lugar (lugar_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLA: historial_visitas
-- ===================================================================

CREATE TABLE historial_visitas (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  usuario_id CHAR(36) NOT NULL,
  lugar_id CHAR(36) NOT NULL,
  visitado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (lugar_id) REFERENCES lugares(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_lugar (lugar_id),
  INDEX idx_visitado_en (visitado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- VISTA: vw_rating_lugares
-- ===================================================================

CREATE OR REPLACE VIEW vw_rating_lugares AS
SELECT 
  l.id,
  l.nombre,
  COUNT(r.id) AS total_resenas,
  ROUND(COALESCE(AVG(r.calificacion), 0), 1) AS calificacion_promedio
FROM lugares l
LEFT JOIN resenas_lugar r ON l.id = r.lugar_id
GROUP BY l.id, l.nombre;

-- ===================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ===================================================================

CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_lugares_provincia ON lugares(provincia);

-- ===================================================================
-- FIN DEL SCRIPT
-- ===================================================================
