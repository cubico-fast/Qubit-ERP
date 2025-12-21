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
  Megaphone,
  Target,
  Brain,
  DollarSign,
  Receipt,
  CreditCard,
  Wallet,
  FileCheck,
  TrendingUp,
  ClipboardList,
  ShoppingBag,
  Warehouse,
  Truck,
  Factory,
  UserCog,
  Clock,
  Briefcase,
  FolderKanban,
  FolderOpen,
  Shield,
  Settings,
  AlertCircle,
  Calendar,
  Phone,
  Video
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen, isMobile = false }) => {
  const location = useLocation()
  const [arrastrando, setArrastrando] = useState(false)
  const inicioArrastreRef = useRef(null)
  const sidebarRef = useRef(null)
  const [menusAbiertos, setMenusAbiertos] = useState({
    ventas: false,
    reportes: false,
    finanzas: false,
    crm: false,
    compras: false,
    inventarios: false,
    produccion: false,
    rrhh: false,
    proyectos: false,
    documental: false,
    seguridad: false
  })
  
  const [submenusAbiertos, setSubmenusAbiertos] = useState({
    'ventas-ventas': false,
    'ventas-preventa': false,
    'ventas-comercial': false,
    'ventas-postventa': false
  })

  const menuItems = [
    // 0. Dashboard
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    
    // 1. Finanzas y Contabilidad
    {
      path: '/finanzas',
      icon: DollarSign,
      label: 'Finanzas y Contabilidad',
      submenu: [
        { path: '/finanzas/contabilidad', icon: FileCheck, label: 'Contabilidad General' },
        { path: '/finanzas/cuentas-cobrar', icon: TrendingUp, label: 'Cuentas por Cobrar' },
        { path: '/finanzas/cuentas-pagar', icon: CreditCard, label: 'Cuentas por Pagar' },
        { path: '/finanzas/tesoreria', icon: Wallet, label: 'Tesorería' },
        { path: '/finanzas/fiscal', icon: Receipt, label: 'Fiscal / Impuestos' }
      ]
    },
    
    // 2. Ventas y Facturación
    { 
      path: '/ventas', 
      icon: ShoppingCart, 
      label: 'Ventas y Facturación',
      submenu: [
        {
          label: 'Ventas',
          icon: ShoppingCart,
          submenu: [
            { path: '/ventas/realizar', icon: Plus, label: 'Realizar venta' },
            { path: '/ventas/pedidos', icon: FileText, label: 'Pedidos de venta' },
            { path: '/ventas/facturacion', icon: Receipt, label: 'Facturación electrónica' },
            { path: '/ventas/notas', icon: FileCheck, label: 'Notas de crédito y débito' }
          ]
        },
        {
          label: 'Preventa',
          icon: FileText,
          submenu: [
            { path: '/ventas/cotizaciones', icon: FileText, label: 'Cotizaciones' }
          ]
        },
        {
          label: 'Gestión Comercial',
          icon: Users,
          submenu: [
            { path: '/ventas/pedidos-gestion', icon: FileText, label: 'Gestión de Pedidos' },
            { path: '/clientes', icon: Users, label: 'Gestión de Clientes (CRM)' },
            { path: '/ventas/kardex', icon: Package, label: 'Gestión de Inventarios (Kardex)' },
            { path: '/ventas/logistica', icon: Truck, label: 'Logística y Envíos' },
            { path: '/ventas/facturacion-finanzas', icon: Receipt, label: 'Facturación y Finanzas' },
            { path: '/ventas/automatizacion', icon: Settings, label: 'Automatización y Centralización' }
          ]
        },
        {
          label: 'Postventa',
          icon: XCircle,
          submenu: [
            { path: '/ventas/devoluciones', icon: RotateCcw, label: 'Devoluciones' },
            { path: '/ventas/garantias', icon: CheckSquare, label: 'Garantías' },
            { path: '/ventas/reclamos', icon: AlertCircle, label: 'Reclamos' }
          ]
        }
      ]
    },
    
    // 3. CRM - Customer Relationship Management
    {
      path: '/crm',
      icon: UserPlus,
      label: 'CRM',
      submenu: [
        { path: '/crm/leads', icon: UserPlus, label: 'Leads y Prospectos' },
        { path: '/crm/oportunidades', icon: TrendingUp, label: 'Oportunidades' },
        { path: '/crm/pipeline', icon: BarChart3, label: 'Pipeline / Embudo' },
        { path: '/crm/actividades', icon: Calendar, label: 'Actividades' },
        { path: '/contactos', icon: Users, label: 'Contactos' },
        { path: '/marketing', icon: Megaphone, label: 'Marketing y Campañas' },
        { path: '/correo', icon: Mail, label: 'Atención al Cliente' }
      ]
    },
    
    // 4. Compras y Abastecimiento
    {
      path: '/compras',
      icon: ShoppingBag,
      label: 'Compras y Abastecimiento',
      submenu: [
        { path: '/compras/proveedores', icon: Users, label: 'Proveedores' },
        { path: '/compras/courriers', icon: Truck, label: 'Courriers' },
        { path: '/compras/solicitudes', icon: ClipboardList, label: 'Solicitudes de Compra' },
        { path: '/compras/ordenes', icon: FileText, label: 'Órdenes de Compra' },
        { path: '/compras/recepcion', icon: Package, label: 'Recepción y Control' },
        { path: '/compras/evaluacion', icon: CheckSquare, label: 'Evaluación de Proveedores' }
      ]
    },
    
    // 5. Inventarios y Logística
    {
      path: '/inventarios',
      icon: Warehouse,
      label: 'Inventarios y Logística',
      submenu: [
        { path: '/productos', icon: Package, label: 'Maestro de Productos' },
        { path: '/inventarios/stock', icon: Package, label: 'Control de Stock' },
        { path: '/inventarios/almacenes', icon: Warehouse, label: 'Almacenes' },
        { path: '/inventarios/logistica', icon: Truck, label: 'Logística y Despachos' }
      ]
    },
    
    // 6. Producción y Operaciones
    {
      path: '/produccion',
      icon: Factory,
      label: 'Producción y Operaciones',
      submenu: [
        { path: '/produccion/ordenes', icon: ClipboardList, label: 'Órdenes de Producción' },
        { path: '/produccion/bom', icon: FileText, label: 'Listas de Materiales (BOM)' },
        { path: '/produccion/rutas', icon: Settings, label: 'Rutas y Procesos' },
        { path: '/produccion/costeo', icon: DollarSign, label: 'Costeo' },
        { path: '/produccion/calidad', icon: CheckSquare, label: 'Control de Calidad' }
      ]
    },
    
    // 7. Recursos Humanos
    {
      path: '/rrhh',
      icon: UserCog,
      label: 'Recursos Humanos',
      submenu: [
        { path: '/rrhh/personal', icon: Users, label: 'Gestión de Personal' },
        { path: '/rrhh/asistencia', icon: Clock, label: 'Tiempo y Asistencia' },
        { path: '/rrhh/nomina', icon: DollarSign, label: 'Nómina' },
        { path: '/rrhh/talento', icon: Briefcase, label: 'Talento Humano' }
      ]
    },
    
    // 8. Proyectos y Servicios
    {
      path: '/proyectos',
      icon: FolderKanban,
      label: 'Proyectos y Servicios',
      submenu: [
        { path: '/tareas', icon: CheckSquare, label: 'Tareas' },
        { path: '/proyectos/proyectos', icon: FolderKanban, label: 'Proyectos' },
        { path: '/proyectos/recursos', icon: Users, label: 'Asignación de Recursos' },
        { path: '/proyectos/rentabilidad', icon: TrendingUp, label: 'Control de Costos' }
      ]
    },
    
    // 9. Business Intelligence (BI) y Reportes
    { 
      path: '/reportes', 
      icon: BarChart3, 
      label: 'Business Intelligence',
      submenu: [
        { path: '/reportes/generales', icon: BarChart3, label: 'Reportes Generales' },
        { path: '/reportes/financieros', icon: DollarSign, label: 'Reportes Financieros' },
        { path: '/reportes/operativos', icon: Factory, label: 'Reportes Operativos' },
        { path: '/reportes/comerciales', icon: ShoppingCart, label: 'Reportes Comerciales' },
        { path: '/reportes/objetivos', icon: Target, label: 'Objetivos' },
        { path: '/reportes/ia', icon: Brain, label: 'Reporte IA' }
      ]
    },
    
    // 10. Gestión Documental
    {
      path: '/documental',
      icon: FolderOpen,
      label: 'Gestión Documental',
      submenu: [
        { path: '/documental/documentos', icon: FileText, label: 'Documentos' },
        { path: '/documental/versionado', icon: FileCheck, label: 'Versionado' },
        { path: '/documental/aprobaciones', icon: CheckSquare, label: 'Flujos de Aprobación' }
      ]
    },
    
    // 11. Seguridad y Administración
    {
      path: '/admin',
      icon: Shield,
      label: 'Seguridad y Administración',
      submenu: [
        { path: '/admin', icon: Shield, label: 'Panel de Administración' },
        { path: '/admin/usuarios', icon: Users, label: 'Usuarios' },
        { path: '/admin/permisos', icon: Settings, label: 'Roles y Permisos' },
        { path: '/admin/auditoria', icon: FileCheck, label: 'Auditoría' },
        { path: '/admin/parametros', icon: Settings, label: 'Parámetros Generales' },
        { path: '/admin/integraciones', icon: Settings, label: 'Integraciones' }
      ]
    }
  ]

  // Abrir automáticamente los menús según la ruta actual
  useEffect(() => {
    const nuevosMenusAbiertos = {
      ventas: false,
      reportes: false,
      finanzas: false,
      crm: false,
      compras: false,
      inventarios: false,
      produccion: false,
      rrhh: false,
      proyectos: false,
      documental: false,
      seguridad: false
    }
    
    // Copiar el estado actual de submenús (NO resetear)
    const nuevosSubmenusAbiertos = { ...submenusAbiertos }

    // Detectar qué menú debe estar abierto según la ruta
    if (location.pathname.startsWith('/ventas') ||
        (location.pathname.startsWith('/clientes') && !location.pathname.startsWith('/crm'))) {
      nuevosMenusAbiertos.ventas = true
      // Abrir submenús según la ruta - SOLO ABRIR, nunca cerrar si ya está abierto
      if (location.pathname.startsWith('/ventas/realizar') ||
          location.pathname.startsWith('/ventas/pedidos') ||
          location.pathname.startsWith('/ventas/facturacion') ||
          location.pathname.startsWith('/ventas/notas') ||
          location.pathname === '/ventas') {
        nuevosSubmenusAbiertos['ventas-ventas'] = true
      }
      if (location.pathname.startsWith('/ventas/cotizaciones')) {
        nuevosSubmenusAbiertos['ventas-preventa'] = true
      }
      if (location.pathname.startsWith('/clientes') ||
          location.pathname.startsWith('/ventas/pedidos-gestion') ||
          location.pathname.startsWith('/ventas/kardex') ||
          location.pathname.startsWith('/ventas/logistica') ||
          location.pathname.startsWith('/ventas/facturacion-finanzas') ||
          location.pathname.startsWith('/ventas/automatizacion')) {
        nuevosSubmenusAbiertos['ventas-comercial'] = true
      }
      if (location.pathname.startsWith('/ventas/devoluciones') ||
          location.pathname.startsWith('/ventas/garantias') ||
          location.pathname.startsWith('/ventas/reclamos') ||
          location.pathname.startsWith('/ventas/anular-devolver')) {
        nuevosSubmenusAbiertos['ventas-postventa'] = true
      }
    }
    if (location.pathname.startsWith('/reportes')) {
      nuevosMenusAbiertos.reportes = true
    }
    if (location.pathname.startsWith('/finanzas')) {
      nuevosMenusAbiertos.finanzas = true
    }
    if (location.pathname.startsWith('/crm') || 
        location.pathname.startsWith('/contactos') || 
        location.pathname.startsWith('/marketing') || 
        location.pathname.startsWith('/correo')) {
      nuevosMenusAbiertos.crm = true
    }
    if (location.pathname.startsWith('/compras')) {
      nuevosMenusAbiertos.compras = true
    }
    if (location.pathname.startsWith('/inventarios') || 
        location.pathname.startsWith('/productos')) {
      nuevosMenusAbiertos.inventarios = true
    }
    if (location.pathname.startsWith('/produccion')) {
      nuevosMenusAbiertos.produccion = true
    }
    if (location.pathname.startsWith('/rrhh')) {
      nuevosMenusAbiertos.rrhh = true
    }
    if (location.pathname.startsWith('/proyectos') || 
        location.pathname.startsWith('/tareas')) {
      nuevosMenusAbiertos.proyectos = true
    }
    if (location.pathname.startsWith('/documental')) {
      nuevosMenusAbiertos.documental = true
    }
    if (location.pathname.startsWith('/admin')) {
      nuevosMenusAbiertos.seguridad = true
    }
    
    setMenusAbiertos(nuevosMenusAbiertos)
    setSubmenusAbiertos(nuevosSubmenusAbiertos)
  }, [location.pathname])

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  // Obtener coordenadas X (mouse o touch)
  const getClientX = (e) => {
    return e.touches ? e.touches[0].clientX : e.clientX
  }

  // Manejar inicio del arrastre (mouse y touch)
  const handleStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastrando(true)
    inicioArrastreRef.current = getClientX(e)
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    document.body.style.touchAction = 'none'
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleEnd)
  }

  // Manejar movimiento del arrastre (mouse y touch)
  const handleMove = (e) => {
    if (!arrastrando || !inicioArrastreRef.current) return
    
    const currentX = getClientX(e)
    const deltaX = inicioArrastreRef.current - currentX
    
    // Si se arrastra hacia la izquierda más de 50px, ocultar el sidebar
    if (deltaX > 50 && isOpen) {
      setIsOpen(false)
      setArrastrando(false)
      inicioArrastreRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.touchAction = ''
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
      return
    }
  }

  // Manejar fin del arrastre (mouse y touch)
  const handleEnd = () => {
    setArrastrando(false)
    inicioArrastreRef.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.body.style.touchAction = ''
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleEnd)
    document.removeEventListener('touchmove', handleMove)
    document.removeEventListener('touchend', handleEnd)
  }

  // Limpiar event listeners al desmontar
  useEffect(() => {
    return () => {
      if (arrastrando) {
        handleEnd()
      }
    }
  }, [arrastrando])

  // Prevenir scroll del body cuando el sidebar está abierto en móvil
  useEffect(() => {
    if (isMobile && isOpen) {
      // Guardar el scroll actual
      const scrollY = window.scrollY
      // Prevenir scroll
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      return () => {
        // Restaurar scroll
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isMobile, isOpen])

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div 
          className="sidebar-overlay fixed inset-0 bg-black bg-opacity-50 touch-manipulation"
          onClick={() => setIsOpen(false)}
          onTouchEnd={(e) => {
            e.preventDefault()
            setIsOpen(false)
          }}
          style={{ 
            zIndex: 999,
            left: '256px' // No cubrir el sidebar (w-64 = 256px)
          }}
          role="button"
          aria-label="Cerrar menú"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`h-full sidebar-gradient text-white transition-all duration-300 ease-in-out ${
          isOpen 
            ? 'w-64' 
            : 'lg:w-0 w-0'
        } ${
          isOpen 
            ? 'translate-x-0' 
            : 'lg:translate-x-0 -translate-x-full'
        } ${
          !isOpen ? 'lg:overflow-hidden' : ''
        }`}
        style={{
          background: 'var(--color-sidebar)',
          // En móvil, siempre usar position fixed (abierto o cerrado)
          // En desktop, usar relative cuando está abierto, fixed cuando está cerrado
          position: isMobile ? 'fixed' : (isOpen ? 'relative' : 'fixed'),
          zIndex: (isMobile && isOpen) ? 1000 : (isMobile ? 30 : 'auto'),
          // Quitar todos los bordes
          border: 'none',
          borderWidth: 0,
          borderStyle: 'none',
          borderColor: 'transparent',
          borderRight: 'none',
          borderLeft: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          outline: 'none',
          // Posicionamiento en móvil
          ...(isMobile ? {
            top: 0,
            left: isOpen ? 0 : '-100%',
            height: '100vh',
            transition: 'left 0.3s ease-in-out',
            boxShadow: isOpen ? '2px 0 8px rgba(0, 0, 0, 0.15)' : 'none'
          } : {}),
          ...(isOpen ? {} : { 
            width: '0', 
            minWidth: '0', 
            maxWidth: '0',
            flexShrink: 0,
            flexGrow: 0,
            flexBasis: '0'
          })
        }}
      >
        {/* Barra de arrastre - lado derecho (solo desktop) */}
        {isOpen && (
          <div
            className="absolute right-0 top-0 bottom-0 w-4 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors z-10 group hidden lg:block"
            onMouseDown={handleStart}
            onTouchStart={handleStart}
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
              <span className="text-xl font-bold">Cubic</span>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-gray-200 hover:bg-primary-600/50 p-2 rounded-lg transition-colors touch-manipulation"
              title={isOpen ? "Ocultar menú" : "Mostrar menú"}
              aria-label={isOpen ? "Ocultar menú" : "Mostrar menú"}
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              // Si tiene submenú, renderizar como menú desplegable
              if (item.submenu) {
                // Verificar si algún subitem o sub-subitem está activo
                const submenuActive = item.submenu.some(sub => {
                  if (sub.path) {
                    return isActive(sub.path)
                  }
                  if (sub.submenu) {
                    return sub.submenu.some(subSub => isActive(subSub.path))
                  }
                  return false
                })
                
                // Mapear la ruta al key del estado
                const getMenuKey = (path) => {
                  if (path === '/ventas') return 'ventas'
                  if (path === '/reportes') return 'reportes'
                  if (path === '/finanzas') return 'finanzas'
                  if (path === '/crm') return 'crm'
                  if (path === '/compras') return 'compras'
                  if (path === '/inventarios') return 'inventarios'
                  if (path === '/produccion') return 'produccion'
                  if (path === '/rrhh') return 'rrhh'
                  if (path === '/proyectos') return 'proyectos'
                  if (path === '/documental') return 'documental'
                  if (path === '/admin') return 'seguridad'
                  return ''
                }
                
                const menuKey = getMenuKey(item.path)
                const menuAbierto = menuKey ? menusAbiertos[menuKey] || false : false
                
                return (
                  <div key={item.path}>
                    <button
                      onClick={() => {
                        setMenusAbiertos(prev => ({
                          ...prev,
                          [menuKey]: !prev[menuKey]
                        }))
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 touch-manipulation ${
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
                          menuAbierto ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {/* Submenú */}
                    {menuAbierto && (
                      <div className="ml-4 mt-2 space-y-1 pl-4">
                        {item.submenu.map((subItem) => {
                          // Si el subitem tiene su propio submenu (nivel 3)
                          if (subItem.submenu) {
                            const subMenuKey = `${menuKey}-${subItem.label.toLowerCase().replace(/\s+/g, '-')}`
                            const subMenuAbierto = submenusAbiertos[subMenuKey] || false
                            const subSubmenuActive = subItem.submenu.some(sub => isActive(sub.path))
                            
                            return (
                              <div key={subItem.label}>
                                <button
                                  onClick={() => {
                                    setSubmenusAbiertos(prev => ({
                                      ...prev,
                                      [subMenuKey]: !prev[subMenuKey]
                                    }))
                                  }}
                                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-200 touch-manipulation ${
                                    subSubmenuActive
                                      ? 'bg-primary-600/50 text-white'
                                      : 'text-primary-200 hover:bg-primary-600/50 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    {subItem.icon && <subItem.icon size={18} />}
                                    <span className="text-sm font-medium">{subItem.label}</span>
                                  </div>
                                  <ChevronDown 
                                    size={16} 
                                    className={`transition-transform duration-200 ${
                                      subMenuAbierto ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                                
                                {/* Sub-submenú (nivel 3) */}
                                {subMenuAbierto && (
                                  <div className="ml-4 mt-1 space-y-1 pl-4">
                                    {subItem.submenu.map((subSubItem) => {
                                      const SubSubIcon = subSubItem.icon
                                      const subSubActive = isActive(subSubItem.path)
                                      return (
                                        <Link
                                          key={subSubItem.path}
                                          to={subSubItem.path}
                                          className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 touch-manipulation ${
                                            subSubActive
                                              ? 'bg-primary-600 text-white'
                                              : 'text-primary-200 hover:bg-primary-600/50 hover:text-white'
                                          }`}
                                          onClick={() => isMobile && setIsOpen(false)}
                                        >
                                          <SubSubIcon size={16} />
                                          <span className="text-xs font-medium">{subSubItem.label}</span>
                                        </Link>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          
                          // Subitem normal (sin submenu)
                          const SubIcon = subItem.icon
                          const subActive = isActive(subItem.path)
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 touch-manipulation ${
                                subActive
                                  ? 'bg-primary-600 text-white'
                                  : 'text-primary-200 hover:bg-primary-600/50 hover:text-white'
                              }`}
                              onClick={() => isMobile && setIsOpen(false)}
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
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 touch-manipulation ${
                    active
                      ? 'bg-white text-primary-700 shadow-lg'
                      : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                  }`}
                  onClick={() => isMobile && setIsOpen(false)}
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
              <p className="text-xs mt-1">© 2026 Cubic</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

