import { useState, useEffect } from 'react'
import { Shield, Plus, Search, Edit, Trash, X, CheckSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getRoles, saveRol, updateRol, deleteRol } from '../utils/firebaseUtils'

const RolesPermisos = () => {
  const { companyId } = useAuth()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [rolSeleccionado, setRolSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    permisos: {
      ventas: { ver: false, crear: false, editar: false, eliminar: false },
      compras: { ver: false, crear: false, editar: false, eliminar: false },
      inventarios: { ver: false, crear: false, editar: false, eliminar: false },
      finanzas: { ver: false, crear: false, editar: false, eliminar: false },
      rrhh: { ver: false, crear: false, editar: false, eliminar: false },
      proyectos: { ver: false, crear: false, editar: false, eliminar: false },
      reportes: { ver: false, crear: false, editar: false, eliminar: false },
      admin: { ver: false, crear: false, editar: false, eliminar: false }
    }
  })

  const modulos = [
    { clave: 'ventas', nombre: 'Ventas' },
    { clave: 'compras', nombre: 'Compras' },
    { clave: 'inventarios', nombre: 'Inventarios' },
    { clave: 'finanzas', nombre: 'Finanzas' },
    { clave: 'rrhh', nombre: 'Recursos Humanos' },
    { clave: 'proyectos', nombre: 'Proyectos' },
    { clave: 'reportes', nombre: 'Reportes' },
    { clave: 'admin', nombre: 'Administración' }
  ]

  const acciones = ['ver', 'crear', 'editar', 'eliminar']

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const rolesData = await getRoles(companyId)
      setRoles(rolesData || [])
    } catch (error) {
      console.error('Error al cargar roles:', error)
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearRol = () => {
    setModoModal('crear')
    setRolSeleccionado(null)
    setFormData({
      nombre: '',
      descripcion: '',
      permisos: {
        ventas: { ver: false, crear: false, editar: false, eliminar: false },
        compras: { ver: false, crear: false, editar: false, eliminar: false },
        inventarios: { ver: false, crear: false, editar: false, eliminar: false },
        finanzas: { ver: false, crear: false, editar: false, eliminar: false },
        rrhh: { ver: false, crear: false, editar: false, eliminar: false },
        proyectos: { ver: false, crear: false, editar: false, eliminar: false },
        reportes: { ver: false, crear: false, editar: false, eliminar: false },
        admin: { ver: false, crear: false, editar: false, eliminar: false }
      }
    })
    setShowModal(true)
  }

  const handleEditarRol = (rol) => {
    setModoModal('editar')
    setRolSeleccionado(rol)
    setFormData({
      nombre: rol.nombre || '',
      descripcion: rol.descripcion || '',
      permisos: rol.permisos || formData.permisos
    })
    setShowModal(true)
  }

  const handleGuardarRol = async () => {
    try {
      if (!formData.nombre) {
        alert('El nombre del rol es obligatorio')
        return
      }

      const rolData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        permisos: formData.permisos
      }

      if (modoModal === 'crear') {
        await saveRol(rolData, companyId)
        alert('✅ Rol creado exitosamente')
      } else {
        await updateRol(rolSeleccionado.id, rolData, companyId)
        alert('✅ Rol actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar rol:', error)
      alert('Error al guardar rol: ' + error.message)
    }
  }

  const handleEliminarRol = async (rol) => {
    if (!window.confirm(`¿Está seguro de eliminar el rol "${rol.nombre}"?`)) {
      return
    }

    try {
      await deleteRol(rol.id)
      await loadData()
      alert('✅ Rol eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar rol:', error)
      alert('Error al eliminar rol: ' + error.message)
    }
  }

  const handleTogglePermiso = (modulo, accion) => {
    setFormData({
      ...formData,
      permisos: {
        ...formData.permisos,
        [modulo]: {
          ...formData.permisos[modulo],
          [accion]: !formData.permisos[modulo][accion]
        }
      }
    })
  }

  const filteredRoles = roles.filter(rol =>
    rol.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rol.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando roles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Roles y Permisos
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Define roles y permisos para controlar el acceso a los diferentes módulos del sistema.
        </p>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar roles..."
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
          onClick={handleCrearRol}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Rol
        </button>
      </div>

      {/* Lista de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.length === 0 ? (
          <div className="col-span-full p-12 text-center border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <Shield size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>No hay roles definidos</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Comienza creando un rol</p>
          </div>
        ) : (
          filteredRoles.map((rol) => (
            <div 
              key={rol.id} 
              className="p-4 border rounded-lg hover:shadow-md transition-all"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <Shield className="text-blue-600" size={20} />
                    {rol.nombre}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {rol.descripcion || 'Sin descripción'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditarRol(rol)} 
                    className="p-1 hover:bg-gray-100 rounded" 
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleEliminarRol(rol)} 
                    className="p-1 hover:bg-gray-100 rounded text-red-600" 
                    title="Eliminar"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              {/* Resumen de Permisos */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Permisos:</p>
                <div className="flex flex-wrap gap-1">
                  {modulos.map(modulo => {
                    const permisosModulo = rol.permisos?.[modulo.clave] || {}
                    const tienePermisos = acciones.some(accion => permisosModulo[accion])
                    if (tienePermisos) {
                      return (
                        <span 
                          key={modulo.clave}
                          className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800"
                        >
                          {modulo.nombre}
                        </span>
                      )
                    }
                    return null
                  })}
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
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nuevo Rol' : 'Editar Rol'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre del Rol *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: Administrador, Vendedor, Contador..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="2"
                  placeholder="Descripción del rol..."
                />
              </div>

              {/* Permisos por Módulo */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>Permisos por Módulo</label>
                <div className="space-y-4">
                  {modulos.map(modulo => (
                    <div 
                      key={modulo.clave}
                      className="p-4 border rounded-lg"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}
                    >
                      <h4 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{modulo.nombre}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {acciones.map(accion => (
                          <label 
                            key={accion}
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ color: 'var(--color-text)' }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.permisos[modulo.clave]?.[accion] || false}
                              onChange={() => handleTogglePermiso(modulo.clave, accion)}
                              className="rounded"
                            />
                            <span className="text-sm capitalize">{accion}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
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
                onClick={handleGuardarRol}
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

export default RolesPermisos

