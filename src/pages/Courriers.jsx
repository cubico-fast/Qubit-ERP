import { useState, useEffect } from 'react'
import { Truck, Plus, Search, Edit, Trash, X, Phone, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getCourriers, saveCourrier, updateCourrier, deleteCourrier } from '../utils/firebaseUtils'

const Courriers = () => {
  const { companyId } = useAuth()
  const [courriers, setCourriers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [courrierSeleccionado, setCourrierSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    tipoVehiculo: 'Moto',
    placa: '',
    estado: 'Activo',
    notas: ''
  })

  const tiposVehiculo = ['Moto', 'Carro', 'Camión', 'Furgón', 'Otro']

  useEffect(() => {
    loadCourriers()
  }, [companyId])

  const loadCourriers = async () => {
    try {
      setLoading(true)
      const courriersData = await getCourriers(companyId)
      setCourriers(courriersData || [])
    } catch (error) {
      console.error('Error al cargar courriers:', error)
      setCourriers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearCourrier = () => {
    setModoModal('crear')
    setCourrierSeleccionado(null)
    setFormData({
      nombre: '',
      telefono: '',
      email: '',
      tipoVehiculo: 'Moto',
      placa: '',
      estado: 'Activo',
      notas: ''
    })
    setShowModal(true)
  }

  const handleEditarCourrier = (courrier) => {
    setModoModal('editar')
    setCourrierSeleccionado(courrier)
    setFormData({
      nombre: courrier.nombre || '',
      telefono: courrier.telefono || '',
      email: courrier.email || '',
      tipoVehiculo: courrier.tipoVehiculo || 'Moto',
      placa: courrier.placa || '',
      estado: courrier.estado || 'Activo',
      notas: courrier.notas || ''
    })
    setShowModal(true)
  }

  const handleGuardarCourrier = async () => {
    try {
      if (!formData.nombre) {
        alert('El nombre es obligatorio')
        return
      }

      if (modoModal === 'crear') {
        await saveCourrier(formData, companyId)
        alert('✅ Courrier creado exitosamente')
      } else {
        await updateCourrier(courrierSeleccionado.id, formData, companyId)
        alert('✅ Courrier actualizado exitosamente')
      }

      await loadCourriers()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar courrier:', error)
      alert('Error al guardar el courrier: ' + error.message)
    }
  }

  const handleEliminarCourrier = async (courrier) => {
    if (!window.confirm(`¿Está seguro de eliminar el courrier ${courrier.nombre}?`)) {
      return
    }

    try {
      await deleteCourrier(courrier.id)
      await loadCourriers()
      alert('✅ Courrier eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar courrier:', error)
      alert('Error al eliminar el courrier: ' + error.message)
    }
  }

  const filteredCourriers = courriers.filter(courrier =>
    courrier.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    courrier.telefono?.includes(searchTerm) ||
    courrier.placa?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Courriers (✈️🚛🚖)
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Administra los courriers que traen tus paquetes
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Courriers</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {loading ? '...' : courriers.length}
              </p>
            </div>
            <Truck className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : courriers.filter(c => c.estado === 'Activo').length}
              </p>
            </div>
            <Truck className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones y Búsqueda */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar courriers por nombre, teléfono, placa..."
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
          onClick={handleCrearCourrier}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Courrier
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Courrier</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Teléfono</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tipo de Vehículo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Placa</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Cargando...
                </td>
              </tr>
            ) : filteredCourriers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Truck size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay courriers registrados</p>
                  <p className="text-sm">Comienza registrando tus courriers</p>
                </td>
              </tr>
            ) : (
              filteredCourriers.map((courrier) => (
                <tr key={courrier.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{courrier.nombre}</p>
                      {courrier.email && (
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{courrier.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{courrier.telefono || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{courrier.tipoVehiculo || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{courrier.placa || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      courrier.estado === 'Activo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {courrier.estado || 'Activo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditarCourrier(courrier)} 
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarCourrier(courrier)} 
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
                {modoModal === 'crear' ? 'Nuevo Courrier' : 'Editar Courrier'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Nombre del courrier"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Teléfono de contacto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tipo de Vehículo</label>
                  <select
                    value={formData.tipoVehiculo}
                    onChange={(e) => setFormData({ ...formData, tipoVehiculo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    {tiposVehiculo.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Placa</label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Placa del vehículo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
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
                onClick={handleGuardarCourrier}
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

export default Courriers

