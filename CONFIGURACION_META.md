# 🔧 Configuración de Meta/Facebook para Marketing

## 📋 Pasos para Configurar

### 1. Crear una App en Facebook for Developers

1. Ve a [Facebook for Developers](https://developers.facebook.com)
2. Crea una nueva aplicación o selecciona una existente
3. Agrega los productos:
   - **Instagram Graph API**
   - **Facebook Login**

### 2. Configurar Dominios y OAuth Redirect URI

1. En tu app de Facebook, ve a **Settings → Basic**
2. **Agregar Dominio de la App:**
   - En la sección **"App Domains"** (Dominios de la app), agrega:
     ```
     cubico-fast.github.io
     ```
   - ⚠️ **IMPORTANTE**: Agrega solo el dominio base (`cubico-fast.github.io`), sin `https://` ni rutas
3. **Agregar URL de Redirección:**
   - Desplázate hacia abajo hasta **"Valid OAuth Redirect URIs"** (URI de redirección OAuth válidos)
   - Haz clic en **"Add URI"** o el botón **"+"**
   - Agrega la URL completa:
     ```
     https://cubico-fast.github.io/CUBIC-CRM/marketing/callback
     ```
   - Haz clic en **"Save Changes"** (Guardar cambios)

### 3. Obtener tu App ID

1. En **Settings → Basic** de tu app
2. Copia el **App ID** (número largo)

### 4. Configurar Secret en GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/cubico-fast/CUBIC-CRM`
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret**
4. Nombre: `VITE_META_APP_ID`
5. Valor: Pega **SOLO el número** del App ID de Facebook (ejemplo: `2954507758068155`)
   - ⚠️ **IMPORTANTE**: NO incluyas comillas, NO incluyas objetos JSON, solo el número
   - Si tu App ID es `2954507758068155`, escribe exactamente: `2954507758068155`
6. Haz clic en **Add secret**

### 5. Redesplegar

1. Ve a **Actions** en tu repositorio
2. Selecciona el workflow **Deploy to GitHub Pages**
3. Haz clic en **Run workflow** → **Run workflow**
4. Espera a que termine el despliegue (2-3 minutos)

### 6. Verificar

1. Ve a tu sitio: `https://cubico-fast.github.io/CUBIC-CRM/marketing/configuracion`
2. Haz clic en **Conectar Facebook** o **Conectar Instagram**
3. Debería redirigirte a Facebook para autorizar

## ⚠️ Notas Importantes

- **App Secret**: El App Secret NO debe estar en el frontend por seguridad. Si necesitas intercambiar códigos por tokens de larga duración, necesitarás un backend (Vercel Functions, Netlify Functions, etc.)

- **Permisos**: Asegúrate de que tu cuenta de Instagram sea **Business** o **Creator** y esté vinculada a una página de Facebook.

- **Scopes**: La aplicación solicita los siguientes permisos:
  - `pages_show_list`: Ver páginas de Facebook
  - `pages_read_engagement`: Leer métricas de páginas
  - `instagram_basic`: Acceso básico a Instagram
  - `instagram_manage_insights`: Ver métricas de Instagram

## 🐛 Solución de Problemas

### Error: "VITE_META_APP_ID no está configurado"
- Verifica que hayas agregado el secret en GitHub
- Verifica que el nombre del secret sea exactamente: `VITE_META_APP_ID`
- Redespliega después de agregar el secret

### Error: "Identificador de la app no válido" / "Invalid app identifier"
- **Causa**: El App ID está configurado incorrectamente (probablemente como objeto JSON en lugar de solo el número)
- **Solución**:
  1. Ve a GitHub → Settings → Secrets → Actions
  2. Edita el secret `VITE_META_APP_ID`
  3. Asegúrate de que el valor sea **SOLO el número** (ejemplo: `2954507758068155`)
  4. NO incluyas comillas, NO incluyas objetos JSON como `{"id": "2954507758068155"}`
  5. Redespliega después de corregir

### Error: "No se puede cargar la URL" / "El dominio de esta URL no está incluido en los dominios de la app"
- **Causa**: El dominio no está agregado en "App Domains" de Facebook
- **Solución**:
  1. Ve a tu app en Facebook for Developers
  2. Settings → Basic
  3. En "App Domains" (Dominios de la app), agrega: `cubico-fast.github.io`
  4. Guarda los cambios
  5. Espera unos minutos para que los cambios se propaguen

### Error: "Invalid redirect URI"
- Verifica que la URL de redirección en Facebook sea exactamente: `https://cubico-fast.github.io/CUBIC-CRM/marketing/callback`
- No debe tener una barra final `/` al final
- Verifica que también hayas agregado el dominio en "App Domains"

### Error al intercambiar código por token
- Esto es normal si no tienes un backend configurado
- El App Secret no puede estar en el frontend por seguridad
- Considera usar Vercel Functions o Netlify Functions para manejar el intercambio de forma segura

