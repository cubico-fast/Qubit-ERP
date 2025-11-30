import { useState, useEffect } from 'react'
import { Search, XCircle, RotateCcw, FileText, Package, X } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas, updateVenta } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const AnularDevolverVenta = () => {
  const { formatCurrency } = useCurrency()
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState(null) // 'anular' o 'devolver'
  const [productosDevolver, setProductosDevolver] = useState([])

  // Cargar ventas desde Firebase
  useEffect(() => {
    const loadVentas = async () => {
      try {
        setLoading(true)
        const ventasData = await getVentas()
        // Filtrar solo ventas completadas (no anuladas)
        const ventasActivas = ventasData.filter(v => v.estado === 'Completada')
        setVentas(ventasActivas)
      } catch (error) {
        console.error('Error al cargar ventas:', error)
        alert('Error al cargar ventas. Por favor, recarga la página.')
      } finally {
        setLoading(false)
      }
    }
    loadVentas()
  }, [])

  const filteredVentas = ventas.filter(venta => {
    const searchLower = searchTerm.toLowerCase()
    return (
      venta.vendedor?.toLowerCase().includes(searchLower) ||
      venta.tipoComprobante?.toLowerCase().includes(searchLower) ||
      venta.id?.toLowerCase().includes(searchLower) ||
      venta.fecha?.toLowerCase().includes(searchLower)
    )
  })

  const handleAnularVenta = (venta) => {
    setVentaSeleccionada(venta)
    setModoModal('anular')
    setShowModal(true)
  }

  const handleDevolverVenta = (venta) => {
    setVentaSeleccionada(venta)
    setModoModal('devolver')
    // Inicializar productos para devolver con cantidad 0
    const productosIniciales = (venta.productos || []).map(p => ({
      ...p,
      cantidadDevolver: 0
    }))
    setProductosDevolver(productosIniciales)
    setShowModal(true)
  }

  const handleCambiarCantidadDevolver = (index, cantidad) => {
    const producto = productosDevolver[index]
    const cantidadMaxima = producto.cantidad || 0
    
    if (cantidad < 0) cantidad = 0
    if (cantidad > cantidadMaxima) cantidad = cantidadMaxima
    
    setProductosDevolver(productosDevolver.map((p, i) => 
      i === index ? { ...p, cantidadDevolver: cantidad } : p
    ))
  }

  const handleConfirmarAnulacion = async () => {
    if (!ventaSeleccionada) return

    try {
      // Actualizar el estado de la venta a "Anulada"
      const ventaActualizada = {
        estado: 'Anulada',
        fechaAnulacion: new Date().toISOString()
      }
      
      await updateVenta(ventaSeleccionada.id, ventaActualizada)
      
      // Actualizar la lista local
      setVentas(ventas.filter(v => v.id !== ventaSeleccionada.id))
      setShowModal(false)
      setVentaSeleccionada(null)
      setModoModal(null)
      alert('Venta anulada exitosamente')
    } catch (error) {
      console.error('Error al anular venta:', error)
      alert('Error al anular la venta')
    }
  }

  const handleConfirmarDevolucion = async () => {
    const productosConDevolucion = productosDevolver.filter(p => p.cantidadDevolver > 0)
    
    if (productosConDevolucion.length === 0) {
      alert('Debe seleccionar al menos un producto para devolver')
      return
    }

    try {
      // Aquí se implementaría la lógica de devolución
      // Por ahora, solo mostramos un mensaje
      alert(`Devolución registrada para ${productosConDevolucion.length} producto(s)`)
      
      setShowModal(false)
      setVentaSeleccionada(null)
      setModoModal(null)
      setProductosDevolver([])
    } catch (error) {
      console.error('Error al procesar devolución:', error)
      alert('Error al procesar la devolución')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando ventas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Anular y Devolver</h1>
          <p className="text-gray-600 mt-1">Anula ventas o registra devoluciones de productos</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por vendedor, tipo de comprobante, ID o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Comprobante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {ventas.length === 0 
                      ? 'No hay ventas disponibles.'
                      : 'No se encontraron ventas que coincidan con la búsqueda.'}
                  </td>
                </tr>
              ) : (
                filteredVentas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
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
                          <span className="font-medium">{venta.totalProductos || venta.productos.length} producto(s)</span>
                        ) : (
                          <span className="text-gray-400">Sin productos</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(venta.total || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAnularVenta(venta)}
                          className="text-red-600 hover:text-red-800 p-2 transition-colors flex items-center gap-1"
                          title="Anular venta"
                        >
                          <XCircle size={18} />
                          <span className="text-sm">Anular</span>
                        </button>
                        <button
                          onClick={() => handleDevolverVenta(venta)}
                          className="text-blue-600 hover:text-blue-800 p-2 transition-colors flex items-center gap-1"
                          title="Devolver productos"
                        >
                          <RotateCcw size={18} />
                          <span className="text-sm">Devolver</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Anulación */}
      {showModal && ventaSeleccionada && modoModal === 'anular' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Confirmar Anulación</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                ¿Está seguro de que desea anular esta venta?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fecha:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {ventaSeleccionada.fecha ? formatDate(ventaSeleccionada.fecha) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vendedor:</span>
                  <span className="text-sm font-medium text-gray-900">{ventaSeleccionada.vendedor || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(ventaSeleccionada.total || 0)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-red-600 mb-4">
                Esta acción no se puede deshacer. La venta será marcada como anulada.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setVentaSeleccionada(null)
                  setModoModal(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarAnulacion}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Devolución */}
      {showModal && ventaSeleccionada && modoModal === 'devolver' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Devolver Productos</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setVentaSeleccionada(null)
                  setModoModal(null)
                  setProductosDevolver([])
                }}
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
                      {ventaSeleccionada.fecha ? formatDate(ventaSeleccionada.fecha) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Vendedor</label>
                    <p className="text-sm font-medium text-gray-900">{ventaSeleccionada.vendedor || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(ventaSeleccionada.total || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {ventaSeleccionada.estado || 'Completada'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Productos para Devolver */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Seleccionar Productos a Devolver</h4>
                <div className="space-y-2">
                  {productosDevolver.map((producto, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {producto.codigoInterno && `${producto.codigoInterno} - `}
                            {producto.nombre}
                            {producto.presentacion && ` (${producto.presentacion})`}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Cantidad vendida: <strong>{producto.cantidad}</strong></span>
                            <span>Precio: {formatCurrency(producto.precioUnitario || 0)}</span>
                            <span>Subtotal: {formatCurrency(producto.subtotal || 0)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-gray-700">Cantidad a devolver:</label>
                          <input
                            type="number"
                            min="0"
                            max={producto.cantidad}
                            value={producto.cantidadDevolver || 0}
                            onChange={(e) => handleCambiarCantidadDevolver(index, parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-500">/ {producto.cantidad}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Total productos a devolver: {productosDevolver.filter(p => p.cantidadDevolver > 0).length}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowModal(false)
                        setVentaSeleccionada(null)
                        setModoModal(null)
                        setProductosDevolver([])
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmarDevolucion}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Confirmar Devolución
                    </button>
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

export default AnularDevolverVenta

