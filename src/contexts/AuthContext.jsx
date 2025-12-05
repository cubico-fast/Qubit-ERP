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

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verificar si hay sesión guardada en localStorage
    const savedAuth = localStorage.getItem('cubic_auth')
    return savedAuth === 'true'
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar autenticación al cargar
    const savedAuth = localStorage.getItem('cubic_auth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = (username, password) => {
    // Validar credenciales
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem('cubic_auth', 'true')
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
  }

  const value = {
    isAuthenticated,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

