import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
          className="fixed left-0 top-1/2 transform -translate-y-1/2 z-50 bg-primary-700 text-white p-2 rounded-r-lg hover:bg-primary-800 transition-colors shadow-lg lg:hidden"
          title="Mostrar menú"
        >
          <ChevronRight size={20} />
        </button>
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

