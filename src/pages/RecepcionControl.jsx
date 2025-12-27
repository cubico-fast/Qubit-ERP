import { useState, useEffect, useRef } from 'react'
import { Package, Plus, Search, Edit, Trash, X, CheckCircle, XCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getRecepciones, saveRecepcion, updateRecepcion, deleteRecepcion, getOrdenesCompra, getProductos, getProveedores, saveProducto, updateProducto } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const RecepcionControl = () => {
  const { companyId } = useAuth()
  const [recepciones, setRecepciones] = useState([])
  const [ordenes, setOrdenes] = useState([])
  const [productos, setProductos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showHojaRegistro, setShowHojaRegistro] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [recepcionSeleccionada, setRecepcionSeleccionada] = useState(null)
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false)
  const [busquedaProveedor, setBusquedaProveedor] = useState('')
  const [hojaCalculoData, setHojaCalculoData] = useState([])
  const [proveedorDropdownAbierto, setProveedorDropdownAbierto] = useState(null) // { rowIndex, colKey }
  const [productoDropdownAbierto, setProductoDropdownAbierto] = useState(null) // { rowIndex, busqueda }
  const proveedorContainerRef = useRef(null)
  const tablaContainerRef = useRef(null)

  // Obtener nombre del usuario actual (por defecto "Admin Usuario")
  const usuarioActual = localStorage.getItem('cubic_usuario') || 'Admin Usuario'

  const almacenes = [
    'Almacén Central',
    'Almacén Norte',
    'Almacén Sur',
    'Almacén Principal'
  ]

  const [formData, setFormData] = useState({
    numero: '',
    numeroDocumento: '',
    fechaRecepcion: new Date().toISOString().split('T')[0],
    proveedorId: '',
    proveedor: '',
    almacen: '',
    responsable: usuarioActual
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  // Cerrar dropdown de proveedor al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (proveedorContainerRef.current && !proveedorContainerRef.current.contains(event.target)) {
        setShowProveedorDropdown(false)
      }
    }

    if (showProveedorDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProveedorDropdown])

  const loadData = async () => {
    try {
      setLoading(true)
      const [recepcionesData, ordenesData, productosData, proveedoresData] = await Promise.all([
        getRecepciones(companyId),
        getOrdenesCompra(companyId),
        getProductos(companyId),
        getProveedores(companyId)
      ])
      
      const recepcionesConNumero = recepcionesData.map((r, index) => ({
        ...r,
        numero: r.numero || `RC-${String(index + 1).padStart(5, '0')}`
      }))
      
      setRecepciones(recepcionesConNumero || [])
      setOrdenes(ordenesData || [])
      setProductos(productosData || [])
      setProveedores(proveedoresData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setRecepciones([])
      setOrdenes([])
      setProductos([])
      setProveedores([])
    } finally {
      setLoading(false)
    }
  }

  const generarNumeroRecepcion = () => {
    const total = recepciones.length + 1
    return `RC-${String(total).padStart(5, '0')}`
  }

  const handleCrearRecepcion = () => {
    setModoModal('crear')
    setRecepcionSeleccionada(null)
    setBusquedaProveedor('')
    setFormData({
      numero: generarNumeroRecepcion(),
      numeroDocumento: '',
      fechaRecepcion: new Date().toISOString().split('T')[0],
      proveedorId: '',
      proveedor: '',
      almacen: '',
      responsable: usuarioActual
    })
    setShowModal(true)
  }

  const handleEditarRecepcion = (recepcion) => {
    setModoModal('editar')
    setRecepcionSeleccionada(recepcion)
    const proveedorNombre = recepcion.proveedor || ''
    setBusquedaProveedor(proveedorNombre)
    setFormData({
      numero: recepcion.numero || generarNumeroRecepcion(),
      numeroDocumento: recepcion.numeroDocumento || recepcion.ordenCompra || '',
      fechaRecepcion: recepcion.fechaRecepcion || new Date().toISOString().split('T')[0],
      proveedorId: recepcion.proveedorId || '',
      proveedor: proveedorNombre,
      almacen: recepcion.almacen || '',
      responsable: recepcion.responsable || usuarioActual
    })
    setShowModal(true)
  }

  // Filtrar proveedores según la búsqueda (para el modal)
  const proveedoresFiltrados = proveedores.filter(prov => 
    prov.nombre?.toLowerCase().includes(busquedaProveedor.toLowerCase())
  )

  // Función para filtrar proveedores para una fila específica de la hoja de cálculo
  const filtrarProveedoresParaFila = (rowIndex, busqueda) => {
    return proveedores.filter(prov => 
      prov.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    )
  }

  const filtrarProductosParaFila = (rowIndex, busqueda) => {
    return productos.filter(prod => 
      prod.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      prod.codigoInterno?.toLowerCase().includes(busqueda.toLowerCase()) ||
      prod.codigoBarra?.toLowerCase().includes(busqueda.toLowerCase())
    )
  }

  const handleSeleccionarProveedor = (proveedor) => {
    const nombreProveedor = proveedor?.nombre || ''
    setBusquedaProveedor(nombreProveedor)
    setFormData({
      ...formData,
      proveedorId: proveedor?.id || '',
      proveedor: nombreProveedor
    })
    setShowProveedorDropdown(false)
  }

  const handleGuardarRecepcion = async () => {
    try {
      if (!formData.numeroDocumento) {
        alert('N° Documento es obligatorio')
        return
      }

      // Usar el valor de la búsqueda si existe, de lo contrario usar el del formData
      const nombreProveedorFinal = busquedaProveedor.trim() || formData.proveedor || ''

      const recepcionData = {
        ...formData,
        // Usar el proveedor de la búsqueda (puede ser nuevo o existente)
        proveedor: nombreProveedorFinal,
        proveedorId: formData.proveedorId || '', // Puede estar vacío si es un proveedor nuevo
        responsable: usuarioActual // Asegurar que siempre use el usuario actual
      }

      if (modoModal === 'crear') {
        await saveRecepcion(recepcionData, companyId)
        alert('✅ Recepción creada exitosamente')
      } else {
        await updateRecepcion(recepcionSeleccionada.id, recepcionData, companyId)
        alert('✅ Recepción actualizada exitosamente')
      }

      await loadData()
      setShowModal(false)
      setShowProveedorDropdown(false)
      setBusquedaProveedor('')
    } catch (error) {
      console.error('Error al guardar recepción:', error)
      alert('Error al guardar la recepción: ' + error.message)
    }
  }

  const handleEliminarRecepcion = async (recepcion) => {
    if (!window.confirm(`¿Está seguro de eliminar la recepción ${recepcion.numero}?`)) {
      return
    }

    try {
      await deleteRecepcion(recepcion.id)
      await loadData()
      alert('✅ Recepción eliminada exitosamente')
    } catch (error) {
      console.error('Error al eliminar recepción:', error)
      alert('Error al eliminar la recepción: ' + error.message)
    }
  }

  const filteredRecepciones = recepciones.filter(recepcion => {
    const matchSearch = 
      recepcion.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recepcion.ordenCompra?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchEstado = filtroEstado === 'Todas' || recepcion.estado === filtroEstado

    return matchSearch && matchEstado
  })

  const estadisticas = {
    total: recepciones.length,
    completas: recepciones.filter(r => r.estado === 'completa').length,
    conIncidencias: recepciones.filter(r => parseFloat(r.cantidadRechazada || 0) > 0).length,
    pendientes: recepciones.filter(r => r.estado === 'pendiente').length
  }

  // Inicializar datos de hoja de cálculo cuando se abre el modal (1000 filas)
  useEffect(() => {
    if (showHojaRegistro) {
      const filaVacia = {
        fechaRecepcion: '',
        numeroDocumento: '',
        proveedor: '',
        almacen: '',
        producto: '',
        codigo: '',
        unidad: '',
        cantidadSolicitada: '',
        cantidadRecibida: '',
        diferencia: '',
        estado: 'Completo',
        responsable: usuarioActual,
        observaciones: ''
      }
      
      // Crear 1000 filas
      const filasVacias = Array(1000).fill(null).map(() => ({ ...filaVacia }))
      
      // Si hay recepciones existentes, reemplazar las primeras filas con esos datos
      if (recepciones.length > 0) {
        const datosIniciales = recepciones.map(recepcion => {
          const orden = ordenes.find(o => o.id === recepcion.ordenCompraId)
          const producto = productos.find(p => 
            p.nombre?.toLowerCase() === orden?.producto?.toLowerCase() || 
            p.id === orden?.productoId
          )
          
          const cantidadSolicitada = parseFloat(recepcion.cantidadEsperada || 0)
          const cantidadRecibida = parseFloat(recepcion.cantidadRecibida || 0)
          const diferencia = cantidadRecibida - cantidadSolicitada
          
          let estado = 'Completo'
          if (diferencia < 0) estado = 'Incompleto'
          else if (diferencia > 0) estado = 'Excedente'
          
          return {
            fechaRecepcion: recepcion.fechaRecepcion ? formatDate(recepcion.fechaRecepcion) : '',
            numeroDocumento: recepcion.ordenCompra || recepcion.numero || '',
            proveedor: orden?.proveedor || '',
            almacen: recepcion.almacen || orden?.almacen || 'Almacén Central',
            producto: orden?.producto || '',
            codigo: producto?.codigoInterno || producto?.codigoBarra || '',
            unidad: producto?.unidad || orden?.unidad || 'Unidad',
            cantidadSolicitada: cantidadSolicitada.toString(),
            cantidadRecibida: cantidadRecibida.toString(),
            diferencia: diferencia.toString(),
            estado: estado,
            responsable: recepcion.responsable || usuarioActual,
            observaciones: recepcion.notas || recepcion.incidencias || ''
          }
        })
        
        // Reemplazar las primeras filas con datos existentes, manteniendo el total de 1000
        datosIniciales.forEach((dato, index) => {
          if (index < 1000) {
            filasVacias[index] = dato
          }
        })
        
        setHojaCalculoData(filasVacias)
      } else {
        setHojaCalculoData(filasVacias)
      }
    }
  }, [showHojaRegistro, recepciones.length, ordenes.length, productos.length, usuarioActual])

  // Función para manejar selección de producto
  const handleSeleccionarProducto = (rowIndex, producto) => {
    setHojaCalculoData(prev => {
      const nuevo = [...prev]
      nuevo[rowIndex] = {
        ...nuevo[rowIndex],
        producto: producto.nombre || '',
        codigo: producto.codigoInterno || producto.codigoBarra || '',
        unidad: producto.unidad || 'Unidad',
        productoId: producto.id // Guardar ID del producto para actualizar stock
      }
      nuevo[rowIndex].responsable = usuarioActual
      return nuevo
    })
    setProductoDropdownAbierto(null)
  }


  const actualizarCelda = (rowIndex, colKey, value) => {
    // No permitir editar el responsable ni el estado (se calcula automáticamente)
    if (colKey === 'responsable' || colKey === 'estado') {
      return
    }
    
    setHojaCalculoData(prev => {
      const nuevo = [...prev]
      nuevo[rowIndex] = { ...nuevo[rowIndex], [colKey]: value }
      
      // Si se escribe un producto nuevo, limpiar productoId
      if (colKey === 'producto') {
        nuevo[rowIndex].productoId = null
      }
      
      // Asegurar que el responsable siempre sea el usuario actual
      nuevo[rowIndex].responsable = usuarioActual
      
      // Calcular diferencia y estado automáticamente si cambia cantidad solicitada o recibida
      if (colKey === 'cantidadSolicitada' || colKey === 'cantidadRecibida') {
        const solicitada = parseFloat(nuevo[rowIndex].cantidadSolicitada) || 0
        const recibida = parseFloat(nuevo[rowIndex].cantidadRecibida) || 0
        const diferencia = recibida - solicitada
        nuevo[rowIndex].diferencia = diferencia.toString()
        
        // Actualizar estado automáticamente basado en diferencia
        // Si diferencia < 0: Incompleto
        // Si diferencia > 0: Excedente
        // Si diferencia === 0: Completo
        if (diferencia < 0) {
          nuevo[rowIndex].estado = 'Incompleto'
        } else if (diferencia > 0) {
          nuevo[rowIndex].estado = 'Excedente'
        } else {
          nuevo[rowIndex].estado = 'Completo'
        }
      }
      
      return nuevo
    })
  }

  // Función para guardar la hoja de recepción y actualizar stock
  const handleGuardarHojaRecepcion = async () => {
    try {
      // Filtrar solo las filas que tienen datos (producto y cantidad recibida)
      const filasConDatos = hojaCalculoData.filter(fila => 
        fila.producto && fila.producto.trim() && 
        fila.cantidadRecibida && parseFloat(fila.cantidadRecibida) > 0
      )

      if (filasConDatos.length === 0) {
        alert('No hay datos para guardar. Por favor, ingrese al menos un producto con cantidad recibida.')
        return
      }

      // Recargar productos actualizados
      const productosActualizados = await getProductos(companyId)

      // Procesar cada fila
      for (const fila of filasConDatos) {
        const nombreProducto = fila.producto.trim()
        const cantidadRecibida = parseFloat(fila.cantidadRecibida) || 0
        const codigo = fila.codigo?.trim() || ''
        const unidad = fila.unidad?.trim() || 'Unidad'
        
        // Buscar si el producto ya existe
        let productoExistente = productosActualizados.find(p => 
          p.nombre?.toLowerCase() === nombreProducto.toLowerCase() ||
          p.codigoInterno?.toLowerCase() === codigo.toLowerCase() ||
          p.codigoBarra?.toLowerCase() === codigo.toLowerCase()
        )

        let productoId = fila.productoId || productoExistente?.id

        if (!productoId) {
          // Crear nuevo producto
          const nuevoProducto = {
            nombre: nombreProducto,
            codigoInterno: codigo || '',
            codigoBarra: codigo || '',
            unidad: unidad,
            stock: cantidadRecibida, // Stock inicial con la cantidad recibida
            precio: 0,
            precioCompra: 0,
            categoria: 'General',
            descripcion: `Producto creado desde recepción`,
            presentaciones: [],
            tallas: [],
            colores: [],
            imagenes: [],
            precioHistorial: []
          }
          
          const productoCreado = await saveProducto(nuevoProducto, companyId)
          productoId = productoCreado.id
          
          // Actualizar la lista de productos
          productosActualizados.push({ id: productoId, ...nuevoProducto })
        } else {
          // Actualizar stock del producto existente
          const productoParaActualizar = productosActualizados.find(p => p.id === productoId)
          if (productoParaActualizar) {
            const stockActual = productoParaActualizar.stock || 0
            const nuevoStock = stockActual + cantidadRecibida
            
            await updateProducto(productoId, {
              stock: nuevoStock
            }, companyId)
          }
        }

        // Guardar recepción (si es necesario)
        const recepcionData = {
          numero: fila.numeroDocumento || generarNumeroRecepcion(),
          numeroDocumento: fila.numeroDocumento || '',
          fechaRecepcion: fila.fechaRecepcion || new Date().toISOString().split('T')[0],
          proveedorId: '',
          proveedor: fila.proveedor || '',
          almacen: fila.almacen || '',
          responsable: fila.responsable || usuarioActual,
          estado: fila.estado || 'completa',
          cantidadEsperada: parseFloat(fila.cantidadSolicitada) || 0,
          cantidadRecibida: cantidadRecibida,
          cantidadRechazada: 0,
          notas: fila.observaciones || '',
          productoId: productoId,
          producto: nombreProducto
        }

        await saveRecepcion(recepcionData, companyId)
      }

      alert(`✅ Hoja de recepción guardada exitosamente. Se procesaron ${filasConDatos.length} productos y el stock ha sido actualizado.`)
      
      // Recargar datos
      await loadData()
      
      // Cerrar modal
      setShowHojaRegistro(false)
    } catch (error) {
      console.error('Error al guardar hoja de recepción:', error)
      alert('Error al guardar la hoja de recepción: ' + error.message)
    }
  }

  // Agregar nueva fila (si hay menos de 1000)
  const agregarFila = () => {
    setHojaCalculoData(prev => {
      if (prev.length >= 1000) {
        alert('Se ha alcanzado el límite máximo de 1000 filas')
        return prev
      }
      return [...prev, {
        fechaRecepcion: '',
        numeroDocumento: '',
        proveedor: '',
        almacen: '',
        producto: '',
        codigo: '',
        unidad: '',
        cantidadSolicitada: '',
        cantidadRecibida: '',
        diferencia: '',
        estado: 'Completo',
        responsable: usuarioActual,
        observaciones: ''
      }]
    })
  }

  // Preparar datos para la hoja de registro (versión estática para compatibilidad)
  const datosHojaRegistro = recepciones.map(recepcion => {
    const orden = ordenes.find(o => o.id === recepcion.ordenCompraId)
    const producto = productos.find(p => 
      p.nombre?.toLowerCase() === orden?.producto?.toLowerCase() || 
      p.id === orden?.productoId
    )
    
    const cantidadSolicitada = parseFloat(recepcion.cantidadEsperada || 0)
    const cantidadRecibida = parseFloat(recepcion.cantidadRecibida || 0)
    const diferencia = cantidadRecibida - cantidadSolicitada
    
    // Determinar estado basado en la diferencia
    let estado = 'Completo'
    if (diferencia < 0) estado = 'Incompleto'
    else if (diferencia > 0) estado = 'Excedente'
    
    return {
      fechaRecepcion: recepcion.fechaRecepcion ? formatDate(recepcion.fechaRecepcion) : '',
      numeroDocumento: recepcion.ordenCompra || recepcion.numero || '',
      proveedor: orden?.proveedor || '',
      almacen: recepcion.almacen || orden?.almacen || 'Almacén Central',
      producto: orden?.producto || '',
      codigo: producto?.codigoInterno || producto?.codigoBarra || '',
      unidad: producto?.unidad || orden?.unidad || 'Unidad',
      cantidadSolicitada: cantidadSolicitada,
      cantidadRecibida: cantidadRecibida,
      diferencia: diferencia,
      estado: estado,
      responsable: recepcion.responsable || '',
      observaciones: recepcion.notas || recepcion.incidencias || ''
    }
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Recepción y Control
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Controla que lo recibido sea lo que compraste (verificación física)
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Recepciones</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {loading ? '...' : estadisticas.total}
              </p>
            </div>
            <Package className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Completas</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : estadisticas.completas}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Con Incidencias</p>
              <p className="text-2xl font-bold text-red-600">
                {loading ? '...' : estadisticas.conIncidencias}
              </p>
            </div>
            <AlertTriangle className="text-red-500" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por número, orden de compra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ 
              borderColor: 'var(--color-border)', 
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          />
        </div>
        <button 
          onClick={handleCrearRecepcion}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Recepción
        </button>
      </div>

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">📌 Recepción y Control: Verificación Física</h3>
        <p className="text-sm text-blue-800 mb-2">
          Controla que lo recibido sea lo que compraste. Ejemplo: Llegan 10 tóners, pero 1 está dañado.
        </p>
        <ul className="text-sm text-blue-700 space-y-1 ml-4">
          <li>• Actualiza stock</li>
          <li>• Registra incidencias</li>
          <li>• No paga lo defectuoso</li>
        </ul>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setFiltroEstado('Todas')}
          className={`px-3 py-1 text-sm border rounded-full ${filtroEstado === 'Todas' ? 'bg-blue-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Todas
        </button>
        <button 
          onClick={() => setFiltroEstado('pendiente')}
          className={`px-3 py-1 text-sm border rounded-full ${filtroEstado === 'pendiente' ? 'bg-orange-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Pendientes
        </button>
        <button 
          onClick={() => setFiltroEstado('completa')}
          className={`px-3 py-1 text-sm border rounded-full ${filtroEstado === 'completa' ? 'bg-green-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Completas
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Número</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Orden Compra</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Esperado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Recibido</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Rechazado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha Recepción</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>Cargando...</td></tr>
            ) : filteredRecepciones.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Package size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay recepciones registradas</p>
                </td>
              </tr>
            ) : (
              filteredRecepciones.map((recepcion) => {
                const rechazados = parseFloat(recepcion.cantidadRechazada || 0)
                return (
                  <tr key={recepcion.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>{recepcion.numero}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{recepcion.ordenCompra || '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{recepcion.cantidadEsperada}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">{recepcion.cantidadRecibida}</td>
                    <td className={`px-4 py-3 font-semibold ${rechazados > 0 ? 'text-red-600' : ''}`}>
                      {rechazados > 0 ? rechazados : '-'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {recepcion.fechaRecepcion ? formatDate(recepcion.fechaRecepcion) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        recepcion.estado === 'completa' ? 'bg-green-100 text-green-800' :
                        recepcion.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {recepcion.estado || 'pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditarRecepcion(recepcion)} className="p-1 hover:bg-gray-100 rounded" title="Editar">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleEliminarRecepcion(recepcion)} className="p-1 hover:bg-gray-100 rounded" title="Eliminar">
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Cerrar dropdown de proveedor al hacer clic fuera
            if (e.target === e.currentTarget) {
              setShowProveedorDropdown(false)
            }
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nueva Recepción' : 'Editar Recepción'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setShowProveedorDropdown(false)
                  setBusquedaProveedor('')
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Número</label>
                  <input type="text" value={formData.numero} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100" />
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Generado automáticamente</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>N° Documento (Guía de Remisión) *</label>
                  <input
                    type="text"
                    value={formData.numeroDocumento}
                    onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: GR-001234"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha de Recepción *</label>
                  <input
                    type="date"
                    value={formData.fechaRecepcion}
                    onChange={(e) => setFormData({ ...formData, fechaRecepcion: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    required
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Courrier (✈️🚛🚖)</label>
                  <div className="relative" ref={proveedorContainerRef}>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                      type="text"
                      value={busquedaProveedor}
                      onChange={(e) => {
                        const valor = e.target.value
                        setBusquedaProveedor(valor)
                        setShowProveedorDropdown(valor.length > 0)
                        
                        // Buscar si hay un proveedor exacto
                        const proveedorEncontrado = proveedores.find(p => 
                          p.nombre.toLowerCase() === valor.toLowerCase()
                        )
                        
                        setFormData({
                          ...formData,
                          proveedorId: proveedorEncontrado?.id || '',
                          proveedor: valor // Permitir escribir proveedores nuevos
                        })
                      }}
                      onFocus={() => setShowProveedorDropdown(true)}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                      placeholder="Buscar o escribir proveedor..."
                    />
                    {showProveedorDropdown && busquedaProveedor && proveedoresFiltrados.length > 0 && (
                      <div 
                        className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                        onMouseDown={(e) => e.preventDefault()} // Prevenir que el input pierda el foco
                      >
                        {proveedoresFiltrados.map((proveedor) => (
                          <button
                            key={proveedor.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleSeleccionarProveedor(proveedor)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {proveedor.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Opcional: Busca o escribe un proveedor nuevo
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Responsable</label>
                  <input
                    type="text"
                    value={formData.responsable}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                    style={{ color: 'var(--color-text)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Asignado automáticamente</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-4" style={{ borderColor: 'var(--color-border)' }}>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setShowProveedorDropdown(false)
                  setBusquedaProveedor('')
                }} 
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors" 
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              <button 
                onClick={() => setShowHojaRegistro(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet size={18} />
                HOJA DE RECEPCIÓN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hoja de Registro */}
      {showHojaRegistro && (
        <>
          <style>{`
            .no-spinners::-webkit-inner-spin-button,
            .no-spinners::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
          `}</style>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-[95vw] h-[90vh] flex flex-col hoja-recepcion-modal" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  Hoja de Recepción
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowHojaRegistro(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>
            <div className="flex-1 overflow-hidden p-4">
              <div 
                ref={tablaContainerRef}
                className="overflow-x-auto overflow-y-auto h-full" 
                style={{ 
                  maxHeight: 'calc(90vh - 180px)'
                }}
              >
                <div>
                  <table className="border-collapse" style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', minWidth: '100%', width: 'max-content' }}>
                  <thead className="hoja-recepcion-thead" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--hoja-recepcion-header-bg, #f3f4f6)' }}>
                    <tr>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '120px' }}>
                        Fecha de Recepción
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '120px' }}>
                        N° Documento
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '150px' }}>
                        Proveedor
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '120px' }}>
                        Almacén
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '150px' }}>
                        Producto
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '100px' }}>
                        Código
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '100px' }}>
                        Unidad
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '130px' }}>
                        Cantidad Solicitada
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '130px' }}>
                        Cantidad Recibida
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '100px' }}>
                        Diferencia
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '100px' }}>
                        Estado
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '120px' }}>
                        Responsable
                      </th>
                      <th className="border px-3 py-2 text-left font-semibold bg-gray-100 whitespace-nowrap" style={{ borderColor: '#d1d5db', minWidth: '200px' }}>
                        Observaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hojaCalculoData.length === 0 ? (
                      <tr>
                        <td colSpan="13" className="border px-3 py-4 text-center" style={{ borderColor: '#d1d5db', color: 'var(--color-text-secondary)' }}>
                          No hay datos. Haga clic en "Agregar Fila" para comenzar.
                        </td>
                      </tr>
                    ) : (
                      hojaCalculoData.map((fila, rowIndex) => {
                        const diferencia = parseFloat(fila.diferencia) || 0
                        
                        return (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {/* Fecha de Recepción */}
                            <td className="border p-0" style={{ borderColor: '#d1d5db' }}>
                              <input
                                type="text"
                                value={fila.fechaRecepcion || ''}
                                onChange={(e) => actualizarCelda(rowIndex, 'fechaRecepcion', e.target.value)}
                                className="w-full px-2 py-1 border-0 outline-none focus:bg-blue-50"
                                style={{ fontSize: '13px', color: 'var(--color-text)' }}
                                placeholder="dd/mm/aaaa"
                              />
                            </td>
                            {/* N° Documento */}
                            <td className="border p-0" style={{ borderColor: '#d1d5db' }}>
                              <input
                                type="text"
                                value={fila.numeroDocumento || ''}
                                onChange={(e) => actualizarCelda(rowIndex, 'numeroDocumento', e.target.value)}
                                className="w-full px-2 py-1 border-0 outline-none focus:bg-blue-50"
                                style={{ fontSize: '13px', color: 'var(--color-text)' }}
                                placeholder="Ej: GR-001234"
                              />
                            </td>
                            {/* Proveedor */}
                            <td className="border p-0 relative" style={{ borderColor: '#d1d5db' }}>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={fila.proveedor || ''}
                                  onChange={(e) => {
                                    actualizarCelda(rowIndex, 'proveedor', e.target.value)
                                    setProveedorDropdownAbierto({ rowIndex, busqueda: e.target.value })
                                  }}
                                  onFocus={() => setProveedorDropdownAbierto({ rowIndex, busqueda: fila.proveedor || '' })}
                                  onBlur={() => setTimeout(() => setProveedorDropdownAbierto(null), 200)}
                                  className="w-full px-2 py-1 border-0 outline-none focus:bg-blue-50"
                                  style={{ fontSize: '13px', color: 'var(--color-text)' }}
                                />
                                {proveedorDropdownAbierto?.rowIndex === rowIndex && 
                                 proveedorDropdownAbierto?.busqueda &&
                                 filtrarProveedoresParaFila(rowIndex, proveedorDropdownAbierto.busqueda).length > 0 && (
                                  <div 
                                    className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto"
                                    style={{ 
                                      borderColor: '#d1d5db', 
                                      backgroundColor: 'var(--color-surface)',
                                      top: '100%',
                                      left: 0
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    {filtrarProveedoresParaFila(rowIndex, proveedorDropdownAbierto.busqueda).map((proveedor) => (
                                      <button
                                        key={proveedor.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          actualizarCelda(rowIndex, 'proveedor', proveedor.nombre)
                                          setProveedorDropdownAbierto(null)
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                                        style={{ color: 'var(--color-text)', fontSize: '13px' }}
                                      >
                                        {proveedor.nombre}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            {/* Almacén */}
                            <td className="border p-0" style={{ borderColor: '#d1d5db' }}>
                              <input
                                type="text"
                                value={fila.almacen || ''}
                                onChange={(e) => actualizarCelda(rowIndex, 'almacen', e.target.value)}
                                className="w-full px-2 py-1 border-0 outline-none focus:bg-blue-50"
                                style={{ fontSize: '13px', color: 'var(--color-text)' }}
                              />
                            </td>
                            {/* Producto */}
                            <td className="border p-0 relative" style={{ borderColor: '#d1d5db' }}>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={fila.producto || ''}
                                  onChange={(e) => {
                                    actualizarCelda(rowIndex, 'producto', e.target.value)
                                    setProductoDropdownAbierto({ rowIndex, busqueda: e.target.value })
                                  }}
                                  onFocus={() => setProductoDropdownAbierto({ rowIndex, busqueda: fila.producto || '' })}
                                  onBlur={() => setTimeout(() => setProductoDropdownAbierto(null), 200)}
                                  className="w-full px-2 py-1 border-0 outline-none focus:bg-blue-50"
                                  style={{ fontSize: '13px', color: 'var(--color-text)' }}
                                />
                                {productoDropdownAbierto?.rowIndex === rowIndex && 
                                 productoDropdownAbierto?.busqueda &&
                                 filtrarProductosParaFila(rowIndex, productoDropdownAbierto.busqueda).length > 0 && (
                                  <div 
                                    className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto"
                                    style={{ 
                                      borderColor: '#d1d5db', 
                                      backgroundColor: 'var(--color-surface)',
                                      top: '100%',
                                      left: 0
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    {filtrarProductosParaFila(rowIndex, productoDropdownAbierto.busqueda).map((producto) => (
                                      <button
                                        key={producto.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleSeleccionarProducto(rowIndex, producto)
                                          setProductoDropdownAbierto(null)
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                                        style={{ color: 'var(--color-text)', fontSize: '13px' }}
                                      >
                                        {producto.nombre} {producto.codigoInterno ? `(${producto.codigoInterno})` : ''}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            {/* Código */}
                            <td className="border p-0" style={{ borderColor: '#d1d5db' }}>
                              <input
                                type="text"
                                value={fila.codigo || ''}
                                onChange={(e) => actualizarCelda(rowIndex, 'codigo', e.target.value)}
                                className="w-full px-2 py-1 border-0 outline-none focus:bg-blue-50"
                                style={{ fontSize: '13px', color: 'var(--color-text)' }}
                              />
                            </td>
                            {/* Unidad */}
                            <td className="border p-0" style={{ borderColor: '#d1d5db' }}>
                              <input
                                type="text"
                                value={fila.unidad || ''}
                                onChange={(e) => actualizarCelda(rowIndex, 'unidad', e.target.value)}
                                className="w-full px-2 py-1 border-0 outline-none focus:bg-blue-50"
                                style={{ fontSize: '13px', color: 'var(--color-text)' }}
                              />
                            </td>
                            {/* Cantidad Solicitada */}
                            <td className="border p-0 text-right" style={{ borderColor: '#d1d5db' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={fila.cantidadSolicitada || ''}
                                onChange={(e) => actualizarCelda(rowIndex, 'cantidadSolicitada', e.target.value)}
                                className="w-full px-2 py-1 border-0 outline-none focus:bg-blue-50 text-right no-spinners"
                                style={{ 
                                  fontSize: '13px', 
                                  color: 'var(--color-text)',
                                  MozAppearance: 'textfield'
                                }}
                                onWheel={(e) => e.target.blur()}
                              />
                            </td>
                            {/* Cantidad Recibida */}
                            <td className="border p-0 text-right" style={{ borderColor: '#d1d5db' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={fila.cantidadRecibida || ''}
                                onChange={(e) => actualizarCelda(rowIndex, 'cantidadRecibida', e.target.value)}
                                className="w-full px-2 py-1 border-0 outline-none focus:bg-blue-50 text-right font-semibold no-spinners"
                                style={{ 
                                  fontSize: '13px', 
                                  color: '#16a34a',
                                  MozAppearance: 'textfield'
                                }}
                                onWheel={(e) => e.target.blur()}
                              />
                            </td>
                            {/* Diferencia (calculada automáticamente, solo lectura) */}
                            <td className={`border px-2 py-1 text-right font-semibold ${diferencia < 0 ? 'text-red-600' : diferencia > 0 ? 'text-blue-600' : ''}`} style={{ borderColor: '#d1d5db', fontSize: '13px' }}>
                              {diferencia !== 0 ? (diferencia > 0 ? '+' : '') + diferencia : '0'}
                            </td>
                            {/* Estado */}
                            <td className="border px-2 py-1" style={{ borderColor: '#d1d5db' }}>
                              <span className={`px-2 py-1 text-xs rounded-full inline-block ${
                                fila.estado === 'Completo' ? 'bg-green-100 text-green-800' :
                                fila.estado === 'Incompleto' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {fila.estado || 'Completo'}
                              </span>
                            </td>
                            {/* Responsable */}
                            <td className="border px-2 py-1 hoja-recepcion-responsable" style={{ borderColor: '#d1d5db', backgroundColor: 'var(--hoja-recepcion-header-bg, #f3f4f6)' }}>
                              <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                                {usuarioActual}
                              </span>
                            </td>
                            {/* Observaciones */}
                            <td className="border p-0" style={{ borderColor: '#d1d5db' }}>
                              <input
                                type="text"
                                value={fila.observaciones || ''}
                                onChange={(e) => actualizarCelda(rowIndex, 'observaciones', e.target.value)}
                                className="w-full px-2 py-1 border-0 outline-none focus:bg-blue-50"
                                style={{ fontSize: '13px', color: 'var(--color-text)' }}
                              />
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={agregarFila}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Agregar Fila
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={handleGuardarHojaRecepcion}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  Guardar
                </button>
                <button 
                  onClick={() => setShowHojaRegistro(false)} 
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  )
}

export default RecepcionControl


