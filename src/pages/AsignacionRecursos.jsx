import { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash, X, DollarSign, Clock, Calculator } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getAsignacionesRecursos, saveAsignacionRecurso, updateAsignacionRecurso, deleteAsignacionRecurso, getProyectos, getTareas, getPersonal } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const AsignacionRecursos = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [asignaciones, setAsignaciones] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [tareas, setTareas] = useState([])
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null)

  const [formData, setFormData] = useState({
    proyectoId: '',
    tareaId: '',
    empleadoId: '',
    rol: '',
    costoHora: '',
    horasAsignadas: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    tipoRecurso: 'Persona',
    descripcion: ''
  })

  const tiposRecurso = ['Persona', 'Equipo', 'Material']

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [asignacionesData, proyectosData, tareasData, personalData] = await Promise.all([
        getAsignacionesRecursos(companyId),
        getProyectos(companyId),
        getTareas(companyId),
        getPersonal(companyId)
      ])
      
      setAsignaciones(asignacionesData || [])
      setProyectos(proyectosData || [])
      setTareas(tareasData || [])
      setPersonal(personalData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setAsignaciones([])
      setProyectos([])
      setTareas([])
      setPersonal([])
    } finally {
      setLoading(false)
    }
  }

  const calcularCostoTotal = (costoHora, horas) => {
    return (parseFloat(costoHora) || 0) * (parseFloat(horas) || 0)
  }

  const handleCrearAsignacion = () => {
    setModoModal('crear')
    setAsignacionSeleccionada(null)
    setFormData({
      proyectoId: '',
      tareaId: '',
      empleadoId: '',
      rol: '',
      costoHora: '',
      horasAsignadas: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
      tipoRecurso: 'Persona',
      descripcion: ''
    })
    setShowModal(true)
  }

  const handleEditarAsignacion = (asignacion) => {
    setModoModal('editar')
    setAsignacionSeleccionada(asignacion)
    setFormData({
      proyectoId: asignacion.proyectoId || '',
      tareaId: asignacion.tareaId || '',
      empleadoId: asignacion.empleadoId || '',
      rol: asignacion.rol || '',
      costoHora: asignacion.costoHora || '',
      horasAsignadas: asignacion.horasAsignadas || '',
      fechaInicio: asignacion.fechaInicio || new Date().toISOString().split('T')[0],
      fechaFin: asignacion.fechaFin || '',
      tipoRecurso: asignacion.tipoRecurso || 'Persona',
      descripcion: asignacion.descripcion || ''
    })
    setShowModal(true)
  }

  const handleGuardarAsignacion = async () => {
    try {
      if (!formData.proyectoId || !formData.empleadoId || !formData.costoHora || !formData.horasAsignadas) {
        alert('Proyecto, empleado, costo/hora y horas asignadas son obligatorios')
        return
      }

      const costoTotal = calcularCostoTotal(formData.costoHora, formData.horasAsignadas)
      
      const asignacionData = {
        ...formData,
        costoHora: parseFloat(formData.costoHora),
        horasAsignadas: parseFloat(formData.horasAsignadas),
        costoTotal: costoTotal
      }

      if (modoModal === 'crear') {
        await saveAsignacionRecurso(asignacionData, companyId)
        alert('✅ Asignación creada exitosamente')
      } else {
        await updateAsignacionRecurso(asignacionSeleccionada.id, asignacionData, companyId)
        alert('✅ Asignación actualizada exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar asignación:', error)
      alert('Error al guardar asignación: ' + error.message)
    }
  }

  const handleEliminarAsignacion = async (asignacion) => {
    if (!window.confirm(`¿Está seguro de eliminar esta asignación?`)) {
      return
    }

    try {
      await deleteAsignacionRecurso(asignacion.id)
      await loadData()
      alert('✅ Asignación eliminada exitosamente')
    } catch (error) {
      console.error('Error al eliminar asignación:', error)
      alert('Error al eliminar asignación: ' + error.message)
    }
  }

  const getNombreProyecto = (proyectoId) => {
    const proyecto = proyectos.find(p => p.id === proyectoId)
    return proyecto ? proyecto.nombre : proyectoId
  }

  const getNombreTarea = (tareaId) => {
    const tarea = tareas.find(t => t.id === tareaId)
    return tarea ? tarea.titulo : tareaId
  }

  const getNombreEmpleado = (empleadoId) => {
    const empleado = personal.find(p => p.id === empleadoId)
    return empleado ? (empleado.nombreCompleto || `${empleado.nombre || ''} ${empleado.apellido || ''}`) : empleadoId
  }

  const filteredAsignaciones = asignaciones.filter(asig =>
    getNombreEmpleado(asig.empleadoId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getNombreProyecto(asig.proyectoId)?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(asig => filtroProyecto === 'Todos' || asig.proyectoId === filtroProyecto)

  const costoTotalAsignaciones = asignaciones.reduce((sum, a) => 
    sum + (parseFloat(a.costoTotal) || calcularCostoTotal(a.costoHora, a.horasAsignadas)), 0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando asignaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Asignación de Recursos
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Controla quién trabaja y con qué en cada proyecto. El ERP acumula este costo al proyecto.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Asignaciones</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{asignaciones.length}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Costo Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(costoTotalAsignaciones)}
              </p>
            </div>
            <DollarSign className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar asignaciones..."
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
          <button 
            onClick={handleCrearAsignacion}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Asignación
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Proyecto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tarea</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Empleado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Rol</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Costo/Hora</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Horas</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Costo Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAsignaciones.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay asignaciones registradas</p>
                  <p className="text-sm">Comienza creando una asignación de recursos</p>
                </td>
              </tr>
            ) : (
              filteredAsignaciones.map((asignacion) => {
                const costoTotal = asignacion.costoTotal || calcularCostoTotal(asignacion.costoHora, asignacion.horasAsignadas)
                return (
                  <tr key={asignacion.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {getNombreProyecto(asignacion.proyectoId)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {asignacion.tareaId ? getNombreTarea(asignacion.tareaId) : '-'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {getNombreEmpleado(asignacion.empleadoId)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {asignacion.rol || '-'}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(asignacion.costoHora || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {asignacion.horasAsignadas || 0}h
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {formatCurrency(costoTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditarAsignacion(asignacion)} 
                          className="p-1 hover:bg-gray-100 rounded" 
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleEliminarAsignacion(asignacion)} 
                          className="p-1 hover:bg-gray-100 rounded text-red-600" 
                          title="Eliminar"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
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
                {modoModal === 'crear' ? 'Nueva Asignación' : 'Editar Asignación'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Proyecto *</label>
                <select
                  value={formData.proyectoId}
                  onChange={(e) => {
                    setFormData({ ...formData, proyectoId: e.target.value, tareaId: '' })
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Seleccionar proyecto...</option>
                  {proyectos.map(proy => (
                    <option key={proy.id} value={proy.id}>{proy.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tarea</label>
                <select
                  value={formData.tareaId}
                  onChange={(e) => setFormData({ ...formData, tareaId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  disabled={!formData.proyectoId}
                >
                  <option value="">Sin tarea específica</option>
                  {tareas.filter(t => t.proyectoId === formData.proyectoId).map(tarea => (
                    <option key={tarea.id} value={tarea.id}>{tarea.titulo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Empleado *</label>
                <select
                  value={formData.empleadoId}
                  onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Seleccionar empleado...</option>
                  {personal.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombreCompleto || `${emp.nombre || ''} ${emp.apellido || ''}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Rol</label>
                  <input
                    type="text"
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: Consultor ERP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Costo por Hora *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costoHora}
                    onChange={(e) => setFormData({ ...formData, costoHora: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Horas Asignadas *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.horasAsignadas}
                    onChange={(e) => setFormData({ ...formData, horasAsignadas: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full p-3 border rounded-lg bg-blue-50" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Costo Total</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(calcularCostoTotal(formData.costoHora, formData.horasAsignadas))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha Fin</label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="2"
                  placeholder="Descripción adicional..."
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
                onClick={handleGuardarAsignacion}
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

export default AsignacionRecursos

