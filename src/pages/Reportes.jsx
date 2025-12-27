import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, DollarSign, Users, ShoppingCart } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useCurrency } from '../contexts/CurrencyContext'
import { getNetworkTime, getLastMonths, formatDate } from '../utils/dateUtils'
import { getVentas } from '../utils/firebaseUtils'

const Reportes = () => {
  const { formatCurrency, convertValue, getCurrencySymbol } = useCurrency()
  const [periodo, setPeriodo] = useState('mes')
  const [ventas, setVentas] = useState([])
  const [ventasMensuales, setVentasMensuales] = useState([])
  const [mesInicioSeleccionado, setMesInicioSeleccionado] = useState(null)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  // Función para obtener todos los meses del año actual
  const obtenerMesesDelAño = (fechaActual) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const año = fechaActual.getFullYear()
    const meses = []
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(año, i, 1)
      meses.push({
        mes: months[i],
        mesCompleto: months[i],
        fecha: monthDate,
        año: año,
        mesNumero: i + 1,
        mesKey: `${año}-${String(i + 1).padStart(2, '0')}`
      })
    }
    
    return meses
  }

  // Cargar ventas desde Firebase
  useEffect(() => {
    const loadVentas = async () => {
      try {
        const ventasData = await getVentas()
        setVentas(ventasData)
        
        // Inicializar mes de inicio con el primer mes del año (Enero)
        try {
          const networkDate = await getNetworkTime()
          setCurrentYear(networkDate.getFullYear())
          const primerMes = new Date(networkDate.getFullYear(), 0, 1) // Enero
          setMesInicioSeleccionado(primerMes)
        } catch (dateError) {
          console.warn('Error al obtener fecha de red, usando fecha local:', dateError)
          const hoy = new Date()
          setCurrentYear(hoy.getFullYear())
          const primerMes = new Date(hoy.getFullYear(), 0, 1)
          setMesInicioSeleccionado(primerMes)
        }
      } catch (error) {
        console.error('Error al cargar ventas:', error)
        const hoy = new Date()
        setCurrentYear(hoy.getFullYear())
        const primerMes = new Date(hoy.getFullYear(), 0, 1)
        setMesInicioSeleccionado(primerMes)
        setVentas([])
      }
    }
    
    loadVentas()
  }, [])

  // Calcular ventas mensuales reales basadas en los datos de Firebase
  useEffect(() => {
    const calcularVentasMensuales = async () => {
      if (!mesInicioSeleccionado) return
      
      try {
        let networkDate
        try {
          networkDate = await getNetworkTime()
        } catch (dateError) {
          console.warn('Error al obtener fecha de red, usando fecha local:', dateError)
          networkDate = new Date()
        }
        
        const añoActual = networkDate.getFullYear()
        const mesActual = networkDate.getMonth() + 1 // 1-12
        
        // Obtener todos los meses del año
        const todosLosMeses = obtenerMesesDelAño(networkDate)
        
        // Filtrar desde el mes seleccionado hasta el mes actual
        const mesInicio = mesInicioSeleccionado.getMonth() + 1
        const mesesFiltrados = todosLosMeses.filter(mesInfo => {
          return mesInfo.mesNumero >= mesInicio && mesInfo.mesNumero <= mesActual
        })
        
        // Filtrar solo ventas completadas (excluir anuladas)
        const ventasCompletadas = ventas.filter(v => v.estado === 'Completada')
        
        // Crear un mapa para agrupar ventas por mes
        const ventasPorMes = new Map()
        
        // Inicializar todos los meses del año con 0 (para mostrar todos en la gráfica)
        todosLosMeses.forEach(mesInfo => {
          ventasPorMes.set(mesInfo.mesKey, {
            mes: mesInfo.mes,
            ventas: 0,
            objetivo: convertValue(15000), // Objetivo fijo por ahora
            mostrar: mesInfo.mesNumero >= mesInicio && mesInfo.mesNumero <= mesActual
          })
        })
        
        // Agrupar ventas por mes
        ventasCompletadas.forEach(venta => {
          if (!venta.fecha) return
          
          // Normalizar fecha de la venta
          let fechaVenta = venta.fecha
          if (typeof fechaVenta === 'string') {
            if (fechaVenta.includes('T')) {
              fechaVenta = fechaVenta.split('T')[0]
            }
            if (fechaVenta.includes(' ')) {
              fechaVenta = fechaVenta.split(' ')[0]
            }
          }
          
          // Extraer año y mes de la fecha
          const fechaMatch = fechaVenta.match(/^(\d{4})-(\d{2})-(\d{2})/)
          if (fechaMatch) {
            const [, year, month] = fechaMatch
            const mesKey = `${year}-${month}`
            
            // Si el mes está en nuestro mapa, sumar la venta
            if (ventasPorMes.has(mesKey)) {
              const mesData = ventasPorMes.get(mesKey)
              mesData.ventas += parseFloat(venta.total) || 0
              ventasPorMes.set(mesKey, mesData)
            }
          }
        })
        
        // Convertir el mapa a array (mostrar todos los meses del año)
        // Si el mes no está en el rango seleccionado, mostrar 0 en ventas pero mantener el objetivo
        const ventasData = Array.from(ventasPorMes.values()).map(mesData => ({
          mes: mesData.mes,
          ventas: mesData.mostrar ? convertValue(mesData.ventas) : convertValue(0),
          objetivo: mesData.objetivo,
          mostrar: mesData.mostrar
        }))
        
        setVentasMensuales(ventasData)
      } catch (error) {
        console.error('Error al calcular ventas mensuales:', error)
        // Fallback: mostrar meses con 0 ventas
        try {
          const networkDate = await getNetworkTime()
          const todosLosMeses = obtenerMesesDelAño(networkDate)
          setVentasMensuales(todosLosMeses.map(mesInfo => ({
            mes: mesInfo.mes,
            ventas: convertValue(0),
            objetivo: convertValue(15000),
            mostrar: true
          })))
        } catch (fallbackError) {
          console.error('Error en fallback:', fallbackError)
        }
      }
    }
    
    if (ventas.length >= 0 && mesInicioSeleccionado) {
      calcularVentasMensuales()
    }
  }, [ventas, convertValue, mesInicioSeleccionado])
  
  // Función para generar datos iniciales
  const generateInitialVentasPorMes = () => {
    const mesesIniciales = getLastMonths(6)
    return mesesIniciales.map((mesInfo, index) => ({
      mes: mesInfo.mes,
      ventas: convertValue(12000 + (index * 2000)),
      clientes: 45 + (index * 3)
    }))
  }
  
  const [ventasPorMes, setVentasPorMes] = useState(() => generateInitialVentasPorMes())

  // Generar datos mensuales dinámicos basados en la fecha actual
  useEffect(() => {
    const updateVentasPorMes = async () => {
      try {
        const networkDate = await getNetworkTime()
        const meses = getLastMonths(6, networkDate)
        
        // Generar datos dinámicos (puedes conectarlos a datos reales)
        const ventasData = meses.map((mesInfo, index) => ({
          mes: mesInfo.mes,
          ventas: convertValue(12000 + (index * 2000)),
          clientes: 45 + (index * 3)
        }))
        
        setVentasPorMes(ventasData)
      } catch (error) {
        console.error('Error al obtener fecha de la red:', error)
        // Fallback
        const meses = getLastMonths(6)
        setVentasPorMes(meses.map((mesInfo, index) => ({
          mes: mesInfo.mes,
          ventas: convertValue(12000 + (index * 2000)),
          clientes: 45 + (index * 3)
        })))
      }
    }
    
    updateVentasPorMes()
    // Actualizar cada hora
    const interval = setInterval(updateVentasPorMes, 3600000)
    return () => clearInterval(interval)
  }, [convertValue])

  const productosData = [
    { name: 'Producto A', ventas: 35, ingresos: convertValue(42000) },
    { name: 'Producto B', ventas: 25, ingresos: convertValue(30000) },
    { name: 'Producto C', ventas: 20, ingresos: convertValue(24000) },
    { name: 'Producto D', ventas: 20, ingresos: convertValue(18000) },
  ]

  const canalesData = [
    { name: 'Web', value: 40, color: '#0ea5e9' },
    { name: 'Email', value: 30, color: '#a855f7' },
    { name: 'Directo', value: 20, color: '#d946ef' },
    { name: 'Referido', value: 10, color: '#7e22ce' },
  ]

  const metricas = [
    { titulo: 'Ingresos Totales', valor: formatCurrency(114000), cambio: '+15%', icon: DollarSign, bgColor: 'bg-primary-100', iconColor: 'text-primary-600' },
    { titulo: 'Nuevos Clientes', valor: '330', cambio: '+22%', icon: Users, bgColor: 'bg-secondary-100', iconColor: 'text-secondary-600' },
    { titulo: 'Ventas Totales', valor: '330', cambio: '+18%', icon: ShoppingCart, bgColor: 'bg-accent-100', iconColor: 'text-accent-600' },
    { titulo: 'Crecimiento', valor: '+17%', cambio: '+5%', icon: TrendingUp, bgColor: 'bg-primary-100', iconColor: 'text-primary-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">Análisis y estadísticas de tu negocio</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="año">Este Año</option>
          </select>
          <button className="btn-primary flex items-center space-x-2">
            <Download size={20} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricas.map((metrica, index) => {
          const Icon = metrica.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>{metrica.titulo}</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{metrica.valor}</p>
                  <p className="text-sm text-green-600 mt-1">{metrica.cambio}</p>
                </div>
                <div className={`p-3 rounded-lg ${metrica.bgColor}`}>
                  <Icon className={metrica.iconColor} size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart - Tendencia de Ventas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tendencia de Ventas</h3>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Mostrar desde:</label>
            <select
              value={mesInicioSeleccionado ? `${mesInicioSeleccionado.getFullYear()}-${String(mesInicioSeleccionado.getMonth() + 1).padStart(2, '0')}` : ''}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-')
                const fechaInicio = new Date(parseInt(year), parseInt(month) - 1, 1)
                setMesInicioSeleccionado(fechaInicio)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              {(() => {
                const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                return meses.map((mes, index) => (
                  <option key={index} value={`${currentYear}-${String(index + 1).padStart(2, '0')}`}>
                    {mes} {currentYear}
                  </option>
                ))
              })()}
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={ventasMensuales}>
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorObjetivo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="ventas" 
              stroke="#0ea5e9" 
              fillOpacity={1} 
              fill="url(#colorVentas)" 
              name="Ventas"
            />
            <Area 
              type="monotone" 
              dataKey="objetivo" 
              stroke="#a855f7" 
              fillOpacity={1} 
              fill="url(#colorObjetivo)" 
              name="Objetivo"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Ventas y Clientes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas y Clientes por Mes</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={ventasPorMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" stroke="#6b7280" />
            <YAxis yAxisId="left" stroke="#6b7280" />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="ventas" 
              stroke="#0ea5e9" 
              strokeWidth={3}
              name={`Ventas (${getCurrencySymbol()})`}
              dot={{ fill: '#0ea5e9', r: 5 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="clientes" 
              stroke="#a855f7" 
              strokeWidth={3}
              name="Clientes"
              dot={{ fill: '#a855f7', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráficos Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Producto */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Producto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productosData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Bar dataKey="ventas" fill="#0ea5e9" radius={[8, 8, 0, 0]} name="Ventas" />
              <Bar dataKey="ingresos" fill="#a855f7" radius={[8, 8, 0, 0]} name={`Ingresos (${getCurrencySymbol()})`} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Canales de Venta */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Canal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={canalesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {canalesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumen de Actividades */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Resumen de Actividades</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm mb-1 font-medium" style={{ color: 'var(--color-text)' }}>Llamadas Realizadas</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-600)' }}>156</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>+12% vs mes anterior</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm mb-1 font-medium" style={{ color: 'var(--color-text)' }}>Reuniones Programadas</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-600)' }}>42</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>+8% vs mes anterior</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm mb-1 font-medium" style={{ color: 'var(--color-text)' }}>Emails Enviados</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-600)' }}>289</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>+15% vs mes anterior</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reportes

