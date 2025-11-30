import { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout = ({ children }) => {
  // Sidebar cerrado por defecto en móvil, abierto en desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  // Actualizar estado del sidebar cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div 
      className="flex h-screen relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Botón para mostrar sidebar cuando está oculto (solo móvil) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 transform -translate-y-1/2 z-50 bg-primary-700 text-white p-2 rounded-r-lg hover:bg-primary-800 active:bg-primary-900 transition-colors shadow-lg lg:hidden touch-manipulation"
          title="Mostrar menú"
          aria-label="Abrir menú"
        >
          <ChevronRight size={20} />
        </button>
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 max-w-full">
          <div className="w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout

