import { useState, useEffect } from 'react'
import { Bell, Search, User, Menu, Clock, LogOut } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { getNetworkTime, formatTime, formatDate } from '../utils/dateUtils'
import ThemeSelector from './ThemeSelector'

const Header = ({ toggleSidebar }) => {
  const { currency, setCurrency } = useCurrency()
  const { theme } = useTheme()
  const { logout } = useAuth()
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')

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

  return (
    <header 
      className="border-b shadow-sm transition-colors duration-300 w-full"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box'
      }}
    >
      <div className="flex items-center justify-between px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={toggleSidebar}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            title="Mostrar/Ocultar menú"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Reloj con hora de la red */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <Clock size={16} className="text-gray-600" />
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{currentTime}</div>
              <div className="text-xs text-gray-500">{currentDate}</div>
            </div>
          </div>

          {/* Selector de Tema */}
          <ThemeSelector />

          {/* Selector de Moneda */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-2 md:px-3 py-1 md:py-2 border rounded-lg focus:outline-none focus:ring-2 text-xs md:text-sm font-medium transition-colors"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <option value="USD">USD ($)</option>
            <option value="PEN">PEN (S/)</option>
          </select>
          
          <button 
            className="relative p-2 rounded-lg transition-colors"
            style={{
              color: theme.colors.textSecondary
            }}
            aria-label="Notificaciones"
          >
            <Bell size={18} className="md:w-5 md:h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div 
            className="flex items-center space-x-2 md:space-x-3 md:pl-4 md:border-l"
            style={{ borderColor: theme.colors.border }}
          >
            <div className="text-right hidden sm:block">
              <p 
                className="text-xs md:text-sm font-medium"
                style={{ color: theme.colors.text }}
              >
                Admin Usuario
              </p>
              <p 
                className="text-xs hidden md:block"
                style={{ color: theme.colors.textSecondary }}
              >
                admin@cubic.com
              </p>
            </div>
            <div 
              className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary[500]}, ${theme.colors.primary[700]})`
              }}
            >
              AU
            </div>
            <button
              onClick={logout}
              className="ml-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              style={{
                color: theme.colors.textSecondary
              }}
            >
              <LogOut size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

