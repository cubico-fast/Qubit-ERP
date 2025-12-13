import { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
  Package, 
  ShoppingCart, 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  Settings,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { 
  getAllCompanies, 
  createOrUpdateCompany, 
  getCompany 
} from '../utils/firebaseUtils'
import { 
  getUsersByCompany, 
  getAllUsers,
  toggleCompanyStatus,
  getCompanyStats,
  setUserClaims,
  updateUser
} from '../utils/adminUtils'

const AdminPanel = () => {
  const { companyId, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('companies')
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [companyStats, setCompanyStats] = useState({})

  // Formulario de empresa
  const [companyForm, setCompanyForm] = useState({
    companyId: '',
    nombre: '',
    descripcion: '',
    activa: true,
    plan: 'gratis', // gratis, basico, premium
    limites: {
      maxUsuarios: 1,
      maxVentas: 100,
      maxProductos: 50
    }
  })

  // Formulario de usuario
  const [userForm, setUserForm] = useState({
    email: '',
    companyId: '',
    isAdmin: false,
    displayName: ''
  })

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'companies') {
        const companiesData = await getAllCompanies()
        setCompanies(companiesData)
        
        // Cargar estadísticas para cada empresa
        const stats = {}
        for (const company of companiesData) {
          try {
            stats[company.companyId] = await getCompanyStats(company.companyId)
          } catch (error) {
            console.error(`Error al cargar stats de ${company.companyId}:`, error)
          }
        }
        setCompanyStats(stats)
      } else if (activeTab === 'users') {
        const usersData = await getAllUsers()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      alert('Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async () => {
    try {
      await createOrUpdateCompany(companyForm)
      alert('✅ Empresa creada exitosamente')
      setShowCompanyModal(false)
      resetCompanyForm()
      loadData()
    } catch (error) {
      console.error('Error al crear empresa:', error)
      alert('Error al crear empresa: ' + error.message)
    }
  }

  const handleUpdateCompany = async () => {
    try {
      await createOrUpdateCompany({
        ...editingCompany,
        ...companyForm
      })
      alert('✅ Empresa actualizada exitosamente')
      setShowCompanyModal(false)
      setEditingCompany(null)
      resetCompanyForm()
      loadData()
    } catch (error) {
      console.error('Error al actualizar empresa:', error)
      alert('Error al actualizar empresa: ' + error.message)
    }
  }

  const handleToggleCompanyStatus = async (companyId, currentStatus) => {
    if (!window.confirm(`¿Estás seguro de ${currentStatus ? 'desactivar' : 'activar'} esta empresa?`)) {
      return
    }

    try {
      await toggleCompanyStatus(companyId, !currentStatus)
      alert('✅ Estado de empresa actualizado')
      loadData()
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('Error al cambiar estado: ' + error.message)
    }
  }

  const handleEditCompany = async (company) => {
    setEditingCompany(company)
    setCompanyForm({
      companyId: company.companyId,
      nombre: company.nombre || '',
      descripcion: company.descripcion || '',
      activa: company.activa !== false,
      plan: company.plan || 'gratis',
      limites: company.limites || {
        maxUsuarios: 1,
        maxVentas: 100,
        maxProductos: 50
      }
    })
    setShowCompanyModal(true)
  }

  const handleCreateUser = async () => {
    try {
      // Nota: La creación real del usuario debe hacerse desde el backend
      // Esta función solo crea el documento en Firestore
      // Debes implementar una Cloud Function para crear usuarios
      alert('⚠️ La creación de usuarios debe hacerse desde el backend. Por ahora solo se actualiza Firestore.')
      
      // Aquí deberías llamar a una Cloud Function que cree el usuario
      // await createUserWithCompany(userForm)
      
      setShowUserModal(false)
      resetUserForm()
      loadData()
    } catch (error) {
      console.error('Error al crear usuario:', error)
      alert('Error al crear usuario: ' + error.message)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      await updateUser(editingUser.id, {
        companyId: userForm.companyId,
        isAdmin: userForm.isAdmin,
        displayName: userForm.displayName
      })
      alert('✅ Usuario actualizado exitosamente')
      setShowUserModal(false)
      setEditingUser(null)
      resetUserForm()
      loadData()
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      alert('Error al actualizar usuario: ' + error.message)
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setUserForm({
      email: user.email || '',
      companyId: user.companyId || '',
      isAdmin: user.admin || false,
      displayName: user.displayName || ''
    })
    setShowUserModal(true)
  }

  const resetCompanyForm = () => {
    setCompanyForm({
      companyId: '',
      nombre: '',
      descripcion: '',
      activa: true,
      plan: 'gratis',
      limites: {
        maxUsuarios: 1,
        maxVentas: 100,
        maxProductos: 50
      }
    })
  }

  const resetUserForm = () => {
    setUserForm({
      email: '',
      companyId: '',
      isAdmin: false,
      displayName: ''
    })
  }

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'basico': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Panel de Administración
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Gestiona empresas, usuarios y configuraciones del sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'companies'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="inline-block mr-2" size={18} />
            Empresas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="inline-block mr-2" size={18} />
            Usuarios
          </button>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Tab: Empresas */}
            {activeTab === 'companies' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    Gestión de Empresas
                  </h2>
                  <button
                    onClick={() => {
                      resetCompanyForm()
                      setEditingCompany(null)
                      setShowCompanyModal(true)
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Nueva Empresa
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companies.map((company) => {
                    const stats = companyStats[company.companyId] || {}
                    return (
                      <div
                        key={company.companyId}
                        className="border rounded-lg p-4"
                        style={{ 
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-border)'
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
                              {company.nombre || company.companyId}
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              {company.companyId}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {company.activa !== false ? (
                              <CheckCircle size={18} className="text-green-500" />
                            ) : (
                              <AlertCircle size={18} className="text-red-500" />
                            )}
                          </div>
                        </div>

                        {company.descripcion && (
                          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                            {company.descripcion}
                          </p>
                        )}

                        <div className="mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPlanBadgeColor(company.plan || 'gratis')}`}>
                            {(company.plan || 'gratis').toUpperCase()}
                          </span>
                        </div>

                        {/* Estadísticas */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          <div>
                            <Users size={14} className="inline-block mr-1" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                              {stats.totalUsuarios || 0} usuarios
                            </span>
                          </div>
                          <div>
                            <ShoppingCart size={14} className="inline-block mr-1" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                              {stats.totalVentas || 0} ventas
                            </span>
                          </div>
                          <div>
                            <Package size={14} className="inline-block mr-1" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                              {stats.totalProductos || 0} productos
                            </span>
                          </div>
                          <div>
                            <DollarSign size={14} className="inline-block mr-1" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                              S/ {stats.ventasTotal?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleEditCompany(company)}
                            className="flex-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-1"
                          >
                            <Edit size={14} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleCompanyStatus(company.companyId, company.activa !== false)}
                            className={`px-3 py-1.5 text-sm rounded flex items-center justify-center gap-1 ${
                              company.activa !== false
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {company.activa !== false ? (
                              <>
                                <PowerOff size={14} />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Power size={14} />
                                Activar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tab: Usuarios */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    Gestión de Usuarios
                  </h2>
                  <button
                    onClick={() => {
                      resetUserForm()
                      setEditingUser(null)
                      setShowUserModal(true)
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Nuevo Usuario
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ borderColor: 'var(--color-border)' }}>
                        <th className="border p-3 text-left" style={{ color: 'var(--color-text)' }}>Email</th>
                        <th className="border p-3 text-left" style={{ color: 'var(--color-text)' }}>Empresa</th>
                        <th className="border p-3 text-left" style={{ color: 'var(--color-text)' }}>Rol</th>
                        <th className="border p-3 text-left" style={{ color: 'var(--color-text)' }}>Estado</th>
                        <th className="border p-3 text-left" style={{ color: 'var(--color-text)' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} style={{ borderColor: 'var(--color-border)' }}>
                          <td className="border p-3" style={{ color: 'var(--color-text)' }}>
                            {user.email || user.id}
                          </td>
                          <td className="border p-3" style={{ color: 'var(--color-text-secondary)' }}>
                            {user.companyId || 'N/A'}
                          </td>
                          <td className="border p-3">
                            {user.admin ? (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                Admin
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                Usuario
                              </span>
                            )}
                          </td>
                          <td className="border p-3">
                            {user.activo !== false ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                Activo
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="border p-3">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              <Edit size={14} className="inline-block mr-1" />
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal: Crear/Editar Empresa */}
        {showCompanyModal && (
          <CompanyModal
            company={editingCompany}
            formData={companyForm}
            setFormData={setCompanyForm}
            onSave={editingCompany ? handleUpdateCompany : handleCreateCompany}
            onClose={() => {
              setShowCompanyModal(false)
              setEditingCompany(null)
              resetCompanyForm()
            }}
          />
        )}

        {/* Modal: Crear/Editar Usuario */}
        {showUserModal && (
          <UserModal
            user={editingUser}
            formData={userForm}
            setFormData={setUserForm}
            companies={companies}
            onSave={editingUser ? handleUpdateUser : handleCreateUser}
            onClose={() => {
              setShowUserModal(false)
              setEditingUser(null)
              resetUserForm()
            }}
          />
        )}
      </div>
    </div>
  )
}

// Modal para crear/editar empresa
const CompanyModal = ({ company, formData, setFormData, onSave, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold">
            {company ? 'Editar Empresa' : 'Nueva Empresa'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company ID *</label>
            <input
              type="text"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={!!company}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plan</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="gratis">Gratis</option>
                <option value="basico">Básico</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={formData.activa ? 'activa' : 'inactiva'}
                onChange={(e) => setFormData({ ...formData, activa: e.target.value === 'activa' })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="activa">Activa</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Límites</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Max Usuarios</label>
                <input
                  type="number"
                  value={formData.limites.maxUsuarios}
                  onChange={(e) => setFormData({
                    ...formData,
                    limites: { ...formData.limites, maxUsuarios: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Ventas</label>
                <input
                  type="number"
                  value={formData.limites.maxVentas}
                  onChange={(e) => setFormData({
                    ...formData,
                    limites: { ...formData.limites, maxVentas: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Productos</label>
                <input
                  type="number"
                  value={formData.limites.maxProductos}
                  onChange={(e) => setFormData({
                    ...formData,
                    limites: { ...formData.limites, maxProductos: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={onSave} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            {company ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal para crear/editar usuario
const UserModal = ({ user, formData, setFormData, companies, onSave, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={!!user}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Empresa *</label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Seleccionar empresa</option>
              {companies.map((company) => (
                <option key={company.companyId} value={company.companyId}>
                  {company.nombre || company.companyId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Es Administrador</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={onSave} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            {user ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel

