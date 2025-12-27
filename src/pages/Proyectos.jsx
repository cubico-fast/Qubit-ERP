import { useState, useEffect } from 'react'
import { FolderKanban, Plus, Search, Edit, Trash, X, Calendar, DollarSign, User, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getProyectos, saveProyecto, updateProyecto, deleteProyecto, getClientes, getTareas, getCostosProyecto } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const Proyectos = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [proyectos, setProyectos] = useState([])
  const [clientes, setClientes] = useState([])
  const [tareas, setTareas] = useState([])
  const [costos, setCostos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    clienteId: '',
    cliente: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFinEstimada: '',
    presupuesto: '',
    descripcion: '',
    estado: 'En Planificación'
  })

  const estados = ['En Planificación', 'En Ejecución', 'En Pausa', 'Completado', 'Cancelado']

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [proyectosData, clientesData, tareasData, costosData] = await Promise.all([
        getProyectos(companyId),
        getClientes(companyId),
        getTareas(companyId),
        getCostosProyecto(companyId)
      ])
      
      setProyectos(proyectosData || [])
      setClientes(clientesData || [])
      setTareas(tareasData || [])
      setCostos(costosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setProyectos([])
      setClientes([])
      setTareas([])
      setCostos([])
    } finally {
      setLoading(false)
    }
  }

  const calcularCostosProyecto = (proyectoId) => {
    return costos
      .filter(c => c.proyectoId === proyectoId)
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0)
  }

  const calcularRentabilidad = (proyecto) => {
    const costoTotal = calcularCostosProyecto(proyecto.id)
    const ingreso = parseFloat(proyecto.presupuesto) || 0
    const utilidad = ingreso - costoTotal
    const margen = ingreso > 0 ? (utilidad / ingreso) * 100 : 0
    return { costoTotal, ingreso, utilidad, margen }
  }

  const handleCrearProyecto = () => {
    setModoModal('crear')
    setProyectoSeleccionado(null)
    setFormData({
      nombre: '',
      clienteId: '',
      cliente: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFinEstimada: '',
      presupuesto: '',
      descripcion: '',
      estado: 'En Planificación'
    })
    setShowModal(true)
  }

  const handleEditarProyecto = (proyecto) => {
    setModoModal('editar')
    setProyectoSeleccionado(proyecto)
    setFormData({
      nombre: proyecto.nombre || '',
      clienteId: proyecto.clienteId || '',
      cliente: proyecto.cliente || '',
      fechaInicio: proyecto.fechaInicio || new Date().toISOString().split('T')[0],
      fechaFinEstimada: proyecto.fechaFinEstimada || '',
      presupuesto: proyecto.presupuesto || '',
      descripcion: proyecto.descripcion || '',
      estado: proyecto.estado || 'En Planificación'
    })
    setShowModal(true)
  }

  const handleGuardarProyecto = async () => {
    try {
      if (!formData.nombre || !formData.clienteId) {
        alert('Nombre y cliente son obligatorios')
        return
      }

      const cliente = clientes.find(c => c.id === formData.clienteId)
      const proyectoData = {
        ...formData,
        cliente: cliente?.nombre || formData.cliente,
        presupuesto: parseFloat(formData.presupuesto) || 0
      }

      if (modoModal === 'crear') {
        await saveProyecto(proyectoData, companyId)
        alert('✅ Proyecto creado exitosamente')
      } else {
        await updateProyecto(proyectoSeleccionado.id, proyectoData, companyId)
        alert('✅ Proyecto actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar proyecto:', error)
      alert('Error al guardar proyecto: ' + error.message)
    }
  }

  const handleEliminarProyecto = async (proyecto) => {
    if (!window.confirm(`¿Está seguro de eliminar el proyecto ${proyecto.nombre}?`)) {
      return
    }

    try {
      await deleteProyecto(proyecto.id)
      await loadData()
      alert('✅ Proyecto eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar proyecto:', error)
      alert('Error al eliminar proyecto: ' + error.message)
    }
  }

  const getTareasProyecto = (proyectoId) => {
    return tareas.filter(t => t.proyectoId === proyectoId)
  }

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'Completado':
        return 'bg-green-100 text-green-800'
      case 'En Ejecución':
        return 'bg-blue-100 text-blue-800'
      case 'En Planificación':
        return 'bg-yellow-100 text-yellow-800'
      case 'En Pausa':
        return 'bg-orange-100 text-orange-800'
      case 'Cancelado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredProyectos = proyectos.filter(proy =>
    proy.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proy.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(proy => filtroEstado === 'Todos' || proy.estado === filtroEstado)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Proyectos
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          El contenedor principal que agrupa todo: cliente, tareas, personas y costos. Todo se imputa al proyecto.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Proyectos</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{proyectos.length}</p>
            </div>
            <FolderKanban className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>En Ejecución</p>
              <p className="text-2xl font-bold text-blue-600">
                {proyectos.filter(p => p.estado === 'En Ejecución').length}
              </p>
            </div>
            <TrendingUp className="text-blue-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar proyectos..."
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
            <option value="Todos">Todos</option>
            {estados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
          <button 
            onClick={handleCrearProyecto}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Proyecto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha Inicio</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha Fin</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Presupuesto</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Costos</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Utilidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProyectos.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <FolderKanban size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay proyectos registrados</p>
                  <p className="text-sm">Comienza creando un proyecto</p>
                </td>
              </tr>
            ) : (
              filteredProyectos.map((proyecto) => {
                const rentabilidad = calcularRentabilidad(proyecto)
                const tareasProyecto = getTareasProyecto(proyecto.id)
                return (
                  <tr key={proyecto.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{proyecto.nombre}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {tareasProyecto.length} tarea(s)
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{proyecto.cliente || '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {proyecto.fechaInicio ? formatDate(proyecto.fechaInicio) : '-'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {proyecto.fechaFinEstimada ? formatDate(proyecto.fechaFinEstimada) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(rentabilidad.ingreso)}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(rentabilidad.costoTotal)}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${rentabilidad.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(rentabilidad.utilidad)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(proyecto.estado)}`}>
                        {proyecto.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditarProyecto(proyecto)} 
                          className="p-1 hover:bg-gray-100 rounded" 
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleEliminarProyecto(proyecto)} 
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
                {modoModal === 'crear' ? 'Nuevo Proyecto' : 'Editar Proyecto'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre del Proyecto *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: Implementación ERP ABC SAC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cliente *</label>
                <select
                  value={formData.clienteId}
                  onChange={(e) => {
                    const cliente = clientes.find(c => c.id === e.target.value)
                    setFormData({ 
                      ...formData, 
                      clienteId: e.target.value,
                      cliente: cliente?.nombre || ''
                    })
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                  ))}
                </select>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Presupuesto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.presupuesto}
                    onChange={(e) => setFormData({ ...formData, presupuesto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0.00"
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
                    {estados.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Descripción del proyecto..."
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
                onClick={handleGuardarProyecto}
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

export default Proyectos

