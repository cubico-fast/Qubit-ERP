import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Facebook,
  Instagram,
  CheckCircle,
  XCircle,
  Loader,
  ExternalLink,
  AlertCircle,
  Key,
  Link as LinkIcon
} from 'lucide-react'
import {
  iniciarAutenticacionMeta,
  obtenerPaginasFacebook,
  obtenerCuentaInstagram,
  guardarConfiguracionMeta,
  obtenerConfiguracionMeta,
  intercambiarCodigoPorToken
} from '../utils/metaApi'

const ConfiguracionMarketing = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState(null)
  const [paginasFacebook, setPaginasFacebook] = useState([])
  const [paginaSeleccionada, setPaginaSeleccionada] = useState(null)
  const [cuentaInstagram, setCuentaInstagram] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Cargar configuración existente
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const configData = await obtenerConfiguracionMeta()
        if (configData) {
          setConfig(configData)
          if (configData.paginaId) {
            setPaginaSeleccionada(configData.paginaId)
          }
          if (configData.instagramAccountId) {
            setCuentaInstagram({
              id: configData.instagramAccountId,
              username: configData.instagramUsername
            })
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error)
      }
    }
    cargarConfiguracion()
  }, [])

  // Verificar si hay código o token en la URL (callback de OAuth)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const token = urlParams.get('token')
    const platform = urlParams.get('platform') || urlParams.get('state') || localStorage.getItem('meta_auth_state') || 'facebook'
    const errorParam = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    if (errorParam) {
      setError(`Error de autorización: ${errorDescription || errorParam}`)
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname)
      localStorage.removeItem('meta_auth_state')
      return
    }

    // Si hay código, intercambiarlo por token
    if (code) {
      procesarCodigo(code, platform)
    } else if (token && platform) {
      // Si ya hay token (del backend), procesarlo directamente
      procesarToken(token, platform)
    }
  }, [])

  const procesarCodigo = async (code, platform) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Intercambiar código por token
      const accessToken = await intercambiarCodigoPorToken(code)
      
      // Procesar el token
      await procesarToken(accessToken, platform)
    } catch (error) {
      console.error('Error al procesar código:', error)
      setError(`Error al procesar autorización: ${error.message}. Nota: El intercambio de código por token normalmente requiere un App Secret en el backend por seguridad.`)
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname)
      localStorage.removeItem('meta_auth_state')
    } finally {
      setLoading(false)
    }
  }

  const procesarToken = async (token, platform) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Obtener páginas de Facebook
      const paginas = await obtenerPaginasFacebook(token)

      if (paginas.length === 0) {
        throw new Error('No se encontraron páginas de Facebook vinculadas a tu cuenta')
      }

      setPaginasFacebook(paginas)

      // Guardar configuración temporal
      const configTemp = {
        userAccessToken: token,
        platform: platform,
        paginas: paginas,
        connectedAt: new Date().toISOString()
      }

      setConfig(configTemp)

      // Si solo hay una página, seleccionarla automáticamente
      if (paginas.length === 1) {
        await seleccionarPagina(paginas[0])
      }

      setSuccess('✅ Autenticación exitosa. Selecciona una página para continuar.')
      
      // Limpiar URL y localStorage
      window.history.replaceState({}, document.title, window.location.pathname)
      localStorage.removeItem('meta_auth_state')
    } catch (error) {
      console.error('Error al procesar token:', error)
      setError(`Error al procesar autorización: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const conectarFacebook = () => {
    setError(null)
    setSuccess(null)
    iniciarAutenticacionMeta('facebook')
  }

  const conectarInstagram = () => {
    setError(null)
    setSuccess(null)
    iniciarAutenticacionMeta('instagram')
  }

  const seleccionarPagina = async (pagina) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      setPaginaSeleccionada(pagina.id)

      // Intentar obtener cuenta de Instagram vinculada
      let instagramAccount = null
      try {
        instagramAccount = await obtenerCuentaInstagram(pagina.id, pagina.access_token)
        if (instagramAccount) {
          setCuentaInstagram(instagramAccount)
        }
      } catch (igError) {
        console.warn('No se pudo obtener cuenta de Instagram:', igError)
        // No es crítico, continuar sin Instagram
      }

      // Guardar configuración completa
      const configCompleta = {
        ...config,
        paginaId: pagina.id,
        paginaNombre: pagina.name,
        paginaAccessToken: pagina.access_token,
        instagramAccountId: instagramAccount?.id || null,
        instagramUsername: instagramAccount?.username || null,
        updatedAt: new Date().toISOString()
      }

      await guardarConfiguracionMeta(configCompleta)
      setConfig(configCompleta)

      setSuccess('✅ Configuración guardada exitosamente.')
    } catch (error) {
      console.error('Error al seleccionar página:', error)
      setError(`Error al seleccionar página: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const desconectar = async () => {
    if (window.confirm('¿Estás seguro de que deseas desconectar las cuentas de Meta?')) {
      try {
        // Limpiar configuración
        await guardarConfiguracionMeta({})
        setConfig(null)
        setPaginasFacebook([])
        setPaginaSeleccionada(null)
        setCuentaInstagram(null)
        setSuccess('✅ Cuentas desconectadas exitosamente.')
      } catch (error) {
        console.error('Error al desconectar:', error)
        setError('Error al desconectar cuentas')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="text-primary-600" size={32} />
            Configuración de Marketing
          </h1>
          <p className="text-gray-600 mt-1">Conecta tus cuentas de redes sociales para ver métricas reales</p>
        </div>
        <button
          onClick={() => navigate('/marketing')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Volver a Marketing
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg flex items-start gap-3">
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Éxito</p>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-2">Antes de comenzar:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Crea una app en <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">Facebook for Developers</a></li>
              <li>Agrega los productos "Instagram Graph API" y "Facebook Login"</li>
              <li>Configura la URL de redirección: <code className="bg-blue-100 px-1 rounded">{window.location.origin}{window.location.pathname.includes('/CUBIC-CRM') ? '/CUBIC-CRM' : ''}/marketing/callback</code></li>
              <li>Agrega las variables de entorno <code className="bg-blue-100 px-1 rounded">VITE_META_APP_ID</code> y <code className="bg-blue-100 px-1 rounded">VITE_META_APP_SECRET</code></li>
              <li>Asegúrate de que tu cuenta de Instagram sea Business o Creator y esté vinculada a una página de Facebook</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Estado de conexión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facebook */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Facebook className="text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Facebook</h3>
            </div>
            {config?.paginaId ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle size={18} />
                Conectado
              </span>
            ) : (
              <span className="flex items-center gap-2 text-gray-400">
                <XCircle size={18} />
                No conectado
              </span>
            )}
          </div>

          {config?.paginaId ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Página conectada:</p>
                <p className="font-semibold text-gray-900">{config.paginaNombre}</p>
              </div>
              <button
                onClick={desconectar}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Conecta tu cuenta de Facebook para ver métricas de tu página.
              </p>
              <button
                onClick={conectarFacebook}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Conectando...
                  </>
                ) : (
                  <>
                    <LinkIcon size={18} />
                    Conectar Facebook
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Instagram */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Instagram className="text-pink-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Instagram</h3>
            </div>
            {cuentaInstagram ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle size={18} />
                Conectado
              </span>
            ) : (
              <span className="flex items-center gap-2 text-gray-400">
                <XCircle size={18} />
                No conectado
              </span>
            )}
          </div>

          {cuentaInstagram ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Cuenta conectada:</p>
                <p className="font-semibold text-gray-900">@{cuentaInstagram.username || cuentaInstagram.id}</p>
              </div>
              <button
                onClick={desconectar}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Conecta tu cuenta de Instagram Business para ver métricas.
              </p>
              {config?.userAccessToken && paginasFacebook.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Selecciona una página de Facebook vinculada a Instagram:</p>
                  {paginasFacebook.map((pagina) => (
                    <button
                      key={pagina.id}
                      onClick={() => seleccionarPagina(pagina)}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm disabled:opacity-50"
                    >
                      {loading ? 'Conectando...' : `Conectar Instagram (${pagina.name})`}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={conectarInstagram}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <LinkIcon size={18} />
                      Conectar Instagram
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selección de página si hay múltiples */}
      {config?.userAccessToken && paginasFacebook.length > 1 && !config?.paginaId && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecciona una página de Facebook</h3>
          <div className="space-y-2">
            {paginasFacebook.map((pagina) => (
              <button
                key={pagina.id}
                onClick={() => seleccionarPagina(pagina)}
                disabled={loading || paginaSeleccionada === pagina.id}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                  paginaSeleccionada === pagina.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{pagina.name}</p>
                    <p className="text-sm text-gray-500">{pagina.category || 'Sin categoría'}</p>
                  </div>
                  {paginaSeleccionada === pagina.id && (
                    <CheckCircle className="text-primary-600" size={20} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Información de tokens (solo desarrollo) */}
      {import.meta.env.DEV && config?.userAccessToken && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <Key className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-yellow-900 mb-2">Información de desarrollo</p>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>Token de usuario: {config.userAccessToken.substring(0, 20)}...</p>
              {config.paginaAccessToken && (
                <p>Token de página: {config.paginaAccessToken.substring(0, 20)}...</p>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfiguracionMarketing

