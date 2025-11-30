# Backend - Cubic CRM Marketing API

Backend para manejar la integración segura con Meta (Facebook/Instagram) Graph API.

## 🚀 Instalación

1. **Instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**
Crea un archivo `.env` en la carpeta `backend` con:
```env
VITE_META_APP_ID=tu_app_id_aqui
VITE_META_APP_SECRET=tu_app_secret_aqui
VITE_META_REDIRECT_URI=http://localhost:3000/api/marketing/callback
FRONTEND_URL=http://localhost:5173
PORT=3000
```

3. **Iniciar el servidor:**
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

## 📡 Endpoints

### Autenticación OAuth

- **GET `/api/marketing/auth/:platform`**
  - Inicia el flujo OAuth con Meta
  - `platform`: `facebook` o `instagram`
  - Redirige a Facebook para autorización

- **GET `/api/marketing/callback`**
  - Callback después de la autorización
  - Intercambia código por token de larga duración
  - Redirige al frontend con el token

### Páginas y Cuentas

- **POST `/api/marketing/pages`**
  - Obtiene las páginas de Facebook del usuario
  - Body: `{ accessToken: string }`

- **POST `/api/marketing/instagram-account`**
  - Obtiene la cuenta de Instagram vinculada a una página
  - Body: `{ pageId: string, pageAccessToken: string }`

### Métricas de Instagram

- **POST `/api/marketing/instagram-info`**
  - Información básica de la cuenta
  - Body: `{ instagramAccountId: string, accessToken: string }`

- **POST `/api/marketing/instagram-metrics`**
  - Métricas de Instagram (insights)
  - Body: `{ instagramAccountId: string, accessToken: string, metric: string, period: string }`

### Métricas de Facebook

- **POST `/api/marketing/facebook-info`**
  - Información básica de la página
  - Body: `{ pageId: string, accessToken: string }`

- **POST `/api/marketing/facebook-metrics`**
  - Métricas de Facebook (insights)
  - Body: `{ pageId: string, accessToken: string, metric: string, period: string }`

## 🔒 Seguridad

- El `APP_SECRET` nunca se expone al frontend
- Todos los intercambios de tokens se hacen en el backend
- Los tokens se envían al frontend solo después de procesarlos

## 📝 Notas

- Asegúrate de configurar la URL de redirección en Facebook Developers
- El token de larga duración tiene validez de 60 días
- En producción, considera usar sesiones en lugar de pasar tokens por URL

