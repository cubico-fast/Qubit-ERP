import { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash, X, Building, Mail, Phone, CreditCard, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getProveedores, saveProveedor, updateProveedor, deleteProveedor } from '../utils/firebaseUtils'

const Proveedores = () => {
  const { companyId } = useAuth()
  const [proveedores, setProveedores] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    contacto: '',
    condicionPago: '30 días',
    moneda: 'Soles',
    productos: '',
    estado: 'Activo',
    notas: ''
  })

  useEffect(() => {
    loadProveedores()
  }, [companyId])

  const loadProveedores = async () => {
    try {
      setLoading(true)
      const proveedoresData = await getProveedores(companyId)
      setProveedores(proveedoresData || [])
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
      setProveedores([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearProveedor = () => {
    setModoModal('crear')
    setProveedorSeleccionado(null)
    setFormData({
      nombre: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: '',
      contacto: '',
      condicionPago: '30 días',
      moneda: 'Soles',
      productos: '',
      estado: 'Activo',
      notas: ''
    })
    setShowModal(true)
  }

  const handleEditarProveedor = (proveedor) => {
    setModoModal('editar')
    setProveedorSeleccionado(proveedor)
    setFormData({
      nombre: proveedor.nombre || '',
      ruc: proveedor.ruc || '',
      direccion: proveedor.direccion || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      contacto: proveedor.contacto || '',
      condicionPago: proveedor.condicionPago || '30 días',
      moneda: proveedor.moneda || 'Soles',
      productos: proveedor.productos || '',
      estado: proveedor.estado || 'Activo',
      notas: proveedor.notas || ''
    })
    setShowModal(true)
  }

  const handleGuardarProveedor = async () => {
    try {
      if (!formData.nombre) {
        alert('El nombre es obligatorio')
        return
      }

      if (modoModal === 'crear') {
        await saveProveedor(formData, companyId)
        alert('✅ Proveedor creado exitosamente')
      } else {
        await updateProveedor(proveedorSeleccionado.id, formData, companyId)
        alert('✅ Proveedor actualizado exitosamente')
      }

      await loadProveedores()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar proveedor:', error)
      alert('Error al guardar el proveedor: ' + error.message)
    }
  }

  const handleEliminarProveedor = async (proveedor) => {
    if (!window.confirm(`¿Está seguro de eliminar el proveedor ${proveedor.nombre}?`)) {
      return
    }

    try {
      await deleteProveedor(proveedor.id)
      await loadProveedores()
      alert('✅ Proveedor eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar proveedor:', error)
      alert('Error al eliminar el proveedor: ' + error.message)
    }
  }

  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.ruc?.includes(searchTerm) ||
    proveedor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Proveedores
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Administra quién te vende y controla tus costos
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Proveedores</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {loading ? '...' : proveedores.length}
              </p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : proveedores.filter(p => p.estado === 'Activo').length}
              </p>
            </div>
            <Building className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones y Búsqueda */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar proveedores por nombre, RUC, email..."
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
          onClick={handleCrearProveedor}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>

      {/* Información */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-900 mb-2">📌 Base de todo el módulo</h3>
        <p className="text-sm text-green-800 mb-2">
          Los proveedores son la base del módulo de compras. Aquí registras:
        </p>
        <ul className="text-sm text-green-700 space-y-1 ml-4">
          <li>• Quién te vende productos o servicios</li>
          <li>• Condiciones de pago y crédito</li>
          <li>• Productos que ofrece cada proveedor</li>
          <li>• Información de contacto</li>
        </ul>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Proveedor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>RUC</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Contacto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Condición de Pago</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Productos</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
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
            ) : filteredProveedores.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay proveedores registrados</p>
                  <p className="text-sm">Comienza registrando tus proveedores</p>
                </td>
              </tr>
            ) : (
              filteredProveedores.map((proveedor) => (
                <tr key={proveedor.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{proveedor.nombre}</p>
                      {proveedor.email && (
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{proveedor.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{proveedor.ruc || '-'}</td>
                  <td className="px-4 py-3">
                    <div>
                      {proveedor.contacto && (
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>{proveedor.contacto}</p>
                      )}
                      {proveedor.telefono && (
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{proveedor.telefono}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{proveedor.condicionPago || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {proveedor.productos || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      proveedor.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {proveedor.estado || 'Activo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditarProveedor(proveedor)}
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarProveedor(proveedor)}
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

      {/* Modal Crear/Editar Proveedor */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre del Proveedor *</label>
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
                    placeholder="Ej: Tech Supplies SAC"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>RUC</label>
                  <input
                    type="text"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="Ej: 20547896321"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Contacto</label>
                  <input
                    type="text"
                    value={formData.contacto}
                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="Ej: Ana López"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Condición de Pago</label>
                  <select
                    value={formData.condicionPago}
                    onChange={(e) => setFormData({ ...formData, condicionPago: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <option value="Contado">Contado</option>
                    <option value="15 días">Crédito 15 días</option>
                    <option value="30 días">Crédito 30 días</option>
                    <option value="45 días">Crédito 45 días</option>
                    <option value="60 días">Crédito 60 días</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Moneda</label>
                  <select
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <option value="Soles">Soles (S/)</option>
                    <option value="Dólares">Dólares (USD)</option>
                    <option value="Euros">Euros (EUR)</option>
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
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Productos que vende</label>
                  <input
                    type="text"
                    value={formData.productos}
                    onChange={(e) => setFormData({ ...formData, productos: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    placeholder="Ej: Impresoras, tóners, papel"
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
                    placeholder="Información adicional sobre el proveedor..."
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
                onClick={handleGuardarProveedor}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Crear Proveedor' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proveedores

