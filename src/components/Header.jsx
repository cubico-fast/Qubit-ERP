import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, User, Menu, Clock, LogOut, ChevronDown, Camera, Settings, UserPlus, X, Image, Upload, Palette, Trash2 } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { getNetworkTime, formatTime, formatDate } from '../utils/dateUtils'
import ThemeSelector from './ThemeSelector'
import GlobalSearch from './GlobalSearch'
import NotificationPanel from './NotificationPanel'

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate()
  const { currency, setCurrency } = useCurrency()
  const { theme } = useTheme()
  const { logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showChangePhotoModal, setShowChangePhotoModal] = useState(false)
  const [userAvatar, setUserAvatar] = useState(() => {
    // Cargar avatar desde localStorage
    return localStorage.getItem('user_avatar') || null
  })
  const [showIllustrationsModal, setShowIllustrationsModal] = useState(false)
  const [showGooglePhotosModal, setShowGooglePhotosModal] = useState(false)
  const fileInputRef = useRef(null)
  const cameraVideoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const currencyMenuRef = useRef(null)
  const userMenuRef = useRef(null)

  // Ilustraciones predefinidas (avatares)
  const avatarIllustrations = [
    { id: 1, emoji: '👤', name: 'Usuario' },
    { id: 2, emoji: '🧑‍💼', name: 'Ejecutivo' },
    { id: 3, emoji: '👨‍💻', name: 'Desarrollador' },
    { id: 4, emoji: '👩‍💼', name: 'Profesional' },
    { id: 5, emoji: '🦸', name: 'Héroe' },
    { id: 6, emoji: '🎭', name: 'Actor' },
    { id: 7, emoji: '🎨', name: 'Artista' },
    { id: 8, emoji: '🚀', name: 'Innovador' },
  ]

  // Guardar avatar en localStorage cuando cambie
  useEffect(() => {
    if (userAvatar) {
      localStorage.setItem('user_avatar', userAvatar)
    }
  }, [userAvatar])

  // Función para actualizar el avatar
  const updateAvatar = (avatarUrl) => {
    setUserAvatar(avatarUrl)
    setShowChangePhotoModal(false)
    setShowIllustrationsModal(false)
    setShowGooglePhotosModal(false)
    setShowCameraModal(false)
    // Detener la cámara si está activa
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
  }

  // Función para eliminar el avatar
  const deleteAvatar = (e) => {
    e.stopPropagation()
    setUserAvatar(null)
    localStorage.removeItem('user_avatar')
  }

  // Función para manejar subida de archivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateAvatar(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Función para iniciar la cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      })
      cameraStreamRef.current = stream
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream
      }
      setShowCameraModal(true)
    } catch (error) {
      console.error('Error al acceder a la cámara:', error)
      alert('No se pudo acceder a la cámara. Asegúrate de dar permisos.')
    }
  }

  // Función para capturar foto desde la cámara
  const capturePhoto = () => {
    if (cameraVideoRef.current) {
      const video = cameraVideoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      const photoUrl = canvas.toDataURL('image/png')
      updateAvatar(photoUrl)
    }
  }

  // Limpiar stream de cámara cuando se cierre el modal
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop())
        cameraStreamRef.current = null
      }
    }
  }, [showCameraModal])

  // Actualizar hora cada segundo
  useEffect(() => {
    const updateTime = async () => {
      try {
        const networkTime = await getNetworkTime()
        setCurrentTime(formatTime(networkTime))
        setCurrentDate(formatDate(networkTime))
      } catch {
        // Fallback a hora local
        const now = new Date()
        setCurrentTime(formatTime(now))
        setCurrentDate(formatDate(now))
      }
    }

    // Actualizar inmediatamente
    updateTime()
    
    // Actualizar cada segundo
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  // Cerrar menú de moneda al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target)) {
        setCurrencyMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    if (currencyMenuOpen || userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [currencyMenuOpen, userMenuOpen])

  return (
    <header 
      className="border-b shadow-sm transition-colors duration-300 w-full flex-shrink-0"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        width: '100%',
        maxWidth: '100vw',
        minWidth: '320px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10,
        overflow: 'visible'
      }}
    >
      <div className="flex items-center w-full gap-0.5 sm:gap-1 md:gap-2 lg:gap-4 px-1 sm:px-2 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', flexWrap: 'nowrap' }}>
        {/* Menú hamburguesa - Siempre visible pero compacto */}
        <div className="flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1.5 sm:p-2 rounded-lg transition-colors"
            title="Mostrar/Ocultar menú"
            aria-label="Toggle menu"
            style={{ color: theme.colors.textSecondary }}
          >
            <Menu size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Buscador Global - PRIORIDAD MÁXIMA: Siempre visible, toma todo el espacio disponible */}
        <div 
          className="flex-1 min-w-0 relative" 
          style={{ 
            flex: '1 1 0%', 
            minWidth: '100px', 
            maxWidth: '100%',
            width: '100%',
            overflow: 'visible'
          }}
        >
          <GlobalSearch />
        </div>

        {/* Elementos del lado derecho - Todos visibles, solo se ajustan de tamaño */}
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 lg:gap-4 flex-shrink-0">
          {/* Reloj con hora de la red - Oculto en móvil pequeño (<480px), visible desde sm */}
          <div 
            className="hidden min-[480px]:flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg border"
            style={{ 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border
            }}
          >
            <Clock size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4 flex-shrink-0" style={{ color: theme.colors.textSecondary }} />
            <div className="text-right">
              <div className="text-xs sm:text-sm md:text-sm font-semibold leading-tight" style={{ color: theme.colors.text }}>{currentTime}</div>
              <div className="text-[10px] sm:text-xs leading-tight hidden sm:block" style={{ color: theme.colors.textSecondary }}>{currentDate}</div>
            </div>
          </div>

          {/* Selector de Tema - Siempre visible, más pequeño en móvil */}
          <div className="flex-shrink-0">
            <ThemeSelector />
          </div>

          {/* Selector de Moneda - Componente personalizado para móviles */}
          <div className="relative flex-shrink-0" ref={currencyMenuRef}>
            <button
              onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)}
              className="flex items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 font-medium transition-colors touch-manipulation min-h-[36px] sm:min-h-[38px] md:min-h-[40px]"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: currencyMenuOpen ? theme.colors.primary[500] : theme.colors.border,
                color: theme.colors.text,
                minWidth: '44px', // Tamaño mínimo táctil recomendado
                fontSize: '14px',
                fontWeight: '600'
              }}
              aria-label="Seleccionar moneda"
            >
              <span>{currency === 'USD' ? '$' : 'S/'}</span>
              <ChevronDown 
                size={12} 
                className={`transition-transform ${currencyMenuOpen ? 'rotate-180' : ''}`}
                style={{ color: theme.colors.textSecondary }}
              />
            </button>

            {/* Menú desplegable */}
            {currencyMenuOpen && (
              <div
                className="absolute right-0 mt-1 rounded-lg shadow-xl border overflow-hidden z-50"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  minWidth: '120px'
                }}
              >
                <button
                  onClick={() => {
                    setCurrency('USD')
                    setCurrencyMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 sm:py-3.5 flex items-center justify-between transition-colors touch-manipulation ${
                    currency === 'USD' ? 'bg-opacity-20' : 'hover:bg-opacity-10'
                  }`}
                  style={{
                    backgroundColor: currency === 'USD' ? `${theme.colors.primary[500]}40` : 'transparent',
                    color: theme.colors.text,
                    minHeight: '44px' // Tamaño táctil recomendado
                  }}
                >
                  <span className="font-semibold text-sm sm:text-base">USD ($)</span>
                  {currency === 'USD' && (
                    <span className="text-primary-600 font-bold">✓</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setCurrency('PEN')
                    setCurrencyMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 sm:py-3.5 flex items-center justify-between transition-colors touch-manipulation border-t ${
                    currency === 'PEN' ? 'bg-opacity-20' : 'hover:bg-opacity-10'
                  }`}
                  style={{
                    backgroundColor: currency === 'PEN' ? `${theme.colors.primary[500]}40` : 'transparent',
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    minHeight: '44px' // Tamaño táctil recomendado
                  }}
                >
                  <span className="font-semibold text-sm sm:text-base">PEN (S/)</span>
                  {currency === 'PEN' && (
                    <span className="text-primary-600 font-bold">✓</span>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Notificaciones - Siempre visible, más pequeño en móvil */}
          <div className="relative flex-shrink-0">
            <button 
              onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
              className="relative p-1 sm:p-1.5 md:p-2 rounded-lg transition-colors hover:bg-opacity-10"
              style={{
                color: theme.colors.textSecondary,
                backgroundColor: notificationPanelOpen ? `${theme.colors.primary[500]}20` : 'transparent'
              }}
              aria-label="Notificaciones"
            >
              <Bell size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              {unreadCount > 0 && (
                <span 
                  className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"
                  style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                />
              )}
            </button>
            <NotificationPanel 
              isOpen={notificationPanelOpen} 
              onClose={() => setNotificationPanelOpen(false)} 
            />
          </div>
          
          {/* Usuario y Avatar - Siempre visible, tamaño fijo */}
          <div 
            className="flex items-center gap-1 sm:gap-1 md:gap-2 lg:gap-3 md:pl-2 lg:pl-4 md:border-l flex-shrink-0 relative group"
            style={{ borderColor: theme.colors.border }}
            ref={userMenuRef}
          >
            {/* Contenedor del Avatar con cámara */}
            <div className="relative flex flex-col items-center">
              {/* Contenedor del avatar con botón para menú */}
              <div className="relative">
                {/* Avatar - Círculo con solo silueta */}
                <div className="relative group/avatar">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setUserMenuOpen(!userMenuOpen)
                    }}
                    className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80 cursor-pointer overflow-hidden"
                    style={{
                      border: `3px solid ${theme.colors.primary[500]}`,
                      backgroundColor: 'transparent',
                      boxShadow: `inset 0 0 0 1px ${theme.colors.primary[500]}40`
                    }}
                    aria-label="Menú de usuario"
                  >
                    {/* Avatar - Imagen o iniciales */}
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-xs"
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.primary[600]}80, ${theme.colors.primary[800]}80)`,
                          opacity: 0.7
                        }}
                      >
                        AU
                      </div>
                    )}
                  </button>
                  
                  {/* Tooltip personalizado */}
                  <div className="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg shadow-lg border opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  >
                    <p className="text-xs font-medium">Admin Usuario</p>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>DIKSON1212</p>
                  </div>
                </div>
                
                {/* Botón para abrir menú - pequeño en la esquina */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setUserMenuOpen(!userMenuOpen)
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-opacity hover:opacity-100"
                  style={{
                    backgroundColor: theme.colors.primary[500],
                    color: 'white',
                    opacity: userMenuOpen ? 1 : 0.7
                  }}
                  aria-label="Menú de usuario"
                >
                  <ChevronDown size={12} className={userMenuOpen ? 'rotate-180' : ''} style={{ transition: 'transform 0.2s' }} />
                </button>
              </div>
              
              {/* Cámara pequeña debajo del avatar */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowChangePhotoModal(true)
                  setUserMenuOpen(false)
                }}
                className="mt-1 p-0.5 sm:p-1 rounded-full transition-colors hover:opacity-80 flex items-center justify-center"
                style={{ 
                  color: theme.colors.textSecondary,
                  backgroundColor: 'transparent'
                }}
                title="Cambiar foto del perfil"
                aria-label="Cambiar foto del perfil"
              >
                <Camera size={10} className="sm:w-3 sm:h-3" />
              </button>
            </div>

            {/* Menú tipo Google */}
            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 rounded-lg shadow-xl border overflow-hidden z-50"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  minWidth: '200px',
                  width: '280px'
                }}
              >
                {/* Administrar cuenta - Parte superior central */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setUserMenuOpen(false)
                    navigate('/admin')
                  }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-opacity-10 touch-manipulation border-b"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    minHeight: '48px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.colors.primary[500]}15`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Settings size={18} style={{ color: theme.colors.textSecondary }} />
                  <span className="font-medium text-sm">Administrar cuenta</span>
                </button>

                {/* Parte inferior con dos botones */}
                <div className="flex">
                  {/* Salir - Parte inferior izquierda */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setUserMenuOpen(false)
                      logout()
                      navigate('/login')
                    }}
                    className="flex-1 text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-opacity-10 touch-manipulation border-r"
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                      minHeight: '48px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${theme.colors.primary[500]}15`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <LogOut size={18} style={{ color: theme.colors.textSecondary }} />
                    <span className="font-medium text-sm">Salir</span>
                  </button>

                  {/* Agregar cuenta - Parte inferior derecha */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setUserMenuOpen(false)
                      navigate('/admin/usuarios')
                    }}
                    className="flex-1 text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-opacity-10 touch-manipulation"
                    style={{
                      backgroundColor: 'transparent',
                      color: theme.colors.text,
                      minHeight: '48px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${theme.colors.primary[500]}15`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <UserPlus size={18} style={{ color: theme.colors.textSecondary }} />
                    <span className="font-medium text-sm">Agregar cuenta</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal para cambiar foto del perfil */}
          {showChangePhotoModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowChangePhotoModal(false)}
            >
              <div 
                className="rounded-lg shadow-xl border overflow-hidden max-w-md w-full mx-4"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del Modal */}
                <div 
                  className="px-6 py-4 border-b flex items-center justify-between"
                  style={{ borderColor: theme.colors.border }}
                >
                  <h2 
                    className="text-xl font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Cambia la foto de perfil
                  </h2>
                  <button
                    onClick={() => setShowChangePhotoModal(false)}
                    className="p-1 rounded-full hover:bg-opacity-10 transition-colors"
                    style={{ 
                      color: theme.colors.textSecondary,
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${theme.colors.primary[500]}15`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Contenido del Modal */}
                <div className="p-6">
                  {/* Avatar actual */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {userAvatar ? (
                        <img 
                          src={userAvatar} 
                          alt="Avatar actual" 
                          className="w-24 h-24 rounded-full object-cover border-2"
                          style={{ borderColor: theme.colors.primary[500] }}
                        />
                      ) : (
                        <div 
                          className="w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold text-2xl"
                          style={{
                            background: `linear-gradient(135deg, ${theme.colors.primary[500]}, ${theme.colors.primary[700]})`,
                            border: `3px solid ${theme.colors.primary[500]}`
                          }}
                        >
                          AU
                        </div>
                      )}
                      <button
                        className="absolute bottom-0 right-0 p-2 rounded-full"
                        style={{
                          backgroundColor: theme.colors.primary[500],
                          color: 'white'
                        }}
                      >
                        <Camera size={16} />
                      </button>
                      {/* Botón de eliminar avatar - Solo visible cuando hay imagen */}
                      {userAvatar && (
                        <button
                          onClick={deleteAvatar}
                          className="absolute top-0 right-0 p-1.5 rounded-full transition-all hover:scale-110 cursor-pointer"
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                          title="Eliminar foto"
                          aria-label="Eliminar foto"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Input oculto para subir archivo */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />

                  {/* Opciones para cambiar foto */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowIllustrationsModal(true)
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors hover:bg-opacity-10"
                      style={{
                        borderColor: theme.colors.border,
                        backgroundColor: 'transparent',
                        color: theme.colors.text
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.colors.primary[500]}15`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary[500]}20` }}>
                        <Palette size={24} style={{ color: theme.colors.primary[500] }} />
                      </div>
                      <span className="text-sm font-medium text-center">Explorar ilustraciones</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors hover:bg-opacity-10"
                      style={{
                        borderColor: theme.colors.border,
                        backgroundColor: 'transparent',
                        color: theme.colors.text
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.colors.primary[500]}15`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary[500]}20` }}>
                        <Upload size={24} style={{ color: theme.colors.primary[500] }} />
                      </div>
                      <span className="text-sm font-medium text-center">Subir desde el dispositivo</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startCamera()
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors hover:bg-opacity-10"
                      style={{
                        borderColor: theme.colors.border,
                        backgroundColor: 'transparent',
                        color: theme.colors.text
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.colors.primary[500]}15`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary[500]}20` }}>
                        <Camera size={24} style={{ color: theme.colors.primary[500] }} />
                      </div>
                      <span className="text-sm font-medium text-center">Toma una foto</span>
                    </button>
          </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal para explorar ilustraciones */}
          {showIllustrationsModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => {
                setShowIllustrationsModal(false)
                setShowChangePhotoModal(true)
              }}
            >
              <div 
                className="rounded-lg shadow-xl border overflow-hidden max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className="px-6 py-4 border-b flex items-center justify-between sticky top-0"
                  style={{ 
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface
                  }}
                >
                  <h2 
                    className="text-xl font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Selecciona una ilustración
                  </h2>
                  <button
                    onClick={() => {
                      setShowIllustrationsModal(false)
                      setShowChangePhotoModal(true)
                    }}
                    className="p-1 rounded-full hover:bg-opacity-10 transition-colors"
                    style={{ 
                      color: theme.colors.textSecondary,
                      backgroundColor: 'transparent'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {avatarIllustrations.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => {
                          // Convertir emoji a data URL
                          const canvas = document.createElement('canvas')
                          canvas.width = 200
                          canvas.height = 200
                          const ctx = canvas.getContext('2d')
                          ctx.font = '120px Arial'
                          ctx.textAlign = 'center'
                          ctx.textBaseline = 'middle'
                          ctx.fillText(avatar.emoji, 100, 100)
                          const emojiUrl = canvas.toDataURL('image/png')
                          updateAvatar(emojiUrl)
                        }}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors hover:bg-opacity-10"
              style={{
                          borderColor: theme.colors.border,
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${theme.colors.primary[500]}15`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center text-4xl"
                          style={{ backgroundColor: `${theme.colors.primary[500]}10` }}
                        >
                          {avatar.emoji}
                        </div>
                        <span className="text-xs font-medium" style={{ color: theme.colors.text }}>
                          {avatar.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal para Google Fotos */}
          {showGooglePhotosModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => {
                setShowGooglePhotosModal(false)
                setShowChangePhotoModal(true)
              }}
            >
              <div 
                className="rounded-lg shadow-xl border overflow-hidden max-w-md w-full mx-4"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className="px-6 py-4 border-b flex items-center justify-between"
                  style={{ borderColor: theme.colors.border }}
                >
                  <h2 
                    className="text-xl font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Conectar con Google Fotos
                  </h2>
                  <button
                    onClick={() => {
                      setShowGooglePhotosModal(false)
                      setShowChangePhotoModal(true)
                    }}
                    className="p-1 rounded-full hover:bg-opacity-10 transition-colors"
                    style={{ 
                      color: theme.colors.textSecondary,
                      backgroundColor: 'transparent'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
                    Para conectar tu cuenta de Google Fotos, necesitarás autorizar el acceso desde tu cuenta de Google.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setShowGooglePhotosModal(false)
                        setShowChangePhotoModal(true)
                      }}
                      className="px-4 py-2 rounded-lg border transition-colors"
                      style={{
                        borderColor: theme.colors.border,
                        backgroundColor: 'transparent',
                        color: theme.colors.text
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        alert('Funcionalidad de Google Fotos próximamente disponible. Por ahora, usa "Subir desde el dispositivo" para seleccionar una foto.')
                        setShowGooglePhotosModal(false)
                        setShowChangePhotoModal(true)
                      }}
                      className="px-4 py-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: theme.colors.primary[500],
                        color: 'white'
                      }}
                    >
                      Conectar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal para tomar foto con cámara */}
          {showCameraModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
              onClick={() => {
                setShowCameraModal(false)
                setShowChangePhotoModal(true)
                if (cameraStreamRef.current) {
                  cameraStreamRef.current.getTracks().forEach(track => track.stop())
                  cameraStreamRef.current = null
                }
              }}
            >
              <div 
                className="rounded-lg shadow-xl border overflow-hidden max-w-md w-full mx-4"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className="px-6 py-4 border-b flex items-center justify-between"
                  style={{ borderColor: theme.colors.border }}
                >
                  <h2 
                    className="text-xl font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Toma una foto
                  </h2>
                  <button
                    onClick={() => {
                      setShowCameraModal(false)
                      setShowChangePhotoModal(true)
                      if (cameraStreamRef.current) {
                        cameraStreamRef.current.getTracks().forEach(track => track.stop())
                        cameraStreamRef.current = null
                      }
                    }}
                    className="p-1 rounded-full hover:bg-opacity-10 transition-colors"
                    style={{ 
                      color: theme.colors.textSecondary,
                      backgroundColor: 'transparent'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="relative mb-4 rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setShowCameraModal(false)
                        setShowChangePhotoModal(true)
                        if (cameraStreamRef.current) {
                          cameraStreamRef.current.getTracks().forEach(track => track.stop())
                          cameraStreamRef.current = null
                        }
                      }}
                      className="px-4 py-2 rounded-lg border transition-colors"
                      style={{
                        borderColor: theme.colors.border,
                        backgroundColor: 'transparent',
                        color: theme.colors.text
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="px-6 py-2 rounded-full transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor: theme.colors.primary[500],
                        color: 'white'
                      }}
                    >
                      <Camera size={20} />
                      Capturar
            </button>
          </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

