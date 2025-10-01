# Conversatron Backend API

Backend API en Express para el dashboard de análisis de conversaciones con IA.

## 🚀 Características

- **Autenticación JWT**: Sistema completo de registro e inicio de sesión
- **API RESTful**: Endpoints para conversaciones, mensajes y analíticas
- **WebSockets**: Actualizaciones en tiempo real con Socket.IO
- **Base de datos PostgreSQL**: Almacenamiento robusto y escalable
- **TypeScript**: Código tipado y seguro
- **Validación**: Esquemas Zod para validación de datos

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## 🛠️ Instalación

1. Instalar dependencias:
```bash
cd backend
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Edita `.env` con tus configuraciones:
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/conversatron
JWT_SECRET=tu-secreto-super-seguro
FRONTEND_URL=http://localhost:5173
```

3. Crear la base de datos:
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE conversatron;

# Salir
\q
```

4. Ejecutar el schema:
```bash
psql -U postgres -d conversatron -f src/db/schema.sql
```

## 🏃 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/signup` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual (requiere auth)

### Conversaciones
- `GET /api/conversations` - Listar conversaciones
- `GET /api/conversations/:id` - Obtener conversación
- `POST /api/conversations` - Crear conversación
- `PATCH /api/conversations/:id` - Actualizar conversación
- `DELETE /api/conversations/:id` - Eliminar conversación
- `GET /api/conversations/:id/stats` - Estadísticas de conversación

### Mensajes
- `GET /api/messages/conversation/:conversationId` - Mensajes de conversación
- `GET /api/messages/:id` - Obtener mensaje
- `POST /api/messages` - Crear mensaje
- `DELETE /api/messages/:id` - Eliminar mensaje

### Chat
- `POST /api/chat` - Enviar mensaje y obtener respuesta de IA

### Analíticas
- `GET /api/analytics/dashboard` - Estadísticas del dashboard
- `GET /api/analytics/trends` - Tendencias de conversaciones
- `GET /api/analytics/ratings` - Distribución de calificaciones

## 🔐 Autenticación

Todas las rutas excepto `/api/auth/signup` y `/api/auth/login` requieren autenticación.

Incluye el token JWT en el header:
```
Authorization: Bearer <tu-token>
```

## 🔌 WebSockets

El servidor Socket.IO escucha en el mismo puerto que la API HTTP.

Eventos disponibles:
- `join-conversation` - Unirse a una conversación
- `leave-conversation` - Salir de una conversación

## 📝 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuración (DB, env)
│   ├── middleware/      # Middleware (auth, errors)
│   ├── routes/          # Rutas de la API
│   ├── db/             # Schemas de base de datos
│   └── server.ts       # Punto de entrada
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing

```bash
npm test
```

## 📦 Deployment

### Variables de entorno en producción
Asegúrate de configurar todas las variables de entorno necesarias en tu plataforma de deployment.

### Build
```bash
npm run build
```

Los archivos compilados estarán en `dist/`.

## 🤝 Integración con Frontend

El frontend debe configurar la URL del backend en su archivo `.env`:
```env
VITE_API_URL=http://localhost:3001
```

## 📄 Licencia

MIT
