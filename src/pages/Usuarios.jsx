import { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash, X, Power, PowerOff, Shield, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getAllCompanies } from '../utils/firebaseUtils'
import { getUsersByCompany, getAllUsers, updateUser, setUserClaims, createUserWithCompany } from '../utils/adminUtils'
import { ROLES_LIST, getRoleName, getRoleById } from '../utils/roles'

const Usuarios = () => {
  const { companyId, isAdmin } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCompany, setFiltroCompany] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    companyId: companyId || '',
    role: 'operativo',
    admin: false,
    activo: true
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usuariosData, companiesData] = await Promise.all([
        getAllUsers(),
        getAllCompanies()
      ])
      
      setUsuarios(usuariosData || [])
      setCompanies(companiesData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setUsuarios([])
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearUsuario = () => {
    // Verificar permisos de administrador
    if (!isAdmin()) {
      alert('❌ Solo los administradores pueden crear usuarios')
      return
    }
    
    setModoModal('crear')
    setUsuarioSeleccionado(null)
    setFormData({
      email: '',
      password: '',
      displayName: '',
      companyId: companyId || '',
      role: 'operativo',
      admin: false,
      activo: true
    })
    setShowModal(true)
  }

  const handleEditarUsuario = (usuario) => {
    // Verificar permisos de administrador
    if (!isAdmin()) {
      alert('❌ Solo los administradores pueden editar usuarios')
      return
    }
    
    setModoModal('editar')
    setUsuarioSeleccionado(usuario)
    setFormData({
      email: usuario.email || '',
      password: '',
      displayName: usuario.displayName || '',
      companyId: usuario.companyId || '',
      role: usuario.role || 'operativo',
      admin: usuario.admin || false,
      activo: usuario.activo !== undefined ? usuario.activo : true
    })
    setShowModal(true)
  }

  const handleGuardarUsuario = async () => {
    // Verificar permisos de administrador antes de crear o editar
    if (!isAdmin()) {
      alert('❌ Solo los administradores pueden crear o editar usuarios')
      return
    }
    
    try {
      if (!formData.email || !formData.companyId) {
        alert('Email y empresa son obligatorios')
        return
      }

      if (modoModal === 'crear') {
        // Crear nuevo usuario
        if (!formData.password || formData.password.length < 6) {
          alert('La contraseña debe tener al menos 6 caracteres')
          return
        }

        // Determinar si es admin basado en el rol
        const isAdmin = formData.role === 'admin'
        
        try {
          await createUserWithCompany({
            email: formData.email,
            password: formData.password,
            displayName: formData.displayName,
            companyId: formData.companyId,
            role: formData.role,
            isAdmin: isAdmin,
            activo: formData.activo
          })

          alert('✅ Usuario creado exitosamente')
        } catch (createError) {
          // Si falla la Cloud Function, crear solo en Firestore
          if (createError.message?.includes('not found') || createError.message?.includes('Function') || createError.code === 'functions/not-found' || createError.code === 'functions/not-found') {
            // Crear solo el documento en Firestore
            const { doc, setDoc, collection, serverTimestamp } = await import('firebase/firestore')
            const { db } = await import('../config/firebase')
            const { getCompany } = await import('../utils/firebaseUtils')
            
            // Verificar que la empresa existe
            const company = await getCompany(formData.companyId)
            if (!company) {
              throw new Error(`La empresa ${formData.companyId} no existe`)
            }
            
            // Crear documento en Firestore
            const usersRef = collection(db, 'users')
            const newUserRef = doc(usersRef)
            
            await setDoc(newUserRef, {
              email: formData.email,
              companyId: formData.companyId,
              role: formData.role,
              admin: isAdmin,
              displayName: formData.displayName || '',
              activo: formData.activo,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              pendingAuthCreation: true // Marca que falta crear en Auth
            })
            
            alert('✅ Usuario creado exitosamente en Firestore.\n\n⚠️ IMPORTANTE: Debes crear el usuario en Firebase Auth:\n1. Ve a Firebase Console → Authentication → Add user\n2. Email: ' + formData.email + '\n3. Password: ' + formData.password + '\n4. Una vez creado, copia el UID y actualiza el documento en Firestore.')
          } else {
            throw createError
          }
        }
      } else if (modoModal === 'editar' && usuarioSeleccionado) {
        // Actualizar usuario
        const isAdmin = formData.role === 'admin'
        
        await updateUser(usuarioSeleccionado.id, {
          displayName: formData.displayName,
          companyId: formData.companyId,
          role: formData.role,
          admin: isAdmin,
          activo: formData.activo
        })

        // Actualizar custom claims si hay userId
        if (usuarioSeleccionado.userId || usuarioSeleccionado.uid) {
          try {
            const userId = usuarioSeleccionado.userId || usuarioSeleccionado.uid
            await setUserClaims(userId, formData.companyId, isAdmin)
          } catch (error) {
            console.warn('No se pudieron actualizar los claims:', error)
          }
        }

        alert('✅ Usuario actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      alert('Error al guardar usuario: ' + error.message)
    }
  }

  const handleEliminarUsuario = async (usuario) => {
    // Verificar permisos de administrador
    if (!isAdmin()) {
      alert('❌ Solo los administradores pueden desactivar usuarios')
      return
    }
    
    if (!window.confirm(`¿Está seguro de desactivar el usuario "${usuario.email}"?`)) {
      return
    }

    try {
      await updateUser(usuario.id, { activo: false })
      await loadData()
      alert('✅ Usuario desactivado exitosamente')
    } catch (error) {
      console.error('Error al desactivar usuario:', error)
      alert('Error al desactivar usuario: ' + error.message)
    }
  }

  const handleToggleEstado = async (usuario) => {
    // Verificar permisos de administrador
    if (!isAdmin()) {
      alert('❌ Solo los administradores pueden cambiar el estado de usuarios')
      return
    }
    
    try {
      await updateUser(usuario.id, { activo: !usuario.activo })
      await loadData()
      alert(`✅ Usuario ${!usuario.activo ? 'activado' : 'desactivado'} exitosamente`)
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('Error al cambiar estado: ' + error.message)
    }
  }

  const getNombreCompany = (companyId) => {
    const company = companies.find(c => c.companyId === companyId)
    return company ? company.nombre : companyId
  }

  // Filtrar el usuario super admin (admin@qubit.com) de la lista
  const filteredUsuarios = usuarios
    .filter(usuario => {
      // Ocultar el usuario super admin
      const email = usuario.email?.toLowerCase() || ''
      return email !== 'admin@qubit.com' && email !== 'admin@tudominio.com'
    })
    .filter(usuario =>
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(usuario => filtroCompany === 'Todos' || usuario.companyId === filtroCompany)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Usuarios
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Gestiona los usuarios del sistema, asigna empresas y roles administrativos.
        </p>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar usuarios..."
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
            value={filtroCompany}
            onChange={(e) => setFiltroCompany(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="Todos">Todas las empresas</option>
            {companies.map(company => (
              <option key={company.companyId} value={company.companyId}>{company.nombre}</option>
            ))}
          </select>
          <button 
            onClick={handleCrearUsuario}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Usuario</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Empresa</th>
              <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Rol</th>
              <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsuarios.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay usuarios registrados</p>
                  <p className="text-sm">Comienza creando un usuario desde Firebase Auth</p>
                </td>
              </tr>
            ) : (
              filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {usuario.displayName ? usuario.displayName.charAt(0).toUpperCase() : usuario.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {usuario.displayName || 'Sin nombre'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{usuario.email}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {getNombreCompany(usuario.companyId)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {getRoleName(usuario.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {usuario.activo ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {isAdmin() ? (
                        <>
                          <button 
                            onClick={() => handleToggleEstado(usuario)} 
                            className="p-1 hover:bg-gray-100 rounded" 
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                          >
                            {usuario.activo ? <PowerOff size={16} className="text-red-600" /> : <Power size={16} className="text-green-600" />}
                          </button>
                          <button 
                            onClick={() => handleEditarUsuario(usuario)} 
                            className="p-1 hover:bg-gray-100 rounded" 
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400" title="Solo los administradores pueden editar usuarios">
                          Sin permisos
                        </span>
                      )}
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
                {modoModal === 'crear' ? 'Nuevo Usuario' : 'Editar Usuario'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>USUARIO *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  disabled={modoModal === 'editar'}
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              {modoModal === 'crear' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Contraseña *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    La contraseña debe tener al menos 6 caracteres
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre Completo</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Nombre del usuario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Empresa *</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Seleccionar empresa...</option>
                  {companies.map(company => (
                    <option key={company.companyId} value={company.companyId}>{company.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value
                    setFormData({ 
                      ...formData, 
                      role: newRole,
                      admin: newRole === 'admin' // Auto-asignar admin si el rol es admin
                    })
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  {ROLES_LIST.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.icon} {role.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {getRoleById(formData.role)?.descripcion}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="rounded"
                  />
                  <span>Usuario Activo</span>
                </label>
                {formData.role === 'admin' && (
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                    <Shield size={12} />
                    Administrador
                  </span>
                )}
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
                onClick={handleGuardarUsuario}
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

export default Usuarios

