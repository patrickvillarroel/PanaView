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

-- Usuarios semilla (password: 12345678 en bcrypt)
INSERT INTO usuarios (id, rol_id, nombre, email, password_hash, activo) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, 'Admin PanaRoute', 'admin@panaroute.com', '$2b$12$LJ3m4ys3Lz0QxDuFqFK3ZOjCfZbGfXMQfFz3Rz0qG9Rz5YqZxZqZe', 1),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 2, 'Restaurante El Buen Sabor', 'buenabor@email.com', '$2b$12$LJ3m4ys3Lz0QxDuFqFK3ZOjCfZbGfXMQfFz3Rz0qG9Rz5YqZxZqZe', 1),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 2, 'Café del Mar', 'cafdelmar@email.com', '$2b$12$LJ3m4ys3Lz0QxDuFqFK3ZOjCfZbGfXMQfFz3Rz0qG9Rz5YqZxZqZe', 1),
('d4e5f6a7-b8c9-0123-defa-234567890123', 2, 'Souvenirs Panamá', 'souvenirs@email.com', '$2b$12$LJ3m4ys3Lz0QxDuFqFK3ZOjCfZbGfXMQfFz3Rz0qG9Rz5YqZxZqZe', 1),
('e5f6a7b8-c9d0-1234-efab-345678901234', 2, 'Hotel Plaza Amador', 'hotelplaza@email.com', '$2b$12$LJ3m4ys3Lz0QxDuFqFK3ZOjCfZbGfXMQfFz3Rz0qG9Rz5YqZxZqZe', 1),
('f6a7b8c9-d0e1-2345-fabc-456789012345', 2, 'Tours Panamá Adventure', 'tours@email.com', '$2b$12$LJ3m4ys3Lz0QxDuFqFK3ZOjCfZbGfXMQfFz3Rz0qG9Rz5YqZxZqZe', 1),
('11111111-2222-3333-4444-555555555555', 1, 'Carlos Turista', 'carlos@email.com', '$2b$12$LJ3m4ys3Lz0QxDuFqFK3ZOjCfZbGfXMQfFz3Rz0qG9Rz5YqZxZqZe', 1),
('22222222-3333-4444-5555-666666666666', 1, 'María Turista', 'maria@email.com', '$2b$12$LJ3m4ys3Lz0QxDuFqFK3ZOjCfZbGfXMQfFz3Rz0qG9Rz5YqZxZqZe', 1);

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

-- Insertar imágenes de ejemplo para los lugares (rutas relativas)
INSERT INTO imagenes_lugar (lugar_id, url, es_portada, orden) 
SELECT id, CONCAT('/uploads/lugares/', REPLACE(REPLACE(nombre, ' ', '-'), '.', ''), '-portada.jpg') AS url, 1, 0 
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

