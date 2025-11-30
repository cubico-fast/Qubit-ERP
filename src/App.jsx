import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Clientes from './pages/Clientes'
import Contactos from './pages/Contactos'
import Ventas from './pages/Ventas'
import RealizarVenta from './pages/RealizarVenta'
import AnularDevolverVenta from './pages/AnularDevolverVenta'
import Correo from './pages/Correo'
import ConfiguracionCorreo from './pages/ConfiguracionCorreo'
import Tareas from './pages/Tareas'
import Reportes from './pages/Reportes'
import Marketing from './pages/Marketing'
import ConfiguracionMarketing from './pages/ConfiguracionMarketing'

function App() {
  // Obtener el base path desde la variable de entorno o usar el pathname actual
  const getBasePath = () => {
    // Si estamos en GitHub Pages, usar el pathname base
    if (import.meta.env.VITE_BASE_PATH) {
      return import.meta.env.VITE_BASE_PATH
    }
    // Detectar si estamos en GitHub Pages por la URL
    if (window.location.hostname.includes('github.io')) {
      const pathParts = window.location.pathname.split('/').filter(p => p)
      if (pathParts.length > 0 && pathParts[0] !== '') {
        return `/${pathParts[0]}/`
      }
    }
    return '/'
  }

  const basePath = getBasePath()

  // Asegurar que el viewport se aplique correctamente en móvil
  useEffect(() => {
    const setViewport = () => {
      // Forzar viewport meta tag
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover, shrink-to-fit=no')
      }
      
      // Forzar ancho en móvil - MÁS AGRESIVO
      const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // Forzar estilos en HTML
        document.documentElement.style.setProperty('width', '100%', 'important')
        document.documentElement.style.setProperty('max-width', '100%', 'important')
        document.documentElement.style.setProperty('min-width', '0', 'important')
        document.documentElement.style.setProperty('overflow-x', 'hidden', 'important')
        
        // Forzar estilos en BODY
        document.body.style.setProperty('width', '100%', 'important')
        document.body.style.setProperty('max-width', '100vw', 'important')
        document.body.style.setProperty('min-width', '0', 'important')
        document.body.style.setProperty('margin', '0', 'important')
        document.body.style.setProperty('padding', '0', 'important')
        document.body.style.setProperty('overflow-x', 'hidden', 'important')
        document.body.style.setProperty('position', 'relative', 'important')
        
        // Forzar estilos en ROOT
        const root = document.getElementById('root')
        if (root) {
          root.style.setProperty('width', '100%', 'important')
          root.style.setProperty('max-width', '100vw', 'important')
          root.style.setProperty('min-width', '0', 'important')
          root.style.setProperty('overflow-x', 'hidden', 'important')
          root.style.setProperty('position', 'relative', 'important')
          root.style.setProperty('display', 'block', 'important')
        }
        
        // Prevenir ajuste automático de texto
        document.documentElement.style.setProperty('-webkit-text-size-adjust', '100%', 'important')
        document.documentElement.style.setProperty('-ms-text-size-adjust', '100%', 'important')
        document.body.style.setProperty('-webkit-text-size-adjust', '100%', 'important')
        document.body.style.setProperty('-ms-text-size-adjust', '100%', 'important')
      }
    }
    
    // Ejecutar inmediatamente
    setViewport()
    
    // Ejecutar después de un pequeño delay para asegurar que el DOM esté listo
    setTimeout(setViewport, 100)
    setTimeout(setViewport, 500)
    
    // Event listeners
    window.addEventListener('resize', setViewport)
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewport, 100)
      setTimeout(setViewport, 500)
    })
    
    // Observer para cambios en el DOM
    const observer = new MutationObserver(setViewport)
    if (document.body) {
      observer.observe(document.body, { 
        attributes: true, 
        childList: true, 
        subtree: true 
      })
    }
    
    return () => {
      window.removeEventListener('resize', setViewport)
      window.removeEventListener('orientationchange', setViewport)
      observer.disconnect()
    }
  }, [])

  return (
    <ThemeProvider>
      <CurrencyProvider>
        <Router basename={basePath}>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/contactos" element={<Contactos />} />
              <Route path="/correo" element={<Correo />} />
              <Route path="/correo/configuracion" element={<ConfiguracionCorreo />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/ventas/realizar" element={<RealizarVenta />} />
              <Route path="/ventas/anular-devolver" element={<AnularDevolverVenta />} />
              <Route path="/tareas" element={<Tareas />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/marketing/configuracion" element={<ConfiguracionMarketing />} />
              <Route path="/marketing/callback" element={<ConfiguracionMarketing />} />
            </Routes>
          </Layout>
        </Router>
      </CurrencyProvider>
    </ThemeProvider>
  )
}

export default App

