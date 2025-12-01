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
            
            // Si hay una página conectada pero no hay Instagram, intentar obtenerlo
            if (!configData.instagramAccountId && configData.paginaAccessToken) {
              try {
                const instagramAccount = await obtenerCuentaInstagram(
                  configData.paginaId,
                  configData.paginaAccessToken
                )
                if (instagramAccount) {
                  setCuentaInstagram(instagramAccount)
                  // Actualizar configuración con Instagram
                  const configActualizada = {
                    ...configData,
                    instagramAccountId: instagramAccount.id,
                    instagramUsername: instagramAccount.username,
                    updatedAt: new Date().toISOString()
                  }
                  await guardarConfiguracionMeta(configActualizada)
                  setConfig(configActualizada)
                }
              } catch (igError) {
                console.warn('No se pudo obtener cuenta de Instagram automáticamente:', igError)
                // No es crítico, continuar sin Instagram
              }
            }
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

  // Verificar si hay código o token en la URL (callback de OAuth - para compatibilidad con método anterior)
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

    // Si hay código (método anterior con redirección), intentar procesarlo
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
      const errorMessage = error.message || 'Error desconocido'
      
      // Mensaje más detallado según el tipo de error
      let mensajeError = `Error al procesar autorización: ${errorMessage}`
      
      if (errorMessage.includes('App Secret') || errorMessage.includes('backend')) {
        mensajeError += '\n\n💡 Solución: Necesitas configurar un backend para intercambiar el código por token de forma segura. Opciones:\n' +
          '1. Usar Vercel Functions o Netlify Functions\n' +
          '2. Usar el JavaScript SDK de Facebook (FB.login)\n' +
          '3. Configurar un servidor Node.js simple'
      } else if (errorMessage.includes('Failed to fetch')) {
        mensajeError += '\n\n💡 Esto puede deberse a restricciones de CORS o que Facebook requiere un backend para el intercambio de tokens.'
      }
      
      setError(mensajeError)
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

    console.log('🚀 Iniciando procesamiento de token...', { platform, tokenLength: token?.length })

    try {
      // Verificar el token primero
      if (!token) {
        throw new Error('No se recibió un token válido')
      }

      console.log('📝 Token recibido, longitud:', token.length, 'Primeros caracteres:', token.substring(0, 20) + '...')

      // Obtener páginas de Facebook
      let paginas = []
      try {
        console.log('🔍 Llamando a obtenerPaginasFacebook...')
        
        // PRUEBA DIRECTA: Intentar obtener páginas directamente para ver qué pasa
        console.log('🧪 PRUEBA DIRECTA: Llamando a /me/accounts directamente...')
        const testUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${token}&fields=id,name,category,access_token&limit=100`
        console.log('🧪 URL de prueba:', testUrl.replace(token, 'TOKEN_OCULTO'))
        
        const testResponse = await fetch(testUrl)
        const testData = await testResponse.json()
        console.log('🧪 RESPUESTA DIRECTA DE FACEBOOK:', JSON.stringify(testData, null, 2))
        
        if (testData.error) {
          console.error('❌ ERROR DE FACEBOOK:', testData.error)
          throw new Error(`Error de Facebook: ${testData.error.message} (Código: ${testData.error.code})`)
        }
        
        if (testData.data && testData.data.length > 0) {
          console.log('✅ PRUEBA DIRECTA EXITOSA: Se encontraron', testData.data.length, 'páginas')
          paginas = testData.data
        } else {
          console.warn('⚠️ PRUEBA DIRECTA: Facebook devolvió un array vacío')
          console.warn('⚠️ Esto significa que:')
          console.warn('   1. El token es válido pero no tiene acceso a páginas')
          console.warn('   2. O no tienes páginas asociadas a tu cuenta')
          console.warn('   3. O el token no tiene el permiso pages_show_list')
        }
        
        // Si la prueba directa no funcionó, intentar con la función normal
        if (paginas.length === 0) {
          console.log('🔄 Intentando con función obtenerPaginasFacebook...')
          paginas = await obtenerPaginasFacebook(token)
          console.log('✅ obtenerPaginasFacebook completado, páginas encontradas:', paginas.length)
        }
      } catch (error) {
        console.error('❌ Error al obtener páginas:', error)
        console.error('❌ Detalles del error:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
        // Si el error es específico sobre permisos o páginas, proporcionar mensaje más útil
        if (error.message.includes('permission') || error.message.includes('permiso')) {
          throw new Error('No tienes permisos para ver las páginas. Asegúrate de autorizar el permiso "pages_show_list" cuando te conectes.')
        }
        if (error.message.includes('OAuth')) {
          throw new Error('Error de autenticación. Por favor, desconecta y vuelve a conectar, asegurándote de autorizar todos los permisos.')
        }
        throw new Error(`Error al obtener páginas de Facebook: ${error.message}`)
      }

      if (paginas.length === 0) {
        // Verificar permisos específicamente antes de dar el error
        console.log('🔍 Verificando permisos específicamente...')
        try {
          const permCheck = await fetch(
            `https://graph.facebook.com/v18.0/me/permissions?access_token=${token}`
          )
          const permData = await permCheck.json()
          const permisos = permData.data || []
          const tienePagesShowList = permisos.some(p => p.permission === 'pages_show_list' && p.status === 'granted')
          
          console.log('🔍 Permisos encontrados:', permisos.map(p => `${p.permission}: ${p.status}`))
          console.log('🔍 ¿Tiene pages_show_list?:', tienePagesShowList ? '✅ SÍ' : '❌ NO')
          
          if (!tienePagesShowList) {
            const mensajeError = '❌ El token NO tiene el permiso "pages_show_list" concedido.\n\n' +
              'SOLUCIÓN:\n' +
              '1. Haz clic en "Desconectar" (si está conectado)\n' +
              '2. Haz clic en "Conectar Facebook" de nuevo\n' +
              '3. Cuando aparezca el popup de Facebook, asegúrate de:\n' +
              '   - Autorizar TODOS los permisos\n' +
              '   - Especialmente el permiso "pages_show_list"\n' +
              '   - Si ves "Editar configuración", haz clic y autoriza todos los permisos\n' +
              '4. Si ya autorizaste antes, puede que necesites revocar permisos y volver a autorizar\n\n' +
              'Para revocar permisos: Ve a https://www.facebook.com/settings?tab=business_tools y elimina la app, luego vuelve a conectar.'
            throw new Error(mensajeError)
          }
        } catch (permError) {
          console.error('Error al verificar permisos:', permError)
        }
        
        // Si tiene el permiso pero aún así no hay páginas
        const mensajeError = 'No se encontraron páginas de Facebook vinculadas a tu cuenta.\n\n' +
          'Posibles causas:\n' +
          '1. No tienes páginas de Facebook creadas\n' +
          '2. No eres administrador o editor de ninguna página\n' +
          '3. Las páginas no están asociadas a tu cuenta personal de Facebook\n\n' +
          'SOLUCIÓN:\n' +
          '1. Ve a https://www.facebook.com/pages y verifica que tengas páginas donde seas administrador\n' +
          '2. Si tienes páginas, asegúrate de que estén asociadas a tu cuenta personal de Facebook\n' +
          '3. Verifica que tengas el rol de "Administrador" o "Editor" en las páginas'
        throw new Error(mensajeError)
      }

      console.log(`📋 Páginas encontradas: ${paginas.length}`, paginas.map(p => p.name))

      // Si solo hay una página, mostrar advertencia si el usuario espera ver más
      if (paginas.length === 1) {
        console.warn('⚠️ Solo se encontró 1 página. Si esperas ver más páginas, verifica que:')
        console.warn('1. Todas las páginas estén asociadas a tu cuenta de Facebook')
        console.warn('2. Tengas permisos de administrador en todas las páginas')
        console.warn('3. El token tenga el permiso pages_show_list')
      }

      // Verificar qué páginas tienen Instagram vinculado
      const paginasConInfo = await Promise.all(
        paginas.map(async (pagina) => {
          let tieneInstagram = false
          let instagramAccount = null
          try {
            instagramAccount = await obtenerCuentaInstagram(pagina.id, pagina.access_token)
            tieneInstagram = !!instagramAccount
            if (instagramAccount) {
              console.log(`✅ Página "${pagina.name}" tiene Instagram vinculado: @${instagramAccount.username}`)
            }
          } catch (e) {
            console.log(`ℹ️ Página "${pagina.name}" no tiene Instagram vinculado`)
          }
          return { ...pagina, tieneInstagram, instagramAccount }
        })
      )

      setPaginasFacebook(paginasConInfo)

      // Guardar configuración temporal con información de Instagram
      const configTemp = {
        userAccessToken: token,
        platform: platform,
        paginas: paginasConInfo,
        connectedAt: new Date().toISOString()
      }

      setConfig(configTemp)

      // Si solo hay una página, seleccionarla automáticamente
      if (paginasConInfo.length === 1) {
        const pagina = paginasConInfo[0]
        await seleccionarPagina(pagina)
        if (!pagina.tieneInstagram) {
          setSuccess(`✅ Página "${pagina.name}" conectada. ${paginas.length === 1 ? 'Si tienes otra página con Instagram vinculado, asegúrate de que esté asociada a tu cuenta de Facebook y que tengas permisos de administrador.' : ''}`)
        }
      } else {
        // Si hay múltiples páginas, buscar la que tiene Instagram vinculado
        const paginaConInstagram = paginasConInfo.find(p => p.tieneInstagram)
        
        // Si encontramos una página con Instagram, seleccionarla automáticamente
        if (paginaConInstagram) {
          await seleccionarPagina(paginaConInstagram)
          setSuccess(`✅ Página "${paginaConInstagram.name}" con Instagram encontrada y conectada automáticamente.`)
        } else {
          setSuccess('✅ Autenticación exitosa. Selecciona una página para continuar. Si tienes Instagram vinculado, selecciona la página que está conectada a tu cuenta de Instagram Business.')
        }
      }
      
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

  const conectarFacebook = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      console.log('🔵 Iniciando conexión de Facebook...')
      // Usar el SDK de Facebook para obtener el token directamente
      const accessToken = await iniciarAutenticacionMeta('facebook')
      console.log('✅ Token obtenido de iniciarAutenticacionMeta, longitud:', accessToken?.length)
      
      // Procesar el token obtenido
      await procesarToken(accessToken, 'facebook')
    } catch (error) {
      console.error('❌ Error al conectar Facebook:', error)
      console.error('❌ Stack trace:', error.stack)
      setError(`Error al conectar Facebook: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const conectarInstagram = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Usar el SDK de Facebook para obtener el token directamente
      const accessToken = await iniciarAutenticacionMeta('instagram')
      
      // Procesar el token obtenido
      await procesarToken(accessToken, 'instagram')
    } catch (error) {
      console.error('Error al conectar Instagram:', error)
      setError(`Error al conectar Instagram: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
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
              <li>Agrega el dominio en "App Domains": <code className="bg-blue-100 px-1 rounded">cubico-fast.github.io</code></li>
              <li>En "Facebook Login" → "Settings", agrega la URL de redirección: <code className="bg-blue-100 px-1 rounded">{window.location.origin}{window.location.pathname.includes('/CUBIC-CRM') ? '/CUBIC-CRM' : ''}/marketing/callback</code></li>
              <li>Agrega la variable de entorno <code className="bg-blue-100 px-1 rounded">VITE_META_APP_ID</code> en GitHub Secrets (solo el número del App ID)</li>
              <li className="text-green-600 font-semibold">✅ Ahora usamos el JavaScript SDK de Facebook, que maneja el OAuth de forma segura sin necesidad de backend.</li>
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
              {config?.paginaId && config?.paginaAccessToken ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-2">
                    Tu página de Facebook "{config.paginaNombre}" ya está conectada. 
                    {config.paginaAccessToken ? ' Intentando obtener Instagram vinculado...' : ' Haz clic para buscar Instagram vinculado.'}
                  </p>
                  <button
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const instagramAccount = await obtenerCuentaInstagram(
                          config.paginaId,
                          config.paginaAccessToken
                        )
                        if (instagramAccount) {
                          setCuentaInstagram(instagramAccount)
                          const configActualizada = {
                            ...config,
                            instagramAccountId: instagramAccount.id,
                            instagramUsername: instagramAccount.username,
                            updatedAt: new Date().toISOString()
                          }
                          await guardarConfiguracionMeta(configActualizada)
                          setConfig(configActualizada)
                          setSuccess('✅ Instagram conectado exitosamente.')
                        } else {
                          setError('No se encontró una cuenta de Instagram Business vinculada a esta página de Facebook. Asegúrate de que tu cuenta de Instagram sea Business o Creator y esté vinculada a la página.')
                        }
                      } catch (error) {
                        console.error('Error al obtener Instagram:', error)
                        setError(`Error al obtener Instagram: ${error.message || 'Asegúrate de que tu cuenta de Instagram sea Business o Creator y esté vinculada a la página de Facebook.'}`)
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        Buscando Instagram...
                      </>
                    ) : (
                      <>
                        <LinkIcon size={18} />
                        Buscar Instagram Vinculado
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    O reconecta con permisos de Instagram:
                  </p>
                  <button
                    onClick={conectarInstagram}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <LinkIcon size={18} />
                        Reconectar con Instagram
                      </>
                    )}
                  </button>
                </div>
              ) : config?.userAccessToken && paginasFacebook.length > 0 ? (
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecciona una página de Facebook</h3>
          <p className="text-sm text-gray-600 mb-4">
            Si tienes Instagram vinculado, selecciona la página que está conectada a tu cuenta de Instagram Business.
          </p>
          <div className="space-y-2">
            {paginasFacebook.map((pagina) => {
              // Verificar si esta página tiene Instagram vinculado
              const tieneInstagram = config?.paginas?.find(p => p.id === pagina.id)?.tieneInstagram
              return (
                <button
                  key={pagina.id}
                  onClick={() => seleccionarPagina(pagina)}
                  disabled={loading || paginaSeleccionada === pagina.id}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                    paginaSeleccionada === pagina.id
                      ? 'border-primary-600 bg-primary-50'
                      : tieneInstagram
                      ? 'border-green-300 bg-green-50 hover:border-green-400'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{pagina.name}</p>
                        {tieneInstagram && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                            <Instagram size={12} />
                            Con Instagram
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{pagina.category || 'Sin categoría'}</p>
                    </div>
                    {paginaSeleccionada === pagina.id && (
                      <CheckCircle className="text-primary-600" size={20} />
                    )}
                  </div>
                </button>
              )
            })}
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

