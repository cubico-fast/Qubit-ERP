import { useState, useEffect } from 'react'
import { UserPlus, Search, Phone, Mail, Edit, Trash, Plus, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getLeads, saveLead, updateLead, deleteLead } from '../utils/firebaseUtils'

const Leads = () => {
  const { companyId } = useAuth()
  const [leads, setLeads] = useState([])
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroOrigen, setFiltroOrigen] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [leadSeleccionado, setLeadSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    origen: 'Web',
    interes: '',
    estado: 'Nuevo',
    responsable: '',
    notas: ''
  })

  useEffect(() => {
    loadLeads()
  }, [companyId])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const leadsData = await getLeads(companyId)
      setLeads(leadsData || [])
    } catch (error) {
      console.error('Error al cargar leads:', error)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearLead = () => {
    setModoModal('crear')
    setLeadSeleccionado(null)
    setFormData({
      nombre: '',
      empresa: '',
      email: '',
      telefono: '',
      origen: 'Web',
      interes: '',
      estado: 'Nuevo',
      responsable: '',
      notas: ''
    })
    setShowModal(true)
  }

  const handleEditarLead = (lead) => {
    setModoModal('editar')
    setLeadSeleccionado(lead)
    setFormData({
      nombre: lead.nombre || '',
      empresa: lead.empresa || '',
      email: lead.email || '',
      telefono: lead.telefono || '',
      origen: lead.origen || 'Web',
      interes: lead.interes || '',
      estado: lead.estado || 'Nuevo',
      responsable: lead.responsable || '',
      notas: lead.notas || ''
    })
    setShowModal(true)
  }

  const handleGuardarLead = async () => {
    try {
      if (!formData.nombre) {
        alert('El nombre es obligatorio')
        return
      }

      if (modoModal === 'crear') {
        await saveLead(formData, companyId)
        alert('✅ Lead creado exitosamente')
      } else {
        await updateLead(leadSeleccionado.id, formData, companyId)
        alert('✅ Lead actualizado exitosamente')
      }

      await loadLeads()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar lead:', error)
      alert('Error al guardar el lead: ' + error.message)
    }
  }

  const handleEliminarLead = async (lead) => {
    if (!window.confirm(`¿Está seguro de eliminar el lead ${lead.nombre}?`)) {
      return
    }

    try {
      await deleteLead(lead.id)
      await loadLeads()
      alert('✅ Lead eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar lead:', error)
      alert('Error al eliminar el lead: ' + error.message)
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchSearch = 
      lead.nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
      lead.empresa?.toLowerCase().includes(buscar.toLowerCase()) ||
      lead.email?.toLowerCase().includes(buscar.toLowerCase()) ||
      lead.telefono?.includes(buscar)

    const matchEstado = filtroEstado === 'Todos' || lead.estado === filtroEstado
    const matchOrigen = filtroOrigen === 'Todos' || lead.origen === filtroOrigen

    return matchSearch && matchEstado && matchOrigen
  })

  const estadisticas = {
    total: leads.length,
    nuevos: leads.filter(l => l.estado === 'Nuevo').length,
    contactados: leads.filter(l => l.estado === 'Contactado').length,
    calificados: leads.filter(l => l.estado === 'Calificado').length
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Leads y Prospectos
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Gestiona personas interesadas antes de convertirlas en clientes
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Leads</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {loading ? '...' : estadisticas.total}
              </p>
            </div>
            <UserPlus className="text-blue-500" size={32} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nuevos</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : estadisticas.nuevos}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold">N</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Contactados</p>
              <p className="text-2xl font-bold text-yellow-600">
                {loading ? '...' : estadisticas.contactados}
              </p>
            </div>
            <Phone className="text-yellow-600" size={32} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Calificados</p>
              <p className="text-2xl font-bold text-blue-600">
                {loading ? '...' : estadisticas.calificados}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones y Búsqueda */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar leads por nombre, empresa, teléfono..."
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
          onClick={handleCrearLead}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Lead
        </button>
      </div>

      {/* Información sobre Leads */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">¿Qué es un Lead?</h3>
        <p className="text-sm text-blue-800 mb-2">
          Un lead es alguien que mostró interés en tus productos o servicios pero aún no es cliente.
        </p>
        <ul className="text-sm text-blue-700 space-y-1 ml-4">
          <li>• Preguntó por WhatsApp</li>
          <li>• Llenó un formulario</li>
          <li>• Llamó por teléfono</li>
          <li>• Escribió por redes sociales</li>
        </ul>
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button 
          onClick={() => setFiltroEstado('Todos')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors ${filtroEstado === 'Todos' ? 'bg-blue-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Todos
        </button>
        <button 
          onClick={() => setFiltroEstado('Nuevo')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors ${filtroEstado === 'Nuevo' ? 'bg-green-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Nuevos
        </button>
        <button 
          onClick={() => setFiltroOrigen('Facebook')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors ${filtroOrigen === 'Facebook' ? 'bg-blue-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Facebook
        </button>
        <button 
          onClick={() => setFiltroOrigen('WhatsApp')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors ${filtroOrigen === 'WhatsApp' ? 'bg-green-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          WhatsApp
        </button>
        <button 
          onClick={() => setFiltroOrigen('Web')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors ${filtroOrigen === 'Web' ? 'bg-purple-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Web
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Empresa</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Origen</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Interés</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Responsable</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Cargando...
                </td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <UserPlus size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay leads registrados</p>
                  <p className="text-sm">Comienza registrando personas interesadas en tu negocio</p>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{lead.nombre}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{lead.empresa || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{lead.origen || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{lead.interes || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      lead.estado === 'Nuevo' ? 'bg-green-100 text-green-800' :
                      lead.estado === 'Contactado' ? 'bg-yellow-100 text-yellow-800' :
                      lead.estado === 'Calificado' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.estado || 'Nuevo'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{lead.responsable || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditarLead(lead)}
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarLead(lead)}
                        className="p-1 hover:bg-gray-100 rounded" 
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

      {/* Modal Crear/Editar Lead */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nuevo Lead' : 'Editar Lead'}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Origen</label>
                  <select
                    value={formData.origen}
                    onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <option value="Web">Web</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Referido">Referido</option>
                    <option value="Otro">Otro</option>
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
                    <option value="Nuevo">Nuevo</option>
                    <option value="Contactado">Contactado</option>
                    <option value="Calificado">Calificado</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Interés</label>
                  <input
                    type="text"
                    value={formData.interes}
                    onChange={(e) => setFormData({ ...formData, interes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="Producto o servicio de interés"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Responsable</label>
                  <input
                    type="text"
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ 
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)'
                  }}
                  placeholder="Información adicional sobre el lead..."
                />
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
                onClick={handleGuardarLead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Crear Lead' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Leads
