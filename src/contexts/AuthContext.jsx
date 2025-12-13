import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

// Credenciales del usuario
const VALID_USERNAME = 'DIKSON1212'
const VALID_PASSWORD = 'Dikson@123'
// CompanyId por defecto para el sistema multi-tenant
const DEFAULT_COMPANY_ID = 'empresa_001'

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verificar si hay sesión guardada en localStorage
    const savedAuth = localStorage.getItem('cubic_auth')
    return savedAuth === 'true'
  })

  const [companyId, setCompanyId] = useState(() => {
    // Obtener companyId del localStorage o usar el por defecto
    const savedCompanyId = localStorage.getItem('cubic_companyId')
    return savedCompanyId || DEFAULT_COMPANY_ID
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar autenticación al cargar
    const savedAuth = localStorage.getItem('cubic_auth')
    const savedCompanyId = localStorage.getItem('cubic_companyId')
    
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
    
    // Asegurar que siempre haya un companyId
    if (savedCompanyId) {
      setCompanyId(savedCompanyId)
    } else {
      // Si no hay companyId guardado, usar el por defecto
      setCompanyId(DEFAULT_COMPANY_ID)
      localStorage.setItem('cubic_companyId', DEFAULT_COMPANY_ID)
    }
    
    setLoading(false)
  }, [])

  const login = (username, password) => {
    // Validar credenciales
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem('cubic_auth', 'true')
      
      // Asegurar que el companyId esté guardado
      const savedCompanyId = localStorage.getItem('cubic_companyId')
      if (!savedCompanyId) {
        localStorage.setItem('cubic_companyId', DEFAULT_COMPANY_ID)
        setCompanyId(DEFAULT_COMPANY_ID)
      } else {
        setCompanyId(savedCompanyId)
      }
      
      return { success: true }
    } else {
      return { 
        success: false, 
        error: 'Usuario o contraseña incorrectos' 
      }
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('cubic_auth')
    // No eliminar el companyId al cerrar sesión, se mantiene para la próxima sesión
  }

  const updateCompanyId = (newCompanyId) => {
    if (newCompanyId) {
      setCompanyId(newCompanyId)
      localStorage.setItem('cubic_companyId', newCompanyId)
    }
  }

  const value = {
    isAuthenticated,
    companyId,
    loading,
    login,
    logout,
    updateCompanyId
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

