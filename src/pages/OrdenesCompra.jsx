import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Edit, Trash, X, DollarSign, Calendar, Package, Building } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getOrdenesCompra, saveOrdenCompra, updateOrdenCompra, deleteOrdenCompra, getProveedores, getSolicitudesCompra } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const OrdenesCompra = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [ordenes, setOrdenes] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null)

  const [formData, setFormData] = useState({
    numero: '',
    proveedorId: '',
    proveedor: '',
    producto: '',
    cantidad: '',
    precioUnitario: '',
    total: '',
    fecha: new Date().toISOString().split('T')[0],
    fechaEntrega: '',
    solicitudCompraId: '',
    estado: 'pendiente',
    notas: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ordenesData, proveedoresData, solicitudesData] = await Promise.all([
        getOrdenesCompra(companyId),
        getProveedores(companyId),
        getSolicitudesCompra(companyId)
      ])
      
      const ordenesConNumero = ordenesData.map((o, index) => ({
        ...o,
        numero: o.numero || `OC-${String(index + 1).padStart(5, '0')}`
      }))
      
      setOrdenes(ordenesConNumero || [])
      setProveedores(proveedoresData || [])
      setSolicitudes(solicitudesData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setOrdenes([])
      setProveedores([])
      setSolicitudes([])
    } finally {
      setLoading(false)
    }
  }

  const generarNumeroOrden = () => {
    const total = ordenes.length + 1
    return `OC-${String(total).padStart(5, '0')}`
  }

  const calcularTotal = (cantidad, precio) => {
    const cant = parseFloat(cantidad) || 0
    const prec = parseFloat(precio) || 0
    return (cant * prec).toFixed(2)
  }

  const handleCrearOrden = () => {
    setModoModal('crear')
    setOrdenSeleccionada(null)
    setFormData({
      numero: generarNumeroOrden(),
      proveedorId: '',
      proveedor: '',
      producto: '',
      cantidad: '',
      precioUnitario: '',
      total: '',
      fecha: new Date().toISOString().split('T')[0],
      fechaEntrega: '',
      solicitudCompraId: '',
      estado: 'pendiente',
      notas: ''
    })
    setShowModal(true)
  }

  const handleCrearDesdeSolicitud = (solicitud) => {
    setModoModal('crear')
    setOrdenSeleccionada(null)
    setFormData({
      numero: generarNumeroOrden(),
      proveedorId: '',
      proveedor: '',
      producto: solicitud.producto || '',
      cantidad: solicitud.cantidad || '',
      precioUnitario: '',
      total: '',
      fecha: new Date().toISOString().split('T')[0],
      fechaEntrega: '',
      solicitudCompraId: solicitud.id,
      estado: 'pendiente',
      notas: `Generada desde ${solicitud.numero}`
    })
    setShowModal(true)
  }

  const handleEditarOrden = (orden) => {
    setModoModal('editar')
    setOrdenSeleccionada(orden)
    setFormData({
      numero: orden.numero || generarNumeroOrden(),
      proveedorId: orden.proveedorId || '',
      proveedor: orden.proveedor || '',
      producto: orden.producto || '',
      cantidad: orden.cantidad || '',
      precioUnitario: orden.precioUnitario || '',
      total: orden.total || calcularTotal(orden.cantidad, orden.precioUnitario),
      fecha: orden.fecha || new Date().toISOString().split('T')[0],
      fechaEntrega: orden.fechaEntrega || '',
      solicitudCompraId: orden.solicitudCompraId || '',
      estado: orden.estado || 'pendiente',
      notas: orden.notas || ''
    })
    setShowModal(true)
  }

  const handleGuardarOrden = async () => {
    try {
      if (!formData.proveedor || !formData.producto || !formData.cantidad || !formData.precioUnitario) {
        alert('Proveedor, producto, cantidad y precio son obligatorios')
        return
      }

      const totalCalculado = calcularTotal(formData.cantidad, formData.precioUnitario)
      
      const ordenData = {
        ...formData,
        total: totalCalculado,
        precioUnitario: parseFloat(formData.precioUnitario),
        cantidad: parseFloat(formData.cantidad)
      }

      if (modoModal === 'crear') {
        await saveOrdenCompra(ordenData, companyId)
        alert('✅ Orden de compra creada exitosamente')
      } else {
        await updateOrdenCompra(ordenSeleccionada.id, ordenData, companyId)
        alert('✅ Orden de compra actualizada exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar orden:', error)
      alert('Error al guardar la orden: ' + error.message)
    }
  }

  const handleEliminarOrden = async (orden) => {
    if (!window.confirm(`¿Está seguro de eliminar la orden ${orden.numero}?`)) {
      return
    }

    try {
      await deleteOrdenCompra(orden.id)
      await loadData()
      alert('✅ Orden eliminada exitosamente')
    } catch (error) {
      console.error('Error al eliminar orden:', error)
      alert('Error al eliminar la orden: ' + error.message)
    }
  }

  const filteredOrdenes = ordenes.filter(orden => {
    const matchSearch = 
      orden.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orden.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orden.producto?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchEstado = filtroEstado === 'Todas' || orden.estado === filtroEstado

    return matchSearch && matchEstado
  })

  const estadisticas = {
    total: ordenes.length,
    pendientes: ordenes.filter(o => o.estado === 'pendiente').length,
    enviadas: ordenes.filter(o => o.estado === 'enviada').length,
    totalValor: ordenes.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Órdenes de Compra
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Documento legal/comercial que envías al proveedor (compromiso formal)
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Órdenes</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {loading ? '...' : estadisticas.total}
              </p>
            </div>
            <FileText className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Valor Total</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : formatCurrency(estadisticas.totalValor)}
              </p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por número, proveedor, producto..."
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
        <button 
          onClick={handleCrearOrden}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Orden
        </button>
      </div>

      {/* Información */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-900 mb-2">📌 Orden de Compra: Compromiso Formal</h3>
        <p className="text-sm text-green-800 mb-2">
          Es el documento legal/comercial que envías al proveedor. Aquí se fija precio, proveedor y se autoriza la compra.
        </p>
        <ul className="text-sm text-green-700 space-y-1 ml-4">
          <li>• Se fija precio</li>
          <li>• Se fija proveedor</li>
          <li>• Se autoriza la compra</li>
        </ul>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setFiltroEstado('Todas')}
          className={`px-3 py-1 text-sm border rounded-full ${filtroEstado === 'Todas' ? 'bg-blue-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Todas
        </button>
        <button 
          onClick={() => setFiltroEstado('pendiente')}
          className={`px-3 py-1 text-sm border rounded-full ${filtroEstado === 'pendiente' ? 'bg-orange-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Pendientes
        </button>
        <button 
          onClick={() => setFiltroEstado('enviada')}
          className={`px-3 py-1 text-sm border rounded-full ${filtroEstado === 'enviada' ? 'bg-blue-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Enviadas
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Número</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Proveedor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cantidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Precio Unit.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha Entrega</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>Cargando...</td></tr>
            ) : filteredOrdenes.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <FileText size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay órdenes de compra registradas</p>
                </td>
              </tr>
            ) : (
              filteredOrdenes.map((orden) => (
                <tr key={orden.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>{orden.numero}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{orden.proveedor}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{orden.producto}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{orden.cantidad}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{formatCurrency(orden.precioUnitario || 0)}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(orden.total || 0)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{orden.fechaEntrega ? formatDate(orden.fechaEntrega) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      orden.estado === 'enviada' ? 'bg-green-100 text-green-800' :
                      orden.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {orden.estado || 'pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditarOrden(orden)} className="p-1 hover:bg-gray-100 rounded" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleEliminarOrden(orden)} className="p-1 hover:bg-gray-100 rounded" title="Eliminar">
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
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nueva Orden de Compra' : 'Editar Orden'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Número</label>
                  <input type="text" value={formData.numero} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Proveedor *</label>
                  <select
                    value={formData.proveedorId}
                    onChange={(e) => {
                      const proveedor = proveedores.find(p => p.id === e.target.value)
                      setFormData({ ...formData, proveedorId: e.target.value, proveedor: proveedor?.nombre || '' })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    required
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Producto *</label>
                  <input
                    type="text"
                    value={formData.producto}
                    onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cantidad *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cantidad}
                    onChange={(e) => {
                      const cantidad = e.target.value
                      const total = calcularTotal(cantidad, formData.precioUnitario)
                      setFormData({ ...formData, cantidad, total })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Precio Unitario *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precioUnitario}
                    onChange={(e) => {
                      const precioUnitario = e.target.value
                      const total = calcularTotal(formData.cantidad, precioUnitario)
                      setFormData({ ...formData, precioUnitario, total })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Total</label>
                  <input 
                    type="text" 
                    value={formatCurrency(formData.total || 0)} 
                    disabled 
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha Entrega</label>
                  <input
                    type="date"
                    value={formData.fechaEntrega}
                    onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="enviada">Enviada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-4" style={{ borderColor: 'var(--color-border)' }}>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                Cancelar
              </button>
              <button onClick={handleGuardarOrden} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                {modoModal === 'crear' ? 'Crear Orden' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdenesCompra









