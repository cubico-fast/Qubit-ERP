/**
 * Utilidades para interactuar con Meta Graph API (Facebook/Instagram)
 * Autenticación OAuth directa desde el frontend
 */

// Función helper para obtener y validar el App ID
const getMetaAppId = () => {
  const appId = import.meta.env.VITE_META_APP_ID
  
  // Debug: mostrar qué valor está recibiendo (solo en desarrollo)
  if (import.meta.env.DEV) {
    console.log('🔍 VITE_META_APP_ID raw:', appId, 'Type:', typeof appId)
  }
  
  // Si es undefined o null, retornar null
  if (!appId) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ VITE_META_APP_ID no está definido')
    }
    return null
  }
  
  // Si es un objeto (JSON stringificado), intentar parsearlo
  if (typeof appId === 'object') {
    try {
      const parsed = typeof appId === 'string' ? JSON.parse(appId) : appId
      // Si tiene una propiedad 'id', usar esa
      if (parsed && parsed.id) {
        return String(parsed.id)
      }
      // Si es un objeto con otros campos, intentar extraer el ID
      return null
    } catch (e) {
      console.error('Error al parsear META_APP_ID:', e)
      return null
    }
  }
  
  // Si es un string, limpiarlo y validarlo
  const cleanId = String(appId).trim()
  
  // Validar que sea un número (App IDs de Facebook son numéricos)
  if (!/^\d+$/.test(cleanId)) {
    console.error('META_APP_ID no es un número válido:', cleanId)
    return null
  }
  
  return cleanId
}

const REDIRECT_URI = `${window.location.origin}${window.location.pathname.includes('/CUBIC-CRM') ? '/CUBIC-CRM' : ''}/marketing/callback`

// Variable para almacenar el estado de inicialización
let fbSDKInitialized = false
let fbSDKInitPromise = null

/**
 * Inicializar el SDK de Facebook
 * @param {string} appId - App ID de Facebook
 * @returns {Promise} Promise que se resuelve cuando el SDK está listo
 */
const inicializarFacebookSDK = (appId) => {
  // Si ya está inicializado, retornar el SDK directamente
  if (fbSDKInitialized && window.FB) {
    return Promise.resolve(window.FB)
  }

  // Si ya hay una inicialización en progreso, retornar esa promesa
  if (fbSDKInitPromise) {
    return fbSDKInitPromise
  }

  // Crear nueva promesa de inicialización
  fbSDKInitPromise = new Promise((resolve, reject) => {
    // Si el SDK ya está cargado pero no inicializado
    if (window.FB && !fbSDKInitialized) {
      try {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        })
        fbSDKInitialized = true
        resolve(window.FB)
        return
      } catch (error) {
        reject(error)
        return
      }
    }

    // Si el SDK ya está disponible
    if (window.FB) {
      try {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        })
        fbSDKInitialized = true
        resolve(window.FB)
        return
      } catch (error) {
        reject(error)
        return
      }
    }

    // Esperar a que el SDK se cargue
    const checkSDK = setInterval(() => {
      if (window.FB) {
        clearInterval(checkSDK)
        try {
          window.FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          })
          fbSDKInitialized = true
          resolve(window.FB)
        } catch (error) {
          reject(error)
        }
      }
    }, 100)

    // Timeout después de 10 segundos
    setTimeout(() => {
      clearInterval(checkSDK)
      if (!fbSDKInitialized) {
        reject(new Error('El SDK de Facebook no se cargó en el tiempo esperado. Asegúrate de que el script del SDK esté incluido en index.html'))
      }
    }, 10000)
  })

  return fbSDKInitPromise
}

/**
 * Iniciar el flujo de autenticación OAuth con Meta usando JavaScript SDK
 * @param {string} platform - 'facebook' o 'instagram'
 * @returns {Promise<string>} Promise que se resuelve con el access token
 */
export const iniciarAutenticacionMeta = async (platform = 'facebook') => {
  const META_APP_ID = getMetaAppId()
  
  if (!META_APP_ID) {
    alert('Error: VITE_META_APP_ID no está configurado o no es válido.\n\n' +
      'Para configurarlo:\n' +
      '1. Ve a tu repositorio en GitHub\n' +
      '2. Settings → Secrets and variables → Actions\n' +
      '3. Agrega un nuevo secret llamado: VITE_META_APP_ID\n' +
      '4. Ingresa SOLO el número del App ID (ejemplo: 2954507758068155)\n' +
      '5. NO incluyas comillas ni objetos JSON\n' +
      '6. Vuelve a ejecutar el workflow de GitHub Actions\n\n' +
      'Obtén tu App ID en: https://developers.facebook.com/apps/')
    throw new Error('VITE_META_APP_ID no está configurado')
  }

  try {
    // Inicializar el SDK de Facebook con el App ID
    const FB = await inicializarFacebookSDK(META_APP_ID)

    // Scopes necesarios para Facebook e Instagram
    // pages_show_list: Ver todas las páginas del usuario
    // pages_read_engagement: Leer métricas de páginas
    // pages_manage_metadata: Gestionar metadatos de páginas
    const scopes = platform === 'instagram' 
      ? 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,pages_manage_metadata'
      : 'pages_show_list,pages_read_engagement,pages_manage_metadata'

    // Usar FB.login() directamente - más simple y confiable
    return new Promise((resolve, reject) => {
      console.log('🔐 Solicitando login de Facebook con permisos:', scopes)
      FB.login((response) => {
        console.log('📥 Respuesta de FB.login:', response)
        if (response.authResponse) {
          // Usuario autorizado, obtener el access token
          const accessToken = response.authResponse.accessToken
          console.log('✅ Login exitoso, token obtenido (longitud:', accessToken.length + ')')
          resolve(accessToken)
        } else {
          // Usuario canceló o hubo un error
          const errorMessage = response.error?.message || 'El usuario canceló la autorización o hubo un error'
          console.error('❌ Error en login:', errorMessage, response.error)
          reject(new Error(errorMessage))
        }
      }, { scope: scopes })
    })
  } catch (error) {
    console.error('Error al inicializar Facebook SDK:', error)
    throw error
  }
}

/**
 * Obtener páginas de Facebook del usuario (directo desde Graph API)
 * Incluye paginación para obtener todas las páginas disponibles
 * @param {string} accessToken - Token de acceso del usuario
 */
export const obtenerPaginasFacebook = async (accessToken) => {
  try {
    // Primero, verificar los permisos del token para debug
    try {
      const debugResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
      )
      if (debugResponse.ok) {
        const debugData = await debugResponse.json()
        console.log('🔍 Permisos del token:', debugData.data?.map(p => `${p.permission} (${p.status})`).join(', ') || 'No se pudieron obtener permisos')
      }
    } catch (e) {
      console.warn('No se pudieron verificar permisos:', e)
    }

    // Obtener información del usuario para debug
    try {
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name`
      )
      if (userResponse.ok) {
        const userData = await userResponse.json()
        console.log('👤 Usuario autenticado:', userData.name, `(ID: ${userData.id})`)
      }
    } catch (e) {
      console.warn('No se pudo obtener información del usuario:', e)
    }

    let allPages = []
    let nextUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,category,access_token,tasks&limit=100`
    
    console.log('🔍 Obteniendo páginas de Facebook desde:', nextUrl.split('?')[0])
    
    // Obtener todas las páginas usando paginación
    let pageCount = 0
    while (nextUrl) {
      pageCount++
      console.log(`📄 Página ${pageCount} de resultados...`)
      
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Error en la respuesta:', error)
        throw new Error(error.error?.message || 'Error al obtener páginas')
      }

      const data = await response.json()
      
      console.log(`📋 Respuesta recibida:`, {
        totalEnEstaPagina: data.data?.length || 0,
        tienePaginacion: !!data.paging?.next,
        datosCompletos: data
      })
      
      if (data.data && data.data.length > 0) {
        allPages = allPages.concat(data.data)
        console.log(`✅ Páginas en esta página:`, data.data.map(p => p.name))
      }
      
      // Verificar si hay más páginas (paginación)
      if (data.paging && data.paging.next) {
        nextUrl = data.paging.next
        console.log('➡️ Hay más páginas, continuando...')
      } else {
        nextUrl = null
        console.log('✅ No hay más páginas')
      }
    }

    console.log(`✅ Total: Se encontraron ${allPages.length} página(s) de Facebook:`, allPages.map(p => `${p.name} (${p.id})`))
    
    if (allPages.length === 0) {
      console.warn('⚠️ No se encontraron páginas. Verifica que:')
      console.warn('1. Tengas al menos una página de Facebook')
      console.warn('2. Seas administrador o editor de la página')
      console.warn('3. El token tenga el permiso pages_show_list')
    }
    
    return allPages
  } catch (error) {
    console.error('❌ Error al obtener páginas de Facebook:', error)
    throw error
  }
}


/**
 * Intercambiar código de autorización por token de acceso
 * NOTA: Esto normalmente requiere App Secret, pero intentaremos con el código directamente
 * @param {string} code - Código de autorización de Facebook
 */
export const intercambiarCodigoPorToken = async (code) => {
  const META_APP_ID = getMetaAppId()
  const REDIRECT_URI = `${window.location.origin}${window.location.pathname.includes('/CUBIC-CRM') ? '/CUBIC-CRM' : ''}/marketing/callback`
  
  if (!META_APP_ID) {
    throw new Error('VITE_META_APP_ID no está configurado o no es válido')
  }

  try {
    // Intentar obtener token de corta duración
    // NOTA: Facebook requiere App Secret para intercambiar código por token de forma segura
    // Sin App Secret, esta petición fallará. Se necesita un backend para esto.
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `code=${code}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Error desconocido' } }))
      const errorMessage = errorData.error?.message || 'Error al intercambiar código por token'
      
      // Si el error indica que se necesita App Secret, proporcionar mensaje más claro
      if (errorMessage.includes('secret') || errorMessage.includes('app_secret') || errorMessage.includes('client_secret')) {
        throw new Error('Se requiere App Secret para intercambiar el código por token. Esto debe hacerse en un backend por seguridad. Por favor, configura un backend (Vercel Functions, Netlify Functions, etc.) o usa el JavaScript SDK de Facebook.')
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error al intercambiar código por token:', error)
    
    // Si es un error de red (CORS, fetch failed), proporcionar mensaje más claro
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('No se pudo conectar con Facebook. Esto puede deberse a que se requiere un backend para intercambiar el código por token de forma segura. El App Secret no puede estar en el frontend.')
    }
    
    throw error
  }
}

/**
 * Obtener cuenta de Instagram vinculada a una página de Facebook (directo desde Graph API)
 * @param {string} pageId - ID de la página de Facebook
 * @param {string} pageAccessToken - Token de acceso de la página
 */
export const obtenerCuentaInstagram = async (pageId, pageAccessToken) => {
  try {
    // Obtener cuenta de Instagram vinculada directamente desde Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,username}&access_token=${pageAccessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener cuenta de Instagram')
    }

    const data = await response.json()
    return data.instagram_business_account || null
  } catch (error) {
    console.error('Error al obtener cuenta de Instagram:', error)
    throw error
  }
}

/**
 * Obtener métricas de Instagram (insights) directamente desde Graph API
 * @param {string} instagramAccountId - ID de la cuenta de Instagram Business
 * @param {string} accessToken - Token de acceso
 * @param {string} metric - Métrica a obtener (impressions, reach, profile_views, etc.)
 * @param {string} period - Período (day, week, days_28)
 */
export const obtenerMetricasInstagram = async (instagramAccountId, accessToken, metric = 'impressions', period = 'day') => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/insights?metric=${metric}&period=${period}&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `Error al obtener métrica ${metric}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error(`Error al obtener métricas de Instagram (${metric}):`, error)
    throw error
  }
}

/**
 * Obtener información básica de la cuenta de Instagram directamente desde Graph API
 * @param {string} instagramAccountId - ID de la cuenta de Instagram Business
 * @param {string} accessToken - Token de acceso
 */
export const obtenerInfoInstagram = async (instagramAccountId, accessToken) => {
  try {
    // Campos disponibles para Instagram Business Account:
    // id, username, name, profile_picture_url, website, biography, followers_count, follows_count, media_count
    // NOTA: account_type no está disponible directamente en IGUser, se obtiene de otra forma
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=id,username,name,profile_picture_url,website,biography,followers_count,follows_count,media_count&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener información de Instagram')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error al obtener información de Instagram:', error)
    throw error
  }
}

/**
 * Obtener métricas de Facebook Page directamente desde Graph API
 * @param {string} pageId - ID de la página de Facebook
 * @param {string} accessToken - Token de acceso
 * @param {string} metric - Métrica a obtener
 * @param {string} period - Período (day, week, days_28)
 */
export const obtenerMetricasFacebook = async (pageId, accessToken, metric = 'page_impressions', period = 'day') => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/insights?metric=${metric}&period=${period}&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `Error al obtener métrica ${metric}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error(`Error al obtener métricas de Facebook (${metric}):`, error)
    throw error
  }
}

/**
 * Obtener información de la página de Facebook directamente desde Graph API
 * @param {string} pageId - ID de la página
 * @param {string} accessToken - Token de acceso
 */
export const obtenerInfoFacebook = async (pageId, accessToken) => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,category,fan_count,followers_count,phone,website&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener información de Facebook')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error al obtener información de Facebook:', error)
    throw error
  }
}

/**
 * Guardar configuración de Meta en Firebase
 * @param {object} config - Configuración a guardar
 */
export const guardarConfiguracionMeta = async (config) => {
  try {
    const { db, collection, doc, setDoc } = await import('firebase/firestore')
    const { db: firestoreDb } = await import('../config/firebase')
    
    await setDoc(doc(firestoreDb, 'marketing_config', 'meta'), {
      ...config,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error al guardar configuración de Meta:', error)
    throw error
  }
}

/**
 * Obtener configuración de Meta desde Firebase
 */
export const obtenerConfiguracionMeta = async () => {
  try {
    const { db, collection, doc, getDoc } = await import('firebase/firestore')
    const { db: firestoreDb } = await import('../config/firebase')
    
    const docRef = doc(firestoreDb, 'marketing_config', 'meta')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data()
    }
    return null
  } catch (error) {
    console.error('Error al obtener configuración de Meta:', error)
    return null
  }
}


