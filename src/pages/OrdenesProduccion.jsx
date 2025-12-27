import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Search, Edit, Trash, X, Package, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getOrdenesProduccion, saveOrdenProduccion, updateOrdenProduccion, deleteOrdenProduccion, getProductos, getBOMs, getPedidos } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const OrdenesProduccion = () => {
  const { companyId } = useAuth()
  const [ordenes, setOrdenes] = useState([])
  const [productos, setProductos] = useState([])
  const [boms, setBoms] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todas')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null)

  const [formData, setFormData] = useState({
    numero: '',
    productoId: '',
    producto: '',
    bomId: '',
    cantidad: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFinEstimada: '',
    origen: 'Pedido',
    pedidoId: '',
    estado: 'Pendiente',
    notas: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ordenesData, productosData, bomsData, pedidosData] = await Promise.all([
        getOrdenesProduccion(companyId),
        getProductos(companyId),
        getBOMs(companyId),
        getPedidos(companyId)
      ])
      
      setOrdenes(ordenesData || [])
      setProductos(productosData || [])
      setBoms(bomsData || [])
      setPedidos(pedidosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setOrdenes([])
      setProductos([])
      setBoms([])
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }

  const generarNumeroOrden = () => {
    const total = ordenes.length + 1
    return `OP-${String(total).padStart(5, '0')}`
  }

  const handleCrearOrden = () => {
    setModoModal('crear')
    setOrdenSeleccionada(null)
    setFormData({
      numero: generarNumeroOrden(),
      productoId: '',
      producto: '',
      bomId: '',
      cantidad: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFinEstimada: '',
      origen: 'Pedido',
      pedidoId: '',
      estado: 'Pendiente',
      notas: ''
    })
    setShowModal(true)
  }

  const handleEditarOrden = (orden) => {
    setModoModal('editar')
    setOrdenSeleccionada(orden)
    setFormData({
      numero: orden.numero || generarNumeroOrden(),
      productoId: orden.productoId || '',
      producto: orden.producto || '',
      bomId: orden.bomId || '',
      cantidad: orden.cantidad || '',
      fechaInicio: orden.fechaInicio || new Date().toISOString().split('T')[0],
      fechaFinEstimada: orden.fechaFinEstimada || '',
      origen: orden.origen || 'Pedido',
      pedidoId: orden.pedidoId || '',
      estado: orden.estado || 'Pendiente',
      notas: orden.notas || ''
    })
    setShowModal(true)
  }

  const handleGuardarOrden = async () => {
    try {
      if (!formData.productoId || !formData.cantidad) {
        alert('Producto y cantidad son obligatorios')
        return
      }

      const producto = productos.find(p => p.id === formData.productoId)
      const ordenData = {
        ...formData,
        producto: producto?.nombre || formData.producto
      }

      if (modoModal === 'crear') {
        await saveOrdenProduccion(ordenData, companyId)
        alert('✅ Orden de producción creada exitosamente')
      } else {
        await updateOrdenProduccion(ordenSeleccionada.id, ordenData, companyId)
        alert('✅ Orden de producción actualizada exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar orden:', error)
      alert('Error al guardar orden: ' + error.message)
    }
  }

  const handleEliminarOrden = async (orden) => {
    if (!window.confirm(`¿Está seguro de eliminar la orden ${orden.numero}?`)) {
      return
    }

    try {
      await deleteOrdenProduccion(orden.id)
      await loadData()
      alert('✅ Orden eliminada exitosamente')
    } catch (error) {
      console.error('Error al eliminar orden:', error)
      alert('Error al eliminar orden: ' + error.message)
    }
  }

  const getNombreProducto = (productoId) => {
    const producto = productos.find(p => p.id === productoId)
    return producto ? producto.nombre : productoId
  }

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'Completada':
        return 'bg-green-100 text-green-800'
      case 'En Proceso':
        return 'bg-blue-100 text-blue-800'
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800'
      case 'Cancelada':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredOrdenes = ordenes.filter(orden =>
    orden.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getNombreProducto(orden.productoId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.producto?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(orden => filtroEstado === 'Todas' || orden.estado === filtroEstado)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando órdenes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Órdenes de Producción
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          El documento que autoriza fabricar algo. Sin orden, no se consume material.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Órdenes</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{ordenes.length}</p>
            </div>
            <ClipboardList className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>En Proceso</p>
              <p className="text-2xl font-bold text-blue-600">
                {ordenes.filter(o => o.estado === 'En Proceso').length}
              </p>
            </div>
            <Clock className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Completadas</p>
              <p className="text-2xl font-bold text-green-600">
                {ordenes.filter(o => o.estado === 'Completada').length}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {ordenes.filter(o => o.estado === 'Pendiente').length}
              </p>
            </div>
            <AlertCircle className="text-yellow-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones y Filtros */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por número, producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ 
              borderColor: 'var(--color-border)', 
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="Todas">Todas</option>
            <option value="Pendiente">Pendientes</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Completada">Completadas</option>
            <option value="Cancelada">Canceladas</option>
          </select>
          <button 
            onClick={handleCrearOrden}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Orden
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Número</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cantidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha Inicio</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha Fin</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Origen</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrdenes.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay órdenes de producción</p>
                  <p className="text-sm">Comienza creando una orden de producción</p>
                </td>
              </tr>
            ) : (
              filteredOrdenes.map((orden) => (
                <tr key={orden.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>{orden.numero}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {getNombreProducto(orden.productoId) || orden.producto}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>{orden.cantidad || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {orden.fechaInicio ? formatDate(orden.fechaInicio) : '-'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {orden.fechaFinEstimada ? formatDate(orden.fechaFinEstimada) : '-'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{orden.origen || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(orden.estado)}`}>
                      {orden.estado || 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditarOrden(orden)} 
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarOrden(orden)} 
                        className="p-1 hover:bg-gray-100 rounded text-red-600" 
                        title="Eliminar"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nueva Orden de Producción' : 'Editar Orden de Producción'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Número</label>
                  <input
                    type="text"
                    value={formData.numero}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                    style={{ color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Origen</label>
                  <select
                    value={formData.origen}
                    onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="Pedido">Pedido de Venta</option>
                    <option value="Reposición">Reposición de Stock</option>
                    <option value="Planificada">Producción Planificada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Producto Final *</label>
                <select
                  value={formData.productoId}
                  onChange={(e) => {
                    const producto = productos.find(p => p.id === e.target.value)
                    setFormData({ 
                      ...formData, 
                      productoId: e.target.value,
                      producto: producto?.nombre || ''
                    })
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>BOM (Lista de Materiales)</label>
                <select
                  value={formData.bomId}
                  onChange={(e) => setFormData({ ...formData, bomId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Seleccionar BOM...</option>
                  {boms.filter(bom => bom.productoId === formData.productoId).map(bom => (
                    <option key={bom.id} value={bom.id}>{bom.nombre || `BOM-${bom.id.substring(0, 8)}`}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cantidad *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha Fin Estimada</label>
                  <input
                    type="date"
                    value={formData.fechaFinEstimada}
                    onChange={(e) => setFormData({ ...formData, fechaFinEstimada: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              {formData.origen === 'Pedido' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Pedido</label>
                  <select
                    value={formData.pedidoId}
                    onChange={(e) => setFormData({ ...formData, pedidoId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Seleccionar pedido...</option>
                    {pedidos.map(pedido => (
                      <option key={pedido.id} value={pedido.id}>{pedido.numeroPedido || pedido.id}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Completada">Completada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarOrden}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Crear' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdenesProduccion

