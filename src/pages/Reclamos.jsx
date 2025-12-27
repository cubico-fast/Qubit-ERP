import { useState, useEffect } from 'react'
import { AlertCircle, Search, Calendar, X, FileText, User, Package, Clock, CheckCircle, XCircle, Plus, Edit, Eye, DollarSign, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getReclamos, saveReclamo, updateReclamo, getVentas, getProductos, getClientes, saveNotaCreditoDebito, saveVenta, saveAsientoContable, getNotasCreditoDebito, updateProducto } from '../utils/firebaseUtils'
import { formatDate, getCurrentDateSync } from '../utils/dateUtils'
import { calcularIGV } from '../utils/fiscalUtils'

const Reclamos = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [reclamos, setReclamos] = useState([])
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [reclamoSeleccionado, setReclamoSeleccionado] = useState(null)
  const [formData, setFormData] = useState({
    clienteId: '',
    ventaId: '',
    productoId: '',
    tipoReclamo: '',
    descripcion: '',
    fecha: getCurrentDateSync(),
    estado: 'Registrado',
    responsable: '',
    area: '',
    evidencia: ''
  })

  const tiposReclamo = [
    'Producto incorrecto',
    'Entrega tardía',
    'Error de facturación',
    'Mala atención'
  ]

  const estadosReclamo = [
    'Registrado',
    'En evaluación',
    'Aprobado',
    'Rechazado',
    'En solución',
    'Cerrado'
  ]

  const areas = [
    'Ventas',
    'Logística',
    'Soporte',
    'Almacén',
    'Facturación'
  ]

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [reclamosData, ventasData, productosData, clientesData] = await Promise.all([
        getReclamos(companyId).catch(() => []),
        getVentas(companyId).catch(() => []),
        getProductos(companyId).catch(() => []),
        getClientes(companyId).catch(() => [])
      ])
      
      setReclamos(reclamosData || [])
      setVentas(ventasData || [])
      setProductos(productosData || [])
      setClientes(clientesData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'Registrado':
        return 'bg-blue-100 text-blue-800'
      case 'En evaluación':
        return 'bg-yellow-100 text-yellow-800'
      case 'Aprobado':
        return 'bg-green-100 text-green-800'
      case 'Rechazado':
        return 'bg-red-100 text-red-800'
      case 'En solución':
        return 'bg-purple-100 text-purple-800'
      case 'Cerrado':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'Registrado':
        return <FileText size={16} />
      case 'En evaluación':
        return <Clock size={16} />
      case 'Aprobado':
        return <CheckCircle size={16} />
      case 'Rechazado':
        return <XCircle size={16} />
      case 'En solución':
        return <RefreshCw size={16} />
      case 'Cerrado':
        return <CheckCircle size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  const handleGuardarReclamo = async () => {
    try {
      if (!formData.clienteId) {
        alert('Por favor selecciona un cliente')
        return
      }
      if (!formData.ventaId) {
        alert('Por favor selecciona una venta')
        return
      }
      if (!formData.tipoReclamo) {
        alert('Por favor selecciona un tipo de reclamo')
        return
      }
      if (!formData.descripcion || formData.descripcion.trim() === '') {
        alert('Por favor ingresa una descripción del reclamo')
        return
      }

      // Generar número de reclamo
      const numeroReclamo = `R-${String(reclamos.length + 1).padStart(5, '0')}`
      
      const reclamoData = {
        ...formData,
        numeroReclamo,
        fechaRegistro: formData.fecha,
        cliente: clientes.find(c => c.id === formData.clienteId)?.nombres || clientes.find(c => c.id === formData.clienteId)?.nombre || '',
        ventaNumero: ventas.find(v => v.id === formData.ventaId)?.tipoComprobante || '',
        productoNombre: productos.find(p => p.id === formData.productoId)?.nombre || '',
        createdAt: new Date().toISOString()
      }

      await saveReclamo(reclamoData, companyId)
      alert('✅ Reclamo registrado exitosamente')
      
      setFormData({
        clienteId: '',
        ventaId: '',
        productoId: '',
        tipoReclamo: '',
        descripcion: '',
        fecha: getCurrentDateSync(),
        estado: 'Registrado',
        responsable: '',
        area: '',
        evidencia: ''
      })
      setShowModal(false)
      await loadData()
    } catch (error) {
      console.error('Error al guardar reclamo:', error)
      alert('Error al guardar el reclamo: ' + error.message)
    }
  }

  const handleActualizarEstado = async (reclamoId, nuevoEstado) => {
    try {
      const reclamo = reclamos.find(r => r.id === reclamoId)
      if (!reclamo) return

      const updateData = {
        estado: nuevoEstado,
        fechaActualizacion: getCurrentDateSync(),
        updatedAt: new Date().toISOString()
      }

      // Si se aprueba, asignar responsable y área si no están asignados
      if (nuevoEstado === 'Aprobado' && !reclamo.responsable) {
        updateData.responsable = reclamo.responsable || 'Pendiente'
        updateData.area = reclamo.area || 'Ventas'
      }

      await updateReclamo(reclamoId, updateData, companyId)

      alert(`✅ Estado del reclamo actualizado a: ${nuevoEstado}`)
      await loadData()
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      alert('Error al actualizar el estado: ' + error.message)
    }
  }

  const handleAplicarSolucion = async (solucion) => {
    try {
      if (!reclamoSeleccionado) return

      const ventaOriginal = ventas.find(v => v.id === reclamoSeleccionado.ventaId)
      if (!ventaOriginal) {
        alert('No se encontró la venta original')
        return
      }

      const productoVentaOriginal = ventaOriginal.productos?.find(p => 
        (p.id || p.productoId) === reclamoSeleccionado.productoId
      )

      if (!productoVentaOriginal) {
        alert('No se encontró el producto en la venta original')
        return
      }

      const baseImponibleOriginal = productoVentaOriginal.subtotal || productoVentaOriginal.precio || 0
      const igvOriginal = calcularIGV(baseImponibleOriginal)
      const totalOriginal = baseImponibleOriginal + igvOriginal

      if (solucion === 'devolucion') {
        // Devolución total - Nota de Crédito
        const notasExistentes = await getNotasCreditoDebito(companyId)
        const numeroNC = `NC01-${String(notasExistentes.filter(n => n.tipo === 'credito').length + 1).padStart(8, '0')}`
        
        const notaCreditoData = {
          tipo: 'credito',
          facturaId: ventaOriginal.id,
          facturaNumero: ventaOriginal.tipoComprobante || ventaOriginal.id,
          fecha: getCurrentDateSync(),
          motivo: `Devolución por reclamo ${reclamoSeleccionado.numeroReclamo}: ${reclamoSeleccionado.descripcion}`,
          cliente: reclamoSeleccionado.cliente || ventaOriginal.cliente || '',
          clienteId: reclamoSeleccionado.clienteId || ventaOriginal.clienteId || '',
          baseImponible: baseImponibleOriginal,
          igv: igvOriginal,
          total: totalOriginal,
          moneda: ventaOriginal.moneda || 'PEN',
          estado: 'Emitida',
          numeroComprobante: numeroNC,
          tipoComprobante: numeroNC,
          relacionadoReclamo: reclamoSeleccionado.id
        }

        await saveNotaCreditoDebito(notaCreditoData, companyId)
        await generarAsientosNotaCredito(notaCreditoData)

        // Devolver producto al stock
        const productoOriginal = productos.find(p => p.id === reclamoSeleccionado.productoId)
        if (productoOriginal) {
          const stockActual = productoOriginal.stock || 0
          const cantidadDevuelta = productoVentaOriginal.cantidad || 1
          await updateProducto(productoOriginal.id, {
            stock: stockActual + cantidadDevuelta
          }, companyId)
        }

        alert(`✅ Devolución procesada:\n- Nota de Crédito ${numeroNC} emitida\n- Producto devuelto al stock`)
      } else if (solucion === 'cambio_sin_costo') {
        // Cambio sin costo - solo actualizar stock
        alert('✅ Cambio sin costo registrado. El producto será cambiado sin afectar la facturación.')
      } else if (solucion === 'cambio_con_diferencia') {
        // Cambio con diferencia - se manejará en un modal separado
        alert('Para cambio con diferencia de precio, selecciona el producto de reemplazo en el detalle del reclamo.')
      }

      // Actualizar reclamo a "Cerrado"
      await handleActualizarEstado(reclamoSeleccionado.id, 'Cerrado')
      
      // Guardar solución aplicada
      await updateReclamo(reclamoSeleccionado.id, {
        solucionAplicada: solucion,
        fechaSolucion: getCurrentDateSync(),
        resolucion: `Solución aplicada: ${solucion === 'devolucion' ? 'Devolución total' : solucion === 'cambio_sin_costo' ? 'Cambio sin costo' : 'Cambio con diferencia'}`
      }, companyId)

      setShowDetalleModal(false)
      setReclamoSeleccionado(null)
      await loadData()
    } catch (error) {
      console.error('Error al aplicar solución:', error)
      alert('Error al aplicar la solución: ' + error.message)
    }
  }

  const generarAsientosNotaCredito = async (nota) => {
    try {
      const asientos = []
      const fecha = nota.fecha || new Date().toISOString().split('T')[0]
      const descripcionBase = `Nota de Crédito ${nota.numeroComprobante} - ${nota.cliente || 'Cliente'}`

      asientos.push({
        fecha,
        descripcion: `${descripcionBase} - Reducción de Ventas`,
        tipo: 'automatico',
        cuenta: '701 - Ventas',
        debe: nota.baseImponible,
        haber: 0,
        referencia: nota.id || '',
        origen: 'nota_credito_reclamo'
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
          origen: 'nota_credito_reclamo'
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
        origen: 'nota_credito_reclamo'
      })

      for (const asiento of asientos) {
        await saveAsientoContable(asiento, companyId)
      }
    } catch (error) {
      console.error('Error al generar asientos:', error)
      throw error
    }
  }

  const filteredReclamos = reclamos.filter(reclamo => {
    const matchesSearch = 
      reclamo.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reclamo.numeroReclamo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reclamo.tipoReclamo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reclamo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filtroEstado === 'todos') return matchesSearch
    return matchesSearch && reclamo.estado === filtroEstado
  })

  const reclamosPorEstado = {
    'Registrado': reclamos.filter(r => r.estado === 'Registrado').length,
    'En evaluación': reclamos.filter(r => r.estado === 'En evaluación').length,
    'Aprobado': reclamos.filter(r => r.estado === 'Aprobado').length,
    'En solución': reclamos.filter(r => r.estado === 'En solución').length,
    'Cerrado': reclamos.filter(r => r.estado === 'Cerrado').length
  }

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
            Reclamos
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de reclamos de clientes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Reclamo
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(reclamosPorEstado).map(([estado, cantidad]) => (
          <div key={estado} className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{estado}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{cantidad}</p>
              </div>
              {obtenerIconoEstado(estado)}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente, número de reclamo o descripción..."
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
          {estadosReclamo.map(estado => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-background)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Número</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Venta</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Responsable</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
                <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReclamos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No hay reclamos registrados
                  </td>
                </tr>
              ) : (
                filteredReclamos.map((reclamo) => (
                  <tr key={reclamo.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {reclamo.numeroReclamo || `R-${reclamo.id?.substring(0, 8)}`}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {reclamo.cliente || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {reclamo.ventaNumero || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {reclamo.tipoReclamo || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${obtenerColorEstado(reclamo.estado || 'Registrado')}`}>
                        {obtenerIconoEstado(reclamo.estado || 'Registrado')}
                        {reclamo.estado || 'Registrado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {reclamo.responsable || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {reclamo.fechaRegistro ? formatDate(reclamo.fechaRegistro) : formatDate(reclamo.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setReclamoSeleccionado(reclamo)
                          setShowDetalleModal(true)
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear reclamo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Nuevo Reclamo
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({
                    clienteId: '',
                    ventaId: '',
                    productoId: '',
                    tipoReclamo: '',
                    descripcion: '',
                    fecha: getCurrentDateSync(),
                    estado: 'Registrado',
                    responsable: '',
                    area: '',
                    evidencia: ''
                  })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Cliente *
                </label>
                <select
                  value={formData.clienteId}
                  onChange={(e) => setFormData(prev => ({ ...prev, clienteId: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombres || cliente.nombre || ''} {cliente.apellidos || ''} - {cliente.numeroDocumento || ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Venta */}
              {formData.clienteId && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Factura / Pedido *
                  </label>
                  <select
                    value={formData.ventaId}
                    onChange={(e) => {
                      const ventaSeleccionada = ventas.find(v => v.id === e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        ventaId: e.target.value,
                        productoId: ventaSeleccionada?.productos?.[0]?.id || ventaSeleccionada?.productos?.[0]?.productoId || ''
                      }))
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  >
                    <option value="">Selecciona una venta</option>
                    {ventas
                      .filter(v => v.clienteId === formData.clienteId || v.cliente === clientes.find(c => c.id === formData.clienteId)?.nombres)
                      .map((venta) => (
                        <option key={venta.id} value={venta.id}>
                          {venta.tipoComprobante || 'Venta'} - {formatDate(venta.fecha)} - {formatCurrency(venta.total || 0)}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Producto */}
              {formData.ventaId && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Producto *
                  </label>
                  <select
                    value={formData.productoId}
                    onChange={(e) => setFormData(prev => ({ ...prev, productoId: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  >
                    <option value="">Selecciona un producto</option>
                    {ventas.find(v => v.id === formData.ventaId)?.productos?.map((producto, index) => (
                      <option key={producto.id || producto.productoId || index} value={producto.id || producto.productoId || ''}>
                        {producto.nombre || 'Producto'} - {formatCurrency(producto.subtotal || producto.precio || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tipo de reclamo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Tipo de Reclamo *
                </label>
                <select
                  value={formData.tipoReclamo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipoReclamo: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <option value="">Selecciona un tipo</option>
                  {tiposReclamo.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Descripción del Problema *
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={4}
                  placeholder="Describe el problema detalladamente..."
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Fecha del Reclamo *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                />
              </div>

              {/* Responsable y Área */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Responsable
                  </label>
                  <input
                    type="text"
                    value={formData.responsable}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))}
                    placeholder="Nombre del responsable"
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Área
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  >
                    <option value="">Selecciona un área</option>
                    {areas.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleGuardarReclamo}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Guardar Reclamo
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setFormData({
                      clienteId: '',
                      ventaId: '',
                      productoId: '',
                      tipoReclamo: '',
                      descripcion: '',
                      fecha: getCurrentDateSync(),
                      estado: 'Registrado',
                      responsable: '',
                      area: '',
                      evidencia: ''
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

      {/* Modal de detalle y gestión */}
      {showDetalleModal && reclamoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Reclamo {reclamoSeleccionado.numeroReclamo || `R-${reclamoSeleccionado.id?.substring(0, 8)}`}
              </h2>
              <button
                onClick={() => {
                  setShowDetalleModal(false)
                  setReclamoSeleccionado(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Información del reclamo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cliente</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{reclamoSeleccionado.cliente || '-'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Venta</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{reclamoSeleccionado.ventaNumero || '-'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Producto</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{reclamoSeleccionado.productoNombre || '-'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tipo</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{reclamoSeleccionado.tipoReclamo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Estado</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${obtenerColorEstado(reclamoSeleccionado.estado || 'Registrado')}`}>
                    {obtenerIconoEstado(reclamoSeleccionado.estado || 'Registrado')}
                    {reclamoSeleccionado.estado || 'Registrado'}
                  </span>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Fecha</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {reclamoSeleccionado.fechaRegistro ? formatDate(reclamoSeleccionado.fechaRegistro) : formatDate(reclamoSeleccionado.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Responsable</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{reclamoSeleccionado.responsable || 'Sin asignar'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Área</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{reclamoSeleccionado.area || 'Sin asignar'}</p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>Descripción</p>
                <p style={{ color: 'var(--color-text)' }}>{reclamoSeleccionado.descripcion || '-'}</p>
              </div>

              {/* Resolución si existe */}
              {reclamoSeleccionado.resolucion && (
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Resolución</p>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{reclamoSeleccionado.resolucion}</p>
                </div>
              )}

              {/* Acciones según el estado */}
              {reclamoSeleccionado.estado !== 'Cerrado' && (
                <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                  <h3 className="font-medium mb-3" style={{ color: 'var(--color-text)' }}>Gestionar Reclamo</h3>
                  
                  {/* Cambiar estado */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                      Cambiar Estado
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {estadosReclamo
                        .filter(e => e !== reclamoSeleccionado.estado)
                        .map((estado) => (
                          <button
                            key={estado}
                            onClick={() => handleActualizarEstado(reclamoSeleccionado.id, estado)}
                            className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
                            style={{ borderColor: 'var(--color-border)' }}
                          >
                            {estado}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Aplicar solución si está aprobado */}
                  {reclamoSeleccionado.estado === 'Aprobado' && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                        Aplicar Solución
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAplicarSolucion('cambio_sin_costo')}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Cambio sin Costo
                        </button>
                        <button
                          onClick={() => handleAplicarSolucion('cambio_con_diferencia')}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Cambio + Diferencia
                        </button>
                        <button
                          onClick={() => handleAplicarSolucion('devolucion')}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Devolución Total
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reclamos

