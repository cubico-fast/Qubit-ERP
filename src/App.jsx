import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Clientes from './pages/Clientes'
import Contactos from './pages/Contactos'
import Ventas from './pages/Ventas'
import RealizarVenta from './pages/RealizarVenta'
import AnularDevolverVenta from './pages/AnularDevolverVenta'
import Reclamos from './pages/Reclamos'
import Correo from './pages/Correo'
import ConfiguracionCorreo from './pages/ConfiguracionCorreo'
import Tareas from './pages/Tareas'
import Reportes from './pages/Reportes'
import Objetivos from './pages/Objetivos'
import ReporteIA from './pages/ReporteIA'
import Marketing from './pages/Marketing'
import ConfiguracionMarketing from './pages/ConfiguracionMarketing'
import AdminPanel from './pages/AdminPanel'
import Placeholder from './pages/Placeholder'
import ContabilidadGeneral from './pages/ContabilidadGeneral'
import CuentasPorCobrar from './pages/CuentasPorCobrar'
import CuentasPorPagar from './pages/CuentasPorPagar'
import Tesoreria from './pages/Tesoreria'
import FiscalImpuestos from './pages/FiscalImpuestos'
import FacturacionElectronica from './pages/FacturacionElectronica'
import NotasCreditoDebito from './pages/NotasCreditoDebito'
import Cotizaciones from './pages/Cotizaciones'
import ListasPrecios from './pages/ListasPrecios'
import Garantias from './pages/Garantias'
import GestionPedidos from './pages/GestionPedidos'
import LogisticaEnvios from './pages/LogisticaEnvios'
import KardexInventarios from './pages/KardexInventarios'
import ControlStock from './pages/ControlStock'
import Almacenes from './pages/Almacenes'
import AutomatizacionCentralizacion from './pages/AutomatizacionCentralizacion'
import Leads from './pages/Leads'
import Oportunidades from './pages/Oportunidades'
import Pipeline from './pages/Pipeline'
import Actividades from './pages/Actividades'
import Proveedores from './pages/Proveedores'
import Courriers from './pages/Courriers'
import SolicitudesCompra from './pages/SolicitudesCompra'
import OrdenesCompra from './pages/OrdenesCompra'
import RecepcionControl from './pages/RecepcionControl'
import EvaluacionProveedores from './pages/EvaluacionProveedores'
import OrdenesProduccion from './pages/OrdenesProduccion'
import ListasMateriales from './pages/ListasMateriales'
import RutasProcesos from './pages/RutasProcesos'
import Costeo from './pages/Costeo'
import ControlCalidad from './pages/ControlCalidad'
import GestionPersonal from './pages/GestionPersonal'
import TiempoAsistencia from './pages/TiempoAsistencia'
import Nomina from './pages/Nomina'
import TalentoHumano from './pages/TalentoHumano'
import Proyectos from './pages/Proyectos'
import AsignacionRecursos from './pages/AsignacionRecursos'
import ControlCostos from './pages/ControlCostos'
import ReportesGenerales from './pages/ReportesGenerales'
import ReportesFinancieros from './pages/ReportesFinancieros'
import ReportesOperativos from './pages/ReportesOperativos'
import ReportesComerciales from './pages/ReportesComerciales'
import Documentos from './pages/Documentos'
import FlujosAprobacion from './pages/FlujosAprobacion'
import Usuarios from './pages/Usuarios'
import RolesPermisos from './pages/RolesPermisos'
import Auditoria from './pages/Auditoria'
import ParametrosGenerales from './pages/ParametrosGenerales'
import Integraciones from './pages/Integraciones'

