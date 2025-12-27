import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Search, Edit, Trash, X, Package, Building, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getSolicitudesCompra, saveSolicitudCompra, updateSolicitudCompra, deleteSolicitudCompra } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const SolicitudesCompra = () => {
  const { companyId } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null)

  const [formData, setFormData] = useState({
    numero: '',
    producto: '',
    cantidad: '',
    motivo: '',
    areaSolicitante: '',
    fechaNecesidad: '',
    estado: 'pendiente',
    notas: ''
  })

  useEffect(() => {
    loadSolicitudes()
  }, [companyId])

  const loadSolicitudes = async () => {
    try {
      setLoading(true)
      const solicitudesData = await getSolicitudesCompra(companyId)
      // Generar número si no existe
      const solicitudesConNumero = solicitudesData.map((s, index) => ({
        ...s,
        numero: s.numero || `SC-${String(index + 1).padStart(5, '0')}`
      }))
      setSolicitudes(solicitudesConNumero || [])
    } catch (error) {
      console.error('Error al cargar solicitudes:', error)
      setSolicitudes([])
    } finally {
      setLoading(false)
    }
  }

  const generarNumeroSolicitud = () => {
    const total = solicitudes.length + 1
    return `SC-${String(total).padStart(5, '0')}`
  }

  const handleCrearSolicitud = () => {
    setModoModal('crear')
    setSolicitudSeleccionada(null)
    setFormData({
      numero: generarNumeroSolicitud(),
      producto: '',
      cantidad: '',
      motivo: '',
      areaSolicitante: '',
      fechaNecesidad: '',
      estado: 'pendiente',
      notas: ''
    })
    setShowModal(true)
  }

  const handleEditarSolicitud = (solicitud) => {
    setModoModal('editar')
    setSolicitudSeleccionada(solicitud)
    setFormData({
      numero: solicitud.numero || generarNumeroSolicitud(),
      producto: solicitud.producto || '',
      cantidad: solicitud.cantidad || '',
      motivo: solicitud.motivo || '',
      areaSolicitante: solicitud.areaSolicitante || '',
      fechaNecesidad: solicitud.fechaNecesidad || '',
      estado: solicitud.estado || 'pendiente',
      notas: solicitud.notas || ''
    })
    setShowModal(true)
  }

  const handleGuardarSolicitud = async () => {
    try {
      if (!formData.producto || !formData.cantidad) {
        alert('El producto y la cantidad son obligatorios')
        return
      }

      if (modoModal === 'crear') {
        await saveSolicitudCompra(formData, companyId)
        alert('✅ Solicitud creada exitosamente')
      } else {
        await updateSolicitudCompra(solicitudSeleccionada.id, formData, companyId)
        alert('✅ Solicitud actualizada exitosamente')
      }

      await loadSolicitudes()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar solicitud:', error)
      alert('Error al guardar la solicitud: ' + error.message)
    }
  }

  const handleEliminarSolicitud = async (solicitud) => {
    if (!window.confirm(`¿Está seguro de eliminar la solicitud ${solicitud.numero}?`)) {
      return
    }

    try {
      await deleteSolicitudCompra(solicitud.id)
      await loadSolicitudes()
      alert('✅ Solicitud eliminada exitosamente')
    } catch (error) {
      console.error('Error al eliminar solicitud:', error)
      alert('Error al eliminar la solicitud: ' + error.message)
    }
  }

  const filteredSolicitudes = solicitudes.filter(solicitud => {
    const matchSearch = 
      solicitud.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.producto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.areaSolicitante?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchEstado = filtroEstado === 'Todas' || solicitud.estado === filtroEstado

    return matchSearch && matchEstado
  })

  const estadisticas = {
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    aprobadas: solicitudes.filter(s => s.estado === 'aprobada').length,
    rechazadas: solicitudes.filter(s => s.estado === 'rechazada').length
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Solicitudes de Compra
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Gestiona las necesidades internas antes de comprar (pedido interno, no externo)
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Solicitudes</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {loading ? '...' : estadisticas.total}
              </p>
            </div>
            <ClipboardList className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">
                {loading ? '...' : estadisticas.pendientes}
              </p>
            </div>
            <AlertCircle className="text-orange-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Aprobadas</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : estadisticas.aprobadas}
              </p>
            </div>
            <Package className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por número, producto, área..."
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
          onClick={handleCrearSolicitud}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Solicitud
        </button>
      </div>

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">📌 ¿Qué es una Solicitud de Compra?</h3>
        <p className="text-sm text-blue-800 mb-2">
          Es un pedido interno (no externo). Ejemplo: El almacén detecta stock mínimo y crea una solicitud.
          <strong>Aún no hay proveedor ni precio</strong> - solo se registra la necesidad.
        </p>
        <ul className="text-sm text-blue-700 space-y-1 ml-4">
          <li>• Stock mínimo de tóner: 5 | Stock actual: 2 → Solicitud de reposición</li>
          <li>• Áreas: Almacén, Producción, Administración</li>
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
          onClick={() => setFiltroEstado('aprobada')}
          className={`px-3 py-1 text-sm border rounded-full ${filtroEstado === 'aprobada' ? 'bg-green-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Aprobadas
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Número</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cantidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Motivo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Área</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>Cargando...</td></tr>
            ) : filteredSolicitudes.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay solicitudes registradas</p>
                  <p className="text-sm">Comienza creando una solicitud de compra</p>
                </td>
              </tr>
            ) : (
              filteredSolicitudes.map((solicitud) => (
                <tr key={solicitud.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>{solicitud.numero}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{solicitud.producto}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{solicitud.cantidad}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{solicitud.motivo || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{solicitud.areaSolicitante || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      solicitud.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                      solicitud.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {solicitud.estado || 'pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditarSolicitud(solicitud)} className="p-1 hover:bg-gray-100 rounded" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleEliminarSolicitud(solicitud)} className="p-1 hover:bg-gray-100 rounded" title="Eliminar">
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nueva Solicitud de Compra' : 'Editar Solicitud'}
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
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Área Solicitante</label>
                  <select
                    value={formData.areaSolicitante}
                    onChange={(e) => setFormData({ ...formData, areaSolicitante: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Almacén">Almacén</option>
                    <option value="Producción">Producción</option>
                    <option value="Administración">Administración</option>
                    <option value="Ventas">Ventas</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Motivo</label>
                  <input
                    type="text"
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: Reposición de stock"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha Necesidad</label>
                  <input
                    type="date"
                    value={formData.fechaNecesidad}
                    onChange={(e) => setFormData({ ...formData, fechaNecesidad: e.target.value })}
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
                    <option value="aprobada">Aprobada</option>
                    <option value="rechazada">Rechazada</option>
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
              <button onClick={handleGuardarSolicitud} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {modoModal === 'crear' ? 'Crear Solicitud' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SolicitudesCompra

