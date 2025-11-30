/**
 * Utilidades para la integración con Meta (Facebook/Instagram) Graph API
 */

// Configuración de Meta OAuth
const META_APP_ID = import.meta.env.VITE_META_APP_ID || ''
const META_APP_SECRET = import.meta.env.VITE_META_APP_SECRET || ''
const REDIRECT_URI = `${window.location.origin}/marketing/callback`

// Scopes necesarios para Instagram y Facebook
const INSTAGRAM_SCOPES = [
  'instagram_basic',
  'instagram_manage_insights',
  'pages_read_engagement',
  'pages_show_list'
]

const FACEBOOK_SCOPES = [
  'pages_read_engagement',
  'pages_read_user_content',
  'pages_show_list',
  'read_insights'
]

/**
 * Genera la URL de autorización de Facebook
 */
export const getFacebookAuthUrl = () => {
  const scopes = [...INSTAGRAM_SCOPES, ...FACEBOOK_SCOPES].join(',')
  const state = Math.random().toString(36).substring(7) // Estado aleatorio para seguridad
  
  // Guardar state en localStorage para validación
  localStorage.setItem('meta_oauth_state', state)
  
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: scopes,
    response_type: 'code',
    state: state
  })
  
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
}

/**
 * Intercambia el código de autorización por un access token
 */
export const exchangeCodeForToken = async (code) => {
  try {
    const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener token')
    }
    
    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error al intercambiar código por token:', error)
    throw error
  }
}

/**
 * Convierte un short-lived token en un long-lived token
 */
export const getLongLivedToken = async (shortLivedToken) => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener token de larga duración')
    }
    
    const data = await response.json()
    return {
      access_token: data.access_token,
      expires_in: data.expires_in || 5184000 // 60 días por defecto
    }
  } catch (error) {
    console.error('Error al obtener token de larga duración:', error)
    throw error
  }
}

/**
 * Obtiene las páginas de Facebook del usuario
 */
export const getFacebookPages = async (accessToken) => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener páginas')
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error al obtener páginas de Facebook:', error)
    throw error
  }
}

/**
 * Obtiene la cuenta de Instagram Business asociada a una página
 */
export const getInstagramBusinessAccount = async (pageId, pageAccessToken) => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
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
 * Obtiene métricas de Instagram
 */
export const getInstagramMetrics = async (instagramAccountId, accessToken, period = 'day') => {
  try {
    // Métricas disponibles
    const metrics = [
      'impressions',
      'reach',
      'profile_views',
      'website_clicks',
      'follower_count',
      'email_contacts',
      'phone_call_clicks',
      'text_message_clicks',
      'get_directions_clicks'
    ].join(',')
    
    const since = new Date()
    since.setDate(since.getDate() - 7) // Últimos 7 días
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/insights?metric=${metrics}&period=${period}&since=${Math.floor(since.getTime() / 1000)}&access_token=${accessToken}`
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener métricas de Instagram')
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error al obtener métricas de Instagram:', error)
    throw error
  }
}

/**
 * Obtiene métricas de Facebook Page
 */
export const getFacebookPageMetrics = async (pageId, accessToken, period = 'day') => {
  try {
    const metrics = [
      'page_impressions',
      'page_reach',
      'page_engaged_users',
      'page_fans',
      'page_views',
      'page_posts_impressions',
      'page_posts_engagements'
    ].join(',')
    
    const since = new Date()
    since.setDate(since.getDate() - 7) // Últimos 7 días
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/insights?metric=${metrics}&period=${period}&since=${Math.floor(since.getTime() / 1000)}&access_token=${accessToken}`
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener métricas de Facebook')
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error al obtener métricas de Facebook:', error)
    throw error
  }
}

/**
 * Obtiene información básica de la cuenta de Instagram
 */
export const getInstagramAccountInfo = async (instagramAccountId, accessToken) => {
  try {
    const fields = [
      'id',
      'username',
      'account_type',
      'media_count',
      'profile_picture_url',
      'biography',
      'website',
      'followers_count',
      'follows_count'
    ].join(',')
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=${fields}&access_token=${accessToken}`
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener información de Instagram')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error al obtener información de Instagram:', error)
    throw error
  }
}

/**
 * Obtiene información básica de la página de Facebook
 */
export const getFacebookPageInfo = async (pageId, accessToken) => {
  try {
    const fields = [
      'id',
      'name',
      'category',
      'fan_count',
      'followers_count',
      'talking_about_count',
      'website',
      'about',
      'picture'
    ].join(',')
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=${fields}&access_token=${accessToken}`
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener información de Facebook')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error al obtener información de Facebook:', error)
    throw error
  }
}

/**
 * Obtiene los posts recientes de Instagram
 */
export const getInstagramMedia = async (instagramAccountId, accessToken, limit = 10) => {
  try {
    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'permalink',
      'timestamp',
      'like_count',
      'comments_count',
      'insights.metric(impressions,reach,engagement)'
    ].join(',')
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al obtener posts de Instagram')
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error al obtener posts de Instagram:', error)
    throw error
  }
}

/**
 * Valida el state del OAuth para prevenir CSRF
 */
export const validateOAuthState = (receivedState) => {
  const savedState = localStorage.getItem('meta_oauth_state')
  if (savedState && savedState === receivedState) {
    localStorage.removeItem('meta_oauth_state')
    return true
  }
  return false
}

