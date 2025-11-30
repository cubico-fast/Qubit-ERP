import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, DollarSign, Users, ShoppingCart } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useCurrency } from '../contexts/CurrencyContext'
import { getNetworkTime, getLastMonths } from '../utils/dateUtils'

const Reportes = () => {
  const { formatCurrency, convertValue, getCurrencySymbol } = useCurrency()
  const [periodo, setPeriodo] = useState('mes')
  
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
                  <p className="text-sm text-gray-600 mb-1">{metrica.titulo}</p>
                  <p className="text-2xl font-bold text-gray-900">{metrica.valor}</p>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Actividades</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Llamadas Realizadas</p>
            <p className="text-2xl font-bold text-primary-700">156</p>
            <p className="text-xs text-gray-500 mt-1">+12% vs mes anterior</p>
          </div>
          <div className="p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Reuniones Programadas</p>
            <p className="text-2xl font-bold text-secondary-700">42</p>
            <p className="text-xs text-gray-500 mt-1">+8% vs mes anterior</p>
          </div>
          <div className="p-4 bg-accent-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Emails Enviados</p>
            <p className="text-2xl font-bold text-accent-700">289</p>
            <p className="text-xs text-gray-500 mt-1">+15% vs mes anterior</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reportes

