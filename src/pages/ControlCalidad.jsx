import { useState, useEffect } from 'react'
import { CheckSquare, Plus, Search, Edit, Trash, X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getControlCalidad, saveControlCalidad, updateControlCalidad, getOrdenesProduccion, getProductos, updateProducto, saveMovimientoKardex, deleteControlCalidad } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const ControlCalidad = () => {
  const { companyId } = useAuth()
  const [registros, setRegistros] = useState([])
  const [ordenes, setOrdenes] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroResultado, setFiltroResultado] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    ordenProduccionId: '',
    productoId: '',
    producto: '',
    inspeccion: '',
    cantidadInspeccionada: '',
    cantidadAprobada: '',
    cantidadRechazada: '',
    motivoRechazo: '',
    resultado: 'Aprobado',
    fecha: new Date().toISOString().split('T')[0],
    inspector: '',
    observaciones: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [registrosData, ordenesData, productosData] = await Promise.all([
        getControlCalidad(companyId),
        getOrdenesProduccion(companyId),
        getProductos(companyId)
      ])
      
      setRegistros(registrosData || [])
      setOrdenes(ordenesData || [])
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setRegistros([])
      setOrdenes([])
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  const handleNuevoRegistro = () => {
    setModoModal('crear')
    setRegistroSeleccionado(null)
    setFormData({
      ordenProduccionId: '',
      productoId: '',
      producto: '',
      inspeccion: '',
      cantidadInspeccionada: '',
      cantidadAprobada: '',
      cantidadRechazada: '',
      motivoRechazo: '',
      resultado: 'Aprobado',
      fecha: new Date().toISOString().split('T')[0],
      inspector: localStorage.getItem('cubic_usuario') || 'Admin Usuario',
      observaciones: ''
    })
    setShowModal(true)
  }

  const handleSeleccionarOrden = (ordenId) => {
    const orden = ordenes.find(o => o.id === ordenId)
    if (orden) {
      setFormData({
        ...formData,
        ordenProduccionId: orden.id,
        productoId: orden.productoId,
        producto: orden.producto,
        cantidadInspeccionada: orden.cantidad
      })
    }
  }

  const calcularCantidades = () => {
    const inspeccionada = parseFloat(formData.cantidadInspeccionada) || 0
    const aprobada = parseFloat(formData.cantidadAprobada) || 0
    const rechazada = parseFloat(formData.cantidadRechazada) || 0
    
    // Ajustar automáticamente si la suma no coincide
    if (aprobada + rechazada !== inspeccionada) {
      if (formData.resultado === 'Aprobado') {
        setFormData({
          ...formData,
          cantidadAprobada: inspeccionada.toString(),
          cantidadRechazada: '0'
        })
      } else if (formData.resultado === 'Rechazado') {
        setFormData({
          ...formData,
          cantidadAprobada: '0',
          cantidadRechazada: inspeccionada.toString()
        })
      }
    }
  }

  const handleGuardarRegistro = async () => {
    try {
      if (!formData.ordenProduccionId || !formData.cantidadInspeccionada) {
        alert('Orden de producción y cantidad inspeccionada son obligatorios')
        return
      }

      const cantidadAprobada = parseFloat(formData.cantidadAprobada) || 0
      const cantidadRechazada = parseFloat(formData.cantidadRechazada) || 0

      if (cantidadAprobada + cantidadRechazada !== parseFloat(formData.cantidadInspeccionada)) {
        alert('La suma de aprobados y rechazados debe ser igual a la cantidad inspeccionada')
        return
      }

      const registroData = {
        ...formData,
        cantidadAprobada: cantidadAprobada,
        cantidadRechazada: cantidadRechazada
      }

      if (modoModal === 'crear') {
        await saveControlCalidad(registroData, companyId)
        
        // Si hay productos aprobados, actualizar stock
        if (cantidadAprobada > 0 && formData.productoId) {
          const producto = productos.find(p => p.id === formData.productoId)
          if (producto) {
            const nuevoStock = (producto.stock || 0) + cantidadAprobada
            await updateProducto(formData.productoId, {
              stock: nuevoStock
            }, companyId)

            // Registrar movimiento en kardex
            await saveMovimientoKardex({
              productoId: formData.productoId,
              almacenId: 'almacen_central', // Por defecto
              tipo: 'Entrada',
              cantidad: cantidadAprobada,
              motivo: 'Control de Calidad - Aprobado',
              referencia: `CC-${new Date().getTime()}`,
              fecha: formData.fecha
            }, companyId)
          }
        }

        alert('✅ Registro de control de calidad guardado exitosamente')
      } else {
        await updateControlCalidad(registroSeleccionado.id, registroData, companyId)
        alert('✅ Registro actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar registro:', error)
      alert('Error al guardar registro: ' + error.message)
    }
  }

  const handleEliminarRegistro = async (registro) => {
    if (!window.confirm(`¿Está seguro de eliminar este registro de control de calidad?`)) {
      return
    }

    try {
      await deleteControlCalidad(registro.id)
      await loadData()
      alert('✅ Registro eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar registro:', error)
      alert('Error al eliminar registro: ' + error.message)
    }
  }

  const getNombreProducto = (productoId) => {
    const producto = productos.find(p => p.id === productoId)
    return producto ? producto.nombre : productoId
  }

  const getResultadoColor = (resultado) => {
    switch(resultado) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800'
      case 'Rechazado':
        return 'bg-red-100 text-red-800'
      case 'Parcial':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRegistros = registros.filter(reg =>
    getNombreProducto(reg.productoId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.inspeccion?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(reg => filtroResultado === 'Todos' || reg.resultado === filtroResultado)

  const estadisticas = {
    total: registros.length,
    aprobados: registros.filter(r => r.resultado === 'Aprobado').length,
    rechazados: registros.filter(r => r.resultado === 'Rechazado').length,
    parciales: registros.filter(r => r.resultado === 'Parcial').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando registros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Control de Calidad
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Verifica que el producto cumpla estándares. Registra defectos y ajusta stock.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Inspecciones</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{estadisticas.total}</p>
            </div>
            <CheckSquare className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Aprobados</p>
              <p className="text-2xl font-bold text-green-600">{estadisticas.aprobados}</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Rechazados</p>
              <p className="text-2xl font-bold text-red-600">{estadisticas.rechazados}</p>
            </div>
            <XCircle className="text-red-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Parciales</p>
              <p className="text-2xl font-bold text-yellow-600">{estadisticas.parciales}</p>
            </div>
            <AlertTriangle className="text-yellow-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar registros..."
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
        <div className="flex gap-2">
          <select
            value={filtroResultado}
            onChange={(e) => setFiltroResultado(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="Todos">Todos</option>
            <option value="Aprobado">Aprobados</option>
            <option value="Rechazado">Rechazados</option>
            <option value="Parcial">Parciales</option>
          </select>
          <button 
            onClick={handleNuevoRegistro}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Inspección</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Inspeccionada</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Aprobada</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Rechazada</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Resultado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Inspector</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistros.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay registros de control de calidad</p>
                  <p className="text-sm">Comienza registrando una inspección</p>
                </td>
              </tr>
            ) : (
              filteredRegistros.map((registro) => (
                <tr key={registro.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {registro.fecha ? formatDate(registro.fecha) : '-'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {getNombreProducto(registro.productoId) || registro.producto}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{registro.inspeccion || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                    {registro.cantidadInspeccionada || '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">
                    {registro.cantidadAprobada || '0'}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-semibold">
                    {registro.cantidadRechazada || '0'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getResultadoColor(registro.resultado)}`}>
                      {registro.resultado || 'Aprobado'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{registro.inspector || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nuevo Registro de Calidad' : 'Editar Registro'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Orden de Producción *</label>
                <select
                  value={formData.ordenProduccionId}
                  onChange={(e) => handleSeleccionarOrden(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Seleccionar orden...</option>
                  {ordenes.map(orden => (
                    <option key={orden.id} value={orden.id}>
                      {orden.numero} - {orden.producto}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Producto</label>
                <input
                  type="text"
                  value={formData.producto}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  style={{ color: 'var(--color-text)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tipo de Inspección</label>
                <input
                  type="text"
                  value={formData.inspeccion}
                  onChange={(e) => setFormData({ ...formData, inspeccion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: Pruebas finales, Inspección visual, etc."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cantidad Inspeccionada *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cantidadInspeccionada}
                    onChange={(e) => {
                      setFormData({ ...formData, cantidadInspeccionada: e.target.value })
                      calcularCantidades()
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cantidad Aprobada</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cantidadAprobada}
                    onChange={(e) => setFormData({ ...formData, cantidadAprobada: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cantidad Rechazada</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cantidadRechazada}
                    onChange={(e) => setFormData({ ...formData, cantidadRechazada: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Resultado</label>
                <select
                  value={formData.resultado}
                  onChange={(e) => {
                    setFormData({ ...formData, resultado: e.target.value })
                    calcularCantidades()
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="Aprobado">Aprobado</option>
                  <option value="Rechazado">Rechazado</option>
                  <option value="Parcial">Parcial</option>
                </select>
              </div>

              {formData.cantidadRechazada > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Motivo de Rechazo</label>
                  <input
                    type="text"
                    value={formData.motivoRechazo}
                    onChange={(e) => setFormData({ ...formData, motivoRechazo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: Falla eléctrica, Defecto visual, etc."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Inspector</label>
                  <input
                    type="text"
                    value={formData.inspector}
                    onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Nombre del inspector"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarRegistro}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Guardar' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlCalidad

