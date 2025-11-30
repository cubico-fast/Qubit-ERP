const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * Iniciar autenticación OAuth con Meta (Facebook/Instagram)
 * GET /api/marketing/auth/facebook
 * GET /api/marketing/auth/instagram
 */
router.get('/auth/:platform', (req, res) => {
  const { platform } = req.params; // 'facebook' o 'instagram'
  const APP_ID = process.env.VITE_META_APP_ID || process.env.META_APP_ID;
  const REDIRECT_URI = process.env.VITE_META_REDIRECT_URI || process.env.META_REDIRECT_URI || 'http://localhost:3000/api/marketing/callback';

  // Scopes según la plataforma
  const scopes = platform === 'instagram'
    ? 'instagram_basic,instagram_manage_insights,pages_read_engagement,pages_read_user_content'
    : 'pages_read_engagement,pages_read_user_content,pages_show_list';

  const redirect = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&state=${platform}`;

  res.redirect(redirect);
});

/**
 * Callback después de la autorización OAuth
 * GET /api/marketing/callback
 */
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/marketing/configuracion?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/marketing/configuracion?error=no_code`);
  }

  try {
    const APP_ID = process.env.VITE_META_APP_ID || process.env.META_APP_ID;
    const APP_SECRET = process.env.VITE_META_APP_SECRET || process.env.META_APP_SECRET;
    const REDIRECT_URI = process.env.VITE_META_REDIRECT_URI || process.env.META_REDIRECT_URI || 'http://localhost:3000/api/marketing/callback';

    // Intercambiar código por token de corta duración
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      }
    });

    const shortLivedToken = tokenResponse.data.access_token;

    // Convertir a token de larga duración (60 días)
    const longLivedResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: shortLivedToken
      }
    });

    const longLivedToken = longLivedResponse.data.access_token;

    // Redirigir al frontend con el token (en producción, guardar en base de datos y usar sesión)
    const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/marketing/configuracion?token=${longLivedToken}&platform=${state || 'facebook'}`;
    res.redirect(frontendUrl);

  } catch (error) {
    console.error('Error en callback de OAuth:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.error?.message || 'Error desconocido';
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/marketing/configuracion?error=${encodeURIComponent(errorMessage)}`);
  }
});

/**
 * Obtener páginas de Facebook del usuario
 * POST /api/marketing/pages
 * Body: { accessToken: string }
 */
router.post('/pages', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token requerido' });
    }

    const response = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token,category'
      }
    });

    res.json({ pages: response.data.data || [] });
  } catch (error) {
    console.error('Error al obtener páginas:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error al obtener páginas',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * Obtener cuenta de Instagram vinculada a una página
 * POST /api/marketing/instagram-account
 * Body: { pageId: string, pageAccessToken: string }
 */
router.post('/instagram-account', async (req, res) => {
  try {
    const { pageId, pageAccessToken } = req.body;

    if (!pageId || !pageAccessToken) {
      return res.status(400).json({ error: 'Page ID y access token requeridos' });
    }

    const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        fields: 'instagram_business_account',
        access_token: pageAccessToken
      }
    });

    if (response.data.instagram_business_account) {
      // Obtener información completa de la cuenta de Instagram
      const igAccountId = response.data.instagram_business_account.id;
      const igInfo = await axios.get(`https://graph.facebook.com/v18.0/${igAccountId}`, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: pageAccessToken
        }
      });

      res.json({ 
        instagramAccount: {
          ...response.data.instagram_business_account,
          ...igInfo.data
        }
      });
    } else {
      res.json({ instagramAccount: null });
    }
  } catch (error) {
    console.error('Error al obtener cuenta de Instagram:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error al obtener cuenta de Instagram',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * Obtener métricas de Instagram
 * POST /api/marketing/instagram-metrics
 * Body: { instagramAccountId: string, accessToken: string, metric: string, period: string }
 */
router.post('/instagram-metrics', async (req, res) => {
  try {
    const { instagramAccountId, accessToken, metric = 'impressions', period = 'day' } = req.body;

    if (!instagramAccountId || !accessToken) {
      return res.status(400).json({ error: 'Instagram Account ID y access token requeridos' });
    }

    const since = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000); // Últimos 7 días
    const until = Math.floor(Date.now() / 1000);

    const response = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccountId}/insights`, {
      params: {
        metric: metric,
        period: period,
        since: since,
        until: until,
        access_token: accessToken
      }
    });

    res.json({ metrics: response.data.data || [] });
  } catch (error) {
    console.error('Error al obtener métricas de Instagram:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error al obtener métricas de Instagram',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * Obtener información de Instagram
 * POST /api/marketing/instagram-info
 * Body: { instagramAccountId: string, accessToken: string }
 */
router.post('/instagram-info', async (req, res) => {
  try {
    const { instagramAccountId, accessToken } = req.body;

    if (!instagramAccountId || !accessToken) {
      return res.status(400).json({ error: 'Instagram Account ID y access token requeridos' });
    }

    const response = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccountId}`, {
      params: {
        fields: 'username,account_type,media_count,followers_count,follows_count',
        access_token: accessToken
      }
    });

    res.json({ info: response.data });
  } catch (error) {
    console.error('Error al obtener información de Instagram:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error al obtener información de Instagram',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * Obtener métricas de Facebook Page
 * POST /api/marketing/facebook-metrics
 * Body: { pageId: string, accessToken: string, metric: string, period: string }
 */
router.post('/facebook-metrics', async (req, res) => {
  try {
    const { pageId, accessToken, metric = 'page_impressions', period = 'day' } = req.body;

    if (!pageId || !accessToken) {
      return res.status(400).json({ error: 'Page ID y access token requeridos' });
    }

    const since = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000); // Últimos 7 días
    const until = Math.floor(Date.now() / 1000);

    const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/insights`, {
      params: {
        metric: metric,
        period: period,
        since: since,
        until: until,
        access_token: accessToken
      }
    });

    res.json({ metrics: response.data.data || [] });
  } catch (error) {
    console.error('Error al obtener métricas de Facebook:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error al obtener métricas de Facebook',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * Obtener información de Facebook Page
 * POST /api/marketing/facebook-info
 * Body: { pageId: string, accessToken: string }
 */
router.post('/facebook-info', async (req, res) => {
  try {
    const { pageId, accessToken } = req.body;

    if (!pageId || !accessToken) {
      return res.status(400).json({ error: 'Page ID y access token requeridos' });
    }

    const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        fields: 'name,fan_count,new_like_count',
        access_token: accessToken
      }
    });

    res.json({ info: response.data });
  } catch (error) {
    console.error('Error al obtener información de Facebook:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error al obtener información de Facebook',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;

