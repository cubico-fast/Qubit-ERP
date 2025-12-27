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

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  // Actualizar estado del sidebar cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (desktop) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // El sidebar solo participa en el layout flex cuando está abierto Y estamos en desktop
  // En móvil, siempre debe estar en position fixed (abierto o cerrado)
  const sidebarInFlexLayout = sidebarOpen && isDesktop

  return (
    <div 
      className="flex h-screen w-full relative overflow-x-hidden transition-colors duration-300"
      style={{ 
        backgroundColor: 'var(--color-background)', 
        width: '100%', 
        maxWidth: '100%',
        minWidth: 0,
        position: 'relative',
        margin: 0,
        padding: 0
      }}
    >
      {/* Sidebar - En layout flex solo cuando está abierto Y estamos en desktop */}
      {sidebarInFlexLayout && (
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={!isDesktop} />
      )}
      {/* Sidebar fixed para móvil (abierto o cerrado) - siempre clickeable cuando está abierto */}
      {!sidebarInFlexLayout && (
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={!isDesktop} />
      )}
      
      {/* Botón para mostrar sidebar cuando está oculto (solo móvil) */}
      {!sidebarOpen && !isDesktop && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-primary-700 text-white p-2 rounded-r-lg hover:bg-primary-800 active:bg-primary-900 transition-colors shadow-lg touch-manipulation"
          style={{ zIndex: 100 }}
          title="Mostrar menú"
          aria-label="Abrir menú"
        >
          <ChevronRight size={20} />
        </button>
      )}
      
      <div 
        className="flex-1 flex flex-col min-w-0"
        style={{ 
          width: '100%',
          maxWidth: '100%', 
          minWidth: 0,
          flex: '1 1 100%',
          marginLeft: 0,
          marginRight: 0,
          overflow: 'visible'
        }}
      >
        <div style={{ position: 'relative', zIndex: 10, overflow: 'visible' }}>
          <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </div>
        <main 
          className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 md:p-4 lg:p-6 w-full" 
          style={{ 
            width: '100%', 
            maxWidth: '100%', 
            minWidth: 0,
            boxSizing: 'border-box',
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem'
          }}
        >
          <div 
            className="w-full overflow-x-hidden" 
            style={{ 
              width: '100%', 
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              margin: 0,
              padding: 0
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout

