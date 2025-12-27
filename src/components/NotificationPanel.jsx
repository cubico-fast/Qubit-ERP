import { useState, useRef, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Package, DollarSign, FileText, Clock, TrendingDown, RotateCcw } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../utils/dateUtils'
import { useCurrency } from '../contexts/CurrencyContext'

const NotificationPanel = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { theme } = useTheme()
  const { formatCurrency } = useCurrency()
  const panelRef = useRef(null)
  const navigate = useNavigate()

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Obtener ícono según tipo de notificación
  const getIcon = (type) => {
    switch (type) {
      case 'devolucion':
        return <RotateCcw size={18} />
      case 'garantia':
        return <Package size={18} />
      case 'cuenta_por_cobrar':
        return <DollarSign size={18} />
      case 'cuenta_por_pagar':
        return <TrendingDown size={18} />
      case 'cotizacion':
        return <FileText size={18} />
      case 'stock':
        return <AlertCircle size={18} />
      default:
        return <Bell size={18} />
    }
  }

  // Obtener color según severidad
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return '#ef4444' // red-500
      case 'warning':
        return '#f59e0b' // amber-500
      case 'info':
        return '#3b82f6' // blue-500
      default:
        return '#6b7280' // gray-500
    }
  }

  // Manejar clic en notificación
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    if (notification.link) {
      navigate(notification.link)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg shadow-xl border z-50"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: theme.colors.border }}
      >
        <div className="flex items-center gap-2">
          <Bell size={20} style={{ color: theme.colors.text }} />
          <h3 className="font-semibold" style={{ color: theme.colors.text }}>
            Notificaciones
          </h3>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: theme.colors.primary[600] }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1.5 rounded hover:bg-opacity-10 transition-colors"
              style={{ color: theme.colors.primary[600] }}
              title="Marcar todas como leídas"
            >
              <Check size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-opacity-10 transition-colors"
            style={{ color: theme.colors.textSecondary }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={48} className="mx-auto mb-3 opacity-30" style={{ color: theme.colors.textSecondary }} />
            <p style={{ color: theme.colors.textSecondary }}>
              No hay notificaciones
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: theme.colors.border }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-opacity-5' : ''
                }`}
                style={{
                  backgroundColor: !notification.read 
                    ? `${theme.colors.primary[500]}10` 
                    : 'transparent',
                  borderColor: theme.colors.border
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Ícono */}
                  <div
                    className="flex-shrink-0 mt-0.5 p-2 rounded-lg"
                    style={{
                      backgroundColor: `${getSeverityColor(notification.severity)}20`,
                      color: getSeverityColor(notification.severity)
                    }}
                  >
                    {getIcon(notification.type)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className="font-semibold text-sm"
                        style={{ color: theme.colors.text }}
                      >
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: theme.colors.primary[600] }}
                        />
                      )}
                    </div>
                    <p
                      className="text-sm mt-1 line-clamp-2"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {notification.message}
                    </p>
                    {notification.amount && (
                      <p
                        className="text-xs font-medium mt-1"
                        style={{ color: theme.colors.primary[600] }}
                      >
                        {formatCurrency(notification.amount)}
                      </p>
                    )}
                    <p
                      className="text-xs mt-1"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {formatDate(notification.date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationPanel

