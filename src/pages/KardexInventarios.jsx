import { useState, useEffect } from 'react'
import { Search, Package, Warehouse, TrendingUp, TrendingDown, Eye, Filter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getKardex, saveMovimientoKardex, getStockAlmacen, updateStockAlmacen, getProductos } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const KardexInventarios = () => {
  const { companyId } = useAuth()
  const [movimientos, setMovimientos] = useState([])
  const [stockAlmacenes, setStockAlmacenes] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [almacenes] = useState([
    { id: 'almacen_central', nombre: 'Almacén Central' },
    { id: 'almacen_sur', nombre: 'Almacén Sur' },
    { id: 'almacen_norte', nombre: 'Almacén Norte' }
  ])

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [movimientosData, stockData, productosData] = await Promise.all([
        getKardex(null, companyId),
        getStockAlmacen(null, companyId),
        getProductos(companyId)
      ])
      
      setMovimientos(movimientosData || [])
      setStockAlmacenes(stockData || [])
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setMovimientos([])
      setStockAlmacenes([])
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  const getStockProductoAlmacen = (productoId, almacenId) => {
    const stock = stockAlmacenes.find(s => 
      s.productoId === productoId && s.almacenId === almacenId
    )
    return stock ? parseFloat(stock.cantidad || 0) : 0
  }

  const getStockTotalProducto = (productoId) => {
    return stockAlmacenes
      .filter(s => s.productoId === productoId)
      .reduce((sum, s) => sum + (parseFloat(s.cantidad || 0)), 0)
  }

  const reservarProducto = async (productoId, almacenId, cantidad, pedidoId) => {
    try {
      const stockActual = getStockProductoAlmacen(productoId, almacenId)
      
      if (cantidad > stockActual) {
        alert(`Stock insuficiente en el almacén. Disponible: ${stockActual}, Solicitado: ${cantidad}`)
        return false
      }
      
      // Actualizar stock
      const nuevoStock = stockActual - cantidad
      await updateStockAlmacen(productoId, almacenId, nuevoStock, companyId)
      
      // Registrar movimiento en kardex
      await saveMovimientoKardex({
        productoId,
        almacenId,
        tipo: 'Reserva',
        cantidad: -cantidad,
        referencia: pedidoId,
        descripcion: `Reserva de producto para pedido ${pedidoId}`,
        fecha: new Date().toISOString().split('T')[0]
      }, companyId)
      
      await loadData()
      return true
    } catch (error) {
      console.error('Error al reservar producto:', error)
      alert('Error al reservar producto: ' + error.message)
      return false
    }
  }

  const liberarReserva = async (productoId, almacenId, cantidad, pedidoId) => {
    try {
      const stockActual = getStockProductoAlmacen(productoId, almacenId)
      const nuevoStock = stockActual + cantidad
      
      await updateStockAlmacen(productoId, almacenId, nuevoStock, companyId)
      
      await saveMovimientoKardex({
        productoId,
        almacenId,
        tipo: 'Liberación',
        cantidad: cantidad,
        referencia: pedidoId,
        descripcion: `Liberación de reserva para pedido ${pedidoId}`,
        fecha: new Date().toISOString().split('T')[0]
      }, companyId)
      
      await loadData()
      return true
    } catch (error) {
      console.error('Error al liberar reserva:', error)
      alert('Error al liberar reserva: ' + error.message)
      return false
    }
  }

  const filteredMovimientos = movimientos.filter(mov => {
    const matchSearch = 
      mov.productoId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchProducto = !filtroProducto || mov.productoId === filtroProducto
    const matchTipo = filtroTipo === 'Todos' || mov.tipo === filtroTipo
    
    return matchSearch && matchProducto && matchTipo
  })

  const tiposMovimiento = ['Entrada', 'Salida', 'Reserva', 'Liberación', 'Ajuste']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando kardex...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kardex e Inventarios</h1>
        <p className="text-gray-600 mt-1">Control de movimientos de inventario y stock por almacén</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{productos.length}</p>
            </div>
            <Package className="text-primary-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Almacenes</p>
              <p className="text-2xl font-bold text-gray-900">{almacenes.length}</p>
            </div>
            <Warehouse className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Movimientos</p>
              <p className="text-2xl font-bold text-gray-900">{movimientos.length}</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Stock Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {stockAlmacenes.reduce((sum, s) => sum + (parseFloat(s.cantidad || 0)), 0)}
              </p>
            </div>
            <Package className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar movimientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
            />
          </div>
          <select
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los productos</option>
            {productos.map(producto => (
              <option key={producto.id} value={producto.id}>{producto.nombre}</option>
            ))}
          </select>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option>Todos</option>
            {tiposMovimiento.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock por Almacén */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Stock por Almacén</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                {almacenes.map(almacen => (
                  <th key={almacen.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {almacen.nombre}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={almacenes.length + 2} className="px-6 py-8 text-center text-gray-500">
                    No hay productos registrados
                  </td>
                </tr>
              ) : (
                productos.map((producto) => {
                  const stockTotal = getStockTotalProducto(producto.id)
                  return (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                      </td>
                      {almacenes.map(almacen => {
                        const stock = getStockProductoAlmacen(producto.id, almacen.id)
                        return (
                          <td key={almacen.id} className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              stock > 0 ? 'text-gray-900' : 'text-red-600'
                            }`}>
                              {stock}
                            </div>
                          </td>
                        )
                      })}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold ${
                          stockTotal > 0 ? 'text-gray-900' : 'text-red-600'
                        }`}>
                          {stockTotal}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movimientos de Kardex */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Movimientos de Kardex</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Almacén</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovimientos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                filteredMovimientos.map((movimiento) => {
                  const producto = productos.find(p => p.id === movimiento.productoId)
                  const almacen = almacenes.find(a => a.id === movimiento.almacenId)
                  const esEntrada = parseFloat(movimiento.cantidad) > 0
                  
                  return (
                    <tr key={movimiento.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(movimiento.fecha)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          movimiento.tipo === 'Entrada' || movimiento.tipo === 'Liberación' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {movimiento.tipo || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{producto?.nombre || movimiento.productoId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{almacen?.nombre || movimiento.almacenId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center space-x-1 text-sm font-medium ${
                          esEntrada ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {esEntrada ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          <span>{Math.abs(parseFloat(movimiento.cantidad || 0))}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{movimiento.referencia || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{movimiento.descripcion || 'N/A'}</div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default KardexInventarios

