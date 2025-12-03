import { useState, useEffect, useRef } from 'react'
import { Search, DollarSign, TrendingUp, Calendar, X, Eye, FileText, Package, XCircle, Edit, Plus } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas, updateVenta, getProductos, updateProducto } from '../utils/firebaseUtils'
import { getCurrentDateSync, formatDate, getNetworkTime, getLastMonths } from '../utils/dateUtils'

const Ventas = () => {
  const { formatCurrency, convertValue } = useCurrency()
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [ventasMensuales, setVentasMensuales] = useState([])
  const [mesInicioSeleccionado, setMesInicioSeleccionado] = useState(null) // Mes desde el cual mostrar la gráfica
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

  // Cargar ventas desde Firebase al montar el componente
  useEffect(() => {
    const loadVentas = async () => {
      try {
        setLoading(true)
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
          // Fallback para mes de inicio
          const hoy = new Date()
          setCurrentYear(hoy.getFullYear())
          const primerMes = new Date(hoy.getFullYear(), 0, 1)
          setMesInicioSeleccionado(primerMes)
        }
      } catch (error) {
        console.error('Error al cargar ventas:', error)
        // Solo mostrar alert si es un error crítico, no para errores menores
        if (error.message && !error.message.includes('permission')) {
          alert('Error al cargar ventas. Por favor, recarga la página.')
        }
        // Fallback para mes de inicio
        const hoy = new Date()
        setCurrentYear(hoy.getFullYear())
        const primerMes = new Date(hoy.getFullYear(), 0, 1)
        setMesInicioSeleccionado(primerMes)
        // Inicializar con array vacío para evitar errores
        setVentas([])
      } finally {
        setLoading(false)
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
    
    if ((ventas.length > 0 || !loading) && mesInicioSeleccionado) {
      calcularVentasMensuales()
    }
  }, [ventas, convertValue, loading, mesInicioSeleccionado])

  const [searchTerm, setSearchTerm] = useState('')
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)

  const filteredVentas = ventas.filter(venta => {
    const searchLower = searchTerm.toLowerCase()
    return (
      venta.vendedor?.toLowerCase().includes(searchLower) ||
      venta.cliente?.toLowerCase().includes(searchLower) ||
      venta.tipoComprobante?.toLowerCase().includes(searchLower) ||
      venta.productos?.some(p => p.nombre?.toLowerCase().includes(searchLower)) ||
      venta.id?.toLowerCase().includes(searchLower)
    )
  })

  // Calcular totales excluyendo ventas anuladas
  const ventasCompletadasList = ventas.filter(v => v.estado === 'Completada')
  const ventasAnuladasList = ventas.filter(v => v.estado === 'Anulada')
  
  const totalVentas = ventasCompletadasList.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
  const ventasCompletadas = ventasCompletadasList.length
  const ventasAnuladas = ventasAnuladasList.length
  const totalEliminados = ventasAnuladasList.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
  const totalProductosVendidos = ventasCompletadasList.reduce((sum, v) => sum + (parseInt(v.totalProductos) || 0), 0)

  const handleVerDetalle = (venta) => {
    setVentaSeleccionada(venta)
    setShowDetalleModal(true)
  }

  const handleEditarVenta = (venta) => {
    setVentaSeleccionada(venta)
    setShowEditarModal(true)
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando historial de ventas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registro de Ventas</h1>
        <p className="text-gray-600 mt-1">Historial completo de todas las ventas realizadas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalVentas)}</p>
              <p className="text-xs text-gray-500 mt-1">{ventasCompletadas} venta(s) completada(s)</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-100">
              <DollarSign className="text-primary-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ventas Completadas</p>
              <p className="text-2xl font-bold text-green-600">{ventasCompletadas}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Eliminados</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalEliminados)}</p>
              <p className="text-xs text-gray-500 mt-1">{ventasAnuladas} venta(s) anulada(s)</p>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Productos Vendidos</p>
              <p className="text-2xl font-bold text-secondary-600">{totalProductosVendidos}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary-100">
              <Package className="text-secondary-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar ventas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden border-2 border-gray-300 shadow-lg">
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={24} />
              Registro de Transacciones
            </h2>
            <span className="text-sm font-medium text-gray-700 bg-white px-3 py-1 rounded-lg border border-gray-300">
              Total: <strong className="text-primary-600">{filteredVentas.length}</strong> registro(s)
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-200 border-b-2 border-gray-400">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-400">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-400">
                  Vendedor
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-400">
                  Tipo Comprobante
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-400">
                  Productos
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-400">
                  Subtotal
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-400">
                  Impuesto
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-400">
                  Total
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-400">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-300">
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center bg-gray-50">
                    <div className="flex flex-col items-center">
                      <FileText size={48} className="text-gray-400 mb-4" />
                      <p className="text-lg font-semibold text-gray-700">No hay registros de ventas</p>
                      <p className="text-sm text-gray-500 mt-2">Las ventas realizadas aparecerán aquí</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVentas.map((venta, index) => (
                  <tr 
                    key={venta.id} 
                    className={`hover:bg-blue-50 transition-colors border-b border-gray-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {venta.fecha ? formatDate(venta.fecha) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{venta.vendedor || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{venta.tipoComprobante || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {venta.productos && venta.productos.length > 0 ? (
                          <div>
                            <span className="font-medium">{venta.totalProductos || venta.productos.length} producto(s)</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {venta.productos.slice(0, 2).map(p => p.nombre).join(', ')}
                              {venta.productos.length > 2 && ` +${venta.productos.length - 2} más`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin productos</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right border-r border-gray-200">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(venta.subtotal || 0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right border-r border-gray-200">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(venta.impuesto || 0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right border-r border-gray-200">
                      <div className="text-base font-bold text-primary-600">
                        {formatCurrency(venta.total || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center border-r border-gray-200">
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                        venta.estado === 'Completada'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : venta.estado === 'Anulada'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      }`}>
                        {venta.estado || 'Completada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleVerDetalle(venta)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 border border-blue-200"
                          title="Ver detalles completos"
                        >
                          <Eye size={18} />
                          <span className="text-sm font-medium">Ver</span>
                        </button>
                        {venta.estado === 'Completada' && (
                          <button
                            onClick={() => handleEditarVenta(venta)}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 border border-green-200"
                            title="Editar venta"
                          >
                            <Edit size={18} />
                            <span className="text-sm font-medium">Editar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {/* Modal de Detalles de Venta */}
      {showDetalleModal && ventaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Detalles de la Venta</h2>
              <button
                onClick={() => {
                  setShowDetalleModal(false)
                  setVentaSeleccionada(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <p className="text-sm text-gray-900">{ventaSeleccionada.fecha ? formatDate(ventaSeleccionada.fecha) : '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
                  <p className="text-sm text-gray-900">{ventaSeleccionada.vendedor || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Comprobante</label>
                  <p className="text-sm text-gray-900">{ventaSeleccionada.tipoComprobante || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                  <p className="text-sm text-gray-900">{ventaSeleccionada.moneda || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label>
                  <p className="text-sm text-gray-900">{ventaSeleccionada.formaPago || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    ventaSeleccionada.estado === 'Completada'
                      ? 'bg-green-100 text-green-800'
                      : ventaSeleccionada.estado === 'Pendiente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {ventaSeleccionada.estado || 'Completada'}
                  </span>
                </div>
              </div>

              {/* Productos */}
              {ventaSeleccionada.productos && ventaSeleccionada.productos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Productos</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descuento</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {ventaSeleccionada.productos.map((producto, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {producto.codigoInterno && `${producto.codigoInterno} - `}
                              {producto.nombre}
                              {producto.presentacion && ` (${producto.presentacion})`}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{producto.cantidad}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(producto.precioUnitario || 0)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(producto.descuentoMonto || 0)}</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{formatCurrency(producto.subtotal || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totales */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(ventaSeleccionada.subtotal || 0)}</span>
                  </div>
                  {ventaSeleccionada.descuento > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Descuento:</span>
                      <span className="text-sm font-medium text-red-600">-{formatCurrency(ventaSeleccionada.descuento || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Impuesto (15.25%):</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(ventaSeleccionada.impuesto || 0)}</span>
                  </div>
                  {ventaSeleccionada.icbper > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ICBPER:</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(ventaSeleccionada.icbper || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-base font-semibold text-gray-900">Total:</span>
                    <span className="text-base font-bold text-primary-600">{formatCurrency(ventaSeleccionada.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Venta */}
      {showEditarModal && ventaSeleccionada && (
        <EditarVentaModal
          venta={ventaSeleccionada}
          onClose={() => {
            setShowEditarModal(false)
            setVentaSeleccionada(null)
            // Recargar ventas
            const loadVentas = async () => {
              try {
                const ventasData = await getVentas()
                setVentas(ventasData)
              } catch (error) {
                console.error('Error al cargar ventas:', error)
              }
            }
            loadVentas()
          }}
        />
      )}

    </div>
  )
}

// Componente Modal para Editar Venta
const EditarVentaModal = ({ venta, onClose }) => {
  const { formatCurrency } = useCurrency()
  const [productos, setProductos] = useState([])
  const [productosVenta, setProductosVenta] = useState([])
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productosSugeridos, setProductosSugeridos] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [loading, setLoading] = useState(false)
  const busquedaRef = useRef(null)

  // Cargar productos disponibles
  useEffect(() => {
    const loadProductos = async () => {
      try {
        const productosData = await getProductos()
        setProductos(productosData)
      } catch (error) {
        console.error('Error al cargar productos:', error)
      }
    }
    loadProductos()
  }, [])

  // Inicializar productos de la venta
  useEffect(() => {
    if (venta && venta.productos) {
      // Convertir productos de la venta al formato editable
      const productosEditables = venta.productos.map(p => ({
        ...p,
        id: p.productoId || p.id,
        precio: p.precioUnitario || 0,
        cantidad: p.cantidad || 1,
        descuento: p.descuentoMonto || 0,
        subtotal: p.subtotal || 0
      }))
      setProductosVenta(productosEditables)
    }
  }, [venta])

  // Filtrar productos según la búsqueda
  useEffect(() => {
    if (busquedaProducto.trim() === '') {
      setProductosSugeridos([])
      setMostrarSugerencias(false)
      return
    }

    const terminoBusqueda = busquedaProducto.toLowerCase().trim()
    const palabras = terminoBusqueda.split(' ').filter(p => p.length > 0)

    const productosFiltrados = productos.filter(producto => {
      const nombreProducto = (producto.nombre || '').toLowerCase()
      const descripcionProducto = (producto.descripcion || '').toLowerCase()
      const codigoInterno = (producto.codigoInterno || '').toLowerCase()
      const codigoBarra = (producto.codigoBarra || '').toLowerCase()

      return palabras.every(palabra => 
        nombreProducto.includes(palabra) ||
        descripcionProducto.includes(palabra) ||
        codigoInterno.includes(palabra) ||
        codigoBarra.includes(palabra)
      )
    }).slice(0, 10)

    setProductosSugeridos(productosFiltrados)
    setMostrarSugerencias(productosFiltrados.length > 0)
  }, [busquedaProducto, productos])

  // Calcular totales
  const calcularTotales = (productosList) => {
    const TASA_IMPUESTO = 0.1525
    
    const totalProductos = productosList.reduce((sum, p) => {
      const precioConImpuesto = parseFloat(p.precioUnitario || p.precio || 0)
      const cantidad = parseInt(p.cantidad) || 1
      const descuento = parseFloat(p.descuentoMonto || p.descuento || 0)
      return sum + ((precioConImpuesto * cantidad) - descuento)
    }, 0)
    
    const descuentoGeneral = parseFloat(venta.descuento) || 0
    const totalDespuesDescuento = totalProductos - descuentoGeneral
    const subtotalFinal = totalDespuesDescuento - (totalDespuesDescuento * TASA_IMPUESTO)
    const baseImponible = subtotalFinal
    const impuestoFinal = totalDespuesDescuento - subtotalFinal
    const icbperFinal = parseFloat(venta.icbper) || 0
    const totalFinal = subtotalFinal + impuestoFinal + icbperFinal

    return {
      subtotal: subtotalFinal,
      baseImponible,
      impuesto: impuestoFinal,
      total: totalFinal,
      totalProductos: productosList.length
    }
  }

  const handleSeleccionarProducto = (producto) => {
    const precioInicial = producto.precio || producto.presentaciones?.[0]?.precioVenta || 0
    const presentacionInicial = producto.presentaciones?.[0] || null
    
    // Verificar si el producto ya está en la venta
    const productoExistente = productosVenta.find(p => (p.productoId || p.id) === producto.id)
    
    if (productoExistente) {
      // Si ya existe, aumentar la cantidad
      setProductosVenta(productosVenta.map(p => {
        if ((p.productoId || p.id) === producto.id) {
          const nuevaCantidad = (p.cantidad || 1) + 1
          const precioUnitario = p.precioUnitario || p.precio || 0
          const descuentoMonto = p.descuentoMonto || p.descuento || 0
          const nuevoSubtotal = (precioUnitario * nuevaCantidad) - descuentoMonto
          return {
            ...p,
            cantidad: nuevaCantidad,
            subtotal: nuevoSubtotal
          }
        }
        return p
      }))
    } else {
      // Agregar nuevo producto
      const nuevoProducto = {
        productoId: producto.id,
        codigoInterno: producto.codigoInterno || '',
        codigoBarra: producto.codigoBarra || '',
        nombre: producto.nombre,
        cantidad: 1,
        precioUnitario: precioInicial,
        precio: precioInicial,
        costoUnitario: producto.precioCompra || 0,
        descuentoPorcentaje: 0,
        descuentoMonto: 0,
        descuento: 0,
        subtotal: precioInicial,
        presentacion: presentacionInicial?.presentacion || 'Unidad',
        unidad: producto.unidad || 'UNIDAD'
      }
      setProductosVenta([...productosVenta, nuevoProducto])
    }

    setBusquedaProducto('')
    setMostrarSugerencias(false)
  }

  const handleEliminarProducto = (index) => {
    setProductosVenta(productosVenta.filter((_, i) => i !== index))
  }

  const handleCambiarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) nuevaCantidad = 1
    
    setProductosVenta(productosVenta.map((p, i) => {
      if (i === index) {
        const precioUnitario = p.precioUnitario || p.precio || 0
        const descuentoMonto = p.descuentoMonto || p.descuento || 0
        const nuevoSubtotal = (precioUnitario * nuevaCantidad) - descuentoMonto
        return {
          ...p,
          cantidad: nuevaCantidad,
          subtotal: nuevoSubtotal
        }
      }
      return p
    }))
  }

  const handleGuardarCambios = async () => {
    if (productosVenta.length === 0) {
      alert('La venta debe tener al menos un producto')
      return
    }

    setLoading(true)
    try {
      // Obtener productos originales para comparar cambios en stock
      const productosOriginales = venta.productos || []
      const productosActuales = productosVenta

      // Calcular diferencias en productos
      const productosOriginalesMap = new Map()
      productosOriginales.forEach(p => {
        const id = p.productoId || p.id
        productosOriginalesMap.set(id, {
          cantidad: p.cantidad || 0,
          producto: p
        })
      })

      const productosActualesMap = new Map()
      productosActuales.forEach(p => {
        const id = p.productoId || p.id
        const cantidadActual = productosActualesMap.get(id)?.cantidad || 0
        productosActualesMap.set(id, {
          cantidad: cantidadActual + (p.cantidad || 0),
          producto: p
        })
      })

      // Actualizar stock
      const todosProductos = await getProductos()
      
      // Productos eliminados o con cantidad reducida: devolver al stock
      for (const [id, original] of productosOriginalesMap.entries()) {
        const actual = productosActualesMap.get(id)
        const cantidadOriginal = original.cantidad
        const cantidadActual = actual ? actual.cantidad : 0
        const diferencia = cantidadOriginal - cantidadActual

        if (diferencia > 0) {
          const productoOriginal = todosProductos.find(p => p.id === id)
          if (productoOriginal) {
            const nuevoStock = (productoOriginal.stock || 0) + diferencia
            await updateProducto(productoOriginal.id, { stock: nuevoStock })
          }
        }
      }

      // Productos añadidos o con cantidad aumentada: reducir stock
      for (const [id, actual] of productosActualesMap.entries()) {
        const original = productosOriginalesMap.get(id)
        const cantidadOriginal = original ? original.cantidad : 0
        const cantidadActual = actual.cantidad
        const diferencia = cantidadActual - cantidadOriginal

        if (diferencia > 0) {
          const productoOriginal = todosProductos.find(p => p.id === id)
          if (productoOriginal) {
            const stockActual = productoOriginal.stock || 0
            if (stockActual < diferencia) {
              alert(`No hay suficiente stock para ${productoOriginal.nombre}. Stock disponible: ${stockActual}, necesario: ${diferencia}`)
              setLoading(false)
              return
            }
            const nuevoStock = stockActual - diferencia
            await updateProducto(productoOriginal.id, { stock: nuevoStock })
          }
        }
      }

      // Preparar productos para guardar
      const productosParaGuardar = productosActuales.map(p => ({
        productoId: p.productoId || p.id,
        codigoInterno: p.codigoInterno || '',
        codigoBarra: p.codigoBarra || '',
        nombre: p.nombre,
        cantidad: parseInt(p.cantidad) || 1,
        precioUnitario: parseFloat(p.precioUnitario || p.precio || 0),
        costoUnitario: p.costoUnitario || 0,
        descuentoPorcentaje: p.descuentoPorcentaje || 0,
        descuentoMonto: parseFloat(p.descuentoMonto || p.descuento || 0),
        subtotal: parseFloat(p.subtotal || 0),
        presentacion: p.presentacion || 'Unidad',
        unidad: p.unidad || 'UNIDAD'
      }))

      // Calcular totales
      const totales = calcularTotales(productosParaGuardar)

      // Actualizar venta
      const ventaActualizada = {
        productos: productosParaGuardar,
        totalProductos: totales.totalProductos,
        subtotal: totales.subtotal,
        baseImponible: totales.baseImponible,
        impuesto: totales.impuesto,
        total: totales.total,
        // Mantener otros campos
        fecha: venta.fecha,
        vendedor: venta.vendedor,
        local: venta.local,
        almacen: venta.almacen,
        moneda: venta.moneda,
        tipoCambio: venta.tipoCambio,
        tipoComprobante: venta.tipoComprobante,
        descuento: venta.descuento,
        icbper: venta.icbper,
        retencion: venta.retencion,
        totalRetenido: venta.totalRetenido,
        formaPago: venta.formaPago,
        estado: venta.estado
      }

      await updateVenta(venta.id, ventaActualizada)
      alert('Venta actualizada exitosamente')
      onClose()
    } catch (error) {
      console.error('Error al actualizar venta:', error)
      alert('Error al actualizar la venta: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const totales = calcularTotales(productosVenta)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Editar Venta</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Información de la Venta */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                <p className="text-sm font-medium text-gray-900">
                  {venta.fecha ? formatDate(venta.fecha) : '-'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vendedor</label>
                <p className="text-sm font-medium text-gray-900">{venta.vendedor || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Total Actual</label>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(venta.total || 0)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nuevo Total</label>
                <p className="text-sm font-bold text-green-600">
                  {formatCurrency(totales.total || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Buscar y Agregar Productos */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Agregar Productos</h3>
            <div className="relative" ref={busquedaRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar producto por nombre, código interno o código de barras..."
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
              />
              {mostrarSugerencias && productosSugeridos.length > 0 && (
                <div className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-80 overflow-y-auto bg-white">
                  {productosSugeridos.map((producto) => (
                    <div
                      key={producto.id}
                      onClick={() => handleSeleccionarProducto(producto)}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{producto.nombre}</p>
                          <p className="text-sm text-gray-500">
                            {producto.codigoInterno && `Código: ${producto.codigoInterno} | `}
                            Stock: {producto.stock || 0}
                          </p>
                        </div>
                        <Plus size={20} className="text-primary-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lista de Productos */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-3">Productos en la Venta</h3>
            {productosVenta.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay productos en esta venta</p>
            ) : (
              <div className="space-y-2">
                {productosVenta.map((producto, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {producto.codigoInterno && `${producto.codigoInterno} - `}
                          {producto.nombre}
                          {producto.presentacion && ` (${producto.presentacion})`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Precio: {formatCurrency(producto.precioUnitario || producto.precio || 0)}</span>
                          <span>Subtotal: {formatCurrency(producto.subtotal || 0)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                        <input
                          type="number"
                          min="1"
                          value={producto.cantidad || 1}
                          onChange={(e) => handleCambiarCantidad(index, parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          onClick={() => handleEliminarProducto(index)}
                          className="text-red-600 hover:text-red-800 p-2 transition-colors"
                          title="Eliminar producto"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen de Totales */}
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <h5 className="font-semibold text-gray-900 mb-2">Resumen</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900 ml-2">{formatCurrency(totales.subtotal || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Impuesto:</span>
                  <span className="font-medium text-gray-900 ml-2">{formatCurrency(totales.impuesto || 0)}</span>
                </div>
                <div className="col-span-2 border-t border-blue-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-semibold">Total:</span>
                    <span className="font-bold text-blue-700 text-lg">{formatCurrency(totales.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarCambios}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ventas

