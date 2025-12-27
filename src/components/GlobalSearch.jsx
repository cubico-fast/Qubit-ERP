import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ArrowRight, Command, User, Package, FileText, ShoppingCart, Clock, TrendingUp } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { getClientes, getProductos, getCotizaciones, getVentas } from '../utils/firebaseUtils'

// Índice de búsqueda con todas las rutas disponibles
const searchIndex = [
  { path: '/', label: 'Dashboard', keywords: ['dashboard', 'inicio', 'panel', 'principal', 'home'], type: 'page' },
  { path: '/finanzas/contabilidad', label: 'Contabilidad General', keywords: ['contabilidad', 'general', 'finanzas', 'cuentas', 'libro'], type: 'page' },
  { path: '/finanzas/cuentas-cobrar', label: 'Cuentas por Cobrar', keywords: ['cuentas', 'cobrar', 'cobros', 'clientes', 'facturas'], type: 'page' },
  { path: '/finanzas/cuentas-pagar', label: 'Cuentas por Pagar', keywords: ['cuentas', 'pagar', 'pagos', 'proveedores'], type: 'page' },
  { path: '/finanzas/tesoreria', label: 'Tesorería', keywords: ['tesoreria', 'caja', 'efectivo', 'bancos', 'dinero'], type: 'page' },
  { path: '/finanzas/fiscal', label: 'Fiscal e Impuestos', keywords: ['fiscal', 'impuestos', 'tributario', 'sunat', 'igv'], type: 'page' },
  { path: '/ventas', label: 'Ventas', keywords: ['ventas', 'vender', 'vendido', 'comercial'], type: 'page' },
  { path: '/ventas/realizar', label: 'Realizar Venta', keywords: ['venta', 'realizar', 'nueva', 'crear', 'registrar', 'pos'], type: 'page' },
  { path: '/ventas/pedidos', label: 'Pedidos de Venta', keywords: ['pedidos', 'ordenes', 'ventas'], type: 'page' },
  { path: '/ventas/facturacion', label: 'Facturación Electrónica', keywords: ['facturacion', 'factura', 'electronica', 'comprobante', 'boleta'], type: 'page' },
  { path: '/ventas/notas', label: 'Notas de Crédito y Débito', keywords: ['notas', 'credito', 'debito', 'nc', 'nd'], type: 'page' },
  { path: '/ventas/cotizaciones', label: 'Cotizaciones', keywords: ['cotizaciones', 'cotizar', 'presupuesto', 'oferta', 'proforma'], type: 'page' },
  { path: '/ventas/pedidos-gestion', label: 'Gestión de Pedidos', keywords: ['pedidos', 'gestion', 'administrar'], type: 'page' },
  { path: '/ventas/kardex', label: 'Kardex e Inventarios', keywords: ['kardex', 'inventario', 'stock', 'almacen'], type: 'page' },
  { path: '/ventas/logistica', label: 'Logística y Envíos', keywords: ['logistica', 'envios', 'despachos', 'transporte'], type: 'page' },
  { path: '/ventas/devoluciones', label: 'Devoluciones', keywords: ['devoluciones', 'devolver', 'retorno'], type: 'page' },
  { path: '/ventas/garantias', label: 'Garantías', keywords: ['garantias', 'garantia', 'servicio'], type: 'page' },
  { path: '/ventas/reclamos', label: 'Reclamos', keywords: ['reclamos', 'reclamo', 'queja'], type: 'page' },
  { path: '/ventas/automatizacion', label: 'Automatización', keywords: ['automatizacion', 'centralizacion', 'automatizar'], type: 'page' },
  { path: '/clientes', label: 'Clientes', keywords: ['clientes', 'cliente', 'crm', 'contactos'], type: 'page' },
  { path: '/contactos', label: 'Contactos', keywords: ['contactos', 'contacto', 'personas', 'directorio'], type: 'page' },
  { path: '/marketing', label: 'Marketing y Campañas', keywords: ['marketing', 'campanas', 'publicidad', 'promocion'], type: 'page' },
  { path: '/correo', label: 'Atención al Cliente', keywords: ['correo', 'atencion', 'cliente', 'soporte', 'tickets'], type: 'page' },
  { path: '/productos', label: 'Productos', keywords: ['productos', 'producto', 'items', 'articulos', 'catalogo'], type: 'page' },
  { path: '/inventarios/stock', label: 'Control de Stock', keywords: ['stock', 'inventario', 'almacen', 'existencias'], type: 'page' },
  { path: '/reportes', label: 'Reportes', keywords: ['reportes', 'reporte', 'informes', 'estadisticas'], type: 'page' },
  { path: '/reportes/objetivos', label: 'Objetivos', keywords: ['objetivos', 'metas', 'kpi', 'indicadores'], type: 'page' },
  { path: '/reportes/ia', label: 'Reporte con IA', keywords: ['ia', 'inteligencia', 'artificial', 'ai', 'analisis'], type: 'page' },
  { path: '/tareas', label: 'Tareas', keywords: ['tareas', 'tarea', 'actividades', 'pendientes', 'todo'], type: 'page' },
  { path: '/admin', label: 'Panel de Administración', keywords: ['admin', 'administracion', 'configuracion', 'ajustes'], type: 'page' },
]

