# 🚀 Guía de Despliegue - Cubic CRM

Esta guía te ayudará a subir tu sitio web a diferentes plataformas de hosting.

## 📋 Preparación

Antes de desplegar, asegúrate de:

1. **Tener todas las variables de entorno configuradas**
   - Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Firebase
   - Si usas Meta API, incluye también esas variables

2. **Construir el proyecto localmente para verificar que funciona**
   ```bash
   npm run build
   ```

3. **Verificar que la carpeta `dist/` se haya generado correctamente**

---

## 🌐 Opción 1: Vercel (Recomendado - Más Fácil)

Vercel es la opción más sencilla y rápida para desplegar aplicaciones React/Vite.

### Pasos:

1. **Instala Vercel CLI** (opcional, también puedes usar la interfaz web)
   ```bash
   npm install -g vercel
   ```

2. **Inicia sesión en Vercel**
   ```bash
   vercel login
   ```

3. **Despliega el proyecto**
   ```bash
   vercel
   ```
   - Sigue las instrucciones en la terminal
   - Vercel detectará automáticamente que es un proyecto Vite

4. **Configura las variables de entorno**
   - Ve a tu proyecto en [vercel.com](https://vercel.com)
   - Ve a Settings → Environment Variables
   - Agrega todas las variables que empiezan con `VITE_`:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - (Opcional) `VITE_META_APP_ID`, `VITE_META_APP_SECRET`, etc.

5. **Redespliega** después de agregar las variables
   - Ve a Deployments → ... → Redeploy

### Alternativa: Despliegue desde GitHub

1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente el proyecto
3. Configura las variables de entorno en la interfaz web
4. ¡Listo! Cada push a main se desplegará automáticamente

**Ventajas:**
- ✅ Muy fácil de usar
- ✅ Despliegue automático desde GitHub
- ✅ SSL gratuito
- ✅ CDN global
- ✅ Dominio personalizado gratuito

---

## 🌐 Opción 2: Netlify

Netlify es otra excelente opción para aplicaciones estáticas.

### Pasos:

1. **Instala Netlify CLI** (opcional)
   ```bash
   npm install -g netlify-cli
   ```

2. **Construye el proyecto**
   ```bash
   npm run build
   ```

3. **Inicia sesión en Netlify**
   ```bash
   netlify login
   ```

4. **Despliega**
   ```bash
   netlify deploy --prod
   ```
   - La primera vez te pedirá autorización
   - Selecciona la carpeta `dist` como directorio de publicación

5. **Configura las variables de entorno**
   - Ve a tu sitio en [app.netlify.com](https://app.netlify.com)
   - Site settings → Environment variables
   - Agrega todas las variables `VITE_*`

### Alternativa: Arrastra y suelta

1. Ve a [app.netlify.com](https://app.netlify.com)
2. Arrastra la carpeta `dist` a la interfaz
3. Configura las variables de entorno en Site settings

**Ventajas:**
- ✅ Interfaz muy intuitiva
- ✅ SSL gratuito
- ✅ CDN global
- ✅ Dominio personalizado gratuito

---

## 🔥 Opción 3: Firebase Hosting

Si ya usas Firebase, esta es una opción natural.

### Pasos:

1. **Instala Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Inicia sesión en Firebase**
   ```bash
   firebase login
   ```

3. **Inicializa Firebase Hosting** (si no lo has hecho)
   ```bash
   firebase init hosting
   ```
   - Selecciona tu proyecto: `cubic-9dfb1`
   - Directorio público: `dist`
   - Configura como SPA: `Yes`
   - No sobrescribas `index.html`: `No`

4. **Construye el proyecto**
   ```bash
   npm run build
   ```

5. **Despliega**
   ```bash
   firebase deploy --only hosting
   ```

6. **Configura las variables de entorno**
   - Las variables de entorno en Vite se deben configurar en el build
   - Crea un archivo `.env.production` con tus variables
   - O usa el archivo `.env` y asegúrate de que esté en `.gitignore`

**Nota:** Firebase Hosting no soporta variables de entorno dinámicas como Vercel/Netlify. Debes usar `.env.production` o configurarlas en el build.

**Ventajas:**
- ✅ Integración perfecta con Firebase
- ✅ SSL gratuito
- ✅ CDN global
- ✅ Dominio personalizado gratuito

---

## 🔧 Configuración de Variables de Entorno

### Para Vercel/Netlify:

Configura las variables en la interfaz web de cada plataforma. Las variables deben empezar con `VITE_` para que Vite las incluya en el build.

### Para Firebase Hosting:

Crea un archivo `.env.production` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

**⚠️ IMPORTANTE:** Nunca subas el archivo `.env` o `.env.production` a GitHub si contiene información sensible. Asegúrate de que estén en `.gitignore`.

---

## 🌍 Despliegue del Backend

Si necesitas desplegar el backend (para Meta API), puedes usar:

1. **Railway** - [railway.app](https://railway.app)
2. **Render** - [render.com](https://render.com)
3. **Heroku** - [heroku.com](https://heroku.com)
4. **Vercel** - También soporta funciones serverless

Para el backend, necesitarás:
- Configurar las variables de entorno del servidor
- Actualizar `VITE_API_URL` en el frontend con la URL del backend desplegado

---

## 📝 Checklist Final

Antes de desplegar, verifica:

- [ ] El proyecto se construye sin errores (`npm run build`)
- [ ] Todas las variables de entorno están configuradas
- [ ] El archivo `.env` está en `.gitignore`
- [ ] Las rutas funcionan correctamente (SPA routing)
- [ ] Firebase está configurado correctamente
- [ ] (Opcional) El backend está desplegado si lo necesitas

---

## 🆘 Solución de Problemas

### Error: Variables de entorno no funcionan
- Asegúrate de que las variables empiecen con `VITE_`
- Redespliega después de agregar variables
- Verifica que las variables estén en el entorno correcto (Production)

### Error: Rutas no funcionan (404)
- Verifica que el archivo de configuración tenga las reglas de rewrite correctas
- En Vercel: `vercel.json` debe tener la ruta `"/*": "/index.html"`
- En Netlify: `netlify.toml` debe tener el redirect configurado
- En Firebase: `firebase.json` debe tener el rewrite configurado

### Error: Firebase no funciona
- Verifica que las credenciales de Firebase sean correctas
- Asegúrate de que Firestore tenga las reglas de seguridad configuradas
- Verifica que el dominio esté autorizado en Firebase Console

---

## 🎉 ¡Listo!

Una vez desplegado, tu sitio estará disponible en:
- **Vercel**: `tu-proyecto.vercel.app`
- **Netlify**: `tu-proyecto.netlify.app`
- **Firebase**: `tu-proyecto.web.app` o `tu-proyecto.firebaseapp.com`

Puedes configurar un dominio personalizado desde la configuración de cada plataforma.

---

¿Necesitas ayuda? Revisa la documentación oficial:
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)

