import { useState, useEffect } from 'react'
import { CheckSquare, Plus, Search, Edit, Trash, X, Clock, User, Calendar, FolderKanban } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getTareas, saveTarea, updateTarea, deleteTarea, getProyectos, getPersonal } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const Tareas = () => {
  const { companyId } = useAuth()
  const [tareas, setTareas] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null)

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    proyectoId: '',
    responsableId: '',
    prioridad: 'Media',
    estado: 'Pendiente',
    tiempoEstimado: '',
    tiempoReal: '',
    fechaVencimiento: '',
    fechaCreacion: new Date().toISOString().split('T')[0]
  })

  const prioridades = ['Alta', 'Media', 'Baja']
  const estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tareasData, proyectosData, personalData] = await Promise.all([
        getTareas(companyId),
        getProyectos(companyId),
        getPersonal(companyId)
      ])
      
      setTareas(tareasData || [])
      setProyectos(proyectosData || [])
      setPersonal(personalData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setTareas([])
      setProyectos([])
      setPersonal([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearTarea = () => {
    setModoModal('crear')
    setTareaSeleccionada(null)
    setFormData({
      titulo: '',
      descripcion: '',
      proyectoId: '',
      responsableId: '',
      prioridad: 'Media',
      estado: 'Pendiente',
      tiempoEstimado: '',
      tiempoReal: '',
      fechaVencimiento: '',
      fechaCreacion: new Date().toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleEditarTarea = (tarea) => {
    setModoModal('editar')
    setTareaSeleccionada(tarea)
    setFormData({
      titulo: tarea.titulo || '',
      descripcion: tarea.descripcion || '',
      proyectoId: tarea.proyectoId || '',
      responsableId: tarea.responsableId || '',
      prioridad: tarea.prioridad || 'Media',
      estado: tarea.estado || 'Pendiente',
      tiempoEstimado: tarea.tiempoEstimado || '',
      tiempoReal: tarea.tiempoReal || '',
      fechaVencimiento: tarea.fechaVencimiento || '',
      fechaCreacion: tarea.fechaCreacion || new Date().toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleGuardarTarea = async () => {
    try {
      if (!formData.titulo) {
        alert('El título es obligatorio')
        return
      }

      const tareaData = {
        ...formData,
        tiempoEstimado: parseFloat(formData.tiempoEstimado) || 0,
        tiempoReal: parseFloat(formData.tiempoReal) || 0
      }

      if (modoModal === 'crear') {
        await saveTarea(tareaData, companyId)
        alert('✅ Tarea creada exitosamente')
      } else {
        await updateTarea(tareaSeleccionada.id, tareaData, companyId)
        alert('✅ Tarea actualizada exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar tarea:', error)
      alert('Error al guardar tarea: ' + error.message)
    }
  }

  const handleEliminarTarea = async (tarea) => {
    if (!window.confirm(`¿Está seguro de eliminar la tarea "${tarea.titulo}"?`)) {
      return
    }

    try {
      await deleteTarea(tarea.id)
      await loadData()
      alert('✅ Tarea eliminada exitosamente')
    } catch (error) {
      console.error('Error al eliminar tarea:', error)
      alert('Error al eliminar tarea: ' + error.message)
    }
  }

  const toggleTarea = async (tarea) => {
    const nuevoEstado = tarea.estado === 'Completada' ? 'Pendiente' : 'Completada'
    try {
      await updateTarea(tarea.id, { estado: nuevoEstado }, companyId)
      await loadData()
    } catch (error) {
      console.error('Error al actualizar tarea:', error)
      alert('Error al actualizar tarea: ' + error.message)
    }
  }

  const getNombreProyecto = (proyectoId) => {
    const proyecto = proyectos.find(p => p.id === proyectoId)
    return proyecto ? proyecto.nombre : proyectoId
  }

  const getNombreEmpleado = (empleadoId) => {
    const empleado = personal.find(p => p.id === empleadoId)
    return empleado ? (empleado.nombreCompleto || `${empleado.nombre || ''} ${empleado.apellido || ''}`) : empleadoId
  }

  const getPrioridadColor = (prioridad) => {
    switch(prioridad) {
      case 'Alta':
        return 'bg-red-100 text-red-800'
      case 'Media':
        return 'bg-yellow-100 text-yellow-800'
      case 'Baja':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTareas = tareas.filter(tarea =>
    tarea.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tarea.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(tarea => 
    (filtroProyecto === 'Todos' || tarea.proyectoId === filtroProyecto) &&
    (filtroEstado === 'Todos' || tarea.estado === filtroEstado)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando tareas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Tareas
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Actividades específicas dentro del proyecto. Controla responsable, estado, tiempo estimado y tiempo real.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Tareas</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{tareas.length}</p>
            </div>
            <CheckSquare className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tareas.filter(t => t.estado === 'Pendiente').length}
              </p>
            </div>
            <Clock className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>En Progreso</p>
              <p className="text-2xl font-bold text-blue-600">
                {tareas.filter(t => t.estado === 'En Progreso').length}
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
                {tareas.filter(t => t.estado === 'Completada').length}
              </p>
            </div>
            <CheckSquare className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones y Filtros */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar tareas..."
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
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="Todos">Todos los proyectos</option>
            {proyectos.map(proy => (
              <option key={proy.id} value={proy.id}>{proy.nombre}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="Todos">Todos</option>
            {estados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
          <button 
            onClick={handleCrearTarea}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="space-y-4">
        {filteredTareas.length === 0 ? (
          <div className="p-12 text-center border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>No hay tareas</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Comienza creando una tarea</p>
          </div>
        ) : (
          filteredTareas.map((tarea) => (
            <div 
              key={tarea.id} 
              className={`p-4 border rounded-lg hover:shadow-md transition-all ${
                tarea.estado === 'Completada' ? 'opacity-75' : ''
              }`}
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-start space-x-4">
                <button
                  onClick={() => toggleTarea(tarea)}
                  className="mt-1 flex-shrink-0"
                  title={tarea.estado === 'Completada' ? 'Marcar como pendiente' : 'Marcar como completada'}
                >
                  {tarea.estado === 'Completada' ? (
                    <CheckSquare className="text-green-600" size={24} />
                  ) : (
                    <CheckSquare className="text-gray-400 hover:text-primary-600" size={24} />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${
                        tarea.estado === 'Completada' 
                          ? 'line-through' 
                          : ''
                      }`} style={{ color: 'var(--color-text)' }}>
                        {tarea.titulo}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {tarea.descripcion || '-'}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPrioridadColor(tarea.prioridad)}`}>
                        {tarea.prioridad}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tarea.estado === 'Completada'
                          ? 'bg-green-100 text-green-800'
                          : tarea.estado === 'En Progreso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tarea.estado}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    {tarea.proyectoId && (
                      <div className="flex items-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <FolderKanban size={16} className="mr-2" />
                        {getNombreProyecto(tarea.proyectoId)}
                      </div>
                    )}
                    {tarea.responsableId && (
                      <div className="flex items-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <User size={16} className="mr-2" />
                        {getNombreEmpleado(tarea.responsableId)}
                      </div>
                    )}
                    {tarea.tiempoEstimado > 0 && (
                      <div className="flex items-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <Clock size={16} className="mr-2" />
                        Est: {tarea.tiempoEstimado}h
                      </div>
                    )}
                    {tarea.tiempoReal > 0 && (
                      <div className="flex items-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        <Clock size={16} className="mr-2" />
                        Real: {tarea.tiempoReal}h
                      </div>
                    )}
                    {tarea.fechaVencimiento && (
                      <div className="flex items-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <Calendar size={16} className="mr-2" />
                        {formatDate(tarea.fechaVencimiento)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditarTarea(tarea)} 
                    className="p-1 hover:bg-gray-100 rounded" 
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleEliminarTarea(tarea)} 
                    className="p-1 hover:bg-gray-100 rounded text-red-600" 
                    title="Eliminar"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
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
                {modoModal === 'crear' ? 'Nueva Tarea' : 'Editar Tarea'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: Levantamiento de procesos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Proyecto</label>
                <select
                  value={formData.proyectoId}
                  onChange={(e) => setFormData({ ...formData, proyectoId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Sin proyecto</option>
                  {proyectos.map(proy => (
                    <option key={proy.id} value={proy.id}>{proy.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Descripción de la tarea..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Responsable</label>
                  <select
                    value={formData.responsableId}
                    onChange={(e) => setFormData({ ...formData, responsableId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Sin asignar</option>
                    {personal.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombreCompleto || `${emp.nombre || ''} ${emp.apellido || ''}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Prioridad</label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    {prioridades.map(pri => (
                      <option key={pri} value={pri}>{pri}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    {estados.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tiempo Estimado (horas)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.tiempoEstimado}
                    onChange={(e) => setFormData({ ...formData, tiempoEstimado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tiempo Real (horas)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.tiempoReal}
                    onChange={(e) => setFormData({ ...formData, tiempoReal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: 12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
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
                onClick={handleGuardarTarea}
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

export default Tareas
