import { useState, useEffect, useRef } from 'react'
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
  CheckCircle,
  Shield,
  Eye,
  EyeOff,
  Mail
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
import { ROLES_LIST, getRoleName, getRoleById } from '../utils/roles'

const AdminPanel = () => {
  const { companyId, isAuthenticated, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('companies')
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [companyStats, setCompanyStats] = useState({})
  const [currentCompany, setCurrentCompany] = useState(null)
  const [editingField, setEditingField] = useState(null) // Campo que se está editando
  const [editValues, setEditValues] = useState({}) // Valores temporales de edición
  const [showPassword, setShowPassword] = useState({}) // Estado para mostrar/ocultar contraseñas
  const [showVerifyPasswordModal, setShowVerifyPasswordModal] = useState(false) // Modal para verificar contraseña
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false) // Modal para cambiar contraseña
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false) // Modal para olvidé mi contraseña
  const [passwordAction, setPasswordAction] = useState(null) // 'view' o 'edit'
  const [passwordContext, setPasswordContext] = useState(null) // 'company' o 'user'
  const [currentPasswordInput, setCurrentPasswordInput] = useState('') // Contraseña actual ingresada
  const [newPasswordInput, setNewPasswordInput] = useState('') // Nueva contraseña
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('') // Confirmar nueva contraseña
  const [passwordError, setPasswordError] = useState('') // Error de contraseña
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('') // Email para recuperar contraseña
  const passwordInputRef = useRef(null) // Referencia para el campo de contraseña del modal
   
   // Credenciales del super admin
  const SUPER_ADMIN_USERNAME = 'DIKSON1212'
  const SUPER_ADMIN_PASSWORD = 'Dikson@123'

  // Formulario de empresa
  const [companyForm, setCompanyForm] = useState({
    companyId: '',
    nombre: '',
    ruc: '',
    country: 'Perú',
    currency: 'PEN',
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
    role: 'operativo',
    isAdmin: false,
    displayName: '',
    activo: true
  })

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated, activeTab])

  // Debug: Monitorear cambios en showVerifyPasswordModal
  useEffect(() => {
    console.log('showVerifyPasswordModal cambió a:', showVerifyPasswordModal)
  }, [showVerifyPasswordModal])

  // Enfocar el campo de contraseña cuando se abre el modal
  useEffect(() => {
    if (showVerifyPasswordModal && passwordInputRef.current) {
      // Usar setTimeout para asegurar que el DOM esté listo y evitar que el navegador enfoque otros campos
      setTimeout(() => {
        passwordInputRef.current?.focus()
        // Limpiar cualquier valor previo
        if (passwordInputRef.current) {
          passwordInputRef.current.value = ''
        }
      }, 150)
    }
  }, [showVerifyPasswordModal])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'companies') {
        const companiesData = await getAllCompanies()
        console.log('Empresas cargadas:', companiesData)
        setCompanies(companiesData || [])
        
        // Cargar la empresa actual
        try {
          const current = await getCompany(companyId)
          setCurrentCompany(current)
        } catch (error) {
          console.error('Error al cargar empresa actual:', error)
          setCurrentCompany(null)
        }
        
        // Cargar estadísticas para cada empresa
        const stats = {}
        for (const company of (companiesData || [])) {
          try {
            stats[company.companyId] = await getCompanyStats(company.companyId)
          } catch (error) {
            console.error(`Error al cargar stats de ${company.companyId}:`, error)
          }
        }
        setCompanyStats(stats)
      } else if (activeTab === 'users') {
        console.log('Cargando usuarios...')
        const usersData = await getAllUsers()
        console.log('Usuarios cargados:', usersData)
        // Ordenar usuarios: primero los admins, luego por nombre
        const sortedUsers = (usersData || []).sort((a, b) => {
          if (a.admin && !b.admin) return -1
          if (!a.admin && b.admin) return 1
          const nameA = (a.displayName || a.email || '').toLowerCase()
          const nameB = (b.displayName || b.email || '').toLowerCase()
          return nameA.localeCompare(nameB)
        })
        console.log('Usuarios ordenados:', sortedUsers)
        setUsers(sortedUsers)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      console.error('Detalles del error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      // Mostrar error pero no alert para no interrumpir
      // alert('Error al cargar datos: ' + error.message)
      // Inicializar arrays vacíos en caso de error
      if (activeTab === 'companies') {
        setCompanies([])
      } else if (activeTab === 'users') {
        setUsers([])
      }
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
      nombre: company.nombre || company.name || '',
      ruc: company.ruc || '',
      country: company.country || company.pais || 'Perú',
      currency: company.currency || company.moneda || 'PEN',
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
    // No se permite crear usuarios desde este panel
    alert('⚠️ La creación de usuarios se realiza desde el panel de Usuarios (/admin/usuarios)')
    setShowUserModal(false)
    resetUserForm()
  }

  // Función para guardar cambios en el nombre de la empresa
  const handleSaveCompanyName = async (newName) => {
    try {
      if (!currentCompany) {
        // Si no hay empresa, crear una nueva con datos básicos
        await createOrUpdateCompany({
          companyId: companyId,
          nombre: newName,
          ruc: '',
          country: 'Perú',
          currency: 'PEN',
          activa: true,
          plan: 'gratis',
          limites: {
            maxUsuarios: 1,
            maxVentas: 100,
            maxProductos: 50
          }
        })
      } else {
        // Actualizar empresa existente
        await createOrUpdateCompany({
          ...currentCompany,
          nombre: newName,
          name: newName // También actualizar el campo 'name' para compatibilidad
        })
      }
      await loadData()
      setEditingField(null)
      setEditValues({})
      alert('✅ Nombre de empresa actualizado')
    } catch (error) {
      console.error('Error al guardar nombre:', error)
      alert('Error al guardar: ' + error.message)
    }
  }

  // Función para verificar contraseña actual
  const verifyCurrentPassword = (password) => {
    const storedPassword = localStorage.getItem('cubic_password') || SUPER_ADMIN_PASSWORD
    return password === storedPassword
  }

  // Función para manejar ver/editar contraseña
  const handlePasswordAction = (action, context, event) => {
    console.log('handlePasswordAction llamado:', { action, context })
    
    // Prevenir cualquier comportamiento por defecto del evento
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    // Prevenir cualquier comportamiento por defecto
    setPasswordAction(action)
    setPasswordContext(context) // 'company' o 'user'
    setCurrentPasswordInput('')
    setPasswordError('')
    
    // Limpiar el foco de cualquier otro campo antes de abrir el modal
    // Especialmente el campo de búsqueda global
    if (document.activeElement) {
      document.activeElement.blur()
    }
    
    // Buscar y limpiar el campo de búsqueda global si existe
    const globalSearchInput = document.getElementById('global-search-input')
    if (globalSearchInput) {
      globalSearchInput.blur()
      // Forzar que el campo pierda el foco y no reciba eventos
      globalSearchInput.setAttribute('readonly', 'readonly')
      setTimeout(() => {
        globalSearchInput.removeAttribute('readonly')
      }, 500)
    }
    
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      setShowVerifyPasswordModal(true)
      console.log('showVerifyPasswordModal establecido en true')
    }, 50)
  }

  // Función para verificar y proceder con la acción
  const handleVerifyPassword = () => {
    console.log('handleVerifyPassword llamado:', { 
      currentPasswordInput, 
      passwordAction, 
      passwordContext 
    })
    
    if (!verifyCurrentPassword(currentPasswordInput)) {
      console.log('Contraseña incorrecta')
      setPasswordError('La contraseña actual no es correcta')
      return
    }
    
    console.log('Contraseña correcta, procediendo...')
    setPasswordError('')
    setShowVerifyPasswordModal(false)
    
    if (passwordAction === 'view') {
      // Mostrar contraseña según el contexto (empresa o usuario)
      if (passwordContext === 'company') {
        console.log('Mostrando contraseña de empresa')
        setShowPassword({ ...showPassword, company: true })
        setTimeout(() => {
          setShowPassword(prev => ({ ...prev, company: false }))
        }, 7000) // Ocultar después de 7 segundos
      } else if (passwordContext === 'user') {
        console.log('Mostrando contraseña de usuario')
        setShowPassword(prev => ({ ...prev, user: true }))
        setTimeout(() => {
          setShowPassword(prev => ({ ...prev, user: false }))
        }, 7000) // Ocultar después de 7 segundos
      }
    } else if (passwordAction === 'edit') {
      // Abrir modal para cambiar contraseña
      console.log('Abriendo modal de cambio de contraseña')
      setShowChangePasswordModal(true)
      setNewPasswordInput('')
      setConfirmPasswordInput('')
    }
    
    setCurrentPasswordInput('')
  }

  // Función para cambiar contraseña
  const handleChangePassword = () => {
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }
    
    // Guardar nueva contraseña
    localStorage.setItem('cubic_password', newPasswordInput)
    setShowChangePasswordModal(false)
    setNewPasswordInput('')
    setConfirmPasswordInput('')
    setPasswordError('')
    alert('✅ Contraseña actualizada exitosamente')
  }

  // Función para enviar contraseña por correo
  const handleForgotPassword = () => {
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      setPasswordError('Por favor ingresa un correo electrónico válido')
      return
    }
    
    // Aquí deberías integrar con un servicio de email
    // Por ahora solo mostramos un mensaje
    const storedPassword = localStorage.getItem('cubic_password') || SUPER_ADMIN_PASSWORD
    alert(`✅ Se ha enviado un correo a ${forgotPasswordEmail} con la contraseña actual.\n\nContraseña: ${storedPassword}\n\n(En producción, esto se enviaría automáticamente por correo)`)
    setShowForgotPasswordModal(false)
    setForgotPasswordEmail('')
    setPasswordError('')
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    // Verificar permisos de administrador
    if (!isAdmin()) {
      alert('❌ Solo los administradores pueden actualizar usuarios')
      return
    }

    try {
      const isUserAdmin = userForm.role === 'admin' || userForm.isAdmin
      
      await updateUser(editingUser.id, {
        companyId: userForm.companyId,
        role: userForm.role,
        isAdmin: isUserAdmin,
        displayName: userForm.displayName,
        activo: userForm.activo,
        uid: editingUser.uid || editingUser.userId
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
    // Verificar permisos de administrador
    if (!isAdmin()) {
      alert('❌ Solo los administradores pueden editar usuarios')
      return
    }
    
    setEditingUser(user)
    setUserForm({
      email: user.email || '',
      companyId: user.companyId || '',
      role: user.role || 'operativo',
      isAdmin: user.admin || false,
      displayName: user.displayName || '',
      activo: user.activo !== undefined ? user.activo : true
    })
    setShowUserModal(true)
  }

  const resetCompanyForm = () => {
    setCompanyForm({
      companyId: '',
      nombre: '',
      ruc: '',
      country: 'Perú',
      currency: 'PEN',
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
      role: 'operativo',
      isAdmin: false,
      displayName: '',
      activo: true
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
    <>
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

                {/* Información de la Empresa Actual */}
                <div className="mb-6 p-4 border rounded-lg" style={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderColor: 'var(--color-border)' 
                }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                    Información de la Empresa
                  </h3>
                  <div className="space-y-4">
                    {/* Nombre de la empresa - Editable */}
                    <div>
                      <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Nombre de la empresa:
                      </label>
                      {editingField === 'companyName' ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editValues.companyName !== undefined ? editValues.companyName : (currentCompany?.nombre || '')}
                            onChange={(e) => setEditValues({ ...editValues, companyName: e.target.value })}
                            className="flex-1 px-3 py-2 border rounded-lg"
                            style={{ 
                              borderColor: 'var(--color-border)', 
                              backgroundColor: 'var(--color-surface)', 
                              color: 'var(--color-text)' 
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveCompanyName(editValues.companyName || '')
                              } else if (e.key === 'Escape') {
                                setEditingField(null)
                                setEditValues({})
                              }
                            }}
                          />
                          <button
                            onClick={() => handleSaveCompanyName(editValues.companyName || '')}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditingField(null)
                              setEditValues({})
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 mt-1 group cursor-pointer hover:bg-opacity-5 rounded p-1 -ml-1"
                          onClick={() => {
                            setEditingField('companyName')
                            setEditValues({ companyName: currentCompany?.nombre || '' })
                          }}
                        >
                          <p className="text-base font-medium flex-1" style={{ color: 'var(--color-text)' }}>
                            {currentCompany?.nombre || 'No hay un nombre de empresa registrada'}
                          </p>
                          <Edit size={16} className="opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--color-text-secondary)' }} />
                        </div>
                      )}
                    </div>

                    {/* Usuario - Editable */}
                    <div>
                      <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Usuario:
                      </label>
                      {editingField === 'username' ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editValues.username !== undefined ? editValues.username : SUPER_ADMIN_USERNAME}
                            onChange={(e) => setEditValues({ ...editValues, username: e.target.value })}
                            className="flex-1 px-3 py-2 border rounded-lg"
                            style={{ 
                              borderColor: 'var(--color-border)', 
                              backgroundColor: 'var(--color-surface)', 
                              color: 'var(--color-text)' 
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                // Guardar el nuevo username (solo en localStorage por ahora)
                                localStorage.setItem('cubic_username', editValues.username)
                                setEditingField(null)
                                setEditValues({})
                                alert('✅ Usuario actualizado (requiere reiniciar sesión para aplicar cambios)')
                              } else if (e.key === 'Escape') {
                                setEditingField(null)
                                setEditValues({})
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              localStorage.setItem('cubic_username', editValues.username)
                              setEditingField(null)
                              setEditValues({})
                              alert('✅ Usuario actualizado (requiere reiniciar sesión para aplicar cambios)')
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditingField(null)
                              setEditValues({})
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 mt-1 group cursor-pointer hover:bg-opacity-5 rounded p-1 -ml-1"
                          onClick={() => {
                            setEditingField('username')
                            setEditValues({ username: SUPER_ADMIN_USERNAME })
                          }}
                        >
                          <p className="text-base font-medium flex-1" style={{ color: 'var(--color-text)' }}>
                            {SUPER_ADMIN_USERNAME}
                          </p>
                          <Edit size={16} className="opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--color-text-secondary)' }} />
                        </div>
                      )}
                    </div>

                    {/* Contraseña - Editable */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          Contraseña:
                        </label>
                        <button
                          onClick={() => setShowForgotPasswordModal(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Olvidé mi contraseña
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-lg" style={{ 
                          borderColor: 'var(--color-border)', 
                          backgroundColor: 'var(--color-surface)', 
                          color: 'var(--color-text)' 
                        }}>
                          <p className="flex-1 font-mono text-base" style={{ color: 'var(--color-text)' }}>
                            {showPassword.company ? (localStorage.getItem('cubic_password') || SUPER_ADMIN_PASSWORD) : '••••••••'}
                          </p>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Botón ver contraseña clickeado (empresa)')
                              handlePasswordAction('view', 'company', e)
                            }}
                            className="p-2 hover:bg-opacity-20 rounded transition-colors cursor-pointer flex items-center justify-center"
                            style={{ 
                              color: 'var(--color-text-secondary)',
                              backgroundColor: 'transparent',
                              border: 'none',
                              outline: 'none'
                            }}
                            title="Ver contraseña"
                            type="button"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Botón editar contraseña clickeado (empresa)')
                              handlePasswordAction('edit', 'company', e)
                            }}
                            className="p-2 hover:bg-opacity-20 rounded transition-colors cursor-pointer flex items-center justify-center"
                            style={{ 
                              color: 'var(--color-text-secondary)',
                              backgroundColor: 'transparent',
                              border: 'none',
                              outline: 'none'
                            }}
                            title="Editar contraseña"
                            type="button"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Vista de solo lectura - Edita usuarios desde el panel de Usuarios
                  </p>
                </div>

                {/* Información del Usuario Super Admin */}
                <div className="mb-6 p-4 border rounded-lg" style={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderColor: 'var(--color-border)' 
                }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                    Información del Usuario Super Admin
                  </h3>
                  <div className="space-y-4">
                    {/* Nombre - Editable */}
                    <div>
                      <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Nombre:
                      </label>
                      {editingField === 'userName' ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editValues.userName !== undefined ? editValues.userName : 'Admin Usuario'}
                            onChange={(e) => setEditValues({ ...editValues, userName: e.target.value })}
                            className="flex-1 px-3 py-2 border rounded-lg"
                            style={{ 
                              borderColor: 'var(--color-border)', 
                              backgroundColor: 'var(--color-surface)', 
                              color: 'var(--color-text)' 
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                localStorage.setItem('cubic_displayName', editValues.userName)
                                setEditingField(null)
                                setEditValues({})
                                alert('✅ Nombre actualizado')
                              } else if (e.key === 'Escape') {
                                setEditingField(null)
                                setEditValues({})
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              localStorage.setItem('cubic_displayName', editValues.userName)
                              setEditingField(null)
                              setEditValues({})
                              alert('✅ Nombre actualizado')
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditingField(null)
                              setEditValues({})
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 mt-1 group cursor-pointer hover:bg-opacity-5 rounded p-1 -ml-1"
                          onClick={() => {
                            setEditingField('userName')
                            setEditValues({ userName: localStorage.getItem('cubic_displayName') || 'Admin Usuario' })
                          }}
                        >
                          <p className="text-base font-medium flex-1" style={{ color: 'var(--color-text)' }}>
                            {localStorage.getItem('cubic_displayName') || 'Admin Usuario'}
                          </p>
                          <Edit size={16} className="opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--color-text-secondary)' }} />
                        </div>
                      )}
                    </div>

                    {/* Usuario - Editable */}
                    <div>
                      <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Usuario:
                      </label>
                      {editingField === 'userUsername' ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editValues.userUsername !== undefined ? editValues.userUsername : SUPER_ADMIN_USERNAME}
                            onChange={(e) => setEditValues({ ...editValues, userUsername: e.target.value })}
                            className="flex-1 px-3 py-2 border rounded-lg"
                            style={{ 
                              borderColor: 'var(--color-border)', 
                              backgroundColor: 'var(--color-surface)', 
                              color: 'var(--color-text)' 
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                localStorage.setItem('cubic_username', editValues.userUsername)
                                setEditingField(null)
                                setEditValues({})
                                alert('✅ Usuario actualizado (requiere reiniciar sesión)')
                              } else if (e.key === 'Escape') {
                                setEditingField(null)
                                setEditValues({})
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              localStorage.setItem('cubic_username', editValues.userUsername)
                              setEditingField(null)
                              setEditValues({})
                              alert('✅ Usuario actualizado (requiere reiniciar sesión)')
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditingField(null)
                              setEditValues({})
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 mt-1 group cursor-pointer hover:bg-opacity-5 rounded p-1 -ml-1"
                          onClick={() => {
                            setEditingField('userUsername')
                            setEditValues({ userUsername: SUPER_ADMIN_USERNAME })
                          }}
                        >
                          <p className="text-base font-medium flex-1" style={{ color: 'var(--color-text)' }}>
                            {SUPER_ADMIN_USERNAME}
                          </p>
                          <Edit size={16} className="opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--color-text-secondary)' }} />
                        </div>
                      )}
                    </div>

                    {/* Contraseña - Editable */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          Contraseña:
                        </label>
                        <button
                          onClick={() => setShowForgotPasswordModal(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Olvidé mi contraseña
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-lg" style={{ 
                          borderColor: 'var(--color-border)', 
                          backgroundColor: 'var(--color-surface)', 
                          color: 'var(--color-text)' 
                        }}>
                          <p className="flex-1 font-mono text-base" style={{ color: 'var(--color-text)' }}>
                            {showPassword.user ? (localStorage.getItem('cubic_password') || SUPER_ADMIN_PASSWORD) : '••••••••'}
                          </p>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Botón ver contraseña clickeado (usuario)')
                              handlePasswordAction('view', 'user', e)
                            }}
                            className="p-2 hover:bg-opacity-20 rounded transition-colors cursor-pointer flex items-center justify-center"
                            style={{ 
                              color: 'var(--color-text-secondary)',
                              backgroundColor: 'transparent',
                              border: 'none',
                              outline: 'none'
                            }}
                            title="Ver contraseña"
                            type="button"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Botón editar contraseña clickeado (usuario)')
                              handlePasswordAction('edit', 'user', e)
                            }}
                            className="p-2 hover:bg-opacity-20 rounded transition-colors cursor-pointer flex items-center justify-center"
                            style={{ 
                              color: 'var(--color-text-secondary)',
                              backgroundColor: 'transparent',
                              border: 'none',
                              outline: 'none'
                            }}
                            title="Editar contraseña"
                            type="button"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                      <p style={{ color: 'var(--color-text-secondary)' }}>Cargando usuarios...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                      <Users size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium mb-2">No hay usuarios registrados</p>
                      <p className="text-sm">Ve al panel de Usuarios para crear nuevos usuarios</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
                          <th className="border p-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Usuario</th>
                          <th className="border p-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Email</th>
                          <th className="border p-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Empresa</th>
                          <th className="border p-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Rol</th>
                          <th className="border p-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
                          <th className="border p-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                            <td className="border p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                                </div>
                                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                  {user.displayName || user.email || user.id}
                                </span>
                              </div>
                            </td>
                            <td className="border p-3" style={{ color: 'var(--color-text)' }}>
                              {user.email || 'N/A'}
                            </td>
                            <td className="border p-3" style={{ color: 'var(--color-text-secondary)' }}>
                              {user.companyId || 'N/A'}
                            </td>
                            <td className="border p-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {getRoleName(user.role)}
                              </span>
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
                              {isAdmin() ? (
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                                >
                                  <Edit size={14} />
                                  Editar
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400" title="Solo los administradores pueden editar usuarios">
                                  Sin permisos
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
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
        {showUserModal && editingUser && (
          <UserModal
            user={editingUser}
            formData={userForm}
            setFormData={setUserForm}
            companies={companies}
            onSave={handleUpdateUser}
            onClose={() => {
              setShowUserModal(false)
              setEditingUser(null)
              resetUserForm()
            }}
          />
        )}

        {/* Modal para verificar contraseña actual */}
        {showVerifyPasswordModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ zIndex: 9999, position: 'fixed' }}
          >
            <div 
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl" 
              style={{ 
                backgroundColor: 'var(--color-surface)',
                zIndex: 10000,
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Verificar Contraseña
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Por favor ingresa tu contraseña actual para {passwordAction === 'view' ? 'ver' : 'editar'} la contraseña.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Contraseña actual:
                </label>
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={currentPasswordInput}
                  onChange={(e) => {
                    setCurrentPasswordInput(e.target.value)
                    setPasswordError('')
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ 
                    borderColor: passwordError ? '#ef4444' : 'var(--color-border)', 
                    backgroundColor: 'var(--color-surface)', 
                    color: 'var(--color-text)' 
                  }}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="off"
                  name="verify-password-modal"
                  id="verify-password-modal"
                  data-lpignore="true"
                  data-form-type="other"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyPassword()
                    } else if (e.key === 'Escape') {
                      setShowVerifyPasswordModal(false)
                      setCurrentPasswordInput('')
                      setPasswordError('')
                      setPasswordAction(null)
                      setPasswordContext(null)
                    }
                  }}
                />
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowVerifyPasswordModal(false)
                    setCurrentPasswordInput('')
                    setPasswordError('')
                    setPasswordAction(null)
                    setPasswordContext(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleVerifyPassword}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Verificar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para cambiar contraseña */}
        {showChangePasswordModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ zIndex: 9999, position: 'fixed' }}
          >
            <div 
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl" 
              style={{ 
                backgroundColor: 'var(--color-surface)',
                zIndex: 10000,
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Cambiar Contraseña
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Nueva contraseña:
                  </label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => {
                      setNewPasswordInput(e.target.value)
                      setPasswordError('')
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: passwordError ? '#ef4444' : 'var(--color-border)', 
                      backgroundColor: 'var(--color-surface)', 
                      color: 'var(--color-text)' 
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowChangePasswordModal(false)
                        setNewPasswordInput('')
                        setConfirmPasswordInput('')
                        setPasswordError('')
                        setPasswordAction(null)
                        setPasswordContext(null)
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Confirmar nueva contraseña:
                  </label>
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => {
                      setConfirmPasswordInput(e.target.value)
                      setPasswordError('')
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: passwordError ? '#ef4444' : 'var(--color-border)', 
                      backgroundColor: 'var(--color-surface)', 
                      color: 'var(--color-text)' 
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleChangePassword()
                      } else if (e.key === 'Escape') {
                        setShowChangePasswordModal(false)
                        setNewPasswordInput('')
                        setConfirmPasswordInput('')
                        setPasswordError('')
                        setPasswordAction(null)
                        setPasswordContext(null)
                      }
                    }}
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowChangePasswordModal(false)
                    setNewPasswordInput('')
                    setConfirmPasswordInput('')
                    setPasswordError('')
                    setPasswordAction(null)
                    setPasswordContext(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para olvidé mi contraseña */}
        {showForgotPasswordModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ zIndex: 9999, position: 'fixed' }}
          >
            <div 
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl" 
              style={{ 
                backgroundColor: 'var(--color-surface)',
                zIndex: 10000,
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Mail size={20} />
                Recuperar Contraseña
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Ingresa tu correo electrónico y te enviaremos tu contraseña actual.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Correo electrónico:
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => {
                    setForgotPasswordEmail(e.target.value)
                    setPasswordError('')
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ 
                    borderColor: passwordError ? '#ef4444' : 'var(--color-border)', 
                    backgroundColor: 'var(--color-surface)', 
                    color: 'var(--color-text)' 
                  }}
                  placeholder="tu@email.com"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleForgotPassword()
                    } else if (e.key === 'Escape') {
                      setShowForgotPasswordModal(false)
                      setForgotPasswordEmail('')
                      setPasswordError('')
                    }
                  }}
                />
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowForgotPasswordModal(false)
                    setForgotPasswordEmail('')
                    setPasswordError('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleForgotPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Mail size={16} />
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
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
              placeholder="ej: mi_empresa_001"
              required
              disabled={!!company}
            />
            <p className="text-xs text-gray-500 mt-1">ID único para identificar tu empresa (sin espacios, usar guiones bajos)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la Empresa *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Mi Empresa S.A.C."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">RUC</label>
              <input
                type="text"
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="20123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">País *</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="Perú">Perú</option>
                <option value="México">México</option>
                <option value="Colombia">Colombia</option>
                <option value="Chile">Chile</option>
                <option value="Argentina">Argentina</option>
                <option value="Ecuador">Ecuador</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="España">España</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Moneda *</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="MXN">Pesos Mexicanos (MXN)</option>
              <option value="COP">Pesos Colombianos (COP)</option>
              <option value="CLP">Pesos Chilenos (CLP)</option>
              <option value="ARS">Pesos Argentinos (ARS)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
              placeholder="Descripción de la empresa..."
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

// Modal para editar usuario (solo edición, no creación)
const UserModal = ({ user, formData, setFormData, companies, onSave, onClose }) => {
  // Solo permitir edición si hay un usuario
  if (!user) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold">
            Editar Usuario
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">USUARIO *</label>
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
            <label className="block text-sm font-medium mb-1">Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value
                setFormData({ 
                  ...formData, 
                  role: newRole,
                  isAdmin: newRole === 'admin' // Auto-asignar admin si el rol es admin
                })
              }}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              {ROLES_LIST.map(role => (
                <option key={role.id} value={role.id}>
                  {role.icon} {role.nombre}
                </option>
              ))}
            </select>
            <p className="text-xs mt-1 text-gray-500">
              {getRoleById(formData.role)?.descripcion}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Usuario Activo</span>
            </label>
            {formData.role === 'admin' && (
              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                <Shield size={12} />
                Administrador
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={onSave} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Actualizar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel

