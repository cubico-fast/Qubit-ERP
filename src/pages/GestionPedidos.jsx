import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Eye, CheckCircle, XCircle, AlertCircle, Package, DollarSign, Calendar, User, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getPedidos, savePedido, updatePedido, getClientes, getProductos, getVentas } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const GestionPedidos = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear') // 'crear' o 'editar'
  
  const [formData, setFormData] = useState({
    numeroPedido: '',
    clienteId: '',
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    fechaEntrega: '',
    productos: [],
    subtotal: 0,
    descuento: 0,
    impuesto: 0,
    total: 0,
    formaPago: 'Contado',
    diasCredito: 0,
    estado: 'Pendiente',
    observaciones: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [pedidosData, clientesData, productosData] = await Promise.all([
        getPedidos(companyId),
        getClientes(companyId),
        getProductos(companyId)
      ])
      
      setPedidos(pedidosData || [])
      setClientes(clientesData || [])
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setPedidos([])
      setClientes([])
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  const validarPedido = async (pedido) => {
    const errores = []
    
    // Validar cliente
    if (!pedido.clienteId) {
      errores.push('Debe seleccionar un cliente')
    } else {
      const cliente = clientes.find(c => c.id === pedido.clienteId)
      if (!cliente) {
        errores.push('Cliente no encontrado')
      } else {
        // Validar estado del cliente
        if (cliente.estado !== 'Activo') {
          errores.push('El cliente no está activo')
        }
        
        // Validar crédito disponible
        if (pedido.formaPago === 'Crédito' && pedido.diasCredito > 0) {
          const ventasCliente = await getVentas(companyId)
          const ventasPendientes = ventasCliente.filter(v => 
            v.clienteId === pedido.clienteId && 
            v.estado === 'Completada' && 
            v.formaPago === 'Crédito'
          )
          
          const deudaTotal = ventasPendientes.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
          const limiteCredito = parseFloat(cliente.limiteCredito || 0)
          
          if (deudaTotal + pedido.total > limiteCredito) {
            errores.push(`Límite de crédito excedido. Deuda actual: ${formatCurrency(deudaTotal)}, Límite: ${formatCurrency(limiteCredito)}`)
          }
        }
      }
    }
    
    // Validar productos y stock
    if (!pedido.productos || pedido.productos.length === 0) {
      errores.push('Debe agregar al menos un producto')
    } else {
      for (const productoPedido of pedido.productos) {
        const producto = productos.find(p => p.id === productoPedido.productoId || p.id === productoPedido.id)
        if (!producto) {
          errores.push(`Producto ${productoPedido.nombre} no encontrado`)
        } else {
          const stockDisponible = parseFloat(producto.stock || 0)
          const cantidadPedido = parseFloat(productoPedido.cantidad || 0)
          
          if (cantidadPedido > stockDisponible) {
            errores.push(`Stock insuficiente para ${producto.nombre}. Disponible: ${stockDisponible}, Solicitado: ${cantidadPedido}`)
          }
        }
      }
    }
    
    // Validar precios
    for (const productoPedido of pedido.productos) {
      if (!productoPedido.precio || parseFloat(productoPedido.precio) <= 0) {
        errores.push(`El precio del producto ${productoPedido.nombre} debe ser mayor a cero`)
      }
    }
    
    return errores
  }

  const handleCrearPedido = () => {
    setModoModal('crear')
    setFormData({
      numeroPedido: `P-${String(pedidos.length + 1).padStart(5, '0')}`,
      clienteId: '',
      cliente: '',
      fecha: new Date().toISOString().split('T')[0],
      fechaEntrega: '',
      productos: [],
      subtotal: 0,
      descuento: 0,
      impuesto: 0,
      total: 0,
      formaPago: 'Contado',
      diasCredito: 0,
      estado: 'Pendiente',
      observaciones: ''
    })
    setShowModal(true)
  }

  const handleAgregarProducto = () => {
    const nuevoProducto = {
      productoId: '',
      nombre: '',
      cantidad: 1,
      precio: 0,
      subtotal: 0
    }
    setFormData({
      ...formData,
      productos: [...formData.productos, nuevoProducto]
    })
  }

  const handleCambiarProducto = (index, campo, valor) => {
    const nuevosProductos = [...formData.productos]
    nuevosProductos[index] = {
      ...nuevosProductos[index],
      [campo]: valor
    }
    
    // Si cambió el producto, actualizar nombre y precio
    if (campo === 'productoId') {
      const producto = productos.find(p => p.id === valor)
      if (producto) {
        nuevosProductos[index].nombre = producto.nombre
        nuevosProductos[index].precio = producto.precio || producto.precioVenta || 0
      }
    }
    
    // Calcular subtotal del producto
    if (campo === 'cantidad' || campo === 'precio' || campo === 'productoId') {
      const cantidad = parseFloat(nuevosProductos[index].cantidad || 0)
      const precio = parseFloat(nuevosProductos[index].precio || 0)
      nuevosProductos[index].subtotal = cantidad * precio
    }
    
    // Recalcular totales
    const subtotal = nuevosProductos.reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0)
    const descuento = parseFloat(formData.descuento || 0)
    const baseImponible = subtotal - descuento
    const impuesto = baseImponible * 0.18 // IGV 18%
    const total = baseImponible + impuesto
    
    setFormData({
      ...formData,
      productos: nuevosProductos,
      subtotal,
      impuesto,
      total
    })
  }

  const handleEliminarProducto = (index) => {
    const nuevosProductos = formData.productos.filter((_, i) => i !== index)
    const subtotal = nuevosProductos.reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0)
    const descuento = parseFloat(formData.descuento || 0)
    const baseImponible = subtotal - descuento
    const impuesto = baseImponible * 0.18
    const total = baseImponible + impuesto
    
    setFormData({
      ...formData,
      productos: nuevosProductos,
      subtotal,
      impuesto,
      total
    })
  }

  const handleGuardarPedido = async () => {
    try {
      const errores = await validarPedido(formData)
      if (errores.length > 0) {
        alert('Errores de validación:\n' + errores.join('\n'))
        return
      }
      
      const pedidoData = {
        ...formData,
        cliente: clientes.find(c => c.id === formData.clienteId)?.nombre || formData.cliente
      }
      
      if (modoModal === 'crear') {
        await savePedido(pedidoData, companyId)
      } else {
        await updatePedido(pedidoSeleccionado.id, pedidoData, companyId)
      }
      
      await loadData()
      setShowModal(false)
      alert('✅ Pedido guardado exitosamente')
    } catch (error) {
      console.error('Error al guardar pedido:', error)
      alert('Error al guardar el pedido: ' + error.message)
    }
  }

  const handleVerDetalle = (pedido) => {
    setPedidoSeleccionado(pedido)
    setShowDetalleModal(true)
  }

  const handleCambiarEstado = async (pedido, nuevoEstado) => {
    try {
      await updatePedido(pedido.id, { estado: nuevoEstado }, companyId)
      await loadData()
      alert(`✅ Estado del pedido actualizado a: ${nuevoEstado}`)
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      alert('Error al actualizar el estado')
    }
  }

  const filteredPedidos = pedidos.filter(pedido => {
    const matchSearch = 
      pedido.numeroPedido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchEstado = filtroEstado === 'Todos' || pedido.estado === filtroEstado
    
    return matchSearch && matchEstado
  })

  const estados = ['Pendiente', 'Aprobado', 'En Preparación', 'Despachado', 'Entregado', 'Anulada']
  const estadosUnicos = [...new Set(pedidos.map(p => p.estado).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-gray-600 mt-1">Registra y gestiona pedidos de venta con validación de reglas comerciales</p>
        </div>
        <button onClick={handleCrearPedido} className="btn-primary mt-4 sm:mt-0 flex items-center space-x-2">
          <Plus size={20} />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{pedidos.length}</p>
            </div>
            <FileText className="text-primary-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pedidos.filter(p => p.estado === 'Pendiente').length}
              </p>
            </div>
            <AlertCircle className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En Preparación</p>
              <p className="text-2xl font-bold text-blue-600">
                {pedidos.filter(p => p.estado === 'En Preparación').length}
              </p>
            </div>
            <Package className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(pedidos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0))}
              </p>
            </div>
            <DollarSign className="text-green-600" size={32} />
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
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option>Todos</option>
            {estadosUnicos.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No hay pedidos registrados
                  </td>
                </tr>
              ) : (
                filteredPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pedido.numeroPedido || pedido.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pedido.cliente || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(pedido.fecha)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pedido.productos?.length || 0} producto(s)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(pedido.total || 0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        pedido.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        pedido.estado === 'Aprobado' ? 'bg-blue-100 text-blue-800' :
                        pedido.estado === 'En Preparación' ? 'bg-purple-100 text-purple-800' :
                        pedido.estado === 'Despachado' ? 'bg-indigo-100 text-indigo-800' :
                        pedido.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pedido.estado || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleVerDetalle(pedido)}
                          className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        {pedido.estado !== 'Entregado' && pedido.estado !== 'Anulada' && (
                          <select
                            value={pedido.estado || 'Pendiente'}
                            onChange={(e) => handleCambiarEstado(pedido, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {estados.map(estado => (
                              <option key={estado} value={estado}>{estado}</option>
                            ))}
                          </select>
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

      {/* Modal Crear/Editar Pedido */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {modoModal === 'crear' ? 'Nuevo Pedido' : 'Editar Pedido'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Pedido</label>
                  <input
                    type="text"
                    value={formData.numeroPedido}
                    onChange={(e) => setFormData({ ...formData, numeroPedido: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => {
                      const cliente = clientes.find(c => c.id === e.target.value)
                      setFormData({ ...formData, clienteId: e.target.value, cliente: cliente?.nombre || '' })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.filter(c => c.estado === 'Activo').map(cliente => (
                      <option key={cliente.id} value={cliente.id}>{cliente.nombre} - {cliente.empresa}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                  <input
                    type="date"
                    value={formData.fechaEntrega}
                    onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label>
                  <select
                    value={formData.formaPago}
                    onChange={(e) => setFormData({ ...formData, formaPago: e.target.value, diasCredito: e.target.value === 'Contado' ? 0 : formData.diasCredito })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Contado">Contado</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>
                {formData.formaPago === 'Crédito' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Días de Crédito</label>
                    <input
                      type="number"
                      value={formData.diasCredito}
                      onChange={(e) => setFormData({ ...formData, diasCredito: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* Productos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
                  <button
                    onClick={handleAgregarProducto}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Agregar Producto</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.productos.map((producto, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
                      <select
                        value={producto.productoId || producto.id || ''}
                        onChange={(e) => handleCambiarProducto(index, 'productoId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Seleccionar producto</option>
                        {productos.map(prod => (
                          <option key={prod.id} value={prod.id}>{prod.nombre} - Stock: {prod.stock || 0}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Cantidad"
                        value={producto.cantidad}
                        onChange={(e) => handleCambiarProducto(index, 'cantidad', parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min="1"
                      />
                      <input
                        type="number"
                        placeholder="Precio"
                        value={producto.precio}
                        onChange={(e) => handleCambiarProducto(index, 'precio', parseFloat(e.target.value) || 0)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        step="0.01"
                        min="0"
                      />
                      <div className="w-32 px-3 py-2 text-sm font-medium text-gray-900">
                        {formatCurrency(producto.subtotal || 0)}
                      </div>
                      <button
                        onClick={() => handleEliminarProducto(index)}
                        className="text-red-600 hover:text-red-900 p-2"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-end space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Subtotal: {formatCurrency(formData.subtotal)}</p>
                    <p className="text-sm text-gray-600">IGV (18%): {formatCurrency(formData.impuesto)}</p>
                    <p className="text-lg font-bold text-gray-900 mt-2">Total: {formatCurrency(formData.total)}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPedido}
                className="btn-primary"
              >
                Guardar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {showDetalleModal && pedidoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Detalle del Pedido</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Pedido</p>
                  <p className="text-lg font-semibold">{pedidoSeleccionado.numeroPedido || pedidoSeleccionado.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="text-lg font-semibold">{pedidoSeleccionado.cliente || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="text-lg font-semibold">{formatDate(pedidoSeleccionado.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    pedidoSeleccionado.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    pedidoSeleccionado.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {pedidoSeleccionado.estado || 'Pendiente'}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Productos</h3>
                <div className="space-y-2">
                  {pedidoSeleccionado.productos?.map((producto, index) => (
                    <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>{producto.nombre} x {producto.cantidad}</span>
                      <span className="font-medium">{formatCurrency(producto.subtotal || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold">{formatCurrency(pedidoSeleccionado.total || 0)}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetalleModal(false)}
                className="btn-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionPedidos

