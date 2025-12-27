import { useState, useEffect } from 'react'
import { Calendar, Phone, Video, Mail, MessageCircle, Clock, Plus, Search, Edit, Trash, CheckCircle, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getActividades, saveActividad, updateActividad, deleteActividad } from '../utils/firebaseUtils'
import { formatDate, formatDateTime } from '../utils/dateUtils'

const Actividades = () => {
  const { companyId } = useAuth()
  const [actividades, setActividades] = useState([])
  const [buscar, setBuscar] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todas')
  const [filtroEstado, setFiltroEstado] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [tipoActividad, setTipoActividad] = useState('llamada')
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null)

  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'llamada',
    cliente: '',
    descripcion: '',
    fecha: '',
    hora: '',
    estado: 'pendiente',
    proximaAccion: ''
  })

  useEffect(() => {
    loadActividades()
  }, [companyId])

  const loadActividades = async () => {
    try {
      setLoading(true)
      const actividadesData = await getActividades(companyId)
      setActividades(actividadesData || [])
    } catch (error) {
      console.error('Error al cargar actividades:', error)
      setActividades([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearActividad = (tipo = 'llamada') => {
    setModoModal('crear')
    setTipoActividad(tipo)
    setActividadSeleccionada(null)
    const fechaHoy = new Date().toISOString().split('T')[0]
    setFormData({
      titulo: '',
      tipo: tipo,
      cliente: '',
      descripcion: '',
      fecha: fechaHoy,
      hora: '',
      estado: 'pendiente',
      proximaAccion: ''
    })
    setShowModal(true)
  }

  const handleEditarActividad = (actividad) => {
    setModoModal('editar')
    setTipoActividad(actividad.tipo || 'llamada')
    setActividadSeleccionada(actividad)
    const fecha = actividad.fecha || (actividad.createdAt?.toDate ? actividad.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    setFormData({
      titulo: actividad.titulo || '',
      tipo: actividad.tipo || 'llamada',
      cliente: actividad.cliente || '',
      descripcion: actividad.descripcion || '',
      fecha: fecha,
      hora: actividad.hora || '',
      estado: actividad.estado || 'pendiente',
      proximaAccion: actividad.proximaAccion || ''
    })
    setShowModal(true)
  }

  const handleGuardarActividad = async () => {
    try {
      if (!formData.titulo || !formData.cliente) {
        alert('El título y el cliente son obligatorios')
        return
      }

      const actividadData = {
        ...formData,
        tipo: tipoActividad,
        fecha: formData.fecha || new Date().toISOString().split('T')[0]
      }

      if (modoModal === 'crear') {
        await saveActividad(actividadData, companyId)
        alert('✅ Actividad creada exitosamente')
      } else {
        await updateActividad(actividadSeleccionada.id, actividadData, companyId)
        alert('✅ Actividad actualizada exitosamente')
      }

      await loadActividades()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar actividad:', error)
      alert('Error al guardar la actividad: ' + error.message)
    }
  }

  const handleEliminarActividad = async (actividad) => {
    if (!window.confirm(`¿Está seguro de eliminar la actividad "${actividad.titulo}"?`)) {
      return
    }

    try {
      await deleteActividad(actividad.id)
      await loadActividades()
      alert('✅ Actividad eliminada exitosamente')
    } catch (error) {
      console.error('Error al eliminar actividad:', error)
      alert('Error al eliminar la actividad: ' + error.message)
    }
  }

  const handleCompletarActividad = async (actividad) => {
    try {
      await updateActividad(actividad.id, { ...actividad, estado: 'completada' }, companyId)
      await loadActividades()
      alert('✅ Actividad completada')
    } catch (error) {
      console.error('Error al completar actividad:', error)
      alert('Error al completar la actividad: ' + error.message)
    }
  }

  const filteredActividades = actividades.filter(actividad => {
    const matchSearch = 
      actividad.titulo?.toLowerCase().includes(buscar.toLowerCase()) ||
      actividad.cliente?.toLowerCase().includes(buscar.toLowerCase()) ||
      actividad.descripcion?.toLowerCase().includes(buscar.toLowerCase())

    const matchTipo = filtroTipo === 'Todas' || actividad.tipo === filtroTipo
    const matchEstado = filtroEstado === 'Todas' || actividad.estado === filtroEstado

    return matchSearch && matchTipo && matchEstado
  })

  const estadisticas = {
    pendientesHoy: actividades.filter(a => {
      const fecha = a.fecha || (a.createdAt?.toDate ? a.createdAt.toDate().toISOString().split('T')[0] : '')
      const hoy = new Date().toISOString().split('T')[0]
      return a.estado === 'pendiente' && fecha === hoy
    }).length,
    llamadas: actividades.filter(a => a.tipo === 'llamada').length,
    reuniones: actividades.filter(a => a.tipo === 'reunion').length,
    completadas: actividades.filter(a => a.estado === 'completada').length
  }

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'llamada': return <Phone size={20} className="text-blue-600" />
      case 'reunion': return <Video size={20} className="text-purple-600" />
      case 'correo': return <Mail size={20} className="text-green-600" />
      case 'seguimiento': return <MessageCircle size={20} className="text-orange-600" />
      default: return <Calendar size={20} className="text-gray-600" />
    }
  }

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'llamada': return 'bg-blue-100'
      case 'reunion': return 'bg-purple-100'
      case 'correo': return 'bg-green-100'
      case 'seguimiento': return 'bg-orange-100'
      default: return 'bg-gray-100'
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Actividades
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Gestiona llamadas, reuniones, correos y seguimientos con clientes
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pendientes Hoy</p>
              <p className="text-2xl font-bold text-orange-600">
                {loading ? '...' : estadisticas.pendientesHoy}
              </p>
            </div>
            <Clock className="text-orange-500" size={32} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Llamadas</p>
              <p className="text-2xl font-bold text-blue-600">
                {loading ? '...' : estadisticas.llamadas}
              </p>
            </div>
            <Phone className="text-blue-500" size={32} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Reuniones</p>
              <p className="text-2xl font-bold text-purple-600">
                {loading ? '...' : estadisticas.reuniones}
              </p>
            </div>
            <Video className="text-purple-500" size={32} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Completadas</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : estadisticas.completadas}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones y Búsqueda */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar actividades por cliente, tipo, descripción..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ 
              borderColor: 'var(--color-border)', 
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          />
        </div>
        <button 
          onClick={() => handleCrearActividad('llamada')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Actividad
        </button>
      </div>

      {/* Información sobre Actividades */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">¿Qué registra el CRM en Actividades?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <Phone size={16} /> Llamadas telefónicas
              </li>
              <li className="flex items-center gap-2">
                <Video size={16} /> Reuniones (presencial/virtual)
              </li>
            </ul>
          </div>
          <div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <Mail size={16} /> Correos electrónicos
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={16} /> Seguimientos programados
              </li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-blue-700 mt-3">
          💡 El ERP te recuerda qué hacer, evita que olvides clientes y deja historial completo
        </p>
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button 
          onClick={() => { setFiltroTipo('Todas'); setFiltroEstado('Todas') }}
          className={`px-3 py-1 text-sm border rounded-full transition-colors flex items-center gap-1 ${filtroTipo === 'Todas' && filtroEstado === 'Todas' ? 'bg-blue-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Clock size={14} />
          Todas
        </button>
        <button 
          onClick={() => setFiltroEstado('pendiente')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors flex items-center gap-1 ${filtroEstado === 'pendiente' ? 'bg-orange-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Clock size={14} />
          Pendientes
        </button>
        <button 
          onClick={() => setFiltroTipo('llamada')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors flex items-center gap-1 ${filtroTipo === 'llamada' ? 'bg-blue-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Phone size={14} />
          Llamadas
        </button>
        <button 
          onClick={() => setFiltroTipo('reunion')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors flex items-center gap-1 ${filtroTipo === 'reunion' ? 'bg-purple-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Video size={14} />
          Reuniones
        </button>
        <button 
          onClick={() => setFiltroTipo('correo')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors flex items-center gap-1 ${filtroTipo === 'correo' ? 'bg-green-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Mail size={14} />
          Correos
        </button>
        <button 
          onClick={() => setFiltroEstado('completada')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors flex items-center gap-1 ${filtroEstado === 'completada' ? 'bg-green-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          <CheckCircle size={14} />
          Completadas
        </button>
      </div>

      {/* Timeline de Actividades */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Cargando...
          </div>
        ) : filteredActividades.length === 0 ? (
          <div className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            <Calendar size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No hay actividades registradas</p>
            <p className="text-sm mb-4">Comienza registrando tus interacciones con clientes</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 max-w-2xl mx-auto mt-6">
              <button 
                onClick={() => handleCrearActividad('llamada')}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors" 
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Phone size={24} className="mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Llamada</p>
              </button>
              <button 
                onClick={() => handleCrearActividad('reunion')}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors" 
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Video size={24} className="mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">Reunión</p>
              </button>
              <button 
                onClick={() => handleCrearActividad('correo')}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors" 
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Mail size={24} className="mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Correo</p>
              </button>
              <button 
                onClick={() => handleCrearActividad('seguimiento')}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors" 
                style={{ borderColor: 'var(--color-border)' }}
              >
                <MessageCircle size={24} className="mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium">Seguimiento</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {filteredActividades.map((actividad) => {
              const fecha = actividad.fecha || (actividad.createdAt?.toDate ? actividad.createdAt.toDate().toISOString().split('T')[0] : '')
              
              return (
                <div key={actividad.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${getTipoColor(actividad.tipo)}`}>
                      {getTipoIcon(actividad.tipo)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                          {actividad.titulo}
                        </h3>
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {fecha ? formatDate(fecha) : '-'}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Cliente: {actividad.cliente}
                      </p>
                      <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
                        {actividad.descripcion}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          actividad.estado === 'completada' ? 'bg-green-100 text-green-800' :
                          actividad.estado === 'pendiente' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {actividad.estado || 'pendiente'}
                        </span>
                        {actividad.proximaAccion && (
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            Próxima acción: {actividad.proximaAccion}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {actividad.estado !== 'completada' && (
                        <button 
                          onClick={() => handleCompletarActividad(actividad)}
                          className="p-1 hover:bg-gray-100 rounded" 
                          title="Completar"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditarActividad(actividad)}
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarActividad(actividad)}
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Eliminar"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Actividad */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? `Nueva ${tipoActividad === 'llamada' ? 'Llamada' : tipoActividad === 'reunion' ? 'Reunión' : tipoActividad === 'correo' ? 'Correo' : 'Seguimiento'}` : 'Editar Actividad'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tipo</label>
                  <select
                    value={tipoActividad}
                    onChange={(e) => {
                      setTipoActividad(e.target.value)
                      setFormData({ ...formData, tipo: e.target.value })
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <option value="llamada">Llamada</option>
                    <option value="reunion">Reunión</option>
                    <option value="correo">Correo</option>
                    <option value="seguimiento">Seguimiento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Título *</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="Ej: Llamada de seguimiento con cliente ABC"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cliente *</label>
                  <input
                    type="text"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Hora</label>
                  <input
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="Detalles de la actividad..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Próxima Acción</label>
                  <input
                    type="text"
                    value={formData.proximaAccion}
                    onChange={(e) => setFormData({ ...formData, proximaAccion: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="Ej: Enviar cotización en 2 días"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-4" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarActividad}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Crear Actividad' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Actividades
