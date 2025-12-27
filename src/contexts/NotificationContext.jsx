import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { 
  getNotasCreditoDebito, 
  getGarantias, 
  getFacturasProveedores,
  getCotizaciones,
  getVentas,
  getProductos
} from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { companyId } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Función para calcular días hasta vencimiento
  const calcularDiasHastaVencimiento = (fechaVencimiento) => {
    if (!fechaVencimiento) return null
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const vencimiento = new Date(fechaVencimiento)
    vencimiento.setHours(0, 0, 0, 0)
    const diferencia = vencimiento - hoy
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24))
  }

  // Detectar devoluciones recientes (últimos 7 días)
  const detectarDevoluciones = useCallback(async () => {
    try {
      const notas = await getNotasCreditoDebito(companyId)
      const hoy = new Date()
      const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const devolucionesRecientes = notas.filter(nota => {
        if (nota.tipo !== 'credito') return false
        const fechaNota = new Date(nota.fecha)
        return fechaNota >= hace7Dias && fechaNota <= hoy
      })

      return devolucionesRecientes.map(nota => ({
        id: `devolucion-${nota.id}`,
        type: 'devolucion',
        title: 'Devolución Procesada',
        message: `Nota de Crédito ${nota.numeroComprobante || nota.id} por ${nota.cliente || 'Cliente'}`,
        amount: nota.total || 0,
        date: nota.fecha,
        link: '/ventas/notas',
        severity: 'info',
        read: false
      }))
    } catch (error) {
      console.error('Error al detectar devoluciones:', error)
      return []
    }
  }, [companyId])

  // Detectar garantías por vencer (próximos 30 días)
  const detectarGarantiasPorVencer = useCallback(async () => {
    try {
      const garantias = await getGarantias(companyId)
      const garantiasActivas = garantias.filter(g => g.estado === 'activa')
      
      const garantiasPorVencer = garantiasActivas
        .map(garantia => {
          const diasRestantes = calcularDiasHastaVencimiento(garantia.fechaVencimiento)
          return { ...garantia, diasRestantes }
        })
        .filter(g => g.diasRestantes !== null && g.diasRestantes >= 0 && g.diasRestantes <= 30)

      return garantiasPorVencer.map(garantia => ({
        id: `garantia-${garantia.id}`,
        type: 'garantia',
        title: garantia.diasRestantes === 0 
          ? 'Garantía Vence Hoy' 
          : garantia.diasRestantes <= 7
          ? 'Garantía Por Vencer Pronto'
          : 'Garantía Por Vencer',
        message: `Garantía de ${garantia.productoNombre || 'Producto'} vence en ${garantia.diasRestantes} día(s)`,
        cliente: garantia.cliente,
        fechaVencimiento: garantia.fechaVencimiento,
        date: garantia.fechaVencimiento,
        link: '/ventas/garantias',
        severity: garantia.diasRestantes <= 7 ? 'warning' : 'info',
        read: false
      }))
    } catch (error) {
      console.error('Error al detectar garantías por vencer:', error)
      return []
    }
  }, [companyId])

  // Detectar cuentas por cobrar vencidas
  const detectarCuentasPorCobrarVencidas = useCallback(async () => {
    try {
      const ventas = await getVentas(companyId)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      const cuentasVencidas = ventas
        .filter(venta => {
          if (venta.estado !== 'Completada') return false
          if (!venta.fechaVencimiento) return false
          const fechaVenc = new Date(venta.fechaVencimiento)
          fechaVenc.setHours(0, 0, 0, 0)
          return fechaVenc < hoy && (venta.saldoPendiente || 0) > 0
        })
        .map(venta => {
          const fechaVenc = new Date(venta.fechaVencimiento)
          const diasVencido = Math.floor((hoy - fechaVenc) / (1000 * 60 * 60 * 24))
          return { ...venta, diasVencido }
        })
        .sort((a, b) => b.diasVencido - a.diasVencido)
        .slice(0, 10) // Solo las 10 más vencidas

      return cuentasVencidas.map(cuenta => ({
        id: `cxc-${cuenta.id}`,
        type: 'cuenta_por_cobrar',
        title: 'Cuenta Por Cobrar Vencida',
        message: `${cuenta.cliente || 'Cliente'} - ${cuenta.tipoComprobante || cuenta.id} vencida hace ${cuenta.diasVencido} día(s)`,
        amount: cuenta.saldoPendiente || cuenta.total || 0,
        diasVencido: cuenta.diasVencido,
        date: cuenta.fechaVencimiento,
        link: '/finanzas/cuentas-cobrar',
        severity: cuenta.diasVencido > 30 ? 'error' : 'warning',
        read: false
      }))
    } catch (error) {
      console.error('Error al detectar cuentas por cobrar vencidas:', error)
      return []
    }
  }, [companyId])

  // Detectar cuentas por pagar vencidas
  const detectarCuentasPorPagarVencidas = useCallback(async () => {
    try {
      const facturas = await getFacturasProveedores(companyId)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      const facturasVencidas = facturas
        .filter(factura => {
          if (factura.estado === 'pagado') return false
          if (!factura.fechaVencimiento) return false
          const fechaVenc = new Date(factura.fechaVencimiento)
          fechaVenc.setHours(0, 0, 0, 0)
          return fechaVenc < hoy
        })
        .map(factura => {
          const fechaVenc = new Date(factura.fechaVencimiento)
          const diasVencido = Math.floor((hoy - fechaVenc) / (1000 * 60 * 60 * 24))
          return { ...factura, diasVencido }
        })
        .sort((a, b) => b.diasVencido - a.diasVencido)
        .slice(0, 10) // Solo las 10 más vencidas

      return facturasVencidas.map(factura => ({
        id: `cxp-${factura.id}`,
        type: 'cuenta_por_pagar',
        title: 'Cuenta Por Pagar Vencida',
        message: `${factura.proveedorNombre || 'Proveedor'} - Factura ${factura.numero} vencida hace ${factura.diasVencido} día(s)`,
        amount: factura.monto || 0,
        diasVencido: factura.diasVencido,
        date: factura.fechaVencimiento,
        link: '/finanzas/cuentas-pagar',
        severity: factura.diasVencido > 30 ? 'error' : 'warning',
        read: false
      }))
    } catch (error) {
      console.error('Error al detectar cuentas por pagar vencidas:', error)
      return []
    }
  }, [companyId])

  // Detectar cotizaciones por vencer (próximos 7 días)
  const detectarCotizacionesPorVencer = useCallback(async () => {
    try {
      const cotizaciones = await getCotizaciones(companyId)
      const cotizacionesActivas = cotizaciones.filter(c => 
        c.estado === 'Pendiente' || c.estado === 'Enviada'
      )
      
      const cotizacionesPorVencer = cotizacionesActivas
        .map(cotizacion => {
          const diasRestantes = calcularDiasHastaVencimiento(cotizacion.fechaVencimiento)
          return { ...cotizacion, diasRestantes }
        })
        .filter(c => c.diasRestantes !== null && c.diasRestantes >= 0 && c.diasRestantes <= 7)

      return cotizacionesPorVencer.map(cotizacion => ({
        id: `cotizacion-${cotizacion.id}`,
        type: 'cotizacion',
        title: cotizacion.diasRestantes === 0 
          ? 'Cotización Vence Hoy' 
          : 'Cotización Por Vencer',
        message: `Cotización ${cotizacion.numero || cotizacion.id} de ${cotizacion.cliente || 'Cliente'} vence en ${cotizacion.diasRestantes} día(s)`,
        cliente: cotizacion.cliente,
        total: cotizacion.total || 0,
        fechaVencimiento: cotizacion.fechaVencimiento,
        date: cotizacion.fechaVencimiento,
        link: '/ventas/cotizaciones',
        severity: cotizacion.diasRestantes <= 3 ? 'warning' : 'info',
        read: false
      }))
    } catch (error) {
      console.error('Error al detectar cotizaciones por vencer:', error)
      return []
    }
  }, [companyId])

  // Detectar stock bajo
  const detectarStockBajo = useCallback(async () => {
    try {
      const productos = await getProductos(companyId)
      const productosStockBajo = productos.filter(producto => {
        const stock = producto.stock || 0
        const stockMinimo = producto.stockMinimo || 0
        return stock > 0 && stock <= stockMinimo && stockMinimo > 0
      })
      .slice(0, 10) // Solo los 10 primeros

      return productosStockBajo.map(producto => ({
        id: `stock-${producto.id}`,
        type: 'stock',
        title: 'Stock Bajo',
        message: `${producto.nombre || 'Producto'} tiene stock bajo (${producto.stock || 0} unidades)`,
        producto: producto.nombre,
        stock: producto.stock || 0,
        stockMinimo: producto.stockMinimo || 0,
        date: new Date().toISOString(),
        link: '/inventarios',
        severity: producto.stock === 0 ? 'error' : 'warning',
        read: false
      }))
    } catch (error) {
      console.error('Error al detectar stock bajo:', error)
      return []
    }
  }, [companyId])

  // Cargar todas las notificaciones
  const loadNotifications = useCallback(async () => {
    if (!companyId) return
    
    try {
      setLoading(true)
      const [
        devoluciones,
        garantias,
        cuentasPorCobrar,
        cuentasPorPagar,
        cotizaciones,
        stockBajo
      ] = await Promise.all([
        detectarDevoluciones(),
        detectarGarantiasPorVencer(),
        detectarCuentasPorCobrarVencidas(),
        detectarCuentasPorPagarVencidas(),
        detectarCotizacionesPorVencer(),
        detectarStockBajo()
      ])

      const todasLasNotificaciones = [
        ...devoluciones,
        ...garantias,
        ...cuentasPorCobrar,
        ...cuentasPorPagar,
        ...cotizaciones,
        ...stockBajo
      ].sort((a, b) => new Date(b.date) - new Date(a.date))

      // Cargar estado de lectura desde localStorage
      const notificacionesLeidas = JSON.parse(
        localStorage.getItem('notificaciones_leidas') || '[]'
      )

      const notificacionesConEstado = todasLasNotificaciones.map(notif => ({
        ...notif,
        read: notificacionesLeidas.includes(notif.id)
      }))

      setNotifications(notificacionesConEstado)
      setUnreadCount(notificacionesConEstado.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }, [
    companyId,
    detectarDevoluciones,
    detectarGarantiasPorVencer,
    detectarCuentasPorCobrarVencidas,
    detectarCuentasPorPagarVencidas,
    detectarCotizacionesPorVencer,
    detectarStockBajo
  ])

  // Cargar notificaciones al montar y cada 5 minutos
  useEffect(() => {
    if (!companyId) return

    loadNotifications()
    const interval = setInterval(loadNotifications, 5 * 60 * 1000) // Cada 5 minutos

    return () => clearInterval(interval)
  }, [companyId, loadNotifications])

  // Marcar notificación como leída
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
      const notificacionesLeidas = updated
        .filter(n => n.read)
        .map(n => n.id)
      localStorage.setItem('notificaciones_leidas', JSON.stringify(notificacionesLeidas))
      setUnreadCount(updated.filter(n => !n.read).length)
      return updated
    })
  }, [])

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      const notificacionesLeidas = updated.map(n => n.id)
      localStorage.setItem('notificaciones_leidas', JSON.stringify(notificacionesLeidas))
      setUnreadCount(0)
      return updated
    })
  }, [])

  const value = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

