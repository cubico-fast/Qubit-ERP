/**
 * Utilidades para interactuar con Meta Graph API (Facebook/Instagram)
 * Usa el backend para manejar la autenticación OAuth de forma segura
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Iniciar el flujo de autenticación OAuth con Meta
 * Redirige al backend que maneja la autenticación de forma segura
 * @param {string} platform - 'facebook' o 'instagram'
 */
export const iniciarAutenticacionMeta = (platform = 'facebook') => {
  // Guardar el estado en localStorage para verificar después
  localStorage.setItem('meta_auth_state', platform)
  
  // Redirigir al backend que maneja OAuth
  window.location.href = `${API_BASE_URL}/marketing/auth/${platform}`
}

/**
 * Obtener páginas de Facebook del usuario (usando backend)
 * @param {string} accessToken - Token de acceso del usuario
 */
export const obtenerPaginasFacebook = async (accessToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/marketing/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener páginas')
    }

    const data = await response.json()
    return data.pages || []
  } catch (error) {
    console.error('Error al obtener páginas de Facebook:', error)
    throw error
  }
}


/**
 * Obtener cuenta de Instagram vinculada a una página de Facebook (usando backend)
 * @param {string} pageId - ID de la página de Facebook
 * @param {string} pageAccessToken - Token de acceso de la página
 */
export const obtenerCuentaInstagram = async (pageId, pageAccessToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/marketing/instagram-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pageId, pageAccessToken })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener cuenta de Instagram')
    }

    const data = await response.json()
    return data.instagramAccount
  } catch (error) {
    console.error('Error al obtener cuenta de Instagram:', error)
    throw error
  }
}

/**
 * Obtener métricas de Instagram (insights) usando backend
 * @param {string} instagramAccountId - ID de la cuenta de Instagram Business
 * @param {string} accessToken - Token de acceso
 * @param {string} metric - Métrica a obtener (impressions, reach, profile_views, etc.)
 * @param {string} period - Período (day, week, days_28)
 */
export const obtenerMetricasInstagram = async (instagramAccountId, accessToken, metric = 'impressions', period = 'day') => {
  try {
    const response = await fetch(`${API_BASE_URL}/marketing/instagram-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ instagramAccountId, accessToken, metric, period })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Error al obtener métrica ${metric}`)
    }

    const data = await response.json()
    return data.metrics || []
  } catch (error) {
    console.error(`Error al obtener métricas de Instagram (${metric}):`, error)
    throw error
  }
}

/**
 * Obtener información básica de la cuenta de Instagram usando backend
 * @param {string} instagramAccountId - ID de la cuenta de Instagram Business
 * @param {string} accessToken - Token de acceso
 */
export const obtenerInfoInstagram = async (instagramAccountId, accessToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/marketing/instagram-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ instagramAccountId, accessToken })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener información de Instagram')
    }

    const data = await response.json()
    return data.info
  } catch (error) {
    console.error('Error al obtener información de Instagram:', error)
    throw error
  }
}

/**
 * Obtener métricas de Facebook Page usando backend
 * @param {string} pageId - ID de la página de Facebook
 * @param {string} accessToken - Token de acceso
 * @param {string} metric - Métrica a obtener
 * @param {string} period - Período (day, week, days_28)
 */
export const obtenerMetricasFacebook = async (pageId, accessToken, metric = 'page_impressions', period = 'day') => {
  try {
    const response = await fetch(`${API_BASE_URL}/marketing/facebook-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pageId, accessToken, metric, period })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Error al obtener métrica ${metric}`)
    }

    const data = await response.json()
    return data.metrics || []
  } catch (error) {
    console.error(`Error al obtener métricas de Facebook (${metric}):`, error)
    throw error
  }
}

/**
 * Obtener información de la página de Facebook usando backend
 * @param {string} pageId - ID de la página
 * @param {string} accessToken - Token de acceso
 */
export const obtenerInfoFacebook = async (pageId, accessToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/marketing/facebook-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pageId, accessToken })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al obtener información de Facebook')
    }

    const data = await response.json()
    return data.info
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

