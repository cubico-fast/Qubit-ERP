import { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash, X, Building, UserCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getPersonal, savePersonal, updatePersonal, deletePersonal } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const GestionPersonal = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    cargo: '',
    area: '',
    tipoContrato: 'Indeterminado',
    fechaIngreso: new Date().toISOString().split('T')[0],
    sueldoBase: '',
    estado: 'Activo',
    telefono: '',
    email: '',
    direccion: '',
    gerencia: '',
    jefatura: ''
  })

  const areas = ['Administración', 'Ventas', 'Producción', 'Logística', 'Contabilidad', 'RRHH', 'Gerencia General']
  const tiposContrato = ['Indeterminado', 'Temporal', 'Por Obra', 'Servicios']
  const estados = ['Activo', 'Inactivo', 'Vacaciones', 'Licencia']

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const personalData = await getPersonal(companyId)
      setPersonal(personalData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setPersonal([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearEmpleado = () => {
    setModoModal('crear')
    setEmpleadoSeleccionado(null)
    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      cargo: '',
      area: '',
      tipoContrato: 'Indeterminado',
      fechaIngreso: new Date().toISOString().split('T')[0],
      sueldoBase: '',
      estado: 'Activo',
      telefono: '',
      email: '',
      direccion: '',
      gerencia: '',
      jefatura: ''
    })
    setShowModal(true)
  }

  const handleEditarEmpleado = (empleado) => {
    setModoModal('editar')
    setEmpleadoSeleccionado(empleado)
    setFormData({
      nombre: empleado.nombre || '',
      apellido: empleado.apellido || '',
      dni: empleado.dni || '',
      cargo: empleado.cargo || '',
      area: empleado.area || '',
      tipoContrato: empleado.tipoContrato || 'Indeterminado',
      fechaIngreso: empleado.fechaIngreso || new Date().toISOString().split('T')[0],
      sueldoBase: empleado.sueldoBase || '',
      estado: empleado.estado || 'Activo',
      telefono: empleado.telefono || '',
      email: empleado.email || '',
      direccion: empleado.direccion || '',
      gerencia: empleado.gerencia || '',
      jefatura: empleado.jefatura || ''
    })
    setShowModal(true)
  }

  const handleGuardarEmpleado = async () => {
    try {
      if (!formData.nombre || !formData.apellido || !formData.dni || !formData.cargo || !formData.area) {
        alert('Nombre, apellido, DNI, cargo y área son obligatorios')
        return
      }

      const empleadoData = {
        ...formData,
        nombreCompleto: `${formData.nombre} ${formData.apellido}`,
        sueldoBase: parseFloat(formData.sueldoBase) || 0
      }

      if (modoModal === 'crear') {
        await savePersonal(empleadoData, companyId)
        alert('✅ Empleado creado exitosamente')
      } else {
        await updatePersonal(empleadoSeleccionado.id, empleadoData, companyId)
        alert('✅ Empleado actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar empleado:', error)
      alert('Error al guardar empleado: ' + error.message)
    }
  }

  const handleEliminarEmpleado = async (empleado) => {
    if (!window.confirm(`¿Está seguro de eliminar a ${empleado.nombreCompleto || empleado.nombre}?`)) {
      return
    }

    try {
      await deletePersonal(empleado.id)
      await loadData()
      alert('✅ Empleado eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar empleado:', error)
      alert('Error al eliminar empleado: ' + error.message)
    }
  }

  const filteredPersonal = personal.filter(emp =>
    (emp.nombreCompleto || `${emp.nombre || ''} ${emp.apellido || ''}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(emp => filtroEstado === 'Todos' || emp.estado === filtroEstado)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando personal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Gestión de Personal
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Centraliza toda la información del trabajador en un solo lugar. Define estructura organizacional.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Empleados</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{personal.length}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {personal.filter(p => p.estado === 'Activo').length}
              </p>
            </div>
            <UserCircle className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI, cargo..."
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
            onClick={handleCrearEmpleado}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Empleado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>DNI</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cargo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Área</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Contrato</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>F. Ingreso</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Sueldo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPersonal.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay empleados registrados</p>
                  <p className="text-sm">Comienza registrando personal</p>
                </td>
              </tr>
            ) : (
              filteredPersonal.map((empleado) => (
                <tr key={empleado.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {empleado.nombreCompleto || `${empleado.nombre || ''} ${empleado.apellido || ''}`}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{empleado.dni || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{empleado.cargo || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{empleado.area || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{empleado.tipoContrato || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {empleado.fechaIngreso ? formatDate(empleado.fechaIngreso) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                    {empleado.sueldoBase ? formatCurrency(empleado.sueldoBase) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      empleado.estado === 'Activo' 
                        ? 'bg-green-100 text-green-800' 
                        : empleado.estado === 'Vacaciones'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {empleado.estado || 'Activo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditarEmpleado(empleado)} 
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarEmpleado(empleado)} 
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
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nuevo Empleado' : 'Editar Empleado'}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Apellido *</label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>DNI *</label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Gerencia</label>
                  <input
                    type="text"
                    value={formData.gerencia}
                    onChange={(e) => setFormData({ ...formData, gerencia: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: Gerencia General"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Área *</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Seleccionar área...</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Jefatura</label>
                  <input
                    type="text"
                    value={formData.jefatura}
                    onChange={(e) => setFormData({ ...formData, jefatura: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cargo *</label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: Operario de Producción"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tipo de Contrato</label>
                  <select
                    value={formData.tipoContrato}
                    onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    {tiposContrato.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha de Ingreso</label>
                  <input
                    type="date"
                    value={formData.fechaIngreso}
                    onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Sueldo Base</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sueldoBase}
                    onChange={(e) => setFormData({ ...formData, sueldoBase: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0.00"
                  />
                </div>
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
                onClick={handleGuardarEmpleado}
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

export default GestionPersonal

