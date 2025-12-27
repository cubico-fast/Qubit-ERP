import { useState, useEffect } from 'react'
import { Plus, Search, Mail, Phone, Building, Calendar, Edit, Trash, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getContactos, saveContacto, updateContacto, deleteContacto } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const Contactos = () => {
  const { companyId } = useAuth()
  const [contactos, setContactos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [contactoSeleccionado, setContactoSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    cargo: '',
    ultimoContacto: '',
    estado: 'Tibio',
    notas: ''
  })

  useEffect(() => {
    loadContactos()
  }, [companyId])

  const loadContactos = async () => {
    try {
      setLoading(true)
      const contactosData = await getContactos(companyId)
      setContactos(contactosData || [])
    } catch (error) {
      console.error('Error al cargar contactos:', error)
      setContactos([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearContacto = () => {
    setModoModal('crear')
    setContactoSeleccionado(null)
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      empresa: '',
      cargo: '',
      ultimoContacto: new Date().toISOString().split('T')[0],
      estado: 'Tibio',
      notas: ''
    })
    setShowModal(true)
  }

  const handleEditarContacto = (contacto) => {
    setModoModal('editar')
    setContactoSeleccionado(contacto)
    setFormData({
      nombre: contacto.nombre || '',
      email: contacto.email || '',
      telefono: contacto.telefono || '',
      empresa: contacto.empresa || '',
      cargo: contacto.cargo || '',
      ultimoContacto: contacto.ultimoContacto || new Date().toISOString().split('T')[0],
      estado: contacto.estado || 'Tibio',
      notas: contacto.notas || ''
    })
    setShowModal(true)
  }

  const handleGuardarContacto = async () => {
    try {
      if (!formData.nombre) {
        alert('El nombre es obligatorio')
        return
      }

      if (modoModal === 'crear') {
        await saveContacto(formData, companyId)
        alert('✅ Contacto creado exitosamente')
      } else {
        await updateContacto(contactoSeleccionado.id, formData, companyId)
        alert('✅ Contacto actualizado exitosamente')
      }

      await loadContactos()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar contacto:', error)
      alert('Error al guardar el contacto: ' + error.message)
    }
  }

  const handleEliminarContacto = async (contacto) => {
    if (!window.confirm(`¿Está seguro de eliminar el contacto ${contacto.nombre}?`)) {
      return
    }

    try {
      await deleteContacto(contacto.id)
      await loadContactos()
      alert('✅ Contacto eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar contacto:', error)
      alert('Error al eliminar el contacto: ' + error.message)
    }
  }

  const filteredContactos = contactos.filter(contacto =>
    contacto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contacto.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contacto.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Caliente':
        return 'bg-red-100 text-red-800'
      case 'Tibio':
        return 'bg-yellow-100 text-yellow-800'
      case 'Frío':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Contactos</h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>Gestiona tus contactos y leads</p>
        </div>
        <button 
          onClick={handleCrearContacto}
          className="btn-primary mt-4 sm:mt-0 flex items-center space-x-2"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={20} />
          <span>Nuevo Contacto</span>
        </button>
      </div>

      <div className="card" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar contactos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)'
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
          Cargando contactos...
        </div>
      ) : filteredContactos.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
          <Building size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">No hay contactos registrados</p>
          <p className="text-sm">Comienza agregando tus contactos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContactos.map((contacto) => (
            <div 
              key={contacto.id} 
              className="card hover:shadow-lg transition-shadow"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                  >
                    {contacto.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                      {contacto.nombre}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {contacto.cargo || 'Sin cargo'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(contacto.estado)}`}>
                  {contacto.estado}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {contacto.empresa && (
                  <div className="flex items-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Building size={16} className="mr-2 text-gray-400" />
                    {contacto.empresa}
                  </div>
                )}
                {contacto.email && (
                  <div className="flex items-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Mail size={16} className="mr-2 text-gray-400" />
                    {contacto.email}
                  </div>
                )}
                {contacto.telefono && (
                  <div className="flex items-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Phone size={16} className="mr-2 text-gray-400" />
                    {contacto.telefono}
                  </div>
                )}
                {contacto.ultimoContacto && (
                  <div className="flex items-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    Último contacto: {formatDate(contacto.ultimoContacto)}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button 
                  onClick={() => handleEditarContacto(contacto)}
                  className="flex-1 btn-secondary text-sm"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleEliminarContacto(contacto)}
                  className="flex-1 btn-secondary text-sm text-red-600 hover:bg-red-50"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar Contacto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nuevo Contacto' : 'Editar Contacto'}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Empresa</label>
                  <input
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cargo</label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
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
                    <option value="Caliente">Caliente</option>
                    <option value="Tibio">Tibio</option>
                    <option value="Frío">Frío</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Último Contacto</label>
                  <input
                    type="date"
                    value={formData.ultimoContacto}
                    onChange={(e) => setFormData({ ...formData, ultimoContacto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="Información adicional sobre el contacto..."
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
                onClick={handleGuardarContacto}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Crear Contacto' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Contactos
