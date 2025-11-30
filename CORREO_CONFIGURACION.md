# Configuración de Correo Electrónico - Cubic CRM

## 📧 Configuración de Gmail

### Paso 1: Obtener credenciales de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Gmail API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Gmail API" y haz clic en "Enable"
4. Crea credenciales OAuth 2.0:
   - Ve a "APIs & Services" > "Credentials"
   - Haz clic en "Create Credentials" > "OAuth client ID"
   - Selecciona "Web application"
   - Agrega `http://localhost:3000` (o tu dominio) en "Authorized JavaScript origins"
   - Agrega `http://localhost:3000` en "Authorized redirect URIs"
   - Copia el **Client ID**

### Paso 2: Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
VITE_GOOGLE_API_KEY=tu_api_key_aqui (opcional, para algunas funciones)
```

### Paso 3: Usar en la aplicación

1. Ve a "Correo" > "Configuración"
2. Selecciona "Gmail"
3. Marca "Usar autenticación OAuth"
4. Haz clic en "Conectar con Gmail"
5. Autoriza el acceso en la ventana que se abre
6. ¡Listo! Ya puedes recibir y enviar correos

---

## 📧 Configuración de Outlook

### Paso 1: Obtener credenciales de Microsoft

1. Ve a [Azure Portal](https://portal.azure.com/)
2. Ve a "Azure Active Directory" > "App registrations"
3. Haz clic en "New registration"
4. Configura:
   - Name: "Cubic CRM"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `http://localhost:3000` (tipo: Single-page application)
5. Después de crear, copia el **Application (client) ID**
6. Ve a "API permissions" y agrega:
   - `Mail.Read`
   - `Mail.Send`
   - `User.Read`
7. Haz clic en "Grant admin consent"

### Paso 2: Configurar variables de entorno

Agrega a tu archivo `.env`:

```env
VITE_OUTLOOK_CLIENT_ID=tu_client_id_aqui
```

### Paso 3: Usar en la aplicación

1. Ve a "Correo" > "Configuración"
2. Selecciona "Outlook"
3. Marca "Usar autenticación OAuth"
4. Haz clic en "Conectar con Outlook"
5. Autoriza el acceso
6. ¡Listo!

---

## 📧 Configuración IMAP/SMTP Personalizado

Para otros proveedores de correo (Yahoo, iCloud, etc.):

1. Ve a "Correo" > "Configuración"
2. Selecciona "IMAP / SMTP Personalizado"
3. Ingresa:
   - **Servidor IMAP**: (ej: imap.gmail.com)
   - **Puerto IMAP**: (ej: 993)
   - **Servidor SMTP**: (ej: smtp.gmail.com)
   - **Puerto SMTP**: (ej: 587)
   - **Contraseña**: Tu contraseña o contraseña de aplicación

---

## 🔑 ¿Qué es una "Contraseña de Aplicación"?

Una **contraseña de aplicación** (también llamada "App Password" o "Contraseña de app") es una contraseña especial que generas para aplicaciones que acceden a tu cuenta de correo cuando tienes activada la **verificación en dos pasos (2FA)**.

### ¿Cuándo la necesitas?

**Solo necesitas contraseña de aplicación si:**
- ✅ Usas **IMAP/SMTP** (no OAuth)
- ✅ Tienes **verificación en dos pasos activada** en tu cuenta
- ✅ La aplicación no soporta OAuth

**NO la necesitas si:**
- ❌ Usas **OAuth** (Gmail/Outlook con OAuth) - **RECOMENDADO**
- ❌ No tienes verificación en dos pasos activada

### ¿Por qué existe?

Cuando tienes 2FA activado, Google/Microsoft bloquean el acceso con tu contraseña normal por seguridad. La contraseña de aplicación es una contraseña de 16 caracteres que actúa como "llave especial" solo para esa aplicación.

---

## 📧 Cómo obtener Contraseña de Aplicación para Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Ve a **Seguridad** (Security)
3. Asegúrate de tener **Verificación en 2 pasos** activada
4. Busca **"Contraseñas de aplicaciones"** (App passwords)
5. Selecciona la app: "Correo"
6. Selecciona el dispositivo: "Otro (nombre personalizado)"
7. Escribe: "Cubic CRM"
8. Haz clic en **"Generar"**
9. **Copia la contraseña de 16 caracteres** (aparece solo una vez)
10. Úsala en lugar de tu contraseña normal en la configuración IMAP/SMTP

**Ejemplo de contraseña generada:** `abcd efgh ijkl mnop` (sin espacios: `abcdefghijklmnop`)

---

## 📧 Cómo obtener Contraseña de Aplicación para Outlook

1. Ve a tu cuenta de Microsoft: https://account.microsoft.com/security
2. Ve a **Seguridad** (Security)
3. Asegúrate de tener **Verificación en dos pasos** activada
4. Busca **"Contraseñas de aplicaciones"** (App passwords)
5. Haz clic en **"Crear una nueva contraseña de aplicación"**
6. Escribe un nombre: "Cubic CRM"
7. Haz clic en **"Siguiente"**
8. **Copia la contraseña de 16 caracteres** que aparece
9. Úsala en lugar de tu contraseña normal en la configuración IMAP/SMTP

---

## ⚠️ Importante

- **OAuth es más seguro**: No necesitas contraseñas de aplicación si usas OAuth (recomendado)
- **Solo para IMAP/SMTP**: Las contraseñas de aplicación solo se usan cuando configuras IMAP/SMTP manualmente
- **Úsala una vez**: La contraseña se muestra solo una vez, guárdala en un lugar seguro
- **Puedes revocarla**: Si la pierdes, puedes generar una nueva y revocar la anterior

---

## ⚠️ Notas de Seguridad

- Las contraseñas **NO** se almacenan en Firestore
- Los tokens OAuth se guardan temporalmente (expiran en 1 hora)
- En producción, usa Firebase Functions para manejar credenciales de forma segura
- Nunca compartas tus credenciales OAuth

---

## 🔧 Solución de Problemas

### Error: "Access blocked: This app's request is invalid"
- Verifica que las URLs en Google Cloud Console coincidan exactamente con tu dominio
- Asegúrate de que `http://localhost:3000` esté en "Authorized JavaScript origins"

### Error: "redirect_uri_mismatch"
- Verifica que el redirect URI en Azure/Google Console coincida con tu URL actual

### Los correos no se cargan
- Verifica que hayas autorizado los permisos correctos
- Revisa la consola del navegador para ver errores
- Intenta desconectar y volver a conectar

