import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Megaphone,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  BarChart3,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Calendar,
  Filter,
  Download,
  Zap,
  Target,
  Award,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { getNetworkTime, formatDate } from '../utils/dateUtils'
import {
  obtenerConfiguracionMeta,
  obtenerMetricasInstagram,
  obtenerInfoInstagram,
  obtenerMetricasFacebook,
  obtenerInfoFacebook
} from '../utils/metaApi'

const Marketing = () => {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [timeRange, setTimeRange] = useState('7d')
  const [configMeta, setConfigMeta] = useState(null)
  const [metricasReales, setMetricasReales] = useState({
    instagram: null,
    facebook: null
  })
  const [loadingMetricas, setLoadingMetricas] = useState(false)
  const [errorMetricas, setErrorMetricas] = useState(null)

  // Actualizar fecha actual
  useEffect(() => {
    const updateDate = async () => {
      try {
        const networkDate = await getNetworkTime()
        setCurrentDate(networkDate)
      } catch (error) {
        console.error('Error al obtener fecha de la red:', error)
      }
    }
    updateDate()
    const interval = setInterval(updateDate, 60000)
    return () => clearInterval(interval)
  }, [])

  // Datos de ejemplo para algoritmos de redes sociales
  const algoritmoData = {
    instagram: {
      nombre: 'Instagram Algorithm',
      score: 87,
      factores: [
        { nombre: 'Engagement Rate', valor: 92, peso: 0.3 },
        { nombre: 'Timing', valor: 85, peso: 0.2 },
        { nombre: 'Relevancia', valor: 90, peso: 0.25 },
        { nombre: 'Relaciones', valor: 88, peso: 0.15 },
        { nombre: 'Contenido', valor: 82, peso: 0.1 }
      ],
      tendencia: 'up'
    },
    facebook: {
      nombre: 'Facebook Algorithm',
      score: 75,
      factores: [
        { nombre: 'Interacciones', valor: 78, peso: 0.3 },
        { nombre: 'Tipo de Contenido', valor: 72, peso: 0.25 },
        { nombre: 'Popularidad', valor: 80, peso: 0.2 },
        { nombre: 'Relevancia', valor: 70, peso: 0.15 },
        { nombre: 'Tiempo', valor: 75, peso: 0.1 }
      ],
      tendencia: 'stable'
    },
    tiktok: {
      nombre: 'TikTok Algorithm',
      score: 91,
      factores: [
        { nombre: 'Completion Rate', valor: 95, peso: 0.35 },
        { nombre: 'Shares', valor: 88, peso: 0.25 },
        { nombre: 'Likes', valor: 90, peso: 0.2 },
        { nombre: 'Comments', valor: 85, peso: 0.15 },
        { nombre: 'Follows', valor: 87, peso: 0.05 }
      ],
      tendencia: 'up'
    },
    youtube: {
      nombre: 'YouTube Algorithm',
      score: 79,
      factores: [
        { nombre: 'Watch Time', valor: 82, peso: 0.4 },
        { nombre: 'CTR', valor: 75, peso: 0.3 },
        { nombre: 'Retention', valor: 80, peso: 0.2 },
        { nombre: 'Engagement', valor: 78, peso: 0.1 }
      ],
      tendencia: 'up'
    }
  }

  // Datos de rendimiento por plataforma
  const rendimientoData = [
    { fecha: 'Lun', instagram: 1200, facebook: 800, tiktok: 2500, youtube: 600 },
    { fecha: 'Mar', instagram: 1500, facebook: 950, tiktok: 3200, youtube: 750 },
    { fecha: 'Mié', instagram: 1800, facebook: 1100, tiktok: 4100, youtube: 900 },
    { fecha: 'Jue', instagram: 2100, facebook: 1300, tiktok: 4800, youtube: 1100 },
    { fecha: 'Vie', instagram: 2400, facebook: 1500, tiktok: 5500, youtube: 1300 },
    { fecha: 'Sáb', instagram: 2800, facebook: 1800, tiktok: 6200, youtube: 1500 },
    { fecha: 'Dom', instagram: 3200, facebook: 2100, tiktok: 7000, youtube: 1800 }
  ]

  // Datos de engagement
  const engagementData = [
    { plataforma: 'Instagram', likes: 12500, comentarios: 850, compartidos: 320, guardados: 450 },
    { plataforma: 'Facebook', likes: 8900, comentarios: 620, compartidos: 280, guardados: 0 },
    { plataforma: 'TikTok', likes: 18500, comentarios: 1200, compartidos: 890, guardados: 0 },
    { plataforma: 'YouTube', likes: 5600, comentarios: 420, compartidos: 180, guardados: 0 }
  ]

  // Datos de algoritmo por factor
  const algoritmoFactorData = Object.entries(algoritmoData).map(([key, value]) => ({
    plataforma: value.nombre,
    ...value.factores.reduce((acc, factor) => {
      acc[factor.nombre] = factor.valor
      return acc
    }, {})
  }))

  // Estadísticas generales
  const stats = [
    {
      title: 'Alcance Total',
      value: '125.4K',
      change: '+12.5%',
      trend: 'up',
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Engagement Rate',
      value: '8.2%',
      change: '+2.1%',
      trend: 'up',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Crecimiento',
      value: '+1,250',
      change: '+15.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Mejor Plataforma',
      value: 'TikTok',
      change: 'Score: 91',
      trend: 'up',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  // Colores para gráficos
  const COLORS = {
    instagram: '#E4405F',
    facebook: '#1877F2',
    tiktok: '#000000',
    youtube: '#FF0000'
  }

  const COLORS_PIE = ['#E4405F', '#1877F2', '#000000', '#FF0000', '#1DA1F2']

  // Obtener datos filtrados
  const getFilteredData = () => {
    if (selectedPlatform === 'all') {
      return rendimientoData
    }
    return rendimientoData.map(item => ({
      fecha: item.fecha,
      [selectedPlatform]: item[selectedPlatform]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Megaphone className="text-primary-600" size={32} />
            Marketing Digital
          </h1>
          <p className="text-gray-600 mt-1">Visualiza y analiza tus algoritmos en redes sociales</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todas las plataformas</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
          {configMeta && (
            <button
              onClick={refrescarMetricas}
              disabled={loadingMetricas}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Refrescar métricas"
            >
              <RefreshCw size={18} className={loadingMetricas ? 'animate-spin' : ''} />
              Actualizar
            </button>
          )}
          <button
            onClick={() => navigate('/marketing/configuracion')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Settings size={18} />
            Configuración
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      {/* Alerta si no hay conexión */}
      {!configMeta && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Conecta tus cuentas para ver métricas reales</p>
            <p className="text-sm mt-1">Ve a Configuración para conectar Facebook e Instagram y ver tus datos reales.</p>
            <button
              onClick={() => navigate('/marketing/configuracion')}
              className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
            >
              Ir a Configuración
            </button>
          </div>
        </div>
      )}

      {/* Error al cargar métricas */}
      {errorMetricas && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{errorMetricas}</p>
          </div>
        </div>
      )}

      {/* Métricas Reales de Instagram */}
      {metricasReales.instagram && (
        <div className="card bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Instagram className="text-pink-600" size={28} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Instagram - @{metricasReales.instagram.info.username || 'N/A'}
                </h3>
                <p className="text-sm text-gray-600">Métricas reales desde la API</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              ● En Vivo
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Seguidores</p>
              <p className="text-2xl font-bold text-gray-900">
                {metricasReales.instagram.info.followers_count?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Seguidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {metricasReales.instagram.info.follows_count?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Publicaciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {metricasReales.instagram.info.media_count?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Alcance (7d)</p>
              <p className="text-2xl font-bold text-gray-900">
                {metricasReales.instagram.reach?.[0]?.values?.reduce((sum, v) => sum + (parseInt(v.value) || 0), 0).toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas Reales de Facebook */}
      {metricasReales.facebook && (
        <div className="card bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Facebook className="text-blue-600" size={28} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Facebook - {metricasReales.facebook.info.name || 'N/A'}
                </h3>
                <p className="text-sm text-gray-600">Métricas reales desde la API</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              ● En Vivo
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Me gusta</p>
              <p className="text-2xl font-bold text-gray-900">
                {metricasReales.facebook.info.fan_count?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Impresiones (7d)</p>
              <p className="text-2xl font-bold text-gray-900">
                {metricasReales.facebook.impressions?.[0]?.values?.reduce((sum, v) => sum + (parseInt(v.value) || 0), 0).toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Alcance (7d)</p>
              <p className="text-2xl font-bold text-gray-900">
                {metricasReales.facebook.reach?.[0]?.values?.reduce((sum, v) => sum + (parseInt(v.value) || 0), 0).toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          // Usar datos reales si están disponibles
          let valorReal = stat.value
          let cambioReal = stat.change

          if (metricasReales.instagram?.info && index === 0) {
            // Alcance Total
            const totalReach = metricasReales.instagram.reach?.[0]?.values?.reduce((sum, v) => sum + (parseInt(v.value) || 0), 0) || 0
            valorReal = totalReach > 0 ? `${(totalReach / 1000).toFixed(1)}K` : stat.value
          } else if (metricasReales.instagram?.info && index === 1) {
            // Engagement Rate
            const followers = metricasReales.instagram.info.followers_count || 0
            const impressions = metricasReales.instagram.impressions?.[0]?.values?.reduce((sum, v) => sum + (parseInt(v.value) || 0), 0) || 0
            const engagementRate = followers > 0 ? ((impressions / followers) * 100).toFixed(1) : 0
            valorReal = engagementRate > 0 ? `${engagementRate}%` : stat.value
          } else if (metricasReales.instagram?.info && index === 2) {
            // Crecimiento
            const followers = metricasReales.instagram.info.followers_count || 0
            valorReal = followers > 0 ? `+${followers.toLocaleString()}` : stat.value
          }

          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingMetricas ? '...' : valorReal}
                    {configMeta && metricasReales.instagram && index < 3 && (
                      <span className="ml-2 text-xs text-green-600">● Real</span>
                    )}
                  </p>
                  <p className={`text-sm mt-1 flex items-center gap-1 ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp size={14} />
                    {cambioReal}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Análisis de Algoritmos por Plataforma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(algoritmoData).map(([key, algoritmo]) => {
          // Ocultar Instagram y Facebook si hay datos reales
          if ((key === 'instagram' && metricasReales.instagram) || 
              (key === 'facebook' && metricasReales.facebook)) {
            return null
          }

          return (
          <div key={key} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {key === 'instagram' && <Instagram className="text-pink-600" size={24} />}
                {key === 'facebook' && <Facebook className="text-blue-600" size={24} />}
                {key === 'tiktok' && <Zap className="text-black" size={24} />}
                {key === 'youtube' && <Youtube className="text-red-600" size={24} />}
                <h3 className="text-lg font-semibold text-gray-900">{algoritmo.nombre}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary-600">{algoritmo.score}</span>
                <span className="text-sm text-gray-500">/100</span>
                {algoritmo.tendencia === 'up' && (
                  <TrendingUp className="text-green-600" size={20} />
                )}
              </div>
            </div>
            
            {/* Factores del algoritmo */}
            <div className="space-y-3">
              {algoritmo.factores.map((factor, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{factor.nombre}</span>
                    <span className="text-sm text-gray-600">{factor.valor}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${factor.valor}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    Peso: {(factor.peso * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          )
        })}
      </div>

      {/* Rendimiento por Plataforma */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Rendimiento por Plataforma</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span className="text-sm text-gray-600">Instagram</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Facebook</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-black"></div>
              <span className="text-sm text-gray-600">TikTok</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">YouTube</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={getFilteredData()}>
            <defs>
              <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E4405F" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#E4405F" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFacebook" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1877F2" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#1877F2" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTiktok" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000000" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorYoutube" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF0000" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            {selectedPlatform === 'all' || selectedPlatform === 'instagram' ? (
              <Area
                type="monotone"
                dataKey="instagram"
                stroke="#E4405F"
                fillOpacity={1}
                fill="url(#colorInstagram)"
                name="Instagram"
              />
            ) : null}
            {selectedPlatform === 'all' || selectedPlatform === 'facebook' ? (
              <Area
                type="monotone"
                dataKey="facebook"
                stroke="#1877F2"
                fillOpacity={1}
                fill="url(#colorFacebook)"
                name="Facebook"
              />
            ) : null}
            {selectedPlatform === 'all' || selectedPlatform === 'tiktok' ? (
              <Area
                type="monotone"
                dataKey="tiktok"
                stroke="#000000"
                fillOpacity={1}
                fill="url(#colorTiktok)"
                name="TikTok"
              />
            ) : null}
            {selectedPlatform === 'all' || selectedPlatform === 'youtube' ? (
              <Area
                type="monotone"
                dataKey="youtube"
                stroke="#FF0000"
                fillOpacity={1}
                fill="url(#colorYoutube)"
                name="YouTube"
              />
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Engagement por Plataforma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="plataforma" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="likes" fill="#E4405F" name="Likes" />
              <Bar dataKey="comentarios" fill="#1877F2" name="Comentarios" />
              <Bar dataKey="compartidos" fill="#10b981" name="Compartidos" />
              <Bar dataKey="guardados" fill="#f59e0b" name="Guardados" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Alcance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Instagram', value: 35 },
                  { name: 'Facebook', value: 25 },
                  { name: 'TikTok', value: 30 },
                  { name: 'YouTube', value: 10 }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Instagram', value: 35 },
                  { name: 'Facebook', value: 25 },
                  { name: 'TikTok', value: 30 },
                  { name: 'YouTube', value: 10 }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_PIE[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recomendaciones del Algoritmo */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="text-primary-600" size={20} />
          Recomendaciones para Mejorar el Algoritmo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Instagram className="text-pink-600 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Instagram</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Publica entre 6-9 PM para mayor engagement</li>
                  <li>• Usa hashtags relevantes (5-10 por post)</li>
                  <li>• Responde comentarios en las primeras 2 horas</li>
                  <li>• Publica Stories diariamente</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Facebook className="text-blue-600 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Facebook</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Publica videos nativos (no enlaces externos)</li>
                  <li>• Fomenta conversaciones en los comentarios</li>
                  <li>• Publica contenido educativo y de valor</li>
                  <li>• Usa Facebook Live regularmente</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Zap className="text-black flex-shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">TikTok</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Mantén videos entre 15-30 segundos</li>
                  <li>• Usa música trending y hashtags populares</li>
                  <li>• Publica 1-3 veces al día</li>
                  <li>• Crea contenido auténtico y original</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Youtube className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">YouTube</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Optimiza títulos con palabras clave</li>
                  <li>• Crea miniaturas atractivas y clickeables</li>
                  <li>• Mantén la retención de audiencia alta</li>
                  <li>• Publica de forma consistente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Marketing


