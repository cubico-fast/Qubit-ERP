import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, RotateCcw, X, Plus, Search, FileText, DollarSign, Calendar, User, ShoppingCart, CheckSquare, Square, ChevronLeft, ChevronRight, GripVertical, Edit, UserPlus, Scan, Image } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentDateSync, formatDate, getNetworkTime } from '../utils/dateUtils'
import { saveVenta, getProductos, getClientes, saveCliente, updateProducto } from '../utils/firebaseUtils'

const RealizarVenta = () => {
  const { formatCurrency } = useCurrency()
  const { companyId } = useAuth()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [productos, setProductos] = useState([])
  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const [verTallaColor, setVerTallaColor] = useState(false)
  const [mostrarDetalle, setMostrarDetalle] = useState(false)
  
  // Estado para clientes
  const [clientes, setClientes] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clientesSugeridos, setClientesSugeridos] = useState([])
  const [mostrarSugerenciasCliente, setMostrarSugerenciasCliente] = useState(false)
  const [indiceSeleccionadoCliente, setIndiceSeleccionadoCliente] = useState(-1)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false)
  const [showOCRModal, setShowOCRModal] = useState(false)
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
  const [editandoProducto, setEditandoProducto] = useState(null) // ID del producto que se está editando
  const [indiceEditando, setIndiceEditando] = useState(null) // Índice del producto que se está editando
  
  // Estado para el panel deslizante
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [posicionPanel, setPosicionPanel] = useState(0)
  const panelRef = useRef(null)
  const inicioArrastreRef = useRef(null)

  // Estado del formulario de facturación
  const [formData, setFormData] = useState({
    local: 'PRINCIPAL',
    almacen: 'PRINCIPAL',
    fecha: getCurrentDateSync(),
    vendedor: 'DIXONACUÑA',
    moneda: 'Soles',
    tipoCambio: 0,
    subtotal: 0,
    descuento: 0,
    impuesto: 0,
    icbper: 0,
    total: 0,
    retencion: '',
    totalRetenido: 0,
    formaPago: 'Contado',
    tipoComprobante: 'NOTA VENTA',
    direccionCliente: '',
    fechaEntrega: getCurrentDateSync(),
    numeroOrdenCompra: '',
    totalProductos: 0,
    anotacion: ''
  })

  // Obtener fecha actual de la red
  useEffect(() => {
    const updateDate = async () => {
      try {
        const networkDate = await getNetworkTime()
        setCurrentDate(networkDate)
        const fechaStr = networkDate.toISOString().split('T')[0]
        setFormData(prev => ({
          ...prev,
          fecha: fechaStr,
          fechaEntrega: fechaStr
        }))
      } catch (error) {
        console.error('Error al obtener fecha de la red:', error)
      }
    }
    updateDate()
    const interval = setInterval(updateDate, 60000)
    return () => clearInterval(interval)
  }, [])

  // Cargar productos
  useEffect(() => {
    const loadProductos = async () => {
      try {
        const productosData = await getProductos(companyId)
        setProductos(productosData)
      } catch (error) {
        console.error('Error al cargar productos:', error)
      }
    }
    if (companyId) {
      loadProductos()
    }
  }, [companyId])

  // Cargar clientes
  useEffect(() => {
    const loadClientes = async () => {
      try {
        const clientesData = await getClientes(companyId)
        setClientes(clientesData || [])
      } catch (error) {
        console.error('Error al cargar clientes:', error)
        setClientes([]) // Asegurar que siempre sea un array
      }
    }
    if (companyId) {
      loadClientes()
    }
  }, [companyId])

  // Filtrar productos según la búsqueda
  useEffect(() => {
    if (busquedaProducto.trim() === '') {
      setProductosSugeridos([])
      setMostrarSugerencias(false)
      return
    }

    const terminoBusqueda = busquedaProducto.toLowerCase().trim()
    const palabras = terminoBusqueda.split(' ').filter(p => p.length > 0)

    // Filtrar productos que coincidan con todas las palabras
    const productosFiltrados = productos.filter(producto => {
      const nombreProducto = (producto.nombre || '').toLowerCase()
      const descripcionProducto = (producto.descripcion || '').toLowerCase()
      const codigoInterno = (producto.codigoInterno || '').toLowerCase()
      const codigoBarra = (producto.codigoBarra || '').toLowerCase()

      // Verificar si todas las palabras están presentes en algún campo
      return palabras.every(palabra => 
        nombreProducto.includes(palabra) ||
        descripcionProducto.includes(palabra) ||
        codigoInterno.includes(palabra) ||
        codigoBarra.includes(palabra)
      )
    }).slice(0, 10) // Limitar a 10 sugerencias

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

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (busquedaRef.current && !busquedaRef.current.contains(event.target)) {
        setMostrarSugerencias(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calcular totales cuando cambian los productos seleccionados
  useEffect(() => {
    const TASA_IMPUESTO = 0.1525 // Impuesto a la renta 15.25%
    
    // Calcular el total de todos los productos (precio con impuesto incluido × cantidad - descuento)
    const totalProductos = productosSeleccionados.reduce((sum, p) => {
      const precioConImpuesto = parseFloat(p.precio) || 0
      const cantidad = parseInt(p.cantidad) || 1
      const descuento = parseFloat(p.descuento) || 0
      return sum + ((precioConImpuesto * cantidad) - descuento)
    }, 0)
    
    // Descuento general de la venta (adicional al descuento por producto)
    const descuentoGeneral = parseFloat(formData.descuento) || 0
    
    // Total después de descuento general
    const totalDespuesDescuento = totalProductos - descuentoGeneral
    
    // Subtotal sin impuesto = Total - (Total × tasa de impuesto)
    const subtotalSinImpuesto = totalDespuesDescuento - (totalDespuesDescuento * TASA_IMPUESTO)
    
    // Impuesto = Total - Subtotal
    const impuesto = totalDespuesDescuento - subtotalSinImpuesto
    
    // ICBPER (Impuesto a la Bolsa Plástica)
    const icbper = parseFloat(formData.icbper) || 0
    
    // Total final = subtotal + impuesto + ICBPER (que debe ser igual a totalDespuesDescuento + ICBPER)
    const total = subtotalSinImpuesto + impuesto + icbper

    setFormData(prev => ({
      ...prev,
      subtotal: subtotalSinImpuesto,
      impuesto,
      total,
      totalProductos: productosSeleccionados.length
    }))
  }, [productosSeleccionados, formData.descuento, formData.icbper])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAgregarProducto = () => {
    // Aquí se abriría un modal para buscar y seleccionar productos
    // Por ahora, agregamos un producto de ejemplo
    const nuevoProducto = {
      id: Date.now(),
      nombre: 'Producto',
      cantidad: 1,
      precio: 0,
      subtotal: 0
    }
    setProductosSeleccionados([...productosSeleccionados, nuevoProducto])
  }

  const handleEliminarProducto = (index) => {
    setProductosSeleccionados(productosSeleccionados.filter((_, i) => i !== index))
    // Si se elimina el producto que se estaba editando, cancelar la edición
    if (indiceEditando === index) {
      setEditandoProducto(null)
      setIndiceEditando(null)
      setProductoSeleccionado(null)
      setPanelAbierto(false)
    } else if (indiceEditando !== null && indiceEditando > index) {
      // Ajustar el índice si se eliminó un producto antes del que se está editando
      setIndiceEditando(indiceEditando - 1)
    }
  }

  // Manejar edición de producto
  const handleEditarProducto = (producto, index) => {
    // Buscar el producto original en la lista de productos o usar el guardado
    const productoOriginal = productos.find(p => p.id === producto.id) || producto.productoOriginal || producto
    
    // Cargar los datos del producto en el panel de edición
    setProductoSeleccionado(productoOriginal)
    setCantidadProducto(String(producto.cantidad || 1))
    setPrecioUnitario(producto.precio || 0)
    setCostoUnitario(producto.productoOriginal?.precioCompra || productoOriginal?.precioCompra || 0)
    setPrecioUnitarioSeleccionado(producto.precio || 0)
    setDescuentoPorcentaje(producto.descuentoPorcentaje || 0)
    setDescuentoMonto(producto.descuento || 0)
    
    // Buscar la presentación seleccionada
    let pres = null
    if (productoOriginal?.presentaciones) {
      pres = productoOriginal.presentaciones.find(p => p.presentacion === producto.presentacion) || null
    }
    if (!pres && productoOriginal?.presentaciones?.length > 0) {
      pres = productoOriginal.presentaciones[0]
    }
    setPresentacionSeleccionada(pres)
    
    // Marcar que estamos editando este producto usando el índice para identificación única
    setEditandoProducto(producto.id)
    setIndiceEditando(index)
    
    // Abrir el panel
    setPanelAbierto(true)
    
    // Enfocar el buscador después de un pequeño delay para que el panel se abra
    setTimeout(() => {
      busquedaRef.current?.focus()
    }, 100)
  }

  // Manejar selección de producto desde sugerencias
  const handleSeleccionarProducto = (producto) => {
    // Mostrar el panel de detalles del producto
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
    setPanelAbierto(true) // Abrir el panel cuando se selecciona un producto

    setBusquedaProducto('')
    setMostrarSugerencias(false)
  }

  // Calcular subtotal del item cuando cambian cantidad, precio o descuento
  // El precio ingresado ya incluye el impuesto, por lo que debemos extraerlo
  useEffect(() => {
    if (productoSeleccionado) {
      // El precio ingresado incluye el impuesto (15.25%)
      // Extraer el impuesto: precio con impuesto - (precio con impuesto * tasa de impuesto)
      const TASA_IMPUESTO = 0.1525 // 15.25%
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

  // Manejar cambio de presentación
  const handleCambiarPresentacion = (presentacion) => {
    setPresentacionSeleccionada(presentacion)
    const nuevoPrecio = presentacion?.precioVenta || productoSeleccionado?.precio || 0
    setPrecioUnitarioSeleccionado(nuevoPrecio)
    setPrecioUnitario(nuevoPrecio)
  }

  // Agregar o actualizar producto a la venta
  const handleAgregarProductoAVenta = () => {
    if (!productoSeleccionado) return

    // Validar que haya cantidad
    const cantidadNumerica = parseFloat(cantidadProducto) || 0
    if (cantidadNumerica <= 0 || cantidadProducto === '' || cantidadProducto === null) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    // Validar que haya precio
    if (precioUnitarioSeleccionado <= 0) {
      alert('El precio unitario debe ser mayor a 0')
      return
    }

    const TASA_IMPUESTO = 0.1525 // Impuesto a la renta 15.25%
    
    // El precio ingresado incluye el impuesto, extraer el precio sin impuesto
    // Fórmula: precio sin impuesto = precio con impuesto - (precio con impuesto * tasa)
    const precioSinImpuesto = precioUnitarioSeleccionado - (precioUnitarioSeleccionado * TASA_IMPUESTO)
    const subtotalSinImpuesto = (precioSinImpuesto * cantidadNumerica) - descuentoMonto

    // Si estamos editando un producto, actualizarlo usando el índice
    if (editandoProducto !== null && indiceEditando !== null) {
      setProductosSeleccionados(productosSeleccionados.map((p, index) => {
        // Buscar el producto que coincide con el índice que estamos editando
        if (index === indiceEditando) {
          return { 
            ...p, 
            cantidad: cantidadNumerica, 
            precio: precioUnitarioSeleccionado, // Precio con impuesto (para mostrar)
            precioSinImpuesto: precioSinImpuesto, // Precio sin impuesto (para cálculos)
            subtotal: Math.max(0, subtotalSinImpuesto),
            descuento: descuentoMonto,
            descuentoPorcentaje: descuentoPorcentaje,
            presentacion: presentacionSeleccionada?.presentacion || 'Unidad',
            nombre: productoSeleccionado.nombre // Asegurar que el nombre se mantiene
          }
        }
        return p
      }))
      
      // Limpiar estado de edición
      setEditandoProducto(null)
      setIndiceEditando(null)
    } else {
      // Buscar si el producto ya existe con la misma presentación
      const productoExistente = productosSeleccionados.find(p => 
        p.id === productoSeleccionado.id && 
        p.presentacion === (presentacionSeleccionada?.presentacion || 'Unidad')
      )
      
      if (productoExistente) {
        // Si el producto ya existe, aumentar la cantidad y recalcular subtotal
        const nuevaCantidad = productoExistente.cantidad + cantidadNumerica
        const nuevoPrecioSinImpuesto = precioUnitarioSeleccionado - (precioUnitarioSeleccionado * TASA_IMPUESTO)
        const nuevoSubtotalSinImpuesto = (nuevoPrecioSinImpuesto * nuevaCantidad) - descuentoMonto
        
        setProductosSeleccionados(productosSeleccionados.map(p => 
          p.id === productoSeleccionado.id && p.presentacion === (presentacionSeleccionada?.presentacion || 'Unidad')
            ? { 
                ...p, 
                cantidad: nuevaCantidad, 
                precio: precioUnitarioSeleccionado, // Precio con impuesto (para mostrar)
                precioSinImpuesto: nuevoPrecioSinImpuesto, // Precio sin impuesto (para cálculos)
                subtotal: Math.max(0, nuevoSubtotalSinImpuesto),
                descuento: descuentoMonto,
                descuentoPorcentaje: descuentoPorcentaje
              }
            : p
        ))
      } else {
        // Agregar nuevo producto con toda la información
        const nuevoProducto = {
          id: productoSeleccionado.id,
          nombre: productoSeleccionado.nombre,
          cantidad: cantidadNumerica,
          precio: precioUnitarioSeleccionado, // Precio con impuesto (para mostrar)
          precioSinImpuesto: precioSinImpuesto, // Precio sin impuesto (para cálculos)
          subtotal: Math.max(0, subtotalSinImpuesto),
          descuento: descuentoMonto,
          descuentoPorcentaje: descuentoPorcentaje,
          presentacion: presentacionSeleccionada?.presentacion || 'Unidad',
          productoOriginal: productoSeleccionado // Guardar referencia completa del producto
        }
        setProductosSeleccionados([...productosSeleccionados, nuevoProducto])
      }
    }

    // Limpiar formulario después de agregar/editar
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
    setEditandoProducto(null) // Asegurar que se limpia el estado de edición
    setIndiceEditando(null) // Limpiar también el índice
    busquedaRef.current?.focus()
  }

  // Manejar selección de cliente
  const handleSeleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    const nombreCompleto = `${cliente.nombres || cliente.nombre || ''} ${cliente.apellidos || ''}`.trim()
    setBusquedaCliente(nombreCompleto)
    setMostrarSugerenciasCliente(false)
    
    // Actualizar formData con los datos del cliente
    setFormData(prev => ({
      ...prev,
      cliente: nombreCompleto,
      clienteId: cliente.id,
      direccionCliente: cliente.direccionPrincipal || cliente.direccion || ''
    }))
  }

  // Cerrar sugerencias de cliente al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (busquedaClienteRef.current && !busquedaClienteRef.current.contains(event.target)) {
        setMostrarSugerenciasCliente(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Manejar teclado en el buscador
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

  // Toggle del panel
  const togglePanel = () => {
    setPanelAbierto(!panelAbierto)
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
    
    // Si se arrastra hacia la izquierda más de 80px, ocultar el panel
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

  // Manejar fin del arrastre
  const handleMouseUp = () => {
    setArrastrando(false)
    inicioArrastreRef.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleGuardar = async () => {
    // Validaciones
    if (productosSeleccionados.length === 0) {
      alert('Debe agregar al menos un producto a la venta')
      return
    }

    if (!formData.vendedor || formData.vendedor.trim() === '') {
      alert('Debe seleccionar un vendedor')
      return
    }

    try {
      // Preparar productos para guardar (sin referencias circulares)
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

      // Calcular totales finales
      const TASA_IMPUESTO = 0.1525 // Impuesto a la renta 15.25%
      
      // Calcular el total de todos los productos (precio con impuesto incluido × cantidad - descuento)
      const totalProductos = productosSeleccionados.reduce((sum, p) => {
        const precioConImpuesto = parseFloat(p.precio) || 0
        const cantidad = parseInt(p.cantidad) || 1
        const descuento = parseFloat(p.descuento) || 0
        return sum + ((precioConImpuesto * cantidad) - descuento)
      }, 0)
      
      const descuentoGeneral = parseFloat(formData.descuento) || 0
      const totalDespuesDescuento = totalProductos - descuentoGeneral
      
      // Subtotal sin impuesto = Total - (Total × tasa de impuesto)
      const subtotalFinal = totalDespuesDescuento - (totalDespuesDescuento * TASA_IMPUESTO)
      
      // Base imponible = subtotal (precio sin impuesto)
      const baseImponible = subtotalFinal
      
      // Impuesto = Total - Subtotal
      const impuestoFinal = totalDespuesDescuento - subtotalFinal
      
      const icbperFinal = parseFloat(formData.icbper) || 0
      const totalFinal = subtotalFinal + impuestoFinal + icbperFinal

      // Estructura completa de la venta
      const ventaData = {
        // Información básica
        fecha: formData.fecha,
        fechaEntrega: formData.fechaEntrega,
        estado: 'Completada',
        
        // Información del vendedor y local
        vendedor: formData.vendedor,
        local: formData.local,
        almacen: formData.almacen,
        
        // Información de facturación
        moneda: formData.moneda,
        tipoCambio: parseFloat(formData.tipoCambio) || 0,
        tipoComprobante: formData.tipoComprobante,
        
        // Productos
        productos: productosParaGuardar,
        totalProductos: productosSeleccionados.length,
        
        // Totales
        subtotal: subtotalFinal,
        descuento: descuentoGeneral,
        baseImponible: baseImponible,
        impuesto: impuestoFinal,
        icbper: icbperFinal,
        total: totalFinal,
        
        // Retención
        retencion: formData.retencion || '',
        totalRetenido: parseFloat(formData.totalRetenido) || 0,
        
        // Forma de pago
        formaPago: formData.formaPago,
        
        // Información adicional
        direccionCliente: formData.direccionCliente || '',
        numeroOrdenCompra: formData.numeroOrdenCompra || '',
        anotacion: formData.anotacion || '',
        
        // Información del cliente (si se agrega en el futuro)
        cliente: formData.cliente || '',
        clienteId: formData.clienteId || '',
        
        // Metadatos
        createdAt: new Date().toISOString()
      }

      // Guardar en Firebase
      await saveVenta(ventaData, companyId)
      
      // Actualizar el stock de los productos vendidos
      const productos = await getProductos(companyId)
      
      for (const productoVendido of productosSeleccionados) {
        const productoId = productoVendido.id
        const cantidadVendida = parseInt(productoVendido.cantidad) || 1
        
        // Buscar el producto original en la base de datos
        const productoOriginal = productos.find(p => p.id === productoId)
        
        if (productoOriginal) {
          const stockActual = productoOriginal.stock || 0
          const nuevoStock = Math.max(0, stockActual - cantidadVendida) // No permitir stock negativo
          
          // Actualizar el stock del producto
          await updateProducto(productoId, {
            stock: nuevoStock
          }, companyId)
        }
      }
      
      // Mostrar mensaje de éxito
      alert('✅ Venta guardada exitosamente. El stock de los productos ha sido actualizado.')
      
      // Preguntar si desea ver el registro o hacer otra venta
      const verRegistro = window.confirm('¿Deseas ver el registro de ventas ahora?')
      
      if (verRegistro) {
        navigate('/ventas')
      } else {
        // Reiniciar formulario si no quiere ir al registro
        setFormData({
        local: 'PRINCIPAL',
        almacen: 'PRINCIPAL',
        fecha: getCurrentDateSync(),
        vendedor: 'DIXONACUÑA',
        moneda: 'Soles',
        tipoCambio: 0,
        subtotal: 0,
        descuento: 0,
        impuesto: 0,
        icbper: 0,
        total: 0,
        retencion: '',
        totalRetenido: 0,
        formaPago: 'Contado',
        tipoComprobante: 'NOTA VENTA',
        direccionCliente: '',
        fechaEntrega: getCurrentDateSync(),
        numeroOrdenCompra: '',
        totalProductos: 0,
        anotacion: '',
        cliente: '',
        clienteId: ''
      })
        setProductosSeleccionados([])
        setProductoSeleccionado(null)
        setPanelAbierto(false)
        setBusquedaProducto('')
      }
    } catch (error) {
      console.error('Error al guardar venta:', error)
      alert('Error al guardar la venta: ' + (error.message || 'Error desconocido'))
    }
  }

  const handleReiniciar = () => {
    if (window.confirm('¿Está seguro de que desea reiniciar el formulario?')) {
      setFormData({
        local: 'PRINCIPAL',
        almacen: 'PRINCIPAL',
        fecha: getCurrentDateSync(),
        vendedor: 'DIXONACUÑA',
        moneda: 'Soles',
        tipoCambio: 0,
        subtotal: 0,
        descuento: 0,
        impuesto: 0,
        icbper: 0,
        total: 0,
        retencion: '',
        totalRetenido: 0,
        formaPago: 'Contado',
        tipoComprobante: 'NOTA VENTA',
        direccionCliente: '',
        fechaEntrega: getCurrentDateSync(),
        numeroOrdenCompra: '',
        totalProductos: 0,
        anotacion: ''
      })
      setProductosSeleccionados([])
    }
  }

  return (
    <div className="min-h-screen pb-20 w-full" style={{ width: '100%', maxWidth: '100%', backgroundColor: 'var(--color-background)' }}>
      {/* Breadcrumb */}
      <div className="border-b px-4 sm:px-6 py-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <nav className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span style={{ color: 'var(--color-text)' }}>Ventas</span> / <span style={{ color: 'var(--color-text)' }}>Realizar venta</span>
        </nav>
      </div>

      <div className="flex flex-col lg:flex-row overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Sección Izquierda - Detalles de Venta */}
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

            {/* Buscador de Cliente con Autocompletado */}
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
                    
                    {/* Lista de Sugerencias de Clientes */}
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

                    {/* Mensaje cuando no hay resultados */}
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
              
              {/* Buscador de Productos con Autocompletado */}
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

                {/* Lista de Sugerencias */}
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
                                <span>Stock: {producto.stock}</span>
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

                {/* Mensaje cuando no hay resultados */}
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

            {/* Panel de Detalles del Producto Seleccionado - Deslizante */}
            {productoSeleccionado && (
              <div 
                ref={panelRef}
                className={`mt-6 border border-gray-200 rounded-lg bg-white transition-all duration-300 ${
                  panelAbierto ? 'block' : 'hidden'
                }`}
                style={{ width: posicionPanel > 0 ? `${posicionPanel}px` : '100%' }}
              >
                {/* Barra de arrastre */}
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
                    title={panelAbierto ? 'Ocultar panel' : 'Mostrar panel'}
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
                  {/* Imagen del producto */}
                  <div>
                    {productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 0 && (
                      <div className="mb-4">
                        <img
                          src={productoSeleccionado.imagenes[0].preview}
                          alt={productoSeleccionado.nombre}
                          className="w-32 h-32 object-cover rounded border border-gray-200"
                        />
                        <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                          ver mas..
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="space-y-3">
                    {/* Cantidad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad:</label>
                      <input
                        type="number"
                        min="1"
                        max={productoSeleccionado.stock || 999}
                        value={cantidadProducto}
                        onChange={(e) => {
                          const valor = e.target.value;
                          // Permitir valores vacíos o números válidos
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

                    {/* Total de stock */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total de stock:</label>
                      <p className="text-sm text-gray-900">{productoSeleccionado.stock || 0} UNIDAD</p>
                    </div>
                  </div>
                </div>

                {/* Presentaciones disponibles */}
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

                {/* Precio unitario */}
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

                {/* Costo unitario */}
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

                {/* Precio unitario seleccionado */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario seleccionado:</label>
                  <input
                    type="text"
                    value={formatCurrency(precioUnitarioSeleccionado)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                  />
                </div>

                {/* Descuento */}
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

                {/* Total del item */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total:</label>
                  <input
                    type="text"
                    value={formatCurrency((precioUnitarioSeleccionado * (parseFloat(cantidadProducto) || 0)) - descuentoMonto)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 font-semibold"
                  />
                </div>

                {/* Botón Agregar/Actualizar */}
                <button
                  onClick={handleAgregarProductoAVenta}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editandoProducto ? 'Actualizar' : 'Agregar'}
                </button>
                </div>
              </div>
            )}

            {/* Botón para mostrar panel cuando está oculto */}
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
              {/* Mostrar Total arriba del carrito */}
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

        {/* Sección Derecha - Facturación Electrónica */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l p-4 sm:p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">FACTURACION ELECTRONICA</h3>
          
          <div className="space-y-3">
            {/* Fecha */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Fecha:</label>
              <input
                type="text"
                value={formatDate(formData.fecha)}
                readOnly
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm sm:text-right bg-gray-50"
              />
            </div>

            {/* Vendedor */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Vendedor:</label>
              <select
                value={formData.vendedor}
                onChange={(e) => handleInputChange('vendedor', e.target.value)}
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="DIXONACUÑA">DIXONACUÑA</option>
                <option value="OTRO">OTRO</option>
              </select>
            </div>

            {/* Moneda */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Moneda:</label>
              <select
                value={formData.moneda}
                onChange={(e) => handleInputChange('moneda', e.target.value)}
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="Soles">Soles</option>
                <option value="Dolares">Dólares</option>
              </select>
            </div>

            {/* Tipo de cambio */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Tipo de cambio:</label>
              <input
                type="text"
                value={formatCurrency(formData.tipoCambio)}
                readOnly
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50"
              />
            </div>

            {/* Subtotal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Subtotal:</label>
              <input
                type="text"
                value={formatCurrency(formData.subtotal)}
                readOnly
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50"
              />
            </div>

            {/* Descuento */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Descuento:</label>
              <input
                type="number"
                value={formData.descuento}
                onChange={(e) => handleInputChange('descuento', parseFloat(e.target.value) || 0)}
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-red-50"
              />
            </div>

            {/* Impuesto */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Impuesto (15.25%):</label>
              <input
                type="text"
                value={formatCurrency(formData.impuesto)}
                readOnly
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50"
              />
            </div>

            {/* ICBPER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">ICBPER:</label>
              <input
                type="number"
                value={formData.icbper}
                onChange={(e) => handleInputChange('icbper', parseFloat(e.target.value) || 0)}
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-gray-300 pt-2">
              <label className="text-sm font-semibold text-gray-900">Total:</label>
              <input
                type="text"
                value={formatCurrency(formData.total)}
                readOnly
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right font-semibold bg-yellow-50"
              />
            </div>

            {/* Retención */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Retención:</label>
              <select
                value={formData.retencion}
                onChange={(e) => handleInputChange('retencion', e.target.value)}
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">Seleccione</option>
                <option value="IGV">IGV</option>
                <option value="Renta">Renta</option>
              </select>
            </div>

            {/* Total Retenido */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Total Retenido:</label>
              <input
                type="text"
                value={formData.totalRetenido.toFixed(2)}
                readOnly
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50"
              />
            </div>

            {/* Forma de Pago */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Forma de Pago:</label>
              <select
                value={formData.formaPago}
                onChange={(e) => handleInputChange('formaPago', e.target.value)}
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="Contado">Contado</option>
                <option value="Credito">Crédito</option>
              </select>
            </div>

            {/* Tipo comprobante */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Tipo comprobante:</label>
              <select
                value={formData.tipoComprobante}
                onChange={(e) => handleInputChange('tipoComprobante', e.target.value)}
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="NOTA VENTA">NOTA VENTA</option>
                <option value="FACTURA">FACTURA</option>
                <option value="BOLETA">BOLETA</option>
              </select>
            </div>

            {/* Dirección de cliente */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Dirección de cliente:</label>
              <select
                value={formData.direccionCliente}
                onChange={(e) => handleInputChange('direccionCliente', e.target.value)}
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">Seleccione</option>
                <option value="Dirección 1">Dirección 1</option>
              </select>
            </div>

            {/* Fecha de entrega */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Fecha de entrega:</label>
              <input
                type="text"
                value={formatDate(formData.fechaEntrega)}
                readOnly
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50"
              />
            </div>

            {/* N° de Orden compra */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">N° de Orden compra:</label>
              <input
                type="text"
                value={formData.numeroOrdenCompra}
                onChange={(e) => handleInputChange('numeroOrdenCompra', e.target.value)}
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Total de productos */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Total de productos:</label>
              <input
                type="text"
                value={formData.totalProductos}
                readOnly
                className="w-full sm:w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right bg-gray-50"
              />
            </div>

            {/* Botón Redactar anotación */}
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 mt-4">
              <Plus size={16} />
              Redactar anotación
            </button>
          </div>
        </div>
      </div>

      {/* Footer con botones */}
      <div className="fixed bottom-0 left-0 right-0 border-t px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowOCRModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            title="Lector de Imagen OCR - Extraer datos de venta desde imágenes"
          >
            <Scan size={18} />
            LECTOR DE IMAGEN
          </button>
          <button
            onClick={handleGuardar}
            className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold shadow-md"
            title="Guardar la venta en el registro (F6)"
          >
            <Save size={20} />
            Guardar Venta
          </button>
          <button
            onClick={handleReiniciar}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Reiniciar
          </button>
          <button className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
            <X size={18} />
            Cancelar
          </button>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">
            Tipo Cambio Sunat
          </button>
          <button className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
            EMISION A SUNAT
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
              // Recargar lista de clientes
              const clientesData = await getClientes(companyId)
              setClientes(clientesData)
              // Seleccionar el nuevo cliente automáticamente
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

      {/* Modal de Lector de Imagen OCR */}
      {showOCRModal && (
        <ModalOCR
          onClose={() => setShowOCRModal(false)}
          onProcess={(datosExtraidos) => {
            // Procesar datos extraídos del OCR para la venta
            console.log('Datos extraídos del OCR:', datosExtraidos)
            
            // Si hay cliente en los datos, buscarlo y seleccionarlo
            if (datosExtraidos.cliente) {
              const clienteEncontrado = clientes.find(c => 
                c.nombre?.toLowerCase().includes(datosExtraidos.cliente.toLowerCase()) ||
                c.nombres?.toLowerCase().includes(datosExtraidos.cliente.toLowerCase()) ||
                c.razonSocial?.toLowerCase().includes(datosExtraidos.cliente.toLowerCase())
              )
              if (clienteEncontrado) {
                handleSeleccionarCliente(clienteEncontrado)
              }
            }
            
            // Si hay productos, agregarlos a la venta
            if (datosExtraidos.productos && datosExtraidos.productos.length > 0) {
              // TODO: Implementar lógica para agregar productos desde OCR
              alert('✅ Datos extraídos. Los productos se agregarán próximamente.')
            }
            
            setShowOCRModal(false)
          }}
        />
      )}
    </div>
  )
}

// Componente Modal de Nuevo Cliente
const ModalNuevoCliente = ({ onClose, onSave }) => {
  const [tipoCliente, setTipoCliente] = useState('persona') // 'persona' o 'empresa'
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
    // Validaciones básicas
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold">Nuevo Cliente</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-primary-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Tipo de Cliente */}
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

          {/* Formulario */}
          <div className="grid grid-cols-2 gap-4">
            {/* Columna Izquierda */}
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
                <>
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
                </>
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

            {/* Columna Derecha */}
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

          {/* Botón Ver más */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => setMostrarMas(!mostrarMas)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus size={18} />
              Ver más
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
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

// Componente Modal de Lector de Imagen OCR
const ModalOCR = ({ onClose, onProcess }) => {
  const [imagen, setImagen] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [resultadoOCR, setResultadoOCR] = useState(null)
  const fileInputRef = useRef(null)

  const handleSeleccionarImagen = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setImagen(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagenPreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        alert('Por favor selecciona un archivo de imagen válido')
      }
    }
  }

  const handleProcesarOCR = async () => {
    if (!imagen) {
      alert('Por favor selecciona una imagen primero')
      return
    }

    setProcesando(true)
    try {
      // TODO: Integrar con servicio de OCR (Tesseract.js, Google Vision API, etc.)
      // Por ahora, simulamos el procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulación de datos extraídos
      const datosSimulados = {
        cliente: 'Cliente Extraído',
        fecha: getCurrentDateSync(),
        productos: [
          { nombre: 'Producto 1', cantidad: 2, precio: 100 },
          { nombre: 'Producto 2', cantidad: 1, precio: 200 }
        ],
        total: 400
      }
      
      setResultadoOCR(datosSimulados)
      alert('✅ Imagen procesada exitosamente. Los datos extraídos se mostrarán a continuación.')
    } catch (error) {
      console.error('Error al procesar OCR:', error)
      alert('Error al procesar la imagen. Por favor, intenta nuevamente.')
    } finally {
      setProcesando(false)
    }
  }

  const handleUsarDatos = () => {
    if (resultadoOCR) {
      onProcess(resultadoOCR)
    }
  }

  const handleLimpiar = () => {
    setImagen(null)
    setImagenPreview(null)
    setResultadoOCR(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <Scan size={24} style={{ color: 'var(--color-primary-600)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              Lector de Imagen OCR
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" style={{ backgroundColor: 'var(--color-primary-50)', borderColor: 'var(--color-primary-200)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>
              <strong>Instrucciones:</strong> Sube una imagen de una factura o comprobante de venta. El sistema extraerá automáticamente los datos como cliente, productos, precios y totales.
            </p>
          </div>

          {/* Selector de imagen */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Seleccionar Imagen
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSeleccionarImagen}
                className="hidden"
                id="ocr-image-input-venta"
              />
              <label
                htmlFor="ocr-image-input-venta"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors flex items-center gap-2"
              >
                <Image size={18} />
                Seleccionar Imagen
              </label>
              {imagen && (
                <button
                  onClick={handleLimpiar}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Preview de imagen */}
          {imagenPreview && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Vista Previa
              </label>
              <div className="border rounded-lg p-4 flex justify-center" style={{ borderColor: 'var(--color-border)' }}>
                <img
                  src={imagenPreview}
                  alt="Preview"
                  className="max-w-full max-h-64 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Botón de procesar */}
          {imagen && !resultadoOCR && (
            <div className="flex justify-center">
              <button
                onClick={handleProcesarOCR}
                disabled={procesando}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {procesando ? (
                  <>
                    <RotateCcw size={18} className="animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Scan size={18} />
                    Procesar Imagen
                  </>
                )}
              </button>
            </div>
          )}

          {/* Resultado del OCR */}
          {resultadoOCR && (
            <div className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                Datos Extraídos:
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Cliente:</strong> {resultadoOCR.cliente}</p>
                <p><strong>Fecha:</strong> {formatDate(resultadoOCR.fecha)}</p>
                <p><strong>Productos:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  {resultadoOCR.productos?.map((p, i) => (
                    <li key={i}>
                      {p.nombre} - Cantidad: {p.cantidad} - Precio: S/ {p.precio}
                    </li>
                  ))}
                </ul>
                <p><strong>Total:</strong> S/ {resultadoOCR.total}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancelar
          </button>
          {resultadoOCR && (
            <button
              onClick={handleUsarDatos}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
            >
              <Plus size={18} />
              Usar Datos en la Venta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RealizarVenta

