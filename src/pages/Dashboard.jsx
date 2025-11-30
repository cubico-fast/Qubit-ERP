import { useState, useEffect, useRef } from 'react'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  FileText,
  Send,
  XCircle,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  X
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { useCurrency } from '../contexts/CurrencyContext'
import { getNetworkTime, getLastMonths, formatDate, getCurrentDateSync } from '../utils/dateUtils'
import { getVentas } from '../utils/firebaseUtils'
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// Componente de Calendario Mensual
const CalendarMonth = ({ month, fechaInicio, fechaFin, onDateClick }) => {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const isInRange = (date) => {
    if (!fechaInicio || !fechaFin) return false
    return isWithinInterval(date, { start: fechaInicio, end: fechaFin })
  }

  const isStartDate = (date) => {
    if (!fechaInicio) return false
    return isSameDay(date, fechaInicio)
  }

  const isEndDate = (date) => {
    if (!fechaFin) return false
    return isSameDay(date, fechaFin)
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {diasSemana.map((dia) => (
          <div key={dia} className="text-center text-xs font-semibold text-gray-600 py-2">
            {dia}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, month)
          const inRange = isInRange(day)
          const isStart = isStartDate(day)
          const isEnd = isEndDate(day)

          return (
            <button
              key={idx}
              onClick={() => onDateClick(day)}
              className={`
                h-10 text-sm rounded-lg transition-colors
                ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900 hover:bg-gray-100'}
                ${inRange ? 'bg-blue-100' : ''}
                ${isStart ? 'bg-blue-600 text-white font-semibold' : ''}
                ${isEnd ? 'bg-blue-600 text-white font-semibold' : ''}
                ${isStart && isEnd ? 'rounded-full' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { formatCurrency, convertValue } = useCurrency()
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Estado para el rango de fechas seleccionado (inicializado con fecha actual de la red)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hoy = new Date()
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    return primerDiaMes.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0] // Usar el día actual en lugar del último día del mes
  })
  
  // Estado para el calendario
  const [showCalendar, setShowCalendar] = useState(false)
  const [tempFechaInicio, setTempFechaInicio] = useState(null)
  const [tempFechaFin, setTempFechaFin] = useState(null)
  const [currentMonthLeft, setCurrentMonthLeft] = useState(new Date())
  const [currentMonthRight, setCurrentMonthRight] = useState(addMonths(new Date(), 1))
  const [selectingStart, setSelectingStart] = useState(true)
  const calendarRef = useRef(null)
  
  // Estado para ubicaciones
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState('Todos')

  // Cargar ventas desde Firebase
  useEffect(() => {
    const loadVentas = async () => {
      try {
        const ventasData = await getVentas()
        setVentas(ventasData)
      } catch (error) {
        console.error('Error al cargar ventas:', error)
      } finally {
        setLoading(false)
      }
    }
    loadVentas()
  }, [])

  // Obtener fecha actual de la red y actualizar fechas por defecto
  useEffect(() => {
    const updateDate = async () => {
      try {
        const networkDate = await getNetworkTime()
        setCurrentDate(networkDate)
        
        // Actualizar fechas por defecto basadas en la fecha actual de la red
        const primerDiaMes = new Date(networkDate.getFullYear(), networkDate.getMonth(), 1)
        const fechaInicioStr = primerDiaMes.toISOString().split('T')[0]
        const fechaFinStr = networkDate.toISOString().split('T')[0]
        
        // Solo actualizar si las fechas son diferentes (para evitar loops infinitos)
        if (fechaInicio !== fechaInicioStr || fechaFin !== fechaFinStr) {
          setFechaInicio(fechaInicioStr)
          setFechaFin(fechaFinStr)
          
          // Actualizar también los meses del calendario
          setCurrentMonthLeft(startOfMonth(networkDate))
          setCurrentMonthRight(startOfMonth(addMonths(networkDate, 1)))
        }
      } catch (error) {
        console.error('Error al obtener fecha de la red:', error)
      }
    }
    updateDate()
    const interval = setInterval(updateDate, 60000) // Actualizar cada minuto
    return () => clearInterval(interval)
  }, [])

  // Filtrar ventas por rango de fechas seleccionado
  const ventasFiltradas = ventas.filter(venta => {
    if (!venta.fecha) return false
    // Normalizar la fecha de la venta (puede venir en diferentes formatos)
    let fechaVenta = venta.fecha
    if (typeof fechaVenta === 'string') {
      // Si es string, tomar solo la parte de la fecha (YYYY-MM-DD)
      fechaVenta = fechaVenta.split('T')[0]
    } else if (fechaVenta?.toDate) {
      // Si es un Timestamp de Firestore
      fechaVenta = fechaVenta.toDate().toISOString().split('T')[0]
    } else if (fechaVenta instanceof Date) {
      // Si es un objeto Date
      fechaVenta = fechaVenta.toISOString().split('T')[0]
    }
    // Comparar fechas en formato YYYY-MM-DD
    return fechaVenta >= fechaInicio && fechaVenta <= fechaFin
  })

  // Calcular estadísticas de comprobantes (solo para el rango seleccionado)
  const comprobantesStats = {
    rechazados: 0,
    enviados: 0,
    noGenerados: 0,
    generados: 0,
    aceptados: ventasFiltradas.filter(v => v.estado === 'Completada').length
  }

  // Calcular ventas por vendedor (usando cliente como vendedor por ahora) - solo del rango seleccionado
  const ventasPorVendedor = ventasFiltradas.reduce((acc, venta) => {
    const vendedor = venta.cliente || 'Sin asignar'
    if (!acc[vendedor]) {
      acc[vendedor] = 0
    }
    acc[vendedor] += parseFloat(venta.total) || 0
    return acc
  }, {})

  let ventasPorVendedorData = Object.entries(ventasPorVendedor)
    .map(([nombre, total]) => ({
      nombre: nombre.toUpperCase(),
      ventas: convertValue(total)
    }))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 5) // Top 5 vendedores

  // Si no hay datos, mostrar datos de ejemplo
  if (ventasPorVendedorData.length === 0) {
    ventasPorVendedorData = [
      { nombre: 'VENDEDOR 1', ventas: convertValue(50000) },
      { nombre: 'VENDEDOR 2', ventas: convertValue(10000) },
      { nombre: 'VENDEDOR 3', ventas: convertValue(5000) }
    ]
  }

  // Calcular ventas por tipo de comprobante
  const ventasPorTipo = {
    'FA': 0, // Facturas
    'BO': 0, // Boletas
    'NV': 0, // Notas de Venta
    'NC': 0, // Notas de Crédito
    'ND': 0  // Notas de Devolución
  }

  ventasFiltradas.forEach(venta => {
    // Por defecto, todas las ventas son Notas de Venta (NV)
    ventasPorTipo['NV'] += parseFloat(venta.total) || 0
  })

  let ventasPorTipoData = [
    { tipo: 'NV', ventas: convertValue(ventasPorTipo.NV), color: '#10b981' },
    { tipo: 'FA', ventas: convertValue(ventasPorTipo.FA), color: '#0ea5e9' },
    { tipo: 'BO', ventas: convertValue(ventasPorTipo.BO), color: '#f59e0b' },
    { tipo: 'NC', ventas: convertValue(ventasPorTipo.NC), color: '#ef4444' },
    { tipo: 'ND', ventas: convertValue(ventasPorTipo.ND), color: '#8b5cf6' }
  ].filter(item => item.ventas > 0)

  // Si no hay datos, mostrar datos de ejemplo
  if (ventasPorTipoData.length === 0) {
    ventasPorTipoData = [
      { tipo: 'NV', ventas: convertValue(58346.24), color: '#10b981' },
      { tipo: 'FA', ventas: convertValue(15000), color: '#0ea5e9' },
      { tipo: 'BO', ventas: convertValue(5000), color: '#f59e0b' }
    ]
  }

  // Calcular totales por tipo de comprobante (solo del rango seleccionado)
  const resumenComprobantes = [
    { tipo: 'Facturas', cantidad: 0, total: convertValue(ventasPorTipo.FA) },
    { tipo: 'Boletas', cantidad: 0, total: convertValue(ventasPorTipo.BO) },
    { tipo: 'Notas de Venta', cantidad: ventasFiltradas.length, total: convertValue(ventasPorTipo.NV) },
    { tipo: 'Notas de Créditos', cantidad: 0, total: convertValue(ventasPorTipo.NC) },
    { tipo: 'Notas de devolución', cantidad: 0, total: convertValue(ventasPorTipo.ND) }
  ]

  // Calcular ventas y compras totales (solo del rango seleccionado)
  const totalVentas = ventasFiltradas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
  const totalCompras = 0 // Por ahora no hay compras

  const ventasComprasData = [
    { tipo: 'Ventas', monto: convertValue(totalVentas), color: '#f59e0b' },
    { tipo: 'Compras', monto: convertValue(totalCompras), color: '#0ea5e9' }
  ]

  // Obtener fecha límite (3 días hábiles desde hoy)
  const getFechaLimite = () => {
    const fecha = new Date(currentDate)
    let diasHabiles = 0
    let diasAgregados = 0
    
    while (diasHabiles < 3) {
      fecha.setDate(fecha.getDate() + 1)
      diasAgregados++
      const diaSemana = fecha.getDay()
      if (diaSemana !== 0 && diaSemana !== 6) { // No es domingo ni sábado
        diasHabiles++
      }
    }
    
    return formatDate(fecha)
  }

  const statCards = [
    {
      title: 'RECHAZADOS',
      value: comprobantesStats.rechazados,
      label: 'Comprobantes',
      icon: XCircle,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-800'
    },
    {
      title: 'ENVIADOS',
      value: comprobantesStats.enviados,
      label: 'Comprobantes',
      icon: Send,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-800'
    },
    {
      title: 'NO GENERADOS',
      value: comprobantesStats.noGenerados,
      label: 'Comprobantes',
      icon: AlertCircle,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-800'
    },
    {
      title: 'GENERADOS',
      value: comprobantesStats.generados,
      label: 'Comprobantes',
      icon: FileText,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800'
    },
    {
      title: 'ACEPTADOS',
      value: comprobantesStats.aceptados,
      label: 'Comprobantes',
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-800'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="space-y-4 md:space-y-6 w-full" 
      style={{ 
        width: '100%', 
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        padding: 0,
        margin: 0
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-4 w-full">
        <div className="w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Panel de control y estadísticas</p>
        </div>
        <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600">
          <Calendar size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="break-words">Usted tiene hasta el {getFechaLimite()}</span>
        </div>
      </div>

      {/* Selector de Rango de Fechas */}
      <div className="card p-4 md:p-6 w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div className="flex flex-col gap-4 md:gap-6 w-full">
          {/* Filtros */}
          <div className="w-full">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full">
              <div className="relative flex-1 w-full min-w-0">
                <input
                  type="text"
                  readOnly
                  value={(() => {
                    // Formatear fechas exactamente como se muestran en el calendario (DD/MM/YYYY)
                    const formatFechaCalendario = (fechaStr) => {
                      if (!fechaStr) return ''
                      try {
                        const fecha = parseISO(fechaStr)
                        return format(fecha, 'dd/MM/yyyy')
                      } catch {
                        return fechaStr
                      }
                    }
                    return `${formatFechaCalendario(fechaInicio)} - ${formatFechaCalendario(fechaFin)}`
                  })()}
                  onClick={async () => {
                    // Obtener la fecha actual de la red para mostrar el calendario correcto
                    try {
                      const networkDate = await getNetworkTime()
                      setCurrentMonthLeft(startOfMonth(networkDate))
                      setCurrentMonthRight(startOfMonth(addMonths(networkDate, 1)))
                    } catch (error) {
                      // Si falla, usar la fecha local
                      const hoy = new Date()
                      setCurrentMonthLeft(startOfMonth(hoy))
                      setCurrentMonthRight(startOfMonth(addMonths(hoy, 1)))
                    }
                    
                    setTempFechaInicio(fechaInicio)
                    setTempFechaFin(fechaFin)
                    setSelectingStart(true)
                    setShowCalendar(true)
                  }}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer bg-white"
                  placeholder="Seleccionar período"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                <Calendar 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
                  size={18} 
                />
              </div>
              <div className="flex-1 w-full min-w-0">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Ubicaciones
                </label>
                <select
                  value={ubicacionSeleccionada}
                  onChange={(e) => setUbicacionSeleccionada(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="Todos">Todos</option>
                  <option value="Principal">Principal</option>
                  <option value="Secundario">Secundario</option>
                </select>
              </div>
              <button
                onClick={() => {
                  // Botón buscar - recargar datos con filtros
                  window.location.reload()
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 w-full sm:w-auto"
                style={{ minHeight: '42px' }}
              >
                <Search size={18} />
                Buscar
              </button>
            </div>
          </div>
          {/* Resumen de ventas */}
          <div className="w-full pt-3 md:pt-0 border-t md:border-t-0 border-gray-200 md:border-0">
            <div className="text-left md:text-right">
              <p className="text-xs md:text-sm text-gray-600 mb-1">Total de ventas en el período</p>
              <p className="text-xl md:text-2xl font-bold text-primary-600 break-words">{formatCurrency(totalVentas)}</p>
              <p className="text-xs text-gray-500 mt-1">{ventasFiltradas.length} venta(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Calendario */}
      {showCalendar && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCalendar(false)
          }
        }}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" ref={calendarRef} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Seleccionar Período</h3>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Calendario Izquierdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonthLeft(subMonths(currentMonthLeft, 1))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {format(currentMonthLeft, 'MMMM yyyy', { locale: es })}
                    </h4>
                    <button
                      onClick={() => {
                        setCurrentMonthLeft(addMonths(currentMonthLeft, 1))
                        setCurrentMonthRight(addMonths(currentMonthRight, 1))
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <CalendarMonth
                    month={currentMonthLeft}
                    fechaInicio={tempFechaInicio ? new Date(tempFechaInicio + 'T00:00:00') : null}
                    fechaFin={tempFechaFin ? new Date(tempFechaFin + 'T00:00:00') : null}
                    onDateClick={(date) => {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      if (selectingStart || !tempFechaInicio || dateStr < tempFechaInicio) {
                        setTempFechaInicio(dateStr)
                        setTempFechaFin(null)
                        setSelectingStart(false)
                      } else {
                        setTempFechaFin(dateStr)
                        setSelectingStart(true)
                      }
                    }}
                  />
                </div>

                {/* Calendario Derecho */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        setCurrentMonthLeft(subMonths(currentMonthLeft, 1))
                        setCurrentMonthRight(subMonths(currentMonthRight, 1))
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {format(currentMonthRight, 'MMMM yyyy', { locale: es })}
                    </h4>
                    <button
                      onClick={() => setCurrentMonthRight(addMonths(currentMonthRight, 1))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <CalendarMonth
                    month={currentMonthRight}
                    fechaInicio={tempFechaInicio ? new Date(tempFechaInicio + 'T00:00:00') : null}
                    fechaFin={tempFechaFin ? new Date(tempFechaFin + 'T00:00:00') : null}
                    onDateClick={(date) => {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      if (selectingStart || !tempFechaInicio || dateStr < tempFechaInicio) {
                        setTempFechaInicio(dateStr)
                        setTempFechaFin(null)
                        setSelectingStart(false)
                      } else {
                        setTempFechaFin(dateStr)
                        setSelectingStart(true)
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setTempFechaInicio(null)
                    setTempFechaFin(null)
                    setShowCalendar(false)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (tempFechaInicio) {
                      setFechaInicio(tempFechaInicio)
                      if (tempFechaFin) {
                        setFechaFin(tempFechaFin)
                      } else {
                        setFechaFin(tempFechaInicio)
                      }
                    }
                    setShowCalendar(false)
                    setSelectingStart(true)
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de Estado de Comprobantes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card p-3 md:p-6 w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-2 md:p-3 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                  <Icon className={`${stat.iconColor} w-5 h-5 md:w-6 md:h-6`} />
                </div>
                <div className="text-center flex-1 min-w-0 w-full">
                  <p className={`text-[10px] md:text-xs font-medium ${stat.textColor} mb-1 break-words`}>{stat.title}</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Fila de Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Vendedor - Gráfico Horizontal */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Vendedor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasPorVendedorData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" tickFormatter={(value) => formatCurrency(value)} />
              <YAxis dataKey="nombre" type="category" stroke="#6b7280" width={120} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="ventas" fill="#0ea5e9" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ventas por Tipo de Comprobante - Gráfico Horizontal */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Tipo de Comprobante</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasPorTipoData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" tickFormatter={(value) => formatCurrency(value)} />
              <YAxis dataKey="tipo" type="category" stroke="#6b7280" width={80} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="ventas" radius={[0, 8, 8, 0]}>
                {ventasPorTipoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segunda Fila - Resumen y Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen de Comprobantes */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Comprobantes</h3>
          <div className="space-y-3">
            {resumenComprobantes.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.tipo}</p>
                  <p className="text-xs text-gray-500">({item.cantidad})</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ventas y Compras - Gráfico Vertical */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas y Compras</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasComprasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="tipo" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="monto" radius={[8, 8, 0, 0]}>
                {ventasComprasData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumen de Comprobantes no enviados a SUNAT */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Resumen: Comprobantes no enviados a SUNAT</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            Ver Comprobantes
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha de emisión</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días de retraso</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Relación de comprobantes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(currentDate)}</td>
                <td className="px-4 py-3">
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    0 días
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <span className="mr-2">0 FA</span>
                  <span className="mr-2">0 BO</span>
                  <span className="mr-2">0 NC</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>Nota:</strong> Los comprobantes electrónicos deben ser enviados a la SUNAT dentro de un plazo de 3 días hábiles contados desde la fecha de emisión del comprobante.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