function App() {
  // Obtener el base path desde la variable de entorno o usar el pathname actual
  const getBasePath = () => {
    // Si estamos en GitHub Pages, usar el pathname base
    if (import.meta.env.VITE_BASE_PATH) {
      return import.meta.env.VITE_BASE_PATH
    }
    // Si estamos en Vercel, Netlify u otros, usar '/'
    if (window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('netlify.app') ||
        window.location.hostname.includes('vercel.com')) {
      return '/'
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

  // Guardar la ruta actual en sessionStorage para que esté disponible si se carga un 404
  useEffect(() => {
    const saveCurrentPath = () => {
      if (window.location.hostname.includes('github.io')) {
        const currentPath = window.location.pathname
        // Solo guardar si no es index.html o 404.html
        if (currentPath && !currentPath.includes('index.html') && !currentPath.includes('404.html')) {
          sessionStorage.setItem('ghp_404_redirect', currentPath)
        }
      }
    }
    
    // Guardar la ruta cuando cambia
    saveCurrentPath()
    
    // También guardar en el evento popstate (navegación del navegador)
    window.addEventListener('popstate', saveCurrentPath)
    
    return () => {
      window.removeEventListener('popstate', saveCurrentPath)
    }
  }, [])

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
        <AuthProvider>
          <NotificationProvider>
            <Router basename={basePath}>
            <Routes>
              {/* Ruta pública de login */}
              <Route path="/login" element={<Login />} />
              
              {/* Rutas protegidas */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        {/* 0. Dashboard */}
                        <Route path="/" element={<Dashboard />} />
                        
                        {/* 1. Finanzas y Contabilidad */}
                        <Route path="/finanzas/contabilidad" element={<ContabilidadGeneral />} />
                        <Route path="/finanzas/cuentas-cobrar" element={<CuentasPorCobrar />} />
                        <Route path="/finanzas/cuentas-pagar" element={<CuentasPorPagar />} />
                        <Route path="/finanzas/tesoreria" element={<Tesoreria />} />
                        <Route path="/finanzas/fiscal" element={<FiscalImpuestos />} />
                        
                        {/* 2. Ventas y Facturación */}
                        {/* 2.1 Ventas */}
                        <Route path="/ventas/pedidos" element={<Ventas />} />
                        <Route path="/ventas/facturacion" element={<FacturacionElectronica />} />
                        <Route path="/ventas/notas" element={<NotasCreditoDebito />} />
                        {/* 2.2 Preventa */}
                        <Route path="/ventas/cotizaciones" element={<Cotizaciones />} />
                        <Route path="/ventas/aprobaciones" element={<Cotizaciones />} />
                        {/* 2.3 Gestión Comercial */}
                        <Route path="/ventas/pedidos-gestion" element={<GestionPedidos />} />
                        <Route path="/ventas/kardex" element={<KardexInventarios />} />
                        <Route path="/ventas/logistica" element={<LogisticaEnvios />} />
                        <Route path="/ventas/facturacion-finanzas" element={<FacturacionElectronica />} />
                        <Route path="/ventas/automatizacion" element={<AutomatizacionCentralizacion />} />
                        {/* 2.4 Postventa */}
                        <Route path="/ventas/devoluciones" element={<AnularDevolverVenta />} />
                        <Route path="/ventas/garantias" element={<Garantias />} />
                        <Route path="/ventas/reclamos" element={<Reclamos />} />
                        {/* Rutas legacy (mantener compatibilidad) */}
                        <Route path="/ventas" element={<Ventas />} />
                        <Route path="/ventas/realizar" element={<RealizarVenta />} />
                        <Route path="/ventas/anular-devolver" element={<AnularDevolverVenta />} />
                        
                        {/* 3. CRM */}
                        <Route path="/crm/leads" element={<Leads />} />
                        <Route path="/crm/oportunidades" element={<Oportunidades />} />
                        <Route path="/crm/pipeline" element={<Pipeline />} />
                        <Route path="/crm/actividades" element={<Actividades />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route path="/contactos" element={<Contactos />} />
                        <Route path="/marketing" element={<Marketing />} />
                        <Route path="/marketing/configuracion" element={<ConfiguracionMarketing />} />
                        <Route path="/marketing/callback" element={<ConfiguracionMarketing />} />
                        <Route path="/correo" element={<Correo />} />
                        <Route path="/correo/configuracion" element={<ConfiguracionCorreo />} />
                        
                        {/* 4. Compras y Abastecimiento */}
                        <Route path="/compras/proveedores" element={<Proveedores />} />
                        <Route path="/compras/courriers" element={<Courriers />} />
                        <Route path="/compras/solicitudes" element={<SolicitudesCompra />} />
                        <Route path="/compras/ordenes" element={<OrdenesCompra />} />
                        <Route path="/compras/recepcion" element={<RecepcionControl />} />
                        <Route path="/compras/evaluacion" element={<EvaluacionProveedores />} />
                        
                        {/* 5. Inventarios y Logística */}
                        <Route path="/productos" element={<Productos />} />
                        <Route path="/inventarios/stock" element={<ControlStock />} />
                        <Route path="/inventarios/almacenes" element={<Almacenes />} />
                        <Route path="/inventarios/logistica" element={<LogisticaEnvios />} />
                        
                        {/* 6. Producción y Operaciones */}
                        <Route path="/produccion/ordenes" element={<OrdenesProduccion />} />
                        <Route path="/produccion/bom" element={<ListasMateriales />} />
                        <Route path="/produccion/rutas" element={<RutasProcesos />} />
                        <Route path="/produccion/costeo" element={<Costeo />} />
                        <Route path="/produccion/calidad" element={<ControlCalidad />} />
                        
                        {/* 7. Recursos Humanos */}
                        <Route path="/rrhh/personal" element={<GestionPersonal />} />
                        <Route path="/rrhh/asistencia" element={<TiempoAsistencia />} />
                        <Route path="/rrhh/nomina" element={<Nomina />} />
                        <Route path="/rrhh/talento" element={<TalentoHumano />} />
                        
                        {/* 8. Proyectos y Servicios */}
                        <Route path="/tareas" element={<Tareas />} />
                        <Route path="/proyectos/proyectos" element={<Proyectos />} />
                        <Route path="/proyectos/recursos" element={<AsignacionRecursos />} />
                        <Route path="/proyectos/rentabilidad" element={<ControlCostos />} />
                        
                        {/* 9. Business Intelligence */}
                        <Route path="/reportes" element={<Reportes />} />
                        <Route path="/reportes/generales" element={<ReportesGenerales />} />
                        <Route path="/reportes/financieros" element={<ReportesFinancieros />} />
                        <Route path="/reportes/operativos" element={<ReportesOperativos />} />
                        <Route path="/reportes/comerciales" element={<ReportesComerciales />} />
                        <Route path="/reportes/objetivos" element={<Objetivos />} />
                        <Route path="/reportes/ia" element={<ReporteIA />} />
                        
                        {/* 10. Gestión Documental */}
                        <Route path="/documental/documentos" element={<Documentos />} />
                        <Route path="/documental/versionado" element={<Documentos />} />
                        <Route path="/documental/aprobaciones" element={<FlujosAprobacion />} />
                        
                        {/* 11. Seguridad y Administración */}
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/admin/usuarios" element={<Usuarios />} />
                        <Route path="/admin/permisos" element={<RolesPermisos />} />
                        <Route path="/admin/auditoria" element={<Auditoria />} />
                        <Route path="/admin/parametros" element={<ParametrosGenerales />} />
                        <Route path="/admin/integraciones" element={<Integraciones />} />
                        
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
          </NotificationProvider>
        </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  )
}

export default App

