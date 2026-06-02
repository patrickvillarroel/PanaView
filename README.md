# PanaRoute - Aplicación Móvil de Turismo Inteligente

## 📱 Descripción del Proyecto

**PanaRoute** es una aplicación móvil full-stack de turismo inteligente basada en geolocalización para la República de Panamá. Permite a los usuarios descubrir lugares turísticos y negocios cercanos en tiempo real, ver reseñas, calificaciones y acceder a información detallada sobre cada sitio.

### Características Principales

✅ **Autenticación con JWT** - Sistema seguro de registro e inicio de sesión  
✅ **Geolocalización en Tiempo Real** - Ubicación continua del usuario  
✅ **Mapa Interactivo** - Google Maps con marcadores de lugares y negocios  
✅ **Filtrado por Distancia** - Búsqueda de sitios cercanos con radio configurable  
✅ **Reseñas y Calificaciones** - Sistema de rating 1-5 estrellas  
✅ **Favoritos** - Guardar lugares favoritos  
✅ **Historial de Visitas** - Registro automático de lugares visitados  
✅ **Perfiles de Propietarios** - Soporte para negociantes que registren sus emprendimientos  

---

## 🏗️ Stack Tecnológico

### Backend
- **Node.js 20** + Express.js 4
- **MySQL 8.0** + Sequelize ORM v6
- **JWT** para autenticación
- **bcrypt** para hash de contraseñas (12 rondas)
- **Rate Limiting** en rutas de autenticación

### Mobile
- **Expo SDK 51** + React Native
- **Expo Router v3** - Navegación basada en archivos
- **React Context API** - Gestión de estado global
- **Axios** - Cliente HTTP con interceptores
- **react-native-maps** - Mapas con Google Maps
- **expo-location** - Geolocalización
- **AsyncStorage** - Persistencia local

---

## 📦 Estructura del Proyecto

```
panaroute/
├── backend/
│   ├── src/
│   │   ├── routes/          # Rutas de la API
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── models/          # Modelos Sequelize
│   │   ├── middlewares/     # Autenticación, errores
│   │   ├── config/          # Conexión a BD
│   │   └── utils/           # Helpers (geolocalización, respuestas)
│   ├── app.js               # Configuración Express
│   ├── server.js            # Punto de entrada
│   ├── package.json
│   └── .env.example
│
└── mobile/
    ├── app/
    │   ├── _layout.tsx      # Stack layout raíz
    │   ├── index.tsx        # Splash screen
    │   ├── login.tsx
    │   ├── register.tsx
    │   ├── (tabs)/          # Tab navigator
    │   └── lugar/[id].tsx   # Detalle dinámico
    ├── components/          # Componentes reutilizables
    ├── hooks/               # Custom hooks
    ├── services/            # Llamadas API
    ├── context/             # Context API
    ├── constants/           # Configuración
    ├── types/               # TypeScript interfaces
    ├── package.json
    ├── app.json
    └── tsconfig.json
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js 18+** y **npm 8+**
- **MySQL 8.0+** corriendo localmente
- **Expo CLI**: `npm install -g expo-cli`
- **Emulador Android** o **iOS Simulator** (o dispositivo físico)
- **Git**

---

### PASO 1: Clonar el Repositorio y Crear la Base de Datos

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/panaroute.git
cd panaroute

# Abrir MySQL y crear la base de datos
mysql -u root -p < panaroute.sql

# O manualmente:
# mysql -u root -p
# mysql> source panaroute.sql;
# mysql> exit;
```

**Verificar que la BD se creó:**
```bash
mysql -u root -p -e "USE panaroute; SHOW TABLES;"
```

---

### PASO 2: Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env (copiar desde .env.example)
cp .env.example .env

# Editar .env con tus valores (editor de tu preferencia):
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=panaroute
# DB_USER=root              (tu usuario MySQL)
# DB_PASSWORD=tu_contraseña (tu contraseña MySQL)
# JWT_SECRET=tu_cadena_secreta_muy_larga_y_aleatoria
# PORT=3000
```

**Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

**Esperado:**
```
✓ Conexión a la base de datos exitosa
✓ Modelos sincronizados

🚀 Servidor PanaRoute ejecutándose en puerto 3000
📍 API disponible en http://localhost:3000/api
```

**Verificar que el backend funciona:**
```bash
curl http://localhost:3000/health

# Deberías recibir:
# {"success":true,"message":"Backend funcionando correctamente"}
```

---

### PASO 3: Configurar la Aplicación Móvil

```bash
# Volver a la raíz del proyecto
cd ../mobile

# Instalar dependencias
npm install

# IMPORTANTE: Configurar la IP del servidor
# Editar mobile/constants/config.ts
# Cambiar API_URL con tu IP local:

# En Windows: ipconfig | findstr IPv4
# En Mac/Linux: ifconfig | grep inet

# Ejemplo: export const API_URL = 'http://192.168.1.100:3000/api';
```

**Editar `mobile/constants/config.ts`:**
```typescript
// Cambiar esta línea con tu IP local
export const API_URL = 'http://192.168.1.100:3000/api';
```

---

### PASO 4: Ejecutar la Aplicación Móvil

```bash
cd mobile

# Opción 1: Iniciar Expo (verás un QR para escanear)
npx expo start

# Opción 2: Ejecutar en Android
npx expo start --android

