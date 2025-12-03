# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/aaae171b-2276-4886-8c9c-5c46790a24b7

## Cómo ejecutar el proyecto localmente

### Arquitectura

El proyecto ahora cuenta con:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + MySQL

### Requisitos previos

- **Node.js** (versión 18 o superior) - [Descargar Node.js](https://nodejs.org/)
- **npm** (viene incluido con Node.js)
- **MySQL** 8.0 o superior - [Descargar MySQL](https://dev.mysql.com/downloads/mysql/)

> **Nota**: Este proyecto fue migrado de Supabase a MySQL + Node.js. Si prefieres usar Supabase, consulta el historial de commits o el archivo `MIGRACION.md`.

### Pasos para configurar y ejecutar

#### 1. Clonar el repositorio (si aún no lo tienes)

```bash
git clone <URL_DEL_REPOSITORIO>
cd sistema-votacion
```

#### 2. Instalar las dependencias

```bash
npm install
```

#### 3. Configurar el Backend

1. Ve a la carpeta del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea un archivo `.env` en `backend/`:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_contraseña_mysql
   DB_NAME=sistema_votacion
   DB_PORT=3306
   JWT_SECRET=tu_secreto_jwt_muy_seguro_cambiar_en_produccion
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:8080
   ```

4. Crea la base de datos MySQL:
   ```sql
   CREATE DATABASE sistema_votacion;
   ```

5. Ejecuta las migraciones:
   ```bash
   npm run migrate
   ```

6. Inicia el servidor backend (en una terminal separada):
   ```bash
   npm run dev
   ```

   El backend estará disponible en `http://localhost:3000`

#### 4. Configurar el Frontend

1. Vuelve a la raíz del proyecto:
   ```bash
   cd ..
   ```

2. Crea un archivo `.env` en la raíz con:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. Instala las dependencias del frontend (si aún no lo has hecho):
   ```bash
   npm install
   ```

#### 5. Iniciar el Frontend

En una nueva terminal, desde la raíz del proyecto:

```bash
npm run dev
```

El frontend se iniciará en `http://localhost:8080`

**Importante**: Asegúrate de tener tanto el backend como el frontend corriendo simultáneamente.

### Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo con hot-reload
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter para verificar el código

## Cómo editar el código

Hay varias formas de editar tu aplicación:

**Usar Lovable**

Simplemente visita el [Proyecto Lovable](https://lovable.dev/projects/aaae171b-2276-4886-8c9c-5c46790a24b7) y comienza a hacer cambios.

Los cambios realizados a través de Lovable se confirmarán automáticamente en este repositorio.

**Usar tu IDE preferido**

Si quieres trabajar localmente usando tu propio IDE, puedes clonar este repositorio y hacer push de los cambios. Los cambios enviados también se reflejarán en Lovable.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/aaae171b-2276-4886-8c9c-5c46790a24b7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
