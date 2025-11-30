# 🔐 Variables de Entorno Necesarias

## Variables de Firebase (OBLIGATORIAS)

Estas son las variables que necesitas configurar en tu plataforma de hosting:

```
VITE_FIREBASE_API_KEY=AIzaSyAlQCzvqYRwaRcuJu1LelE2fAfak6dNjDA
VITE_FIREBASE_AUTH_DOMAIN=cubic-9dfb1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cubic-9dfb1
VITE_FIREBASE_STORAGE_BUCKET=cubic-9dfb1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=678007643078
VITE_FIREBASE_APP_ID=1:678007643078:web:3b4d11c097f35d7356f0c7
```

## Variables de Meta API (OPCIONALES)

Solo necesitas estas si usas la integración con Facebook/Instagram:

```
VITE_META_APP_ID=tu_meta_app_id
VITE_META_APP_SECRET=tu_meta_app_secret
VITE_META_REDIRECT_URI=https://tu-dominio.com/api/marketing/callback
VITE_API_URL=https://tu-backend-url.com/api
```

## 📍 Dónde Configurarlas

### Vercel
1. Ve a tu proyecto en vercel.com
2. Settings → Environment Variables
3. Agrega cada variable
4. Selecciona: Production, Preview, Development
5. Guarda y redespliega

### Netlify
1. Ve a tu sitio en app.netlify.com
2. Site settings → Environment variables
3. Agrega cada variable
4. Guarda y redespliega

### Firebase (GitHub Actions)
1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Agrega cada variable como secreto
4. El workflow las usará automáticamente

## ⚠️ Importante

- Todas las variables deben empezar con `VITE_` para que Vite las incluya en el build
- Nunca subas archivos `.env` a GitHub (ya están en .gitignore)
- Configura las variables ANTES del primer despliegue

