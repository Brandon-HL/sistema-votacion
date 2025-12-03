# Guía de Migración: De Supabase a MySQL + Node.js

Esta guía te ayudará a migrar tu aplicación de Supabase a MySQL con Node.js como backend.

## Cambios Principales

### 1. Backend
- ✅ Backend REST API creado con Express
- ✅ Base de datos MySQL con schema equivalente
- ✅ Autenticación JWT (reemplaza Supabase Auth)
- ✅ Todos los endpoints implementados

### 2. Frontend
- ✅ Cliente API creado (`src/integrations/api/client.ts`)
- ✅ Hook `useAuth` actualizado para usar el nuevo API
- ⚠️ Falta actualizar componentes que usan Supabase directamente

## Pasos de Migración

### Paso 1: Configurar MySQL

1. Instala MySQL en tu sistema
2. Crea una base de datos:
```sql
CREATE DATABASE sistema_votacion;
```

3. Ejecuta el schema SQL:
```bash
cd backend
npm run migrate
```

O ejecuta manualmente `backend/src/database/schema.sql`

### Paso 2: Configurar el Backend

1. Ve a la carpeta `backend`:
```bash
cd backend
```

2. Instala dependencias:
```bash
npm install
```

3. Crea archivo `.env`:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=sistema_votacion
DB_PORT=3306
JWT_SECRET=tu_secreto_jwt_muy_seguro_cambiar_en_produccion
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:8080
```

4. Inicia el servidor:
```bash
npm run dev
```

### Paso 3: Actualizar el Frontend

1. Actualiza las variables de entorno en el frontend:

Crea/actualiza `.env` en la raíz del proyecto frontend:
```env
VITE_API_URL=http://localhost:3000/api
```

2. Actualiza los componentes que aún usan Supabase:

Necesitas reemplazar las llamadas directas a Supabase en:
- `src/pages/VoterDashboard.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/pages/SupervisorDashboard.tsx`
- `src/pages/VotePage.tsx`
- `src/pages/Auth.tsx`

**Ejemplo de migración:**

**Antes (Supabase):**
```typescript
const { data } = await supabase
  .from("polls")
  .select("*")
  .eq("is_active", true);
```

**Después (API REST):**
```typescript
const polls = await apiClient.getPolls();
```

### Paso 4: Migrar Datos (Opcional)

Si tienes datos en Supabase que quieres migrar:

1. Exporta datos de Supabase:
```sql
-- Desde Supabase SQL Editor
SELECT * FROM profiles;
SELECT * FROM polls;
SELECT * FROM candidates;
SELECT * FROM votes;
```

2. Importa a MySQL:
- Usa herramientas como MySQL Workbench o phpMyAdmin
- O crea scripts de migración personalizados

### Paso 5: Eliminar Dependencias de Supabase

Una vez que todo funcione:

1. Desinstala Supabase del frontend:
```bash
npm uninstall @supabase/supabase-js
```

2. Elimina archivos relacionados:
- `src/integrations/supabase/` (puedes eliminar esta carpeta)

3. Actualiza `package.json` removiendo referencias a Supabase

## Diferencias Importantes

### Autenticación

**Supabase:**
- Autenticación automática con email/password
- Sesiones persistentes automáticas
- Realtime subscriptions

**Nuevo Backend:**
- Autenticación JWT manual
- Token almacenado en localStorage
- Sin realtime (se puede agregar con WebSockets si es necesario)

### Base de Datos

**Supabase (PostgreSQL):**
- UUID nativo
- Row Level Security (RLS)
- Triggers automáticos

**MySQL:**
- UUID como VARCHAR(36)
- Seguridad a nivel de aplicación (middlewares)
- Triggers disponibles pero no implementados

### Queries

**Supabase:**
```typescript
const { data } = await supabase
  .from("polls")
  .select("*, profiles(full_name)")
  .eq("is_active", true);
```

**API REST:**
```typescript
const polls = await apiClient.getPolls();
// O con fetch:
const response = await fetch('/api/polls', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Funcionalidades que Necesitan Actualización

### Realtime (SupervisorDashboard)

El dashboard del supervisor usa realtime de Supabase para actualizar conteos de votos. Necesitas:

1. Opción 1: Polling (más simple)
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchVoteCounts(pollId);
  }, 5000); // Cada 5 segundos
  
  return () => clearInterval(interval);
}, [pollId]);
```

2. Opción 2: WebSockets (más eficiente)
- Implementar Socket.io en el backend
- Conectar desde el frontend

## Próximos Pasos

1. Actualizar todos los componentes del frontend
2. Agregar WebSockets para realtime (opcional)
3. Implementar paginación en listas grandes
4. Agregar tests unitarios e integración
5. Configurar CORS correctamente para producción

## Solución de Problemas

### Error de conexión a MySQL
- Verifica que MySQL esté corriendo
- Verifica credenciales en `.env`
- Verifica que la base de datos exista

### Error 401 (No autorizado)
- Verifica que el token JWT esté presente
- Verifica que el token no haya expirado
- Verifica `JWT_SECRET` en el backend

### Error CORS
- Verifica `FRONTEND_URL` en `.env` del backend
- Asegúrate que coincida con la URL del frontend

