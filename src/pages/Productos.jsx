import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Edit, Trash2, Package, TrendingUp, DollarSign, ShoppingCart, Columns, X, HelpCircle, Info, Upload, Image as ImageIcon, Copy } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'
import { getProductos, saveProducto, updateProducto, deleteProducto, getUnidadesMedida, saveUnidadMedida } from '../utils/firebaseUtils'
import { getCurrentDate, getCurrentDateSync, formatDate } from '../utils/dateUtils'

const Productos = () => {
  const { formatCurrency } = useCurrency()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [showColumnsModal, setShowColumnsModal] = useState(false)
  const [showNewProductModal, setShowNewProductModal] = useState(false)
  const [showNewUnitModal, setShowNewUnitModal] = useState(false)
  const [showNewBrandModal, setShowNewBrandModal] = useState(false)
  const [showMoreFields, setShowMoreFields] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImageProduct, setSelectedImageProduct] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('general')
  const [newBrand, setNewBrand] = useState('')
  const [marcas, setMarcas] = useState(['Marca 1', 'Marca 2', 'Marca 3'])
  const [editingProductId, setEditingProductId] = useState(null)
  const [unidadesMedida, setUnidadesMedida] = useState([])
  const [newUnit, setNewUnit] = useState({
    nombre: '',
    abreviatura: '',
    cantidad: '',
    presentacion: 'SI'
  })
  const [newProduct, setNewProduct] = useState({
    codigoInterno: '',
    codigoBarra: '',
    nombre: '',
    descripcion: '',
    categoria: 'Estándar',
    stockMinimo: 0,
    ventaConInventario: 'Si',
    stockInicial: 0,
    almacen: 'PRINCIPAL',
    precio: 0,
    stock: 0,
    vendidos: 0,
    estado: 'Activo',
    unidad: 'Unidad',
    precioCompra: 0,
    precioVenta: 0,
    margen: 0,
    imagenes: [],
    tallas: [], // Array de objetos { nombre: string, seleccionado: boolean }
    colores: [],
    nuevaTalla: '',
    nuevoColor: '',
    nuevoColorNombre: '',
    costoUnitario: 0,
    presentaciones: [{ presentacion: 'Unidad', cantidad: 1, precioUnitario: '', precioVenta: 0 }],
    mostrarStockEmbalaje: '',
    marca: '',
    impuesto: 'IGV',
    impuestoPorcentaje: 18,
    cualidad: 'MEDIBLE',
    afectacionImpuesto: 'GRAVABLE',
    productoBolsaICBPER: 'No',
    trabajaTallaColor: 'Si'
  })
  
  // Definir todas las columnas disponibles
  const allColumns = [
    { key: 'acciones', label: 'Acciones', required: true },
    { key: 'id', label: 'ID', required: false },
    { key: 'imagenes', label: 'Imágenes', required: false },
    { key: 'nombre', label: 'Nombre del Producto', required: true },
    { key: 'descripcion', label: 'Descripción', required: false },
    { key: 'categoria', label: 'Categoría', required: false },
    { key: 'precio', label: 'Precio', required: false },
    { key: 'stock', label: 'Stock', required: false },
    { key: 'vendidos', label: 'Vendidos', required: false },
    { key: 'estado', label: 'Estado', required: false },
  ]

  // Estado inicial de columnas visibles (cargar desde localStorage o usar valores por defecto)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('productos_visible_columns')
    if (saved) {
      return JSON.parse(saved)
    }
    // Valores por defecto: todas las columnas visibles excepto descripción
    return {
      acciones: true,
      id: true,
      imagenes: true,
      nombre: true,
      descripcion: false,
      categoria: true,
      precio: true,
      stock: true,
      vendidos: true,
      estado: true,
    }
  })

  // Cargar productos desde Firebase al montar el componente
  useEffect(() => {
    const loadProductos = async () => {
      try {
        setLoading(true)
        const productosData = await getProductos()
        
        // Asignar numeroProducto a productos que no lo tengan
        let maxNumero = 0
        const productosConNumeros = productosData.map(producto => {
          if (producto.numeroProducto) {
            maxNumero = Math.max(maxNumero, producto.numeroProducto)
            return producto
          }
          return producto
        })
        
        // Asignar números a productos que no los tienen
        let contador = maxNumero
        const productosNormalizados = productosConNumeros.map(producto => {
          if (!producto.numeroProducto) {
            contador++
            return {
              ...producto,
              numeroProducto: contador
            }
          }
          return producto
        })
        
        // Normalizar presentaciones: convertir precioUnitario 0 a '' para mostrar
        // Y actualizar el precio principal si es 0 pero hay presentaciones con precio
        const productosFinales = productosNormalizados.map(producto => {
          let precioFinal = producto.precio || 0
          
          // Si el precio es 0 pero hay presentaciones, tomar el precio de la primera presentación
          if (precioFinal === 0 && producto.presentaciones && producto.presentaciones.length > 0) {
            const presentacionUnidad = producto.presentaciones.find(p => p.presentacion === 'Unidad')
            const primeraPresentacion = presentacionUnidad || producto.presentaciones[0]
            if (primeraPresentacion && primeraPresentacion.precioVenta && primeraPresentacion.precioVenta > 0) {
              precioFinal = parseFloat(primeraPresentacion.precioVenta) || 0
              
              // Actualizar el precio en Firebase si es diferente
              if (precioFinal > 0 && producto.id) {
                updateProducto(producto.id, { precio: precioFinal }).catch(err => {
                  console.error('Error al actualizar precio del producto:', err)
                })
              }
            }
          }
          
          return {
            ...producto,
            precio: precioFinal,
            presentaciones: (producto.presentaciones || []).map(p => ({
              ...p,
              precioUnitario: p.precioUnitario === 0 ? '' : p.precioUnitario
            }))
          }
        })
        
        setProductos(productosFinales)
      } catch (error) {
        console.error('Error al cargar productos:', error)
        alert('Error al cargar productos. Por favor, recarga la página.')
      } finally {
        setLoading(false)
      }
    }
    
    loadProductos()
  }, [])

  // Cargar unidades de medida desde Firebase al montar el componente
  useEffect(() => {
    const loadUnidadesMedida = async () => {
      try {
        const unidadesData = await getUnidadesMedida()
        setUnidadesMedida(unidadesData)
      } catch (error) {
        console.error('Error al cargar unidades de medida:', error)
      }
    }
    
    loadUnidadesMedida()
  }, [])

  // Guardar en localStorage cuando cambien las columnas visibles
  useEffect(() => {
    localStorage.setItem('productos_visible_columns', JSON.stringify(visibleColumns))
  }, [visibleColumns])

  const handleToggleColumn = (columnKey) => {
    const column = allColumns.find(col => col.key === columnKey)
    // No permitir ocultar columnas requeridas
    if (column && column.required) {
      return
    }
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }))
  }

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Todas' || producto.categoria === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categorias = ['Todas', ...new Set(productos.map(p => p.categoria))]
  const categoriasProductos = ['Premium', 'Estándar', 'Básico', 'Enterprise']

  const generateBarcode = () => {
    // Generar código de barra aleatorio (EAN-13)
    const barcode = '7' + Math.floor(Math.random() * 100000000000).toString().padStart(11, '0')
    setNewProduct(prev => ({ ...prev, codigoBarra: barcode }))
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.nombre.trim()) {
      alert('El nombre del producto es requerido')
      return
    }

    // Si venta con inventario es "Si", usar stockInicial, sino usar stock
    const stockFinal = newProduct.ventaConInventario === 'Si' 
      ? parseInt(newProduct.stockInicial) || 0 
      : parseInt(newProduct.stock) || 0

    try {
      if (editingProductId) {
        // Editar producto existente
        const productoAnterior = productos.find(p => p.id === editingProductId)
        
        // Obtener el precio de la primera presentación si existe, sino usar precioVenta o precio
        let nuevoPrecio = parseFloat(newProduct.precioVenta) || parseFloat(newProduct.precio) || 0
        if (newProduct.presentaciones && newProduct.presentaciones.length > 0) {
          // Buscar la presentación "Unidad" primero, sino usar la primera
          const presentacionUnidad = newProduct.presentaciones.find(p => p.presentacion === 'Unidad')
          const primeraPresentacion = presentacionUnidad || newProduct.presentaciones[0]
          if (primeraPresentacion && primeraPresentacion.precioVenta) {
            nuevoPrecio = parseFloat(primeraPresentacion.precioVenta) || nuevoPrecio
          }
        }
        
        let precioHistorial = productoAnterior?.precioHistorial || []
        if (productoAnterior && productoAnterior.precio !== nuevoPrecio) {
          // El precio cambió, agregar al historial
          precioHistorial = [
            ...precioHistorial,
            {
              precio: nuevoPrecio,
              fecha: getCurrentDateSync(),
              usuario: 'Admin'
            }
          ]
        }

        // Normalizar presentaciones: convertir precioUnitario vacío a 0 para guardar
        const presentacionesNormalizadas = (newProduct.presentaciones || []).map(p => ({
          ...p,
          precioUnitario: p.precioUnitario === '' ? 0 : (parseFloat(p.precioUnitario) || 0),
          precioVenta: parseFloat(p.precioVenta) || 0,
          cantidad: parseFloat(p.cantidad) || 0
        }))

        // Limpiar imágenes: eliminar objetos File y solo guardar datos compatibles con Firestore
        const imagenesLimpias = (newProduct.imagenes || []).map(img => ({
          id: img.id,
          preview: img.preview, // Base64 string
          nombre: img.nombre
          // No incluir el objeto 'file' que no es compatible con Firestore
        }))

        const productoActualizado = {
          codigoInterno: newProduct.codigoInterno.trim() || `PROD-${editingProductId}`,
          codigoBarra: newProduct.codigoBarra.trim(),
          nombre: newProduct.nombre.trim(),
          categoria: newProduct.categoria,
          precio: nuevoPrecio,
          stock: stockFinal,
          vendidos: parseInt(newProduct.vendidos) || 0,
          estado: newProduct.estado,
          descripcion: newProduct.descripcion.trim(),
          stockMinimo: parseInt(newProduct.stockMinimo) || 0,
          ventaConInventario: newProduct.ventaConInventario,
          almacen: newProduct.almacen,
          unidad: newProduct.unidad,
          precioCompra: parseFloat(newProduct.precioCompra) || 0,
          precioVenta: parseFloat(newProduct.precioVenta) || 0,
          margen: parseFloat(newProduct.margen) || 0,
          imagenes: imagenesLimpias,
          precioHistorial: precioHistorial,
          tallas: newProduct.tallas || [],
          colores: newProduct.colores || [],
          presentaciones: presentacionesNormalizadas,
          marca: newProduct.marca || '',
          impuesto: newProduct.impuesto || 'IGV',
          impuestoPorcentaje: newProduct.impuestoPorcentaje || 18,
          cualidad: newProduct.cualidad || 'MEDIBLE',
          afectacionImpuesto: newProduct.afectacionImpuesto || 'GRAVABLE',
          productoBolsaICBPER: newProduct.productoBolsaICBPER || 'No',
          trabajaTallaColor: newProduct.trabajaTallaColor || 'Si'
        }

        // Actualizar en Firebase
        const productoActualizadoConId = await updateProducto(editingProductId, productoActualizado)
        setProductos(productos.map(p => p.id === editingProductId ? productoActualizadoConId : p))
        setEditingProductId(null)
      } else {
        // Crear nuevo producto
        // Obtener el precio de la primera presentación si existe, sino usar precioVenta o precio
        let nuevoPrecio = parseFloat(newProduct.precioVenta) || parseFloat(newProduct.precio) || 0
        if (newProduct.presentaciones && newProduct.presentaciones.length > 0) {
          // Buscar la presentación "Unidad" primero, sino usar la primera
          const presentacionUnidad = newProduct.presentaciones.find(p => p.presentacion === 'Unidad')
          const primeraPresentacion = presentacionUnidad || newProduct.presentaciones[0]
          if (primeraPresentacion && primeraPresentacion.precioVenta) {
            nuevoPrecio = parseFloat(primeraPresentacion.precioVenta) || nuevoPrecio
          }
        }
        
        // Normalizar presentaciones: convertir precioUnitario vacío a 0 para guardar
        const presentacionesNormalizadas = (newProduct.presentaciones || []).map(p => ({
          ...p,
          precioUnitario: p.precioUnitario === '' ? 0 : (parseFloat(p.precioUnitario) || 0),
          precioVenta: parseFloat(p.precioVenta) || 0,
          cantidad: parseFloat(p.cantidad) || 0
        }))
        
        // Limpiar imágenes: eliminar objetos File y solo guardar datos compatibles con Firestore
        const imagenesLimpias = (newProduct.imagenes || []).map(img => ({
          id: img.id,
          preview: img.preview, // Base64 string
          nombre: img.nombre
          // No incluir el objeto 'file' que no es compatible con Firestore
        }))
        
        const producto = {
          codigoInterno: newProduct.codigoInterno.trim() || '',
          codigoBarra: newProduct.codigoBarra.trim(),
          nombre: newProduct.nombre.trim(),
          categoria: newProduct.categoria,
          precio: nuevoPrecio,
          stock: stockFinal,
          vendidos: parseInt(newProduct.vendidos) || 0,
          estado: newProduct.estado,
          descripcion: newProduct.descripcion.trim(),
          stockMinimo: parseInt(newProduct.stockMinimo) || 0,
          ventaConInventario: newProduct.ventaConInventario,
          almacen: newProduct.almacen,
          unidad: newProduct.unidad,
          precioCompra: parseFloat(newProduct.precioCompra) || 0,
          precioVenta: parseFloat(newProduct.precioVenta) || 0,
          margen: parseFloat(newProduct.margen) || 0,
          imagenes: imagenesLimpias,
          precioHistorial: [{
            precio: nuevoPrecio,
            fecha: getCurrentDateSync(),
            usuario: 'Admin'
          }],
          tallas: newProduct.tallas || [],
          colores: newProduct.colores || [],
          presentaciones: presentacionesNormalizadas,
          marca: newProduct.marca || '',
          impuesto: newProduct.impuesto || 'IGV',
          impuestoPorcentaje: newProduct.impuestoPorcentaje || 18,
          cualidad: newProduct.cualidad || 'MEDIBLE',
          afectacionImpuesto: newProduct.afectacionImpuesto || 'GRAVABLE',
          productoBolsaICBPER: newProduct.productoBolsaICBPER || 'No',
          trabajaTallaColor: newProduct.trabajaTallaColor || 'Si'
        }

        // Guardar en Firebase
        const productoGuardado = await saveProducto(producto)
        setProductos([...productos, productoGuardado])
      }
    } catch (error) {
      console.error('Error al guardar producto:', error)
      console.error('Detalles del error:', error.message, error.code)
      
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al guardar el producto. Por favor, intenta nuevamente.'
      if (error.code === 'permission-denied') {
        errorMessage = 'Error: No tienes permisos para guardar productos. Verifica las reglas de seguridad de Firebase.'
      } else if (error.code === 'unavailable') {
        errorMessage = 'Error: Firebase no está disponible. Verifica tu conexión a internet.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      alert(errorMessage)
      return
    }
    setNewProduct({
      codigoInterno: '',
      codigoBarra: '',
      nombre: '',
      descripcion: '',
      categoria: 'Estándar',
      stockMinimo: 0,
      ventaConInventario: 'Si',
      stockInicial: 0,
      almacen: 'PRINCIPAL',
      precio: 0,
      stock: 0,
      vendidos: 0,
      estado: 'Activo',
      unidad: 'Unidad',
      precioCompra: 0,
      precioVenta: 0,
      margen: 0,
      imagenes: [],
      tallas: [],
      colores: [],
      nuevaTalla: '',
      nuevoColor: '',
      nuevoColorNombre: '',
      costoUnitario: 0,
      presentaciones: [{ presentacion: 'Unidad', cantidad: 1, precioUnitario: '', precioVenta: 0 }],
      mostrarStockEmbalaje: '',
      marca: '',
      impuesto: 'IGV',
      impuestoPorcentaje: 18,
      cualidad: 'MEDIBLE',
      afectacionImpuesto: 'GRAVABLE',
      productoBolsaICBPER: 'No',
      trabajaTallaColor: 'Si'
    })
    setShowMoreFields(false)
    setActiveTab('general')
    setShowNewProductModal(false)
    setEditingProductId(null)
  }

  const handleEditProduct = (producto) => {
    setNewProduct({
      codigoInterno: producto.codigoInterno || '',
      codigoBarra: producto.codigoBarra || '',
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      categoria: producto.categoria || 'Estándar',
      stockMinimo: producto.stockMinimo || 0,
      ventaConInventario: producto.ventaConInventario || 'Si',
      stockInicial: producto.stock || 0,
      almacen: producto.almacen || 'PRINCIPAL',
      precio: producto.precio || 0,
      stock: producto.stock || 0,
      vendidos: producto.vendidos || 0,
      estado: producto.estado || 'Activo',
      unidad: producto.unidad || 'Unidad',
      precioCompra: producto.precioCompra || 0,
      precioVenta: producto.precioVenta || producto.precio || 0,
      margen: producto.margen || 0,
      imagenes: producto.imagenes || [],
      tallas: producto.tallas || [],
      colores: producto.colores || [],
      nuevaTalla: '',
      nuevoColor: '',
      nuevoColorNombre: '',
      costoUnitario: producto.costoUnitario || 0,
      presentaciones: (producto.presentaciones && producto.presentaciones.length > 0) 
        ? producto.presentaciones.map(p => ({
            ...p,
            precioUnitario: (p.precioUnitario === 0 || p.precioUnitario === null || p.precioUnitario === undefined) ? '' : p.precioUnitario
          }))
        : [{ presentacion: 'Unidad', cantidad: 1, precioUnitario: '', precioVenta: 0 }],
      mostrarStockEmbalaje: producto.mostrarStockEmbalaje || '',
      marca: producto.marca || '',
      impuesto: producto.impuesto || 'IGV',
      impuestoPorcentaje: producto.impuestoPorcentaje || 18,
      cualidad: producto.cualidad || 'MEDIBLE',
      afectacionImpuesto: producto.afectacionImpuesto || 'GRAVABLE',
      productoBolsaICBPER: producto.productoBolsaICBPER || 'No',
      trabajaTallaColor: producto.trabajaTallaColor || 'Si'
    })
    setEditingProductId(producto.id)
    setShowNewProductModal(true)
    setActiveTab('general')
  }

  // Función para actualizar el historial cuando se guarda un producto editado
  const updatePriceHistory = (productoId, nuevoPrecio) => {
    setProductos(prevProductos => {
      return prevProductos.map(p => {
        if (p.id === productoId) {
          const precioAnterior = p.precio
          if (precioAnterior !== nuevoPrecio) {
            return {
              ...p,
              precioHistorial: [
                ...(p.precioHistorial || [{
                  precio: precioAnterior,
                  fecha: getCurrentDateSync(),
                  usuario: 'Admin'
                }]),
                {
                  precio: nuevoPrecio,
                  fecha: getCurrentDateSync(),
                  usuario: 'Admin'
                }
              ]
            }
          }
        }
        return p
      })
    })
  }

  const handleDuplicateProduct = (producto) => {
    const nuevoId = Math.max(...productos.map(p => p.id), 0) + 1
    const nuevoProducto = {
      ...producto,
      id: nuevoId,
      nombre: `${producto.nombre} (Copia)`,
      codigoInterno: producto.codigoInterno ? `${producto.codigoInterno}-COPY` : `PROD-${nuevoId}`,
      codigoBarra: '',
      vendidos: 0,
      imagenes: producto.imagenes ? [...producto.imagenes] : [],
      precioHistorial: [{
        precio: producto.precio,
        fecha: getCurrentDateSync(),
        usuario: 'Admin'
      }]
    }
    setProductos([...productos, nuevoProducto])
  }

  const handleDeleteProduct = async (productoId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
      try {
        await deleteProducto(productoId)
        setProductos(productos.filter(p => p.id !== productoId))
      } catch (error) {
        console.error('Error al eliminar producto:', error)
        alert('Error al eliminar el producto. Por favor, intenta nuevamente.')
      }
    }
  }

  const addNuevaPresentacion = () => {
    setNewProduct(prev => ({
      ...prev,
      presentaciones: [...prev.presentaciones, { presentacion: 'Unidad', cantidad: 1, precioUnitario: '', precioVenta: 0 }]
    }))
  }

  const addNuevaUnidadMedida = () => {
    setShowNewUnitModal(true)
  }

  const handleNewUnitChange = (e) => {
    const { name, value } = e.target
    setNewUnit(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleConfirmNewUnit = async () => {
    if (!newUnit.nombre.trim() || !newUnit.abreviatura.trim()) {
      alert('El nombre y la abreviatura son requeridos')
      return
    }
    
    if (!newUnit.cantidad || parseFloat(newUnit.cantidad) <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }
    
    try {
      // Guardar la nueva unidad en Firestore
      const unidadGuardada = await saveUnidadMedida({
        nombre: newUnit.nombre.trim(),
        abreviatura: newUnit.abreviatura.trim(),
        valor_posicional: parseFloat(newUnit.cantidad) || 1,
        presentacion: newUnit.presentacion === 'SI'
      })
      
      // Actualizar el estado local con la nueva unidad
      setUnidadesMedida([...unidadesMedida, unidadGuardada])
      
      alert('Unidad de medida guardada exitosamente')
      
      // Resetear formulario y cerrar modal
      setNewUnit({
        nombre: '',
        abreviatura: '',
        cantidad: '',
        presentacion: 'SI'
      })
      setShowNewUnitModal(false)
    } catch (error) {
      console.error('Error al guardar unidad de medida:', error)
      alert('Error al guardar la unidad de medida. Por favor, intenta nuevamente.')
    }
  }

  const handleCancelNewUnit = () => {
    setNewUnit({
      nombre: '',
      abreviatura: '',
      cantidad: '',
      presentacion: 'SI'
    })
    setShowNewUnitModal(false)
  }

  const handleConfirmNewBrand = () => {
    if (!newBrand.trim()) {
      alert('Por favor ingrese un nombre de marca')
      return
    }
    
    const marcaNombre = newBrand.trim()
    if (!marcas.includes(marcaNombre)) {
      setMarcas([...marcas, marcaNombre])
      setNewProduct(prev => ({ ...prev, marca: marcaNombre }))
      setNewBrand('')
      setShowNewBrandModal(false)
    } else {
      alert('Esta marca ya existe')
    }
  }

  // Función para obtener el multiplicador según la presentación
  const getMultiplicadorPresentacion = (presentacion) => {
    // Primero buscar en las unidades guardadas en Firestore
    const unidadGuardada = unidadesMedida.find(u => u.nombre === presentacion)
    if (unidadGuardada && (unidadGuardada.valor_posicional || unidadGuardada.cantidad)) {
      return parseFloat(unidadGuardada.valor_posicional || unidadGuardada.cantidad) || 1
    }
    
    // Si no está en las unidades guardadas, usar valores predeterminados
    switch (presentacion) {
      case 'Unidad':
        return 1
      case 'Docena':
        return 12
      case 'Ciento':
        return 100
      case 'Millar':
        return 1000
      case 'Caja':
        return 1 // Se usará la cantidad si está definida
      default:
        return 1
    }
  }

  // Función para obtener la cantidad según la presentación
  const getCantidadPresentacion = (presentacion) => {
    // Primero buscar en las unidades guardadas en Firestore
    const unidadGuardada = unidadesMedida.find(u => u.nombre === presentacion)
    if (unidadGuardada && (unidadGuardada.valor_posicional || unidadGuardada.cantidad)) {
      return parseFloat(unidadGuardada.valor_posicional || unidadGuardada.cantidad) || 1
    }
    
    // Si no está en las unidades guardadas, usar valores predeterminados
    switch (presentacion) {
      case 'Unidad':
        return 1
      case 'Docena':
        return 12
      case 'Ciento':
        return 100
      case 'Millar':
        return 1000
      case 'Caja':
        return 1 // Para Caja, mantener la cantidad manual
      default:
        return 1
    }
  }

  const updatePresentacion = (index, field, value) => {
    setNewProduct(prev => {
      const updated = [...prev.presentaciones]
      const presentacion = updated[index]
      
      // Si se actualiza precioUnitario, calcular automáticamente precioVenta
      if (field === 'precioUnitario') {
        const precioUnitario = parseFloat(value) || 0
        const multiplicador = presentacion.presentacion === 'Caja' && presentacion.cantidad > 0
          ? presentacion.cantidad
          : getMultiplicadorPresentacion(presentacion.presentacion)
        const precioVenta = precioUnitario * multiplicador
        
        updated[index] = { 
          ...presentacion, 
          precioUnitario: value === '' ? '' : precioUnitario,
          precioVenta: precioVenta
        }
        
        // Si es la presentación "Unidad" o la primera, actualizar también el precio principal
        if (presentacion.presentacion === 'Unidad' || index === 0) {
          return {
            ...prev,
            presentaciones: updated,
            precio: precioVenta,
            precioVenta: precioVenta
          }
        }
      } 
      // Si se cambia la presentación y hay precioUnitario, recalcular precioVenta
      else if (field === 'presentacion') {
        // Actualizar automáticamente la cantidad según el valor posicional de la presentación
        const nuevaCantidad = value === 'Caja' 
          ? presentacion.cantidad // Para Caja, mantener la cantidad manual
          : getCantidadPresentacion(value)
        
        const precioUnitario = parseFloat(presentacion.precioUnitario) || 0
        const multiplicador = value === 'Caja' && nuevaCantidad > 0
          ? nuevaCantidad
          : getMultiplicadorPresentacion(value)
        const precioVenta = precioUnitario * multiplicador
        
        updated[index] = { 
          ...presentacion, 
          presentacion: value,
          cantidad: nuevaCantidad,
          precioVenta: precioVenta
        }
        
        // Si es la presentación "Unidad" o la primera, actualizar también el precio principal
        if (value === 'Unidad' || index === 0) {
          return {
            ...prev,
            presentaciones: updated,
            precio: precioVenta,
            precioVenta: precioVenta
          }
        }
      }
      // Si se cambia la cantidad y es Caja, recalcular precioVenta
      else if (field === 'cantidad' && presentacion.presentacion === 'Caja') {
        const precioUnitario = parseFloat(presentacion.precioUnitario) || 0
        const cantidad = parseFloat(value) || 0
        const precioVenta = precioUnitario * cantidad
        
        updated[index] = { 
          ...presentacion, 
          cantidad: cantidad,
          precioVenta: precioVenta
        }
      }
      else {
        updated[index] = { ...presentacion, [field]: value }
      }
      
      return { ...prev, presentaciones: updated }
    })
  }

  const removePresentacion = (index) => {
    if (newProduct.presentaciones.length > 1) {
      setNewProduct(prev => ({
        ...prev,
        presentaciones: prev.presentaciones.filter((_, i) => i !== index)
      }))
    }
  }

  const handleAddTalla = () => {
    if (!newProduct.nuevaTalla.trim()) {
      alert('Por favor ingrese una talla')
      return
    }
    const tallaNombre = newProduct.nuevaTalla.trim().toUpperCase()
    if (!newProduct.tallas.find(t => t.nombre === tallaNombre)) {
      setNewProduct(prev => ({
        ...prev,
        tallas: [...prev.tallas, { nombre: tallaNombre, seleccionado: false }],
        nuevaTalla: ''
      }))
    } else {
      alert('Esta talla ya existe')
    }
  }

  const handleAddColor = () => {
    if (!newProduct.nuevoColorNombre.trim()) {
      alert('Por favor ingrese un nombre de color')
      return
    }
    const colorNombre = newProduct.nuevoColorNombre.trim().toUpperCase()
    const colorHex = newProduct.nuevoColor || '#000000'
    
    if (!newProduct.colores.find(c => c.nombre === colorNombre)) {
      setNewProduct(prev => ({
        ...prev,
        colores: [...prev.colores, { nombre: colorNombre, hex: colorHex, seleccionado: false }],
        nuevoColor: '',
        nuevoColorNombre: ''
      }))
    } else {
      alert('Este color ya existe')
    }
  }

  const handleToggleTalla = (tallaNombre) => {
    // Seleccionar/deseleccionar la talla
    setNewProduct(prev => ({
      ...prev,
      tallas: prev.tallas.map(t =>
        t.nombre === tallaNombre ? { ...t, seleccionado: !t.seleccionado } : t
      )
    }))
  }

  const handleRemoveTalla = (tallaNombre) => {
    // Eliminar la talla de la lista
    setNewProduct(prev => ({
      ...prev,
      tallas: prev.tallas.filter(t => t.nombre !== tallaNombre)
    }))
  }

  const handleRemoveColor = (colorNombre) => {
    // Eliminar el color de la lista
    setNewProduct(prev => ({
      ...prev,
      colores: prev.colores.filter(c => c.nombre !== colorNombre)
    }))
  }

  const handleToggleColor = (colorNombre) => {
    setNewProduct(prev => ({
      ...prev,
      colores: prev.colores.map(c =>
        c.nombre === colorNombre ? { ...c, seleccionado: !c.seleccionado } : c
      )
    }))
  }

  const getColorHex = (colorName) => {
    const colorMap = {
      'BLANCO': '#FFFFFF',
      'NEGRO': '#000000',
      'ROJO': '#FF0000',
      'AZUL': '#0000FF',
      'VERDE': '#00FF00',
      'AMARILLO': '#FFFF00',
      'ROSADO': '#FF69B4',
      'NARANJA': '#FFA500',
      'MORADO': '#800080',
      'LILA': '#C8A2C8',
      'CELESTE': '#87CEEB',
      'DORADO': '#FFD700',
      'PLATA': '#C0C0C0',
      'GRIS': '#808080',
      'BEIGE': '#F5F5DC',
      'CREMA': '#FFFDD0',
      'CORAL': '#FF7F50',
      'FUCSIA': '#FF00FF',
      'PIEL': '#FDBE87',
      'PERLA': '#F8F6F0',
      'CROMADA': '#C0C0C0',
      'TRANSPARENTE': '#FFFFFF',
      'PLOMO': '#808080',
      'PLOMO AZULADO': '#708090',
      'AMARILLO NEON': '#FFFF00',
      'MIXTO': '#808080',
      'GRAFITO': '#2F4F4F',
      'MOSTAZA': '#FFDB58',
      'CARTON': '#D2B48C',
      'ORD ROSA': '#FFB6C1',
      'CÁLIDO AMARILLO': '#FFD700',
      'VIOLETA': '#8A2BE2'
    }
    return colorMap[colorName.toUpperCase()] || '#000000'
  }

  const fileInputRef = useRef(null)

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      return isValidType && isValidSize
    })

    if (validFiles.length !== files.length) {
      alert('Algunos archivos no son válidos. Solo se permiten JPG, PNG, GIF y máximo 5MB por archivo.')
    }

    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewProduct(prev => ({
          ...prev,
          imagenes: [...prev.imagenes, {
            id: Date.now() + Math.random(),
            preview: reader.result, // Base64 string que Firestore puede guardar
            nombre: file.name
          }]
        }))
      }
      reader.readAsDataURL(file)
    })

    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = ''
  }

  const handleRemoveImage = (imageId) => {
    setNewProduct(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter(img => img.id !== imageId)
    }))
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      const event = {
        target: {
          files: imageFiles
        }
      }
      handleImageUpload(event)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewProduct(prev => {
      const updated = {
        ...prev,
        [name]: value
      }
      
      // Calcular margen automáticamente si cambian precio de compra o venta
      if (name === 'precioCompra' || name === 'precioVenta') {
        const precioCompra = parseFloat(name === 'precioCompra' ? value : prev.precioCompra) || 0
        const precioVenta = parseFloat(name === 'precioVenta' ? value : prev.precioVenta) || 0
        if (precioCompra > 0) {
          updated.margen = ((precioVenta - precioCompra) / precioCompra * 100).toFixed(2)
        } else {
          updated.margen = 0
        }
      }
      
      return updated
    })
  }
  const totalProductos = productos.length
  const productosActivos = productos.filter(p => p.estado === 'Activo').length
  const totalStock = productos.reduce((sum, p) => sum + p.stock, 0)
  const totalVendidos = productos.reduce((sum, p) => sum + p.vendidos, 0)
  const valorInventario = productos.reduce((sum, p) => sum + (p.precio * p.stock), 0)

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-100 text-green-800'
      case 'Inactivo':
        return 'bg-gray-100 text-gray-800'
      case 'Agotado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoriaColor = (categoria) => {
    switch (categoria) {
      case 'Premium':
        return 'bg-purple-100 text-purple-800'
      case 'Enterprise':
        return 'bg-blue-100 text-blue-800'
      case 'Estándar':
        return 'bg-primary-100 text-primary-800'
      case 'Básico':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando productos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">Gestiona tu catálogo de productos</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={() => setShowColumnsModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium"
          >
            <Columns size={20} />
            <span>Columnas</span>
          </button>
          <button 
            onClick={() => {
              setEditingProductId(null)
              setNewProduct({
                codigoInterno: '',
                codigoBarra: '',
                nombre: '',
                descripcion: '',
                categoria: 'Estándar',
                stockMinimo: 0,
                ventaConInventario: 'Si',
                stockInicial: 0,
                almacen: 'PRINCIPAL',
                precio: 0,
                stock: 0,
                vendidos: 0,
                estado: 'Activo',
                unidad: 'Unidad',
                precioCompra: 0,
                precioVenta: 0,
                margen: 0,
                imagenes: [],
                tallas: [],
                colores: [],
                nuevaTalla: '',
                nuevoColor: '',
                nuevoColorNombre: '',
                costoUnitario: 0,
                presentaciones: [{ presentacion: 'Unidad', cantidad: 1, precioUnitario: '', precioVenta: 0 }],
                mostrarStockEmbalaje: '',
                marca: '',
                impuesto: 'IGV',
                impuestoPorcentaje: 18,
                cualidad: 'MEDIBLE',
                afectacionImpuesto: 'GRAVABLE',
                productoBolsaICBPER: 'No',
                trabajaTallaColor: 'Si'
              })
              setShowNewProductModal(true)
              setActiveTab('general')
              setShowMoreFields(false)
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{totalProductos}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-100">
              <Package className="text-primary-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Productos Activos</p>
              <p className="text-2xl font-bold text-green-600">{productosActivos}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Stock Total</p>
              <p className="text-2xl font-bold text-secondary-600">{totalStock}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary-100">
              <Package className="text-secondary-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Vendidos</p>
              <p className="text-2xl font-bold text-accent-600">{totalVendidos}</p>
            </div>
            <div className="p-3 rounded-lg bg-accent-100">
              <ShoppingCart className="text-accent-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Valor Inventario</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(valorInventario)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-100">
              <DollarSign className="text-primary-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
            />
          </div>
          <div className="flex space-x-2">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                {visibleColumns.acciones && (
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
                {visibleColumns.id && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ID
                  </th>
                )}
                {visibleColumns.imagenes && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Imágenes
                  </th>
                )}
                {visibleColumns.nombre && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nombre del Producto
                  </th>
                )}
                {visibleColumns.descripcion && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Descripción
                  </th>
                )}
                {visibleColumns.categoria && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Categoría
                  </th>
                )}
                {visibleColumns.precio && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Precio
                  </th>
                )}
                {visibleColumns.stock && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Stock
                  </th>
                )}
                {visibleColumns.vendidos && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vendidos
                  </th>
                )}
                {visibleColumns.estado && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(v => v).length} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredProductos.map((producto) => (
                  <tr key={producto.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    {visibleColumns.acciones && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleEditProduct(producto)}
                            className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDuplicateProduct(producto)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Duplicar"
                          >
                            <Copy size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(producto.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                    {visibleColumns.id && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {producto.numeroProducto || producto.id}
                        </div>
                      </td>
                    )}
                    {visibleColumns.imagenes && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {producto.imagenes && producto.imagenes.length > 0 ? (
                            <div className="flex -space-x-2">
                              {producto.imagenes.slice(0, 3).map((imagen, index) => (
                                <div
                                  key={imagen.id || index}
                                  onClick={() => {
                                    setSelectedImageProduct(producto)
                                    setSelectedImageIndex(index)
                                    setShowImageModal(true)
                                  }}
                                  className="w-10 h-10 rounded-lg border-2 border-white overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                                  title={`${imagen.nombre || 'Imagen'} - Click para ver detalles`}
                                >
                                  <img
                                    src={imagen.preview || imagen}
                                    alt={imagen.nombre || `Imagen ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                    }}
                                  />
                                </div>
                              ))}
                              {producto.imagenes.length > 3 && (
                                <div 
                                  onClick={() => {
                                    setSelectedImageProduct(producto)
                                    setSelectedImageIndex(0)
                                    setShowImageModal(true)
                                  }}
                                  className="w-10 h-10 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-300 transition-colors"
                                  title="Ver todas las imágenes"
                                >
                                  +{producto.imagenes.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="text-gray-400" size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.nombre && (
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{producto.nombre}</div>
                        {!visibleColumns.descripcion && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{producto.descripcion}</div>
                        )}
                      </td>
                    )}
                    {visibleColumns.descripcion && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">{producto.descripcion}</div>
                      </td>
                    )}
                    {visibleColumns.categoria && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoriaColor(producto.categoria)}`}>
                          {producto.categoria}
                        </span>
                      </td>
                    )}
                    {visibleColumns.precio && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(producto.precio)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.stock && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-semibold ${producto.stock < 20 ? 'text-red-600' : producto.stock < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {producto.stock}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">unid.</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.vendidos && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{producto.vendidos}</div>
                      </td>
                    )}
                    {visibleColumns.estado && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoColor(producto.estado)}`}>
                          {producto.estado}
                        </span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Columnas */}
      {showColumnsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Configurar Columnas</h2>
              <button
                onClick={() => setShowColumnsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Selecciona las columnas que deseas mostrar en la tabla</p>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-200 font-semibold text-sm text-gray-700">
                  <div>Columna</div>
                  <div className="text-center">Activo</div>
                  <div className="text-center">Mostrar</div>
                </div>
                
                {allColumns.map((column) => {
                  const isRequired = column.required
                  return (
                    <div 
                      key={column.key} 
                      className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <span className={`text-sm ${isRequired ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {column.label}
                          {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key] || false}
                          disabled={isRequired}
                          onChange={() => handleToggleColumn(column.key)}
                          className={`w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 ${
                            isRequired ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key] || false}
                          disabled={isRequired}
                          onChange={() => handleToggleColumn(column.key)}
                          className={`w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 ${
                            isRequired ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowColumnsModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowColumnsModal(false)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Producto */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProductId ? 'Editar producto:' : 'Datos del producto:'}
              </h2>
              <button
                onClick={() => {
                  setShowNewProductModal(false)
                  setActiveTab('general')
                  setShowMoreFields(false)
                  setEditingProductId(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-6">
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'general'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Datos generales
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('precios')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'precios'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Unidades y precios
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('imagenes')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'imagenes'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Imágenes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tallas')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'tallas'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Tallas y Colores
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <form onSubmit={handleAddProduct} className="px-6 py-4 overflow-y-auto flex-1">
              {/* Tab: Datos generales */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  {/* Código Interno */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código interno
                    </label>
                    <input
                      type="text"
                      name="codigoInterno"
                      value={newProduct.codigoInterno}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Código interno del producto"
                    />
                  </div>

                  {/* Código de barra */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de barra
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="codigoBarra"
                        value={newProduct.codigoBarra}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Código de barra"
                      />
                      <button
                        type="button"
                        onClick={generateBarcode}
                        className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors text-sm font-medium"
                      >
                        Generar código de barra
                      </button>
                    </div>
                  </div>

                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="nombre"
                        value={newProduct.nombre}
                        onChange={handleInputChange}
                        required
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Nombre del producto"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMoreFields(!showMoreFields)}
                        className="px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors text-sm"
                      >
                        {showMoreFields ? 'ver menos...' : 'ver más...'}
                      </button>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="descripcion"
                      value={newProduct.descripcion}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Descripción del producto"
                    />
                  </div>

                  {/* Campos adicionales (ver más) */}
                  {showMoreFields && (
                    <>
                      {/* Marca */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marca
                        </label>
                        <div className="flex gap-2">
                          <select
                            name="marca"
                            value={newProduct.marca}
                            onChange={handleInputChange}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Seleccione</option>
                            {marcas.map((marca, index) => (
                              <option key={index} value={marca}>{marca}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowNewBrandModal(true)}
                            className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-colors"
                            title="Agregar nueva marca"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Impuesto */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Impuesto
                        </label>
                        <div className="flex gap-2">
                          <select
                            name="impuesto"
                            value={newProduct.impuesto}
                            onChange={handleInputChange}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="IGV">IGV</option>
                            <option value="EXONERADO">EXONERADO</option>
                            <option value="INAfecto">INAfecto</option>
                          </select>
                          <input
                            type="number"
                            name="impuestoPorcentaje"
                            value={newProduct.impuestoPorcentaje}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="18"
                          />
                          <span className="flex items-center text-sm text-gray-500">%</span>
                        </div>
                      </div>

                      {/* Cualidad */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cualidad
                        </label>
                        <select
                          name="cualidad"
                          value={newProduct.cualidad}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="MEDIBLE">MEDIBLE</option>
                          <option value="NO_MEDIBLE">NO MEDIBLE</option>
                        </select>
                      </div>

                      {/* Afectación del Impuesto */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Afectación del Impuesto
                        </label>
                        <select
                          name="afectacionImpuesto"
                          value={newProduct.afectacionImpuesto}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="GRAVABLE">GRAVABLE</option>
                          <option value="EXONERADO">EXONERADO</option>
                          <option value="INAfecto">INAfecto</option>
                        </select>
                      </div>

                      {/* Producto Bolsa con Imp. ICBPER */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Producto Bolsa con Imp. ICBPER
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="productoBolsaICBPER"
                              value="Si"
                              checked={newProduct.productoBolsaICBPER === 'Si'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Si</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="productoBolsaICBPER"
                              value="No"
                              checked={newProduct.productoBolsaICBPER === 'No'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                        {newProduct.productoBolsaICBPER === 'Si' && (
                          <p className="text-xs text-gray-600 mt-1">
                            SI: El producto será tratado como una bolsa y será adicionado su impuesto de bolsas
                          </p>
                        )}
                      </div>

                      {/* Trabaja talla y color */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trabaja talla y color
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="trabajaTallaColor"
                              value="Si"
                              checked={newProduct.trabajaTallaColor === 'Si'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Si</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="trabajaTallaColor"
                              value="No"
                              checked={newProduct.trabajaTallaColor === 'No'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      name="categoria"
                      value={newProduct.categoria}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {categoriasProductos.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Mínimo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Mínimo
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="stockMinimo"
                        value={newProduct.stockMinimo}
                        onChange={handleInputChange}
                        min="0"
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500">cant.</span>
                    </div>
                  </div>

                  {/* Venta con inventario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venta con inventario
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="ventaConInventario"
                          value="Si"
                          checked={newProduct.ventaConInventario === 'Si'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Si</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="ventaConInventario"
                          value="No"
                          checked={newProduct.ventaConInventario === 'No'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>

                  {/* Stock Inicial */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Inicial
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="stockInicial"
                        value={newProduct.stockInicial}
                        onChange={handleInputChange}
                        min="0"
                        disabled={newProduct.ventaConInventario === 'No'}
                        className={`w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          newProduct.ventaConInventario === 'No' ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500">Cant.</span>
                    </div>
                    {newProduct.ventaConInventario === 'Si' && (
                      <p className="text-xs text-red-600 mt-1">
                        * Solo para productos habilitados control inventario
                      </p>
                    )}
                  </div>

                  {/* Almacén */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Almacén
                    </label>
                    <select
                      name="almacen"
                      value={newProduct.almacen}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="PRINCIPAL">PRINCIPAL</option>
                      <option value="SECUNDARIO">SECUNDARIO</option>
                      <option value="BODEGA">BODEGA</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tab: Unidades y precios */}
              {activeTab === 'precios' && (
                <div className="space-y-6">
                  {/* Costo unitario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo unitario:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          name="costoUnitario"
                          value={newProduct.costoUnitario}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        type="button"
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Información sobre costo unitario"
                      >
                        <HelpCircle size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={addNuevaPresentacion}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <Plus size={18} />
                      <span>Nuevo precio (F7)</span>
                    </button>
                    <button
                      type="button"
                      onClick={addNuevaUnidadMedida}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <Plus size={18} />
                      <span>Nuevo U.Medida</span>
                    </button>
                  </div>

                  {/* Tabla de precios */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Presentación
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Cantidad
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Precio unitario
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Precio de venta
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {newProduct.presentaciones.map((presentacion, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <select
                                value={presentacion.presentacion}
                                onChange={(e) => updatePresentacion(index, 'presentacion', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                              >
                                <option value="Unidad">Unidad</option>
                                <option value="Docena">Docena</option>
                                <option value="Ciento">Ciento</option>
                                <option value="Millar">Millar</option>
                                <option value="Caja">Caja</option>
                                {unidadesMedida
                                  .filter(u => u.presentacion !== false)
                                  .map((unidad) => (
                                    <option key={unidad.id} value={unidad.nombre}>
                                      {unidad.nombre} {unidad.abreviatura ? `(${unidad.abreviatura})` : ''}
                                    </option>
                                  ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={presentacion.cantidad}
                                onChange={(e) => updatePresentacion(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative">
                                <input
                                  type="number"
                                  value={presentacion.precioUnitario === '' || presentacion.precioUnitario === 0 ? '' : presentacion.precioUnitario}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? '' : e.target.value
                                    updatePresentacion(index, 'precioUnitario', value)
                                  }}
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    value={presentacion.precioVenta}
                                    onChange={(e) => updatePresentacion(index, 'precioVenta', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-full flex items-center justify-center transition-colors"
                                  title="Información del precio"
                                >
                                  <Info size={16} />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {newProduct.presentaciones.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePresentacion(index)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Eliminar presentación"
                                >
                                  <X size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mostrar Stock x Embalaje */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mostrar Stock x Embalaje:
                    </label>
                    <select
                      name="mostrarStockEmbalaje"
                      value={newProduct.mostrarStockEmbalaje}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">--Seleccione--</option>
                      <option value="Si">Si</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tab: Imágenes */}
              {activeTab === 'imagenes' && (
                <div className="space-y-4">
                  {/* Área de carga */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                    <p className="text-sm text-gray-600 mb-2">Arrastra imágenes aquí o haz clic para seleccionar</p>
                    <button
                      type="button"
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors inline-flex items-center space-x-2"
                    >
                      <ImageIcon size={18} />
                      <span>Seleccionar Imágenes</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB por archivo</p>
                  </div>

                  {/* Galería de imágenes */}
                  {newProduct.imagenes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Imágenes subidas ({newProduct.imagenes.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {newProduct.imagenes.map((imagen) => (
                          <div key={imagen.id} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                              <img
                                src={imagen.preview}
                                alt={imagen.nombre}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveImage(imagen.id)
                              }}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Eliminar imagen"
                            >
                              <X size={16} />
                            </button>
                            <p className="text-xs text-gray-500 mt-1 truncate" title={imagen.nombre}>
                              {imagen.nombre}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Tallas y Colores */}
              {activeTab === 'tallas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sección de Tallas */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        INGRESE TALLA
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newProduct.nuevaTalla}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, nuevaTalla: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTalla()}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Ej: TALLA 2, L, M, 40CM X 60CM"
                        />
                        <button
                          type="button"
                          onClick={handleAddTalla}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700"></th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Talla</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {newProduct.tallas.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">
                                No hay tallas agregadas
                              </td>
                            </tr>
                          ) : (
                            newProduct.tallas.map((talla, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2">
                                  <input
                                    type="checkbox"
                                    checked={talla.seleccionado || false}
                                    onChange={() => handleToggleTalla(talla.nombre)}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">{talla.nombre}</td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTalla(talla.nombre)}
                                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar talla"
                                  >
                                    <X size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sección de Colores */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        INGRESE COLOR
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="color"
                          value={newProduct.nuevoColor || '#000000'}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, nuevoColor: e.target.value }))}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={newProduct.nuevoColorNombre}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, nuevoColorNombre: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddColor()}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Ej: BLANCO, NEGRO, ROJO"
                        />
                        <button
                          type="button"
                          onClick={handleAddColor}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700"></th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Color</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nombre</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {newProduct.colores.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="px-4 py-4 text-center text-sm text-gray-500">
                                No hay colores agregados
                              </td>
                            </tr>
                          ) : (
                            newProduct.colores.map((color, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2">
                                  <input
                                    type="checkbox"
                                    checked={color.seleccionado || false}
                                    onChange={() => handleToggleColor(color.nombre)}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <div
                                    className="w-6 h-6 rounded-full border border-gray-300"
                                    style={{ backgroundColor: color.hex || getColorHex(color.nombre) }}
                                  ></div>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">{color.nombre}</td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColor(color.nombre)}
                                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar color"
                                  >
                                    <X size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer del Modal */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProductModal(false)
                    setActiveTab('general')
                    setShowMoreFields(false)
                    setEditingProductId(null)
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                >
                  <X size={18} />
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  {editingProductId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Nueva Unidad */}
      {showNewUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-primary-600 text-white flex items-center justify-between rounded-t-lg">
              <h2 className="text-lg font-bold">Nueva Unidad</h2>
              <button
                onClick={handleCancelNewUnit}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="px-6 py-4 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre:
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={newUnit.nombre}
                  onChange={handleNewUnitChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ingrese el nombre de la unidad"
                />
              </div>

              {/* Abreviatura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abreviatura:
                </label>
                <input
                  type="text"
                  name="abreviatura"
                  value={newUnit.abreviatura}
                  onChange={handleNewUnitChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ingrese la abreviatura"
                />
              </div>

              {/* Cantidad (Valor posicional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor posicional (Cantidad):
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={newUnit.cantidad}
                  onChange={handleNewUnitChange}
                  min="1"
                  step="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: 1, 10, 100, 1000"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ejemplo: Unidad = 1, Decena = 10, Centena = 100, Millar = 1000
                </p>
              </div>

              {/* Presentación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Presentación:
                </label>
                <select
                  name="presentacion"
                  value={newUnit.presentacion}
                  onChange={handleNewUnitChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </select>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                onClick={handleConfirmNewUnit}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={handleCancelNewUnit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva Marca */}
      {showNewBrandModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-primary-600 text-white flex items-center justify-between rounded-t-lg">
              <h2 className="text-lg font-bold">Nueva Marca</h2>
              <button
                onClick={() => {
                  setShowNewBrandModal(false)
                  setNewBrand('')
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="px-6 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Marca
                </label>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleConfirmNewBrand()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ingrese el nombre de la marca"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                onClick={handleConfirmNewBrand}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewBrandModal(false)
                  setNewBrand('')
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Imagen en Pantalla Completa */}
      {showImageModal && selectedImageProduct && selectedImageProduct.imagenes && selectedImageProduct.imagenes.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedImageProduct.nombre}</h2>
              <button
                onClick={() => {
                  setShowImageModal(false)
                  setSelectedImageProduct(null)
                  setSelectedImageIndex(0)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Imagen */}
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedImageProduct.imagenes[selectedImageIndex]?.preview || selectedImageProduct.imagenes[selectedImageIndex]}
                      alt={selectedImageProduct.imagenes[selectedImageIndex]?.nombre || `Imagen ${selectedImageIndex + 1}`}
                      className="w-full h-auto max-h-96 object-contain mx-auto"
                    />
                  </div>
                  
                  {/* Navegación de imágenes */}
                  {selectedImageProduct.imagenes.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedImageProduct.imagenes.map((imagen, index) => (
                        <button
                          key={imagen.id || index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            index === selectedImageIndex
                              ? 'border-primary-600 ring-2 ring-primary-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={imagen.preview || imagen}
                            alt={imagen.nombre || `Imagen ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Información del Producto e Historial */}
                <div className="space-y-6">
                  {/* Información del Producto */}
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Producto</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Código:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedImageProduct.codigoInterno || `PROD-${selectedImageProduct.id}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Categoría:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedImageProduct.categoria}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Precio Actual:</span>
                        <span className="text-sm font-semibold text-primary-600">{formatCurrency(selectedImageProduct.precio)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Stock:</span>
                        <span className="text-sm font-medium text-gray-900">{selectedImageProduct.stock} unidades</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estado:</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${getEstadoColor(selectedImageProduct.estado)}`}>
                          {selectedImageProduct.estado}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Historial de Precios */}
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Precios</h3>
                    {selectedImageProduct.precioHistorial && selectedImageProduct.precioHistorial.length > 0 ? (
                      <div className="space-y-3">
                        <div className="bg-primary-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Precio Inicial</div>
                          <div className="text-lg font-bold text-primary-700">
                            {formatCurrency(selectedImageProduct.precioHistorial[0].precio)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Desde: {new Date(selectedImageProduct.precioHistorial[0].fecha).toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          Total de modificaciones: <span className="font-semibold">{selectedImageProduct.precioHistorial.length - 1}</span>
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                          <div className="text-xs font-semibold text-gray-700 mb-2">Cambios de Precio:</div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {selectedImageProduct.precioHistorial.map((historial, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-2 rounded ${
                                  index === 0 ? 'bg-green-50' : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatCurrency(historial.precio)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(historial.fecha).toLocaleDateString('es-ES', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </div>
                                </div>
                                {index > 0 && (
                                  <div className="text-xs text-gray-600">
                                    {historial.precio > selectedImageProduct.precioHistorial[index - 1].precio ? (
                                      <span className="text-green-600">↑ +{formatCurrency(historial.precio - selectedImageProduct.precioHistorial[index - 1].precio)}</span>
                                    ) : (
                                      <span className="text-red-600">↓ {formatCurrency(historial.precio - selectedImageProduct.precioHistorial[index - 1].precio)}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4">
                        No hay historial de precios disponible
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end">
              <button
                onClick={() => {
                  setShowImageModal(false)
                  setSelectedImageProduct(null)
                  setSelectedImageIndex(0)
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
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

export default Productos

