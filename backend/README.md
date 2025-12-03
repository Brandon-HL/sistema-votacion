# Backend - Sistema de Votación Municipal

Backend API REST desarrollado con Node.js, Express y MySQL.

## Requisitos

- Node.js 18 o superior
- MySQL 8.0 o superior
- npm o yarn

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
Crea un archivo `.env` en la raíz del backend basado en `.env.example`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=sistema_votacion
DB_PORT=3306

JWT_SECRET=tu_secreto_jwt_muy_seguro
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:8080
```

3. Crear la base de datos:
```bash
# Ejecutar el script de migración
npm run migrate
```

O ejecutar manualmente el archivo `src/database/schema.sql` en tu cliente MySQL.

## Ejecutar el servidor

### Modo desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000` por defecto.

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuración (base de datos, etc.)
│   ├── controllers/     # Lógica de negocio
│   ├── database/        # Migraciones y schema
│   ├── middleware/      # Middlewares (auth, etc.)
│   ├── routes/          # Definición de rutas
│   ├── utils/           # Utilidades
│   └── server.js        # Punto de entrada
├── package.json
└── README.md
```

## Endpoints de la API

### Autenticación
- `POST /api/auth/signup` - Registro de usuario
- `POST /api/auth/signin` - Inicio de sesión
- `GET /api/auth/profile` - Obtener perfil del usuario autenticado

### Votaciones (Polls)
- `GET /api/polls` - Obtener todas las votaciones
- `GET /api/polls/:id` - Obtener una votación por ID
- `POST /api/polls` - Crear votación (supervisor/admin)
- `PUT /api/polls/:id` - Actualizar votación
- `DELETE /api/polls/:id` - Eliminar votación

### Candidatos
- `GET /api/candidates/poll/:pollId` - Obtener candidatos de una votación
- `POST /api/candidates/poll/:pollId` - Agregar candidato
- `DELETE /api/candidates/:id` - Eliminar candidato

### Votos
- `POST /api/votes` - Registrar un voto
- `GET /api/votes/my-votes` - Obtener votos del usuario autenticado
- `GET /api/votes/counts/:pollId` - Obtener conteo de votos (supervisor/admin)

### Usuarios (Admin only)
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/pending` - Obtener usuarios pendientes
- `PUT /api/users/:userId/status` - Actualizar status de usuario

## Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación. Después de iniciar sesión, incluye el token en el header:

```
Authorization: Bearer <token>
```

## Base de Datos

El schema de MySQL incluye las siguientes tablas:

- `users` - Usuarios del sistema
- `polls` - Votaciones
- `candidates` - Candidatos
- `votes` - Votos registrados

## Usuario Administrador por Defecto

Después de ejecutar las migraciones, puedes crear un usuario administrador manualmente o usar el que viene en el schema (requiere actualizar la contraseña).

Para crear un admin:
```sql
INSERT INTO users (id, dni, full_name, role, status, password_hash) 
VALUES (
  UUID(),
  '00000000',
  'Administrador',
  'admin',
  'active',
  '$2a$10$tu_hash_bcrypt_aqui'
);
```

## Notas de Desarrollo

- Los errores se manejan con try/catch en los controladores
- Las validaciones de permisos se hacen mediante middlewares
- Las contraseñas se hashean con bcrypt
- Los IDs se generan usando UUID v4

