/**
 * Firebase Cloud Function para enviar correos por SMTP
 * 
 * Instalación:
 * 1. npm install -g firebase-tools
 * 2. firebase login
 * 3. firebase init functions
 * 4. npm install nodemailer en la carpeta functions/
 * 5. firebase deploy --only functions
 */

const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

exports.sendEmail = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    // Solo permitir POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { config, email } = req.body;

      // Validar datos
      if (!config || !email || !config.email || !config.password || !config.smtpServer) {
        return res.status(400).json({ 
          error: 'Datos incompletos. Se requiere: config.email, config.password, config.smtpServer, email.to, email.subject' 
        });
      }

      // Crear transporter de nodemailer
      const transporter = nodemailer.createTransport({
        host: config.smtpServer,
        port: config.smtpPort || 587,
        secure: config.smtpPort === 465, // true para 465, false para otros puertos
        auth: {
          user: config.email,
          pass: config.password
        }
      });

      // Configurar opciones del correo
      const mailOptions = {
        from: config.email,
        to: email.to,
        subject: email.subject,
        html: email.body,
        ...(email.cc && { cc: email.cc }),
        ...(email.bcc && { bcc: email.bcc })
      };

      // Enviar correo
      const info = await transporter.sendMail(mailOptions);

      return res.status(200).json({ 
        success: true, 
        messageId: info.messageId,
        message: 'Correo enviado exitosamente'
      });

    } catch (error) {
      console.error('Error al enviar correo:', error);
      return res.status(500).json({ 
        error: 'Error al enviar correo',
        message: error.message 
      });
    }
  });
});

