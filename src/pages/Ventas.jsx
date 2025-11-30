import { useState, useEffect } from 'react'
import { Search, DollarSign, TrendingUp, Calendar, X, Eye, FileText, Package, XCircle } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas } from '../utils/firebaseUtils'
import { getCurrentDateSync, formatDate, getNetworkTime, getLastMonths } from '../utils/dateUtils'

const Ventas = () => {
  const { formatCurrency, convertValue } = useCurrency()
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Función para generar datos iniciales
  const generateInitialVentasMensuales = () => {
    const mesesIniciales = getLastMonths(6)
    return mesesIniciales.map((mesInfo, index) => ({
      mes: mesInfo.mes,
      ventas: convertValue(12000 + (index * 2000)),
      objetivo: convertValue(15000)
    }))
  }
  
  const [ventasMensuales, setVentasMensuales] = useState(() => generateInitialVentasMensuales())

  // Cargar ventas desde Firebase al montar el componente
  useEffect(() => {
    const loadVentas = async () => {
      try {
        setLoading(true)
        const ventasData = await getVentas()
        setVentas(ventasData)
      } catch (error) {
        console.error('Error al cargar ventas:', error)
        alert('Error al cargar ventas. Por favor, recarga la página.')
      } finally {
        setLoading(false)
      }
    }
    
    loadVentas()
  }, [])

  // Generar datos mensuales dinámicos basados en la fecha actual
  useEffect(() => {
    const updateVentasMensuales = async () => {
      try {
        const networkDate = await getNetworkTime()
        const meses = getLastMonths(6, networkDate)
        
        // Generar datos dinámicos (puedes conectarlos a datos reales de Firebase)
        const ventasData = meses.map((mesInfo, index) => ({
          mes: mesInfo.mes,
          ventas: convertValue(12000 + (index * 2000)),
          objetivo: convertValue(15000)
        }))
        
        setVentasMensuales(ventasData)
      } catch (error) {
        console.error('Error al obtener fecha de la red:', error)
        // Fallback
        const meses = getLastMonths(6)
        setVentasMensuales(meses.map((mesInfo, index) => ({
          mes: mesInfo.mes,
          ventas: convertValue(12000 + (index * 2000)),
          objetivo: convertValue(15000)
        })))
      }
    }
    
    updateVentasMensuales()
    // Actualizar cada hora
    const interval = setInterval(updateVentasMensuales, 3600000)
    return () => clearInterval(interval)
  }, [convertValue])

  const [searchTerm, setSearchTerm] = useState('')
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)

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

  const totalVentas = ventas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
  const ventasCompletadas = ventas.filter(v => v.estado === 'Completada').length
  const ventasAnuladas = ventas.filter(v => v.estado === 'Anulada').length
  const totalProductosVendidos = ventas.reduce((sum, v) => sum + (parseInt(v.totalProductos) || 0), 0)

  const handleVerDetalle = (venta) => {
    setVentaSeleccionada(venta)
    setShowDetalleModal(true)
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalVentas)}</p>
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
              <p className="text-sm text-gray-600 mb-1">Ventas Anuladas</p>
              <p className="text-2xl font-bold text-red-600">{ventasAnuladas}</p>
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
                      <button
                        onClick={() => handleVerDetalle(venta)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 border border-blue-200"
                        title="Ver detalles completos"
                      >
                        <Eye size={18} />
                        <span className="text-sm font-medium">Ver</span>
                      </button>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Ventas</h3>
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

    </div>
  )
}

export default Ventas