// Sugerencias populares
const popularSuggestions = [
  { path: '/ventas/realizar', label: 'Realizar Venta', type: 'popular' },
  { path: '/clientes', label: 'Clientes', type: 'popular' },
  { path: '/productos', label: 'Productos', type: 'popular' },
  { path: '/ventas/cotizaciones', label: 'Cotizaciones', type: 'popular' },
  { path: '/reportes', label: 'Reportes', type: 'popular' },
]

const GlobalSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [dataCache, setDataCache] = useState({ clientes: [], productos: [], cotizaciones: [], ventas: [], loaded: false })
  const [recentSearches, setRecentSearches] = useState([])
  
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { companyId } = useAuth()
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  // Cargar búsquedas recientes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cubic_recent_searches')
      if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5))
    } catch (e) { /* ignore */ }
  }, [])

  // Guardar búsqueda reciente
  const saveRecentSearch = (item) => {
    try {
      const updated = [item, ...recentSearches.filter(s => s.path !== item.path)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('cubic_recent_searches', JSON.stringify(updated))
    } catch (e) { /* ignore */ }
  }

  // Eliminar una búsqueda reciente
  const removeRecentSearch = (e, path) => {
    e.stopPropagation() // Evitar que se seleccione el item
    try {
      const updated = recentSearches.filter(s => s.path !== path)
      setRecentSearches(updated)
      localStorage.setItem('cubic_recent_searches', JSON.stringify(updated))
    } catch (err) { /* ignore */ }
  }

  // Limpiar todo el historial
  const clearAllRecentSearches = () => {
    try {
      setRecentSearches([])
      localStorage.removeItem('cubic_recent_searches')
    } catch (err) { /* ignore */ }
  }

  // Cargar datos de Firebase
  const loadData = useCallback(async () => {
    if (dataCache.loaded || !companyId) return dataCache
    setIsLoading(true)
    try {
      const [clientes, productos, cotizaciones, ventas] = await Promise.all([
        getClientes(companyId).catch(() => []),
        getProductos(companyId).catch(() => []),
        getCotizaciones(companyId).catch(() => []),
        getVentas(companyId).catch(() => [])
      ])
      const newCache = { clientes: clientes || [], productos: productos || [], cotizaciones: cotizaciones || [], ventas: ventas || [], loaded: true }
      setDataCache(newCache)
      return newCache
    } catch (e) {
      return dataCache
    } finally {
      setIsLoading(false)
    }
  }, [companyId, dataCache])

  // Buscar en páginas - PRIORIZA lo que EMPIEZA con la búsqueda
  const searchInPages = useCallback((searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    
    const scored = searchIndex.map(item => {
      const label = item.label.toLowerCase()
      const keywords = item.keywords.join(' ')
      let score = 0
      
      // Prioridad 1: Label empieza con búsqueda
      if (label.startsWith(q)) score = 100
      // Prioridad 2: Alguna palabra empieza con búsqueda
      else if (label.split(' ').some(w => w.startsWith(q))) score = 80
      // Prioridad 3: Keyword empieza con búsqueda
      else if (item.keywords.some(k => k.startsWith(q))) score = 60
      // Prioridad 4: Label contiene búsqueda
      else if (label.includes(q)) score = 40
      // Prioridad 5: Keywords contienen búsqueda
      else if (keywords.includes(q)) score = 20
      
      return { ...item, score }
    })
    
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || a.label.length - b.label.length)
      .slice(0, 8)
  }, [])

  // Buscar en datos de Firebase
  const searchInData = useCallback((searchQuery, data) => {
    if (!searchQuery || searchQuery.length < 2) return []
    const q = searchQuery.toLowerCase().trim()
    const results = []
    
    // Clientes
    (data.clientes || []).forEach(c => {
      const nombre = (c.nombre || c.razonSocial || '').toLowerCase()
      const doc = (c.documento || c.ruc || c.dni || '').toLowerCase()
      if (nombre.includes(q) || doc.includes(q)) {
        results.push({
          id: c.id, path: '/clientes', label: c.nombre || c.razonSocial || 'Cliente',
          sublabel: c.documento || c.ruc || c.dni, type: 'cliente',
          score: nombre.startsWith(q) ? 10 : 5
        })
      }
    })
    
    // Productos
    (data.productos || []).forEach(p => {
      const nombre = (p.nombre || '').toLowerCase()
      const codigo = (p.codigo || p.sku || '').toLowerCase()
      if (nombre.includes(q) || codigo.includes(q)) {
        results.push({
          id: p.id, path: '/productos', label: p.nombre || 'Producto',
          sublabel: p.codigo || p.sku, type: 'producto',
          score: nombre.startsWith(q) ? 10 : 5
        })
      }
    })
    
    // Cotizaciones
    (data.cotizaciones || []).forEach(c => {
      const cliente = (c.cliente || '').toLowerCase()
      if (cliente.includes(q)) {
        results.push({
          id: c.id, path: '/ventas/cotizaciones', label: `Cotización: ${c.cliente || 'Sin cliente'}`,
          sublabel: c.numero || c.id, type: 'cotizacion', score: 4
        })
      }
    })
    
    // Ventas
    (data.ventas || []).forEach(v => {
      const cliente = (v.cliente || '').toLowerCase()
      if (cliente.includes(q)) {
        results.push({
          id: v.id, path: '/ventas', label: `Venta: ${v.cliente || 'Sin cliente'}`,
          sublabel: v.numero || v.id, type: 'venta', score: 4
        })
      }
    })
    
    return results.sort((a, b) => b.score - a.score).slice(0, 5)
  }, [])

  // Búsqueda completa
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
      setResults([])
      return
    }
    
    // Mostrar páginas inmediatamente
    const pageResults = searchInPages(searchQuery)
    setResults(pageResults)
    
    // Buscar en datos si la query es suficientemente larga
    if (searchQuery.length >= 2) {
      try {
        const data = await loadData()
        const dataResults = searchInData(searchQuery, data)
        // Combinar sin duplicados
        const combined = [...pageResults]
        dataResults.forEach(d => {
          if (!combined.find(c => c.path === d.path && c.label === d.label)) {
            combined.push(d)
          }
        })
        setResults(combined.slice(0, 10))
      } catch (e) { /* keep page results */ }
    }
  }, [searchInPages, searchInData, loadData])

  // Handler de cambio en input
  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(true)
    setSelectedIndex(0)
    
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    // Búsqueda inmediata de páginas
    if (value && value.trim()) {
      setResults(searchInPages(value))
    } else {
      setResults([])
    }
    
    // Búsqueda completa con debounce
    debounceRef.current = setTimeout(() => performSearch(value), 150)
  }

  // Seleccionar resultado
  const handleSelect = (result) => {
    saveRecentSearch({ path: result.path, label: result.label, type: result.type })
    navigate(result.path)
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Obtener qué mostrar en el dropdown
  const getDisplayItems = () => {
    if (query && query.trim()) {
      return { items: results, header: null }
    }
    if (recentSearches.length > 0) {
      return { items: recentSearches.map(s => ({ ...s, isRecent: true })), header: '🕐 Recientes' }
    }
    return { items: popularSuggestions.map(s => ({ ...s, isPopular: true })), header: '🔥 Populares' }
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const { items } = getDisplayItems()
    if (!isOpen || items.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        const first = searchInPages(query)[0]
        if (first) handleSelect(first)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + items.length) % items.length)
        break
      case 'Enter':
        e.preventDefault()
        if (items[selectedIndex]) handleSelect(items[selectedIndex])
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
      case 'Tab':
        if (items[selectedIndex]) {
          e.preventDefault()
          setQuery(items[selectedIndex].label)
          performSearch(items[selectedIndex].label)
        }
        break
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Ctrl+K shortcut
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  // Highlight match
  const highlightMatch = (text, q) => {
    if (!q || !q.trim() || !text) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <strong className="font-bold text-primary-600">{text.slice(idx, idx + q.length)}</strong>
        {text.slice(idx + q.length)}
      </>
    )
  }

  // Get icon
  const getIcon = (result) => {
    if (result.isRecent) return <Clock size={16} className="text-gray-400" />
    if (result.isPopular) return <TrendingUp size={16} className="text-orange-400" />
    switch (result.type) {
      case 'cliente': return <User size={16} className="text-blue-500" />
      case 'producto': return <Package size={16} className="text-green-500" />
      case 'cotizacion': return <FileText size={16} className="text-purple-500" />
      case 'venta': return <ShoppingCart size={16} className="text-orange-500" />
      default: return <Search size={16} className="text-gray-400" />
    }
  }

  const { items: displayItems, header } = getDisplayItems()

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ minWidth: '100px', width: '100%', maxWidth: '100%' }}>
      {/* Campos ocultos para prevenir autocompletado del navegador */}
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none', height: 0, overflow: 'hidden' }}>
        <input type="text" autoComplete="username" name="fake-username" tabIndex="-1" aria-hidden="true" />
        <input type="password" autoComplete="current-password" name="fake-password" tabIndex="-1" aria-hidden="true" />
      </div>
      <div className="relative w-full h-full">
        <div className="absolute left-1.5 sm:left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
          <Search size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          name="search-query"
          id="global-search-input"
          role="searchbox"
          aria-label="Buscar en la aplicación"
          aria-autocomplete="list"
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="search"
          data-search="true"
          inputMode="search"
          enterKeyHint="search"
          className="w-full pl-6 sm:pl-8 md:pl-10 pr-6 sm:pr-8 md:pr-10 py-1 sm:py-1.5 md:py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all text-xs sm:text-sm md:text-base"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: isOpen ? theme.colors.primary[500] : theme.colors.border,
            color: theme.colors.text,
            width: '100%',
            minWidth: '100px',
            boxSizing: 'border-box'
          }}
        />
        {query ? (
          <button
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded"
            style={{ color: theme.colors.textSecondary }}
          >
            <X size={18} />
          </button>
        ) : (
          <div className="hidden lg:flex absolute right-3 top-1/2 transform -translate-y-1/2 items-center pointer-events-none">
            <kbd className="px-2 py-1 text-xs font-semibold rounded border" style={{ 
              backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textSecondary
            }}>
              <Command size={12} className="inline" />K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && displayItems.length > 0 && (
        <div
          className="absolute left-0 right-0 w-full mt-1 rounded-xl shadow-2xl border overflow-hidden"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderColor: theme.colors.border, 
            maxHeight: '350px', 
            overflowY: 'auto',
            zIndex: 100,
            top: '100%'
          }}
        >
          {header && (
            <div className="px-4 py-2 border-b text-xs font-medium flex items-center justify-between" style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary }}>
              <span>{header}</span>
              {recentSearches.length > 0 && !query.trim() && (
                <button
                  onClick={clearAllRecentSearches}
                  className="text-[10px] hover:text-red-500 transition-colors px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Borrar todo
                </button>
              )}
            </div>
          )}
          
          {isLoading && (
            <div className="px-4 py-2 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.colors.primary[500], borderTopColor: 'transparent' }} />
              <span className="text-xs" style={{ color: theme.colors.textSecondary }}>Buscando...</span>
            </div>
          )}
          
          {displayItems.map((item, index) => (
            <div
              key={`${item.path}-${item.label}-${index}`}
              onMouseEnter={() => setSelectedIndex(index)}
              className="w-full flex items-center transition-colors group"
              style={{ backgroundColor: index === selectedIndex ? `${theme.colors.primary[500]}15` : 'transparent' }}
            >
              <button
                onClick={() => handleSelect(item)}
                className="flex-1 text-left px-4 py-2.5 flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {getIcon(item)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate block" style={{ color: theme.colors.text }}>
                    {query.trim() ? highlightMatch(item.label, query) : item.label}
                  </span>
                  {item.sublabel && (
                    <span className="text-xs truncate block" style={{ color: theme.colors.textSecondary }}>{item.sublabel}</span>
                  )}
                </div>
              </button>
              
              {/* Botón eliminar solo para búsquedas recientes */}
              {item.isRecent ? (
                <button
                  onClick={(e) => removeRecentSearch(e, item.path)}
                  className="px-3 py-2.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  style={{ color: theme.colors.textSecondary }}
                  title="Eliminar del historial"
                >
                  <X size={14} />
                </button>
              ) : (
                <div className="px-3 py-2.5">
                  <ArrowRight size={14} className="opacity-40" style={{ color: theme.colors.textSecondary }} />
                </div>
              )}
            </div>
          ))}
          
          <div className="px-4 py-1.5 border-t text-[10px]" style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary }}>
            ↑↓ navegar • Enter seleccionar • Esc cerrar
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query.trim() && displayItems.length === 0 && !isLoading && (
        <div className="absolute left-0 right-0 w-full mt-1 rounded-xl shadow-2xl border p-4 text-center"
             style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, zIndex: 100, top: '100%' }}>
          <Search size={20} className="mx-auto mb-2 opacity-50" style={{ color: theme.colors.textSecondary }} />
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            No se encontró "<strong>{query}</strong>"
          </p>
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