-- Negocios semilla cercanos a 9.089204, -79.4029686 (Albrook)
INSERT INTO negocios (id, propietario_id, categoria_id, nombre, descripcion, latitud, longitud, direccion, telefono, whatsapp, horario, verificado, activo) VALUES
('aaa11111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 1, 'Restaurante El Buen Sabor', 'Comida típica panameña con los mejores platos del istmo.', 9.0901200, -79.4035000, 'Vía España, Albrook', '6030-1234', '6030-1234', 'Lun-Dom 11:00-22:00', 1, 1),
('aaa22222-2222-2222-2222-222222222222', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 8, 'Café del Mar Albrook', 'Café artesanal con vista al parque. Exquisitos pasteles y café de especialidad.', 9.0885000, -79.4018000, 'Calle 12, Albrook', '6030-5678', '6030-5678', 'Lun-Sáb 7:00-20:00', 1, 1),
('aaa33333-3333-3333-3333-333333333333', 'd4e5f6a7-b8c9-0123-defa-234567890123', 6, 'Souvenirs Panamá', 'Artesanías, molas, sombrillos y recuerdos auténticos de Panamá.', 9.0898000, -79.4042000, 'Multiplaza, Albrook', '6030-9012', '6030-9012', 'Lun-Dom 10:00-21:00', 1, 1),
('aaa44444-4444-4444-4444-444444444444', 'e5f6a7b8-c9d0-1234-efab-345678901234', 4, 'Hotel Plaza Amador', 'Hotel boutique frente al mar en la zona colonial de Amador.', 9.0912000, -79.4005000, 'Av. Amador, Amador', '6030-3456', '6030-3456', '24 horas', 1, 1),
('aaa55555-5555-5555-5555-555555555555', 'f6a7b8c9-d0e1-2345-fabc-456789012345', 7, 'Tours Panamá Adventure', 'Tours personalizados por la ciudad, canal y playas.', 9.0879000, -79.4023000, 'Av. Balboa, Calidonia', '6030-7890', '6030-7890', 'Lun-Sáb 8:00-18:00', 1, 1),
('aaa66666-6666-6666-6666-666666666666', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 2, 'Fonda La Abuela', 'Recetas tradicionales de la abuela. Sancocho, arroz con pollo y más.', 9.0887000, -79.4051000, 'Av. Perú, Calidonia', '6030-2345', '6030-2345', 'Mar-Dom 10:00-21:00', 0, 1),
('aaa77777-7777-7777-7777-777777777777', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 3, 'Artesanías de la India', 'Molas kuna, cerámicas y tejidos artesanales.', 9.0905000, -79.4012000, 'Av. Balboa, Balboa', '6030-6789', '6030-6789', 'Lun-Sáb 9:00-19:00', 0, 1),
('aaa88888-8888-8888-8888-888888888888', 'e5f6a7b8-c9d0-1234-efab-345678901234', 5, 'Transporte Aeropuerto', 'Traslados al Aeropuerto Tocumen y al interior del país.', 9.0895000, -79.4038000, 'Terminal Albrook', '6030-4567', '6030-4567', '24 horas', 1, 1);

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

-- Promociones semilla
INSERT INTO promociones (id, negocio_id, nombre, descripcion, precio, fecha_validez, qr_codigo, activo) VALUES
('bbb11111-1111-1111-1111-111111111111', 'aaa11111-1111-1111-1111-111111111111', 'Almuerzo Ejecutivo', 'Almuerzo completo con entrada, plato fuerte y bebida.', 7.50, '2026-12-31', 'QR-BUENSABOR-001', 1),
('bbb22222-2222-2222-2222-222222222222', 'aaa11111-1111-1111-1111-111111111111', '2x1 en Cervezas Artesanales', 'Todos los viernes de 5pm a 8pm, 2x1 en cervezas artesanales nacionales.', 3.00, '2026-09-30', 'QR-BUENSABOR-002', 1),
('bbb33333-3333-3333-3333-333333333333', 'aaa22222-2222-2222-2222-222222222222', 'Desayuno Completo', 'Desayuno panameño completo: huevos, tortillas, queso, café y jugo natural.', 5.00, '2026-12-31', 'QR-CAFEMAR-001', 1),
('bbb44444-4444-4444-4444-444444444444', 'aaa22222-2222-2222-2222-222222222222', 'Café + Pastel', 'Café de especialidad más un pastel de la casa.', 4.00, '2026-08-15', 'QR-CAFEMAR-002', 1),
('bbb55555-5555-5555-5555-555555555555', 'aaa33333-3333-3333-3333-333333333333', '15% Dcto. en Molas', 'Descuento del 15% en todas las molas artesanales kuna.', 10.00, '2026-10-31', 'QR-SOUVENIR-001', 1),
('bbb66666-6666-6666-6666-666666666666', 'aaa44444-4444-4444-4444-444444444444', 'Noche de Bienvenida', 'Cena romántica con botella de vino incluida al hospedarte.', 45.00, '2026-12-31', 'QR-HOTELPLAZA-001', 1),
('bbb77777-7777-7777-7777-777777777777', 'aaa55555-5555-5555-5555-555555555555', 'Tour Casco Antiguo', 'Recorrido guiado de 3 horas por el Casco Antiguo con entrada a museos.', 25.00, '2026-11-30', 'QR-TOURS-001', 1),
('bbb88888-8888-8888-8888-888888888888', 'aaa66666-6666-6666-6666-666666666666', 'Sancocho + Bebida', 'Sancocho panameño tradicional más agua de tamarindo.', 4.50, '2026-12-31', 'QR-FONDA-001', 1);

-- ===================================================================
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
-- TABLA: imagenes_negocio
-- ===================================================================

CREATE TABLE imagenes_negocio (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  negocio_id CHAR(36) NOT NULL,
  url VARCHAR(500) NOT NULL,
  es_portada TINYINT(1) DEFAULT 0,
  orden TINYINT DEFAULT 0,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  INDEX idx_negocio (negocio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Imágenes de ejemplo para los negocios (rutas relativas, subir imágenes reales vía API)
INSERT INTO imagenes_negocio (negocio_id, url, es_portada, orden) VALUES
('aaa11111-1111-1111-1111-111111111111', '/uploads/negocios/negocio-aaa11111-portada.jpg', 1, 0),
('aaa11111-1111-1111-1111-111111111111', '/uploads/negocios/negocio-aaa11111-2.jpg', 0, 1),
('aaa11111-1111-1111-1111-111111111111', '/uploads/negocios/negocio-aaa11111-3.jpg', 0, 2),
('aaa22222-2222-2222-2222-222222222222', '/uploads/negocios/negocio-aaa22222-portada.jpg', 1, 0),
('aaa22222-2222-2222-2222-222222222222', '/uploads/negocios/negocio-aaa22222-2.jpg', 0, 1),
('aaa33333-3333-3333-3333-333333333333', '/uploads/negocios/negocio-aaa33333-portada.jpg', 1, 0),
('aaa33333-3333-3333-3333-333333333333', '/uploads/negocios/negocio-aaa33333-2.jpg', 0, 1),
('aaa44444-4444-4444-4444-444444444444', '/uploads/negocios/negocio-aaa44444-portada.jpg', 1, 0),
('aaa44444-4444-4444-4444-444444444444', '/uploads/negocios/negocio-aaa44444-2.jpg', 0, 1),
('aaa55555-5555-5555-5555-555555555555', '/uploads/negocios/negocio-aaa55555-portada.jpg', 1, 0),
('aaa55555-5555-5555-5555-555555555555', '/uploads/negocios/negocio-aaa55555-2.jpg', 0, 1),
('aaa66666-6666-6666-6666-666666666666', '/uploads/negocios/negocio-aaa66666-portada.jpg', 1, 0),
('aaa66666-6666-6666-6666-666666666666', '/uploads/negocios/negocio-aaa66666-2.jpg', 0, 1),
('aaa77777-7777-7777-7777-777777777777', '/uploads/negocios/negocio-aaa77777-portada.jpg', 1, 0),
('aaa77777-7777-7777-7777-777777777777', '/uploads/negocios/negocio-aaa77777-2.jpg', 0, 1),
('aaa88888-8888-8888-8888-888888888888', '/uploads/negocios/negocio-aaa88888-portada.jpg', 1, 0);

-- ===================================================================
-- TABLA: favoritos_negocio
-- ===================================================================

CREATE TABLE favoritos_negocio (
  usuario_id CHAR(36) NOT NULL,
  negocio_id CHAR(36) NOT NULL,
  guardado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, negocio_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_negocio (negocio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLA: resenas_negocio
-- ===================================================================

CREATE TABLE resenas_negocio (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  negocio_id CHAR(36) NOT NULL,
  usuario_id CHAR(36) NOT NULL,
  calificacion TINYINT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  UNIQUE KEY uk_negocio_usuario (negocio_id, usuario_id),
  INDEX idx_negocio (negocio_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_calificacion (calificacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reseñas de ejemplo para negocios
INSERT INTO resenas_negocio (negocio_id, usuario_id, calificacion, comentario) VALUES
('aaa11111-1111-1111-1111-111111111111', '11111111-2222-3333-4444-555555555555', 5, 'Excelente comida típica, el sancocho está increíble. Muy buena atención.'),
('aaa11111-1111-1111-1111-111111111111', '22222222-3333-4444-5555-666666666666', 4, 'Buena porción y sabor, pero el servicio puede ser un poco lento en horas pico.'),
('aaa22222-2222-2222-2222-222222222222', '11111111-2222-3333-4444-555555555555', 5, 'El mejor café de Albrook. El pastel de zanahoria es espectacular.'),
('aaa33333-3333-3333-3333-333333333333', '22222222-3333-4444-5555-666666666666', 4, 'Muy bonitas las molas, precios justos. Buena atención al cliente.'),
('aaa44444-4444-4444-4444-444444444444', '11111111-2222-3333-4444-555555555555', 5, 'Hermoso hotel, la vista al mar es impresionante. Muy limpio y tranquilo.'),
('aaa55555-5555-5555-5555-555555555555', '22222222-3333-4444-5555-666666666666', 5, 'El tour por el Casco Antiguo fue excelente. Muy profesionales y divertidos.');

-- ===================================================================
-- VISTA: vw_rating_negocios
-- ===================================================================

CREATE OR REPLACE VIEW vw_rating_negocios AS
SELECT
  n.id,
  n.nombre,
  COUNT(r.id) AS total_resenas,
  ROUND(COALESCE(AVG(r.calificacion), 0), 1) AS calificacion_promedio
FROM negocios n
LEFT JOIN resenas_negocio r ON n.id = r.negocio_id
GROUP BY n.id, n.nombre;

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
