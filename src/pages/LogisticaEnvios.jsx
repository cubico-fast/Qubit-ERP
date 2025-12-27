import { useState, useEffect } from 'react'
import { Search, Plus, Eye, CheckCircle, Truck, Package, MapPin, Calendar, FileText, Edit } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getEnvios, saveEnvio, updateEnvio, getPedidos } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const LogisticaEnvios = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [envios, setEnvios] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  
  const [formData, setFormData] = useState({
    numeroGuia: '',
    pedidoId: '',
    pedidoNumero: '',
    cliente: '',
    direccion: '',
    ciudad: '',
    transportista: '',
    fechaEnvio: new Date().toISOString().split('T')[0],
    fechaEntregaEstimada: '',
    productos: [],
    estado: 'Pendiente',
    observaciones: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [enviosData, pedidosData] = await Promise.all([
        getEnvios(companyId),
        getPedidos(companyId)
      ])
      
      setEnvios(enviosData || [])
      setPedidos(pedidosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setEnvios([])
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearEnvio = () => {
    setModoModal('crear')
    setFormData({
      numeroGuia: `GR-${String(envios.length + 1).padStart(6, '0')}`,
      pedidoId: '',
      pedidoNumero: '',
      cliente: '',
      direccion: '',
      ciudad: '',
      transportista: '',
      fechaEnvio: new Date().toISOString().split('T')[0],
      fechaEntregaEstimada: '',
      productos: [],
      estado: 'Pendiente',
      observaciones: ''
    })
    setShowModal(true)
  }

  const handleSeleccionarPedido = (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId)
    if (pedido) {
      setFormData({
        ...formData,
        pedidoId: pedido.id,
        pedidoNumero: pedido.numeroPedido || pedido.id,
        cliente: pedido.cliente || '',
        productos: pedido.productos || [],
        direccion: pedido.direccion || '',
        ciudad: pedido.ciudad || ''
      })
    }
  }

  const handleGuardarEnvio = async () => {
    try {
      if (!formData.pedidoId) {
        alert('Debe seleccionar un pedido')
        return
      }
      
      if (modoModal === 'crear') {
        await saveEnvio(formData, companyId)
      } else {
        await updateEnvio(envioSeleccionado.id, formData, companyId)
      }
      
      await loadData()
      setShowModal(false)
      alert('✅ Envío guardado exitosamente')
    } catch (error) {
      console.error('Error al guardar envío:', error)
      alert('Error al guardar el envío: ' + error.message)
    }
  }

  const handleConfirmarDespacho = async (envio) => {
    try {
      await updateEnvio(envio.id, { 
        estado: 'Despachado',
        fechaDespacho: new Date().toISOString().split('T')[0]
      }, companyId)
      await loadData()
      alert('✅ Envío marcado como despachado')
    } catch (error) {
      console.error('Error al confirmar despacho:', error)
      alert('Error al confirmar despacho')
    }
  }

  const handleConfirmarEntrega = async (envio) => {
    try {
      await updateEnvio(envio.id, { 
        estado: 'Entregado',
        fechaEntrega: new Date().toISOString().split('T')[0]
      }, companyId)
      
      // Actualizar estado del pedido relacionado
      if (envio.pedidoId) {
        const pedido = pedidos.find(p => p.id === envio.pedidoId)
        if (pedido) {
          // Aquí podrías actualizar el pedido también
        }
      }
      
      await loadData()
      alert('✅ Entrega confirmada exitosamente')
    } catch (error) {
      console.error('Error al confirmar entrega:', error)
      alert('Error al confirmar entrega')
    }
  }

  const handleVerDetalle = (envio) => {
    setEnvioSeleccionado(envio)
    setShowDetalleModal(true)
  }

  const filteredEnvios = envios.filter(envio => {
    const matchSearch = 
      envio.numeroGuia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      envio.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      envio.pedidoNumero?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchEstado = filtroEstado === 'Todos' || envio.estado === filtroEstado
    
    return matchSearch && matchEstado
  })

  const estadosUnicos = [...new Set(envios.map(e => e.estado).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando envíos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logística y Envíos</h1>
          <p className="text-gray-600 mt-1">Gestiona guías de remisión, despachos y entregas</p>
        </div>
        <button onClick={handleCrearEnvio} className="btn-primary mt-4 sm:mt-0 flex items-center space-x-2">
          <Plus size={20} />
          <span>Nuevo Envío</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Envíos</p>
              <p className="text-2xl font-bold text-gray-900">{envios.length}</p>
            </div>
            <Truck className="text-primary-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {envios.filter(e => e.estado === 'Pendiente').length}
              </p>
            </div>
            <Package className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Despachados</p>
              <p className="text-2xl font-bold text-blue-600">
                {envios.filter(e => e.estado === 'Despachado').length}
              </p>
            </div>
            <Truck className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Entregados</p>
              <p className="text-2xl font-bold text-green-600">
                {envios.filter(e => e.estado === 'Entregado').length}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
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
              placeholder="Buscar envíos..."
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

      {/* Tabla de Envíos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guía</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transportista</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Envío</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEnvios.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No hay envíos registrados
                  </td>
                </tr>
              ) : (
                filteredEnvios.map((envio) => (
                  <tr key={envio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{envio.numeroGuia || envio.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{envio.pedidoNumero || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{envio.cliente || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{envio.transportista || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(envio.fechaEnvio)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        envio.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        envio.estado === 'Despachado' ? 'bg-blue-100 text-blue-800' :
                        envio.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {envio.estado || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleVerDetalle(envio)}
                          className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        {envio.estado === 'Pendiente' && (
                          <button
                            onClick={() => handleConfirmarDespacho(envio)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg"
                            title="Confirmar despacho"
                          >
                            <Truck size={18} />
                          </button>
                        )}
                        {envio.estado === 'Despachado' && (
                          <button
                            onClick={() => handleConfirmarEntrega(envio)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg"
                            title="Confirmar entrega"
                          >
                            <CheckCircle size={18} />
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

      {/* Modal Crear/Editar Envío */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {modoModal === 'crear' ? 'Nuevo Envío' : 'Editar Envío'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Guía</label>
                  <input
                    type="text"
                    value={formData.numeroGuia}
                    onChange={(e) => setFormData({ ...formData, numeroGuia: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pedido</label>
                  <select
                    value={formData.pedidoId}
                    onChange={(e) => handleSeleccionarPedido(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar pedido</option>
                    {pedidos.filter(p => p.estado !== 'Anulada' && p.estado !== 'Entregado').map(pedido => (
                      <option key={pedido.id} value={pedido.id}>
                        {pedido.numeroPedido || pedido.id} - {pedido.cliente}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <input
                    type="text"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transportista</label>
                  <input
                    type="text"
                    value={formData.transportista}
                    onChange={(e) => setFormData({ ...formData, transportista: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: Xpress Cargo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Envío</label>
                  <input
                    type="date"
                    value={formData.fechaEnvio}
                    onChange={(e) => setFormData({ ...formData, fechaEnvio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega Estimada</label>
                  <input
                    type="date"
                    value={formData.fechaEntregaEstimada}
                    onChange={(e) => setFormData({ ...formData, fechaEntregaEstimada: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Productos */}
              {formData.productos && formData.productos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Productos a Enviar</h3>
                  <div className="space-y-2">
                    {formData.productos.map((producto, index) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{producto.nombre} x {producto.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                onClick={handleGuardarEnvio}
                className="btn-primary"
              >
                Guardar Envío
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {showDetalleModal && envioSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Detalle del Envío</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Guía</p>
                  <p className="text-lg font-semibold">{envioSeleccionado.numeroGuia || envioSeleccionado.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pedido</p>
                  <p className="text-lg font-semibold">{envioSeleccionado.pedidoNumero || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="text-lg font-semibold">{envioSeleccionado.cliente || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transportista</p>
                  <p className="text-lg font-semibold">{envioSeleccionado.transportista || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Envío</p>
                  <p className="text-lg font-semibold">{formatDate(envioSeleccionado.fechaEnvio)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    envioSeleccionado.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    envioSeleccionado.estado === 'Despachado' ? 'bg-blue-100 text-blue-800' :
                    envioSeleccionado.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {envioSeleccionado.estado || 'Pendiente'}
                  </span>
                </div>
              </div>
              {envioSeleccionado.productos && envioSeleccionado.productos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Productos</h3>
                  <div className="space-y-2">
                    {envioSeleccionado.productos.map((producto, index) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{producto.nombre} x {producto.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

export default LogisticaEnvios

