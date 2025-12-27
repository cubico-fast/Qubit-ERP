import { useState, useEffect } from 'react'
import { Warehouse, Plus, Search, Edit, Trash, X, Package, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getAlmacenes, saveAlmacen, updateAlmacen, deleteAlmacen, getStockAlmacen, getProductos, saveTransferencia, getTransferencias, updateStockAlmacen, saveMovimientoKardex } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const Almacenes = () => {
  const { companyId } = useAuth()
  const [almacenes, setAlmacenes] = useState([])
  const [productos, setProductos] = useState([])
  const [stockPorAlmacen, setStockPorAlmacen] = useState({})
  const [transferencias, setTransferencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null)
  const [almacenSeleccionadoStock, setAlmacenSeleccionadoStock] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    responsable: '',
    telefono: '',
    estado: 'Activo',
    notas: ''
  })

  const [formTransferencia, setFormTransferencia] = useState({
    productoId: '',
    almacenOrigen: '',
    almacenDestino: '',
    cantidad: '',
    motivo: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [almacenesData, productosData, stockData, transferenciasData] = await Promise.all([
        getAlmacenes(companyId),
        getProductos(companyId),
        getStockAlmacen(null, companyId),
        getTransferencias(companyId)
      ])
      
      setAlmacenes(almacenesData || [])
      setProductos(productosData || [])
      setTransferencias(transferenciasData || [])

      // Organizar stock por almacén
      const stockPorAlmacenObj = {}
      almacenesData.forEach(alm => {
        stockPorAlmacenObj[alm.id] = stockData.filter(s => s.almacenId === alm.id)
      })
      setStockPorAlmacen(stockPorAlmacenObj)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setAlmacenes([])
      setProductos([])
      setStockPorAlmacen({})
      setTransferencias([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearAlmacen = () => {
    setModoModal('crear')
    setAlmacenSeleccionado(null)
    setFormData({
      nombre: '',
      direccion: '',
      responsable: '',
      telefono: '',
      estado: 'Activo',
      notas: ''
    })
    setShowModal(true)
  }

  const handleEditarAlmacen = (almacen) => {
    setModoModal('editar')
    setAlmacenSeleccionado(almacen)
    setFormData({
      nombre: almacen.nombre || '',
      direccion: almacen.direccion || '',
      responsable: almacen.responsable || '',
      telefono: almacen.telefono || '',
      estado: almacen.estado || 'Activo',
      notas: almacen.notas || ''
    })
    setShowModal(true)
  }

  const handleGuardarAlmacen = async () => {
    try {
      if (!formData.nombre) {
        alert('El nombre es obligatorio')
        return
      }

      if (modoModal === 'crear') {
        await saveAlmacen(formData, companyId)
        alert('✅ Almacén creado exitosamente')
      } else {
        await updateAlmacen(almacenSeleccionado.id, formData, companyId)
        alert('✅ Almacén actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar almacén:', error)
      alert('Error al guardar el almacén: ' + error.message)
    }
  }

  const handleEliminarAlmacen = async (almacen) => {
    if (!window.confirm(`¿Está seguro de eliminar el almacén ${almacen.nombre}?`)) {
      return
    }

    try {
      await deleteAlmacen(almacen.id)
      await loadData()
      alert('✅ Almacén eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar almacén:', error)
      alert('Error al eliminar el almacén: ' + error.message)
    }
  }

  const handleNuevaTransferencia = () => {
    setFormTransferencia({
      productoId: '',
      almacenOrigen: almacenes.length > 0 ? almacenes[0].id : '',
      almacenDestino: almacenes.length > 1 ? almacenes[1].id : '',
      cantidad: '',
      motivo: '',
      fecha: new Date().toISOString().split('T')[0]
    })
    setShowTransferenciaModal(true)
  }

  const handleGuardarTransferencia = async () => {
    try {
      if (!formTransferencia.productoId || !formTransferencia.almacenOrigen || 
          !formTransferencia.almacenDestino || !formTransferencia.cantidad) {
        alert('Todos los campos son obligatorios')
        return
      }

      if (formTransferencia.almacenOrigen === formTransferencia.almacenDestino) {
        alert('El almacén origen y destino no pueden ser el mismo')
        return
      }

      const cantidad = parseFloat(formTransferencia.cantidad)
      if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0')
        return
      }

      // Verificar stock disponible en almacén origen
      const stockOrigen = stockPorAlmacen[formTransferencia.almacenOrigen] || []
      const stockProducto = stockOrigen.find(s => s.productoId === formTransferencia.productoId)
      const stockDisponible = stockProducto ? parseFloat(stockProducto.cantidad || 0) : 0

      if (cantidad > stockDisponible) {
        alert(`Stock insuficiente en almacén origen. Disponible: ${stockDisponible}, Solicitado: ${cantidad}`)
        return
      }

      // Crear transferencia
      const transferencia = {
        productoId: formTransferencia.productoId,
        almacenOrigen: formTransferencia.almacenOrigen,
        almacenDestino: formTransferencia.almacenDestino,
        cantidad: cantidad,
        motivo: formTransferencia.motivo || '',
        fecha: formTransferencia.fecha,
        estado: 'Completada'
      }

      await saveTransferencia(transferencia, companyId)

      // Actualizar stock: reducir en origen, aumentar en destino
      const nuevoStockOrigen = stockDisponible - cantidad
      await updateStockAlmacen(formTransferencia.productoId, formTransferencia.almacenOrigen, nuevoStockOrigen, companyId)

      const stockDestino = (stockPorAlmacen[formTransferencia.almacenDestino] || [])
        .find(s => s.productoId === formTransferencia.productoId)
      const stockActualDestino = stockDestino ? parseFloat(stockDestino.cantidad || 0) : 0
      const nuevoStockDestino = stockActualDestino + cantidad
      await updateStockAlmacen(formTransferencia.productoId, formTransferencia.almacenDestino, nuevoStockDestino, companyId)

      // Registrar movimientos en kardex
      await saveMovimientoKardex({
        productoId: formTransferencia.productoId,
        almacenId: formTransferencia.almacenOrigen,
        tipo: 'Transferencia',
        cantidad: -cantidad,
        motivo: `Transferencia a ${almacenes.find(a => a.id === formTransferencia.almacenDestino)?.nombre || ''}`,
        referencia: `TR-${new Date().getTime()}`,
        fecha: formTransferencia.fecha
      }, companyId)

      await saveMovimientoKardex({
        productoId: formTransferencia.productoId,
        almacenId: formTransferencia.almacenDestino,
        tipo: 'Transferencia',
        cantidad: cantidad,
        motivo: `Transferencia desde ${almacenes.find(a => a.id === formTransferencia.almacenOrigen)?.nombre || ''}`,
        referencia: `TR-${new Date().getTime()}`,
        fecha: formTransferencia.fecha
      }, companyId)

      alert('✅ Transferencia realizada exitosamente')
      await loadData()
      setShowTransferenciaModal(false)
    } catch (error) {
      console.error('Error al realizar transferencia:', error)
      alert('Error al realizar transferencia: ' + error.message)
    }
  }

  const getNombreProducto = (productoId) => {
    const producto = productos.find(p => p.id === productoId)
    return producto ? producto.nombre : productoId
  }

  const getStockTotalAlmacen = (almacenId) => {
    const stock = stockPorAlmacen[almacenId] || []
    return stock.reduce((sum, s) => sum + parseFloat(s.cantidad || 0), 0)
  }

  const verStockAlmacen = (almacen) => {
    setAlmacenSeleccionadoStock(almacen)
  }

  const filteredAlmacenes = almacenes.filter(alm =>
    alm.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alm.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando almacenes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Almacenes
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Controla dónde están físicamente los productos. No afecta contabilidad, solo ubicación.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Almacenes</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{almacenes.length}</p>
            </div>
            <Warehouse className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Transferencias</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{transferencias.length}</p>
            </div>
            <ArrowRight className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar almacenes..."
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
          <button
            onClick={handleNuevaTransferencia}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ArrowRight size={20} />
            Nueva Transferencia
          </button>
          <button 
            onClick={handleCrearAlmacen}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Almacén
          </button>
        </div>
      </div>

      {/* Tabla de Almacenes */}
      <div className="border rounded-lg overflow-hidden mb-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Almacén</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Dirección</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Responsable</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Stock Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlmacenes.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Warehouse size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay almacenes registrados</p>
                  <p className="text-sm">Comienza creando tus almacenes</p>
                </td>
              </tr>
            ) : (
              filteredAlmacenes.map((almacen) => (
                <tr key={almacen.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{almacen.nombre}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{almacen.direccion || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{almacen.responsable || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                    {getStockTotalAlmacen(almacen.id).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      almacen.estado === 'Activo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {almacen.estado || 'Activo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => verStockAlmacen(almacen)}
                        className="p-1 hover:bg-gray-100 rounded text-blue-600" 
                        title="Ver Stock"
                      >
                        <Package size={16} />
                      </button>
                      <button 
                        onClick={() => handleEditarAlmacen(almacen)} 
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarAlmacen(almacen)} 
                        className="p-1 hover:bg-gray-100 rounded text-red-600" 
                        title="Eliminar"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Almacén */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nuevo Almacén' : 'Editar Almacén'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: Almacén Central"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Dirección del almacén"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Responsable</label>
                  <input
                    type="text"
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Nombre del responsable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Teléfono de contacto"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Notas adicionales..."
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
                onClick={handleGuardarAlmacen}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Crear' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transferencia */}
      {showTransferenciaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Nueva Transferencia
              </h2>
              <button 
                onClick={() => setShowTransferenciaModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Producto *</label>
                <select
                  value={formTransferencia.productoId}
                  onChange={(e) => setFormTransferencia({ ...formTransferencia, productoId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Almacén Origen *</label>
                  <select
                    value={formTransferencia.almacenOrigen}
                    onChange={(e) => setFormTransferencia({ ...formTransferencia, almacenOrigen: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Seleccionar...</option>
                    {almacenes.map(alm => (
                      <option key={alm.id} value={alm.id}>{alm.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Almacén Destino *</label>
                  <select
                    value={formTransferencia.almacenDestino}
                    onChange={(e) => setFormTransferencia({ ...formTransferencia, almacenDestino: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Seleccionar...</option>
                    {almacenes.map(alm => (
                      <option key={alm.id} value={alm.id}>{alm.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cantidad *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formTransferencia.cantidad}
                    onChange={(e) => setFormTransferencia({ ...formTransferencia, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha</label>
                  <input
                    type="date"
                    value={formTransferencia.fecha}
                    onChange={(e) => setFormTransferencia({ ...formTransferencia, fecha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Motivo</label>
                <input
                  type="text"
                  value={formTransferencia.motivo}
                  onChange={(e) => setFormTransferencia({ ...formTransferencia, motivo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Motivo de la transferencia"
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setShowTransferenciaModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarTransferencia}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Realizar Transferencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Almacenes

