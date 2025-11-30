# 🚀 Publicar tu Sitio en GitHub Pages

## 📋 Pasos para Activar GitHub Pages

### Paso 1: Habilitar GitHub Pages en tu Repositorio

1. Ve a tu repositorio en GitHub: https://github.com/cubico-fast/CUBIC-CRM
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral, busca **Pages** (páginas)
4. En **Source** (Origen), selecciona:
   - **Branch**: `main`
   - **Folder**: `/ (root)` o `/docs` (si prefieres)
5. Haz clic en **Save** (Guardar)

### Paso 2: Configurar Variables de Entorno (Secrets)

1. En tu repositorio, ve a **Settings** → **Secrets and variables** → **Actions**
2. Haz clic en **New repository secret**
3. Agrega cada una de estas variables:

```
VITE_FIREBASE_API_KEY = AIzaSyAlQCzvqYRwaRcuJu1LelE2fAfak6dNjDA
VITE_FIREBASE_AUTH_DOMAIN = cubic-9dfb1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = cubic-9dfb1
VITE_FIREBASE_STORAGE_BUCKET = cubic-9dfb1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 678007643078
VITE_FIREBASE_APP_ID = 1:678007643078:web:3b4d11c097f35d7356f0c7
```

### Paso 3: Activar el Workflow

1. Ve a la pestaña **Actions** en tu repositorio
2. Deberías ver el workflow "Deploy to GitHub Pages"
3. Si no se ejecuta automáticamente, haz clic en **Run workflow**

### Paso 4: Esperar el Despliegue

1. El workflow tardará 2-3 minutos en completarse
2. Una vez terminado, tu sitio estará disponible en:
   **https://cubico-fast.github.io/CUBIC-CRM/**

## ⚠️ Nota Importante sobre GitHub Pages

GitHub Pages funciona mejor con sitios estáticos simples. Para aplicaciones React con routing, **Vercel o Netlify son mejores opciones** porque:
- ✅ Mejor soporte para SPAs (Single Page Applications)
- ✅ Variables de entorno más fáciles de configurar
- ✅ Despliegue más rápido
- ✅ Mejor rendimiento

## 🌐 Alternativa Recomendada: Vercel

Si prefieres una solución más fácil y profesional:

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno
4. ¡Listo! Tu sitio estará en `tu-proyecto.vercel.app`

Ver la guía completa en: `GUIA_DESPLIEGUE_AUTOMATICO.md`

## 🔗 URLs de tu Sitio

Una vez desplegado, tu sitio estará disponible en:
- **GitHub Pages**: https://cubico-fast.github.io/CUBIC-CRM/
- **Vercel** (si lo configuras): https://cubic-crm.vercel.app
- **Netlify** (si lo configuras): https://cubic-crm.netlify.app


