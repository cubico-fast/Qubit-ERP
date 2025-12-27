import { useState, useEffect, useRef, useMemo } from 'react'
import { FileText, Plus, Search, CheckCircle, XCircle, Clock, Edit, Save, RotateCcw, X, ShoppingCart, GripVertical, ChevronLeft, ChevronRight, UserPlus, Trash2, Download, Send, Layout, Type, Image, Table, Move, Trash, Eye, ZoomIn, ZoomOut, Ruler, DollarSign, Copy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getCotizaciones, saveCotizacion, updateCotizacion, deleteCotizacion, getClientes, getProductos, saveCliente, saveVenta } from '../utils/firebaseUtils'
import { formatDate, getCurrentDateSync, getNetworkTime } from '../utils/dateUtils'
import jsPDF from 'jspdf'

const Cotizaciones = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [cotizaciones, setCotizaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCrearCotizacion, setShowCrearCotizacion] = useState(false)
  const [cotizacionEditando, setCotizacionEditando] = useState(null) // ID de la cotización que se está editando
  const [mostrarEjemplos, setMostrarEjemplos] = useState(false) // Mostrar ejemplos en memoria
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null) // Cotización seleccionada para ver detalles
  const [showConfiguracionPDF, setShowConfiguracionPDF] = useState(false) // Modal de configuración del PDF
  const [configuracionPDF, setConfiguracionPDF] = useState(() => {
    // Limpiar configuración anterior y empezar con hoja en blanco
    try {
      localStorage.removeItem('cotizacion_pdf_config')
    } catch (e) {
      console.error('Error al limpiar configuración PDF:', e)
    }
    // Hoja en blanco - sin elementos predefinidos
    return {
      elementos: [],
      margen: 15,
      colorPrimario: '#2563eb',
      colorSecundario: '#6b7280'
    }
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Estados para la creación de cotización (similar a RealizarVenta)
  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const [verTallaColor, setVerTallaColor] = useState(false)
  const [mostrarDetalle, setMostrarDetalle] = useState(false)
  
  // Estado para clientes
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clientesSugeridos, setClientesSugeridos] = useState([])
  const [mostrarSugerenciasCliente, setMostrarSugerenciasCliente] = useState(false)
  const [indiceSeleccionadoCliente, setIndiceSeleccionadoCliente] = useState(-1)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false)
  const busquedaClienteRef = useRef(null)
  
  // Estado para el buscador de productos
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productosSugeridos, setProductosSugeridos] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1)
  const busquedaRef = useRef(null)
  
  // Estado para el producto seleccionado para agregar
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantidadProducto, setCantidadProducto] = useState('1')
  const [precioUnitario, setPrecioUnitario] = useState(0)
  const [costoUnitario, setCostoUnitario] = useState(0)
  const [precioUnitarioSeleccionado, setPrecioUnitarioSeleccionado] = useState(0)
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0)
  const [descuentoMonto, setDescuentoMonto] = useState(0)
  const [subtotalItem, setSubtotalItem] = useState(0)
  const [presentacionSeleccionada, setPresentacionSeleccionada] = useState(null)
  const [editandoProducto, setEditandoProducto] = useState(null)
  const [indiceEditando, setIndiceEditando] = useState(null)
  
  // Estado para el panel deslizante
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [posicionPanel, setPosicionPanel] = useState(0)
  const panelRef = useRef(null)
  const inicioArrastreRef = useRef(null)

  // Estado del formulario de cotización
  const [formData, setFormData] = useState({
    local: 'PRINCIPAL',
    almacen: 'PRINCIPAL',
    fecha: getCurrentDateSync(),
    fechaVencimiento: '',
    vendedor: 'DIXONACUÑA',
    moneda: 'Soles',
    tipoCambio: 0,
    subtotal: 0,
    descuento: 0,
    impuesto: 0,
    icbper: 0,
    total: 0,
    totalProductos: 0,
    observaciones: '',
    estado: 'pendiente'
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  // Obtener fecha actual de la red
  useEffect(() => {
    const updateDate = async () => {
      try {
        const networkDate = await getNetworkTime()
        setCurrentDate(networkDate)
        const fechaStr = networkDate.toISOString().split('T')[0]
        setFormData(prev => ({
          ...prev,
          fecha: fechaStr
        }))
      } catch (error) {
        console.error('Error al obtener fecha de la red:', error)
      }
    }
    if (showCrearCotizacion) {
      updateDate()
      const interval = setInterval(updateDate, 60000)
      return () => clearInterval(interval)
    }
  }, [showCrearCotizacion])

  const loadData = async () => {
    try {
      setLoading(true)
      const [cotizacionesData, clientesData, productosData] = await Promise.all([
        getCotizaciones(companyId),
        getClientes(companyId),
        getProductos(companyId)
      ])
      
      setCotizaciones(cotizacionesData)
      setClientes(clientesData)
      setProductos(productosData)
      setMostrarEjemplos(false) // Limpiar estado de ejemplos cuando se cargan datos reales
    } catch (error) {
      console.error('Error al cargar datos:', error)
      // Si hay error y no hay cotizaciones, mantener el estado actual
    } finally {
      setLoading(false)
    }
  }

  // Filtrar productos según la búsqueda
  useEffect(() => {
    if (busquedaProducto.trim() === '') {
      setProductosSugeridos([])
      setMostrarSugerencias(false)
        return
      }
      
    const terminoBusqueda = busquedaProducto.toLowerCase().trim()
    const palabras = terminoBusqueda.split(' ').filter(p => p.length > 0)

    const productosFiltrados = productos.filter(producto => {
      const nombreProducto = (producto.nombre || '').toLowerCase()
      const descripcionProducto = (producto.descripcion || '').toLowerCase()
      const codigoInterno = (producto.codigoInterno || '').toLowerCase()
      const codigoBarra = (producto.codigoBarra || '').toLowerCase()

      return palabras.every(palabra => 
        nombreProducto.includes(palabra) ||
        descripcionProducto.includes(palabra) ||
        codigoInterno.includes(palabra) ||
        codigoBarra.includes(palabra)
      )
    }).slice(0, 10)

    setProductosSugeridos(productosFiltrados)
    setMostrarSugerencias(productosFiltrados.length > 0)
    setIndiceSeleccionado(-1)
  }, [busquedaProducto, productos])

  // Filtrar clientes según la búsqueda
  useEffect(() => {
    if (busquedaCliente.trim() === '') {
      setClientesSugeridos([])
      return
    }

    if (!clientes || clientes.length === 0) {
      setClientesSugeridos([])
      return
    }

    const terminosBusqueda = busquedaCliente.toLowerCase().split(' ').filter(term => term.length > 0)

    const filtered = clientes.filter(cliente => {
      if (!cliente) return false
      
      const nombre = cliente.nombres?.toLowerCase() || cliente.nombre?.toLowerCase() || ''
      const apellidos = cliente.apellidos?.toLowerCase() || ''
      const documento = cliente.numeroDocumento?.toLowerCase() || cliente.documento?.toLowerCase() || ''
      const email = cliente.correoElectronico?.toLowerCase() || cliente.email?.toLowerCase() || ''
      const telefono = cliente.telefono?.toLowerCase() || ''
      const razonSocial = cliente.razonSocial?.toLowerCase() || cliente.empresa?.toLowerCase() || ''

      return terminosBusqueda.every(term =>
        nombre.includes(term) ||
        apellidos.includes(term) ||
        documento.includes(term) ||
        email.includes(term) ||
        telefono.includes(term) ||
        razonSocial.includes(term)
      )
    }).slice(0, 10)

    setClientesSugeridos(filtered)
    setIndiceSeleccionadoCliente(-1)
  }, [busquedaCliente, clientes])

  // Calcular totales cuando cambian los productos seleccionados
  useEffect(() => {
    const TASA_IMPUESTO = 0.1525
    
    const totalProductos = productosSeleccionados.reduce((sum, p) => {
      const precioConImpuesto = parseFloat(p.precio) || 0
      const cantidad = parseInt(p.cantidad) || 1
      const descuento = parseFloat(p.descuento) || 0
      return sum + ((precioConImpuesto * cantidad) - descuento)
    }, 0)
    
    const descuentoGeneral = parseFloat(formData.descuento) || 0
    const totalDespuesDescuento = totalProductos - descuentoGeneral
    const subtotalSinImpuesto = totalDespuesDescuento - (totalDespuesDescuento * TASA_IMPUESTO)
    const impuesto = totalDespuesDescuento - subtotalSinImpuesto
    const icbper = parseFloat(formData.icbper) || 0
    const total = subtotalSinImpuesto + impuesto + icbper

    setFormData(prev => ({
      ...prev,
      subtotal: subtotalSinImpuesto,
      impuesto,
      total,
      totalProductos: productosSeleccionados.length
    }))
  }, [productosSeleccionados, formData.descuento, formData.icbper])

  // Calcular subtotal del item
  useEffect(() => {
    if (productoSeleccionado) {
      const TASA_IMPUESTO = 0.1525
      const cantidadNumerica = parseFloat(cantidadProducto) || 0
      const precioSinImpuesto = precioUnitarioSeleccionado - (precioUnitarioSeleccionado * TASA_IMPUESTO)
      const subtotalSinImpuesto = precioSinImpuesto * cantidadNumerica
      const subtotal = subtotalSinImpuesto - descuentoMonto
      setSubtotalItem(Math.max(0, subtotal))
    }
  }, [cantidadProducto, precioUnitarioSeleccionado, descuentoMonto, productoSeleccionado])

  // Calcular descuento cuando cambia el porcentaje
  useEffect(() => {
    if (productoSeleccionado && descuentoPorcentaje > 0) {
      const cantidadNumerica = parseFloat(cantidadProducto) || 0
      const monto = (precioUnitarioSeleccionado * cantidadNumerica * descuentoPorcentaje) / 100
      setDescuentoMonto(monto)
    } else if (descuentoPorcentaje === 0) {
      setDescuentoMonto(0)
    }
  }, [descuentoPorcentaje, precioUnitarioSeleccionado, cantidadProducto, productoSeleccionado])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEliminarProducto = (index) => {
    setProductosSeleccionados(productosSeleccionados.filter((_, i) => i !== index))
    if (indiceEditando === index) {
      setEditandoProducto(null)
      setIndiceEditando(null)
      setProductoSeleccionado(null)
      setPanelAbierto(false)
    } else if (indiceEditando !== null && indiceEditando > index) {
      setIndiceEditando(indiceEditando - 1)
    }
  }

  const handleEditarProducto = (producto, index) => {
    const productoOriginal = productos.find(p => p.id === producto.id) || producto.productoOriginal || producto
    
    setProductoSeleccionado(productoOriginal)
    setCantidadProducto(String(producto.cantidad || 1))
    setPrecioUnitario(producto.precio || 0)
    setCostoUnitario(producto.productoOriginal?.precioCompra || productoOriginal?.precioCompra || 0)
    setPrecioUnitarioSeleccionado(producto.precio || 0)
    setDescuentoPorcentaje(producto.descuentoPorcentaje || 0)
    setDescuentoMonto(producto.descuento || 0)
    
    let pres = null
    if (productoOriginal?.presentaciones) {
      pres = productoOriginal.presentaciones.find(p => p.presentacion === producto.presentacion) || null
    }
    if (!pres && productoOriginal?.presentaciones?.length > 0) {
      pres = productoOriginal.presentaciones[0]
    }
    setPresentacionSeleccionada(pres)
    
    setEditandoProducto(producto.id)
    setIndiceEditando(index)
    setPanelAbierto(true)
    
    setTimeout(() => {
      busquedaRef.current?.focus()
    }, 100)
  }

  const handleSeleccionarProducto = (producto) => {
    const precioInicial = producto.precio || producto.presentaciones?.[0]?.precioVenta || 0
    const presentacionInicial = producto.presentaciones?.[0] || null
    
    setProductoSeleccionado(producto)
    setCantidadProducto('1')
    setPrecioUnitario(precioInicial)
    setCostoUnitario(producto.precioCompra || 0)
    setPrecioUnitarioSeleccionado(precioInicial)
    setDescuentoPorcentaje(0)
    setDescuentoMonto(0)
    setSubtotalItem(precioInicial)
    setPresentacionSeleccionada(presentacionInicial)
    setPanelAbierto(true)

    setBusquedaProducto('')
    setMostrarSugerencias(false)
  }

  const handleCambiarPresentacion = (presentacion) => {
    setPresentacionSeleccionada(presentacion)
    const nuevoPrecio = presentacion?.precioVenta || productoSeleccionado?.precio || 0
    setPrecioUnitarioSeleccionado(nuevoPrecio)
    setPrecioUnitario(nuevoPrecio)
  }

  const handleAgregarProductoAVenta = () => {
    if (!productoSeleccionado) return

    const cantidadNumerica = parseFloat(cantidadProducto) || 0
    if (cantidadNumerica <= 0 || cantidadProducto === '' || cantidadProducto === null) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    if (precioUnitarioSeleccionado <= 0) {
      alert('El precio unitario debe ser mayor a 0')
      return
    }

    const TASA_IMPUESTO = 0.1525
    const precioSinImpuesto = precioUnitarioSeleccionado - (precioUnitarioSeleccionado * TASA_IMPUESTO)
    const subtotalSinImpuesto = (precioSinImpuesto * cantidadNumerica) - descuentoMonto

    if (editandoProducto !== null && indiceEditando !== null) {
      setProductosSeleccionados(productosSeleccionados.map((p, index) => {
        if (index === indiceEditando) {
          return { 
            ...p, 
            cantidad: cantidadNumerica, 
            precio: precioUnitarioSeleccionado,
            precioSinImpuesto: precioSinImpuesto,
            subtotal: Math.max(0, subtotalSinImpuesto),
            descuento: descuentoMonto,
            descuentoPorcentaje: descuentoPorcentaje,
            presentacion: presentacionSeleccionada?.presentacion || 'Unidad',
            nombre: productoSeleccionado.nombre
          }
        }
        return p
      }))
      
      setEditandoProducto(null)
      setIndiceEditando(null)
    } else {
      const productoExistente = productosSeleccionados.find(p => 
        p.id === productoSeleccionado.id && 
        p.presentacion === (presentacionSeleccionada?.presentacion || 'Unidad')
      )
      
      if (productoExistente) {
        const nuevaCantidad = productoExistente.cantidad + cantidadNumerica
        const nuevoPrecioSinImpuesto = precioUnitarioSeleccionado - (precioUnitarioSeleccionado * TASA_IMPUESTO)
        const nuevoSubtotalSinImpuesto = (nuevoPrecioSinImpuesto * nuevaCantidad) - descuentoMonto
        
        setProductosSeleccionados(productosSeleccionados.map(p => 
          p.id === productoSeleccionado.id && p.presentacion === (presentacionSeleccionada?.presentacion || 'Unidad')
            ? { 
                ...p, 
                cantidad: nuevaCantidad, 
                precio: precioUnitarioSeleccionado,
                precioSinImpuesto: nuevoPrecioSinImpuesto,
                subtotal: Math.max(0, nuevoSubtotalSinImpuesto),
                descuento: descuentoMonto,
                descuentoPorcentaje: descuentoPorcentaje
              }
            : p
        ))
      } else {
        const nuevoProducto = {
          id: productoSeleccionado.id,
          nombre: productoSeleccionado.nombre,
          cantidad: cantidadNumerica,
          precio: precioUnitarioSeleccionado,
          precioSinImpuesto: precioSinImpuesto,
          subtotal: Math.max(0, subtotalSinImpuesto),
          descuento: descuentoMonto,
          descuentoPorcentaje: descuentoPorcentaje,
          presentacion: presentacionSeleccionada?.presentacion || 'Unidad',
          productoOriginal: productoSeleccionado
        }
        setProductosSeleccionados([...productosSeleccionados, nuevoProducto])
      }
    }

    setProductoSeleccionado(null)
    setCantidadProducto('1')
    setPrecioUnitario(0)
    setCostoUnitario(0)
    setPrecioUnitarioSeleccionado(0)
    setDescuentoPorcentaje(0)
    setDescuentoMonto(0)
    setSubtotalItem(0)
    setPresentacionSeleccionada(null)
    setPanelAbierto(false)
    setEditandoProducto(null)
    setIndiceEditando(null)
    busquedaRef.current?.focus()
  }

  const handleSeleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    const nombreCompleto = `${cliente.nombres || cliente.nombre || ''} ${cliente.apellidos || ''}`.trim()
    setBusquedaCliente(nombreCompleto)
    setMostrarSugerenciasCliente(false)
    
    setFormData(prev => ({
      ...prev,
      cliente: nombreCompleto,
      clienteId: cliente.id
    }))
  }

  const handleKeyDown = (e) => {
    if (!mostrarSugerencias || productosSugeridos.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndiceSeleccionado(prev => 
        prev < productosSugeridos.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndiceSeleccionado(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (indiceSeleccionado >= 0 && indiceSeleccionado < productosSugeridos.length) {
        handleSeleccionarProducto(productosSugeridos[indiceSeleccionado])
      } else if (productosSugeridos.length > 0) {
        handleSeleccionarProducto(productosSugeridos[0])
      }
    } else if (e.key === 'Escape') {
      setMostrarSugerencias(false)
    }
  }

  const togglePanel = () => {
    setPanelAbierto(!panelAbierto)
  }

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

  const handleMouseMove = (e) => {
    if (!arrastrando || !inicioArrastreRef.current) return
    
    const deltaX = inicioArrastreRef.current - e.clientX
    
    if (deltaX > 80) {
      setPanelAbierto(false)
      setArrastrando(false)
      inicioArrastreRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      return
    }
  }

  const handleMouseUp = () => {
    setArrastrando(false)
    inicioArrastreRef.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleGuardarCotizacion = async () => {
    if (productosSeleccionados.length === 0) {
      alert('Debe agregar al menos un producto a la cotización')
      return
    }

    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente')
      return
    }

    try {
      const productosParaGuardar = productosSeleccionados.map(p => ({
        productoId: p.id,
        codigoInterno: p.productoOriginal?.codigoInterno || '',
        codigoBarra: p.productoOriginal?.codigoBarra || '',
        nombre: p.nombre,
        cantidad: parseInt(p.cantidad) || 1,
        precioUnitario: parseFloat(p.precio) || 0,
        costoUnitario: p.productoOriginal?.precioCompra || 0,
        descuentoPorcentaje: p.descuentoPorcentaje || 0,
        descuentoMonto: parseFloat(p.descuento) || 0,
        subtotal: parseFloat(p.subtotal) || 0,
        presentacion: p.presentacion || 'Unidad',
        unidad: p.productoOriginal?.unidad || 'UNIDAD'
      }))

      const TASA_IMPUESTO = 0.1525
      const totalProductos = productosSeleccionados.reduce((sum, p) => {
        const precioConImpuesto = parseFloat(p.precio) || 0
        const cantidad = parseInt(p.cantidad) || 1
        const descuento = parseFloat(p.descuento) || 0
        return sum + ((precioConImpuesto * cantidad) - descuento)
      }, 0)
      
      const descuentoGeneral = parseFloat(formData.descuento) || 0
      const totalDespuesDescuento = totalProductos - descuentoGeneral
      const subtotalFinal = totalDespuesDescuento - (totalDespuesDescuento * TASA_IMPUESTO)
      const impuestoFinal = totalDespuesDescuento - subtotalFinal
      const icbperFinal = parseFloat(formData.icbper) || 0
      const totalFinal = subtotalFinal + impuestoFinal + icbperFinal

      const cotizacionData = {
        fecha: formData.fecha,
        fechaVencimiento: formData.fechaVencimiento || '',
        estado: formData.estado || 'pendiente',
        vendedor: formData.vendedor,
        local: formData.local,
        almacen: formData.almacen,
        moneda: formData.moneda,
        tipoCambio: parseFloat(formData.tipoCambio) || 0,
        productos: productosParaGuardar,
        totalProductos: productosSeleccionados.length,
        subtotal: subtotalFinal,
        descuento: descuentoGeneral,
        impuesto: impuestoFinal,
        icbper: icbperFinal,
        total: totalFinal,
        cliente: clienteSeleccionado.nombres || clienteSeleccionado.nombre || '',
        clienteId: clienteSeleccionado.id,
        observaciones: formData.observaciones || '',
        createdAt: new Date().toISOString()
      }

      if (cotizacionEditando) {
        // Actualizar cotización existente
        await updateCotizacion(cotizacionEditando, cotizacionData, companyId)
        alert('✅ Cotización actualizada exitosamente. El stock NO ha sido modificado.')
      } else {
        // Crear nueva cotización
        await saveCotizacion(cotizacionData, companyId)
        alert('✅ Cotización guardada exitosamente. El stock NO ha sido modificado.')
      }
      
      // Reiniciar formulario
      setFormData({
        local: 'PRINCIPAL',
        almacen: 'PRINCIPAL',
        fecha: getCurrentDateSync(),
        fechaVencimiento: '',
        vendedor: 'DIXONACUÑA',
        moneda: 'Soles',
        tipoCambio: 0,
        subtotal: 0,
        descuento: 0,
        impuesto: 0,
        icbper: 0,
        total: 0,
        totalProductos: 0,
        observaciones: '',
        estado: 'pendiente'
      })
      setProductosSeleccionados([])
      setClienteSeleccionado(null)
      setBusquedaCliente('')
      setProductoSeleccionado(null)
      setPanelAbierto(false)
      setBusquedaProducto('')
      setShowCrearCotizacion(false)
      setCotizacionEditando(null)
      
      await loadData()
    } catch (error) {
      console.error('Error al guardar cotización:', error)
      alert('Error al guardar la cotización: ' + (error.message || 'Error desconocido'))
    }
  }

  const handleReiniciar = () => {
    if (window.confirm('¿Está seguro de que desea reiniciar el formulario?')) {
      setFormData({
        local: 'PRINCIPAL',
        almacen: 'PRINCIPAL',
        fecha: getCurrentDateSync(),
        fechaVencimiento: '',
        vendedor: 'DIXONACUÑA',
        moneda: 'Soles',
        tipoCambio: 0,
        subtotal: 0,
        descuento: 0,
        impuesto: 0,
        icbper: 0,
        total: 0,
        totalProductos: 0,
        observaciones: '',
        estado: 'pendiente'
      })
      setProductosSeleccionados([])
      setClienteSeleccionado(null)
      setBusquedaCliente('')
      setProductoSeleccionado(null)
      setPanelAbierto(false)
      setBusquedaProducto('')
      setCotizacionEditando(null)
    }
  }

  const handleEditarCotizacion = async (cotizacion) => {
    try {
      // Buscar el cliente en la lista de clientes
      const cliente = clientes.find(c => c.id === cotizacion.clienteId)
      
      if (cliente) {
        setClienteSeleccionado(cliente)
        const nombreCompleto = `${cliente.nombres || cliente.nombre || ''} ${cliente.apellidos || ''}`.trim()
        setBusquedaCliente(nombreCompleto)
      }

      // Cargar productos seleccionados desde la cotización
      const productosCargados = []
      if (cotizacion.productos && Array.isArray(cotizacion.productos)) {
        for (const productoCotizacion of cotizacion.productos) {
          // Buscar el producto original en la lista de productos
          const productoOriginal = productos.find(p => p.id === productoCotizacion.productoId)
          
          if (productoOriginal) {
            productosCargados.push({
              id: productoOriginal.id,
              nombre: productoCotizacion.nombre || productoOriginal.nombre,
              cantidad: productoCotizacion.cantidad || 1,
              precio: productoCotizacion.precioUnitario || productoOriginal.precio || 0,
              precioSinImpuesto: productoCotizacion.precioUnitario ? 
                productoCotizacion.precioUnitario - (productoCotizacion.precioUnitario * 0.1525) : 0,
              subtotal: productoCotizacion.subtotal || 0,
              descuento: productoCotizacion.descuentoMonto || 0,
              descuentoPorcentaje: productoCotizacion.descuentoPorcentaje || 0,
              presentacion: productoCotizacion.presentacion || 'Unidad',
              productoOriginal: productoOriginal
            })
          }
        }
      }

      setProductosSeleccionados(productosCargados)

      // Cargar datos del formulario
      setFormData({
        local: cotizacion.local || 'PRINCIPAL',
        almacen: cotizacion.almacen || 'PRINCIPAL',
        fecha: cotizacion.fecha || getCurrentDateSync(),
        fechaVencimiento: cotizacion.fechaVencimiento || '',
        vendedor: cotizacion.vendedor || 'DIXONACUÑA',
        moneda: cotizacion.moneda || 'Soles',
        tipoCambio: cotizacion.tipoCambio || 0,
        subtotal: cotizacion.subtotal || 0,
        descuento: cotizacion.descuento || 0,
        impuesto: cotizacion.impuesto || 0,
        icbper: cotizacion.icbper || 0,
        total: cotizacion.total || 0,
        totalProductos: cotizacion.totalProductos || productosCargados.length,
        observaciones: cotizacion.observaciones || '',
        estado: cotizacion.estado || 'pendiente'
      })

      setCotizacionEditando(cotizacion.id)
      setShowCrearCotizacion(true)
    } catch (error) {
      console.error('Error al cargar cotización para editar:', error)
      alert('Error al cargar la cotización: ' + (error.message || 'Error desconocido'))
    }
  }

  const handleEliminarCotizacion = async (cotizacion) => {
    const confirmar = window.confirm(
      `¿Está seguro de que desea eliminar la cotización del cliente "${cotizacion.cliente || 'Sin cliente'}" del ${formatDate(cotizacion.fecha)}?\n\nEsta acción no se puede deshacer.`
    )
    
    if (!confirmar) return

    // Si es un ejemplo en memoria, solo eliminarlo del estado
    if (cotizacion.esEjemplo || mostrarEjemplos) {
      setCotizaciones(cotizaciones.filter(c => c.id !== cotizacion.id))
      alert('✅ Cotización de ejemplo eliminada.')
      return
    }

    try {
      await deleteCotizacion(cotizacion.id, companyId)
      alert('✅ Cotización eliminada exitosamente.')
      await loadData()
    } catch (error) {
      console.error('Error al eliminar cotización:', error)
      alert('Error al eliminar la cotización: ' + (error.message || 'Error desconocido'))
    }
  }

  // Función para convertir cotización a venta
  const handleSubirAVenta = async (cotizacion) => {
    const confirmar = window.confirm(
      `¿Convertir esta cotización a venta?\n\nCliente: ${cotizacion.cliente || 'Sin cliente'}\nTotal: ${formatCurrency(cotizacion.total || 0)}\n\nEsta acción marcará la cotización como "Aprobada" y creará una nueva venta.`
    )
    
    if (!confirmar) return

    // Si es un ejemplo en memoria, mostrar alerta
    if (cotizacion.esEjemplo || mostrarEjemplos) {
      alert('⚠️ Esta es una cotización de ejemplo. Para convertir a venta, primero resuelve los permisos de Firebase y crea cotizaciones reales.')
      return
    }

    try {
      // Crear la venta con los datos de la cotización
      const venta = {
        fecha: getCurrentDateSync(),
        cliente: cotizacion.cliente || '',
        clienteId: cotizacion.clienteId || '',
        documento: cotizacion.documento || '',
        serie: 'B001', // Puedes ajustar esto según tu lógica
        numero: Date.now().toString().slice(-6), // Número único temporal
        items: cotizacion.items || [],
        subtotal: cotizacion.subtotal || 0,
        descuento: cotizacion.descuento || 0,
        impuesto: cotizacion.impuesto || 0,
        icbper: cotizacion.icbper || 0,
        total: cotizacion.total || 0,
        metodoPago: 'EFECTIVO', // Valor por defecto
        moneda: cotizacion.moneda || 'Soles',
        tipoCambio: cotizacion.tipoCambio || 0,
        vendedor: cotizacion.vendedor || 'DIXONACUÑA',
        local: cotizacion.local || 'PRINCIPAL',
        almacen: cotizacion.almacen || 'PRINCIPAL',
        observaciones: cotizacion.observaciones || '',
        origenCotizacion: cotizacion.id, // Referencia a la cotización original
        numeroItemsCotizacion: cotizacion.items?.length || 0
      }

      // Guardar la venta
      await saveVenta(venta, companyId)

      // Actualizar el estado de la cotización a "aprobada"
      const cotizacionActualizada = {
        ...cotizacion,
        estado: 'aprobada'
      }
      await updateCotizacion(cotizacion.id, cotizacionActualizada, companyId)

      alert('✅ Cotización convertida a venta exitosamente.\n\nLa cotización ahora está marcada como "Aprobada".')
      await loadData()
    } catch (error) {
      console.error('Error al convertir cotización a venta:', error)
      alert('❌ Error al convertir a venta: ' + (error.message || 'Error desconocido'))
    }
  }

  // Función para mostrar ejemplos en memoria (sin guardar en Firebase)
  const mostrarEjemplosEnMemoria = () => {
    const hoy = new Date()
    const fechaEjemplo1 = new Date(hoy)
    fechaEjemplo1.setDate(hoy.getDate() - 5)
    const fechaVencimiento1 = new Date(hoy)
    fechaVencimiento1.setDate(hoy.getDate() + 15)

    const fechaEjemplo2 = new Date(hoy)
    fechaEjemplo2.setDate(hoy.getDate() - 2)
    const fechaVencimiento2 = new Date(hoy)
    fechaVencimiento2.setDate(hoy.getDate() + 10)

    const fechaEjemplo3 = new Date(hoy)
    fechaEjemplo3.setDate(hoy.getDate() - 10)
    const fechaVencimiento3 = new Date(hoy)
    fechaVencimiento3.setDate(hoy.getDate() - 5) // Vencida

    const ejemplos = [
      {
        id: 'ejemplo-1',
        fecha: fechaEjemplo1.toISOString().split('T')[0],
        fechaVencimiento: fechaVencimiento1.toISOString().split('T')[0],
        estado: 'pendiente',
        cliente: 'Juan Pérez García',
        clienteId: 'ejemplo-cliente-1',
        total: 100.00,
        subtotal: 84.75,
        descuento: 0,
        impuesto: 15.25,
        icbper: 0,
        totalProductos: 2,
        vendedor: 'DIXONACUÑA',
        observaciones: 'Cotización de ejemplo para productos de oficina',
        productos: [
          {
            nombre: 'Lápices HB x12',
            codigoInterno: 'PROD-001',
            cantidad: 2,
            presentacion: 'Caja',
            precioUnitario: 25.00,
            descuentoMonto: 0,
            subtotal: 50.00
          },
          {
            nombre: 'Cuaderno A4 100 hojas',
            codigoInterno: 'PROD-002',
            cantidad: 1,
            presentacion: 'Unidad',
            precioUnitario: 50.00,
            descuentoMonto: 0,
            subtotal: 50.00
          }
        ],
        esEjemplo: true
      },
      {
        id: 'ejemplo-2',
        fecha: fechaEjemplo2.toISOString().split('T')[0],
        fechaVencimiento: fechaVencimiento2.toISOString().split('T')[0],
        estado: 'aprobada',
        cliente: 'María González López',
        clienteId: 'ejemplo-cliente-2',
        total: 202.50,
        subtotal: 171.64,
        descuento: 22.50,
        impuesto: 30.86,
        icbper: 0,
        totalProductos: 3,
        vendedor: 'DIXONACUÑA',
        observaciones: 'Cotización aprobada con descuento del 10%',
        productos: [
          {
            nombre: 'Mouse Inalámbrico',
            codigoInterno: 'PROD-003',
            cantidad: 3,
            presentacion: 'Unidad',
            precioUnitario: 75.00,
            descuentoMonto: 22.50,
            descuentoPorcentaje: 10,
            subtotal: 202.50
          }
        ],
        esEjemplo: true
      },
      {
        id: 'ejemplo-3',
        fecha: fechaEjemplo3.toISOString().split('T')[0],
        fechaVencimiento: fechaVencimiento3.toISOString().split('T')[0],
        estado: 'vencida',
        cliente: 'Carlos Rodríguez Martínez',
        clienteId: 'ejemplo-cliente-3',
        total: 120.00,
        subtotal: 101.70,
        descuento: 0,
        impuesto: 18.30,
        icbper: 0,
        totalProductos: 1,
        vendedor: 'DIXONACUÑA',
        observaciones: 'Cotización vencida - requiere renovación',
        productos: [
          {
            nombre: 'Teclado Mecánico RGB',
            codigoInterno: 'PROD-004',
            cantidad: 1,
            presentacion: 'Unidad',
            precioUnitario: 120.00,
            descuentoMonto: 0,
            subtotal: 120.00
          }
        ],
        esEjemplo: true
      }
    ]

    setCotizaciones(ejemplos)
    setMostrarEjemplos(true)
    alert('✅ Se han cargado 3 cotizaciones de ejemplo. Puedes hacer clic en cualquier fila para ver los detalles como nota de venta.\n\nNota: Estos son ejemplos en memoria y no se guardan en Firebase.')
  }

  const crearCotizacionesEjemplo = async () => {
    if (cotizaciones.length > 0 && !mostrarEjemplos) {
      const confirmar = window.confirm(
        'Ya existen cotizaciones en el sistema. ¿Desea crear cotizaciones de ejemplo adicionales?'
      )
      if (!confirmar) return
    }

    try {
      const hoy = new Date()
      const fechaEjemplo1 = new Date(hoy)
      fechaEjemplo1.setDate(hoy.getDate() - 5)
      const fechaVencimiento1 = new Date(hoy)
      fechaVencimiento1.setDate(hoy.getDate() + 15)

      const fechaEjemplo2 = new Date(hoy)
      fechaEjemplo2.setDate(hoy.getDate() - 2)
      const fechaVencimiento2 = new Date(hoy)
      fechaVencimiento2.setDate(hoy.getDate() + 10)

      const fechaEjemplo3 = new Date(hoy)
      fechaEjemplo3.setDate(hoy.getDate() - 10)
      const fechaVencimiento3 = new Date(hoy)
      fechaVencimiento3.setDate(hoy.getDate() - 5) // Vencida

      // Obtener algunos productos y clientes para los ejemplos
      const productosDisponibles = productos.slice(0, 3)
      const clientesDisponibles = clientes.slice(0, 3)

      const ejemplos = [
        {
          fecha: fechaEjemplo1.toISOString().split('T')[0],
          fechaVencimiento: fechaVencimiento1.toISOString().split('T')[0],
          estado: 'pendiente',
          vendedor: 'DIXONACUÑA',
          local: 'PRINCIPAL',
          almacen: 'PRINCIPAL',
          moneda: 'Soles',
          tipoCambio: 0,
          productos: productosDisponibles.length > 0 ? [
            {
              productoId: productosDisponibles[0].id,
              codigoInterno: productosDisponibles[0].codigoInterno || 'PROD001',
              codigoBarra: productosDisponibles[0].codigoBarra || '',
              nombre: productosDisponibles[0].nombre || 'Producto Ejemplo 1',
              cantidad: 2,
              precioUnitario: productosDisponibles[0].precio || 50.00,
              costoUnitario: productosDisponibles[0].precioCompra || 30.00,
              descuentoPorcentaje: 0,
              descuentoMonto: 0,
              subtotal: (productosDisponibles[0].precio || 50.00) * 2 * 0.8475, // Sin impuesto
              presentacion: 'Unidad',
              unidad: 'UNIDAD'
            }
          ] : [],
          totalProductos: productosDisponibles.length > 0 ? 1 : 0,
          subtotal: productosDisponibles.length > 0 ? (productosDisponibles[0].precio || 50.00) * 2 * 0.8475 : 0,
          descuento: 0,
          impuesto: productosDisponibles.length > 0 ? (productosDisponibles[0].precio || 50.00) * 2 * 0.1525 : 0,
          icbper: 0,
          total: productosDisponibles.length > 0 ? (productosDisponibles[0].precio || 50.00) * 2 : 0,
          cliente: clientesDisponibles.length > 0 ? 
            `${clientesDisponibles[0].nombres || clientesDisponibles[0].nombre || 'Cliente'} ${clientesDisponibles[0].apellidos || ''}`.trim() : 
            'Cliente Ejemplo 1',
          clienteId: clientesDisponibles.length > 0 ? clientesDisponibles[0].id : '',
          observaciones: 'Cotización de ejemplo para probar funcionalidades de editar y eliminar.'
        },
        {
          fecha: fechaEjemplo2.toISOString().split('T')[0],
          fechaVencimiento: fechaVencimiento2.toISOString().split('T')[0],
          estado: 'aprobada',
          vendedor: 'DIXONACUÑA',
          local: 'PRINCIPAL',
          almacen: 'PRINCIPAL',
          moneda: 'Soles',
          tipoCambio: 0,
          productos: productosDisponibles.length > 1 ? [
            {
              productoId: productosDisponibles[1].id,
              codigoInterno: productosDisponibles[1].codigoInterno || 'PROD002',
              codigoBarra: productosDisponibles[1].codigoBarra || '',
              nombre: productosDisponibles[1].nombre || 'Producto Ejemplo 2',
              cantidad: 3,
              precioUnitario: productosDisponibles[1].precio || 75.00,
              costoUnitario: productosDisponibles[1].precioCompra || 45.00,
              descuentoPorcentaje: 10,
              descuentoMonto: (productosDisponibles[1].precio || 75.00) * 3 * 0.10,
              subtotal: ((productosDisponibles[1].precio || 75.00) * 3 - (productosDisponibles[1].precio || 75.00) * 3 * 0.10) * 0.8475,
              presentacion: 'Unidad',
              unidad: 'UNIDAD'
            }
          ] : [],
          totalProductos: productosDisponibles.length > 1 ? 1 : 0,
          subtotal: productosDisponibles.length > 1 ? ((productosDisponibles[1].precio || 75.00) * 3 - (productosDisponibles[1].precio || 75.00) * 3 * 0.10) * 0.8475 : 0,
          descuento: productosDisponibles.length > 1 ? (productosDisponibles[1].precio || 75.00) * 3 * 0.10 : 0,
          impuesto: productosDisponibles.length > 1 ? ((productosDisponibles[1].precio || 75.00) * 3 - (productosDisponibles[1].precio || 75.00) * 3 * 0.10) * 0.1525 : 0,
          icbper: 0,
          total: productosDisponibles.length > 1 ? (productosDisponibles[1].precio || 75.00) * 3 - (productosDisponibles[1].precio || 75.00) * 3 * 0.10 : 0,
          cliente: clientesDisponibles.length > 1 ? 
            `${clientesDisponibles[1].nombres || clientesDisponibles[1].nombre || 'Cliente'} ${clientesDisponibles[1].apellidos || ''}`.trim() : 
            'Cliente Ejemplo 2',
          clienteId: clientesDisponibles.length > 1 ? clientesDisponibles[1].id : '',
          observaciones: 'Cotización aprobada de ejemplo con descuento aplicado.'
        },
        {
          fecha: fechaEjemplo3.toISOString().split('T')[0],
          fechaVencimiento: fechaVencimiento3.toISOString().split('T')[0],
          estado: 'vencida',
          vendedor: 'DIXONACUÑA',
          local: 'PRINCIPAL',
          almacen: 'PRINCIPAL',
          moneda: 'Soles',
          tipoCambio: 0,
          productos: productosDisponibles.length > 2 ? [
            {
              productoId: productosDisponibles[2].id,
              codigoInterno: productosDisponibles[2].codigoInterno || 'PROD003',
              codigoBarra: productosDisponibles[2].codigoBarra || '',
              nombre: productosDisponibles[2].nombre || 'Producto Ejemplo 3',
              cantidad: 1,
              precioUnitario: productosDisponibles[2].precio || 120.00,
              costoUnitario: productosDisponibles[2].precioCompra || 80.00,
              descuentoPorcentaje: 0,
              descuentoMonto: 0,
              subtotal: (productosDisponibles[2].precio || 120.00) * 0.8475,
              presentacion: 'Unidad',
              unidad: 'UNIDAD'
            }
          ] : [],
          totalProductos: productosDisponibles.length > 2 ? 1 : 0,
          subtotal: productosDisponibles.length > 2 ? (productosDisponibles[2].precio || 120.00) * 0.8475 : 0,
          descuento: 0,
          impuesto: productosDisponibles.length > 2 ? (productosDisponibles[2].precio || 120.00) * 0.1525 : 0,
          icbper: 0,
          total: productosDisponibles.length > 2 ? (productosDisponibles[2].precio || 120.00) : 0,
          cliente: clientesDisponibles.length > 2 ? 
            `${clientesDisponibles[2].nombres || clientesDisponibles[2].nombre || 'Cliente'} ${clientesDisponibles[2].apellidos || ''}`.trim() : 
            'Cliente Ejemplo 3',
          clienteId: clientesDisponibles.length > 2 ? clientesDisponibles[2].id : '',
          observaciones: 'Cotización vencida de ejemplo para demostración.'
        }
      ]

      // Crear las cotizaciones de ejemplo
      for (const ejemplo of ejemplos) {
        await saveCotizacion(ejemplo, companyId)
      }

      alert('✅ Se han creado 3 cotizaciones de ejemplo. Ahora puedes probar las funciones de editar y eliminar.')
      await loadData()
      setMostrarEjemplos(false) // Ya no son ejemplos en memoria, son reales
    } catch (error) {
      console.error('Error al crear cotizaciones de ejemplo:', error)
      const mensajeError = error.message || 'Error desconocido'
      
      // Si hay error de permisos, ofrecer mostrar ejemplos en memoria
      if (mensajeError.includes('permission') || mensajeError.includes('permiso')) {
        const usarEjemplos = window.confirm(
          '❌ Error de permisos de Firebase.\n\n' +
          'Las reglas de Firestore necesitan ser desplegadas.\n\n' +
          '¿Deseas ver ejemplos en memoria (sin guardar en Firebase) para probar las funciones de editar y eliminar?'
        )
        if (usarEjemplos) {
          mostrarEjemplosEnMemoria()
          return
        }
      }
      
      alert('Error al crear cotizaciones de ejemplo: ' + mensajeError)
    }
  }

  const filteredCotizaciones = cotizaciones.filter(cotizacion => {
    const matchesSearch = 
      cotizacion.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cotizacion.id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filtroEstado === 'todos') return matchesSearch
    return matchesSearch && cotizacion.estado === filtroEstado
  })

  // Si estamos mostrando ejemplos, agregar un banner informativo
  const cotizacionesParaMostrar = mostrarEjemplos ? filteredCotizaciones : filteredCotizaciones

  const totalCotizaciones = filteredCotizaciones.length
  const cotizacionesAprobadas = filteredCotizaciones.filter(c => c.estado === 'aprobada').length
  const cotizacionesPendientes = filteredCotizaciones.filter(c => c.estado === 'pendiente').length
  const totalValor = filteredCotizaciones.reduce((sum, c) => sum + (c.total || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Si se está creando una cotización, mostrar la vista completa
  if (showCrearCotizacion) {
    return (
      <div className="min-h-screen pb-20 w-full" style={{ width: '100%', maxWidth: '100%', backgroundColor: 'var(--color-background)' }}>
        {/* Breadcrumb */}
        <div className="border-b px-4 sm:px-6 py-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <nav className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span style={{ color: 'var(--color-text)' }}>Ventas</span> / <span 
              onClick={() => {
                setShowCrearCotizacion(false)
                setCotizacionEditando(null)
              }}
              className="cursor-pointer hover:underline"
              style={{ color: 'var(--color-text)' }}
            >Cotizaciones</span> / <span style={{ color: 'var(--color-text)' }}>{cotizacionEditando ? 'Editar Cotización' : 'Nueva Cotización'}</span>
          </nav>
        </div>

        <div className="flex flex-col lg:flex-row overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
          {/* Sección Izquierda - Detalles de Cotización */}
          <div className="flex-1 border-r-0 lg:border-r p-4 sm:p-6 w-full" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="space-y-4">
              {/* Local y Almacén */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local:</label>
                  <select
                    value={formData.local}
                    onChange={(e) => handleInputChange('local', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="PRINCIPAL">PRINCIPAL</option>
                    <option value="SECUNDARIO">SECUNDARIO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Almacen:</label>
                  <select
                    value={formData.almacen}
                    onChange={(e) => handleInputChange('almacen', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="PRINCIPAL">PRINCIPAL</option>
                    <option value="SECUNDARIO">SECUNDARIO</option>
                  </select>
                </div>
              </div>

              {/* Buscador de Cliente */}
              <div className="space-y-3">
                <div className="relative" ref={busquedaClienteRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente frecuente
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={busquedaCliente}
                        onChange={(e) => {
                          setBusquedaCliente(e.target.value)
                          setMostrarSugerenciasCliente(true)
                        }}
                        onKeyDown={(e) => {
                          if (!mostrarSugerenciasCliente || clientesSugeridos.length === 0) return

                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setIndiceSeleccionadoCliente(prev => 
                              prev < clientesSugeridos.length - 1 ? prev + 1 : prev
                            )
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setIndiceSeleccionadoCliente(prev => prev > 0 ? prev - 1 : -1)
                          } else if (e.key === 'Enter') {
                            e.preventDefault()
                            if (indiceSeleccionadoCliente >= 0 && indiceSeleccionadoCliente < clientesSugeridos.length) {
                              handleSeleccionarCliente(clientesSugeridos[indiceSeleccionadoCliente])
                            } else if (clientesSugeridos.length > 0) {
                              handleSeleccionarCliente(clientesSugeridos[0])
                            }
                          } else if (e.key === 'Escape') {
                            setMostrarSugerenciasCliente(false)
                          }
                        }}
                        onFocus={() => {
                          if (clientesSugeridos.length > 0) {
                            setMostrarSugerenciasCliente(true)
                          }
                        }}
                        placeholder="Buscar cliente por nombre, documento, email..."
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Search
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      
                      {mostrarSugerenciasCliente && clientesSugeridos.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-80 overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          {clientesSugeridos.map((cliente, index) => (
                            <div
                              key={cliente.id}
                              onClick={() => handleSeleccionarCliente(cliente)}
                              onMouseEnter={() => setIndiceSeleccionadoCliente(index)}
                              className={`
                                px-4 py-3 cursor-pointer transition-colors
                                ${index === indiceSeleccionadoCliente
                                  ? 'bg-primary-50 border-l-4 border-primary-600'
                                  : 'hover:bg-gray-50'
                                }
                              `}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {cliente.nombres || cliente.nombre || ''} {cliente.apellidos || ''}
                                    {cliente.razonSocial && ` - ${cliente.razonSocial}`}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                    {cliente.numeroDocumento && (
                                      <span>{cliente.tipoDocumento || 'DNI'}: {cliente.numeroDocumento}</span>
                                    )}
                                    {cliente.correoElectronico && (
                                      <span>{cliente.correoElectronico}</span>
                                    )}
                                    {cliente.telefono && (
                                      <span>{cliente.telefono}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {mostrarSugerenciasCliente && busquedaCliente.trim() !== '' && clientesSugeridos.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                            No se encontraron clientes que coincidan con "{busquedaCliente}"
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowNuevoClienteModal(true)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                      title="Registrar nuevo cliente"
                    >
                      <UserPlus size={18} />
                      Nuevo Cliente
                    </button>
                  </div>
                  {clienteSeleccionado && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Cliente seleccionado:</strong> {clienteSeleccionado.nombres || clienteSeleccionado.nombre} {clienteSeleccionado.apellidos || ''}
                        {clienteSeleccionado.numeroDocumento && ` - ${clienteSeleccionado.tipoDocumento || 'DNI'}: ${clienteSeleccionado.numeroDocumento}`}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Buscador de Productos */}
                <div className="relative" ref={busquedaRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BUSCAR PRODUCTOS
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={busquedaProducto}
                      onChange={(e) => {
                        setBusquedaProducto(e.target.value)
                        setMostrarSugerencias(true)
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        if (productosSugeridos.length > 0) {
                          setMostrarSugerencias(true)
                        }
                      }}
                      placeholder="Escribe el nombre del producto..."
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <Search 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                      size={20} 
                    />
                  </div>

                  {mostrarSugerencias && productosSugeridos.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-80 overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      {productosSugeridos.map((producto, index) => (
                        <div
                          key={producto.id}
                          onClick={() => handleSeleccionarProducto(producto)}
                          onMouseEnter={() => setIndiceSeleccionado(index)}
                          className={`
                            px-4 py-3 cursor-pointer transition-colors
                            ${index === indiceSeleccionado 
                              ? 'bg-primary-50 border-l-4 border-primary-600' 
                              : 'hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {producto.nombre}
                              </p>
                              {producto.descripcion && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                  {producto.descripcion}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {producto.codigoInterno && (
                                  <span>Código: {producto.codigoInterno}</span>
                                )}
                                {producto.precio > 0 && (
                                  <span className="font-semibold text-primary-600">
                                    {formatCurrency(producto.precio)}
                                  </span>
                                )}
                                {producto.stock !== undefined && (
                                  <span className="font-semibold">Stock: {producto.stock}</span>
                                )}
                              </div>
                            </div>
                            {producto.imagenes && producto.imagenes.length > 0 && (
                              <img
                                src={producto.imagenes[0].preview}
                                alt={producto.nombre}
                                className="w-12 h-12 object-cover rounded ml-3"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {mostrarSugerencias && busquedaProducto.trim() !== '' && productosSugeridos.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                      <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                        No se encontraron productos que coincidan con "{busquedaProducto}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verTallaColor}
                    onChange={(e) => setVerTallaColor(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Ver Talla color</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarDetalle}
                    onChange={(e) => setMostrarDetalle(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Mostrar detalle</span>
                </label>
              </div>

              {/* Panel de Detalles del Producto */}
              {productoSeleccionado && (
                <div 
                  ref={panelRef}
                  className={`mt-6 border border-gray-200 rounded-lg bg-white transition-all duration-300 ${
                    panelAbierto ? 'block' : 'hidden'
                  }`}
                >
                  <div 
                    className={`flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2 cursor-grab active:cursor-grabbing select-none ${
                      arrastrando ? 'bg-gray-200' : 'hover:bg-gray-100'
                    } transition-colors`}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Detalles del Producto</span>
                      <span className="text-xs text-gray-500">(Arrastra hacia la izquierda para ocultar)</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePanel()
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-lg">
                          {productoSeleccionado.codigoInterno || productoSeleccionado.codigoBarra} - {productoSeleccionado.nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            ✓ Stock disponible
                          </span>
                          <button className="px-2 py-1 bg-green-600 text-white rounded text-xs">
                            U +Todos
                          </button>
                          <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
                            {productoSeleccionado.stock || 0} UNIDAD
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => setProductoSeleccionado(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 0 && (
                        <div>
                          <img
                            src={productoSeleccionado.imagenes[0].preview}
                            alt={productoSeleccionado.nombre}
                            className="w-32 h-32 object-cover rounded border border-gray-200"
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad:</label>
                          <input
                            type="number"
                            min="1"
                            max={productoSeleccionado.stock || 999}
                            value={cantidadProducto}
                            onChange={(e) => {
                              const valor = e.target.value;
                              if (valor === '' || (!isNaN(valor) && parseFloat(valor) >= 0)) {
                                setCantidadProducto(valor);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {presentacionSeleccionada?.presentacion || 'UNIDAD'} ({presentacionSeleccionada?.cantidad || 1} UND)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total de stock:</label>
                          <p className="text-sm text-gray-900">{productoSeleccionado.stock || 0} UNIDAD</p>
                        </div>
                      </div>
                    </div>

                    {productoSeleccionado.presentaciones && productoSeleccionado.presentaciones.length > 1 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Presentación:</label>
                        <div className="flex flex-wrap gap-2">
                          {productoSeleccionado.presentaciones.map((pres, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleCambiarPresentacion(pres)}
                              className={`px-3 py-1 rounded text-sm ${
                                presentacionSeleccionada?.presentacion === pres.presentacion
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pres.presentacion} ({pres.cantidad})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={precioUnitario}
                          onChange={(e) => {
                            const nuevoPrecio = parseFloat(e.target.value) || 0
                            setPrecioUnitario(nuevoPrecio)
                            setPrecioUnitarioSeleccionado(nuevoPrecio)
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded bg-orange-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-green-600">✓</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{presentacionSeleccionada?.presentacion || 'UNIDAD'}</p>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo unitario:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costoUnitario}
                        onChange={(e) => setCostoUnitario(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%):</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={descuentoPorcentaje}
                          onChange={(e) => setDescuentoPorcentaje(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (S/):</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={descuentoMonto}
                          onChange={(e) => {
                            const monto = parseFloat(e.target.value) || 0
                            setDescuentoMonto(monto)
                            const cantidadNumerica = parseFloat(cantidadProducto) || 0
                            if (precioUnitarioSeleccionado * cantidadNumerica > 0) {
                              const porcentaje = (monto / (precioUnitarioSeleccionado * cantidadNumerica)) * 100
                              setDescuentoPorcentaje(porcentaje)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total:</label>
                      <input
                        type="text"
                        value={formatCurrency((precioUnitarioSeleccionado * (parseFloat(cantidadProducto) || 0)) - descuentoMonto)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 font-semibold"
                      />
                    </div>

                    <button
                      onClick={handleAgregarProductoAVenta}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editandoProducto ? 'Actualizar' : 'Agregar'}
                    </button>
                  </div>
                </div>
              )}

              {productoSeleccionado && !panelAbierto && (
                <button
                  onClick={togglePanel}
                  className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <ChevronRight size={20} />
                  <span>Mostrar detalles del producto</span>
                </button>
              )}

              {/* Área de Productos Agregados */}
              <div className="mt-6 border border-gray-200 rounded-lg p-4 min-h-[400px]">
                {productosSeleccionados.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-primary-600">{formatCurrency(formData.total)}</span>
                    </div>
                  </div>
                )}
                
                {productosSeleccionados.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <ShoppingCart size={48} className="mx-auto mb-2" />
                      <p>No hay productos agregados</p>
                      <p className="text-sm">Escribe el nombre del producto en el buscador para agregar</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productosSeleccionados.map((producto, index) => (
                      <div key={`${producto.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{producto.nombre}</p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {producto.cantidad} | Precio: {formatCurrency(producto.precio)}
                            {producto.presentacion && ` | ${producto.presentacion}`}
                          </p>
                          {producto.descuento > 0 && (
                            <p className="text-xs text-orange-600">Descuento: {formatCurrency(producto.descuento)}</p>
                          )}
                          {producto.productoOriginal?.stock !== undefined && (
                            <p className="text-xs text-blue-600">Stock disponible: {producto.productoOriginal.stock}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditarProducto(producto, index)}
                            className="text-blue-600 hover:text-blue-800 p-2 transition-colors"
                            title="Editar producto"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminarProducto(index)}
                            className="text-red-600 hover:text-red-800 p-2 transition-colors"
                            title="Eliminar producto"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección Derecha - Información de Cotización */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l p-4 sm:p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>INFORMACIÓN DE COTIZACIÓN</h3>
            
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Fecha:</label>
                <input
                  type="text"
                  value={formatDate(formData.fecha)}
                  readOnly
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm sm:text-right bg-gray-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Fecha Vencimiento:</label>
                <input
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) => handleInputChange('fechaVencimiento', e.target.value)}
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Vendedor:</label>
                <select
                  value={formData.vendedor}
                  onChange={(e) => handleInputChange('vendedor', e.target.value)}
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="DIXONACUÑA">DIXONACUÑA</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Moneda:</label>
                <select
                  value={formData.moneda}
                  onChange={(e) => handleInputChange('moneda', e.target.value)}
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="Soles">Soles</option>
                  <option value="Dolares">Dólares</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Subtotal:</label>
                <input
                  type="text"
                  value={formatCurrency(formData.subtotal)}
                  readOnly
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Descuento:</label>
                <input
                  type="number"
                  value={formData.descuento}
                  onChange={(e) => handleInputChange('descuento', parseFloat(e.target.value) || 0)}
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-red-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Impuesto (15.25%):</label>
                <input
                  type="text"
                  value={formatCurrency(formData.impuesto)}
                  readOnly
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>ICBPER:</label>
                <input
                  type="number"
                  value={formData.icbper}
                  onChange={(e) => handleInputChange('icbper', parseFloat(e.target.value) || 0)}
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                />
              </div>

              <div className="flex items-center justify-between border-t border-gray-300 pt-2">
                <label className="text-sm font-semibold text-gray-900">Total:</label>
                <input
                  type="text"
                  value={formatCurrency(formData.total)}
                  readOnly
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right font-semibold bg-yellow-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Total de productos:</label>
                <input
                  type="text"
                  value={formData.totalProductos}
                  readOnly
                  className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Observaciones:</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="Notas adicionales sobre la cotización..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="fixed bottom-0 left-0 right-0 border-t px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={handleGuardarCotizacion}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold shadow-md"
            >
              <Save size={20} />
              {cotizacionEditando ? 'Actualizar Cotización' : 'Guardar Cotización'}
            </button>
            <button
              onClick={handleReiniciar}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Reiniciar
            </button>
            <button 
              onClick={() => {
                setShowCrearCotizacion(false)
                setCotizacionEditando(null)
                handleReiniciar()
              }}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <X size={18} />
              Cancelar
            </button>
          </div>
        </div>

        {/* Modal de Nuevo Cliente */}
        {showNuevoClienteModal && (
          <ModalNuevoCliente
            onClose={() => setShowNuevoClienteModal(false)}
            onSave={async (clienteData) => {
              try {
                const nuevoCliente = await saveCliente(clienteData, companyId)
                const clientesData = await getClientes(companyId)
                setClientes(clientesData)
                handleSeleccionarCliente(nuevoCliente)
                setShowNuevoClienteModal(false)
                alert('✅ Cliente registrado exitosamente')
              } catch (error) {
                console.error('Error al guardar cliente:', error)
                alert('Error al guardar cliente: ' + (error.message || 'Error desconocido'))
              }
            }}
          />
        )}
      </div>
    )
  }

  // Vista normal de lista de cotizaciones
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="border-b px-4 sm:px-6 py-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <nav className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span style={{ color: 'var(--color-text)' }}>Ventas</span> / <span 
            onClick={() => setShowCrearCotizacion(false)}
            className="cursor-pointer hover:underline"
            style={{ color: 'var(--color-text)' }}
          >Cotizaciones</span>
        </nav>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Cotizaciones
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de cotizaciones y presupuestos
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
          {cotizaciones.length === 0 && (
        <button
              onClick={mostrarEjemplosEnMemoria}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
              title="Ver ejemplos en memoria para probar editar y eliminar"
            >
              <FileText size={18} />
              Ver Ejemplos
            </button>
          )}
          <button
            onClick={() => setShowConfiguracionPDF(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            title="Configurar diseño del PDF"
          >
            <Layout size={20} />
            Presentación
          </button>
          <button
            onClick={() => setShowCrearCotizacion(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Cotización
        </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Cotizaciones</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{totalCotizaciones}</p>
            </div>
            <FileText size={24} className="text-primary-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Valor Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValor)}</p>
            </div>
            <CheckCircle size={24} className="text-green-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Aprobadas</p>
              <p className="text-2xl font-bold text-blue-600">{cotizacionesAprobadas}</p>
            </div>
            <CheckCircle size={24} className="text-blue-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{cotizacionesPendientes}</p>
            </div>
            <Clock size={24} className="text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Banner de ejemplos en memoria */}
      {mostrarEjemplos && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Modo de Ejemplos
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                Estás viendo cotizaciones de ejemplo en memoria. Estas no se guardan en Firebase. Puedes probar las funciones de editar y eliminar.
              </p>
              <button
                onClick={() => {
                  setMostrarEjemplos(false)
                  loadData()
                }}
                className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
              >
                Cargar cotizaciones reales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente o número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-4 py-2 border rounded-lg"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
          <option value="vencida">Vencidas</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-background)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Vencimiento</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
                <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCotizaciones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    <div className="flex flex-col items-center gap-3">
                      <p className="font-medium">No hay cotizaciones registradas</p>
                      <div className="flex flex-col gap-2 items-center">
                        <p className="text-xs text-gray-400 max-w-md">
                          Usa el botón "+ Nueva Cotización" para crear una. Una vez creadas, podrás editarlas y eliminarlas desde la columna "Acciones".
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={mostrarEjemplosEnMemoria}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
                            title="Ver ejemplos en memoria (sin guardar en Firebase)"
                          >
                            <FileText size={16} />
                            Ver Ejemplos
                          </button>
                          <button
                            onClick={crearCotizacionesEjemplo}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                            title="Crear cotizaciones de ejemplo en Firebase"
                          >
                            <FileText size={16} />
                            Crear en Firebase
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 italic max-w-md">
                          <strong>"Ver Ejemplos"</strong> muestra datos de ejemplo en memoria para probar las funciones sin necesidad de permisos de Firebase.<br/>
                          <strong>"Crear en Firebase"</strong> guarda las cotizaciones en la base de datos (requiere permisos configurados).
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCotizaciones.map((cotizacion) => (
                  <tr 
                    key={cotizacion.id} 
                    className="border-t cursor-pointer cotizacion-row transition-colors" 
                    style={{ borderColor: 'var(--color-border)' }}
                    onClick={(e) => {
                      // No abrir si se hace clic en los botones de acción
                      if (e.target.closest('button')) return
                      setCotizacionSeleccionada(cotizacion)
                    }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(cotizacion.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {cotizacion.cliente || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {cotizacion.fechaVencimiento ? formatDate(cotizacion.fechaVencimiento) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(cotizacion.total || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        cotizacion.estado === 'aprobada'
                          ? 'bg-green-100 text-green-800'
                          : cotizacion.estado === 'rechazada'
                          ? 'bg-red-100 text-red-800'
                          : cotizacion.estado === 'vencida'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cotizacion.estado === 'aprobada' ? 'Aprobada' : 
                         cotizacion.estado === 'rechazada' ? 'Rechazada' :
                         cotizacion.estado === 'vencida' ? 'Vencida' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (cotizacion.esEjemplo || mostrarEjemplos) {
                              alert('⚠️ Esta es una cotización de ejemplo. Para editar cotizaciones reales, primero resuelve los permisos de Firebase y crea cotizaciones reales.')
                            } else {
                              handleEditarCotizacion(cotizacion)
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={cotizacion.esEjemplo ? "Editar (ejemplo en memoria)" : "Editar cotización"}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleEliminarCotizacion(cotizacion)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title={cotizacion.esEjemplo ? "Eliminar (ejemplo en memoria)" : "Eliminar cotización"}
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => handleSubirAVenta(cotizacion)}
                          className={`p-2 rounded transition-colors ${
                            cotizacion.estado === 'aprobada'
                              ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={
                            cotizacion.estado === 'aprobada'
                              ? 'Cotización ya convertida a venta'
                              : cotizacion.esEjemplo
                              ? 'Subir a venta (ejemplo en memoria)'
                              : 'Convertir cotización a venta'
                          }
                          disabled={cotizacion.estado === 'aprobada'}
                        >
                          <ShoppingCart size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Configuración del PDF */}
      {showConfiguracionPDF && (
        <ModalConfiguracionPDF
          configuracion={configuracionPDF}
          onClose={() => {
            // Limpiar localStorage al cerrar para que siempre empiece en blanco
            try {
              localStorage.removeItem('cotizacion_pdf_config')
            } catch (e) {
              console.error('Error al limpiar configuración:', e)
            }
            setShowConfiguracionPDF(false)
          }}
          onSave={(nuevaConfig) => {
            setConfiguracionPDF(nuevaConfig)
            localStorage.setItem('cotizacion_pdf_config', JSON.stringify(nuevaConfig))
            setShowConfiguracionPDF(false)
          }}
        />
      )}

      {/* Modal de Detalles de Cotización (Nota de Venta) */}
      {cotizacionSeleccionada && (
        <ModalDetallesCotizacion
          cotizacion={cotizacionSeleccionada}
          onClose={() => setCotizacionSeleccionada(null)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          configuracionPDF={configuracionPDF}
        />
      )}
            </div>
  )
}

// Componente Modal de Configuración del PDF - Editor Visual
const ModalConfiguracionPDF = ({ configuracion, onClose, onSave }) => {
  // Hoja completamente en blanco
  const [config, setConfig] = useState({
    elementos: [],
    margen: configuracion?.margen || 15,
    colorPrimario: configuracion?.colorPrimario || '#2563eb',
    colorSecundario: configuracion?.colorSecundario || '#6b7280'
  })
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [redimensionando, setRedimensionando] = useState(null) // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  const [offsetArrastre, setOffsetArrastre] = useState({ x: 0, y: 0 })
  const [inicioRedimensionamiento, setInicioRedimensionamiento] = useState({ x: 0, y: 0, width: 0, height: 0, mouseX: 0, mouseY: 0 })
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)
  const [mostrarPlantillas, setMostrarPlantillas] = useState(false)
  const canvasRef = useRef(null)
  const canvasContainerRef = useRef(null)
  const [reorganizadoInicialmente, setReorganizadoInicialmente] = useState(false)
  const [zoom, setZoom] = useState(100) // Zoom inicial al 100%
  const [mostrarRegla, setMostrarRegla] = useState(true) // Mostrar regla por defecto
  
  // Limpiar localStorage al montar para asegurar hoja en blanco
  useEffect(() => {
    try {
      localStorage.removeItem('cotizacion_pdf_config')
      setConfig(prev => ({
        ...prev,
        elementos: []
      }))
    } catch (e) {
      console.error('Error al limpiar configuración:', e)
    }
  }, [])
  
  // Plantilla base - Hoja en blanco
  const plantillaBase = {
    nombre: 'Plantilla en Blanco',
    elementos: [],
    margen: 15,
    colorPrimario: '#2563eb',
    colorSecundario: '#6b7280'
  }
  
  // Plantilla DEMO por defecto - siempre debe existir
  const getPlantillaDEMODefault = () => {
    return {
      nombre: 'DEMO',
      elementos: [
        {
          id: 'titulo',
          tipo: 'header',
          texto: 'COTIZACIÓN - NOTA DE VENTA',
          x: 105,
          y: 15,
          width: 180,
          height: 10,
          fontSize: 20,
          fontWeight: 'bold',
          align: 'center',
          color: '#ffffff',
          backgroundColor: '#f97316',
          visible: true
        },
        {
          id: 'subtitulo',
          tipo: 'texto',
          texto: 'Qubit - Sistema de Gestión',
          x: 105,
          y: 25,
          width: 180,
          height: 5,
          fontSize: 12,
          fontWeight: 'normal',
          align: 'center',
          color: '#6b7280',
          visible: true
        },
        {
          id: 'info_cliente',
          tipo: 'texto',
          texto: 'INFORMACIÓN DE LA COTIZACIÓN\nCliente: {cliente}\nFecha: {fecha}\nVencimiento: {fechaVencimiento}\nVendedor: {vendedor}\nEstado: {estado}',
          x: 15,
          y: 50,
          width: 180,
          height: 30,
          fontSize: 10,
          fontWeight: 'normal',
          align: 'left',
          color: '#000000',
          visible: true
        },
        {
          id: 'tabla_productos',
          tipo: 'tabla',
          x: 15,
          y: 90,
          width: 180,
          height: 100,
          headers: [
            { texto: 'Producto', color: '#000000' },
            { texto: 'Cant.', color: '#000000' },
            { texto: 'Pres.', color: '#000000' },
            { texto: 'P.', color: '#000000' },
            { texto: 'Desc.', color: '#000000' },
            { texto: 'Total', color: '#000000' }
          ],
          tituloTabla: 'DETALLE DE PRODUCTOS',
          colorTituloTabla: '#000000',
          visible: true
        },
        {
          id: 'totales',
          tipo: 'totales',
          x: 15,
          y: 200,
          width: 180,
          height: 20,
          fontSize: 10,
          align: 'right',
          color: '#000000',
          colorTotal: '#0284c7',
          lineas: [
            { label: 'Subtotal:', color: '#000000' },
            { label: 'Descuento General:', color: '#000000' },
            { label: 'Impuesto (15.25%):', color: '#000000' },
            { label: 'TOTAL:', color: '#0284c7' }
          ],
          visible: true
        },
        {
          id: 'observaciones',
          tipo: 'texto',
          texto: 'Observaciones:\n{observaciones}',
          x: 15,
          y: 230,
          width: 180,
          height: 30,
          fontSize: 10,
          fontWeight: 'normal',
          align: 'left',
          color: '#000000',
          visible: true
        }
      ],
      margen: 15,
      colorPrimario: '#2563eb',
      colorSecundario: '#6b7280'
    }
  }

  // Cargar plantillas guardadas y asegurar que DEMO siempre exista
  const cargarPlantillas = () => {
    try {
      const guardadas = localStorage.getItem('cotizacion_plantillas')
      let plantillas = []
      
      if (guardadas) {
        const parsed = JSON.parse(guardadas)
        // Filtrar la "Plantilla en Blanco" si existe
        plantillas = Array.isArray(parsed) 
          ? parsed.filter(p => p.nombre !== 'Plantilla en Blanco') 
          : []
      }
      
      // Verificar si existe la plantilla DEMO
      const existeDEMO = plantillas.some(p => p.nombre === 'DEMO')
      
      // Si no existe, agregarla al inicio
      if (!existeDEMO) {
        const plantillaDEMO = getPlantillaDEMODefault()
        plantillas = [plantillaDEMO, ...plantillas]
        // Guardar en localStorage
        localStorage.setItem('cotizacion_plantillas', JSON.stringify(plantillas))
      } else {
        // Si existe, asegurar que esté al inicio y actualizar si es necesario
        const indexDEMO = plantillas.findIndex(p => p.nombre === 'DEMO')
        if (indexDEMO > 0) {
          // Mover DEMO al inicio
          const plantillaDEMO = plantillas[indexDEMO]
          plantillas.splice(indexDEMO, 1)
          plantillas.unshift(plantillaDEMO)
          localStorage.setItem('cotizacion_plantillas', JSON.stringify(plantillas))
        }
      }
      
      return plantillas
    } catch (e) {
      console.error('Error al cargar plantillas:', e)
      // Si hay error, retornar al menos la plantilla DEMO
      const plantillaDEMO = getPlantillaDEMODefault()
      try {
        localStorage.setItem('cotizacion_plantillas', JSON.stringify([plantillaDEMO]))
      } catch (e2) {
        console.error('Error al guardar plantilla DEMO:', e2)
      }
      return [plantillaDEMO]
    }
  }
  
  // Función helper para asegurar que DEMO siempre esté presente
  const asegurarPlantillaDEMO = (plantillasArray) => {
    const existeDEMO = plantillasArray.some(p => p.nombre === 'DEMO')
    
    if (!existeDEMO) {
      // Si no existe, agregarla al inicio
      const plantillaDEMO = getPlantillaDEMODefault()
      return [plantillaDEMO, ...plantillasArray]
    } else {
      // Si existe, asegurar que esté al inicio
      const indexDEMO = plantillasArray.findIndex(p => p.nombre === 'DEMO')
      if (indexDEMO > 0) {
        const plantillaDEMO = plantillasArray[indexDEMO]
        const nuevasPlantillas = [...plantillasArray]
        nuevasPlantillas.splice(indexDEMO, 1)
        nuevasPlantillas.unshift(plantillaDEMO)
        return nuevasPlantillas
      }
    }
    
    return plantillasArray
  }
  
  // Función para convertir headers antiguos (array de strings) al nuevo formato (array de objetos)
  const convertirHeadersTabla = (elementos) => {
    return elementos.map(elemento => {
      if (elemento.tipo === 'tabla') {
        // Convertir headers si son strings (formato antiguo)
        if (elemento.headers) {
          const primerHeader = elemento.headers[0]
          if (typeof primerHeader === 'string') {
            // Convertir array de strings a array de objetos
            elemento.headers = elemento.headers.map(texto => ({
              texto: texto,
              color: '#000000'
            }))
          }
        }
        // Agregar título de tabla si no existe (para plantillas antiguas)
        if (!elemento.tituloTabla) {
          elemento.tituloTabla = 'DETALLE DE PRODUCTOS'
        }
        if (!elemento.colorTituloTabla) {
          elemento.colorTituloTabla = '#000000'
        }
      }
      // Convertir totales si no tienen lineas (formato antiguo)
      if (elemento.tipo === 'totales' && !elemento.lineas) {
        elemento.lineas = [
          { label: 'Subtotal:', color: '#000000' },
          { label: 'Descuento General:', color: '#000000' },
          { label: 'Impuesto (15.25%):', color: '#000000' },
          { label: 'TOTAL:', color: elemento.colorTotal || '#0284c7' }
        ]
      }
      return elemento
    })
  }

  const [plantillas, setPlantillas] = useState(cargarPlantillas())
  const [plantillaActual, setPlantillaActual] = useState(null) // Nombre de la plantilla en uso
  const [plantillaCargada, setPlantillaCargada] = useState(false) // Para evitar loops

  // Cargar plantilla activa guardada al montar el componente
  useEffect(() => {
    if (plantillaCargada) return // Ya se cargó, no volver a cargar
    
    try {
      const plantillaActivaNombre = localStorage.getItem('cotizacion_plantilla_activa')
      if (plantillaActivaNombre) {
        const plantilla = plantillas.find(p => p.nombre === plantillaActivaNombre)
        if (plantilla) {
          // Convertir headers antiguos al nuevo formato si es necesario
          const elementosConvertidos = convertirHeadersTabla(JSON.parse(JSON.stringify(plantilla.elementos)))
          
          setConfig({
            elementos: elementosConvertidos,
            margen: plantilla.margen || 15,
            colorPrimario: plantilla.colorPrimario || '#2563eb',
            colorSecundario: plantilla.colorSecundario || '#6b7280'
          })
          setPlantillaActual(plantilla.nombre)
          setPlantillaCargada(true)
        }
      }
    } catch (e) {
      console.error('Error al cargar plantilla activa:', e)
    }
  }, [plantillas, plantillaCargada])

  // Aplicar una plantilla
  const aplicarPlantilla = (plantilla) => {
    // Convertir headers antiguos al nuevo formato si es necesario
    const elementosConvertidos = convertirHeadersTabla(JSON.parse(JSON.stringify(plantilla.elementos)))
    
    setConfig({
      elementos: elementosConvertidos,
      margen: plantilla.margen || 15,
      colorPrimario: plantilla.colorPrimario || '#2563eb',
      colorSecundario: plantilla.colorSecundario || '#6b7280'
    })
    setPlantillaActual(plantilla.nombre) // Guardar el nombre de la plantilla aplicada
    
    // Guardar como plantilla activa en localStorage
    try {
      localStorage.setItem('cotizacion_plantilla_activa', plantilla.nombre)
    } catch (e) {
      console.error('Error al guardar plantilla activa:', e)
    }
    
    setMostrarPlantillas(false)
    setElementoSeleccionado(null)
  }
  
  // Crear nueva plantilla en blanco
  const guardarComoPlantilla = () => {
    // Pedir nombre al principio
    const nombre = prompt('Ingresa un nombre para la nueva plantilla:')
    if (!nombre) return // Si no hay nombre, no crear la plantilla
    
    // Verificar si ya existe una plantilla con ese nombre
    if (plantillas.some(p => p.nombre === nombre)) {
      alert('⚠️ Ya existe una plantilla con ese nombre. Por favor elige otro nombre.')
      return
    }
    
    // Crear plantilla con hoja en blanco (sin elementos)
    const nuevaPlantilla = {
      nombre: nombre,
      elementos: [], // Hoja en blanco
      margen: 15,
      colorPrimario: '#2563eb',
      colorSecundario: '#6b7280'
    }
    
    // Guardar la plantilla y asegurar que DEMO esté presente
    const plantillasActualizadas = asegurarPlantillaDEMO([...plantillas, nuevaPlantilla])
    setPlantillas(plantillasActualizadas)
    localStorage.setItem('cotizacion_plantillas', JSON.stringify(plantillasActualizadas))
    
    // Aplicar la plantilla en blanco automáticamente
    setConfig({
      elementos: [],
      margen: 15,
      colorPrimario: '#2563eb',
      colorSecundario: '#6b7280'
    })
    setPlantillaActual(nombre)
    
    // Guardar como plantilla activa en localStorage
    try {
      localStorage.setItem('cotizacion_plantilla_activa', nombre)
    } catch (e) {
      console.error('Error al guardar plantilla activa:', e)
    }
    
    setMostrarPlantillas(false)
    setElementoSeleccionado(null)
    
    alert(`✅ Plantilla "${nombre}" creada exitosamente. Ahora puedes empezar a agregar elementos.`)
  }
  
  // Eliminar plantilla
  const eliminarPlantilla = (index) => {
    const plantillaAEliminar = plantillas[index]
    
    // Proteger la plantilla DEMO
    if (plantillaAEliminar.nombre === 'DEMO') {
      alert('⚠️ La plantilla DEMO es la plantilla principal y no se puede eliminar. Solo puedes duplicarla.')
      return
    }
    
    if (confirm('¿Estás seguro de eliminar esta plantilla?')) {
      const plantillasActualizadas = asegurarPlantillaDEMO(plantillas.filter((_, i) => i !== index))
      setPlantillas(plantillasActualizadas)
      localStorage.setItem('cotizacion_plantillas', JSON.stringify(plantillasActualizadas))
      
      // Si se elimina la plantilla activa, limpiar la referencia
      if (plantillaActual === plantillaAEliminar.nombre) {
        setPlantillaActual(null)
        try {
          localStorage.removeItem('cotizacion_plantilla_activa')
        } catch (e) {
          console.error('Error al limpiar plantilla activa:', e)
        }
      }
    }
  }

  // Editar nombre de plantilla
  const editarNombrePlantilla = (index) => {
    const plantillaAEditar = plantillas[index]
    
    // Proteger la plantilla DEMO
    if (plantillaAEditar.nombre === 'DEMO') {
      alert('⚠️ La plantilla DEMO es la plantilla principal y no se puede renombrar. Solo puedes duplicarla.')
      return
    }
    
    const nuevoNombre = prompt('Ingresa el nuevo nombre para la plantilla:', plantillaAEditar.nombre)
    
    if (!nuevoNombre) return // Si cancela o no ingresa nombre, no hacer nada
    
    // Verificar si ya existe una plantilla con ese nombre (excepto la actual)
    if (plantillas.some((p, i) => p.nombre === nuevoNombre && i !== index)) {
      alert('⚠️ Ya existe una plantilla con ese nombre. Por favor elige otro nombre.')
      return
    }
    
    // Actualizar el nombre
    const plantillasActualizadas = plantillas.map((p, i) => {
      if (i === index) {
        return { ...p, nombre: nuevoNombre }
      }
      return p
    })
    
    const plantillasConDEMO = asegurarPlantillaDEMO(plantillasActualizadas)
    setPlantillas(plantillasConDEMO)
    localStorage.setItem('cotizacion_plantillas', JSON.stringify(plantillasConDEMO))
    
    // Si estamos editando la plantilla activa, actualizar su referencia
    if (plantillaActual === plantillaAEditar.nombre) {
      setPlantillaActual(nuevoNombre)
      try {
        localStorage.setItem('cotizacion_plantilla_activa', nuevoNombre)
      } catch (e) {
        console.error('Error al actualizar plantilla activa:', e)
      }
    }
    
    alert(`✅ Nombre actualizado a "${nuevoNombre}"`)
  }

  // Duplicar plantilla
  const duplicarPlantilla = (index) => {
    const plantillaADuplicar = plantillas[index]
    
    // Generar nombre automático para la copia
    let nombreCopia = `${plantillaADuplicar.nombre} - Copia`
    let contador = 1
    
    // Si ya existe una plantilla con ese nombre, agregar número
    while (plantillas.some(p => p.nombre === nombreCopia)) {
      contador++
      nombreCopia = `${plantillaADuplicar.nombre} - Copia ${contador}`
    }
    
    // Crear la copia con todos los elementos
    const plantillaDuplicada = {
      nombre: nombreCopia,
      elementos: JSON.parse(JSON.stringify(plantillaADuplicar.elementos)), // Copia profunda
      margen: plantillaADuplicar.margen || 15,
      colorPrimario: plantillaADuplicar.colorPrimario || '#2563eb',
      colorSecundario: plantillaADuplicar.colorSecundario || '#6b7280'
    }
    
    // Guardar la plantilla duplicada y asegurar que DEMO esté presente
    const plantillasActualizadas = asegurarPlantillaDEMO([...plantillas, plantillaDuplicada])
    setPlantillas(plantillasActualizadas)
    localStorage.setItem('cotizacion_plantillas', JSON.stringify(plantillasActualizadas))
    
    alert(`✅ Plantilla duplicada como "${nombreCopia}"`)
  }
  
  // Escala base para mostrar el canvas (A4: 210x297mm)
  // Escala tamaño real: 1mm = 3.7795275590551px (96 DPI estándar)
  const escalaBase = 3.7795275590551 // Tamaño real A4: 210mm × 297mm = 794px × 1123px
  
  // Calcular zoom máximo disponible basado en el tamaño del contenedor (solo para referencia)
  const [zoomMaximoDisponible, setZoomMaximoDisponible] = useState(100)
  
  useEffect(() => {
    const calcularZoomMaximo = () => {
      if (!canvasContainerRef.current) return
      
      const container = canvasContainerRef.current
      const containerWidth = container.clientWidth - 48 // Padding 24px cada lado
      const containerHeight = container.clientHeight - 48 // Padding 24px cada lado
      
      // Dimensiones base de A4 en mm
      const anchoA4 = 210
      const altoA4 = 297
      
      // Calcular zoom máximo basado en el espacio disponible
      const zoomPorAncho = (containerWidth / (anchoA4 * escalaBase)) * 100
      const zoomPorAlto = (containerHeight / (altoA4 * escalaBase)) * 100
      
      // Usar el menor para asegurar que quepa completamente
      const zoomMax = Math.min(zoomPorAncho, zoomPorAlto, 300) // Máximo 300%
      const zoomMaximo = Math.max(25, Math.floor(zoomMax))
      setZoomMaximoDisponible(zoomMaximo)
    }
    
    // Calcular después de que el componente se monte
    const timeoutId = setTimeout(calcularZoomMaximo, 100)
    window.addEventListener('resize', calcularZoomMaximo)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', calcularZoomMaximo)
    }
  }, [])
  
  // NO ajustar zoom automáticamente - permitir hasta 100% sin restricciones
  
  const escala = escalaBase * (zoom / 100) // Aplicar zoom
  const anchoCanvas = 210 * escala
  const altoCanvas = 297 * escala
  
  // Funciones de zoom - permitir hasta 100% sin restricciones
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 100)) // Máximo 100%
  }
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 25)) // Mínimo 25%
  }
  
  const handleZoomReset = () => {
    // Resetear a 100%
    setZoom(100)
  }

  // Función para detectar si dos elementos se superponen
  const elementosSeSuperponen = (el1, el2) => {
    if (el1.id === el2.id) return false
    return !(
      el1.x + el1.width <= el2.x ||
      el2.x + el2.width <= el1.x ||
      el1.y + el1.height <= el2.y ||
      el2.y + el2.height <= el1.y
    )
  }

  // Función para encontrar una posición libre para un elemento
  const encontrarPosicionLibre = (elemento, otrosElementos) => {
    const margin = 5 // Margen mínimo entre elementos
    let mejorY = elemento.y
    
    // Si es un header, debe estar en y: 0
    if (elemento.tipo === 'header') {
      return { x: 0, y: 0 }
    }
    
    // Ordenar otros elementos por Y
    const elementosOrdenados = otrosElementos
      .filter(el => el.id !== elemento.id && el.visible)
      .sort((a, b) => a.y - b.y)
    
    // Buscar posición desde arriba
    let yActual = 50 // Empezar después del header
    for (const otroEl of elementosOrdenados) {
      const espacioDisponible = otroEl.y - yActual
      if (espacioDisponible >= elemento.height + margin) {
        return { x: elemento.x, y: yActual }
      }
      yActual = Math.max(yActual, otroEl.y + otroEl.height + margin)
    }
    
    // Si no hay espacio, ponerlo al final
    if (yActual + elemento.height <= 297) {
      return { x: elemento.x, y: yActual }
    }
    
    // Si no cabe, mantener posición original pero ajustar
    return { x: elemento.x, y: Math.max(0, Math.min(297 - elemento.height, elemento.y)) }
  }

  const actualizarElemento = (id, propiedades) => {
    setConfig(prev => {
      const elementoActualizado = prev.elementos.find(el => el.id === id)
      if (!elementoActualizado) return prev
      
      const nuevoElemento = { ...elementoActualizado, ...propiedades }
      const otrosElementos = prev.elementos.filter(el => el.id !== id && el.visible)
      
      // Si se está moviendo, verificar superposiciones
      if (propiedades.x !== undefined || propiedades.y !== undefined) {
        const elementoSuperpuesto = otrosElementos.find(otro => 
          elementosSeSuperponen(nuevoElemento, otro)
        )
        
        // Si hay superposición y no es un header, ajustar posición para acercarse sin encimarse
        if (elementoSuperpuesto && nuevoElemento.tipo !== 'header') {
          // Calcular distancias desde cada lado
          const distanciaDerecha = elementoSuperpuesto.x + elementoSuperpuesto.width - nuevoElemento.x
          const distanciaIzquierda = nuevoElemento.x + nuevoElemento.width - elementoSuperpuesto.x
          const distanciaAbajo = elementoSuperpuesto.y + elementoSuperpuesto.height - nuevoElemento.y
          const distanciaArriba = nuevoElemento.y + nuevoElemento.height - elementoSuperpuesto.y
          
          // Encontrar la dirección más cercana
          const distancias = [
            { dir: 'derecha', dist: distanciaDerecha, x: elementoSuperpuesto.x + elementoSuperpuesto.width, y: nuevoElemento.y },
            { dir: 'izquierda', dist: distanciaIzquierda, x: elementoSuperpuesto.x - nuevoElemento.width, y: nuevoElemento.y },
            { dir: 'abajo', dist: distanciaAbajo, x: nuevoElemento.x, y: elementoSuperpuesto.y + elementoSuperpuesto.height },
            { dir: 'arriba', dist: distanciaArriba, x: nuevoElemento.x, y: elementoSuperpuesto.y - nuevoElemento.height }
          ]
          
          // Ordenar por distancia y tomar la más cercana válida
          distancias.sort((a, b) => Math.abs(a.dist) - Math.abs(b.dist))
          
          for (const opcion of distancias) {
            const nuevaX = Math.max(0, Math.min(210 - nuevoElemento.width, opcion.x))
            const nuevaY = Math.max(0, Math.min(297 - nuevoElemento.height, opcion.y))
            
            // Verificar que no se encime con otros elementos
            const elementoPrueba = { ...nuevoElemento, x: nuevaX, y: nuevaY }
            const otrosElementosRestantes = otrosElementos.filter(el => el.id !== elementoSuperpuesto.id)
            const haySuperposicion = otrosElementosRestantes.some(otro => elementosSeSuperponen(elementoPrueba, otro))
            
            if (!haySuperposicion) {
              nuevoElemento.x = nuevaX
              nuevoElemento.y = nuevaY
              break
            }
          }
        }
      }
      
      return {
        ...prev,
        elementos: prev.elementos.map(el => 
          el.id === id ? nuevoElemento : el
        )
      }
    })
  }

  // Función para reorganizar automáticamente todos los elementos
  const reorganizarElementos = () => {
    setConfig(prev => {
      const elementos = [...prev.elementos]

      // Orden estricto:
      // 1. Header (y=0)
      // 2. INFORMACIÓN DE LA COTIZACIÓN (y=42)
      // 3. DETALLE DE PRODUCTOS (y=78)
      // 4. Subtotal, Descuento General, Impuesto (y=185)
      // 5. TOTAL (y=210)
      // 6. Observaciones (y=225)
      
      const header = elementos.find(el => el.id === 'header')
      const titulo = elementos.find(el => el.id === 'titulo')
      const subtitulo = elementos.find(el => el.id === 'subtitulo')
      const info = elementos.find(el => el.id === 'info')
      const separador1 = elementos.find(el => el.id === 'separador1')
      const productos = elementos.find(el => el.id === 'productos')
      const totales = elementos.find(el => el.id === 'totales')
      const separador2 = elementos.find(el => el.id === 'separador2')
      const total = elementos.find(el => el.id === 'total')
      const observaciones = elementos.find(el => el.id === 'observaciones')
      const footer = elementos.find(el => el.id === 'footer')
      
      // 1. Header
      if (header) {
        header.x = 0
        header.y = 0
        header.width = 210
        header.height = 35
      }
      if (titulo) {
        titulo.x = 105
        titulo.y = 12
        titulo.width = 210
        titulo.height = 12
      }
      if (subtitulo) {
        subtitulo.x = 105
        subtitulo.y = 25
        subtitulo.width = 210
        subtitulo.height = 8
      }
      
      // 2. INFORMACIÓN DE LA COTIZACIÓN
      if (info) {
        info.x = 20
        info.y = 42
        info.width = 170
        info.height = 30
        info.align = 'left'
      }
      
      // Separador después de información
      if (separador1) {
        separador1.x = 20
        separador1.y = 75
        separador1.width = 170
        separador1.height = 1
      }
      
      // 3. DETALLE DE PRODUCTOS
      if (productos) {
        productos.x = 20
        productos.y = 78
        productos.width = 170
        productos.height = 100
      }
      
      // 4. Subtotal, Descuento General, Impuesto (15.25%)
      // Asegurar que esté alineado con el margen derecho de la página respetando la regla
      if (totales) {
        const margen = prev.margen || 15
        // Alinear con el ancho de la tabla de productos (x=20, width=170, termina en 190mm)
        // Pero respetando el margen derecho: 210 - margen = 195mm
        // Para simetría: usar el mismo ancho que la tabla (170mm) desde x=20
        totales.x = margen // 15mm (margen izquierdo)
        totales.y = 185
        totales.width = 210 - (margen * 2) // 180mm (de margen a margen)
        totales.height = 20
        totales.align = 'right'
      }
      
      // Separador antes del TOTAL
      if (separador2) {
        separador2.x = 20
        separador2.y = 208
        separador2.width = 170
        separador2.height = 1
      }
      
      // 5. TOTAL
      if (total) {
        total.x = 20
        total.y = 210
        total.width = 170
        total.height = 8
        total.align = 'right'
        total.bold = true
        total.color = '#2563eb' // Azul como el header
      }
      
      // 6. Observaciones
      if (observaciones) {
        observaciones.x = 20
        observaciones.y = 225
        observaciones.width = 170
        observaciones.height = 20
        observaciones.align = 'left'
      }
      
      // Footer
      if (footer) {
        footer.x = 105
        footer.y = 285
        footer.width = 210
        footer.height = 8
        footer.align = 'center'
      }
      
      // Retornar elementos en el orden estricto
      return {
        ...prev,
        elementos: [
          header,
          titulo,
          subtitulo,
          info,
          separador1,
          productos,
          totales,
          separador2,
          total,
          observaciones,
          footer
        ].filter(el => el !== undefined)
      }
    })
  }

  const agregarElemento = (tipo) => {
    const nuevoId = `elemento_${Date.now()}`

    // Calcular posición inicial que no se superponga
    const elementosExistentes = config.elementos.filter(el => el.visible)
    let nuevaY = tipo === 'header' ? 0 : 35
    if (elementosExistentes.length > 0 && tipo !== 'header') {
      // Encontrar la posición Y más baja
      const maxY = Math.max(...elementosExistentes.map(el => el.y + el.height))
      nuevaY = maxY + 5 // 5mm de espacio (reducido)
      // Si se sale de la página, empezar desde arriba después del header
      if (nuevaY > 250) nuevaY = 35
    }

    const nuevoElemento = {
      id: nuevoId,
      tipo,
      x: tipo === 'header' ? 0 : tipo === 'totales' ? 105 : 20,
      y: nuevaY,
      width: tipo === 'texto' ? 170 : tipo === 'header' ? 210 : tipo === 'totales' ? 100 : 170,
      height: tipo === 'texto' ? 20 : tipo === 'header' ? 35 : tipo === 'totales' ? 40 : 100,
      fontSize: tipo === 'header' ? 18 : tipo === 'tabla' ? 9 : tipo === 'totales' ? 10 : 11,
      color: tipo === 'header' ? config.colorPrimario : '#000000',
      colorTotal: tipo === 'totales' ? '#0284c7' : undefined, // Color específico para el TOTAL
      lineas: tipo === 'totales' ? [
        { label: 'Subtotal:', color: '#000000' },
        { label: 'Descuento General:', color: '#000000' },
        { label: 'Impuesto (15.25%):', color: '#000000' },
        { label: 'TOTAL:', color: '#0284c7' }
      ] : undefined,
      texto: tipo === 'texto' ? 'Nuevo texto' : tipo === 'header' ? 'Nuevo Encabezado' : '',
      align: tipo === 'header' || tipo === 'totales' ? 'center' : 'left',
      bold: tipo === 'header' ? true : false,
      visible: true,
      locked: tipo === 'tabla' || tipo === 'totales', // Tabla y Totales no son editables
      // Para tablas, agregar headers con estructura de objeto
      headers: tipo === 'tabla' ? [
        { texto: 'Producto', color: '#000000' },
        { texto: 'Cant.', color: '#000000' },
        { texto: 'Pres.', color: '#000000' },
        { texto: 'P. Unit.', color: '#000000' },
        { texto: 'Desc.', color: '#000000' },
        { texto: 'Total', color: '#000000' }
      ] : undefined,
      // Para tablas, agregar título editable
      tituloTabla: tipo === 'tabla' ? 'DETALLE DE PRODUCTOS' : undefined,
      colorTituloTabla: tipo === 'tabla' ? '#000000' : undefined
    }
    setConfig(prev => ({
      ...prev,
      elementos: [...prev.elementos, nuevoElemento]
    }))
    setElementoSeleccionado(nuevoId)
  }

  const eliminarElemento = (id) => {
    setConfig(prev => ({
      ...prev,
      elementos: prev.elementos.filter(el => el.id !== id)
    }))
    if (elementoSeleccionado === id) {
      setElementoSeleccionado(null)
    }
  }

  const handleMouseDown = (e, elemento) => {
    if (elemento.locked) return
    // Las tablas no se pueden arrastrar
    if (elemento.tipo === 'tabla') return
    e.stopPropagation()
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / escala
    const y = (e.clientY - rect.top) / escala
    setElementoSeleccionado(elemento.id)
    setOffsetArrastre({
      x: x - elemento.x,
      y: y - elemento.y
    })
    setArrastrando(true)
  }
  
  // Función para calcular el tamaño mínimo necesario para el texto
  const calcularTamanoMinimoTexto = (elemento) => {
    if (elemento.tipo !== 'texto' || !elemento.texto) {
      return { minWidth: 10, minHeight: 5 }
    }
    
    const texto = elemento.texto || ''
    if (!texto.trim()) {
      return { minWidth: 10, minHeight: 5 }
    }
    
    const lines = texto.split('\n').map(line => line || ' ')
    const numLines = lines.length || 1
    const fontSize = elemento.fontSize || 11
    const fontWeight = elemento.bold ? 'bold' : 'normal'
    
    // Usar un elemento temporal para medir el texto real
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.visibility = 'hidden'
    tempDiv.style.whiteSpace = 'pre'
    tempDiv.style.fontFamily = 'helvetica, Arial, sans-serif'
    // fontSize está en mm, convertir a px para CSS: 1mm ≈ 3.7795px a 96 DPI
    const fontSizePx = fontSize * 3.7795
    tempDiv.style.fontSize = `${fontSizePx}px`
    tempDiv.style.fontWeight = fontWeight
    tempDiv.style.padding = '0'
    tempDiv.style.margin = '0'
    tempDiv.style.border = 'none'
    tempDiv.style.lineHeight = '1'
    document.body.appendChild(tempDiv)
    
    // Calcular ancho máximo de todas las líneas
    let maxWidthPx = 0
    lines.forEach(line => {
      tempDiv.textContent = line
      const width = tempDiv.offsetWidth
      maxWidthPx = Math.max(maxWidthPx, width)
    })
    
    // Calcular alto total con lineHeight
    tempDiv.style.whiteSpace = 'pre-line'
    tempDiv.style.lineHeight = '1.3'
    tempDiv.textContent = texto
    const heightPx = tempDiv.offsetHeight
    
    // Limpiar
    document.body.removeChild(tempDiv)
    
    // Convertir px a mm: 1px = 0.264583mm a 96 DPI, pero mejor usar la escala inversa
    // Si fontSize está en mm y lo convertimos a px con * 3.7795, entonces
    // para convertir de vuelta: px / 3.7795 = mm
    const maxWidthMm = maxWidthPx / 3.7795
    const heightMm = heightPx / 3.7795
    
    // Padding: 4mm por lado (según padding: 4 * escala px, donde escala ≈ 3.7795 px/mm)
    const paddingHorizontal = 8 // 4mm * 2
    const paddingVertical = 8 // 4mm * 2
    
    const minWidth = Math.max(10, maxWidthMm + paddingHorizontal)
    const minHeight = Math.max(5, heightMm + paddingVertical)
    
    return { minWidth, minHeight }
  }

  const handleResizeMouseDown = (e, elemento, handle) => {
    e.stopPropagation()
    e.preventDefault()
    setElementoSeleccionado(elemento.id)
    setRedimensionando(handle)
    setInicioRedimensionamiento({
      x: elemento.x,
      y: elemento.y,
      width: elemento.width,
      height: elemento.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    })
  }

  // Refs para throttling y optimización
  const rafIdRef = useRef(null)
  const lastUpdateRef = useRef({ x: null, y: null, width: null, height: null })
  
  const handleMouseMove = (e) => {
    // Cancelar frame anterior si existe
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }
    
    // Usar requestAnimationFrame para throttling (sincronizado con el refresh rate)
    rafIdRef.current = requestAnimationFrame(() => {
      if (redimensionando && elementoSeleccionado) {
        // Modo redimensionamiento
        const elemento = config.elementos.find(el => el.id === elementoSeleccionado)
        if (!elemento || elemento.locked) return
        
        const deltaX = (e.clientX - inicioRedimensionamiento.mouseX) / escala
        const deltaY = (e.clientY - inicioRedimensionamiento.mouseY) / escala
        
        let nuevaX = inicioRedimensionamiento.x
        let nuevaY = inicioRedimensionamiento.y
        let nuevoWidth = inicioRedimensionamiento.width
        let nuevoHeight = inicioRedimensionamiento.height
        
        // Calcular tamaño mínimo basado en el contenido del texto
        const tamanoMinimo = calcularTamanoMinimoTexto(elemento)
        const minWidth = tamanoMinimo.minWidth
        const minHeight = tamanoMinimo.minHeight
        
        // Redimensionar según el handle, respetando el tamaño mínimo del texto
        if (redimensionando.includes('e')) { // Este (derecha)
          const nuevoWidthCalculado = inicioRedimensionamiento.width + deltaX
          nuevoWidth = Math.max(minWidth, nuevoWidthCalculado)
        }
        if (redimensionando.includes('w')) { // Oeste (izquierda)
          const nuevoWidthCalculado = inicioRedimensionamiento.width - deltaX
          if (nuevoWidthCalculado >= minWidth) {
            nuevoWidth = nuevoWidthCalculado
            nuevaX = inicioRedimensionamiento.x + deltaX
          } else {
            nuevoWidth = minWidth
            nuevaX = inicioRedimensionamiento.x + (inicioRedimensionamiento.width - minWidth)
          }
        }
        if (redimensionando.includes('s')) { // Sur (abajo)
          const nuevoHeightCalculado = inicioRedimensionamiento.height + deltaY
          nuevoHeight = Math.max(minHeight, nuevoHeightCalculado)
        }
        if (redimensionando.includes('n')) { // Norte (arriba)
          const nuevoHeightCalculado = inicioRedimensionamiento.height - deltaY
          if (nuevoHeightCalculado >= minHeight) {
            nuevoHeight = nuevoHeightCalculado
            nuevaY = inicioRedimensionamiento.y + deltaY
          } else {
            nuevoHeight = minHeight
            nuevaY = inicioRedimensionamiento.y + (inicioRedimensionamiento.height - minHeight)
          }
        }
        
        nuevoWidth = Math.max(minWidth, nuevoWidth)
        nuevoHeight = Math.max(minHeight, nuevoHeight)
        
        const margen = config.margen || 15
        if (nuevaX + nuevoWidth > 210 - margen) {
          nuevoWidth = 210 - margen - nuevaX
        }
        if (nuevaY + nuevoHeight > 297 - margen) {
          nuevoHeight = 297 - margen - nuevaY
        }
        if (nuevaX < margen) {
          nuevoWidth = nuevoWidth - (margen - nuevaX)
          nuevaX = margen
        }
        if (nuevaY < margen) {
          nuevoHeight = nuevoHeight - (margen - nuevaY)
          nuevaY = margen
        }
        
        if (elemento.tipo === 'header') {
          nuevaX = 0
          nuevoWidth = 210
        }
        
        if (elemento.tipo === 'tabla') {
          return
        }
        
        // Solo actualizar si hay cambios significativos (umbral de 0.5mm)
        const lastUpdate = lastUpdateRef.current
        const hayCambio = Math.abs(lastUpdate.x - nuevaX) > 0.5 || 
                         Math.abs(lastUpdate.y - nuevaY) > 0.5 ||
                         Math.abs(lastUpdate.width - nuevoWidth) > 0.5 ||
                         Math.abs(lastUpdate.height - nuevoHeight) > 0.5
        
        if (hayCambio) {
          lastUpdateRef.current = { x: nuevaX, y: nuevaY, width: nuevoWidth, height: nuevoHeight }
          actualizarElemento(elementoSeleccionado, { x: nuevaX, y: nuevaY, width: nuevoWidth, height: nuevoHeight })
        }
      } else if (arrastrando && elementoSeleccionado) {
        // Modo arrastre
        const elemento = config.elementos.find(el => el.id === elementoSeleccionado)
        if (!elemento || elemento.locked) return
        
        if (elemento.tipo === 'tabla') {
          return
        }
        
        const rect = canvasRef.current.getBoundingClientRect()
        let x = (e.clientX - rect.left) / escala - offsetArrastre.x
        let y = (e.clientY - rect.top) / escala - offsetArrastre.y
        
        if (elemento.tipo === 'header') {
          x = 0
          y = 0
        } else {
          const margen = config.margen || 15
          const maxX = 210 - elemento.width
          const maxY = 297 - elemento.height
          x = Math.max(margen, Math.min(maxX - margen, x))
          y = Math.max(margen, Math.min(maxY - margen, y))
        }

        // Solo actualizar si hay cambios significativos (umbral de 0.5mm)
        const lastUpdate = lastUpdateRef.current
        const hayCambio = Math.abs(lastUpdate.x - x) > 0.5 || Math.abs(lastUpdate.y - y) > 0.5
        
        if (hayCambio) {
          lastUpdateRef.current = { x, y, width: elemento.width, height: elemento.height }
          actualizarElemento(elementoSeleccionado, { x, y })
        }
      }
    })
  }

  const handleMouseUp = () => {
    // Cancelar cualquier frame pendiente
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    // Resetear último update
    lastUpdateRef.current = { x: null, y: null, width: null, height: null }
    setArrastrando(false)
    setRedimensionando(null)
  }

  useEffect(() => {
    if (arrastrando || redimensionando) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [arrastrando, redimensionando, elementoSeleccionado, offsetArrastre, inicioRedimensionamiento])


  // Memoizar elementoActual para evitar buscar en cada render
  const elementoActual = useMemo(() => {
    return config.elementos.find(el => el.id === elementoSeleccionado)
  }, [config.elementos, elementoSeleccionado])

  // Reorganizar automáticamente al cargar si hay superposiciones
  useEffect(() => {
    if (!reorganizadoInicialmente && config.elementos && config.elementos.length > 0) {
      // Verificar si hay superposiciones
      let haySuperposiciones = false
      for (let i = 0; i < config.elementos.length; i++) {
        for (let j = i + 1; j < config.elementos.length; j++) {
          const el1 = config.elementos[i]
          const el2 = config.elementos[j]
          if (el1.visible && el2.visible && elementosSeSuperponen(el1, el2)) {
            haySuperposiciones = true
            break
          }
        }
        if (haySuperposiciones) break
      }
      
      if (haySuperposiciones) {
        // Reorganizar automáticamente
        setTimeout(() => {
          reorganizarElementos()
          setReorganizadoInicialmente(true)
        }, 100)
      } else {
        setReorganizadoInicialmente(true)
      }
    }
  }, [reorganizadoInicialmente]) // Solo ejecutar una vez al montar

  // Función para mostrar texto como plantilla (sin reemplazar variables)
  const mostrarTextoPlantilla = (texto) => {
    if (!texto) return ''
    // Mantener las variables como están, pero hacerlas más visibles
    return texto
      .replace(/{cliente}/g, '____________')
      .replace(/{fecha}/g, '__/__/____')
      .replace(/{fechaVencimiento}/g, '__/__/____')
      .replace(/{vendedor}/g, '____________')
      .replace(/{estado}/g, '____________')
      .replace(/{subtotal}/g, 'S/ ______')
      .replace(/{descuento}/g, 'S/ ______')
      .replace(/{impuesto}/g, 'S/ ______')
      .replace(/{total}/g, 'S/ ______')
      .replace(/{observaciones}/g, '________________________________________________')
  }

  // Función para convertir hex a RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0]
  }

  const handleSave = () => {
    // Si hay una plantilla activa, actualizarla
    if (plantillaActual) {
      const plantillasActualizadas = plantillas.map(p => {
        if (p.nombre === plantillaActual) {
          return {
            ...p,
            elementos: JSON.parse(JSON.stringify(config.elementos)),
            margen: config.margen,
            colorPrimario: config.colorPrimario,
            colorSecundario: config.colorSecundario
          }
        }
        return p
      })
      const plantillasConDEMO = asegurarPlantillaDEMO(plantillasActualizadas)
      setPlantillas(plantillasConDEMO)
      localStorage.setItem('cotizacion_plantillas', JSON.stringify(plantillasConDEMO))
      alert(`✅ Plantilla "${plantillaActual}" actualizada exitosamente!`)
    }
    onSave(config)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-0 sm:p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full h-full sm:w-[95vw] sm:h-[95vh] sm:max-w-[95vw] sm:max-h-[95vh] flex flex-col editor-pdf-modal" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
        {/* Header - Responsive */}
        <div className="px-3 sm:px-6 py-2 sm:py-4 border-b flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex flex-col">
            <h2 className="text-base sm:text-2xl font-bold truncate" style={{ color: 'var(--color-text)', fontWeight: 700 }}>
              Editor Visual de Presentación PDF
            </h2>
            {plantillaActual && (
              <span className="text-xs sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Editando plantilla: <strong style={{ color: 'var(--color-primary-600)' }}>{plantillaActual}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
            {/* Controles de Zoom - Compacto en móvil */}
            <div className="flex items-center gap-1 border rounded-lg px-1 sm:px-2 py-1" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-gray-100 rounded transition-colors editor-zoom-btn"
                title="Alejar (Zoom Out)"
                disabled={zoom <= 25}
                style={{ backgroundColor: '#ffffff', color: '#000000' }}
              >
                <ZoomOut size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color: '#000000', stroke: '#000000' }} />
              </button>
              <span className="px-1 sm:px-2 text-xs sm:text-sm font-medium min-w-[40px] sm:min-w-[50px] text-center" style={{ color: 'var(--color-text)', fontWeight: 600 }}>
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-gray-100 rounded transition-colors editor-zoom-btn"
                title="Acercar (Zoom In)"
                disabled={zoom >= 100}
                style={{ backgroundColor: '#ffffff', color: '#000000' }}
              >
                <ZoomIn size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color: '#000000', stroke: '#000000' }} />
              </button>
              <button
                onClick={handleZoomReset}
                className="px-1 sm:px-2 py-1 text-[10px] sm:text-xs hover:bg-gray-100 rounded transition-colors editor-zoom-btn"
                title="Resetear zoom a 100%"
                style={{ backgroundColor: '#ffffff', color: '#000000' }}
              >
                Reset
              </button>
            </div>
            {/* Botones - Solo iconos en móvil */}
            <button
              onClick={() => setMostrarRegla(!mostrarRegla)}
              className={`p-2 sm:px-4 sm:py-2 rounded-lg transition-colors font-medium flex items-center gap-1 sm:gap-2 ${
                mostrarRegla 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={mostrarRegla ? "Ocultar regla" : "Mostrar regla"}
            >
              <Ruler size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Regla</span>
            </button>
            <button
              onClick={() => setMostrarPlantillas(true)}
              className="p-2 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-1 sm:gap-2 editor-plantillas-btn"
              title="Gestionar plantillas"
              style={{ backgroundColor: '#9333ea', color: '#ffffff' }}
            >
              <FileText size={16} className="sm:w-[18px] sm:h-[18px]" style={{ color: '#ffffff', stroke: '#ffffff' }} />
              <span className="hidden sm:inline" style={{ color: '#ffffff' }}>Plantillas</span>
            </button>
            <button
              onClick={() => setMostrarVistaPrevia(!mostrarVistaPrevia)}
              className="p-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1 sm:gap-2"
              title="Vista Previa"
            >
              <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">{mostrarVistaPrevia ? 'Ocultar' : 'Vista'} Previa</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-gray-100 editor-close-btn"
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
            >
              <X size={20} className="sm:w-6 sm:h-6" style={{ color: '#000000', stroke: '#000000' }} />
            </button>
          </div>
        </div>

        {/* Contenido Principal - Responsive */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Panel Izquierdo - Herramientas (horizontal en móvil, vertical en desktop) */}
          <div className="w-full sm:w-48 md:w-64 border-b sm:border-b-0 sm:border-r p-2 sm:p-4 overflow-x-auto sm:overflow-y-auto flex-shrink-0" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <h3 className="font-semibold mb-2 sm:mb-4 text-sm sm:text-base" style={{ color: 'var(--color-text)' }}>Herramientas</h3>
            <div className="flex sm:flex-col gap-2 sm:space-y-2 sm:gap-0 mb-2 sm:mb-4">
              <button
                onClick={() => agregarElemento('texto')}
                className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors text-sm sm:text-base sm:w-full"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Type size={18} className="sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Agregar Texto</span>
              </button>
              <button
                onClick={() => agregarElemento('header')}
                className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors text-sm sm:text-base sm:w-full"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Layout size={18} className="sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Agregar Encabezado</span>
              </button>
              <button
                onClick={() => agregarElemento('tabla')}
                className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors text-sm sm:text-base sm:w-full"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Table size={18} className="sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Agregar Tabla</span>
              </button>
              <button
                onClick={() => agregarElemento('totales')}
                className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors text-sm sm:text-base sm:w-full"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <DollarSign size={18} className="sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Agregar Totales</span>
              </button>
              {/* Botón Reorganizar - inline en móvil */}
              <button
                onClick={reorganizarElementos}
                className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium text-sm sm:text-base sm:w-full"
                title="Reorganizar automáticamente todos los elementos para evitar superposiciones"
              >
                <Move size={18} className="sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Reorganizar Elementos</span>
              </button>
            </div>
            
            {/* Lista de Elementos - Oculta en móvil, visible en desktop */}
            <div className="hidden sm:block mt-4 sm:mt-6">
              <h4 className="font-semibold mb-2 text-sm sm:text-base" style={{ color: 'var(--color-text)' }}>Elementos</h4>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {config.elementos.map((el) => (
                  <div
                    key={el.id}
                    onClick={() => setElementoSeleccionado(el.id)}
                    className={`p-2 rounded cursor-pointer flex items-center justify-between ${
                      elementoSeleccionado === el.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs sm:text-sm truncate" style={{ color: 'var(--color-text)' }}>
                      {el.tipo} - {el.id}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        eliminarElemento(el.id)
                      }}
                      className="p-1 hover:bg-red-100 rounded flex-shrink-0"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas Central - Responsive */}
          <div 
            ref={canvasContainerRef}
            className="flex-1 flex items-start sm:items-center justify-center p-2 sm:p-6 overflow-auto" 
            style={{ 
              backgroundColor: '#f5f5f5'
            }}
          >
            <div className="relative" style={{ paddingTop: '25px', maxWidth: '100%', overflow: 'auto' }}>
              {/* Información de dimensiones */}
              <div className="absolute -top-5 sm:-top-6 left-0 text-xs sm:text-sm text-gray-700 font-medium bg-white px-2 sm:px-3 py-0.5 sm:py-1 rounded shadow-sm">
                A4: 210×297mm ({zoom}%)
              </div>
              <div
                ref={canvasRef}
                className="relative bg-white shadow-xl border-2 border-gray-400 canvas-documento"
                style={{
                  width: `${anchoCanvas}px`,
                  height: `${altoCanvas}px`,
                  cursor: arrastrando ? 'grabbing' : 'default',
                  minWidth: `${anchoCanvas}px`,
                  minHeight: `${altoCanvas}px`,
                  backgroundColor: '#ffffff'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={(e) => {
                  // Si se hace clic directamente en el canvas (no en un elemento), deseleccionar
                  // Solo deseleccionar si no se está arrastrando ni redimensionando
                  if (!arrastrando && !redimensionando) {
                    const target = e.target
                    // Verificar si el clic fue en el canvas o en un área vacía
                    if (target === canvasRef.current || 
                        (target.classList && target.classList.contains('relative') && !target.closest('[data-elemento-id]'))) {
                      setElementoSeleccionado(null)
                    }
                  }
                }}
              >
                {/* Regla con marcas de margen */}
                {mostrarRegla && config.margen > 0 && (
                  <>
                    {/* Regla horizontal (arriba) - fuera del canvas */}
                    <div 
                      className="absolute bg-gray-100 border-b border-gray-400 pointer-events-none z-50"
                      style={{
                        left: `-${30 * escala}px`,
                        top: `-${30 * escala}px`,
                        width: `${anchoCanvas + 30 * escala}px`,
                        height: `${30 * escala}px`,
                        fontSize: `${8 * escala}px`
                      }}
                    >
                      {/* Marcas de milímetros en la regla horizontal */}
                      {Array.from({ length: Math.floor(210 / 10) + 1 }, (_, i) => {
                        const mm = i * 10
                        const x = mm * escala
                        const esMargen = mm === config.margen || mm === (210 - config.margen)
                        return (
                          <div
                            key={`h-${mm}`}
                            className="absolute"
                            style={{
                              left: `${x}px`,
                              top: '0',
                              width: '1px',
                              height: `${esMargen ? 30 * escala : 15 * escala}px`,
                              backgroundColor: esMargen ? '#ef4444' : '#666',
                              zIndex: 51
                            }}
                          >
                            {mm % 50 === 0 && (
                              <span 
                                className="absolute -top-4 left-0 text-xs font-medium"
                                style={{ 
                                  color: '#333',
                                  transform: 'translateX(-50%)',
                                  fontSize: `${7 * escala}px`
                                }}
                              >
                                {mm}
                              </span>
                            )}
                          </div>
                        )
                      })}
                      {/* Línea de margen izquierdo */}
                      <div
                        className="absolute top-0"
                        style={{
                          left: `${config.margen * escala}px`,
                          width: '2px',
                          height: `${30 * escala}px`,
                          backgroundColor: '#ef4444',
                          zIndex: 52
                        }}
                      />
                      {/* Línea de margen derecho */}
                      <div
                        className="absolute top-0"
                        style={{
                          left: `${(210 - config.margen) * escala}px`,
                          width: '2px',
                          height: `${30 * escala}px`,
                          backgroundColor: '#ef4444',
                          zIndex: 52
                        }}
                      />
                    </div>
                    
                    {/* Regla vertical (izquierda) - fuera del canvas */}
                    <div 
                      className="absolute bg-gray-100 border-r border-gray-400 pointer-events-none z-50"
                      style={{
                        left: `-${30 * escala}px`,
                        top: `-${30 * escala}px`,
                        width: `${30 * escala}px`,
                        height: `${altoCanvas + 30 * escala}px`,
                        fontSize: `${8 * escala}px`
                      }}
                    >
                      {/* Marcas de milímetros en la regla vertical */}
                      {Array.from({ length: Math.floor(297 / 10) + 1 }, (_, i) => {
                        const mm = i * 10
                        const y = mm * escala
                        const esMargen = mm === config.margen || mm === (297 - config.margen)
                        return (
                          <div
                            key={`v-${mm}`}
                            className="absolute"
                            style={{
                              top: `${y}px`,
                              left: '0',
                              height: '1px',
                              width: `${esMargen ? 30 * escala : 15 * escala}px`,
                              backgroundColor: esMargen ? '#ef4444' : '#666',
                              zIndex: 51
                            }}
                          >
                            {mm % 50 === 0 && (
                              <span 
                                className="absolute -left-6 top-0 text-xs font-medium"
                                style={{ 
                                  color: '#333',
                                  transform: 'rotate(-90deg)',
                                  transformOrigin: 'center',
                                  fontSize: `${7 * escala}px`
                                }}
                              >
                                {mm}
                              </span>
                            )}
                          </div>
                        )
                      })}
                      {/* Línea de margen superior */}
                      <div
                        className="absolute left-0"
                        style={{
                          top: `${config.margen * escala}px`,
                          height: '2px',
                          width: `${30 * escala}px`,
                          backgroundColor: '#ef4444',
                          zIndex: 52
                        }}
                      />
                      {/* Línea de margen inferior */}
                      <div
                        className="absolute left-0"
                        style={{
                          top: `${(297 - config.margen) * escala}px`,
                          height: '2px',
                          width: `${30 * escala}px`,
                          backgroundColor: '#ef4444',
                          zIndex: 52
                        }}
                      />
                    </div>
                    
                    {/* Líneas de guía de márgenes en el contenido */}
                    <div 
                      className="absolute border-2 border-red-400 border-dashed pointer-events-none"
                      style={{
                        left: `${config.margen * escala}px`,
                        top: `${config.margen * escala}px`,
                        width: `${(210 - config.margen * 2) * escala}px`,
                        height: `${(297 - config.margen * 2) * escala}px`,
                        zIndex: 10
                      }}
                    />
                  </>
                )}

                {/* Renderizar elementos - ordenados por tipo para z-index correcto */}
                {(() => {
                  // Pre-calcular elementos comunes una sola vez para evitar múltiples .find()
                  const header = config.elementos.find(e => e.id === 'header' && e.visible)
                  const tituloEl = config.elementos.find(e => e.id === 'titulo')
                  const subtituloEl = config.elementos.find(e => e.id === 'subtitulo' && e.visible)
                  
                  const elementosFiltrados = useMemo(() => {
                    return config.elementos
                      .filter(el => {
                        // Ocultar título y subtítulo si están dentro del área del header
                        if ((el.id === 'titulo' || el.id === 'subtitulo') && el.visible && header) {
                          return false
                        }
                        return el.visible
                      })
                      .sort((a, b) => {
                        // Headers primero (z-index más bajo), luego otros elementos
                        if (a.tipo === 'header' && b.tipo !== 'header') return -1
                        if (a.tipo !== 'header' && b.tipo === 'header') return 1
                        // Dentro del mismo tipo, ordenar por Y
                        return a.y - b.y
                      })
                  }, [config.elementos, header])
                  
                  return elementosFiltrados.map((elemento, index) => {
                  const estaSeleccionado = elementoSeleccionado === elemento.id
                  // z-index: headers más bajo, elementos seleccionados más alto
                  const zIndex = elemento.tipo === 'header' ? 1 : estaSeleccionado ? 100 : 10 + index
                  
                  return (
                    <div
                      key={elemento.id}
                      data-elemento-id={elemento.id}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, elemento)
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!arrastrando && !redimensionando) {
                          setElementoSeleccionado(elemento.id)
                        }
                      }}
                      className={`absolute transition-all ${
                        estaSeleccionado ? 'shadow-lg' : 'hover:shadow-md'
                      } ${elemento.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-move'}`}
                      style={{
                        left: `${elemento.x * escala}px`,
                        top: `${elemento.y * escala}px`,
                        width: `${elemento.width * escala}px`,
                        height: `${elemento.height * escala}px`,
                        backgroundColor: elemento.tipo === 'header' ? elemento.color : estaSeleccionado ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                        color: elemento.tipo === 'header' ? '#ffffff' : elemento.color,
                        fontSize: `${elemento.fontSize * escala}px`,
                        fontWeight: elemento.bold === true ? 'bold' : (elemento.bold === false ? 'normal' : 'normal'),
                        textAlign: elemento.align || 'left',
                        padding: elemento.tipo === 'tabla' ? `${3 * escala}px` : `${4 * escala}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: elemento.align === 'center' ? 'center' : elemento.align === 'right' ? 'flex-end' : 'flex-start',
                        justifyContent: elemento.align === 'center' ? 'center' : 'flex-start',
                        overflow: 'hidden',
                        wordWrap: 'break-word',
                        zIndex: zIndex,
                        boxSizing: 'border-box',
                        border: estaSeleccionado ? '2px solid #3b82f6' : elemento.tipo === 'tabla' ? '1px solid #d1d5db' : 'none',
                        fontFamily: 'helvetica, Arial, sans-serif'
                      }}
                    >
                      {/* Handles de redimensionamiento (solo si está seleccionado, no es header ni tabla) */}
                      {estaSeleccionado && elemento.tipo !== 'header' && elemento.tipo !== 'tabla' && !elemento.locked && (
                        <>
                          {/* Esquinas */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, elemento, 'nw')}
                            className="absolute bg-blue-600 border-2 border-white rounded-full cursor-nw-resize"
                            style={{
                              left: '-6px',
                              top: '-6px',
                              width: '12px',
                              height: '12px',
                              zIndex: 101
                            }}
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, elemento, 'ne')}
                            className="absolute bg-blue-600 border-2 border-white rounded-full cursor-ne-resize"
                            style={{
                              right: '-6px',
                              top: '-6px',
                              width: '12px',
                              height: '12px',
                              zIndex: 101
                            }}
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, elemento, 'sw')}
                            className="absolute bg-blue-600 border-2 border-white rounded-full cursor-sw-resize"
                            style={{
                              left: '-6px',
                              bottom: '-6px',
                              width: '12px',
                              height: '12px',
                              zIndex: 101
                            }}
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, elemento, 'se')}
                            className="absolute bg-blue-600 border-2 border-white rounded-full cursor-se-resize"
                            style={{
                              right: '-6px',
                              bottom: '-6px',
                              width: '12px',
                              height: '12px',
                              zIndex: 101
                            }}
                          />
                          {/* Bordes */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, elemento, 'n')}
                            className="absolute bg-blue-600 border-2 border-white rounded-full cursor-n-resize"
                            style={{
                              left: '50%',
                              top: '-6px',
                              transform: 'translateX(-50%)',
                              width: '12px',
                              height: '12px',
                              zIndex: 101
                            }}
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, elemento, 's')}
                            className="absolute bg-blue-600 border-2 border-white rounded-full cursor-s-resize"
                            style={{
                              left: '50%',
                              bottom: '-6px',
                              transform: 'translateX(-50%)',
                              width: '12px',
                              height: '12px',
                              zIndex: 101
                            }}
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, elemento, 'e')}
                            className="absolute bg-blue-600 border-2 border-white rounded-full cursor-e-resize"
                            style={{
                              right: '-6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '12px',
                              height: '12px',
                              zIndex: 101
                            }}
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, elemento, 'w')}
                            className="absolute bg-blue-600 border-2 border-white rounded-full cursor-w-resize"
                            style={{
                              left: '-6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '12px',
                              height: '12px',
                              zIndex: 101
                            }}
                          />
                        </>
                      )}
                      {elemento.tipo === 'texto' && (
                        <div 
                          className="w-full h-full whitespace-pre-line" 
                          style={{ 
                            fontSize: `${elemento.fontSize * escala}px`,
                            lineHeight: `${elemento.fontSize * escala * 1.3}px`,
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: elemento.bold ? 'bold' : 'normal'
                          }}
                        >
                          {elemento.texto ? elemento.texto.split('\n').map((line, i) => {
                            return (
                              <div 
                                key={i} 
                                style={{ 
                                  marginBottom: i < elemento.texto.split('\n').length - 1 ? `${elemento.fontSize * escala * 0.25}px` : '0',
                                  fontWeight: elemento.bold ? 'bold' : 'normal',
                                  fontSize: `${elemento.fontSize * escala}px`,
                                  fontFamily: 'helvetica, Arial, sans-serif'
                                }}
                              >
                                {line || ' '}
                              </div>
                            )
                          }) : 'Texto'}
                        </div>
                      )}
                      {elemento.tipo === 'header' && (() => {
                        // Usar valores pre-calculados en lugar de buscar repetidamente
                        const tituloTexto = tituloEl?.texto || 'COTIZACIÓN - NOTA DE VENTA'
                        const subtituloTexto = subtituloEl?.texto || 'Qubit - Sistema de Gestión'
                        
                        // Pre-calcular estilos para evitar recalcular en cada render
                        const paddingHeader = 6 * escala
                        const fontSizeTitulo = 18 * escala
                        const lineHeightTitulo = fontSizeTitulo * 1.2
                        const fontSizeSubtitulo = 10 * escala
                        const lineHeightSubtitulo = fontSizeSubtitulo * 1.2
                        const marginTopSubtitulo = 3 * escala
                        
                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center" style={{ padding: `${paddingHeader}px 0` }}>
                            {elemento.id === 'header' ? (
                              <>
                                {/* Mostrar título principal del header */}
                                <span style={{ 
                                  fontSize: `${fontSizeTitulo}px`, 
                                  lineHeight: `${lineHeightTitulo}px`, 
                                  fontWeight: 'bold', 
                                  textTransform: 'uppercase',
                                  color: '#ffffff'
                                }}>
                                  {tituloTexto}
                                </span>
                                {/* Mostrar subtítulo si existe */}
                                {subtituloEl && (
                                  <span style={{ 
                                    fontSize: `${fontSizeSubtitulo}px`, 
                                    lineHeight: `${lineHeightSubtitulo}px`, 
                                    marginTop: `${marginTopSubtitulo}px`,
                                    color: '#ffffff'
                                  }}>
                                    {subtituloTexto}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span style={{ fontSize: `${elemento.fontSize * escala}px`, lineHeight: `${elemento.fontSize * escala * 1.2}px` }}>
                                {elemento.texto || 'Encabezado'}
                              </span>
                            )}
                          </div>
                        )
                      })()}
                      {elemento.tipo === 'tabla' && (
                        <div className="pdf-tabla-blanca" style={{ 
                          width: '100%', 
                          height: '100%', 
                          border: '1px solid #d1d5db',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: `${3 * escala}px`, 
                          backgroundColor: '#ffffff !important', 
                          color: '#000000 !important' 
                        }}>
                          <div className="pdf-tabla-titulo" style={{ 
                            fontWeight: 'bold',
                            borderBottom: '1px solid #e5e7eb',
                            marginBottom: '8px',
                            paddingBottom: '4px',
                            fontSize: `${(elemento.fontSize || 8) * escala * 1.1}px`, 
                            color: `${elemento.colorTituloTabla || '#000000'} !important`,
                            backgroundColor: '#ffffff !important'
                          }}>
                            {elemento.tituloTabla || 'DETALLE DE PRODUCTOS'}
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div className="pdf-tabla-headers" style={{ 
                              display: 'grid',
                              gridTemplateColumns: 'repeat(6, 1fr)',
                              gap: '4px',
                              fontSize: `${(elemento.fontSize || 8) * escala * 0.9}px`,
                              fontWeight: '600',
                              borderBottom: '1px solid #e5e7eb',
                              paddingBottom: '4px',
                              marginBottom: '4px',
                              backgroundColor: '#ffffff !important'
                            }}>
                              {(elemento.headers || ['Producto', 'Cant.', 'Pres.', 'P. Unit.', 'Desc.', 'Total']).map((header, idx) => {
                                const texto = typeof header === 'string' ? header : (header.texto || '')
                                const color = typeof header === 'string' ? '#000000' : (header.color || '#000000')
                                const align = idx === 0 ? 'left' : 'center'
                                return (
                                  <div 
                                    key={idx}
                                    className="pdf-tabla-col" 
                                    style={{ 
                                      textAlign: align,
                                      color: `${color} !important`, 
                                      backgroundColor: '#ffffff !important' 
                                    }}
                                  >
                                    {texto}
                                  </div>
                                )
                              })}
                            </div>
                            <div style={{ 
                              fontSize: `${(elemento.fontSize || 8) * escala * 0.8}px`, 
                              paddingTop: `${5 * escala}px`, 
                              fontStyle: 'italic',
                              color: '#6b7280 !important',
                              backgroundColor: '#ffffff !important'
                            }}>
                              (Los productos aparecerán aquí)
                            </div>
                          </div>
                        </div>
                      )}
                      {elemento.tipo === 'totales' && (() => {
                        // Memoizar las líneas por defecto fuera del componente para evitar recrearlas
                        const LINEAS_DEFAULT = [
                          { label: 'Subtotal:', color: '#000000' },
                          { label: 'Descuento General:', color: '#000000' },
                          { label: 'Impuesto (15.25%):', color: '#000000' },
                          { label: 'TOTAL:', color: '#0284c7' }
                        ]
                        const VALORES = ['{subtotal}', '{descuento}', '{impuesto}', '{total}']
                        
                        const lineas = elemento.lineas || LINEAS_DEFAULT
                        const fontSizeBase = elemento.fontSize || 10
                        const paddingEscala = 3 * escala
                        const marginEscala = 2 * escala
                        const gapEscala = 2 * escala
                        const fontSizeBaseEscala = fontSizeBase * escala
                        const fontSizeTotalEscala = fontSizeBaseEscala * 1.2
                        
                        // Pre-calcular estilos del contenedor
                        const containerStyle = {
                          width: '100%',
                          height: '100%',
                          border: '1px solid #d1d5db',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: `${paddingEscala}px`,
                          backgroundColor: '#ffffff',
                          color: '#000000',
                          fontSize: `${fontSizeBaseEscala}px`,
                          gap: `${gapEscala}px`
                        }
                        
                        return (
                          <div className="pdf-totales-box" style={containerStyle}>
                            {lineas.map((linea, index) => {
                              const esTotal = index === 3
                              const esDescuento = index === 1
                              const colorLinea = linea.color || '#000000'
                              
                              // Pre-calcular estilos de cada línea
                              const lineaStyle = {
                                display: 'flex',
                                justifyContent: 'space-between',
                                color: colorLinea,
                                fontWeight: esTotal ? 'bold' : 'normal',
                                fontSize: esTotal ? `${fontSizeTotalEscala}px` : `${fontSizeBaseEscala}px`,
                                borderTop: esTotal ? '2px solid #d1d5db' : 'none',
                                paddingTop: esTotal ? `${paddingEscala}px` : '0',
                                marginTop: esTotal ? `${marginEscala}px` : '0',
                                paddingBottom: index === 2 ? `${marginEscala}px` : '0'
                              }
                              
                              const valorStyle = {
                                fontWeight: 'bold',
                                color: esDescuento ? '#dc2626' : colorLinea
                              }
                              
                              return (
                                <div key={index} style={lineaStyle}>
                                  <span>{linea.label}</span>
                                  <span style={valorStyle}>{VALORES[index]}</span>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                      {/* No mostrar medidas en azul durante redimensionamiento */}
                    </div>
                  )
                  })
                })()}
              </div>
            </div>
          </div>

          {/* Panel Derecho - Propiedades (oculto en móvil, visible en md+) */}
          <div className="hidden md:block w-64 lg:w-80 border-l p-3 lg:p-4 overflow-y-auto" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            {elementoActual ? (
              <>
                <h3 className="font-semibold mb-3 lg:mb-4 text-sm lg:text-base" style={{ color: 'var(--color-text)' }}>Propiedades</h3>
                
                {/* Posición y Tamaño - Deshabilitado para tablas */}
                {elementoActual.tipo !== 'tabla' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Posición X (mm)
                      </label>
                      <input
                        type="number"
                        value={elementoActual.x}
                        onChange={(e) => actualizarElemento(elementoActual.id, { x: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Posición Y (mm)
                      </label>
                      <input
                        type="number"
                        value={elementoActual.y}
                        onChange={(e) => actualizarElemento(elementoActual.id, { y: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Ancho (mm)
                      </label>
                      <input
                        type="number"
                        value={elementoActual.width}
                        onChange={(e) => actualizarElemento(elementoActual.id, { width: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Alto (mm)
                      </label>
                      <input
                        type="number"
                        value={elementoActual.height}
                        onChange={(e) => actualizarElemento(elementoActual.id, { height: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Información de tabla (solo lectura) */}
                {elementoActual.tipo === 'tabla' && (
                  <div className="space-y-4 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Tabla</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      La posición y tamaño de la tabla no se pueden modificar. Solo puedes editar el texto y color de cada celda del encabezado.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      <div>Posición X: {elementoActual.x} mm</div>
                      <div>Posición Y: {elementoActual.y} mm</div>
                      <div>Ancho: {elementoActual.width} mm</div>
                      <div>Alto: {elementoActual.height} mm</div>
                    </div>
                  </div>
                )}

                {/* Propiedades de Texto */}
                {elementoActual.tipo === 'texto' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Texto
                      </label>
                      <textarea
                        value={elementoActual.texto || ''}
                        onChange={(e) => actualizarElemento(elementoActual.id, { texto: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Tamaño de Fuente (pt)
                      </label>
                      <input
                        type="number"
                        value={elementoActual.fontSize}
                        onChange={(e) => actualizarElemento(elementoActual.id, { fontSize: parseInt(e.target.value) || 12 })}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={elementoActual.color}
                          onChange={(e) => actualizarElemento(elementoActual.id, { color: e.target.value })}
                          className="w-16 h-10 rounded border cursor-pointer"
                          style={{ borderColor: 'var(--color-border)' }}
                        />
                        <input
                          type="text"
                          value={elementoActual.color}
                          onChange={(e) => actualizarElemento(elementoActual.id, { color: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Alineación
                      </label>
                <select
                        value={elementoActual.align || 'left'}
                        onChange={(e) => actualizarElemento(elementoActual.id, { align: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                      >
                        <option value="left">Izquierda</option>
                        <option value="center">Centro</option>
                        <option value="right">Derecha</option>
                </select>
              </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={elementoActual.bold === true}
                        onChange={(e) => {
                          const nuevoBold = e.target.checked
                          actualizarElemento(elementoActual.id, { bold: nuevoBold })
                        }}
                        className="w-5 h-5"
                      />
                      <span style={{ color: 'var(--color-text)', fontWeight: elementoActual.bold ? 'bold' : 'normal' }}>Negrita</span>
                    </label>
                  </div>
                )}

                {/* Propiedades de Header */}
                {elementoActual.tipo === 'header' && (
                  <div className="space-y-4 mb-6">
                <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Color de Fondo
                      </label>
                      <div className="flex items-center gap-2">
                  <input
                          type="color"
                          value={elementoActual.color}
                          onChange={(e) => actualizarElemento(elementoActual.id, { color: e.target.value })}
                          className="w-16 h-10 rounded border cursor-pointer"
                          style={{ borderColor: 'var(--color-border)' }}
                        />
                        <input
                          type="text"
                          value={elementoActual.color}
                          onChange={(e) => actualizarElemento(elementoActual.id, { color: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Texto
                      </label>
                      <input
                        type="text"
                        value={elementoActual.texto || ''}
                        onChange={(e) => actualizarElemento(elementoActual.id, { texto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Tamaño de Fuente (pt)
                      </label>
                  <input
                        type="number"
                        value={elementoActual.fontSize}
                        onChange={(e) => actualizarElemento(elementoActual.id, { fontSize: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>
                )}

                {/* Propiedades de Tabla */}
                {elementoActual.tipo === 'tabla' && (
                  <div className="space-y-4 mb-6">
                    {/* Título de la tabla */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Título de la Tabla
                      </label>
                      <div className="p-3 border rounded-lg mb-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                              Texto del Título
                            </label>
                            <input
                              type="text"
                              value={elementoActual.tituloTabla || 'DETALLE DE PRODUCTOS'}
                              onChange={(e) => actualizarElemento(elementoActual.id, { tituloTabla: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm border rounded-lg"
                              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                              Color del Título
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={elementoActual.colorTituloTabla || '#000000'}
                                onChange={(e) => actualizarElemento(elementoActual.id, { colorTituloTabla: e.target.value })}
                                className="w-12 h-8 rounded border cursor-pointer"
                                style={{ borderColor: 'var(--color-border)' }}
                              />
                              <input
                                type="text"
                                value={elementoActual.colorTituloTabla || '#000000'}
                                onChange={(e) => actualizarElemento(elementoActual.id, { colorTituloTabla: e.target.value })}
                                className="flex-1 px-2 py-1.5 text-sm border rounded-lg"
                                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Editar Celdas del Encabezado
                      </label>
                      <div className="space-y-3">
                        {(elementoActual.headers || ['Producto', 'Cant.', 'Pres.', 'P. Unit.', 'Desc.', 'Total']).map((header, index) => {
                          // Manejar tanto el formato antiguo (string) como el nuevo (objeto)
                          const textoActual = typeof header === 'string' ? header : (header.texto || '')
                          const colorActual = typeof header === 'string' ? '#000000' : (header.color || '#000000')
                          
                          return (
                            <div key={index} className="p-3 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                Columna {index + 1}
                              </label>
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    Texto
                                  </label>
                                  <input
                                    type="text"
                                    value={textoActual}
                                    onChange={(e) => {
                                      const headersActualizados = [...(elementoActual.headers || ['Producto', 'Cant.', 'Pres.', 'P. Unit.', 'Desc.', 'Total'])]
                                      // Convertir a formato de objeto si es necesario
                                      if (typeof headersActualizados[index] === 'string') {
                                        headersActualizados[index] = { texto: e.target.value, color: '#000000' }
                                      } else {
                                        headersActualizados[index] = { ...headersActualizados[index], texto: e.target.value }
                                      }
                                      actualizarElemento(elementoActual.id, { headers: headersActualizados })
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border rounded-lg"
                                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    Color de Texto
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={colorActual}
                                      onChange={(e) => {
                                        const headersActualizados = [...(elementoActual.headers || ['Producto', 'Cant.', 'Pres.', 'P. Unit.', 'Desc.', 'Total'])]
                                        // Convertir a formato de objeto si es necesario
                                        if (typeof headersActualizados[index] === 'string') {
                                          headersActualizados[index] = { texto: headersActualizados[index], color: e.target.value }
                                        } else {
                                          headersActualizados[index] = { ...headersActualizados[index], color: e.target.value }
                                        }
                                        actualizarElemento(elementoActual.id, { headers: headersActualizados })
                                      }}
                                      className="w-12 h-8 rounded border cursor-pointer"
                                      style={{ borderColor: 'var(--color-border)' }}
                                    />
                                    <input
                                      type="text"
                                      value={colorActual}
                                      onChange={(e) => {
                                        const headersActualizados = [...(elementoActual.headers || ['Producto', 'Cant.', 'Pres.', 'P. Unit.', 'Desc.', 'Total'])]
                                        // Convertir a formato de objeto si es necesario
                                        if (typeof headersActualizados[index] === 'string') {
                                          headersActualizados[index] = { texto: headersActualizados[index], color: e.target.value }
                                        } else {
                                          headersActualizados[index] = { ...headersActualizados[index], color: e.target.value }
                                        }
                                        actualizarElemento(elementoActual.id, { headers: headersActualizados })
                                      }}
                                      className="flex-1 px-2 py-1.5 text-sm border rounded-lg"
                                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Propiedades de Totales */}
                {elementoActual.tipo === 'totales' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        La posición, tamaño y fuente de los totales no se pueden modificar. Solo puedes editar el texto y color de cada línea individualmente.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Editar Líneas de Totales
                      </label>
                      <div className="space-y-3">
                        {(elementoActual.lineas || [
                          { label: 'Subtotal:', color: '#000000' },
                          { label: 'Descuento General:', color: '#000000' },
                          { label: 'Impuesto (15.25%):', color: '#000000' },
                          { label: 'TOTAL:', color: '#0284c7' }
                        ]).map((linea, index) => {
                          const nombres = ['Subtotal', 'Descuento General', 'Impuesto', 'TOTAL']
                          return (
                            <div key={index} className="p-3 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                {nombres[index]}
                              </label>
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    Texto
                                  </label>
                                  <input
                                    type="text"
                                    value={linea.label || ''}
                                    onChange={(e) => {
                                      const lineasActualizadas = [...(elementoActual.lineas || [
                                        { label: 'Subtotal:', color: '#000000' },
                                        { label: 'Descuento General:', color: '#000000' },
                                        { label: 'Impuesto (15.25%):', color: '#000000' },
                                        { label: 'TOTAL:', color: '#0284c7' }
                                      ])]
                                      lineasActualizadas[index] = { ...lineasActualizadas[index], label: e.target.value }
                                      actualizarElemento(elementoActual.id, { lineas: lineasActualizadas })
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border rounded-lg"
                                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    Color de Texto
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={linea.color || '#000000'}
                                      onChange={(e) => {
                                        const lineasActualizadas = [...(elementoActual.lineas || [
                                          { label: 'Subtotal:', color: '#000000' },
                                          { label: 'Descuento General:', color: '#000000' },
                                          { label: 'Impuesto (15.25%):', color: '#000000' },
                                          { label: 'TOTAL:', color: '#0284c7' }
                                        ])]
                                        lineasActualizadas[index] = { ...lineasActualizadas[index], color: e.target.value }
                                        actualizarElemento(elementoActual.id, { lineas: lineasActualizadas })
                                      }}
                                      className="w-10 h-10 rounded border cursor-pointer"
                                      style={{ borderColor: 'var(--color-border)' }}
                                    />
                                    <input
                                      type="text"
                                      value={linea.color || '#000000'}
                                      onChange={(e) => {
                                        const lineasActualizadas = [...(elementoActual.lineas || [
                                          { label: 'Subtotal:', color: '#000000' },
                                          { label: 'Descuento General:', color: '#000000' },
                                          { label: 'Impuesto (15.25%):', color: '#000000' },
                                          { label: 'TOTAL:', color: '#0284c7' }
                                        ])]
                                        lineasActualizadas[index] = { ...lineasActualizadas[index], color: e.target.value }
                                        actualizarElemento(elementoActual.id, { lineas: lineasActualizadas })
                                      }}
                                      className="flex-1 px-2 py-1.5 text-sm border rounded-lg"
                                      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Opciones Generales */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={elementoActual.visible}
                      onChange={(e) => actualizarElemento(elementoActual.id, { visible: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span style={{ color: 'var(--color-text)' }}>Visible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={elementoActual.locked}
                      onChange={(e) => actualizarElemento(elementoActual.id, { locked: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span style={{ color: 'var(--color-text)' }}>Bloquear</span>
                  </label>
            </div>
              </>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                Selecciona un elemento para editar sus propiedades
              </div>
            )}
          </div>
        </div>

        {/* Footer - Responsive */}
        <div className="px-3 sm:px-6 py-2 sm:py-4 border-t flex justify-between items-center gap-2" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={reorganizarElementos}
            className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
            title="Reorganizar automáticamente todos los elementos"
          >
            <Move size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Reorganizar</span>
          </button>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-xs sm:text-base"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-xs sm:text-base"
            >
              <span className="hidden sm:inline">Guardar Configuración</span>
              <span className="sm:hidden">Guardar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Vista Previa */}
      {mostrarVistaPrevia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMostrarVistaPrevia(false)
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col"
            style={{ backgroundColor: 'white' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal de Vista Previa */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Vista Previa del PDF - Plantilla</h3>
                <p className="text-sm text-gray-600 mt-1">Vista de la estructura sin datos (plantilla)</p>
              </div>
              <button
                onClick={() => setMostrarVistaPrevia(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido de Vista Previa */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
              <div className="flex items-center justify-center w-full h-full">
                <div
                  className="bg-white shadow-2xl canvas-documento"
                  style={{
                    width: `${210 * 1.8}px`,
                    height: `${297 * 1.8}px`,
                    position: 'relative',
                    flexShrink: 0,
                    margin: '0 auto',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Renderizar elementos como se verían en el PDF */}
                  {(() => {
                    const escalaPreview = 1.8
                    const maxWidth = 210 * escalaPreview
                    const maxHeight = 297 * escalaPreview
                    
                    return config.elementos
                      .filter(el => el.visible)
                      .sort((a, b) => {
                        if (a.tipo === 'header' && b.tipo !== 'header') return -1
                        if (a.tipo !== 'header' && b.tipo === 'header') return 1
                        return a.y - b.y
                      })
                      .map((elemento) => {
                        // Asegurar que los elementos no se salgan del área del documento
                        const elementoWidth = elemento.width * escalaPreview
                        const elementoHeight = elemento.height * escalaPreview
                        const elementoX = Math.max(0, Math.min(elemento.x * escalaPreview, maxWidth - elementoWidth))
                        const elementoY = Math.max(0, Math.min(elemento.y * escalaPreview, maxHeight - elementoHeight))
                        
                        if (elemento.tipo === 'header') {
                          const rgb = hexToRgb(elemento.color || '#2563eb')
                          return (
                        <div
                          key={elemento.id}
                          style={{
                            position: 'absolute',
                            left: `${elementoX}px`,
                            top: `${elementoY}px`,
                            width: `${Math.min(elementoWidth, maxWidth - elementoX)}px`,
                            height: `${Math.min(elementoHeight, maxHeight - elementoY)}px`,
                            backgroundColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{ 
                            fontSize: `${(config.elementos.find(el => el.id === 'titulo')?.fontSize || 18) * escalaPreview * 0.4}px`,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            textTransform: 'uppercase',
                            textAlign: 'center'
                          }}>
                            {config.elementos.find(el => el.id === 'titulo')?.texto || 'COTIZACIÓN - NOTA DE VENTA'}
                          </div>
                          {config.elementos.find(el => el.id === 'subtitulo' && el.visible) && (
                            <div style={{ 
                              fontSize: `${10 * escalaPreview * 0.4}px`,
                              color: '#ffffff',
                              marginTop: '5px',
                              textAlign: 'center'
                            }}>
                              {config.elementos.find(el => el.id === 'subtitulo').texto}
        </div>
      )}
    </div>
  )
}

                      if (elemento.tipo === 'texto') {
                        const rgb = hexToRgb(elemento.color || '#000000')
                        const texto = mostrarTextoPlantilla(elemento.texto || '')
                        return (
                        <div
                          key={elemento.id}
                          style={{
                            position: 'absolute',
                            left: `${elementoX}px`,
                            top: `${elementoY}px`,
                            width: `${Math.min(elementoWidth, maxWidth - elementoX)}px`,
                            minHeight: `${Math.min(elementoHeight, maxHeight - elementoY)}px`,
                            color: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
                            fontSize: `${elemento.fontSize * escalaPreview * 0.4}px`,
                            fontWeight: elemento.bold ? 'bold' : 'normal',
                            textAlign: elemento.align || 'left',
                            padding: '8px',
                            lineHeight: `${elemento.fontSize * escalaPreview * 0.4 * 1.3}px`,
                            whiteSpace: 'pre-line',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            wordWrap: 'break-word'
                          }}
                        >
                          {texto.split('\n').map((line, i) => {
                            const esTitulo = line.includes('INFORMACIÓN') || line.includes('COTIZACIÓN') || line.includes('DETALLE') || line.includes('TOTAL:') || line.includes('Observaciones:')
                            const tienePlaceholder = line.includes('_')
                            return (
                              <div 
                                key={i}
                                style={{
                                  fontWeight: esTitulo ? 'bold' : 'normal',
                                  fontSize: esTitulo ? `${elemento.fontSize * escalaPreview * 0.44}px` : `${elemento.fontSize * escalaPreview * 0.4}px`,
                                  marginBottom: i < texto.split('\n').length - 1 ? '4px' : '0',
                                  color: tienePlaceholder ? '#9ca3af' : `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
                                  fontStyle: tienePlaceholder ? 'italic' : 'normal'
                                }}
                              >
                                {line || ' '}
                              </div>
                            )
                          })}
                        </div>
                        )
                      }
                      
                      if (elemento.tipo === 'tabla') {
                        return (
                        <div
                          key={elemento.id}
                          style={{
                            position: 'absolute',
                            left: `${elementoX}px`,
                            top: `${elementoY}px`,
                            width: `${Math.min(elementoWidth, maxWidth - elementoX)}px`,
                            height: `${Math.min(elementoHeight, maxHeight - elementoY)}px`,
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff !important',
                            padding: '8px',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            color: '#000000'
                          }}
                        >
                          <div style={{
                            fontSize: `${(elemento.fontSize || 9) * escalaPreview * 0.44}px`,
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            paddingBottom: '4px',
                            borderBottom: '1px solid #e5e7eb',
                            color: `${elemento.colorTituloTabla || '#000000'} !important`
                          }}>
                            {elemento.tituloTabla || 'DETALLE DE PRODUCTOS'}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '4px',
                            fontSize: `${(elemento.fontSize || 9) * escalaPreview * 0.36}px`,
                            fontWeight: 'bold',
                            paddingBottom: '4px',
                            borderBottom: '1px solid #e5e7eb',
                            marginBottom: '8px',
                            backgroundColor: '#ffffff !important'
                          }}>
                            {(elemento.headers || ['Producto', 'Cant.', 'Pres.', 'P. Unit.', 'Desc.', 'Total']).map((header, idx) => {
                              const texto = typeof header === 'string' ? header : (header.texto || '')
                              const color = typeof header === 'string' ? '#000000' : (header.color || '#000000')
                              const align = idx === 0 ? 'left' : 'center'
                              return (
                                <div 
                                  key={idx}
                                  style={{ 
                                    textAlign: align,
                                    color: `${color} !important`,
                                    backgroundColor: '#ffffff !important'
                                  }}
                                >
                                  {texto}
                                </div>
                              )
                            })}
                          </div>
                          {/* Mostrar filas vacías como plantilla */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '4px',
                            fontSize: `${(elemento.fontSize || 9) * escalaPreview * 0.32}px`,
                            marginTop: '8px',
                            color: '#9ca3af',
                            fontStyle: 'italic'
                          }}>
                            <div>_________________</div>
                            <div style={{ textAlign: 'center' }}>___</div>
                            <div style={{ textAlign: 'center' }}>_______</div>
                            <div style={{ textAlign: 'center' }}>S/ ______</div>
                            <div style={{ textAlign: 'center' }}>-</div>
                            <div style={{ textAlign: 'center' }}>S/ ______</div>
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '4px',
                            fontSize: `${(elemento.fontSize || 9) * escalaPreview * 0.32}px`,
                            marginTop: '8px',
                            color: '#9ca3af',
                            fontStyle: 'italic'
                          }}>
                            <div>_________________</div>
                            <div style={{ textAlign: 'center' }}>___</div>
                            <div style={{ textAlign: 'center' }}>_______</div>
                            <div style={{ textAlign: 'center' }}>S/ ______</div>
                            <div style={{ textAlign: 'center' }}>-</div>
                            <div style={{ textAlign: 'center' }}>S/ ______</div>
                          </div>
                        </div>
                        )
                      }
                      
                      if (elemento.tipo === 'totales') {
                        return (
                        <div
                          key={elemento.id}
                          style={{
                            position: 'absolute',
                            left: `${elementoX}px`,
                            top: `${elementoY}px`,
                            width: `${Math.min(elementoWidth, maxWidth - elementoX)}px`,
                            height: `${Math.min(elementoHeight, maxHeight - elementoY)}px`,
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff !important',
                            padding: '8px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            fontSize: `${(elemento.fontSize || 10) * escalaPreview * 0.4}px`
                          }}
                        >
                          {(elemento.lineas || [
                            { label: 'Subtotal:', color: '#000000' },
                            { label: 'Descuento General:', color: '#000000' },
                            { label: 'Impuesto (15.25%):', color: '#000000' },
                            { label: 'TOTAL:', color: '#0284c7' }
                          ]).map((linea, index) => {
                            const valores = ['{subtotal}', '{descuento}', '{impuesto}', '{total}']
                            const esTotal = index === 3
                            const esDescuento = index === 1 // Descuento General es el índice 1
                            return (
                              <div 
                                key={index}
                                style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  color: `${linea.color || '#000000'} !important`,
                                  fontWeight: esTotal ? 'bold' : 'normal',
                                  fontSize: esTotal ? `${(elemento.fontSize || 10) * escalaPreview * 0.48}px` : `${(elemento.fontSize || 10) * escalaPreview * 0.4}px`,
                                  borderTop: esTotal ? '2px solid #d1d5db' : 'none',
                                  paddingTop: esTotal ? '4px' : '0',
                                  marginTop: esTotal ? '4px' : '0',
                                  paddingBottom: index === 2 ? '4px' : '0'
                                }}
                              >
                                <span>{linea.label}</span>
                                <span style={{ 
                                  fontWeight: 'bold',
                                  color: esDescuento ? '#dc2626 !important' : `${linea.color || '#000000'} !important`
                                }}>{valores[index]}</span>
                              </div>
                            )
                          })}
                        </div>
                        )
                      }
                      
                      return null
                      })
                    })()}
                </div>
              </div>
            </div>

            {/* Footer del Modal de Vista Previa */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => {
                  const nombre = prompt('Ingresa un nombre para guardar esta plantilla:')
                  if (!nombre) return
                  
                  const nuevaPlantilla = {
                    nombre: nombre,
                    elementos: JSON.parse(JSON.stringify(config.elementos)),
                    margen: config.margen,
                    colorPrimario: config.colorPrimario,
                    colorSecundario: config.colorSecundario
                  }
                  
                  const plantillasActualizadas = asegurarPlantillaDEMO([...plantillas, nuevaPlantilla])
                  setPlantillas(plantillasActualizadas)
                  localStorage.setItem('cotizacion_plantillas', JSON.stringify(plantillasActualizadas))
                  
                  // Aplicar la plantilla recién guardada
                  onSave(config)
                  
                  alert('✅ Plantilla guardada y aplicada exitosamente')
                  setMostrarVistaPrevia(false)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <Save size={18} />
                Guardar como Plantilla
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Aplicar la configuración actual
                    onSave(config)
                    alert('✅ Modelo aplicado exitosamente. Esta configuración se usará para generar los PDFs.')
                    setMostrarVistaPrevia(false)
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Aplicar este Modelo
                </button>
                <button
                  onClick={() => setMostrarVistaPrevia(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Plantillas */}
      {mostrarPlantillas && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMostrarPlantillas(false)
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col modal-plantillas-container" 
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal de Plantillas */}
            <div className="px-6 py-4 border-b flex items-center justify-between modal-plantillas-header" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-xl font-bold modal-title-plantillas">Gestionar Plantillas</h3>
              <button
                onClick={() => setMostrarPlantillas(false)}
                className="transition-colors p-2 rounded-full"
                style={{ color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido del Modal de Plantillas */}
            <div className="flex-1 overflow-auto p-6">
              <div className="mb-4 flex justify-between items-center">
                <h4 className="text-lg font-semibold modal-subtitle-plantillas">Plantillas Disponibles</h4>
                <button
                  onClick={guardarComoPlantilla}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Save size={18} />
                  Nueva Plantilla
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plantillas.map((plantilla, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer tarjeta-plantilla ${
                      plantillaActual === plantilla.nombre ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{ 
                      borderColor: plantillaActual === plantilla.nombre ? '#3b82f6' : 'var(--color-border)', 
                      backgroundColor: 'var(--color-surface)' 
                    }}
                    onClick={() => aplicarPlantilla(plantilla)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                          {plantilla.nombre}
                          {plantilla.nombre === 'DEMO' && (
                            <span className="text-xs px-2 py-0.5 bg-purple-500 text-white rounded-full">
                              Principal
                            </span>
                          )}
                          {plantillaActual === plantilla.nombre && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                              En uso
                            </span>
                          )}
                        </h5>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {plantilla.elementos?.length || 0} elementos
                          {plantilla.nombre === 'DEMO' && ' • Protegida'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {/* Solo duplicar para DEMO */}
                        {plantilla.nombre === 'DEMO' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicarPlantilla(index)
                            }}
                            className="p-2 rounded text-green-600 hover:bg-green-100"
                            title="Duplicar plantilla"
                          >
                            <Copy size={18} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                duplicarPlantilla(index)
                              }}
                              className="p-2 rounded text-green-600 hover:bg-green-100"
                              title="Duplicar plantilla"
                            >
                              <Copy size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                editarNombrePlantilla(index)
                              }}
                              className="p-2 rounded text-blue-600 hover:bg-blue-100"
                              title="Editar nombre"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                eliminarPlantilla(index)
                              }}
                              className="p-2 rounded text-red-600 hover:bg-red-100"
                              title="Eliminar plantilla"
                            >
                              <Trash size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          aplicarPlantilla(plantilla)
                        }}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                      >
                        Aplicar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMostrarVistaPrevia(true)
                          setMostrarPlantillas(false)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {plantillas.length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p style={{ color: 'var(--color-text-secondary)' }}>No hay plantillas guardadas</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>Crea una nueva plantilla o duplica una existente para comenzar</p>
                </div>
              )}
            </div>

            {/* Footer del Modal de Plantillas */}
            <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setMostrarPlantillas(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente Modal de Detalles de Cotización (Nota de Venta)
const ModalDetallesCotizacion = ({ cotizacion, onClose, formatCurrency, formatDate, configuracionPDF }) => {
  const productos = cotizacion.productos || []

  // Función para reemplazar variables en texto
  const reemplazarVariables = (texto) => {
    if (!texto) return ''
    return texto
      .replace(/{cliente}/g, cotizacion.cliente || 'No especificado')
      .replace(/{fecha}/g, formatDate(cotizacion.fecha))
      .replace(/{fechaVencimiento}/g, cotizacion.fechaVencimiento ? formatDate(cotizacion.fechaVencimiento) : '')
      .replace(/{vendedor}/g, cotizacion.vendedor || '-')
      .replace(/{estado}/g, cotizacion.estado === 'aprobada' ? 'Aprobada' : cotizacion.estado === 'rechazada' ? 'Rechazada' : cotizacion.estado === 'vencida' ? 'Vencida' : 'Pendiente')
      .replace(/{subtotal}/g, formatCurrency(cotizacion.subtotal || 0))
      .replace(/{descuento}/g, cotizacion.descuento > 0 ? `-${formatCurrency(cotizacion.descuento)}` : formatCurrency(0))
      .replace(/{impuesto}/g, formatCurrency(cotizacion.impuesto || 0))
      .replace(/{total}/g, formatCurrency(cotizacion.total || 0))
      .replace(/{observaciones}/g, cotizacion.observaciones || '')
  }

  // Función para generar el PDF de la cotización
  const generarPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = configuracionPDF?.margen || 20
    const maxWidth = pageWidth - (margin * 2)

    // Verificar si hay elementos visuales configurados
    const usarElementosVisuales = configuracionPDF?.elementos && Array.isArray(configuracionPDF.elementos) && configuracionPDF.elementos.length > 0

    if (usarElementosVisuales) {
      // Renderizar usando elementos visuales
      // Ordenar: headers primero (para que estén debajo), luego por Y
      const elementos = configuracionPDF.elementos
        .filter(el => el.visible)
        .sort((a, b) => {
          // Headers primero (z-index más bajo)
          if (a.tipo === 'header' && b.tipo !== 'header') return -1
          if (a.tipo !== 'header' && b.tipo === 'header') return 1
          // Dentro del mismo tipo, ordenar por Y
          return a.y - b.y
        })

      let ultimaPosicionTabla = null // Guardar donde termina la tabla

      elementos.forEach((elemento) => {
        const hexToRgbEl = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
          return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0]
        }

        if (elemento.tipo === 'header') {
          const color = hexToRgbEl(elemento.color || '#2563eb')
          doc.setFillColor(...color)
          // Asegurar que el header cubra todo el ancho de la página
          const headerWidth = Math.max(elemento.width, pageWidth)
          doc.rect(0, elemento.y, headerWidth, elemento.height, 'F')
          
          // Renderizar título y subtítulo dentro del header
          const tituloEl = configuracionPDF.elementos.find(el => el.id === 'titulo' && el.visible)
          const subtituloEl = configuracionPDF.elementos.find(el => el.id === 'subtitulo' && el.visible)
          
          // Si no se encuentran los elementos, usar valores por defecto
          const tituloTexto = tituloEl 
            ? reemplazarVariables(tituloEl.texto || 'COTIZACIÓN - NOTA DE VENTA')
            : reemplazarVariables('COTIZACIÓN - NOTA DE VENTA')
          const subtituloTexto = subtituloEl
            ? reemplazarVariables(subtituloEl.texto || 'Qubit - Sistema de Gestión')
            : reemplazarVariables('Qubit - Sistema de Gestión')
          
          // Renderizar título (siempre visible)
          doc.setTextColor(255, 255, 255)
          const tituloFontSize = tituloEl ? Math.max(tituloEl.fontSize || 20, 20) : 20
          doc.setFontSize(tituloFontSize)
          doc.setFont('helvetica', 'bold')
          // Centrar el título en la página - posición fija desde el top del header
          // Si el header está en y=0 y tiene height=35, el título debe estar alrededor de y=12-15
          const tituloY = elemento.y + 12
          doc.text(tituloTexto, pageWidth / 2, tituloY, { align: 'center' })
          
          // Renderizar subtítulo (siempre visible)
          doc.setTextColor(255, 255, 255)
          const subtituloFontSize = subtituloEl ? Math.max(subtituloEl.fontSize || 12, 12) : 12
          doc.setFontSize(subtituloFontSize)
          doc.setFont('helvetica', 'normal')
          // Centrar el subtítulo en la página - justo debajo del título
          const subtituloY = elemento.y + 25
          doc.text(subtituloTexto, pageWidth / 2, subtituloY, { align: 'center' })
        } else if (elemento.tipo === 'texto') {
          // Saltar título y subtítulo ya que se renderizan dentro del header
          if (elemento.id === 'titulo' || elemento.id === 'subtitulo') {
            return
          }
          
          // Si es un separador (línea), renderizarlo como línea
          if (elemento.id === 'separador1' || elemento.id === 'separador2' || (elemento.height <= 2 && !elemento.texto)) {
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.5)
            doc.line(elemento.x, elemento.y, elemento.x + elemento.width, elemento.y)
            return
          }
          
          const color = hexToRgbEl(elemento.color || '#000000')
          const texto = reemplazarVariables(elemento.texto || '')
          const lines = texto.split('\n')
          const align = elemento.align || 'left'
          let yPos = elemento.y + 4
          
          // Manejo especial para "INFORMACIÓN DE LA COTIZACIÓN"
          if (elemento.id === 'info') {
            // Primera línea es el título - usar bold del elemento si está definido
            doc.setFontSize(elemento.fontSize || 9)
            doc.setFont('helvetica', elemento.bold ? 'bold' : 'bold') // Título siempre en negrita
            doc.setTextColor(0, 0, 0)
            doc.text(lines[0] || 'INFORMACIÓN DE LA COTIZACIÓN', elemento.x, yPos, { align: 'left' })
            yPos += 5
            
            // Resto de líneas son datos - usar bold del elemento
            doc.setFont('helvetica', elemento.bold ? 'bold' : 'normal')
            for (let i = 1; i < lines.length; i++) {
              doc.text(lines[i], elemento.x, yPos, { align: 'left' })
              yPos += 4.5
            }
            return
          }
          
          // Manejo especial para totales (Subtotal, Descuento, Impuesto)
          // IMPORTANTE: aquí NO usamos `elemento.x` para alinear a la derecha,
          // sino el ancho real del PDF (`pageWidth`) y un margen fijo.
          // De esta forma, aunque el canvas del editor tenga paddings/zoom
          // distintos al PDF, los valores numéricos quedan SIEMPRE pegados
          // al margen derecho real de la hoja.
          if (elemento.id === 'totales') {
            doc.setFontSize(Math.max(elemento.fontSize || 11, 11)) // Mínimo 11pt
            doc.setFont('helvetica', elemento.bold ? 'bold' : 'normal')
            doc.setTextColor(0, 0, 0)

            // Posición en coordenadas reales del PDF:
            // - labelX: margen izquierdo de la hoja
            // - valueX: margen derecho de la hoja
            const margen = configuracionPDF?.margen || 15
            const labelX = margen
            const valueX = pageWidth - margen

            lines.forEach((line) => {
              const parts = line.split(':')
              if (parts.length === 2) {
                const label = parts[0] + ':'
                const value = parts[1].trim()

                // Label siempre en negro a la izquierda
                doc.setTextColor(0, 0, 0)
                doc.text(label, labelX, yPos, { align: 'left' })

                // Valor: rojo solo para Descuento General, negro para los demás
                if (line.includes('Descuento General')) {
                  doc.setTextColor(220, 38, 38) // rojo
                } else {
                  doc.setTextColor(0, 0, 0)
                }
                doc.text(value, valueX, yPos, { align: 'right' })
              } else {
                // Línea que no tiene ":", se dibuja tal cual a la izquierda
                doc.setTextColor(0, 0, 0)
                doc.text(line, labelX, yPos, { align: 'left' })
              }
              yPos += 5
            })

            // Restaurar color por defecto y salir
            doc.setTextColor(0, 0, 0)
            return
          }
          
          // Manejo especial para TOTAL
          if (elemento.id === 'total') {
            const totalColor = hexToRgbEl(elemento.color || '#2563eb')
            doc.setTextColor(...totalColor)
            doc.setFontSize(elemento.fontSize || 11)
            // Usar bold del elemento, pero si no está definido, usar bold por defecto
            doc.setFont('helvetica', elemento.bold !== false ? 'bold' : 'normal')
            
            const parts = lines[0].split(':')
            if (parts.length === 2) {
              const label = parts[0] + ':'
              const value = parts[1].trim()
              // Igual que en "totales", anclamos al ancho REAL del PDF:
              const margen = configuracionPDF?.margen || 15
              const labelX = margen
              const valueX = pageWidth - margen
              
              // Ambos en azul y negrita
              doc.text(label, labelX, yPos, { align: 'left' })
              doc.text(value, valueX, yPos, { align: 'right' })
            } else {
              doc.text(lines[0], elemento.x + elemento.width - 2, yPos, { align: 'right' })
            }
            doc.setTextColor(0, 0, 0)
            return
          }
          
          // Manejo especial para Observaciones
          if (elemento.id === 'observaciones') {
            doc.setFontSize(Math.max(elemento.fontSize || 11, 11)) // Mínimo 11pt
            doc.setFont('helvetica', elemento.bold ? 'bold' : 'normal')
            doc.setTextColor(0, 0, 0)
            
            lines.forEach((line, index) => {
              doc.text(line, elemento.x, yPos, { align: 'left' })
              yPos += 5.5
            })
            return
          }
          
          // Para otros elementos de texto, renderizar normalmente
          doc.setFontSize(Math.max(elemento.fontSize || 11, 11)) // Mínimo 11pt
          doc.setFont('helvetica', elemento.bold ? 'bold' : 'normal')
          doc.setTextColor(...color)
          
          lines.forEach((line, index) => {
            const x = align === 'center' ? elemento.x + elemento.width / 2 : align === 'right' ? elemento.x + elemento.width - 2 : elemento.x
            const lineHeight = Math.max(elemento.fontSize || 11, 11) * 0.5 // Aumentar lineHeight
            const currentY = elemento.y + (index + 1) * lineHeight + 5
            doc.text(line, x, currentY, { align })
          })
          
          // Restaurar color por defecto
          doc.setTextColor(0, 0, 0)
        } else if (elemento.tipo === 'tabla') {
          // Línea encima de "DETALLE DE PRODUCTOS" con más espacio
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.line(elemento.x, elemento.y - 10, elemento.x + elemento.width, elemento.y - 10)
          
          // Renderizar título personalizado de la tabla
          const tituloTabla = elemento.tituloTabla || 'DETALLE DE PRODUCTOS'
          const colorTituloTabla = elemento.colorTituloTabla || '#000000'
          doc.setFontSize(Math.max((elemento.fontSize || 11) + 1, 12)) // Mínimo 12pt para el título
          doc.setFont('helvetica', 'bold')
          const colorTituloRgb = hexToRgbEl(colorTituloTabla)
          doc.setTextColor(colorTituloRgb[0], colorTituloRgb[1], colorTituloRgb[2])
          doc.text(tituloTabla, elemento.x, elemento.y - 4, { align: 'left' })
          // Restaurar color por defecto
          doc.setTextColor(0, 0, 0)
          
          // Renderizar tabla de productos en la posición del elemento
          const colWidths = [80, 20, 25, 30, 25, 30]
          // Obtener headers personalizados del elemento o usar valores por defecto
          const headersPersonalizados = elemento.headers || ['Producto', 'Cant.', 'Pres.', 'P. Unit.', 'Desc.', 'Total']
          const headers = headersPersonalizados.map(h => typeof h === 'string' ? h : (h.texto || ''))
          const headersColores = headersPersonalizados.map(h => typeof h === 'string' ? '#000000' : (h.color || '#000000'))
          const totalTableWidth = Math.min(elemento.width, colWidths.reduce((sum, width) => sum + width, 0))
          const tableStartX = elemento.x
          let yPos = elemento.y + 2
          
          doc.setFontSize(Math.max(elemento.fontSize || 11, 11)) // Mínimo 11pt
          doc.setFont('helvetica', 'bold')
          let xPos = tableStartX
          headers.forEach((header, index) => {
            const colWidth = (colWidths[index] / colWidths.reduce((sum, w) => sum + w, 0)) * totalTableWidth
            const colCenterX = xPos + colWidth / 2
            // "Producto" alineado a la izquierda, "Cant." y "Pres." centrados, "P. Unit.", "Desc.", "Total" a la derecha
            let headerAlign = 'center'
            let headerX = colCenterX
            if (index === 0) {
              headerAlign = 'left'
              headerX = xPos + 1
            } else if (index >= 3) { // P. Unit., Desc., Total
              headerAlign = 'right'
              headerX = xPos + colWidth - 1
            }
            // Aplicar color personalizado
            const colorHeader = hexToRgbEl(headersColores[index])
            doc.setTextColor(colorHeader[0], colorHeader[1], colorHeader[2])
            doc.text(header, headerX, yPos, { align: headerAlign })
            xPos += colWidth
          })
          // Restaurar color por defecto
          doc.setTextColor(0, 0, 0)
          
          yPos += 6
          // Línea separadora gris claro
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.line(tableStartX, yPos, tableStartX + totalTableWidth, yPos)
          yPos += 6 // Más espacio después de la línea de headers
          
          doc.setFont('helvetica', 'normal')
          productos.forEach((producto) => {
            if (yPos > pageHeight - 60) {
              doc.addPage()
              yPos = elemento.y + 10
            }
            const cantidad = producto.cantidad || 1
            const precioUnitario = producto.precioUnitario || producto.precio || 0
            const descuento = producto.descuentoMonto || producto.descuento || 0
            const subtotal = (precioUnitario * cantidad) - descuento
            xPos = tableStartX
            
            // Mostrar nombre del producto con código si está disponible
            const codigoProducto = producto.codigoInterno || producto.codigo || producto.codigoBarra || ''
            const nombreProducto = producto.nombre || 'Producto sin nombre'
            
            // Renderizar nombre del producto (alineado a la izquierda)
            doc.setTextColor(0, 0, 0)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(elemento.fontSize || 9)
            doc.text(nombreProducto, xPos + 1, yPos, { align: 'left' })
            
            // Si hay código, renderizarlo debajo en tamaño más pequeño
            if (codigoProducto) {
              doc.setFontSize((elemento.fontSize || 9) - 1)
              doc.setTextColor(100, 100, 100) // Gris para el código
              doc.text(`Cód: ${codigoProducto}`, xPos + 1, yPos + 3.5, { align: 'left' })
              doc.setFontSize(elemento.fontSize || 9)
              doc.setTextColor(0, 0, 0)
            }
            xPos += (colWidths[0] / colWidths.reduce((sum, w) => sum + w, 0)) * totalTableWidth
            doc.setTextColor(0, 0, 0)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(elemento.fontSize || 9)
            doc.text(String(cantidad), xPos + ((colWidths[1] / colWidths.reduce((sum, w) => sum + w, 0)) * totalTableWidth) / 2, yPos, { align: 'center' })
            xPos += (colWidths[1] / colWidths.reduce((sum, w) => sum + w, 0)) * totalTableWidth
            doc.text(producto.presentacion || 'Unidad', xPos + ((colWidths[2] / colWidths.reduce((sum, w) => sum + w, 0)) * totalTableWidth) / 2, yPos, { align: 'center' })
            xPos += (colWidths[2] / colWidths.reduce((sum, w) => sum + w, 0)) * totalTableWidth
            // Precio unitario alineado a la derecha
            const col3Width = (colWidths[3] / colWidths.reduce((sum, w) => sum + w, 0)) * totalTableWidth
            doc.text(formatCurrency(precioUnitario), xPos + col3Width - 1, yPos, { align: 'right' })
            xPos += col3Width
            // Descuento: rojo si hay descuento, alineado a la derecha
            const col4Width = (colWidths[4] / colWidths.reduce((sum, w) => sum + w, 0)) * totalTableWidth
            if (descuento > 0) {
              doc.setTextColor(220, 38, 38) // Rojo para descuentos
              doc.text(`-${formatCurrency(descuento)}`, xPos + col4Width - 1, yPos, { align: 'right' })
            } else {
              doc.setTextColor(0, 0, 0)
              doc.text('-', xPos + col4Width - 1, yPos, { align: 'right' })
            }
            xPos += col4Width
            // Total del producto: negrita, alineado a la derecha
            const col5Width = (colWidths[5] / colWidths.reduce((sum, w) => sum + w, 0)) * totalTableWidth
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 0, 0)
            doc.text(formatCurrency(subtotal), xPos + col5Width - 1, yPos, { align: 'right' })
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(0, 0, 0)
            // Ajustar altura según si hay código o no
            const alturaLinea = codigoProducto ? 9 : 7
            yPos += alturaLinea
          })
          
          // Línea separadora después de la tabla (antes de los totales)
          yPos += 2
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.line(tableStartX, yPos, tableStartX + totalTableWidth, yPos)
          
          // Guardar la última posición de la tabla
          ultimaPosicionTabla = yPos + 8 // 8mm de espacio después de la línea
        } else if (elemento.tipo === 'totales') {
          // Renderizar desglose de totales
          doc.setFontSize(elemento.fontSize || 10)
          doc.setFont('helvetica', 'normal')
          
          // Si hay una tabla antes, usar su posición final; si no, usar la posición del elemento
          let yPos = ultimaPosicionTabla || elemento.y
          const boxWidth = elemento.width || 100
          const lineHeight = 6
          
          // Calcular descuento total (puede venir de varias fuentes)
          const descuentoGeneral = cotizacion.descuentoGeneral || 0
          const descuentoProductos = productos.reduce((sum, p) => sum + (p.descuentoMonto || p.descuento || 0), 0)
          const descuentoTotal = descuentoGeneral + descuentoProductos
          
          // Obtener líneas personalizadas o usar valores por defecto
          const lineas = elemento.lineas || [
            { label: 'Subtotal:', color: '#000000' },
            { label: 'Descuento General:', color: '#000000' },
            { label: 'Impuesto (15.25%):', color: '#000000' },
            { label: 'TOTAL:', color: '#0284c7' }
          ]
          
          // Valores para cada línea
          const valores = [
            formatCurrency(cotizacion.subtotal || 0),
            descuentoTotal > 0 ? `-${formatCurrency(descuentoTotal)}` : formatCurrency(0),
            formatCurrency(cotizacion.impuesto || 0),
            formatCurrency(cotizacion.total || 0)
          ]
          
          // Función para convertir hex a RGB
          const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
            return result ? [
              parseInt(result[1], 16),
              parseInt(result[2], 16),
              parseInt(result[3], 16)
            ] : [0, 0, 0]
          }
          
          // Renderizar cada línea
          lineas.forEach((linea, index) => {
            const esTotal = index === 3
            const esDescuento = index === 1 // Descuento General es el índice 1
            const colorRgb = hexToRgb(linea.color || (esTotal ? '#0284c7' : '#000000'))
            
            // Configurar fuente y tamaño para el label
            if (esTotal) {
              doc.setFont('helvetica', 'bold')
              doc.setFontSize((elemento.fontSize || 10) + 2)
            } else {
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(elemento.fontSize || 10)
            }
            
            // Configurar color para el label
            doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2])
            
            // Renderizar label (texto izquierdo)
            doc.text(linea.label, elemento.x + 2, yPos, { align: 'left' })
            
            // Renderizar valor (texto derecho) - siempre en negrita
            doc.setFont('helvetica', 'bold')
            // Si es descuento, usar color rojo; si no, usar el color del label
            if (esDescuento) {
              doc.setTextColor(220, 38, 38) // Rojo para descuentos
            } else {
              doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2])
            }
            doc.text(valores[index], elemento.x + boxWidth - 2, yPos, { align: 'right' })
            
            yPos += lineHeight
            
            // Línea separadora antes del TOTAL
            if (index === 2) {
              yPos += 2
              doc.setDrawColor(200, 200, 200)
              doc.setLineWidth(0.5)
              doc.line(elemento.x, yPos - 2, elemento.x + boxWidth, yPos - 2)
              yPos += 5
            }
          })
          
          // Restaurar valores por defecto
          doc.setTextColor(0, 0, 0)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(elemento.fontSize || 10)
          
          // NO dibujar borde del cuadro - solo líneas horizontales
        }
      })
      
      // ==========================================
      // FOOTER AUTOMÁTICO AL FINAL DE LA PÁGINA
      // ==========================================
      const footerY = pageHeight - 15 // 15mm desde el fondo
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100) // Gris
      
      // Total de productos
      const totalProductos = productos.length
      doc.text(`Total de productos: ${totalProductos}`, pageWidth / 2, footerY, { align: 'center' })
      
      // Fecha de generación
      const fechaGeneracion = new Date().toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
      doc.text(`Generado el ${fechaGeneracion}`, pageWidth / 2, footerY + 4, { align: 'center' })
      
      return doc
    }

    // Lógica antigua (fallback)
    let yPos = 20

    // Colores desde configuración
    const primaryColor = hexToRgb(configuracionPDF?.colorPrimario || '#2563eb')
    const grayColor = hexToRgb(configuracionPDF?.colorSecundario || '#6b7280')

    // Encabezado
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(configuracionPDF.tamanoFuenteTitulo || 20)
    doc.setFont('helvetica', 'bold')
    doc.text('COTIZACIÓN - NOTA DE VENTA', pageWidth / 2, 15, { align: 'center' })
    
    if (configuracionPDF.mostrarLogo !== false) {
      doc.setFontSize((configuracionPDF.tamanoFuenteTitulo || 20) * 0.6)
      doc.setFont('helvetica', 'normal')
      doc.text('Qubit - Sistema de Gestión', pageWidth / 2, 25, { align: 'center' })
    }
    
    yPos = 50

    // Información de la cotización
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(configuracionPDF.tamanoFuenteNormal || 10)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMACIÓN DE LA COTIZACIÓN', pageWidth / 2, yPos, { align: 'center' })
    yPos += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(configuracionPDF.tamanoFuenteNormal || 10)
    doc.text(`Cliente: ${cotizacion.cliente || 'No especificado'}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 6
    doc.text(`Fecha: ${formatDate(cotizacion.fecha)}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 6
    
    if (cotizacion.fechaVencimiento) {
      doc.text(`Vencimiento: ${formatDate(cotizacion.fechaVencimiento)}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 6
    }
    
    doc.text(`Vendedor: ${cotizacion.vendedor || '-'}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 6
    
    const estadoTexto = cotizacion.estado === 'aprobada' ? 'Aprobada' : 
                        cotizacion.estado === 'rechazada' ? 'Rechazada' :
                        cotizacion.estado === 'vencida' ? 'Vencida' : 'Pendiente'
    doc.text(`Estado: ${estadoTexto}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 10

    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // Tabla de productos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize((configuracionPDF.tamanoFuenteNormal || 10) + 1)
    doc.text('DETALLE DE PRODUCTOS', pageWidth / 2, yPos, { align: 'center' })
    yPos += 8

    // Encabezados de tabla
    doc.setFontSize((configuracionPDF.tamanoFuenteNormal || 10) - 1)
    doc.setFont('helvetica', 'bold')
    const colWidths = [80, 20, 25, 30, 25, 30]
    const headers = ['Producto', 'Cant.', 'Pres.', 'P. Unit.', 'Desc.', 'Total']
    // Calcular el punto de inicio para centrar la tabla
    const totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0)
    const tableStartX = (pageWidth - totalTableWidth) / 2
    let xPos = tableStartX
    
    headers.forEach((header, index) => {
      // Centrar cada encabezado en su columna
      const colCenterX = xPos + colWidths[index] / 2
      doc.text(header, colCenterX, yPos, { align: 'center' })
      xPos += colWidths[index]
    })
    
    yPos += 6
    doc.line(tableStartX, yPos, tableStartX + totalTableWidth, yPos)
    yPos += 4

    // Productos
    doc.setFont('helvetica', 'normal')
    doc.setFontSize((configuracionPDF.tamanoFuenteNormal || 10) - 1)
    
    productos.forEach((producto, index) => {
      // Verificar si necesitamos una nueva página
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = 20
      }

      const cantidad = producto.cantidad || 1
      const precioUnitario = producto.precioUnitario || 0
      const descuento = producto.descuentoMonto || 0
      const subtotal = (precioUnitario * cantidad) - descuento

      xPos = tableStartX
      
      // Nombre del producto (puede ser largo, usar text con maxWidth)
      const nombreProducto = producto.nombre || 'Producto sin nombre'
      const nombreLines = doc.splitTextToSize(nombreProducto, colWidths[0] - 2)
      doc.text(nombreLines[0], xPos + colWidths[0] / 2, yPos, { align: 'center' })
      if (producto.codigoInterno) {
        doc.setFontSize((configuracionPDF.tamanoFuenteNormal || 10) - 3)
        doc.setTextColor(...grayColor)
        doc.text(`Cód: ${producto.codigoInterno}`, xPos + colWidths[0] / 2, yPos + 4, { align: 'center' })
        doc.setFontSize((configuracionPDF.tamanoFuenteNormal || 10) - 1)
        doc.setTextColor(0, 0, 0)
      }
      xPos += colWidths[0]
      
      doc.text(String(cantidad), xPos + colWidths[1] / 2, yPos, { align: 'center' })
      xPos += colWidths[1]
      
      doc.text(producto.presentacion || 'Unidad', xPos + colWidths[2] / 2, yPos, { align: 'center' })
      xPos += colWidths[2]
      
      doc.text(formatCurrency(precioUnitario), xPos + colWidths[3] / 2, yPos, { align: 'center' })
      xPos += colWidths[3]
      
      if (descuento > 0) {
        doc.setTextColor(220, 38, 38)
        doc.text(`-${formatCurrency(descuento)}`, xPos + colWidths[4] / 2, yPos, { align: 'center' })
        doc.setTextColor(0, 0, 0)
      } else {
        doc.text('-', xPos + colWidths[4] / 2, yPos, { align: 'center' })
      }
      xPos += colWidths[4]
      
      doc.setFont('helvetica', 'bold')
      doc.text(formatCurrency(subtotal), xPos + colWidths[5] / 2, yPos, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      
      // Ajustar yPos según si el nombre ocupó más de una línea
      yPos += Math.max(8, nombreLines.length * 4 + 4)
    })

    // Verificar si necesitamos nueva página para los totales
    if (yPos > pageHeight - 80) {
      doc.addPage()
      yPos = 20
    }

    yPos += 5
    doc.line(tableStartX, yPos, tableStartX + totalTableWidth, yPos)
    yPos += 8

    // Totales
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(configuracionPDF.tamanoFuenteNormal || 10)
    
    const totales = [
      { label: 'Subtotal:', value: formatCurrency(cotizacion.subtotal || 0) },
      ...(cotizacion.descuento > 0 ? [{ label: 'Descuento General:', value: `-${formatCurrency(cotizacion.descuento)}` }] : []),
      { label: 'Impuesto (15.25%):', value: formatCurrency(cotizacion.impuesto || 0) },
      ...(cotizacion.icbper > 0 ? [{ label: 'ICBPER:', value: formatCurrency(cotizacion.icbper) }] : [])
    ]

    totales.forEach(({ label, value }) => {
      doc.setFont('helvetica', 'normal')
      // Centrar las etiquetas y valores
      const labelText = `${label} ${value}`
      doc.text(labelText, pageWidth / 2, yPos, { align: 'center' })
      yPos += 7
    })

    // Línea antes del total
    yPos += 2
    doc.line(tableStartX, yPos, tableStartX + totalTableWidth, yPos)
    yPos += 6

    // Total general
    doc.setFontSize((configuracionPDF.tamanoFuenteNormal || 10) + 4)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    const totalText = `TOTAL: ${formatCurrency(cotizacion.total || 0)}`
    doc.text(totalText, pageWidth / 2, yPos, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    yPos += 8

    // Observaciones
    if (cotizacion.observaciones && configuracionPDF.mostrarObservaciones !== false) {
      yPos += 5
      doc.setFontSize((configuracionPDF.tamanoFuenteNormal || 10) - 1)
      doc.setFont('helvetica', 'normal')
      doc.text('Observaciones:', pageWidth / 2, yPos, { align: 'center' })
      yPos += 6
      const observacionesLines = doc.splitTextToSize(cotizacion.observaciones, maxWidth)
      observacionesLines.forEach((line) => {
        doc.text(line, pageWidth / 2, yPos, { align: 'center' })
        yPos += 5
      })
    }

    // Pie de página (SIEMPRE visible)
    const footerY = pageHeight - 15
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100) // Gris
    doc.text(`Total de productos: ${productos.length}`, pageWidth / 2, footerY, { align: 'center' })
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth / 2, footerY + 4, { align: 'center' })

    return doc
  }

  // Función para descargar el PDF
  const handleDescargar = () => {
    try {
      const doc = generarPDF()
      const fileName = `Cotizacion_${cotizacion.cliente?.replace(/\s+/g, '_') || 'SinCliente'}_${formatDate(cotizacion.fecha).replace(/\//g, '-')}.pdf`
      doc.save(fileName)
      alert('✅ Cotización descargada como PDF exitosamente')
    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('Error al generar el PDF: ' + (error.message || 'Error desconocido'))
    }
  }

  // Función para enviar por WhatsApp (comparte el PDF)
  const handleEnviarWhatsApp = async () => {
    try {
      const doc = generarPDF()
      
      // Generar el PDF como blob
      const pdfBlob = doc.output('blob')
      const fileName = `Cotizacion_${cotizacion.cliente?.replace(/\s+/g, '_') || 'SinCliente'}_${formatDate(cotizacion.fecha).replace(/\//g, '-')}.pdf`
      const pdfFile = new File([pdfBlob], fileName, {
        type: 'application/pdf'
      })

      // Detectar si es móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      // Intentar usar la API de Web Share (funciona en móviles y algunos navegadores desktop)
      if (navigator.share) {
        try {
          // Verificar si se puede compartir el archivo
          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            // Compartir con archivo (abre el panel de compartir nativo)
            await navigator.share({
              title: `Cotización - ${cotizacion.cliente || 'Sin cliente'}`,
              text: `Cotización del ${formatDate(cotizacion.fecha)} - Total: ${formatCurrency(cotizacion.total || 0)}`,
              files: [pdfFile]
            })
            return // Si se compartió exitosamente, salir
          } else {
            // Si no se puede compartir el archivo directamente, intentar solo con texto
            const mensaje = `📋 *Cotización - ${cotizacion.cliente || 'Sin cliente'}*\n\nFecha: ${formatDate(cotizacion.fecha)}\nTotal: ${formatCurrency(cotizacion.total || 0)}\n\nEl PDF se ha descargado. Por favor, compártelo desde tu dispositivo.`
            
            try {
              await navigator.share({
                title: `Cotización - ${cotizacion.cliente || 'Sin cliente'}`,
                text: mensaje
              })
              // Después de compartir, descargar el PDF
              doc.save(fileName)
              return
            } catch (shareError) {
              // Si falla, continuar con el método alternativo
            }
          }
        } catch (error) {
          // Si el usuario cancela, no hacer nada
          if (error.name === 'AbortError') {
            return
          }
          console.error('Error al compartir:', error)
        }
      }

      // Método alternativo: Descargar PDF y abrir WhatsApp
      // Primero descargar el PDF
      doc.save(fileName)
      
      // Mensaje para WhatsApp
      const mensaje = `📋 *Cotización - ${cotizacion.cliente || 'Sin cliente'}*\n\nFecha: ${formatDate(cotizacion.fecha)}\nTotal: ${formatCurrency(cotizacion.total || 0)}\n\nEl PDF se ha descargado. Por favor, compártelo desde tu dispositivo.`
      const textoCodificado = encodeURIComponent(mensaje)

      if (isMobile) {
        // Para móvil, intentar abrir WhatsApp app
        setTimeout(() => {
          window.location.href = `whatsapp://send?text=${textoCodificado}`
        }, 500)
        
        // Fallback después de 2 segundos
        setTimeout(() => {
          window.open(`https://wa.me/?text=${textoCodificado}`, '_blank')
        }, 2500)
      } else {
        // Para desktop, abrir WhatsApp Web
        window.open(`https://wa.me/?text=${textoCodificado}`, '_blank')
        alert('📄 El PDF se ha descargado. Por favor, arrastra el archivo descargado al chat de WhatsApp Web para compartirlo.')
      }
    } catch (error) {
      console.error('Error al generar o compartir PDF:', error)
      alert('Error al generar el PDF: ' + (error.message || 'Error desconocido'))
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 9999 }}>
      <div className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
        {/* Header */}
        <div className="text-white px-6 py-4 flex items-center justify-between rounded-t-lg sticky top-0 z-10" style={{ backgroundColor: 'var(--color-primary-600)' }}>
          <div>
            <h2 className="text-2xl font-bold">COTIZACIÓN - NOTA DE VENTA</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-primary-100, rgba(255,255,255,0.8))' }}>
              {cotizacion.cliente || 'Cliente no especificado'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-primary-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Información de la Cotización */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Fecha de Cotización</p>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatDate(cotizacion.fecha)}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Fecha de Vencimiento</p>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {cotizacion.fechaVencimiento ? formatDate(cotizacion.fechaVencimiento) : 'No especificada'}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Vendedor</p>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{cotizacion.vendedor || '-'}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Estado</p>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                cotizacion.estado === 'aprobada'
                  ? 'bg-green-100 text-green-800'
                  : cotizacion.estado === 'rechazada'
                  ? 'bg-red-100 text-red-800'
                  : cotizacion.estado === 'vencida'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {cotizacion.estado === 'aprobada' ? 'Aprobada' : 
                 cotizacion.estado === 'rechazada' ? 'Rechazada' :
                 cotizacion.estado === 'vencida' ? 'Vencida' : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>INFORMACIÓN DEL CLIENTE</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cliente:</p>
                <p className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>{cotizacion.cliente || 'No especificado'}</p>
              </div>
              {cotizacion.observaciones && (
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Observaciones:</p>
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>{cotizacion.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>DETALLE DE PRODUCTOS</h3>
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--color-background)' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cantidad</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Presentación</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Precio Unitario</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Descuento</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                        No hay productos en esta cotización
                      </td>
                    </tr>
                  ) : (
                    productos.map((producto, index) => {
                      const cantidad = producto.cantidad || 1
                      const precioUnitario = producto.precioUnitario || 0
                      const descuento = producto.descuentoMonto || 0
                      const subtotal = (precioUnitario * cantidad) - descuento
                      
                      return (
                        <tr key={index} className="border-t cotizacion-row" style={{ borderColor: 'var(--color-border)' }}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium" style={{ color: 'var(--color-text)' }}>{producto.nombre || 'Producto sin nombre'}</p>
                              {producto.codigoInterno && (
                                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Código: {producto.codigoInterno}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{cantidad}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{producto.presentacion || 'Unidad'}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{formatCurrency(precioUnitario)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {descuento > 0 ? (
                              <span className="text-red-600 font-medium">-{formatCurrency(descuento)}</span>
                            ) : (
                              <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(subtotal)}</span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales */}
          <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-background)' }}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Subtotal:</span>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(cotizacion.subtotal || 0)}</span>
              </div>
              {cotizacion.descuento > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Descuento General:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(cotizacion.descuento || 0)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Impuesto (15.25%):</span>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(cotizacion.impuesto || 0)}</span>
              </div>
              {cotizacion.icbper > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>ICBPER:</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(cotizacion.icbper || 0)}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>TOTAL:</span>
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-primary-600)' }}>{formatCurrency(cotizacion.total || 0)}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
                Total de productos: {cotizacion.totalProductos || productos.length}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between items-center rounded-b-lg" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
          <div className="flex gap-3">
            <button
              onClick={handleDescargar}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
              title="Descargar cotización como archivo de texto"
            >
              <Download size={18} />
              Descargar
            </button>
            <button
              onClick={handleEnviarWhatsApp}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              title="Enviar cotización por WhatsApp"
            >
              <Send size={18} />
              Enviar por WhatsApp
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Nuevo Cliente (copiado de RealizarVenta)
const ModalNuevoCliente = ({ onClose, onSave }) => {
  const [tipoCliente, setTipoCliente] = useState('persona')
  const [formData, setFormData] = useState({
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    razonSocial: '',
    direccionPrincipal: '',
    ubigeo: '',
    telefono: '',
    correoElectronico: '',
    grupo: 'GENERAL',
    estadoSistema: 'ACTIVO',
    referencia: '',
    regimen: ''
  })
  const [mostrarMas, setMostrarMas] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGuardar = async () => {
    if (tipoCliente === 'persona') {
      if (!formData.nombres || !formData.numeroDocumento) {
        alert('Por favor complete los campos requeridos (Nombres y Número de Documento)')
        return
      }
    } else {
      if (!formData.razonSocial || !formData.numeroDocumento) {
        alert('Por favor complete los campos requeridos (Razón Social y Número de Documento)')
        return
      }
    }

    setSaving(true)
    try {
      const clienteData = {
        tipoCliente,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        nombres: tipoCliente === 'persona' ? formData.nombres : '',
        apellidos: tipoCliente === 'persona' ? formData.apellidos : '',
        razonSocial: tipoCliente === 'empresa' ? formData.razonSocial : '',
        direccionPrincipal: formData.direccionPrincipal,
        ubigeo: formData.ubigeo,
        telefono: formData.telefono,
        correoElectronico: formData.correoElectronico,
        grupo: formData.grupo,
        estadoSistema: formData.estadoSistema,
        referencia: formData.referencia,
        regimen: tipoCliente === 'empresa' ? formData.regimen : ''
      }
      
      await onSave(clienteData)
    } catch (error) {
      console.error('Error al guardar:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold">Nuevo Cliente</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-primary-700"
          >
            <X size={24} />
          </button>
            </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-4 border-b border-gray-200 pb-4">
            <button
              onClick={() => {
                setTipoCliente('persona')
                // Resetear tipo de documento a DNI cuando se cambia a persona si no es DNI ni CE
                if (formData.tipoDocumento !== 'DNI' && formData.tipoDocumento !== 'CE') {
                  handleInputChange('tipoDocumento', 'DNI')
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tipoCliente === 'persona'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Persona
            </button>
            <button
              onClick={() => {
                setTipoCliente('empresa')
                // Resetear tipo de documento a RUC cuando se cambia a empresa
                if (formData.tipoDocumento !== 'RUC') {
                  handleInputChange('tipoDocumento', 'RUC')
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tipoCliente === 'empresa'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Empresa/ Persona con Negocio (RUC)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={formData.tipoDocumento}
                  onChange={(e) => handleInputChange('tipoDocumento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {tipoCliente === 'persona' ? (
                    <>
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                    </>
                  ) : (
                    <option value="RUC">RUC</option>
                  )}
                </select>
              </div>

              {tipoCliente === 'persona' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres de Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => handleInputChange('nombres', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ingrese nombres"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razón Social *
                    </label>
                    <input
                      type="text"
                      value={formData.razonSocial}
                      onChange={(e) => handleInputChange('razonSocial', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Ingrese razón social"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Régimen
                    </label>
                    <select
                      value={formData.regimen}
                      onChange={(e) => handleInputChange('regimen', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Seleccione régimen</option>
                      <option value="Nuevo RUS (Régimen Único Simplificado)">Nuevo RUS (Régimen Único Simplificado)</option>
                      <option value="RER (Régimen Especial de Renta)">RER (Régimen Especial de Renta)</option>
                      <option value="RMT (Régimen MYPE Tributario)">RMT (Régimen MYPE Tributario)</option>
                      <option value="Régimen General">Régimen General</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Principal
                </label>
                <input
                  type="text"
                  value={formData.direccionPrincipal}
                  onChange={(e) => handleInputChange('direccionPrincipal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ingrese dirección"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ingrese teléfono"
                />
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grupo
                </label>
                <select
                  value={formData.grupo}
                  onChange={(e) => handleInputChange('grupo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="VIP">VIP</option>
                  <option value="CORPORATIVO">CORPORATIVO</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencia
                </label>
                <input
                  type="text"
                  value={formData.referencia}
                  onChange={(e) => handleInputChange('referencia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ingrese referencia"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero de Documento *
                </label>
                <input
                  type="text"
                  value={formData.numeroDocumento}
                  onChange={(e) => handleInputChange('numeroDocumento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ingrese número de documento"
                />
              </div>

              {tipoCliente === 'persona' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => handleInputChange('apellidos', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ingrese apellidos"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubigeo
                </label>
                <input
                  type="text"
                  value={formData.ubigeo}
                  onChange={(e) => handleInputChange('ubigeo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ingrese ubigeo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.correoElectronico}
                  onChange={(e) => handleInputChange('correoElectronico', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado en Sistema
                </label>
                <select
                  value={formData.estadoSistema}
                  onChange={(e) => handleInputChange('estadoSistema', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
            </div>
          </div>
        </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
                Cancelar
              </button>
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar
              </>
            )}
              </button>
            </div>
          </div>
    </div>
  )
}

export default Cotizaciones
