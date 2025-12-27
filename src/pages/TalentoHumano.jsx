import { useState, useEffect } from 'react'
import { Briefcase, Plus, Search, Edit, Trash, X, UserPlus, GraduationCap, Star, Filter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getTalentoHumano, saveTalentoHumano, updateTalentoHumano, deleteTalentoHumano, getPersonal } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const TalentoHumano = () => {
  const { companyId } = useAuth()
  const [registros, setRegistros] = useState([])
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)

  const tiposRegistro = ['Reclutamiento', 'Capacitación', 'Evaluación']

  const [formData, setFormData] = useState({
    tipo: 'Reclutamiento',
    empleadoId: '',
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'Pendiente',
    resultado: '',
    observaciones: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [registrosData, personalData] = await Promise.all([
        getTalentoHumano(companyId),
        getPersonal(companyId)
      ])
      
      setRegistros(registrosData || [])
      setPersonal(personalData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setRegistros([])
      setPersonal([])
    } finally {
      setLoading(false)
    }
  }

  const handleNuevoRegistro = (tipo) => {
    setModoModal('crear')
    setRegistroSeleccionado(null)
    setFormData({
      tipo: tipo || 'Reclutamiento',
      empleadoId: '',
      titulo: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'Pendiente',
      resultado: '',
      observaciones: ''
    })
    setShowModal(true)
  }

  const handleEditarRegistro = (registro) => {
    setModoModal('editar')
    setRegistroSeleccionado(registro)
    setFormData({
      tipo: registro.tipo || 'Reclutamiento',
      empleadoId: registro.empleadoId || '',
      titulo: registro.titulo || '',
      descripcion: registro.descripcion || '',
      fecha: registro.fecha || new Date().toISOString().split('T')[0],
      estado: registro.estado || 'Pendiente',
      resultado: registro.resultado || '',
      observaciones: registro.observaciones || ''
    })
    setShowModal(true)
  }

  const handleGuardarRegistro = async () => {
    try {
      if (!formData.titulo) {
        alert('El título es obligatorio')
        return
      }

      if (formData.tipo === 'Capacitación' || formData.tipo === 'Evaluación') {
        if (!formData.empleadoId) {
          alert('El empleado es obligatorio para este tipo de registro')
          return
        }
      }

      if (modoModal === 'crear') {
        await saveTalentoHumano(formData, companyId)
        alert('✅ Registro creado exitosamente')
      } else {
        await updateTalentoHumano(registroSeleccionado.id, formData, companyId)
        alert('✅ Registro actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar registro:', error)
      alert('Error al guardar registro: ' + error.message)
    }
  }

  const handleEliminarRegistro = async (registro) => {
    if (!window.confirm(`¿Está seguro de eliminar este registro?`)) {
      return
    }

    try {
      await deleteTalentoHumano(registro.id)
      await loadData()
      alert('✅ Registro eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar registro:', error)
      alert('Error al eliminar registro: ' + error.message)
    }
  }

  const getNombreEmpleado = (empleadoId) => {
    const empleado = personal.find(p => p.id === empleadoId)
    return empleado ? (empleado.nombreCompleto || `${empleado.nombre || ''} ${empleado.apellido || ''}`) : empleadoId
  }

  const getTipoIcono = (tipo) => {
    switch(tipo) {
      case 'Reclutamiento':
        return <UserPlus size={20} className="text-blue-500" />
      case 'Capacitación':
        return <GraduationCap size={20} className="text-green-500" />
      case 'Evaluación':
        return <Star size={20} className="text-yellow-500" />
      default:
        return <Briefcase size={20} />
    }
  }

  const filteredRegistros = registros.filter(reg =>
    reg.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getNombreEmpleado(reg.empleadoId)?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(reg => filtroTipo === 'Todos' || reg.tipo === filtroTipo)

  const estadisticas = {
    reclutamiento: registros.filter(r => r.tipo === 'Reclutamiento').length,
    capacitacion: registros.filter(r => r.tipo === 'Capacitación').length,
    evaluacion: registros.filter(r => r.tipo === 'Evaluación').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando registros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Talento Humano
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Reclutamiento, capacitación y evaluación de desempeño. Ayuda a crecer y retener talento.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Reclutamiento</p>
              <p className="text-2xl font-bold text-blue-600">{estadisticas.reclutamiento}</p>
            </div>
            <UserPlus className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Capacitación</p>
              <p className="text-2xl font-bold text-green-600">{estadisticas.capacitacion}</p>
            </div>
            <GraduationCap className="text-green-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Evaluaciones</p>
              <p className="text-2xl font-bold text-yellow-600">{estadisticas.evaluacion}</p>
            </div>
            <Star className="text-yellow-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar registros..."
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
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="Todos">Todos</option>
            {tiposRegistro.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button 
              onClick={() => handleNuevoRegistro('Reclutamiento')}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              title="Nuevo Reclutamiento"
            >
              <UserPlus size={16} />
            </button>
            <button 
              onClick={() => handleNuevoRegistro('Capacitación')}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              title="Nueva Capacitación"
            >
              <GraduationCap size={16} />
            </button>
            <button 
              onClick={() => handleNuevoRegistro('Evaluación')}
              className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 text-sm"
              title="Nueva Evaluación"
            >
              <Star size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tipo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Título</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Empleado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Resultado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistros.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay registros</p>
                  <p className="text-sm">Comienza creando un registro de talento humano</p>
                </td>
              </tr>
            ) : (
              filteredRegistros.map((registro) => (
                <tr key={registro.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getTipoIcono(registro.tipo)}
                      <span style={{ color: 'var(--color-text)' }}>{registro.tipo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>{registro.titulo}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {registro.empleadoId ? getNombreEmpleado(registro.empleadoId) : '-'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {registro.fecha ? formatDate(registro.fecha) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      registro.estado === 'Completado' || registro.estado === 'Aprobado'
                        ? 'bg-green-100 text-green-800'
                        : registro.estado === 'Rechazado' || registro.estado === 'Cancelado'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {registro.estado || 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {registro.tipo === 'Evaluación' && registro.resultado ? `${registro.resultado} / 5` : (registro.resultado || '-')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditarRegistro(registro)} 
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarRegistro(registro)} 
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
                {modoModal === 'crear' ? `Nuevo ${formData.tipo}` : 'Editar Registro'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  {tiposRegistro.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              {(formData.tipo === 'Capacitación' || formData.tipo === 'Evaluación') && (
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
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder={formData.tipo === 'Reclutamiento' ? 'Ej: Vacante: Asistente Administrativo' : formData.tipo === 'Capacitación' ? 'Ej: Curso: Uso del ERP' : 'Ej: Evaluación Anual'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Descripción del registro..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Completado">Completado</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Rechazado">Rechazado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {formData.tipo === 'Evaluación' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Resultado (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.resultado}
                    onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: 4.2"
                  />
                </div>
              )}

              {formData.tipo === 'Reclutamiento' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Resultado</label>
                  <input
                    type="text"
                    value={formData.resultado}
                    onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: 15 postulantes, 1 seleccionado"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Observaciones adicionales..."
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
                onClick={handleGuardarRegistro}
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

export default TalentoHumano

