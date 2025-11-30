import { useState, useEffect } from 'react'
import { Mail, CheckCircle, AlertCircle, Settings, Key, User, Server, Save, X, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { getDocs, collection, query, where, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../config/firebase'

const ConfiguracionCorreo = () => {
  const [config, setConfig] = useState({
    email: '',
    tipo: 'gmail', // gmail, outlook, imap
    password: '',
    imapServer: '',
    imapPort: 993,
    smtpServer: '',
    smtpPort: 587,
    useOAuth: false, // Cambiar a false por defecto para usar contraseña
    oauthToken: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [configExists, setConfigExists] = useState(false)

  // Cargar configuración existente
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true)
        const configRef = collection(db, 'emailConfig')
        const q = query(configRef, where('userId', '==', 'current-user')) // En producción usar auth.currentUser.uid
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const configData = querySnapshot.docs[0].data()
          setConfig({
            email: configData.email || '',
            tipo: configData.tipo || 'gmail',
            password: configData.password || '', // Cargar contraseña para SMTP
            imapServer: configData.imapServer || '',
            imapPort: configData.imapPort || 993,
            smtpServer: configData.smtpServer || '',
            smtpPort: configData.smtpPort || 587,
            useOAuth: configData.useOAuth || false,
            oauthToken: configData.oauthToken || '' // Cargar token si existe
          })
          setConfigExists(true)
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTestConnection = async () => {
    setLoading(true)
    setTestResult(null)
    
    try {
      if (config.tipo === 'gmail' && config.useOAuth) {
        const { authenticateGmail, getGmailMessages } = await import('../utils/emailUtils')
        const accessToken = await authenticateGmail()
        await getGmailMessages(accessToken, 1) // Probar obteniendo 1 correo
        setTestResult({
          success: true,
          message: 'Conexión exitosa con Gmail. Se pueden recibir y enviar correos.'
        })
      } else if (config.tipo === 'outlook' && config.useOAuth) {
        const { authenticateOutlook, getOutlookMessages } = await import('../utils/emailUtils')
        const accessToken = await authenticateOutlook()
        await getOutlookMessages(accessToken, 1)
        setTestResult({
          success: true,
          message: 'Conexión exitosa con Outlook. Se pueden recibir y enviar correos.'
        })
      } else {
        // Para IMAP/SMTP, verificar que los campos estén completos
        if (!config.imapServer || !config.smtpServer || !config.password) {
          throw new Error('Complete todos los campos requeridos')
        }
        setTestResult({
          success: true,
          message: 'Configuración guardada. La conexión se probará al sincronizar correos.'
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error al conectar: ' + (error.message || 'Verifique sus credenciales')
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config.email) {
      alert('Por favor ingrese su correo electrónico')
      return
    }

    // Validar que tenga contraseña si no usa OAuth
    if (!config.useOAuth && !config.password) {
      alert('Por favor ingrese su contraseña o contraseña de aplicación')
      return
    }

    if (config.tipo === 'imap' && (!config.imapServer || !config.smtpServer)) {
      alert('Por favor complete los servidores IMAP y SMTP')
      return
    }

    setSaving(true)
    try {
      const configData = {
        email: config.email,
        tipo: config.tipo,
        imapServer: config.imapServer,
        imapPort: config.imapPort,
        smtpServer: config.smtpServer,
        smtpPort: config.smtpPort,
        useOAuth: config.useOAuth,
        userId: 'current-user', // En producción usar auth.currentUser.uid
        updatedAt: new Date().toISOString()
      }

      // Guardar contraseña si no usa OAuth (necesaria para SMTP)
      if (!config.useOAuth && config.password) {
        configData.password = config.password
      }
      
      // Guardar token OAuth si existe
      if (config.useOAuth && config.oauthToken) {
        configData.oauthToken = config.oauthToken
        configData.oauthProvider = config.tipo
        configData.oauthExpiresAt = new Date(Date.now() + 3600000).toISOString()
      }

      if (configExists) {
        const configRef = collection(db, 'emailConfig')
        const q = query(configRef, where('userId', '==', 'current-user'))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const docRef = doc(db, 'emailConfig', querySnapshot.docs[0].id)
          await updateDoc(docRef, configData)
        }
      } else {
        await addDoc(collection(db, 'emailConfig'), {
          ...configData,
          createdAt: new Date().toISOString()
        })
        setConfigExists(true)
      }

      alert('Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error al guardar configuración:', error)
      alert('Error al guardar la configuración: ' + (error.message || 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  const handleGmailOAuth = async () => {
    try {
      setLoading(true)
      
      // Verificar que las credenciales estén configuradas
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        const mensaje = `⚠️ CONFIGURACIÓN REQUERIDA

Para conectar Gmail, necesitas configurar tus credenciales OAuth:

1. Ve a: https://console.cloud.google.com/
2. Crea un proyecto y habilita Gmail API
3. Crea OAuth 2.0 Client ID (tipo: Web application)
4. Agrega http://localhost:3000 en "Authorized JavaScript origins"
5. Copia el Client ID

6. Crea/edita el archivo .env en la raíz del proyecto
7. Agrega: VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
8. Reinicia el servidor (Ctrl+C y luego npm run dev)

¿Deseas abrir Google Cloud Console ahora?`
        
        if (window.confirm(mensaje)) {
          window.open('https://console.cloud.google.com/', '_blank')
        }
        setLoading(false)
        return
      }
      
      const { authenticateGmail } = await import('../utils/emailUtils')
      const accessToken = await authenticateGmail()
      
      // Guardar el token de forma segura (en producción usar Firebase Functions)
      const configRef = collection(db, 'emailConfig')
      const q = query(configRef, where('userId', '==', 'current-user'))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'emailConfig', querySnapshot.docs[0].id)
        await updateDoc(docRef, {
          oauthToken: accessToken,
          oauthProvider: 'gmail',
          oauthExpiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hora
        })
      } else {
        // Si no existe configuración, crear una nueva
        await addDoc(collection(db, 'emailConfig'), {
          email: config.email || '',
          tipo: 'gmail',
          useOAuth: true,
          oauthToken: accessToken,
          oauthProvider: 'gmail',
          oauthExpiresAt: new Date(Date.now() + 3600000).toISOString(),
          userId: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        setConfigExists(true)
      }
      
      setConfig(prev => ({ ...prev, oauthToken: accessToken, email: config.email || '' }))
      alert('✅ Gmail conectado exitosamente. Ya puedes recibir y enviar correos.')
    } catch (error) {
      console.error('Error en OAuth Gmail:', error)
      let errorMessage = 'Error desconocido'
      
      if (error.message?.includes('popup_closed')) {
        errorMessage = 'La ventana de autenticación fue cerrada. Por favor intente nuevamente.'
      } else if (error.message?.includes('access_denied')) {
        errorMessage = 'Acceso denegado. Por favor autorice el acceso a Gmail.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert('Error al conectar con Gmail: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOutlookOAuth = async () => {
    try {
      setLoading(true)
      
      // Verificar que las credenciales estén configuradas
      const clientId = import.meta.env.VITE_OUTLOOK_CLIENT_ID
      if (!clientId) {
        const mensaje = `⚠️ CONFIGURACIÓN REQUERIDA

Para conectar Outlook, necesitas configurar tus credenciales OAuth:

1. Ve a: https://portal.azure.com/
2. Azure Active Directory > App registrations
3. Crea nueva aplicación
4. Agrega redirect URI: http://localhost:3000
5. Agrega permisos: Mail.Read, Mail.Send
6. Copia el Application (client) ID

7. Crea/edita el archivo .env en la raíz del proyecto
8. Agrega: VITE_OUTLOOK_CLIENT_ID=tu_client_id_aqui
9. Reinicia el servidor (Ctrl+C y luego npm run dev)

¿Deseas abrir Azure Portal ahora?`
        
        if (window.confirm(mensaje)) {
          window.open('https://portal.azure.com/', '_blank')
        }
        setLoading(false)
        return
      }
      
      const { authenticateOutlook } = await import('../utils/emailUtils')
      const accessToken = await authenticateOutlook()
      
      // Guardar el token de forma segura
      const configRef = collection(db, 'emailConfig')
      const q = query(configRef, where('userId', '==', 'current-user'))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'emailConfig', querySnapshot.docs[0].id)
        await updateDoc(docRef, {
          oauthToken: accessToken,
          oauthProvider: 'outlook',
          oauthExpiresAt: new Date(Date.now() + 3600000).toISOString()
        })
      } else {
        // Si no existe configuración, crear una nueva
        await addDoc(collection(db, 'emailConfig'), {
          email: config.email || '',
          tipo: 'outlook',
          useOAuth: true,
          oauthToken: accessToken,
          oauthProvider: 'outlook',
          oauthExpiresAt: new Date(Date.now() + 3600000).toISOString(),
          userId: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        setConfigExists(true)
      }
      
      setConfig(prev => ({ ...prev, oauthToken: accessToken, email: config.email || '' }))
      alert('✅ Outlook conectado exitosamente. Ya puedes recibir y enviar correos.')
    } catch (error) {
      console.error('Error en OAuth Outlook:', error)
      let errorMessage = 'Error desconocido'
      
      if (error.message?.includes('popup_closed')) {
        errorMessage = 'La ventana de autenticación fue cerrada. Por favor intente nuevamente.'
      } else if (error.message?.includes('access_denied')) {
        errorMessage = 'Acceso denegado. Por favor autorice el acceso a Outlook.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert('Error al conectar con Outlook: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !configExists) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración de Correo</h1>
        <p className="text-gray-600 mt-1">Conecta tu cuenta de correo electrónico para recibir y enviar correos</p>
      </div>

      {/* Información importante */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="text-blue-600 mt-0.5 mr-3" size={20} />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Configuración Requerida</p>
            <p className="text-sm text-blue-700 mb-2">
              Para usar Gmail o Outlook, necesitas configurar las credenciales OAuth en el archivo <code className="bg-blue-100 px-1 rounded">.env</code>
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>1. Crea/edita el archivo <code className="bg-blue-100 px-1 rounded">.env</code> en la raíz del proyecto</p>
              <p>2. Agrega: <code className="bg-blue-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID=tu_client_id</code></p>
              <p>3. Reinicia el servidor de desarrollo (npm run dev)</p>
              <p className="mt-2">
                <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">
                  Obtener credenciales de Google →
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tipo de correo */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Cuenta</h3>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="tipo"
                  value="gmail"
                  checked={config.tipo === 'gmail'}
                  onChange={(e) => {
                    const nuevoTipo = e.target.value
                    handleInputChange('tipo', nuevoTipo)
                    // Configurar servidores automáticamente según el tipo
                    if (nuevoTipo === 'gmail') {
                      setConfig(prev => ({
                        ...prev,
                        tipo: 'gmail',
                        imapServer: 'imap.gmail.com',
                        imapPort: 993,
                        smtpServer: 'smtp.gmail.com',
                        smtpPort: 587,
                        useOAuth: false
                      }))
                    } else if (nuevoTipo === 'outlook') {
                      setConfig(prev => ({
                        ...prev,
                        tipo: 'outlook',
                        imapServer: 'outlook.office365.com',
                        imapPort: 993,
                        smtpServer: 'smtp.office365.com',
                        smtpPort: 587,
                        useOAuth: false
                      }))
                    }
                  }}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Gmail</div>
                  <div className="text-sm text-gray-600">Solo ingresa tu correo y contraseña</div>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="tipo"
                  value="outlook"
                  checked={config.tipo === 'outlook'}
                  onChange={(e) => {
                    const nuevoTipo = e.target.value
                    handleInputChange('tipo', nuevoTipo)
                    if (nuevoTipo === 'outlook') {
                      setConfig(prev => ({
                        ...prev,
                        tipo: 'outlook',
                        imapServer: 'outlook.office365.com',
                        imapPort: 993,
                        smtpServer: 'smtp.office365.com',
                        smtpPort: 587,
                        useOAuth: false
                      }))
                    }
                  }}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Outlook / Office 365</div>
                  <div className="text-sm text-gray-600">Solo ingresa tu correo y contraseña</div>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="tipo"
                  value="imap"
                  checked={config.tipo === 'imap'}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Otro proveedor (IMAP/SMTP)</div>
                  <div className="text-sm text-gray-600">Yahoo, iCloud, etc.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Configuración Simplificada - Solo Correo y Contraseña */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Correo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="tu@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={config.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={
                      (config.tipo === 'gmail' || config.tipo === 'outlook') 
                        ? "Contraseña de aplicación (si tienes 2FA activado)"
                        : "Tu contraseña"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {/* Información sobre contraseña de aplicación */}
                {(config.tipo === 'gmail' || config.tipo === 'outlook') && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 mb-2">
                      <strong>¿Tienes verificación en 2 pasos activada?</strong>
                    </p>
                    <p className="text-xs text-blue-700 mb-2">
                      Si tu cuenta tiene 2FA activado, necesitas usar una <strong>Contraseña de aplicación</strong> en lugar de tu contraseña normal.
                    </p>
                    {config.tipo === 'gmail' && (
                      <a 
                        href="https://myaccount.google.com/apppasswords" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                      >
                        Generar contraseña de aplicación para Gmail
                        <ExternalLink size={12} />
                      </a>
                    )}
                    {config.tipo === 'outlook' && (
                      <a 
                        href="https://account.microsoft.com/security" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                      >
                        Generar contraseña de aplicación para Outlook
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Opción avanzada: OAuth (solo si el desarrollador lo configuró) */}
              {(import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_OUTLOOK_CLIENT_ID) && (
                <div className="pt-3 border-t border-gray-200">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-700 font-medium mb-2">
                      Opciones avanzadas (OAuth)
                    </summary>
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.useOAuth}
                          onChange={(e) => handleInputChange('useOAuth', e.target.checked)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Usar autenticación OAuth (más seguro)</span>
                      </label>
                      
                      {config.useOAuth && (
                        <div className="space-y-2">
                          {config.tipo === 'gmail' && import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                            <button
                              onClick={handleGmailOAuth}
                              disabled={loading}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              <Mail size={18} />
                              {loading ? 'Conectando...' : 'Conectar con Gmail OAuth'}
                            </button>
                          )}
                          {config.tipo === 'outlook' && import.meta.env.VITE_OUTLOOK_CLIENT_ID && (
                            <button
                              onClick={handleOutlookOAuth}
                              disabled={loading}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              <Mail size={18} />
                              {loading ? 'Conectando...' : 'Conectar con Outlook OAuth'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Configuración avanzada solo para otros proveedores */}
              {config.tipo === 'imap' && (
                <>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Configuración de servidores:</strong> Consulta con tu proveedor de correo los servidores y puertos correctos.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Servidor IMAP *
                      </label>
                      <input
                        type="text"
                        value={config.imapServer}
                        onChange={(e) => handleInputChange('imapServer', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="imap.ejemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Puerto IMAP
                      </label>
                      <input
                        type="number"
                        value={config.imapPort}
                        onChange={(e) => handleInputChange('imapPort', parseInt(e.target.value) || 993)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="993"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Servidor SMTP *
                      </label>
                      <input
                        type="text"
                        value={config.smtpServer}
                        onChange={(e) => handleInputChange('smtpServer', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="smtp.ejemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Puerto SMTP
                      </label>
                      <input
                        type="number"
                        value={config.smtpPort}
                        onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value) || 587)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="587"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Estado de conexión */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Conexión</h3>
            {configExists ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span className="font-medium">Configuración guardada</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Correo: {config.email}</p>
                  <p>Tipo: {config.tipo.toUpperCase()}</p>
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Probando...' : 'Probar Conexión'}
                </button>
                {testResult && (
                  <div className={`p-3 rounded-lg ${
                    testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <div className="flex items-start gap-2">
                      {testResult.success ? (
                        <CheckCircle size={18} className="mt-0.5" />
                      ) : (
                        <AlertCircle size={18} className="mt-0.5" />
                      )}
                      <p className="text-sm">{testResult.message}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="text-gray-400 mx-auto mb-2" size={32} />
                <p className="text-sm text-gray-600">No hay configuración guardada</p>
              </div>
            )}
          </div>

          {/* Información de ayuda */}
          <div className="card bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ayuda y Configuración</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900 mb-1">Gmail OAuth:</p>
                <p className="mb-2">Usa autenticación OAuth para acceso seguro sin compartir tu contraseña.</p>
                <a 
                  href="https://console.cloud.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs"
                >
                  Configurar en Google Cloud Console
                  <ExternalLink size={14} />
                </a>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Outlook OAuth:</p>
                <p className="mb-2">Autenticación OAuth para Microsoft 365 y Outlook.</p>
                <a 
                  href="https://portal.azure.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs"
                >
                  Configurar en Azure Portal
                  <ExternalLink size={14} />
                </a>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Contraseña de Aplicación:</p>
                <p className="text-xs text-gray-600 mb-2">
                  Solo necesaria si usas IMAP/SMTP y tienes verificación en 2 pasos activada.
                  <strong className="text-gray-900"> Con OAuth NO la necesitas.</strong>
                </p>
                <details className="text-xs">
                  <summary className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium mb-1">
                    ¿Qué es y cuándo la necesito?
                  </summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-gray-700 space-y-1">
                    <p>Es una contraseña especial de 16 caracteres que generas cuando:</p>
                    <ul className="list-disc list-inside ml-2 space-y-0.5">
                      <li>Usas IMAP/SMTP (no OAuth)</li>
                      <li>Tienes verificación en 2 pasos activada</li>
                    </ul>
                    <p className="mt-1"><strong>NO la necesitas con OAuth</strong> (más seguro y recomendado)</p>
                  </div>
                </details>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-medium text-gray-900">Gmail:</p>
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    Generar contraseña de aplicación
                    <ExternalLink size={12} />
                  </a>
                  <p className="text-gray-600">(Requiere verificación en 2 pasos activada)</p>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-medium text-gray-900">Outlook:</p>
                  <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    Generar contraseña de aplicación
                    <ExternalLink size={12} />
                  </a>
                  <p className="text-gray-600">(Requiere verificación en 2 pasos activada)</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">IMAP/SMTP:</p>
                <p>Consulta con tu proveedor de correo los servidores y puertos correctos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  )
}

export default ConfiguracionCorreo

