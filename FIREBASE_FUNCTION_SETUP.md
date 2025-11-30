# Configuración de Firebase Function para Envío de Correos

Para que tus clientes puedan enviar correos usando solo su correo y contraseña, necesitas desplegar una Firebase Function.

## 📋 Pasos para Configurar

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Iniciar sesión en Firebase

```bash
firebase login
```

### 3. Inicializar Functions en tu proyecto

```bash
firebase init functions
```

Cuando te pregunte:
- Selecciona tu proyecto Firebase existente
- Usa JavaScript (o TypeScript si prefieres)
- Instala dependencias: **Sí**

### 4. Instalar dependencias necesarias

```bash
cd functions
npm install nodemailer cors
cd ..
```

### 5. Copiar la función

Copia el contenido de `firebase-functions/sendEmail.js` a `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

exports.sendEmail = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { config, email } = req.body;

      if (!config || !email || !config.email || !config.password || !config.smtpServer) {
        return res.status(400).json({ 
          error: 'Datos incompletos' 
        });
      }

      const transporter = nodemailer.createTransport({
        host: config.smtpServer,
        port: config.smtpPort || 587,
        secure: config.smtpPort === 465,
        auth: {
          user: config.email,
          pass: config.password
        }
      });

      const mailOptions = {
        from: config.email,
        to: email.to,
        subject: email.subject,
        html: email.body,
        ...(email.cc && { cc: email.cc }),
        ...(email.bcc && { bcc: email.bcc })
      };

      const info = await transporter.sendMail(mailOptions);

      return res.status(200).json({ 
        success: true, 
        messageId: info.messageId
      });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ 
        error: error.message 
      });
    }
  });
});
```

### 6. Desplegar la función

```bash
firebase deploy --only functions
```

### 7. Actualizar la URL en el código

Después de desplegar, copia la URL de la función (algo como `https://us-central1-tu-proyecto.cloudfunctions.net/sendEmail`) y actualízala en `src/utils/emailUtils.js` en la función `sendSMTPEmail`.

## ✅ Listo

Ahora tus clientes pueden:
1. Ir a "Correo" > "Configuración"
2. Seleccionar Gmail o Outlook
3. Ingresar su correo y contraseña (o contraseña de aplicación si tienen 2FA)
4. Guardar y empezar a enviar correos

## 🔒 Seguridad

- Las contraseñas se envían de forma segura al backend
- La función valida los datos antes de enviar
- Los errores no exponen información sensible

## 💰 Costos

Firebase Functions tiene un plan gratuito generoso:
- 2 millones de invocaciones/mes gratis
- Después: $0.40 por millón de invocaciones

Para la mayoría de aplicaciones pequeñas/medianas, esto es suficiente.

