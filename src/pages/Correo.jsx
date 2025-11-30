import { useState, useEffect } from 'react'
import { 
  Mail, 
  Inbox, 
  Send, 
  Archive, 
  Trash2, 
  Search, 
  Filter, 
  Plus, 
  Star, 
  StarOff,
  Paperclip,
  Reply,
  ReplyAll,
  Forward,
  MoreVertical,
  User,
  Clock,
  Tag,
  Settings,
  FileText,
  Send as SendIcon,
  CheckCircle,
  AlertCircle,
  Zap,
  X
} from 'lucide-react'
import { formatDate, formatDateTime, getNetworkTime } from '../utils/dateUtils'
import { useNavigate } from 'react-router-dom'
import { getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { Settings as SettingsIcon } from 'lucide-react'

const Correo = () => {
  const navigate = useNavigate()
  const [activeFolder, setActiveFolder] = useState('inbox')
  const [emails, setEmails] = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showAutomationModal, setShowAutomationModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailConfig, setEmailConfig] = useState(null)
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Estado para el nuevo correo
  const [newEmail, setNewEmail] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    template: '',
    attachments: []
  })

  // Plantillas de correo
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Bienvenida Cliente', subject: 'Bienvenido a nuestra empresa', body: 'Estimado/a {nombre},\n\nLe damos la bienvenida...' },
    { id: 2, name: 'Seguimiento Venta', subject: 'Seguimiento de su compra', body: 'Hola {nombre},\n\nGracias por su compra...' },
    { id: 3, name: 'Recordatorio Pago', subject: 'Recordatorio de pago pendiente', body: 'Estimado/a {nombre},\n\nLe recordamos que tiene un pago pendiente...' }
  ])

  // Automatizaciones
  const [automations, setAutomations] = useState([
    { id: 1, name: 'Respuesta automática', trigger: 'Nuevo correo recibido', action: 'Enviar plantilla de bienvenida', active: true },
    { id: 2, name: 'Asignación por palabras clave', trigger: 'Correo contiene "venta"', action: 'Asignar a equipo de ventas', active: true },
    { id: 3, name: 'Recordatorio seguimiento', trigger: 'Sin respuesta en 48h', action: 'Crear tarea de seguimiento', active: false }
  ])

  // Cargar configuración de correo
  useEffect(() => {
    const loadEmailConfig = async () => {
      try {
        const configRef = collection(db, 'emailConfig')
        const q = query(configRef, where('userId', '==', 'current-user'))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const config = querySnapshot.docs[0].data()
          
          // Verificar si el token OAuth ha expirado
          let tokenValido = true
          if (config.oauthExpiresAt) {
            const expiresAt = new Date(config.oauthExpiresAt)
            if (expiresAt < new Date()) {
              tokenValido = false
              console.warn('Token OAuth expirado, se requiere reautenticación')
            }
          }
          
          // Verificar que la configuración esté completa
          const configCompleta = 
            (config.tipo === 'gmail' && config.useOAuth && config.oauthToken && tokenValido) ||
            (config.tipo === 'outlook' && config.useOAuth && config.oauthToken && tokenValido) ||
            (config.tipo === 'imap' && config.smtpServer && config.email)
          
          if (configCompleta) {
            setEmailConfig(config)
            setIsConfigured(true)
          } else {
            // Configuración incompleta o token expirado
            setEmailConfig(config)
            setIsConfigured(false)
            console.warn('Configuración de correo incompleta o token expirado')
          }
        } else {
          setIsConfigured(false)
        }
      } catch (error) {
        console.error('Error al cargar configuración de correo:', error)
        setIsConfigured(false)
      }
    }
    loadEmailConfig()
  }, [])

  // Cargar correos reales si está configurado
  useEffect(() => {
    const loadEmails = async () => {
      if (!isConfigured) {
        // Mostrar correos de ejemplo si no está configurado
        setEmails([
          {
            id: 1,
            from: 'cliente@ejemplo.com',
            fromName: 'Juan Pérez',
            to: 'ventas@cubic.com',
            subject: 'Consulta sobre producto',
            body: 'Hola, me interesa conocer más sobre sus productos...',
            date: new Date(),
            read: false,
            starred: false,
            folder: 'inbox',
            attachments: [],
            tags: ['ventas']
          },
          {
            id: 2,
            from: 'proveedor@ejemplo.com',
            fromName: 'María García',
            to: 'compras@cubic.com',
            subject: 'Cotización actualizada',
            body: 'Adjunto encontrará nuestra cotización actualizada...',
            date: new Date(Date.now() - 3600000),
            read: true,
            starred: true,
            folder: 'inbox',
            attachments: ['cotizacion.pdf'],
            tags: ['compras']
          },
          {
            id: 3,
            from: 'soporte@ejemplo.com',
            fromName: 'Carlos López',
            to: 'soporte@cubic.com',
            subject: 'Solicitud de soporte técnico',
            body: 'Necesito ayuda con la configuración del sistema...',
            date: new Date(Date.now() - 7200000),
            read: false,
            starred: false,
            folder: 'inbox',
            attachments: [],
            tags: ['soporte']
          }
        ])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        let emailsData = []
        
        if (emailConfig.tipo === 'gmail' && emailConfig.useOAuth && emailConfig.oauthToken) {
          const { getGmailMessages } = await import('../utils/emailUtils')
          emailsData = await getGmailMessages(emailConfig.oauthToken, 50)
        } else if (emailConfig.tipo === 'outlook' && emailConfig.useOAuth && emailConfig.oauthToken) {
          const { getOutlookMessages } = await import('../utils/emailUtils')
          emailsData = await getOutlookMessages(emailConfig.oauthToken, 50)
        } else if (emailConfig.tipo === 'imap') {
          // Para IMAP, necesitarías un backend
          // Por ahora mostrar mensaje
          alert('La sincronización IMAP requiere configuración del servidor. Use Gmail o Outlook OAuth para funcionalidad completa.')
          setLoading(false)
          return
        }
        
        setEmails(emailsData)
      } catch (error) {
        console.error('Error al cargar correos:', error)
        alert('Error al cargar correos: ' + (error.message || 'Verifique su configuración y vuelva a autenticar.'))
      } finally {
        setLoading(false)
      }
    }
    loadEmails()
  }, [isConfigured, emailConfig])

  const folders = [
    { id: 'inbox', label: 'Bandeja de Entrada', icon: Inbox, count: emails.filter(e => e.folder === 'inbox').length },
    { id: 'sent', label: 'Enviados', icon: Send, count: emails.filter(e => e.folder === 'sent').length },
    { id: 'archived', label: 'Archivados', icon: Archive, count: emails.filter(e => e.folder === 'archived').length },
    { id: 'trash', label: 'Papelera', icon: Trash2, count: emails.filter(e => e.folder === 'trash').length }
  ]

  const filteredEmails = emails.filter(email => {
    if (email.folder !== activeFolder) return false
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        email.subject.toLowerCase().includes(searchLower) ||
        email.body.toLowerCase().includes(searchLower) ||
        email.fromName.toLowerCase().includes(searchLower) ||
        email.from.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const handleSendEmail = async () => {
    if (!newEmail.to || !newEmail.subject) {
      alert('Por favor complete los campos requeridos (Para y Asunto)')
      return
    }

    if (!isConfigured || !emailConfig) {
      const respuesta = window.confirm(
        '⚠️ No hay configuración de correo activa.\n\n' +
        '¿Deseas ir a la página de configuración para conectar tu cuenta?'
      )
      if (respuesta) {
        navigate('/correo/configuracion')
      }
      return
    }
    
    // Verificar si el token ha expirado
    if (emailConfig.oauthExpiresAt) {
      const expiresAt = new Date(emailConfig.oauthExpiresAt)
      if (expiresAt < new Date()) {
        const respuesta = window.confirm(
          '⚠️ Tu sesión de correo ha expirado.\n\n' +
          'Necesitas reconectar tu cuenta para poder enviar correos.\n\n' +
          '¿Deseas ir a la página de configuración para reconectar?'
        )
        if (respuesta) {
          navigate('/correo/configuracion')
        }
        return
      }
    }
    
    setLoading(true)
    try {
      let result
      
      // Verificar configuración completa antes de enviar
      if (emailConfig.tipo === 'gmail' && emailConfig.useOAuth && emailConfig.oauthToken) {
        // Usar OAuth si está configurado
        const { sendGmailMessage } = await import('../utils/emailUtils')
        result = await sendGmailMessage(emailConfig.oauthToken, newEmail)
      } else if (emailConfig.tipo === 'outlook' && emailConfig.useOAuth && emailConfig.oauthToken) {
        // Usar OAuth si está configurado
        const { sendOutlookMessage } = await import('../utils/emailUtils')
        result = await sendOutlookMessage(emailConfig.oauthToken, newEmail)
      } else if ((emailConfig.tipo === 'gmail' || emailConfig.tipo === 'outlook' || emailConfig.tipo === 'imap') && 
                 emailConfig.email && emailConfig.password && emailConfig.smtpServer) {
        // Usar SMTP con contraseña (método simple)
        const { sendSMTPEmail } = await import('../utils/emailUtils')
        result = await sendSMTPEmail(emailConfig, newEmail)
      } else {
        throw new Error(
          'Configuración de correo incompleta.\n\n' +
          'Por favor ve a Configuración y completa:\n' +
          '- Correo electrónico\n' +
          '- Contraseña (o contraseña de aplicación si tienes 2FA)\n\n' +
          'O usa OAuth para una conexión más segura.'
        )
      }
      
      alert('✅ Correo enviado exitosamente')
      setShowComposeModal(false)
      setNewEmail({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        template: '',
        attachments: []
      })
      
      // Recargar correos después de enviar
      if (isConfigured && emailConfig) {
        const loadEmails = async () => {
          try {
            let emailsData = []
            if (emailConfig.tipo === 'gmail' && emailConfig.useOAuth && emailConfig.oauthToken) {
              const { getGmailMessages } = await import('../utils/emailUtils')
              emailsData = await getGmailMessages(emailConfig.oauthToken, 50)
            } else if (emailConfig.tipo === 'outlook' && emailConfig.useOAuth && emailConfig.oauthToken) {
              const { getOutlookMessages } = await import('../utils/emailUtils')
              emailsData = await getOutlookMessages(emailConfig.oauthToken, 50)
            }
            setEmails(emailsData)
          } catch (error) {
            console.error('Error al recargar correos:', error)
          }
        }
        loadEmails()
      }
    } catch (error) {
      console.error('Error al enviar correo:', error)
      const errorMessage = error.message || 'Error desconocido. Verifique su configuración.'
      
      // Si el error es de autenticación o configuración, ofrecer reconectar
      if (errorMessage.includes('Token') || errorMessage.includes('OAuth') || 
          errorMessage.includes('reconecta') || errorMessage.includes('incompleta') ||
          errorMessage.includes('Configuración')) {
        const respuesta = window.confirm(
          `❌ ${errorMessage}\n\n` +
          '¿Deseas ir a la página de configuración para reconectar tu cuenta?'
        )
        if (respuesta) {
          navigate('/correo/configuracion')
        }
      } else {
        alert('❌ Error al enviar correo: ' + errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTemplate = (template) => {
    setNewEmail({
      ...newEmail,
      subject: template.subject,
      body: template.body,
      template: template.name
    })
    setShowTemplateModal(false)
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50">
      {/* Sidebar de Carpetas */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowComposeModal(true)}
            className="w-full bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            Nuevo Correo
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {folders.map(folder => {
            const Icon = folder.icon
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition-colors ${
                  activeFolder === folder.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{folder.label}</span>
                </div>
                {folder.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeFolder === folder.id
                      ? 'bg-primary-200 text-primary-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {folder.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FileText size={18} />
            <span>Plantillas</span>
          </button>
          <button
            onClick={() => setShowAutomationModal(true)}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Zap size={18} />
            <span>Automatizaciones</span>
          </button>
          <button 
            onClick={() => navigate('/correo/configuracion')}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <SettingsIcon size={18} />
            <span>Configuración</span>
          </button>
        </div>
      </div>

      {/* Lista de Correos */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Barra de búsqueda y filtros */}
        <div className="p-4 border-b border-gray-200">
          {!isConfigured && (
            <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-yellow-600" size={18} />
                  <p className="text-sm text-yellow-800">
                    No hay cuenta de correo configurada. 
                  </p>
                </div>
                <button
                  onClick={() => navigate('/correo/configuracion')}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                >
                  Configurar ahora
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar correos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Lista de correos */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando correos...</p>
              </div>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Mail size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay correos en esta carpeta</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEmails.map(email => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedEmail?.id === email.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                  } ${!email.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Toggle starred
                        }}
                        className="text-gray-400 hover:text-yellow-500"
                      >
                        {email.starred ? <Star size={18} className="fill-yellow-500 text-yellow-500" /> : <StarOff size={18} />}
                      </button>
                      <div className={`w-2 h-2 rounded-full ${email.read ? 'bg-gray-300' : 'bg-primary-600'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${!email.read ? 'font-semibold' : ''}`}>
                            {email.fromName}
                          </span>
                          {email.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(email.date)}
                        </span>
                      </div>
                      <p className={`text-sm ${!email.read ? 'font-medium' : 'text-gray-600'} truncate`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {email.body}
                      </p>
                      {email.attachments.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Paperclip size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {email.attachments.length} adjunto(s)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel de Vista de Correo */}
      {selectedEmail && (
        <div className="w-2/3 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{selectedEmail.subject}</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Reply size={18} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ReplyAll size={18} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Forward size={18} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">De:</span>
                <span className="text-gray-900">{selectedEmail.fromName} &lt;{selectedEmail.from}&gt;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Para:</span>
                <span className="text-gray-900">{selectedEmail.to}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Fecha:</span>
                <span className="text-gray-900">{formatDateTime(selectedEmail.date)}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedEmail.body}</p>
            </div>
            {selectedEmail.attachments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Adjuntos</h3>
                <div className="space-y-2">
                  {selectedEmail.attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Paperclip size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{file}</span>
                      <button className="ml-auto text-primary-600 hover:text-primary-700 text-sm font-medium">
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Nuevo Correo */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Correo</h2>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Para *</label>
                <input
                  type="email"
                  value={newEmail.to}
                  onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
                <input
                  type="email"
                  value={newEmail.cc}
                  onChange={(e) => setNewEmail({ ...newEmail, cc: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto *</label>
                <input
                  type="text"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Asunto del correo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea
                  value={newEmail.body}
                  onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FileText size={18} />
                  <span>Usar Plantilla</span>
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowComposeModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <SendIcon size={18} />
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Plantillas */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Plantillas de Correo</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{template.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Automatizaciones */}
      {showAutomationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Automatizaciones de Correo</h2>
              <button
                onClick={() => setShowAutomationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {automations.map(automation => (
                  <div key={automation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          automation.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {automation.active ? 'Activa' : 'Inactiva'}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Settings size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Trigger:</span>
                        <span className="text-gray-900 ml-2">{automation.trigger}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Acción:</span>
                        <span className="text-gray-900 ml-2">{automation.action}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Correo

