# 🚀 Guía de Despliegue Automático desde GitHub

Esta guía te ayudará a configurar el despliegue automático para que cada vez que hagas un push a GitHub, tu sitio se actualice automáticamente.

---

## 🌐 Opción 1: Vercel (Recomendado - Más Fácil)

### Paso 1: Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Selecciona **"Continue with GitHub"** para usar tu cuenta de GitHub
4. Autoriza Vercel para acceder a tus repositorios

### Paso 2: Importar tu proyecto

1. Una vez dentro de Vercel, haz clic en **"Add New..."** → **"Project"**
2. Busca tu repositorio: `cubico-fast/CUBIC-CRM`
3. Haz clic en **"Import"**

### Paso 3: Configurar el proyecto

Vercel detectará automáticamente que es un proyecto Vite. La configuración debería ser:

- **Framework Preset**: Vite
- **Root Directory**: `./` (raíz)
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `dist` (automático)
- **Install Command**: `npm install` (automático)

### Paso 4: Configurar Variables de Entorno

**⚠️ MUY IMPORTANTE:** Antes de desplegar, debes agregar todas tus variables de entorno.

1. En la página de configuración del proyecto, ve a la sección **"Environment Variables"**
2. Agrega cada una de estas variables (reemplaza los valores con tus credenciales reales):

```
VITE_FIREBASE_API_KEY = tu_api_key_de_firebase
VITE_FIREBASE_AUTH_DOMAIN = tu_auth_domain
VITE_FIREBASE_PROJECT_ID = tu_project_id
VITE_FIREBASE_STORAGE_BUCKET = tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID = tu_messaging_sender_id
VITE_FIREBASE_APP_ID = tu_app_id
```

**Opcional (si usas Meta API):**
```
VITE_META_APP_ID = tu_meta_app_id
VITE_META_APP_SECRET = tu_meta_app_secret
VITE_META_REDIRECT_URI = https://tu-dominio.vercel.app/api/marketing/callback
VITE_API_URL = https://tu-backend-url.com/api
```

3. Selecciona los entornos: **Production**, **Preview**, y **Development**
4. Haz clic en **"Save"**

### Paso 5: Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que termine el proceso (2-3 minutos)
3. ¡Listo! Tu sitio estará disponible en `tu-proyecto.vercel.app`

### Paso 6: Configurar Dominio Personalizado (Opcional)

1. Ve a **Settings** → **Domains**
2. Ingresa tu dominio (ej: `cubic-crm.com`)
3. Sigue las instrucciones para configurar los DNS

### ✅ Despliegue Automático Activado

A partir de ahora:
- Cada **push a `main`** → Despliegue automático a producción
- Cada **pull request** → Preview automático
- Cada **push a otras ramas** → Preview automático

---

## 🌐 Opción 2: Netlify

### Paso 1: Crear cuenta en Netlify

1. Ve a [netlify.com](https://netlify.com)
2. Haz clic en **"Sign up"**
3. Selecciona **"Sign up with GitHub"**

### Paso 2: Importar proyecto

1. Haz clic en **"Add new site"** → **"Import an existing project"**
2. Selecciona **"Deploy with GitHub"**
3. Autoriza Netlify para acceder a tus repositorios
4. Busca y selecciona: `cubico-fast/CUBIC-CRM`

### Paso 3: Configurar build

Netlify detectará automáticamente la configuración desde `netlify.toml`:

- **Build command**: `npm run build`
- **Publish directory**: `dist`

### Paso 4: Configurar Variables de Entorno

1. Antes de desplegar, ve a **Site settings** → **Environment variables**
2. Agrega todas las variables `VITE_*` (igual que en Vercel)
3. Haz clic en **"Save"**

### Paso 5: Desplegar

1. Haz clic en **"Deploy site"**
2. Espera a que termine
3. Tu sitio estará en `tu-proyecto.netlify.app`

### ✅ Despliegue Automático Activado

- Cada push a `main` → Despliegue automático
- Pull requests → Preview automático

---

## 🔥 Opción 3: Firebase Hosting con GitHub Actions

Para automatizar el despliegue en Firebase Hosting, puedes usar GitHub Actions.

### Paso 1: Obtener token de Firebase

1. Instala Firebase CLI: `npm install -g firebase-tools`
2. Inicia sesión: `firebase login:ci`
3. Copia el token que te muestra

### Paso 2: Agregar secretos a GitHub

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Agrega un nuevo secreto:
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: El token que copiaste

### Paso 3: Crear workflow de GitHub Actions

Ya tienes un archivo `.github/workflows/blank.yml`. Vamos a crear uno para Firebase:

Crea `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: cubic-9dfb1
```

### Paso 4: Agregar todos los secretos

En GitHub → Settings → Secrets, agrega:
- `FIREBASE_TOKEN` (del paso 1)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

---

## 📝 Resumen de Variables de Entorno Necesarias

Independientemente de la plataforma, necesitarás estas variables:

### Firebase (Obligatorias)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Meta API (Opcionales)
- `VITE_META_APP_ID`
- `VITE_META_APP_SECRET`
- `VITE_META_REDIRECT_URI`
- `VITE_API_URL`

---

## 🎯 Recomendación

**Para empezar rápido:** Usa **Vercel**
- Es la más fácil de configurar
- Interfaz muy intuitiva
- Despliegue automático perfecto
- SSL y dominio gratuito

**Si ya usas Firebase mucho:** Usa **Firebase Hosting**
- Integración perfecta con tu proyecto
- Mismo ecosistema

**Si prefieres otra opción:** Usa **Netlify**
- Muy similar a Vercel
- También muy fácil

---

## 🆘 Solución de Problemas

### Error: Variables de entorno no funcionan
- Verifica que todas empiecen con `VITE_`
- Asegúrate de seleccionar los entornos correctos (Production, Preview, Development)
- Redespliega después de agregar variables

### Error: Build falla
- Revisa los logs de build en la plataforma
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `npm run build` funcione localmente

### Error: Rutas no funcionan (404)
- Verifica que los archivos de configuración (`vercel.json`, `netlify.toml`, `firebase.json`) tengan las reglas de rewrite correctas
- Ya están configurados en los archivos que creamos

---

## ✅ Checklist Final

Antes de desplegar, verifica:

- [ ] Tu código está en GitHub
- [ ] Todas las variables de entorno están configuradas en la plataforma
- [ ] El proyecto se construye localmente sin errores (`npm run build`)
- [ ] Has probado el sitio localmente (`npm run preview`)

---

¡Listo! Una vez configurado, cada push a GitHub desplegará automáticamente tu sitio. 🚀

