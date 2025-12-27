import { useState, useEffect, useRef } from 'react'
import { Shield, Search, Calendar, AlertCircle, CheckCircle, XCircle, X, Package, User, FileText, Clock, RefreshCw, DollarSign, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getGarantias, saveGarantia, updateGarantia, getVentas, getProductos, updateProducto, saveNotaCreditoDebito, saveVenta, saveAsientoContable, getNotasCreditoDebito } from '../utils/firebaseUtils'
import { formatDate, getCurrentDateSync } from '../utils/dateUtils'
import { calcularIGV } from '../utils/fiscalUtils'

const Garantias = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [garantias, setGarantias] = useState([])
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [showAplicarModal, setShowAplicarModal] = useState(false)
  const [garantiaSeleccionada, setGarantiaSeleccionada] = useState(null)
  const [garantiaAplicar, setGarantiaAplicar] = useState(null)
  const [aplicarFormData, setAplicarFormData] = useState({
    accion: '',
    razon: '',
    productosSeleccionados: [] // Para cuando la acción es "cambiar"
  })
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productosSugeridos, setProductosSugeridos] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const busquedaRef = useRef(null)
  const [formData, setFormData] = useState({
    ventaId: '',
    productoId: '',
    productoNombre: '',
    fechaInicio: getCurrentDateSync(),
    plazoMeses: 12,
    descripcion: '',
    accion: 'reparar' // reparar, cambiar, reembolsar
  })

  const calcularFechaVencimiento = (fechaInicio, plazoMeses) => {
    if (!fechaInicio) return null
    
    const fecha = new Date(fechaInicio)
    fecha.setMonth(fecha.getMonth() + plazoMeses)
    
    return fecha.toISOString().split('T')[0]
  }

  const calcularDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return 0
    
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const vencimiento = new Date(fechaVencimiento)
    vencimiento.setHours(0, 0, 0, 0)
    
    const diferencia = vencimiento - hoy
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24))
    
    return dias
  }

  useEffect(() => {
    loadData()
  }, [companyId])

  // Buscador de productos para cambio de garantía
  useEffect(() => {
    if (busquedaProducto.trim() === '') {
      setProductosSugeridos([])
      setMostrarSugerencias(false)
      return
    }

    if (!productos || productos.length === 0) {
      setProductosSugeridos([])
      return
    }

    const terminoBusqueda = busquedaProducto.toLowerCase()
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
  }, [busquedaProducto, productos])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (busquedaRef.current && !busquedaRef.current.contains(event.target)) {
        setMostrarSugerencias(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      let garantiasData = []
      let ventasData = []
      let productosData = []
      
      // Intentar cargar datos, pero si falla, usar arrays vacíos
      try {
        [garantiasData, ventasData, productosData] = await Promise.all([
          getGarantias(companyId),
          getVentas(companyId),
          getProductos(companyId)
        ])
      } catch (error) {
        console.warn('Error al cargar datos de Firebase, usando datos de ejemplo:', error)
        // Si hay error, usar arrays vacíos para que se muestren los ejemplos
        garantiasData = []
        ventasData = []
        productosData = []
      }
      
      // Procesar garantías para calcular estado de vigencia
      let garantiasProcesadas = []
      
      if (garantiasData && garantiasData.length > 0) {
        garantiasProcesadas = garantiasData.map(garantia => {
          const fechaInicio = garantia.fechaInicio || garantia.fechaVenta
          const plazoMeses = garantia.plazoMeses || 12
          const fechaVencimiento = calcularFechaVencimiento(fechaInicio, plazoMeses)
          const diasRestantes = calcularDiasRestantes(fechaVencimiento)
          const estaVigente = diasRestantes > 0 && garantia.estado === 'activa'
          
          return {
            ...garantia,
            fechaVencimiento,
            diasRestantes,
            estaVigente
          }
        })
      }

      
      setGarantias(garantiasProcesadas)
      setProductos(productosData)
      
      // Filtrar solo ventas completadas para crear garantías
      const ventasValidas = ventasData.filter(v => v.estado === 'Completada')
      setVentas(ventasValidas)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const obtenerEstadoVigencia = (garantia) => {
    if (garantia.estado === 'aplicada' || garantia.estado === 'aplicado') {
      return {
        texto: 'Aplicada',
        color: 'blue',
        icono: CheckCircle
      }
    }
    
    if (garantia.estado !== 'activa') {
      return {
        texto: garantia.estado === 'reparada' ? 'Reparada' : 
               garantia.estado === 'cambiada' ? 'Cambiada' : 
               garantia.estado === 'reembolsada' ? 'Reembolsada' : 'Cerrada',
        color: 'gray',
        icono: CheckCircle
      }
    }
    
    if (garantia.diasRestantes <= 0) {
      return {
        texto: 'Vencida',
        color: 'red',
        icono: XCircle
      }
    }
    
    if (garantia.diasRestantes <= 30) {
      return {
        texto: `Por vencer (${garantia.diasRestantes} días)`,
        color: 'orange',
        icono: AlertCircle
      }
    }
    
    return {
      texto: `Vigente (${garantia.diasRestantes} días)`,
      color: 'green',
      icono: CheckCircle
    }
  }

  const handleSeleccionarVenta = (ventaId) => {
    const venta = ventas.find(v => v.id === ventaId)
    if (venta && venta.productos && venta.productos.length > 0) {
      // Si solo hay un producto, seleccionarlo automáticamente
      if (venta.productos.length === 1) {
        const producto = venta.productos[0]
        setFormData(prev => ({
          ...prev,
          ventaId: ventaId,
          productoId: producto.id || producto.productoId || '',
          productoNombre: producto.nombre || 'Producto',
          fechaInicio: venta.fecha || getCurrentDateSync()
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          ventaId: ventaId,
          fechaInicio: venta.fecha || getCurrentDateSync()
        }))
      }
    }
  }

  const handleGuardarGarantia = async () => {
    try {
      if (!formData.ventaId) {
        alert('Por favor selecciona una venta')
        return
      }
      if (!formData.productoId) {
        alert('Por favor selecciona un producto')
        return
      }
      if (!formData.plazoMeses || formData.plazoMeses <= 0) {
        alert('Por favor ingresa un plazo válido en meses')
        return
      }

      const venta = ventas.find(v => v.id === formData.ventaId)
      const producto = venta?.productos?.find(p => 
        (p.id || p.productoId) === formData.productoId
      )

      const fechaVencimiento = calcularFechaVencimiento(formData.fechaInicio, formData.plazoMeses)

      const garantiaData = {
        ventaId: formData.ventaId,
        ventaNumero: venta?.tipoComprobante || venta?.id || '',
        productoId: formData.productoId,
        productoNombre: formData.productoNombre || producto?.nombre || 'Producto',
        cliente: venta?.cliente || '',
        clienteId: venta?.clienteId || '',
        fechaInicio: formData.fechaInicio,
        fechaVenta: venta?.fecha || formData.fechaInicio,
        plazoMeses: formData.plazoMeses,
        fechaVencimiento: fechaVencimiento,
        descripcion: formData.descripcion || '',
        accion: formData.accion,
        estado: 'activa',
        montoVenta: producto?.subtotal || producto?.precio || venta?.total || 0
      }

      await saveGarantia(garantiaData, companyId)
      alert('✅ Garantía registrada exitosamente')
      
      // Limpiar formulario
      setFormData({
        ventaId: '',
        productoId: '',
        productoNombre: '',
        fechaInicio: getCurrentDateSync(),
        plazoMeses: 12,
        descripcion: '',
        accion: 'reparar'
      })
      setShowModal(false)
      
      await loadData()
    } catch (error) {
      console.error('Error al guardar garantía:', error)
      alert('Error al guardar la garantía: ' + error.message)
    }
  }

  const handleActualizarEstado = async (garantiaId, nuevoEstado) => {
    try {
      await updateGarantia(garantiaId, { estado: nuevoEstado }, companyId)
      alert(`✅ Garantía actualizada a: ${nuevoEstado}`)
      await loadData()
    } catch (error) {
      console.error('Error al actualizar garantía:', error)
      alert('Error al actualizar la garantía: ' + error.message)
    }
  }

  const handleAplicarGarantia = async () => {
    try {
      if (!aplicarFormData.razon || aplicarFormData.razon.trim() === '') {
        alert('Por favor ingresa la razón por la que se activa la garantía')
        return
      }

      if (!aplicarFormData.accion) {
        alert('Por favor selecciona una acción')
        return
      }

      // Si la acción es "cambiar", validar que se hayan seleccionado productos
      if (aplicarFormData.accion === 'cambiar') {
        if (!aplicarFormData.productosSeleccionados || aplicarFormData.productosSeleccionados.length === 0) {
          alert('Por favor selecciona al menos un producto para el cambio')
          return
        }
      }

      // Si la acción es "reembolsar", procesar devolución completa
      if (aplicarFormData.accion === 'reembolsar') {
        const todosProductos = await getProductos(companyId)
        const ventaOriginal = ventas.find(v => v.id === garantiaAplicar.ventaId)
        
        if (!ventaOriginal) {
          alert('No se encontró la venta original')
          return
        }

        // 1. Obtener información del producto original de la venta
        const productoVentaOriginal = ventaOriginal.productos?.find(p => 
          (p.id || p.productoId) === garantiaAplicar.productoId
        )
        
        if (!productoVentaOriginal) {
          alert('No se encontró el producto en la venta original')
          return
        }

        // Calcular precio del producto original
        // El subtotal en la venta ya es la base imponible (sin IGV)
        const baseImponibleOriginal = productoVentaOriginal.subtotal || productoVentaOriginal.precio || garantiaAplicar.montoVenta || 0
        const cantidadOriginal = productoVentaOriginal.cantidad || 1
        
        // Calcular IGV sobre la base imponible
        const igvOriginal = calcularIGV(baseImponibleOriginal)
        const totalOriginal = baseImponibleOriginal + igvOriginal

        // 2. Crear Nota de Crédito por la devolución
        const notasExistentes = await getNotasCreditoDebito(companyId)
        const numeroNC = `NC01-${String(notasExistentes.filter(n => n.tipo === 'credito').length + 1).padStart(8, '0')}`
        
        const notaCreditoData = {
          tipo: 'credito',
          facturaId: ventaOriginal.id,
          facturaNumero: ventaOriginal.tipoComprobante || ventaOriginal.id,
          fecha: getCurrentDateSync(),
          motivo: `Devolución por garantía: ${aplicarFormData.razon}`,
          cliente: garantiaAplicar.cliente || ventaOriginal.cliente || '',
          clienteId: garantiaAplicar.clienteId || ventaOriginal.clienteId || '',
          baseImponible: baseImponibleOriginal,
          igv: igvOriginal,
          total: totalOriginal,
          moneda: ventaOriginal.moneda || 'PEN',
          estado: 'Emitida',
          numeroComprobante: numeroNC,
          tipoComprobante: numeroNC,
          relacionadoGarantia: garantiaAplicar.id
        }

        const notaCreditoGuardada = await saveNotaCreditoDebito(notaCreditoData, companyId)

        // 3. Generar asientos contables para la Nota de Crédito
        await generarAsientosNotaCredito(notaCreditoGuardada)

        // 4. Devolver producto al stock
        const productoOriginal = todosProductos.find(p => p.id === garantiaAplicar.productoId)
        if (productoOriginal) {
          const stockActual = productoOriginal.stock || 0
          const cantidadDevuelta = cantidadOriginal
          const nuevoStock = stockActual + cantidadDevuelta
          await updateProducto(productoOriginal.id, {
            stock: nuevoStock
          }, companyId)
        }

        // 5. Actualizar la garantía con la información de devolución
        const datosActualizacion = {
          estado: 'aplicada',
          accionAplicada: 'reembolsar',
          razonAplicacion: aplicarFormData.razon,
          fechaAplicacion: getCurrentDateSync(),
          notaCreditoId: notaCreditoGuardada.id,
          notaCreditoNumero: numeroNC,
          totalDevolucion: totalOriginal,
          baseImponibleDevolucion: baseImponibleOriginal,
          igvDevolucion: igvOriginal
        }

        await updateGarantia(garantiaAplicar.id, datosActualizacion, companyId)

        alert(`✅ Devolución procesada exitosamente:\n- Nota de Crédito ${numeroNC} emitida por ${formatCurrency(totalOriginal)}\n- Producto devuelto al stock\n- Asientos contables generados`)
        
        // Limpiar formulario y cerrar modal
        setAplicarFormData({
          accion: '',
          razon: '',
          productosSeleccionados: []
        })
        setBusquedaProducto('')
        setMostrarSugerencias(false)
        setGarantiaAplicar(null)
        setShowAplicarModal(false)
        
        await loadData()
        return
      }

      // Si la acción es "cambiar", procesar cambio completo
      if (aplicarFormData.accion === 'cambiar') {
        const todosProductos = await getProductos(companyId)
        const ventaOriginal = ventas.find(v => v.id === garantiaAplicar.ventaId)
        
        if (!ventaOriginal) {
          alert('No se encontró la venta original')
          return
        }

        // 1. Obtener información del producto original de la venta
        const productoVentaOriginal = ventaOriginal.productos?.find(p => 
          (p.id || p.productoId) === garantiaAplicar.productoId
        )
        
        if (!productoVentaOriginal) {
          alert('No se encontró el producto en la venta original')
          return
        }

        // Calcular precio del producto original
        // El subtotal en la venta ya es la base imponible (sin IGV)
        const baseImponibleOriginal = productoVentaOriginal.subtotal || productoVentaOriginal.precio || garantiaAplicar.montoVenta || 0
        const cantidadOriginal = productoVentaOriginal.cantidad || 1
        
        // Calcular IGV sobre la base imponible
        const igvOriginal = calcularIGV(baseImponibleOriginal)
        const totalOriginal = baseImponibleOriginal + igvOriginal

        // 2. Calcular total de productos de reemplazo
        let totalReemplazo = 0
        const productosReemplazoCompletos = []
        
        for (const productoSeleccionado of aplicarFormData.productosSeleccionados) {
          const productoNuevo = todosProductos.find(p => p.id === productoSeleccionado.productoId)
          if (productoNuevo) {
            const stockActual = productoNuevo.stock || 0
            const cantidad = productoSeleccionado.cantidad || 1
            
            if (stockActual < cantidad) {
              alert(`No hay suficiente stock para ${productoNuevo.nombre}. Stock disponible: ${stockActual}, necesario: ${cantidad}`)
              return
            }

            // Usar precio ajustado si existe, sino usar precio original
            const precioAjustado = productoSeleccionado.precioAjustado !== undefined 
              ? productoSeleccionado.precioAjustado 
              : (productoNuevo.precio || productoNuevo.precioVenta || 0)
            
            // El precio ajustado puede ser con o sin IGV, asumimos que es con IGV
            // Extraer base imponible (precio sin IGV)
            const baseImponibleUnitario = precioAjustado / 1.18
            const subtotalProducto = baseImponibleUnitario * cantidad
            totalReemplazo += subtotalProducto

            productosReemplazoCompletos.push({
              id: productoNuevo.id,
              productoId: productoNuevo.id,
              nombre: productoNuevo.nombre,
              cantidad: cantidad,
              precio: precioAjustado, // Precio ajustado con IGV
              precioUnitario: precioAjustado, // Precio ajustado con IGV
              precioOriginal: productoNuevo.precio || productoNuevo.precioVenta || 0,
              subtotal: subtotalProducto, // Base imponible (sin IGV)
              presentacion: productoNuevo.unidad || 'Unidad'
            })
          }
        }

        // totalReemplazo ya es la base imponible (sin IGV)
        const baseImponibleReemplazo = totalReemplazo
        const igvReemplazo = calcularIGV(baseImponibleReemplazo)
        const totalReemplazoFinal = baseImponibleReemplazo + igvReemplazo

        // 3. Crear Nota de Crédito por el producto devuelto
        const notasExistentes = await getNotasCreditoDebito(companyId)
        const numeroNC = `NC01-${String(notasExistentes.filter(n => n.tipo === 'credito').length + 1).padStart(8, '0')}`
        
        const notaCreditoData = {
          tipo: 'credito',
          facturaId: ventaOriginal.id,
          facturaNumero: ventaOriginal.tipoComprobante || ventaOriginal.id,
          fecha: getCurrentDateSync(),
          motivo: `Devolución por garantía: ${aplicarFormData.razon}`,
          cliente: garantiaAplicar.cliente || ventaOriginal.cliente || '',
          clienteId: garantiaAplicar.clienteId || ventaOriginal.clienteId || '',
          baseImponible: baseImponibleOriginal,
          igv: igvOriginal,
          total: totalOriginal,
          moneda: ventaOriginal.moneda || 'PEN',
          estado: 'Emitida',
          numeroComprobante: numeroNC,
          tipoComprobante: numeroNC,
          relacionadoGarantia: garantiaAplicar.id
        }

        const notaCreditoGuardada = await saveNotaCreditoDebito(notaCreditoData, companyId)

        // Generar asientos contables para la Nota de Crédito
        await generarAsientosNotaCredito(notaCreditoGuardada)

        // 4. Crear nueva venta por productos de reemplazo
        const nuevaVentaData = {
          fecha: getCurrentDateSync(),
          fechaEntrega: getCurrentDateSync(),
          estado: 'Completada',
          vendedor: ventaOriginal.vendedor || 'Sistema',
          local: ventaOriginal.local || 'PRINCIPAL',
          almacen: ventaOriginal.almacen || 'PRINCIPAL',
          moneda: ventaOriginal.moneda || 'PEN',
          tipoCambio: ventaOriginal.tipoCambio || 0,
          tipoComprobante: 'NOTA VENTA',
          productos: productosReemplazoCompletos,
          totalProductos: productosReemplazoCompletos.length,
          subtotal: baseImponibleReemplazo,
          descuento: 0,
          baseImponible: baseImponibleReemplazo,
          impuesto: igvReemplazo,
          icbper: 0,
          total: totalReemplazoFinal,
          retencion: '',
          totalRetenido: 0,
          formaPago: ventaOriginal.formaPago || 'Contado',
          cliente: garantiaAplicar.cliente || ventaOriginal.cliente || '',
          clienteId: garantiaAplicar.clienteId || ventaOriginal.clienteId || '',
          direccionCliente: ventaOriginal.direccionCliente || '',
          numeroOrdenCompra: '',
          anotacion: `Venta por cambio de garantía - Garantía: ${garantiaAplicar.id}`,
          relacionadoGarantia: garantiaAplicar.id,
          relacionadoVentaOriginal: ventaOriginal.id
        }

        const nuevaVentaGuardada = await saveVenta(nuevaVentaData, companyId)

        // 5. Si hay diferencia de precio, crear Nota de Débito o Crédito
        const diferencia = totalReemplazoFinal - totalOriginal
        
        if (Math.abs(diferencia) > 0.01) { // Solo si hay diferencia significativa
          const tipoNota = diferencia > 0 ? 'debito' : 'credito'
          const baseDiferencia = Math.abs(diferencia) / 1.18
          const igvDiferencia = calcularIGV(baseDiferencia)
          const totalDiferencia = baseDiferencia + igvDiferencia
          
          const numeroNotaDiferencia = tipoNota === 'debito' 
            ? `ND01-${String(notasExistentes.filter(n => n.tipo === 'debito').length + 1).padStart(8, '0')}`
            : `NC01-${String(notasExistentes.filter(n => n.tipo === 'credito').length + 2).padStart(8, '0')}`
          
          const notaDiferenciaData = {
            tipo: tipoNota,
            facturaId: nuevaVentaGuardada.id,
            facturaNumero: nuevaVentaGuardada.tipoComprobante || nuevaVentaGuardada.id,
            fecha: getCurrentDateSync(),
            motivo: `Ajuste por diferencia en cambio de garantía: ${diferencia > 0 ? 'El cliente debe pagar' : 'Se debe reembolsar'} ${formatCurrency(Math.abs(diferencia))}`,
            cliente: garantiaAplicar.cliente || '',
            clienteId: garantiaAplicar.clienteId || '',
            baseImponible: baseDiferencia,
            igv: igvDiferencia,
            total: totalDiferencia,
            moneda: ventaOriginal.moneda || 'PEN',
            estado: 'Emitida',
            numeroComprobante: numeroNotaDiferencia,
            tipoComprobante: numeroNotaDiferencia,
            relacionadoGarantia: garantiaAplicar.id
          }

          await saveNotaCreditoDebito(notaDiferenciaData, companyId)
          await generarAsientosNotaDiferencia(notaDiferenciaData, tipoNota)
        }

        // 6. Actualizar stocks
        // Devolver producto original al stock
        const productoOriginal = todosProductos.find(p => p.id === garantiaAplicar.productoId)
        if (productoOriginal) {
          const stockActual = productoOriginal.stock || 0
          const cantidadDevuelta = productoVentaOriginal.cantidad || 1
          const nuevoStock = stockActual + cantidadDevuelta
          await updateProducto(productoOriginal.id, {
            stock: nuevoStock
          }, companyId)
        }

        // Reducir stock de productos nuevos
        for (const productoSeleccionado of aplicarFormData.productosSeleccionados) {
          const productoNuevo = todosProductos.find(p => p.id === productoSeleccionado.productoId)
          if (productoNuevo) {
            const stockActual = productoNuevo.stock || 0
            const cantidad = productoSeleccionado.cantidad || 1
            const nuevoStock = Math.max(0, stockActual - cantidad)
            await updateProducto(productoNuevo.id, {
              stock: nuevoStock
            }, companyId)
          }
        }

        // 7. Generar asientos contables para la nueva venta
        await generarAsientosVenta(nuevaVentaGuardada)
      }

      // Actualizar la garantía con la información de aplicación
      const datosActualizacion = {
        estado: 'aplicada',
        accionAplicada: aplicarFormData.accion,
        razonAplicacion: aplicarFormData.razon,
        fechaAplicacion: getCurrentDateSync()
      }

      // Si es cambio, guardar los productos seleccionados
      if (aplicarFormData.accion === 'cambiar' && aplicarFormData.productosSeleccionados.length > 0) {
        datosActualizacion.productosCambio = aplicarFormData.productosSeleccionados
      }

      await updateGarantia(garantiaAplicar.id, datosActualizacion, companyId)

      alert('✅ Garantía aplicada exitosamente' + (aplicarFormData.accion === 'cambiar' ? '. Los stocks han sido actualizados.' : ''))
      
      // Limpiar formulario y cerrar modal
      setAplicarFormData({
        accion: '',
        razon: '',
        productosSeleccionados: []
      })
      setBusquedaProducto('')
      setMostrarSugerencias(false)
      setGarantiaAplicar(null)
      setShowAplicarModal(false)
      
      await loadData()
    } catch (error) {
      console.error('Error al aplicar garantía:', error)
      alert('Error al aplicar la garantía: ' + error.message)
    }
  }

  // Función para generar asientos contables de Nota de Crédito
  const generarAsientosNotaCredito = async (nota) => {
    try {
      const asientos = []
      const fecha = nota.fecha || new Date().toISOString().split('T')[0]
      const descripcionBase = `Nota de Crédito ${nota.numeroComprobante} - ${nota.cliente || 'Cliente'}`

      // Asiento 1: Debe - Ventas (reduce ingresos)
      asientos.push({
        fecha,
        descripcion: `${descripcionBase} - Reducción de Ventas`,
        tipo: 'automatico',
        cuenta: '701 - Ventas',
        debe: nota.baseImponible,
        haber: 0,
        referencia: nota.id || '',
        origen: 'nota_credito_garantia'
      })

      // Asiento 2: Debe - IGV por pagar (reduce pasivo)
      if (nota.igv > 0) {
        asientos.push({
          fecha,
          descripcion: `${descripcionBase} - Reducción de IGV`,
          tipo: 'automatico',
          cuenta: '4011 - IGV',
          debe: nota.igv,
          haber: 0,
          referencia: nota.id || '',
          origen: 'nota_credito_garantia'
        })
      }

      // Asiento 3: Haber - Cuentas por Cobrar (reduce activo)
      asientos.push({
        fecha,
        descripcion: `${descripcionBase} - Reducción de Cuentas por Cobrar`,
        tipo: 'automatico',
        cuenta: '121 - Cuentas por Cobrar',
        debe: 0,
        haber: nota.total,
        referencia: nota.id || '',
        origen: 'nota_credito_garantia'
      })

      // Guardar todos los asientos
      for (const asiento of asientos) {
        await saveAsientoContable(asiento, companyId)
      }
    } catch (error) {
      console.error('Error al generar asientos de Nota de Crédito:', error)
      throw error
    }
  }

  // Función para generar asientos contables de Nota de Diferencia
  const generarAsientosNotaDiferencia = async (nota, tipo) => {
    try {
      const asientos = []
      const fecha = nota.fecha || new Date().toISOString().split('T')[0]
      const descripcionBase = `Nota de ${tipo === 'debito' ? 'Débito' : 'Crédito'} ${nota.numeroComprobante} - ${nota.cliente || 'Cliente'}`

      if (tipo === 'debito') {
        // NOTA DE DÉBITO: Aumenta el monto
        asientos.push({
          fecha,
          descripcion: `${descripcionBase} - Aumento de Cuentas por Cobrar`,
          tipo: 'automatico',
          cuenta: '121 - Cuentas por Cobrar',
          debe: nota.total,
          haber: 0,
          referencia: nota.id || '',
          origen: 'nota_diferencia_garantia'
        })

        asientos.push({
          fecha,
          descripcion: `${descripcionBase} - Ingresos Adicionales`,
          tipo: 'automatico',
          cuenta: '701 - Ventas',
          debe: 0,
          haber: nota.baseImponible,
          referencia: nota.id || '',
          origen: 'nota_diferencia_garantia'
        })

        if (nota.igv > 0) {
          asientos.push({
            fecha,
            descripcion: `${descripcionBase} - Aumento de IGV`,
            tipo: 'automatico',
            cuenta: '4011 - IGV',
            debe: 0,
            haber: nota.igv,
            referencia: nota.id || '',
            origen: 'nota_diferencia_garantia'
          })
        }
      } else {
        // NOTA DE CRÉDITO: Reduce el monto
        asientos.push({
          fecha,
          descripcion: `${descripcionBase} - Reducción de Ventas`,
          tipo: 'automatico',
          cuenta: '701 - Ventas',
          debe: nota.baseImponible,
          haber: 0,
          referencia: nota.id || '',
          origen: 'nota_diferencia_garantia'
        })

        if (nota.igv > 0) {
          asientos.push({
            fecha,
            descripcion: `${descripcionBase} - Reducción de IGV`,
            tipo: 'automatico',
            cuenta: '4011 - IGV',
            debe: nota.igv,
            haber: 0,
            referencia: nota.id || '',
            origen: 'nota_diferencia_garantia'
          })
        }

        asientos.push({
          fecha,
          descripcion: `${descripcionBase} - Reducción de Cuentas por Cobrar`,
          tipo: 'automatico',
          cuenta: '121 - Cuentas por Cobrar',
          debe: 0,
          haber: nota.total,
          referencia: nota.id || '',
          origen: 'nota_diferencia_garantia'
        })
      }

      // Guardar todos los asientos
      for (const asiento of asientos) {
        await saveAsientoContable(asiento, companyId)
      }
    } catch (error) {
      console.error('Error al generar asientos de Nota de Diferencia:', error)
      throw error
    }
  }

  // Función para generar asientos contables de Venta
  const generarAsientosVenta = async (venta) => {
    try {
      const asientos = []
      const fecha = venta.fecha || new Date().toISOString().split('T')[0]
      const descripcionBase = `Venta ${venta.tipoComprobante || 'Factura'} - ${venta.cliente || 'Cliente'}`

      // Asiento 1: Debe - Cuentas por Cobrar
      asientos.push({
        fecha,
        descripcion: descripcionBase,
        tipo: 'automatico',
        cuenta: '121 - Cuentas por Cobrar',
        debe: venta.total,
        haber: 0,
        referencia: venta.id || '',
        origen: 'venta_garantia'
      })

      // Asiento 2: Haber - Ventas
      asientos.push({
        fecha,
        descripcion: `Ingreso por Venta - ${venta.cliente || 'Cliente'}`,
        tipo: 'automatico',
        cuenta: '701 - Ventas',
        debe: 0,
        haber: venta.baseImponible || venta.subtotal,
        referencia: venta.id || '',
        origen: 'venta_garantia'
      })

      // Asiento 3: Haber - IGV por pagar
      if (venta.impuesto && venta.impuesto > 0) {
        asientos.push({
          fecha,
          descripcion: `IGV por Venta`,
          tipo: 'automatico',
          cuenta: '4011 - IGV',
          debe: 0,
          haber: venta.impuesto,
          referencia: venta.id || '',
          origen: 'venta_garantia'
        })
      }

      // Guardar todos los asientos
      for (const asiento of asientos) {
        await saveAsientoContable(asiento, companyId)
      }
    } catch (error) {
      console.error('Error al generar asientos de Venta:', error)
      throw error
    }
  }

  const filteredGarantias = garantias.filter(garantia => {
    const matchesSearch = 
      garantia.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      garantia.productoNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      garantia.ventaNumero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      garantia.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filtroEstado === 'todos') return matchesSearch
    if (filtroEstado === 'vigentes') return matchesSearch && garantia.estaVigente
    if (filtroEstado === 'vencidas') return matchesSearch && garantia.diasRestantes <= 0 && garantia.estado === 'activa'
    return matchesSearch && garantia.estado === filtroEstado
  })

  const garantiasVigentes = garantias.filter(g => g.estaVigente).length
  const garantiasVencidas = garantias.filter(g => g.diasRestantes <= 0 && g.estado === 'activa').length
  const garantiasActivas = garantias.filter(g => g.estado === 'activa').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Garantías
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de garantías de productos vendidos
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Garantías Activas</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{garantiasActivas}</p>
            </div>
            <Shield size={24} className="text-primary-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Vigentes</p>
              <p className="text-2xl font-bold text-green-600">{garantiasVigentes}</p>
            </div>
            <CheckCircle size={24} className="text-green-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Vencidas</p>
              <p className="text-2xl font-bold text-red-600">{garantiasVencidas}</p>
            </div>
            <XCircle size={24} className="text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente, producto o número de venta..."
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
          <option value="vigentes">Vigentes</option>
          <option value="vencidas">Vencidas</option>
          <option value="activa">Activas</option>
          <option value="aplicada">Aplicadas</option>
          <option value="reparada">Reparadas</option>
          <option value="cambiada">Cambiadas</option>
          <option value="reembolsada">Reembolsadas</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-background)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Venta</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Inicio</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Vencimiento</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Plazo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acción</th>
                <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Aplicar</th>
              </tr>
            </thead>
            <tbody>
              {filteredGarantias.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No hay garantías registradas
                  </td>
                </tr>
              ) : (
                filteredGarantias.map((garantia) => {
                  const estadoVigencia = obtenerEstadoVigencia(garantia)
                  const EstadoIcono = estadoVigencia.icono
                  const estaAplicada = garantia.estado === 'aplicada' || garantia.estado === 'aplicado'
                  const estaCaducada = garantia.diasRestantes <= 0 && garantia.estado === 'activa'
                  
                  return (
                    <tr 
                      key={garantia.id} 
                      className="border-t hover:bg-gray-50 transition-colors" 
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <EstadoIcono 
                            size={16} 
                            className={`${
                              estadoVigencia.color === 'green' ? 'text-green-600' :
                              estadoVigencia.color === 'red' ? 'text-red-600' :
                              estadoVigencia.color === 'orange' ? 'text-orange-600' :
                              'text-gray-600'
                            }`}
                          />
                          <span className={`px-2 py-1 rounded text-xs ${
                            estadoVigencia.color === 'green' ? 'bg-green-100 text-green-800' :
                            estadoVigencia.color === 'red' ? 'bg-red-100 text-red-800' :
                            estadoVigencia.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {estadoVigencia.texto}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                        {garantia.cliente || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                        {garantia.productoNombre || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {garantia.ventaNumero || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatDate(garantia.fechaInicio)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {garantia.fechaVencimiento ? formatDate(garantia.fechaVencimiento) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {garantia.plazoMeses || 12} meses
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {garantia.accion === 'reparar' ? 'Reparar' : 
                         garantia.accion === 'cambiar' ? 'Cambiar' : 
                         garantia.accion === 'reembolsar' ? 'Reembolsar' : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!estaAplicada && !estaCaducada) {
                              setGarantiaAplicar(garantia)
                              // Obtener las acciones del producto
                              const producto = productos.find(p => p.id === garantia.productoId)
                              let accionInicial = ''
                              
                              if (producto?.garantiaAcciones && Array.isArray(producto.garantiaAcciones) && producto.garantiaAcciones.length > 0) {
                                // Si hay acciones múltiples, usar la primera como predeterminada
                                accionInicial = producto.garantiaAcciones[0]
                              } else if (producto?.garantiaAccion) {
                                // Compatibilidad con formato antiguo (acción única)
                                accionInicial = producto.garantiaAccion
                              } else {
                                accionInicial = garantia.accion || 'reparar'
                              }
                              
                              setAplicarFormData({
                                accion: accionInicial,
                                razon: '',
                                productosSeleccionados: []
                              })
                              setShowAplicarModal(true)
                            }
                          }}
                          disabled={estaAplicada || estaCaducada}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            estaAplicada
                              ? 'bg-blue-600 text-white cursor-default'
                              : estaCaducada
                              ? 'bg-red-600 text-white cursor-default'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {estaAplicada ? 'Aplicado' : estaCaducada ? 'Caducado' : 'Aplicar Garantía'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear garantía */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Nueva Garantía
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({
                    ventaId: '',
                    productoId: '',
                    productoNombre: '',
                    fechaInicio: getCurrentDateSync(),
                    plazoMeses: 12,
                    descripcion: '',
                    accion: 'reparar'
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Seleccionar venta */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Venta *
                </label>
                <select
                  value={formData.ventaId}
                  onChange={(e) => handleSeleccionarVenta(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <option value="">Selecciona una venta</option>
                  {ventas.map((venta) => (
                    <option key={venta.id} value={venta.id}>
                      {venta.tipoComprobante || 'Venta'} - {venta.cliente || 'Cliente'} - {formatDate(venta.fecha)} - {formatCurrency(venta.total || 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleccionar producto (si hay múltiples productos) */}
              {formData.ventaId && (() => {
                const venta = ventas.find(v => v.id === formData.ventaId)
                const productos = venta?.productos || []
                
                if (productos.length > 1) {
                  return (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                        Producto *
                      </label>
                      <select
                        value={formData.productoId}
                        onChange={(e) => {
                          const producto = productos.find(p => (p.id || p.productoId) === e.target.value)
                          setFormData(prev => ({
                            ...prev,
                            productoId: e.target.value,
                            productoNombre: producto?.nombre || 'Producto'
                          }))
                        }}
                        className="w-full px-4 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                      >
                        <option value="">Selecciona un producto</option>
                        {productos.map((producto, index) => (
                          <option key={producto.id || producto.productoId || index} value={producto.id || producto.productoId || ''}>
                            {producto.nombre || 'Producto'} - {formatCurrency(producto.subtotal || producto.precio || 0)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                }
                return null
              })()}

              {/* Fecha de inicio */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                />
              </div>

              {/* Plazo en meses */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Plazo de Garantía (meses) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.plazoMeses}
                  onChange={(e) => setFormData(prev => ({ ...prev, plazoMeses: parseInt(e.target.value) || 12 }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                />
              </div>

              {/* Acción de garantía */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Acción de Garantía
                </label>
                <select
                  value={formData.accion}
                  onChange={(e) => setFormData(prev => ({ ...prev, accion: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <option value="reparar">Reparar</option>
                  <option value="cambiar">Cambiar</option>
                  <option value="reembolsar">Reembolsar</option>
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Descripción / Motivo
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                  placeholder="Descripción del problema o motivo de la garantía..."
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                />
              </div>

              {/* Resumen de fecha de vencimiento */}
              {formData.fechaInicio && formData.plazoMeses && (
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <strong>Fecha de Vencimiento:</strong> {formatDate(calcularFechaVencimiento(formData.fechaInicio, formData.plazoMeses))}
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleGuardarGarantia}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Guardar Garantía
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setFormData({
                      ventaId: '',
                      productoId: '',
                      productoNombre: '',
                      fechaInicio: getCurrentDateSync(),
                      plazoMeses: 12,
                      descripcion: '',
                      accion: 'reparar'
                    })
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {showDetalleModal && garantiaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Detalle de Garantía
              </h2>
              <button
                onClick={() => {
                  setShowDetalleModal(false)
                  setGarantiaSeleccionada(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cliente</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{garantiaSeleccionada.cliente || '-'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Producto</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{garantiaSeleccionada.productoNombre || '-'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Venta</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{garantiaSeleccionada.ventaNumero || '-'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Monto</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{formatCurrency(garantiaSeleccionada.montoVenta || 0)}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Fecha Inicio</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{formatDate(garantiaSeleccionada.fechaInicio)}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Fecha Vencimiento</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{formatDate(garantiaSeleccionada.fechaVencimiento)}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Plazo</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{garantiaSeleccionada.plazoMeses || 12} meses</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Acción</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {garantiaSeleccionada.accion === 'reparar' ? 'Reparar' : 
                     garantiaSeleccionada.accion === 'cambiar' ? 'Cambiar' : 
                     garantiaSeleccionada.accion === 'reembolsar' ? 'Reembolsar' : '-'}
                  </p>
                </div>
              </div>

              {garantiaSeleccionada.descripcion && (
                <div>
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>Descripción</p>
                  <p style={{ color: 'var(--color-text)' }}>{garantiaSeleccionada.descripcion}</p>
                </div>
              )}

              {/* Estado de vigencia */}
              {(() => {
                const estadoVigencia = obtenerEstadoVigencia(garantiaSeleccionada)
                const EstadoIcono = estadoVigencia.icono
                
                return (
                  <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <EstadoIcono 
                        size={20} 
                        className={`${
                          estadoVigencia.color === 'green' ? 'text-green-600' :
                          estadoVigencia.color === 'red' ? 'text-red-600' :
                          estadoVigencia.color === 'orange' ? 'text-orange-600' :
                          'text-gray-600'
                        }`}
                      />
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                        Estado: {estadoVigencia.texto}
                      </p>
                    </div>
                    {garantiaSeleccionada.diasRestantes !== undefined && garantiaSeleccionada.estado === 'activa' && (
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {garantiaSeleccionada.diasRestantes > 0 
                          ? `Días restantes: ${garantiaSeleccionada.diasRestantes}`
                          : 'Garantía vencida'}
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Botones de acción si está activa */}
              {garantiaSeleccionada.estado === 'activa' && (
                <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={() => handleActualizarEstado(garantiaSeleccionada.id, 'reparada')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Marcar como Reparada
                  </button>
                  <button
                    onClick={() => handleActualizarEstado(garantiaSeleccionada.id, 'cambiada')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Marcar como Cambiada
                  </button>
                  <button
                    onClick={() => handleActualizarEstado(garantiaSeleccionada.id, 'reembolsada')}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Marcar como Reembolsada
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aplicar Garantía */}
      {showAplicarModal && garantiaAplicar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Aplicar Garantía
              </h2>
              <button
                onClick={() => {
                  setShowAplicarModal(false)
                  setGarantiaAplicar(null)
                  setAplicarFormData({ accion: '', razon: '', productosSeleccionados: [] })
                  setBusquedaProducto('')
                  setMostrarSugerencias(false)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Información de la garantía */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Producto: {garantiaAplicar.productoNombre || '-'}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Cliente: {garantiaAplicar.cliente || '-'}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Venta: {garantiaAplicar.ventaNumero || '-'}
                </p>
              </div>

              {/* Acción de garantía */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Razón de la Garantía *
                </label>
                <select
                  value={aplicarFormData.accion}
                  onChange={(e) => setAplicarFormData(prev => ({ ...prev, accion: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <option value="">Selecciona una acción</option>
                  {(() => {
                    // Obtener las acciones del producto
                    const producto = productos.find(p => p.id === garantiaAplicar.productoId)
                    let accionesDisponibles = []
                    
                    if (producto?.garantiaAcciones && Array.isArray(producto.garantiaAcciones) && producto.garantiaAcciones.length > 0) {
                      // Si el producto tiene acciones múltiples definidas, usar esas
                      accionesDisponibles = producto.garantiaAcciones
                    } else if (producto?.garantiaAccion) {
                      // Compatibilidad con formato antiguo (acción única)
                      accionesDisponibles = [producto.garantiaAccion]
                    } else if (garantiaAplicar.accion) {
                      // Si no hay producto, usar la acción de la garantía
                      accionesDisponibles = [garantiaAplicar.accion]
                    } else {
                      // Por defecto, todas las opciones
                      accionesDisponibles = ['reparar', 'cambiar', 'reembolsar']
                    }
                    
                    return accionesDisponibles.map(accion => (
                      <option key={accion} value={accion}>
                        {accion === 'reparar' ? 'Reparar' : 
                         accion === 'cambiar' ? 'Cambiar' : 
                         accion === 'reembolsar' ? 'Reembolsar' : accion}
                      </option>
                    ))
                  })()}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Acciones disponibles definidas para este producto en el Maestro de Productos
                </p>
              </div>

              {/* Buscador y carrito de productos para cambio */}
              {aplicarFormData.accion === 'cambiar' && (() => {
                // Calcular totales
                const ventaOriginal = ventas.find(v => v.id === garantiaAplicar.ventaId)
                const productoVentaOriginal = ventaOriginal?.productos?.find(p => 
                  (p.id || p.productoId) === garantiaAplicar.productoId
                )
                const baseImponibleOriginal = productoVentaOriginal?.subtotal || productoVentaOriginal?.precio || garantiaAplicar.montoVenta || 0
                const igvOriginal = calcularIGV(baseImponibleOriginal)
                const totalOriginal = baseImponibleOriginal + igvOriginal

                let totalReemplazoBase = 0
                aplicarFormData.productosSeleccionados?.forEach(prod => {
                  const precioAjustado = prod.precioAjustado !== undefined ? prod.precioAjustado : (prod.precioOriginal || 0)
                  const baseUnitario = precioAjustado / 1.18
                  totalReemplazoBase += baseUnitario * (prod.cantidad || 1)
                })
                const igvReemplazo = calcularIGV(totalReemplazoBase)
                const totalReemplazo = totalReemplazoBase + igvReemplazo
                const diferencia = totalReemplazo - totalOriginal

                return (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Productos de Reemplazo *
                    </label>
                    
                    {/* Buscador de productos */}
                    <div className="relative mb-3" ref={busquedaRef}>
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={busquedaProducto}
                        onChange={(e) => {
                          setBusquedaProducto(e.target.value)
                          setMostrarSugerencias(true)
                        }}
                        onFocus={() => {
                          if (productosSugeridos.length > 0) {
                            setMostrarSugerencias(true)
                          }
                        }}
                        placeholder="Buscar producto por nombre, código interno o código de barras..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                      />
                      
                      {/* Lista de sugerencias */}
                      {mostrarSugerencias && productosSugeridos.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                          {productosSugeridos
                            .filter(p => {
                              const yaSeleccionado = aplicarFormData.productosSeleccionados?.some(sel => sel.productoId === p.id)
                              return !yaSeleccionado
                            })
                            .map((producto) => (
                              <div
                                key={producto.id}
                                onClick={() => {
                                  const precioOriginal = producto.precio || producto.precioVenta || 0
                                  setAplicarFormData(prev => ({
                                    ...prev,
                                    productosSeleccionados: [
                                      ...(prev.productosSeleccionados || []),
                                      {
                                        productoId: producto.id,
                                        nombre: producto.nombre,
                                        stock: producto.stock || 0,
                                        cantidad: 1,
                                        precioOriginal: precioOriginal,
                                        precioAjustado: precioOriginal
                                      }
                                    ]
                                  }))
                                  setBusquedaProducto('')
                                  setMostrarSugerencias(false)
                                }}
                                className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors border-b"
                                style={{ borderColor: 'var(--color-border)' }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{producto.nombre}</p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                      {producto.codigoInterno && `Código: ${producto.codigoInterno} | `}
                                      Stock: {producto.stock || 0} | Precio: {formatCurrency(producto.precio || producto.precioVenta || 0)}
                                    </p>
                                  </div>
                                  <Plus size={20} className="text-primary-600" />
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Lista de productos seleccionados */}
                    <div className="space-y-2 mb-4">
                      {aplicarFormData.productosSeleccionados && aplicarFormData.productosSeleccionados.length > 0 ? (
                        aplicarFormData.productosSeleccionados.map((prod, index) => {
                          const precioAjustado = prod.precioAjustado !== undefined ? prod.precioAjustado : (prod.precioOriginal || 0)
                          const baseUnitario = precioAjustado / 1.18
                          const subtotalProducto = baseUnitario * (prod.cantidad || 1)
                          const igvProducto = calcularIGV(baseUnitario * (prod.cantidad || 1))
                          const totalProducto = subtotalProducto + igvProducto

                          return (
                            <div key={index} className="p-3 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{prod.nombre}</p>
                                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    Stock disponible: {prod.stock || 0}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const productosActualizados = aplicarFormData.productosSeleccionados.filter((_, i) => i !== index)
                                    setAplicarFormData(prev => ({
                                      ...prev,
                                      productosSeleccionados: productosActualizados
                                    }))
                                  }}
                                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cantidad</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max={prod.stock || 0}
                                    value={prod.cantidad || 1}
                                    onChange={(e) => {
                                      const nuevaCantidad = parseInt(e.target.value) || 1
                                      const productosActualizados = [...aplicarFormData.productosSeleccionados]
                                      productosActualizados[index] = {
                                        ...prod,
                                        cantidad: Math.min(Math.max(1, nuevaCantidad), prod.stock || 0)
                                      }
                                      setAplicarFormData(prev => ({
                                        ...prev,
                                        productosSeleccionados: productosActualizados
                                      }))
                                    }}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Precio Unit. (con IGV)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={precioAjustado}
                                    onChange={(e) => {
                                      const nuevoPrecio = parseFloat(e.target.value) || 0
                                      const productosActualizados = [...aplicarFormData.productosSeleccionados]
                                      productosActualizados[index] = {
                                        ...prod,
                                        precioAjustado: nuevoPrecio
                                      }
                                      setAplicarFormData(prev => ({
                                        ...prev,
                                        productosSeleccionados: productosActualizados
                                      }))
                                    }}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                  />
                                </div>
                                <div className="flex items-end">
                                  <div className="text-right w-full">
                                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Subtotal</p>
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                      {formatCurrency(totalProducto)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {prod.precioOriginal && precioAjustado !== prod.precioOriginal && (
                                <p className="text-xs mt-1" style={{ color: precioAjustado < prod.precioOriginal ? 'green' : 'orange' }}>
                                  {precioAjustado < prod.precioOriginal 
                                    ? `Rebaja: ${formatCurrency(prod.precioOriginal - precioAjustado)}` 
                                    : `Aumento: ${formatCurrency(precioAjustado - prod.precioOriginal)}`}
                                </p>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No hay productos seleccionados. Busca y agrega productos arriba.</p>
                      )}
                    </div>

                    {/* Resumen de totales */}
                    {aplicarFormData.productosSeleccionados && aplicarFormData.productosSeleccionados.length > 0 && (
                      <div className="p-4 border rounded-lg mb-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                        <h4 className="font-medium mb-2" style={{ color: 'var(--color-text)' }}>Resumen</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-secondary)' }}>Producto Original:</span>
                            <span style={{ color: 'var(--color-text)' }}>{formatCurrency(totalOriginal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-secondary)' }}>Productos Reemplazo:</span>
                            <span style={{ color: 'var(--color-text)' }}>{formatCurrency(totalReemplazo)}</span>
                          </div>
                          <div className="border-t pt-1 mt-1" style={{ borderColor: 'var(--color-border)' }}>
                            <div className="flex justify-between font-medium">
                              <span style={{ color: 'var(--color-text)' }}>
                                {diferencia > 0 ? 'Cliente debe pagar:' : diferencia < 0 ? 'Se debe reembolsar:' : 'Sin diferencia:'}
                              </span>
                              <span style={{ 
                                color: diferencia > 0 ? 'orange' : diferencia < 0 ? 'green' : 'var(--color-text)' 
                              }}>
                                {formatCurrency(Math.abs(diferencia))}
                              </span>
                            </div>
                            {Math.abs(diferencia) > 0.01 && (
                              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                {diferencia > 0 
                                  ? 'Se generará una Nota de Débito automáticamente' 
                                  : 'Se generará una Nota de Crédito automáticamente'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      El producto original se devolverá automáticamente al stock. Puedes ajustar precios para hacer rebajas por las molestias.
                    </p>
                  </div>
                )
              })()}

              {/* Razón de aplicación */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Razón por la que se activa la garantía *
                </label>
                <textarea
                  value={aplicarFormData.razon}
                  onChange={(e) => setAplicarFormData(prev => ({ ...prev, razon: e.target.value }))}
                  rows={4}
                  placeholder="Describe el motivo por el cual se está aplicando la garantía..."
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                />
              </div>

            </div>

            {/* Botones fijos en la parte inferior */}
            <div className="p-6 border-t flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex gap-4">
                <button
                  onClick={handleAplicarGarantia}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Aplicar Garantía
                </button>
                <button
                  onClick={() => {
                    setShowAplicarModal(false)
                    setGarantiaAplicar(null)
                    setAplicarFormData({ accion: '', razon: '', productosSeleccionados: [] })
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Garantias

