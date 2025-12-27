import { useState, useEffect } from 'react'
import { Package, Plus, Search, TrendingUp, TrendingDown, Edit, X, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getKardex, saveMovimientoKardex, getProductos, getAlmacenes, updateStockAlmacen, getStockAlmacen } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const ControlStock = () => {
  const { companyId } = useAuth()
  const [movimientos, setMovimientos] = useState([])
  const [productos, setProductos] = useState([])
  const [almacenes, setAlmacenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('entrada')

  const [formData, setFormData] = useState({
    productoId: '',
    almacenId: '',
    tipo: 'Entrada',
    cantidad: '',
    motivo: '',
    referencia: '',
    fecha: new Date().toISOString().split('T')[0],
    lote: '',
    serie: '',
    vencimiento: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [movimientosData, productosData, almacenesData] = await Promise.all([
        getKardex(null, companyId),
        getProductos(companyId),
        getAlmacenes(companyId)
      ])
      
      setMovimientos(movimientosData || [])
      setProductos(productosData || [])
      setAlmacenes(almacenesData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setMovimientos([])
      setProductos([])
      setAlmacenes([])
    } finally {
      setLoading(false)
    }
  }

  const handleNuevoMovimiento = (tipo) => {
    setModoModal(tipo)
    setFormData({
      productoId: '',
      almacenId: almacenes.length > 0 ? almacenes[0].id : '',
      tipo: tipo,
      cantidad: '',
      motivo: '',
      referencia: '',
      fecha: new Date().toISOString().split('T')[0],
      lote: '',
      serie: '',
      vencimiento: ''
    })
    setShowModal(true)
  }

  const handleGuardarMovimiento = async () => {
    try {
      if (!formData.productoId || !formData.almacenId || !formData.cantidad) {
        alert('Producto, almacén y cantidad son obligatorios')
        return
      }

      const cantidad = parseFloat(formData.cantidad)
      if (cantidad <= 0) {
        alert('La cantidad debe ser mayor a 0')
        return
      }

      // Determinar el signo de la cantidad según el tipo
      let cantidadMovimiento = cantidad
      if (formData.tipo === 'Salida' || formData.tipo === 'Merma' || formData.tipo === 'Consumo Interno') {
        cantidadMovimiento = -cantidad
      }

      // Obtener stock actual del almacén
      const stockActual = await getStockActual(formData.productoId, formData.almacenId)
      
      // Validar que haya stock suficiente para salidas
      if (cantidadMovimiento < 0 && Math.abs(cantidadMovimiento) > stockActual) {
        alert(`Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${Math.abs(cantidadMovimiento)}`)
        return
      }

      // Crear el movimiento
      const movimiento = {
        productoId: formData.productoId,
        almacenId: formData.almacenId,
        tipo: formData.tipo,
        cantidad: cantidadMovimiento,
        motivo: formData.motivo || '',
        referencia: formData.referencia || '',
        fecha: formData.fecha,
        lote: formData.lote || '',
        serie: formData.serie || '',
        vencimiento: formData.vencimiento || ''
      }

      await saveMovimientoKardex(movimiento, companyId)

      // Actualizar stock en almacén
      const nuevoStock = stockActual + cantidadMovimiento
      await updateStockAlmacen(formData.productoId, formData.almacenId, nuevoStock, companyId)

      alert('✅ Movimiento registrado exitosamente')
      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar movimiento:', error)
      alert('Error al guardar movimiento: ' + error.message)
    }
  }

  const getStockActual = async (productoId, almacenId) => {
    try {
      const stockData = await getStockAlmacen(almacenId, companyId)
      const stockItem = stockData.find(s => s.productoId === productoId && s.almacenId === almacenId)
      return stockItem ? parseFloat(stockItem.cantidad || 0) : 0
    } catch (error) {
      console.error('Error al obtener stock:', error)
      return 0
    }
  }

  const getNombreProducto = (productoId) => {
    const producto = productos.find(p => p.id === productoId)
    return producto ? producto.nombre : productoId
  }

  const getNombreAlmacen = (almacenId) => {
    const almacen = almacenes.find(a => a.id === almacenId)
    return almacen ? almacen.nombre : almacenId
  }

  const filteredMovimientos = movimientos.filter(mov => {
    const matchSearch = 
      getNombreProducto(mov.productoId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.serie?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchTipo = filtroTipo === 'Todos' || mov.tipo === filtroTipo
    
    return matchSearch && matchTipo
  })

  const tiposMovimiento = ['Entrada', 'Salida', 'Ajuste']
  const motivosEntrada = ['Compra', 'Devolución', 'Ajuste Positivo', 'Otro']
  const motivosSalida = ['Venta', 'Merma', 'Consumo Interno', 'Ajuste Negativo', 'Otro']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando movimientos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Control de Stock
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Registra cada movimiento de inventario. Nada se mueve "a mano".
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Movimientos</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{movimientos.length}</p>
            </div>
            <Package className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Entradas</p>
              <p className="text-2xl font-bold text-green-600">
                {movimientos.filter(m => m.tipo === 'Entrada' && m.cantidad > 0).length}
              </p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Salidas</p>
              <p className="text-2xl font-bold text-red-600">
                {movimientos.filter(m => m.tipo === 'Salida' || m.cantidad < 0).length}
              </p>
            </div>
            <TrendingDown className="text-red-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ajustes</p>
              <p className="text-2xl font-bold text-blue-600">
                {movimientos.filter(m => m.tipo === 'Ajuste').length}
              </p>
            </div>
            <Edit className="text-blue-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por producto, motivo, referencia, lote, serie..."
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
            onClick={() => handleNuevoMovimiento('Entrada')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Entrada
          </button>
          <button
            onClick={() => handleNuevoMovimiento('Salida')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Salida
          </button>
          <button
            onClick={() => handleNuevoMovimiento('Ajuste')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Ajuste
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-2 border rounded-lg"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
        >
          <option value="Todos">Todos los tipos</option>
          {tiposMovimiento.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Almacén</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tipo</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cantidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Motivo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Referencia</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Lote/Serie</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovimientos.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Package size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay movimientos registrados</p>
                  <p className="text-sm">Comienza registrando movimientos de inventario</p>
                </td>
              </tr>
            ) : (
              filteredMovimientos.map((mov) => (
                <tr key={mov.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {mov.fecha ? formatDate(mov.fecha) : '-'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {getNombreProducto(mov.productoId)}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {getNombreAlmacen(mov.almacenId)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      mov.tipo === 'Entrada' || mov.cantidad > 0
                        ? 'bg-green-100 text-green-800'
                        : mov.tipo === 'Salida' || mov.cantidad < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {mov.tipo || (mov.cantidad > 0 ? 'Entrada' : 'Salida')}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${mov.cantidad > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{mov.motivo || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{mov.referencia || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {mov.lote && `Lote: ${mov.lote}`}
                    {mov.serie && `${mov.lote ? ' / ' : ''}Serie: ${mov.serie}`}
                    {!mov.lote && !mov.serie && '-'}
                  </td>
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
                Nueva {formData.tipo}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Producto *</label>
                  <select
                    value={formData.productoId}
                    onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Seleccionar producto...</option>
                    {productos.map(prod => (
                      <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Almacén *</label>
                  <select
                    value={formData.almacenId}
                    onChange={(e) => setFormData({ ...formData, almacenId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Seleccionar almacén...</option>
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
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0"
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Motivo</label>
                <select
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Seleccionar motivo...</option>
                  {(formData.tipo === 'Entrada' ? motivosEntrada : motivosSalida).map(motivo => (
                    <option key={motivo} value={motivo}>{motivo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Referencia</label>
                <input
                  type="text"
                  value={formData.referencia}
                  onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: F001-245, OC-123, etc."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Lote</label>
                  <input
                    type="text"
                    value={formData.lote}
                    onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: L-2025-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Serie</label>
                  <input
                    type="text"
                    value={formData.serie}
                    onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Ej: SN-HP-889522"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Vencimiento</label>
                  <input
                    type="date"
                    value={formData.vencimiento}
                    onChange={(e) => setFormData({ ...formData, vencimiento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
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
                onClick={handleGuardarMovimiento}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  formData.tipo === 'Entrada' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : formData.tipo === 'Salida'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Guardar {formData.tipo}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlStock

