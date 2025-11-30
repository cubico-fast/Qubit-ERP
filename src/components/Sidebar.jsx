import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package,
  Users, 
  UserPlus, 
  ShoppingCart, 
  CheckSquare, 
  BarChart3,
  Mail,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Plus,
  FileText,
  XCircle,
  RotateCcw,
  Megaphone
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()
  const [arrastrando, setArrastrando] = useState(false)
  const inicioArrastreRef = useRef(null)
  const sidebarRef = useRef(null)
  const [ventasMenuAbierto, setVentasMenuAbierto] = useState(false)

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/productos', icon: Package, label: 'Productos' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/contactos', icon: UserPlus, label: 'Contactos' },
    { path: '/correo', icon: Mail, label: 'Correo' },
    { 
      path: '/ventas', 
      icon: ShoppingCart, 
      label: 'Ventas',
      submenu: [
        { path: '/ventas/realizar', icon: Plus, label: 'Realizar venta' },
        { path: '/ventas', icon: FileText, label: 'Registro de Ventas' },
        { path: '/ventas/anular-devolver', icon: XCircle, label: 'Anular y Devolver' }
      ]
    },
    { path: '/tareas', icon: CheckSquare, label: 'Tareas' },
    { path: '/reportes', icon: BarChart3, label: 'Reportes' },
    { path: '/marketing', icon: Megaphone, label: 'Marketing' },
  ]

  // Abrir el menú de Ventas si estamos en alguna de sus rutas
  useEffect(() => {
    if (location.pathname.startsWith('/ventas')) {
      setVentasMenuAbierto(true)
    }
  }, [location.pathname])

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  // Manejar inicio del arrastre
  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastrando(true)
    inicioArrastreRef.current = e.clientX
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Manejar movimiento del arrastre
  const handleMouseMove = (e) => {
    if (!arrastrando || !inicioArrastreRef.current) return
    
    const deltaX = inicioArrastreRef.current - e.clientX
    
    // Si se arrastra hacia la izquierda más de 50px, ocultar el sidebar
    if (deltaX > 50 && isOpen) {
      setIsOpen(false)
      setArrastrando(false)
      inicioArrastreRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      return
    }
  }

  // Manejar fin del arrastre
  const handleMouseUp = () => {
    setArrastrando(false)
    inicioArrastreRef.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // Limpiar event listeners al desmontar
  useEffect(() => {
    return () => {
      if (arrastrando) {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [arrastrando])

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`h-full sidebar-gradient text-white transition-all duration-300 ease-in-out flex-shrink-0 ${
          isOpen 
            ? 'w-64' 
            : 'lg:w-0 w-64'
        } ${
          isOpen 
            ? 'translate-x-0' 
            : 'lg:translate-x-0 -translate-x-full'
        } ${
          !isOpen ? 'lg:overflow-hidden' : ''
        }`}
        style={{
          background: 'var(--color-sidebar)'
        }}
      >
        {/* Barra de arrastre - lado derecho */}
        {isOpen && (
          <div
            className="absolute right-0 top-0 bottom-0 w-4 cursor-grab active:cursor-grabbing hover:bg-primary-600/50 transition-colors z-10 group"
            onMouseDown={handleMouseDown}
            title="Arrastra hacia la izquierda para ocultar el menú"
          >
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-50 group-hover:opacity-100 transition-opacity">
              <GripVertical size={20} className="text-white" />
            </div>
          </div>
        )}
        <div className={`flex flex-col h-full ${
          !isOpen ? 'lg:opacity-0 lg:pointer-events-none' : 'opacity-100'
        } transition-opacity duration-300`}>
          {/* Logo y Botón Hamburger */}
          <div className="flex items-center justify-between p-6 border-b border-primary-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-700 font-bold text-xl">C</span>
              </div>
              <span className="text-xl font-bold">Cubic CRM</span>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-gray-200 hover:bg-primary-600/50 p-2 rounded-lg transition-colors"
              title={isOpen ? "Ocultar menú" : "Mostrar menú"}
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              // Si tiene submenú, renderizar como menú desplegable
              if (item.submenu) {
                const submenuActive = item.submenu.some(sub => isActive(sub.path))
                const isVentasMenu = item.path === '/ventas'
                
                return (
                  <div key={item.path}>
                    <button
                      onClick={() => {
                        if (isVentasMenu) {
                          setVentasMenuAbierto(!ventasMenuAbierto)
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                        active || submenuActive
                          ? 'bg-white text-primary-700 shadow-lg'
                          : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronDown 
                        size={18} 
                        className={`transition-transform duration-200 ${
                          (isVentasMenu && ventasMenuAbierto) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {/* Submenú */}
                    {isVentasMenu && ventasMenuAbierto && (
                      <div className="ml-4 mt-2 space-y-1 border-l-2 border-primary-600 pl-4">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon
                          const subActive = isActive(subItem.path)
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                                subActive
                                  ? 'bg-primary-600 text-white'
                                  : 'text-primary-200 hover:bg-primary-600/50 hover:text-white'
                              }`}
                              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                            >
                              <SubIcon size={18} />
                              <span className="text-sm font-medium">{subItem.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              // Renderizar como enlace normal si no tiene submenú
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-white text-primary-700 shadow-lg'
                      : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                  }`}
                  onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-primary-600">
            <div className="text-primary-200 text-sm">
              <p className="font-medium">Versión 1.0.0</p>
              <p className="text-xs mt-1">© 2024 Cubic CRM</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

