import { useState, useEffect } from 'react'
import { DollarSign, Plus, Search, Eye, X, Calculator, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getCosteos, saveCosteo, getOrdenesProduccion, getProductos, updateProducto } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const Costeo = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [costeos, setCosteos] = useState([])
  const [ordenes, setOrdenes] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [costeoSeleccionado, setCosteoSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    ordenProduccionId: '',
    productoId: '',
    producto: '',
    cantidad: '',
    costoMateriales: '',
    costoManoObra: '',
    costosIndirectos: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [costeosData, ordenesData, productosData] = await Promise.all([
        getCosteos(companyId),
        getOrdenesProduccion(companyId),
        getProductos(companyId)
      ])
      
      setCosteos(costeosData || [])
      setOrdenes(ordenesData || [])
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setCosteos([])
      setOrdenes([])
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  const handleNuevoCosteo = () => {
    setCosteoSeleccionado(null)
    setFormData({
      ordenProduccionId: '',
      productoId: '',
      producto: '',
      cantidad: '',
      costoMateriales: '',
      costoManoObra: '',
      costosIndirectos: '',
      fecha: new Date().toISOString().split('T')[0]
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
        cantidad: orden.cantidad
      })
    }
  }

  const calcularCostos = () => {
    const materiales = parseFloat(formData.costoMateriales) || 0
    const manoObra = parseFloat(formData.costoManoObra) || 0
    const indirectos = parseFloat(formData.costosIndirectos) || 0
    const total = materiales + manoObra + indirectos
    const cantidad = parseFloat(formData.cantidad) || 1
    const unitario = cantidad > 0 ? total / cantidad : 0

    return { total, unitario, materiales, manoObra, indirectos }
  }

  const handleGuardarCosteo = async () => {
    try {
      if (!formData.ordenProduccionId || !formData.cantidad) {
        alert('Orden de producción y cantidad son obligatorios')
        return
      }

      const costos = calcularCostos()
      const costeoData = {
        ...formData,
        costoTotal: costos.total,
        costoUnitario: costos.unitario,
        cantidad: parseFloat(formData.cantidad)
      }

      await saveCosteo(costeoData, companyId)

      // Actualizar el producto con el costo
      if (formData.productoId) {
        const producto = productos.find(p => p.id === formData.productoId)
        if (producto) {
          await updateProducto(formData.productoId, {
            precioCompra: costos.unitario
          }, companyId)
        }
      }

      alert('✅ Costeo registrado exitosamente. El costo del producto ha sido actualizado.')
      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar costeo:', error)
      alert('Error al guardar costeo: ' + error.message)
    }
  }

  const getNombreProducto = (productoId) => {
    const producto = productos.find(p => p.id === productoId)
    return producto ? producto.nombre : productoId
  }

  const filteredCosteos = costeos.filter(costeo =>
    getNombreProducto(costeo.productoId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    costeo.ordenProduccionId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const costosTotales = costeos.reduce((acc, c) => {
    return {
      materiales: acc.materiales + (parseFloat(c.costoMateriales) || 0),
      manoObra: acc.manoObra + (parseFloat(c.costoManoObra) || 0),
      indirectos: acc.indirectos + (parseFloat(c.costosIndirectos) || 0),
      total: acc.total + (parseFloat(c.costoTotal) || 0)
    }
  }, { materiales: 0, manoObra: 0, indirectos: 0, total: 0 })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando costeos...</p>
        </div>
      </div>
    )
  }

  const costos = calcularCostos()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Costeo
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Calcula el costo real del producto terminado. Incluye materiales, mano de obra y gastos indirectos.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Costeos</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{costeos.length}</p>
            </div>
            <Calculator className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Costo Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(costosTotales.total)}
              </p>
            </div>
            <DollarSign className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar costeos..."
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
          onClick={handleNuevoCosteo}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Costeo
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cantidad</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Materiales</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Mano de Obra</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Indirectos</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Total</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Unitario</th>
            </tr>
          </thead>
          <tbody>
            {filteredCosteos.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Calculator size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay costeos registrados</p>
                  <p className="text-sm">Comienza registrando un costeo</p>
                </td>
              </tr>
            ) : (
              filteredCosteos.map((costeo) => {
                const costoUnitario = costeo.cantidad > 0 ? (costeo.costoTotal / costeo.cantidad) : 0
                return (
                  <tr key={costeo.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {costeo.fecha ? formatDate(costeo.fecha) : '-'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {getNombreProducto(costeo.productoId) || costeo.producto}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {costeo.cantidad || '-'}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(costeo.costoMateriales || 0)}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(costeo.costoManoObra || 0)}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(costeo.costosIndirectos || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {formatCurrency(costeo.costoTotal || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(costoUnitario)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Nuevo Costeo
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
                  {ordenes.filter(o => o.estado === 'Completada' || o.estado === 'En Proceso').map(orden => (
                    <option key={orden.id} value={orden.id}>
                      {orden.numero} - {orden.producto}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cantidad</label>
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
              </div>

              <div className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Costos</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Materiales</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.costoMateriales}
                      onChange={(e) => setFormData({ ...formData, costoMateriales: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Mano de Obra</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.costoManoObra}
                      onChange={(e) => setFormData({ ...formData, costoManoObra: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Costos Indirectos</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.costosIndirectos}
                      onChange={(e) => setFormData({ ...formData, costosIndirectos: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Resumen de Costos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Resumen</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Materiales:</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(costos.materiales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Mano de Obra:</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(costos.manoObra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Indirectos:</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(costos.indirectos)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Costo Total:</span>
                    <span className="font-bold text-green-600">{formatCurrency(costos.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Costo Unitario:</span>
                    <span className="font-bold" style={{ color: 'var(--color-text)' }}>{formatCurrency(costos.unitario)}</span>
                  </div>
                </div>
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

            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCosteo}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Guardar Costeo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Costeo