# Opción 3: Ejecutar en iOS (solo en Mac)
npx expo start --ios

# Opción 4: Ver en navegador web
npx expo start --web
```

**En la terminal de Expo verás opciones:**
```
› Android Emulator
› iOS Simulator
› Web
› Scan with Expo Go
```

---

### PASO 5: Conectar un Dispositivo Físico

1. **Instala la app Expo Go** desde:
   - Google Play (Android)
   - App Store (iOS)

2. **Desde la terminal:**
   ```bash
   npx expo start
   ```

3. **En tu dispositivo:**
   - Android: Abre Expo Go y escanea el código QR
   - iOS: Abre la Cámara y escanea el código QR

---

## 🧪 Probar la API

### Registro de usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### Obtener lugares cercanos
```bash
curl "http://localhost:3000/api/lugares?lat=8.9524&lng=-79.5355&radio=500"
```

### Obtener negocios cercanos
```bash
curl "http://localhost:3000/api/negocios?lat=8.9524&lng=-79.5355&radio=500"
```

---

## 🔐 Seguridad

- ✅ **Contraseñas**: Hasheadas con bcrypt (12 rondas)
- ✅ **JWT**: Token con expiración de 7 días
- ✅ **Rate Limiting**: 100 requests / 15 min en `/api/auth`
- ✅ **CORS**: Configurado para la app móvil
- ✅ **Validación**: Input validation en todos los endpoints
- ✅ **Autenticación**: Required en rutas privadas
- ✅ **Rol-based Access**: Admin, negocio, turista

---

## 📊 Base de Datos

### Tablas Principales
1. **usuarios** - Usuarios registrados (turistas, negociantes, admins)
2. **lugares** - Sitios turísticos de Panamá
3. **imagenes_lugar** - Fotos de lugares
4. **negocios** - Emprendimientos turísticos
5. **resenas_lugar** - Reviews de lugares
6. **favoritos** - Lugares guardados
7. **historial_visitas** - Registro de visitas

### Datos Semilla
La BD incluye:
- 8 lugares turísticos principales de Panamá
- 8 categorías de lugares
- 8 categorías de negocios
- Geolocalización exacta de cada sitio

---

## 🛠️ Desarrollo y Debugging

### Backend Logs
```bash
# Ver logs en tiempo real
npm run dev

# Logs de BD (configurado en .env NODE_ENV=development)
```

### Mobile Debugging
```bash
# Abre la consola de Expo
# Presiona: 'i' (iOS), 'a' (Android), 'w' (Web), 'c' (Clear), 'j' (Open DevTools)

# Para debugging avanzado en Android:
# Instala React Native Debugger
npm install -g react-native-debugger
```

---

## 🚨 Troubleshooting

### "Error: Cannot find module 'sequelize'"
```bash
cd backend
npm install
```

### "Error: Connection refused (database connection)"
- Verifica que MySQL está corriendo: `mysql -u root -p`
- Verifica credenciales en `.env`
- Verifica que la BD `panaroute` existe

### "Error: Cannot GET /api/lugares"
- Asegúrate de que backend está corriendo en puerto 3000
- Verifica que `API_URL` en `mobile/constants/config.ts` es correcto

### "Expo: Network error - unable to resolve API"
- Usa tu IP local, no `localhost`:
  ```bash
  # Windows
  ipconfig | findstr IPv4
  
  # Mac/Linux
  ifconfig | grep inet
  ```
- Asegúrate de que backend y mobile están en la misma red

### "Map is blank"
- En `app.json`, verifica que la API key de Google Maps está configurada
- Genera una API key en [Google Cloud Console](https://console.cloud.google.com/)

---

## 📱 Funcionalidades por Rol

### Turista (predeterminado)
- Ver mapa de lugares
- Buscar negocios cercanos
- Escribir reseñas
- Guardar favoritos
- Ver historial de visitas

### Negociante
- Todo lo de turista +
- Registrar su negocio
- Editar información del negocio
- Ver contactos de clientes

### Admin
- Acceso completo
- Crear/editar lugares
- Gestionar usuarios
- Verificar negocios

---

## 📝 Notas Importantes

1. **Primera ejecución**: El backend sincronizará automáticamente la BD
2. **Geolocalización**: Necesita permiso del usuario en el dispositivo
3. **Google Maps**: Requiere API key. [Obtenerla aquí](https://console.cloud.google.com/)
4. **JWT expira en 7 días**: Los usuarios deberán volver a iniciar sesión
5. **AsyncStorage**: Los datos locales persisten después de cerrar la app

---

## 🤝 Contribuir

1. Fork del proyecto
2. Crea una rama: `git checkout -b feature/nueva-caracteristica`
3. Commit: `git commit -am 'Add new feature'`
4. Push: `git push origin feature/nueva-caracteristica`
5. Pull Request

---

## 📞 Soporte

Para preguntas o problemas:
1. Revisa el [Troubleshooting](#-troubleshooting)
2. Verifica que todas las dependencias están instaladas
3. Consulta la documentación de [Expo](https://docs.expo.dev/)
4. Revisa la documentación de [Sequelize](https://sequelize.org/)

---

## 📄 Licencia

Este proyecto está bajo licencia ISC.

---

**¡Disfruta descubriendo Panamá con PanaRoute! 🇵🇦**
