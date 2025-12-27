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
const CalendarMonth = ({ month, fechaInicio, fechaFin, onDateClick, currentDate }) => {
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

  const isFutureDate = (date) => {
    if (!currentDate) return false
    const hoy = new Date(currentDate)
    hoy.setHours(23, 59, 59, 999)
    return date > hoy
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {diasSemana.map((dia) => (
          <div key={dia} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--color-text-secondary)' }}>
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
          const isFuture = isFutureDate(day)

          const getDayStyle = () => {
            if (isStart || isEnd) {
              return { backgroundColor: '#2563eb', color: '#ffffff' }
            }
            if (inRange) {
              return { backgroundColor: 'rgba(59, 130, 246, 0.2)' }
            }
            if (!isCurrentMonth || isFuture) {
              return { color: 'var(--color-text-secondary)', opacity: 0.5 }
            }
            return { color: 'var(--color-text)' }
          }

          return (
            <button
              key={idx}
              onClick={() => !isFuture && onDateClick(day)}
              disabled={isFuture}
              className={`
                h-10 text-sm rounded-lg transition-colors
                ${isStart || isEnd ? 'font-semibold' : ''}
                ${isStart && isEnd ? 'rounded-full' : ''}
                ${isFuture ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={getDayStyle()}
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
  
  // Estado para el rango de fechas seleccionado (inicializado como null hasta obtener fecha de red)
  const [fechaInicio, setFechaInicio] = useState(null)
  const [fechaFin, setFechaFin] = useState(null)
  const [fechasInicializadas, setFechasInicializadas] = useState(false)
  
  // Estado para el calendario
  const [showCalendar, setShowCalendar] = useState(false)
  const [tempFechaInicio, setTempFechaInicio] = useState(null)
  const [tempFechaFin, setTempFechaFin] = useState(null)
  const [currentMonthLeft, setCurrentMonthLeft] = useState(new Date())
  const [currentMonthRight, setCurrentMonthRight] = useState(addMonths(new Date(), 1))
  const [lastSelectedMonth, setLastSelectedMonth] = useState(null)
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
        
        // Siempre actualizar las fechas con la fecha de la red (más confiable)
        setFechaInicio(fechaInicioStr)
        setFechaFin(fechaFinStr)
        setFechasInicializadas(true) // Marcar que las fechas están inicializadas
        
        // Actualizar también los meses del calendario
        setCurrentMonthLeft(startOfMonth(networkDate))
        setCurrentMonthRight(startOfMonth(addMonths(networkDate, 1)))
        
        // Log para debugging
        console.log('📅 Fechas actualizadas:', {
          fechaInicio: fechaInicioStr,
          fechaFin: fechaFinStr,
          fechaRed: networkDate.toISOString().split('T')[0],
          mes: networkDate.getMonth() + 1,
          año: networkDate.getFullYear()
        })
      } catch (error) {
        console.error('Error al obtener fecha de la red:', error)
        // Fallback: usar fecha local si falla la red
        const hoy = new Date()
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        setFechaInicio(primerDiaMes.toISOString().split('T')[0])
        setFechaFin(hoy.toISOString().split('T')[0])
        setFechasInicializadas(true)
      }
    }
    updateDate()
    const interval = setInterval(updateDate, 60000) // Actualizar cada minuto
    return () => clearInterval(interval)
  }, []) // Sin dependencias para ejecutar solo al montar

  // No filtrar hasta que las fechas estén inicializadas
  if (!fechasInicializadas || !fechaInicio || !fechaFin) {
    console.log('⏳ Esperando inicialización de fechas...')
    // Retornar array vacío hasta que las fechas estén listas
    var ventasFiltradas = []
  } else {
    // Log inicial para ver qué fechas se están usando
    const ventasAnuladas = ventas.filter(v => v.estado === 'Anulada')
    console.log('🔍 Iniciando filtro de ventas:', {
      fechaInicio,
      fechaFin,
      totalVentas: ventas.length,
      ventasAnuladas: ventasAnuladas.length,
      ventasAnuladasDetalle: ventasAnuladas.map(v => ({
        id: v.id,
        fecha: v.fecha,
        total: v.total,
        estado: v.estado
      })),
      ventas: ventas.map(v => ({ 
        id: v.id, 
        fecha: v.fecha, 
        total: v.total,
        estado: v.estado,
        tipoFecha: typeof v.fecha
      }))
    })

    // Filtrar ventas por rango de fechas seleccionado usando el campo 'fecha' de Firestore
    // IMPORTANTE: Excluir ventas anuladas del cálculo
    var ventasFiltradas = ventas.filter(venta => {
      // Excluir ventas anuladas
      if (venta.estado === 'Anulada') {
        return false
      }
      
      // Usar el campo 'fecha' que se guarda en Firestore, NO createdAt ni updatedAt
      if (!venta.fecha) {
        console.warn('Venta sin campo fecha:', venta.id)
        return false
      }
      
      // Normalizar la fecha de la venta (puede venir en diferentes formatos)
      let fechaVenta = venta.fecha
      let fechaVentaNormalizada = null
      
      // Si es string, asegurarse de que esté en formato YYYY-MM-DD
      if (typeof fechaVenta === 'string') {
        // Si tiene hora (formato ISO), tomar solo la parte de la fecha
        if (fechaVenta.includes('T')) {
          fechaVenta = fechaVenta.split('T')[0]
        }
        // Si tiene espacios, tomar solo la parte antes del espacio
        if (fechaVenta.includes(' ')) {
          fechaVenta = fechaVenta.split(' ')[0]
        }
        // Validar y normalizar formato YYYY-MM-DD
        const fechaMatch = fechaVenta.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (fechaMatch) {
          const [, year, month, day] = fechaMatch
          // Asegurar formato correcto con padding de ceros
          fechaVentaNormalizada = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        } else {
          console.warn('Formato de fecha inválido:', fechaVenta, 'en venta:', venta.id)
          return false
        }
      } else if (fechaVenta?.toDate) {
        // Si es un Timestamp de Firestore (no debería pasar si se guarda como string)
        const date = fechaVenta.toDate()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        fechaVentaNormalizada = `${year}-${month}-${day}`
      } else if (fechaVenta instanceof Date) {
        // Si es un objeto Date
        const year = fechaVenta.getFullYear()
        const month = String(fechaVenta.getMonth() + 1).padStart(2, '0')
        const day = String(fechaVenta.getDate()).padStart(2, '0')
        fechaVentaNormalizada = `${year}-${month}-${day}`
      } else {
        console.warn('Tipo de fecha no reconocido:', typeof fechaVenta, 'en venta:', venta.id)
        return false
      }
      
      // Asegurar que fechaInicio y fechaFin también estén en formato YYYY-MM-DD correcto
      // Normalizar también las fechas de inicio y fin para asegurar consistencia
      let fechaInicioNormalizada = fechaInicio
      let fechaFinNormalizada = fechaFin
      
      // Validar formato de fechaInicio
      if (fechaInicioNormalizada && typeof fechaInicioNormalizada === 'string') {
        const inicioMatch = fechaInicioNormalizada.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (inicioMatch) {
          const [, year, month, day] = inicioMatch
          fechaInicioNormalizada = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
      }
      
      // Validar formato de fechaFin
      if (fechaFinNormalizada && typeof fechaFinNormalizada === 'string') {
        const finMatch = fechaFinNormalizada.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (finMatch) {
          const [, year, month, day] = finMatch
          fechaFinNormalizada = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
      }
      
      // Comparar fechas en formato YYYY-MM-DD (comparación lexicográfica funciona para este formato)
      // IMPORTANTE: Solo incluir si la fecha está estrictamente dentro del rango
      // Validar que todas las fechas estén normalizadas antes de comparar
      if (!fechaVentaNormalizada || !fechaInicioNormalizada || !fechaFinNormalizada) {
        console.warn('Fechas no normalizadas correctamente:', {
          fechaVenta: fechaVentaNormalizada,
          fechaInicio: fechaInicioNormalizada,
          fechaFin: fechaFinNormalizada
        })
        return false
      }
      
      // Extraer año y mes de las fechas para validación adicional
      const [ventaYear, ventaMonth] = fechaVentaNormalizada.split('-').map(Number)
      const [inicioYear, inicioMonth] = fechaInicioNormalizada.split('-').map(Number)
      const [finYear, finMonth] = fechaFinNormalizada.split('-').map(Number)
      
      // Validación estricta: la venta debe estar en el mismo mes que el rango seleccionado
      // Esto previene que ventas de meses anteriores se cuenten
      const estaEnRango = fechaVentaNormalizada >= fechaInicioNormalizada && fechaVentaNormalizada <= fechaFinNormalizada
      
      // Validación adicional: asegurar que el mes de la venta esté dentro del rango de meses del filtro
      // Si el rango abarca múltiples meses, verificar que la venta esté en alguno de esos meses
      const mesesEnRango = []
      let currentDate = new Date(inicioYear, inicioMonth - 1, 1)
      const endDate = new Date(finYear, finMonth - 1, 1)
      while (currentDate <= endDate) {
        mesesEnRango.push(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      }
      const mesVenta = `${ventaYear}-${String(ventaMonth).padStart(2, '0')}`
      const mesValido = mesesEnRango.includes(mesVenta)
      
      // Solo incluir si está en el rango Y el mes es válido
      const resultadoFinal = estaEnRango && mesValido
      
      // Log detallado para debugging
      if (resultadoFinal) {
        console.log(`✅ Venta ${venta.id} incluida:`, {
          fechaVentaOriginal: venta.fecha,
          fechaVentaNormalizada,
          mesVenta,
          fechaInicio: fechaInicioNormalizada,
          fechaFin: fechaFinNormalizada,
          mesesEnRango,
          total: venta.total
        })
      } else if (!mesValido && estaEnRango) {
        // Si está en el rango pero el mes no es válido, es un problema
        console.warn(`⚠️ Venta ${venta.id} en rango pero mes inválido:`, {
          fechaVentaOriginal: venta.fecha,
          fechaVentaNormalizada,
          mesVenta,
          mesesEnRango,
          total: venta.total
        })
      }
      
      return resultadoFinal
    })
  }

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

  // Mostrar datos reales siempre, incluso si están vacíos (no mostrar datos mock)

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

  // Mostrar todos los tipos de comprobante con datos reales (incluso si son 0)
  // Solo filtrar los que realmente tienen ventas para la gráfica
  let ventasPorTipoData = [
    { tipo: 'NV', ventas: convertValue(ventasPorTipo.NV), color: '#10b981' },
    { tipo: 'FA', ventas: convertValue(ventasPorTipo.FA), color: '#0ea5e9' },
    { tipo: 'BO', ventas: convertValue(ventasPorTipo.BO), color: '#f59e0b' },
    { tipo: 'NC', ventas: convertValue(ventasPorTipo.NC), color: '#ef4444' },
    { tipo: 'ND', ventas: convertValue(ventasPorTipo.ND), color: '#8b5cf6' }
  ].filter(item => item.ventas > 0) // Solo mostrar tipos con ventas > 0

  // No mostrar datos mock - siempre mostrar datos reales (incluso si están vacíos)

  // Calcular totales por tipo de comprobante (solo del rango seleccionado)
  const resumenComprobantes = [
    { tipo: 'Facturas', cantidad: 0, total: convertValue(ventasPorTipo.FA) },
    { tipo: 'Boletas', cantidad: 0, total: convertValue(ventasPorTipo.BO) },
    { tipo: 'Notas de Venta', cantidad: ventasFiltradas.length, total: convertValue(ventasPorTipo.NV) },
    { tipo: 'Notas de Créditos', cantidad: 0, total: convertValue(ventasPorTipo.NC) },
    { tipo: 'Notas de devolución', cantidad: 0, total: convertValue(ventasPorTipo.ND) }
  ]

  // Calcular ventas y compras totales (solo del rango seleccionado)
  // Usar siempre los datos reales filtrados por fecha
  const totalVentas = ventasFiltradas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
  const totalCompras = 0 // Por ahora no hay compras

  // Log para debugging - mostrar información del rango y totales
  console.log('📊 Resumen de ventas filtradas:', {
    fechaInicio,
    fechaFin,
    totalVentasEnRango: ventasFiltradas.length,
    totalMonto: totalVentas,
    totalVentasEnBD: ventas.length,
    ventasFiltradas: ventasFiltradas.map(v => ({
      id: v.id,
      fecha: v.fecha,
      total: v.total
    })),
    todasLasVentas: ventas.map(v => ({
      id: v.id,
      fecha: v.fecha,
      total: v.total
    }))
  })

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
          <h1 className="text-2xl md:text-3xl font-bold break-words" style={{ color: 'var(--color-text)' }}>Dashboard</h1>
          <p className="text-sm md:text-base mt-1" style={{ color: 'var(--color-text-secondary)' }}>Panel de control y estadísticas</p>
        </div>
        <div className="flex items-center space-x-2 text-xs md:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <Calendar size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="break-words">Usted tiene hasta el {getFechaLimite()}</span>
        </div>
      </div>

      {/* Selector de Rango de Fechas */}
      <div className="card p-4 md:p-6 w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div className="flex flex-col gap-4 md:gap-6 w-full">
          {/* Filtros */}
          <div className="w-full">
            <label className="block text-xs md:text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
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
                <label className="block text-xs md:text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
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
            <p className="text-xs md:text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Total de ventas en el período</p>
            <p className="text-xl md:text-2xl font-bold text-primary-600 break-words">{formatCurrency(totalVentas)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{ventasFiltradas.length} venta(s)</p>
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
          <div className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }} ref={calendarRef} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Seleccionar Período</h3>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Calendario Izquierdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        const nuevoMesIzq = subMonths(currentMonthLeft, 1)
                        const nuevoMesDer = subMonths(currentMonthRight, 1)
                        setCurrentMonthLeft(nuevoMesIzq)
                        setCurrentMonthRight(nuevoMesDer)
                        // Reiniciar fechas temporales cuando cambia el mes
                        setTempFechaInicio(null)
                        setTempFechaFin(null)
                        setLastSelectedMonth(null)
                      }}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h4 className="text-sm font-semibold capitalize" style={{ color: 'var(--color-text)' }}>
                      {format(currentMonthLeft, 'MMMM yyyy', { locale: es })}
                    </h4>
                    <button
                      onClick={() => {
                        const nuevoMesIzq = addMonths(currentMonthLeft, 1)
                        const nuevoMesDer = addMonths(currentMonthRight, 1)
                        setCurrentMonthLeft(nuevoMesIzq)
                        setCurrentMonthRight(nuevoMesDer)
                        // Reiniciar fechas temporales cuando cambia el mes
                        setTempFechaInicio(null)
                        setTempFechaFin(null)
                        setLastSelectedMonth(null)
                      }}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <CalendarMonth
                    month={currentMonthLeft}
                    fechaInicio={tempFechaInicio ? new Date(tempFechaInicio + 'T00:00:00') : null}
                    fechaFin={tempFechaFin ? new Date(tempFechaFin + 'T00:00:00') : null}
                    currentDate={currentDate}
                    onDateClick={(date) => {
                      // Validar que la fecha no sea futura
                      const hoy = new Date()
                      hoy.setHours(23, 59, 59, 999) // Fin del día actual
                      if (date > hoy) {
                        return // No permitir seleccionar fechas futuras
                      }

                      const dateStr = format(date, 'yyyy-MM-dd')
                      const inicioMes = startOfMonth(date)
                      const inicioMesStr = format(inicioMes, 'yyyy-MM-dd')
                      
                      // Siempre establecer desde el inicio del mes hasta la fecha seleccionada
                      setTempFechaInicio(inicioMesStr)
                      setTempFechaFin(dateStr)
                      setSelectingStart(true)
                      
                      // Detectar cambio de mes para reiniciar valores
                      const mesSeleccionado = format(date, 'yyyy-MM')
                      if (lastSelectedMonth && lastSelectedMonth !== mesSeleccionado) {
                        // El mes cambió, los valores se reiniciarán automáticamente al aplicar
                      }
                      setLastSelectedMonth(mesSeleccionado)
                    }}
                  />
                </div>

                {/* Calendario Derecho */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        const nuevoMesIzq = subMonths(currentMonthLeft, 1)
                        const nuevoMesDer = subMonths(currentMonthRight, 1)
                        setCurrentMonthLeft(nuevoMesIzq)
                        setCurrentMonthRight(nuevoMesDer)
                        // Reiniciar fechas temporales cuando cambia el mes
                        setTempFechaInicio(null)
                        setTempFechaFin(null)
                        setLastSelectedMonth(null)
                      }}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h4 className="text-sm font-semibold capitalize" style={{ color: 'var(--color-text)' }}>
                      {format(currentMonthRight, 'MMMM yyyy', { locale: es })}
                    </h4>
                    <button
                      onClick={() => {
                        const nuevoMesDer = addMonths(currentMonthRight, 1)
                        const nuevoMesIzq = addMonths(currentMonthLeft, 1)
                        setCurrentMonthRight(nuevoMesDer)
                        setCurrentMonthLeft(nuevoMesIzq)
                        // Reiniciar fechas temporales cuando cambia el mes
                        setTempFechaInicio(null)
                        setTempFechaFin(null)
                        setLastSelectedMonth(null)
                      }}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <CalendarMonth
                    month={currentMonthRight}
                    fechaInicio={tempFechaInicio ? new Date(tempFechaInicio + 'T00:00:00') : null}
                    fechaFin={tempFechaFin ? new Date(tempFechaFin + 'T00:00:00') : null}
                    currentDate={currentDate}
                    onDateClick={(date) => {
                      // Validar que la fecha no sea futura
                      const hoy = new Date()
                      hoy.setHours(23, 59, 59, 999) // Fin del día actual
                      if (date > hoy) {
                        return // No permitir seleccionar fechas futuras
                      }

                      const dateStr = format(date, 'yyyy-MM-dd')
                      const inicioMes = startOfMonth(date)
                      const inicioMesStr = format(inicioMes, 'yyyy-MM-dd')
                      
                      // Siempre establecer desde el inicio del mes hasta la fecha seleccionada
                      setTempFechaInicio(inicioMesStr)
                      setTempFechaFin(dateStr)
                      setSelectingStart(true)
                      
                      // Detectar cambio de mes para reiniciar valores
                      const mesSeleccionado = format(date, 'yyyy-MM')
                      if (lastSelectedMonth && lastSelectedMonth !== mesSeleccionado) {
                        // El mes cambió, los valores se reiniciarán automáticamente al aplicar
                      }
                      setLastSelectedMonth(mesSeleccionado)
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => {
                    setTempFechaInicio(null)
                    setTempFechaFin(null)
                    setShowCalendar(false)
                  }}
                  className="px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  style={{ 
                    border: '1px solid var(--color-border)', 
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-surface)'
                  }}
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
                      
                      // Detectar cambio de mes y reiniciar valores si es necesario
                      const mesActual = format(new Date(tempFechaInicio), 'yyyy-MM')
                      if (lastSelectedMonth && lastSelectedMonth !== mesActual) {
                        // Mes cambió, los valores se reiniciarán automáticamente porque las fechas cambiaron
                        setLastSelectedMonth(mesActual)
                      } else if (!lastSelectedMonth) {
                        setLastSelectedMonth(mesActual)
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
                  <p className="text-lg md:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stat.value}</p>
                  <p className="text-[10px] md:text-xs" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</p>
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
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Ventas por Vendedor</h3>
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
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Ventas por Tipo de Comprobante</h3>
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
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Resumen de Comprobantes</h3>
          <div className="space-y-3">
            {resumenComprobantes.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.tipo}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>({item.cantidad})</p>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ventas y Compras - Gráfico Vertical */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Ventas y Compras</h3>
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
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Resumen: Comprobantes no enviados a SUNAT</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            Ver Comprobantes
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-secondary)' }}>Fecha de emisión</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-secondary)' }}>Días de retraso</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-text-secondary)' }}>Relación de comprobantes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>{formatDate(currentDate)}</td>
                <td className="px-4 py-3">
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    0 días
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
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
