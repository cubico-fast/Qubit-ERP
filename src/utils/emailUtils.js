/**
 * Utilidades para manejo de correo electrónico
 * Integración con Gmail API, Outlook API e IMAP/SMTP
 */

// Gmail API Configuration
const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send'
const GMAIL_DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']

// Outlook/Microsoft Graph API Configuration
const OUTLOOK_SCOPES = 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send'
const OUTLOOK_AUTHORITY = 'https://login.microsoftonline.com/common'

/**
 * Inicializar Gmail API
 */
export const initGmailAPI = () => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      reject(new Error('VITE_GOOGLE_CLIENT_ID no está configurado. Por favor configura tus credenciales en el archivo .env'))
      return
    }

    const initGAPI = () => {
      window.gapi.load('client:auth2', () => {
        window.gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
          clientId: clientId,
          discoveryDocs: GMAIL_DISCOVERY_DOCS,
          scope: GMAIL_SCOPES
        }).then(() => {
          resolve(window.gapi)
        }).catch(reject)
      })
    }

    if (window.gapi && window.gapi.load) {
      initGAPI()
    } else {
      // Cargar el script de Google API
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        initGAPI()
      }
      script.onerror = () => {
        reject(new Error('Error al cargar Google API. Verifica tu conexión a internet.'))
      }
      document.head.appendChild(script)
    }
  })
}

/**
 * Autenticar con Gmail usando OAuth 2.0
 */
export const authenticateGmail = async () => {
  try {
    const gapi = await initGmailAPI()
    const authInstance = gapi.auth2.getAuthInstance()
    
    if (authInstance.isSignedIn.get()) {
      return authInstance.currentUser.get().getAuthResponse(true).access_token
    }
    
    const user = await authInstance.signIn()
    return user.getAuthResponse(true).access_token
  } catch (error) {
    console.error('Error en autenticación Gmail:', error)
    throw error
  }
}

/**
 * Obtener correos de Gmail
 */
export const getGmailMessages = async (accessToken, maxResults = 50) => {
  try {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener mensajes de Gmail')
    }
    
    const data = await response.json()
    const messages = []
    
    for (const message of data.messages || []) {
      const messageDetail = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (messageDetail.ok) {
        const detail = await messageDetail.json()
        const payload = detail.payload
        
        // Extraer información del correo
        const headers = payload.headers || []
        const getHeader = (name) => headers.find(h => h.name === name)?.value || ''
        
        const email = {
          id: detail.id,
          threadId: detail.threadId,
          from: getHeader('From'),
          fromName: getHeader('From').split('<')[0].trim() || getHeader('From'),
          to: getHeader('To'),
          subject: getHeader('Subject'),
          date: new Date(parseInt(detail.internalDate)),
          snippet: detail.snippet,
          body: extractEmailBody(payload),
          read: !detail.labelIds?.includes('UNREAD'),
          starred: detail.labelIds?.includes('STARRED'),
          folder: detail.labelIds?.includes('SENT') ? 'sent' : 'inbox',
          attachments: extractAttachments(payload),
          tags: []
        }
        
        messages.push(email)
      }
    }
    
    return messages
  } catch (error) {
    console.error('Error al obtener correos de Gmail:', error)
    throw error
  }
}

/**
 * Enviar correo usando Gmail API
 */
export const sendGmailMessage = async (accessToken, emailData) => {
  try {
    const { to, cc, bcc, subject, body } = emailData
    
    // Construir el mensaje en formato RFC 2822
    let message = `To: ${to}\r\n`
    if (cc) message += `Cc: ${cc}\r\n`
    if (bcc) message += `Bcc: ${bcc}\r\n`
    message += `Subject: ${subject}\r\n`
    message += `Content-Type: text/html; charset=utf-8\r\n`
    message += `\r\n${body}`
    
    // Codificar en base64url
    const encodedMessage = btoa(message)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al enviar correo')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error al enviar correo con Gmail:', error)
    throw error
  }
}

/**
 * Autenticar con Outlook/Microsoft Graph
 */
export const authenticateOutlook = async () => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_OUTLOOK_CLIENT_ID
    if (!clientId) {
      reject(new Error('VITE_OUTLOOK_CLIENT_ID no está configurado. Por favor configura tus credenciales en el archivo .env'))
      return
    }

    // Usar MSAL (Microsoft Authentication Library)
    // En producción, instalar: npm install @azure/msal-browser
    if (window.msalInstance) {
      window.msalInstance.loginPopup({
        scopes: OUTLOOK_SCOPES.split(' ')
      }).then(response => {
        resolve(response.accessToken)
      }).catch(reject)
    } else {
      // Fallback: abrir ventana de OAuth manual usando Implicit Flow
      const redirectUri = encodeURIComponent(window.location.origin)
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=token&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${encodeURIComponent(OUTLOOK_SCOPES)}&` +
        `response_mode=fragment&` +
        `prompt=consent`
      
      const popup = window.open(authUrl, 'Outlook Auth', 'width=500,height=600,left=100,top=100')
      
      if (!popup) {
        reject(new Error('No se pudo abrir la ventana de autenticación. Verifica que los popups no estén bloqueados.'))
        return
      }

      // Escuchar mensajes del popup
      const messageListener = (event) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'OUTLOOK_OAUTH_SUCCESS') {
          window.removeEventListener('message', messageListener)
          clearTimeout(timeout)
          resolve(event.data.accessToken)
        } else if (event.data.type === 'OUTLOOK_OAUTH_ERROR') {
          window.removeEventListener('message', messageListener)
          clearTimeout(timeout)
          reject(new Error(event.data.error || 'Error en autenticación'))
        }
      }
      
      window.addEventListener('message', messageListener)
      
      // Timeout después de 5 minutos
      const timeout = setTimeout(() => {
        window.removeEventListener('message', messageListener)
        if (popup && !popup.closed) {
          popup.close()
        }
        reject(new Error('Tiempo de espera agotado para la autenticación'))
      }, 300000)
      
      // Verificar si el popup se cierra manualmente
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup)
          clearTimeout(timeout)
          window.removeEventListener('message', messageListener)
          reject(new Error('Ventana de autenticación cerrada'))
        }
      }, 500)
    }
  })
}

/**
 * Obtener correos de Outlook
 */
export const getOutlookMessages = async (accessToken, maxResults = 50) => {
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener mensajes de Outlook')
    }
    
    const data = await response.json()
    
    return data.value.map(msg => ({
      id: msg.id,
      from: msg.from?.emailAddress?.address || '',
      fromName: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || '',
      to: msg.toRecipients?.map(r => r.emailAddress.address).join(', ') || '',
      subject: msg.subject || '',
      date: new Date(msg.receivedDateTime),
      body: msg.body?.content || msg.bodyPreview || '',
      read: msg.isRead,
      starred: msg.flag?.flagStatus === 'flagged',
      folder: msg.parentFolderId || 'inbox',
      attachments: msg.hasAttachments ? [] : [],
      tags: []
    }))
  } catch (error) {
    console.error('Error al obtener correos de Outlook:', error)
    throw error
  }
}

/**
 * Enviar correo usando Outlook API
 */
export const sendOutlookMessage = async (accessToken, emailData) => {
  try {
    const { to, cc, bcc, subject, body } = emailData
    
    const message = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        toRecipients: to.split(',').map(email => ({
          emailAddress: {
            address: email.trim()
          }
        })),
        ...(cc && {
          ccRecipients: cc.split(',').map(email => ({
            emailAddress: {
              address: email.trim()
            }
          }))
        })
      }
    }
    
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al enviar correo')
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error al enviar correo con Outlook:', error)
    throw error
  }
}

/**
 * Enviar correo usando SMTP
 * Nota: En producción, esto debería usar un backend/Firebase Function
 * Por ahora, usamos EmailJS como servicio intermedio
 */
export const sendSMTPEmail = async (config, emailData) => {
  try {
    const { to, cc, bcc, subject, body } = emailData
    
    // Opción 1: Si tienes EmailJS configurado (recomendado para producción)
    // Descomenta y configura EmailJS en https://www.emailjs.com/
    /*
    const emailjs = await import('@emailjs/browser')
    emailjs.default.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '')
    
    const templateParams = {
      to_email: to,
      from_email: config.email,
      subject: subject,
      message: body,
      cc_email: cc || '',
      bcc_email: bcc || ''
    }
    
    const result = await emailjs.default.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
      templateParams
    )
    
    return result
    */
    
    // Opción 2: Llamar a Firebase Function (recomendado)
    // Crea una Cloud Function que maneje SMTP de forma segura
    const response = await fetch('https://us-central1-cubic-9dfb1.cloudfunctions.net/sendEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        config: {
          smtpServer: config.smtpServer,
          smtpPort: config.smtpPort,
          email: config.email,
          password: config.password // Se envía de forma segura al backend
        },
        email: {
          to,
          cc,
          bcc,
          subject,
          body
        }
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Error al enviar correo. Verifica tu configuración SMTP.')
    }
    
    return await response.json()
  } catch (error) {
    // Si no hay Firebase Function, mostrar mensaje útil
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(
        'No se pudo conectar al servidor de correo.\n\n' +
        'Para enviar correos con contraseña, necesitas:\n' +
        '1. Configurar una Firebase Function para SMTP, o\n' +
        '2. Usar OAuth (más seguro y no requiere backend)'
      )
    }
    console.error('Error al enviar correo SMTP:', error)
    throw error
  }
}

/**
 * Funciones auxiliares
 */
const extractEmailBody = (payload) => {
  if (payload.body?.data) {
    return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
  }
  
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
        if (part.body?.data) {
          return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
        }
      }
    }
  }
  
  return ''
}

const extractAttachments = (payload) => {
  const attachments = []
  
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push(part.filename)
      }
    }
  }
  
  return attachments
}

