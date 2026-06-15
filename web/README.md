# PanaView · Panel de administración (CRM Web)

CRM web para administradores de PanaView. Permite gestionar **lugares turísticos** y
**negocios**, además de **verificar las solicitudes** de propietarios que registran un
negocio nuevo.

Construido con **React + Vite + TypeScript**, animaciones con **Framer Motion** e
iconos de **lucide-react**. Consume la API del backend Express del proyecto.

## Requisitos

- Node 18+
- El backend del proyecto corriendo (por defecto en `http://localhost:3000`).

## Puesta en marcha

```bash
cd web
npm install

# (opcional) configura la URL de la API
cp .env.example .env
# edita VITE_API_URL si tu backend no está en http://localhost:3000

npm run dev
```

La app abre en `http://localhost:5174`.

## Acceso

El login es **exclusivo para administradores** (`rol = admin`). Cualquier otra cuenta
es rechazada. Con la BD semilla puedes entrar con:

- **Email:** `admin@panaroute.com`
- **Contraseña:** `12345678`

## Estructura

```
src/
  api/client.ts            Axios + token + manejo de 401
  auth/AuthContext.tsx     Sesión, login solo-admin
  components/              Layout, Modal, ConfirmDialog, Toast, etc.
  pages/
    Login.tsx              Inicio de sesión
    Dashboard.tsx          Resumen y accesos rápidos
    Lugares.tsx            CRUD de lugares
    Negocios.tsx           CRUD de negocios + verificar
    Solicitudes.tsx        Revisión/verificación de negocios pendientes
  services/                Llamadas a la API
```

## Endpoints del backend que usa

Se agregaron al backend para soportar este panel:

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/lugares/admin/todos` | Lista todos los lugares |
| DELETE | `/api/lugares/:id` | Elimina un lugar |
| GET | `/api/negocios/admin/todos?verificado=0\|1` | Lista negocios (filtrable) |
| PATCH | `/api/negocios/:id/verificar` | Verifica / rechaza un negocio |
| DELETE | `/api/negocios/:id` | Elimina un negocio |

Todas requieren un token JWT de un usuario con rol `admin`.

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — typecheck + build de producción
- `npm run preview` — previsualiza el build
