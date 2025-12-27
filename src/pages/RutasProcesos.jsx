import { useState, useEffect } from 'react'
import { Settings, Plus, Search, Edit, Trash, X, Clock, PlusCircle, MinusCircle, GripVertical } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getRutasProduccion, saveRutaProduccion, updateRutaProduccion, deleteRutaProduccion, getProductos } from '../utils/firebaseUtils'

const RutasProcesos = () => {
  const { companyId } = useAuth()
  const [rutas, setRutas] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    productoId: '',
    producto: '',
    descripcion: '',
    pasos: []
  })

  const [nuevoPaso, setNuevoPaso] = useState({
    nombre: '',
    tiempoMinutos: '',
    descripcion: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [rutasData, productosData] = await Promise.all([
        getRutasProduccion(companyId),
        getProductos(companyId)
      ])
      
      setRutas(rutasData || [])
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setRutas([])
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearRuta = () => {
    setModoModal('crear')
    setRutaSeleccionada(null)
    setFormData({
      nombre: '',
      productoId: '',
      producto: '',
      descripcion: '',
      pasos: []
    })
    setNuevoPaso({
      nombre: '',
      tiempoMinutos: '',
      descripcion: ''
    })
    setShowModal(true)
  }

  const handleEditarRuta = (ruta) => {
    setModoModal('editar')
    setRutaSeleccionada(ruta)
    setFormData({
      nombre: ruta.nombre || '',
      productoId: ruta.productoId || '',
      producto: ruta.producto || '',
      descripcion: ruta.descripcion || '',
      pasos: ruta.pasos || []
    })
    setNuevoPaso({
      nombre: '',
      tiempoMinutos: '',
      descripcion: ''
    })
    setShowModal(true)
  }

  const handleAgregarPaso = () => {
    if (!nuevoPaso.nombre || !nuevoPaso.tiempoMinutos) {
      alert('Nombre y tiempo son obligatorios')
      return
    }

    const paso = {
      ...nuevoPaso,
      tiempoMinutos: parseFloat(nuevoPaso.tiempoMinutos),
      orden: formData.pasos.length + 1
    }

    setFormData({
      ...formData,
      pasos: [...formData.pasos, paso]
    })

    setNuevoPaso({
      nombre: '',
      tiempoMinutos: '',
      descripcion: ''
    })
  }

  const handleEliminarPaso = (index) => {
    const nuevosPasos = formData.pasos.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      pasos: nuevosPasos
    })
  }

  const handleGuardarRuta = async () => {
    try {
      if (!formData.nombre || !formData.productoId || formData.pasos.length === 0) {
        alert('Nombre, producto y al menos un paso son obligatorios')
        return
      }

      const producto = productos.find(p => p.id === formData.productoId)
      const rutaData = {
        ...formData,
        producto: producto?.nombre || formData.producto
      }

      if (modoModal === 'crear') {
        await saveRutaProduccion(rutaData, companyId)
        alert('✅ Ruta creada exitosamente')
      } else {
        await updateRutaProduccion(rutaSeleccionada.id, rutaData, companyId)
        alert('✅ Ruta actualizada exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar ruta:', error)
      alert('Error al guardar ruta: ' + error.message)
    }
  }

  const handleEliminarRuta = async (ruta) => {
    if (!window.confirm(`¿Está seguro de eliminar la ruta ${ruta.nombre}?`)) {
      return
    }

    try {
      await deleteRutaProduccion(ruta.id)
      await loadData()
      alert('✅ Ruta eliminada exitosamente')
    } catch (error) {
      console.error('Error al eliminar ruta:', error)
      alert('Error al eliminar ruta: ' + error.message)
    }
  }

  const getNombreProducto = (productoId) => {
    const producto = productos.find(p => p.id === productoId)
    return producto ? producto.nombre : productoId
  }

  const getTiempoTotal = (pasos) => {
    return pasos.reduce((sum, paso) => sum + (parseFloat(paso.tiempoMinutos) || 0), 0)
  }

  const filteredRutas = rutas.filter(ruta =>
    ruta.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getNombreProducto(ruta.productoId)?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando rutas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Rutas y Procesos
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Define los pasos de producción. Sirve para planificar tiempos, medir eficiencia y costear mano de obra.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Rutas</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{rutas.length}</p>
            </div>
            <Settings className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar rutas..."
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
          onClick={handleCrearRuta}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Ruta
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Ruta</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Pasos</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tiempo Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRutas.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Settings size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay rutas registradas</p>
                  <p className="text-sm">Comienza creando una ruta de producción</p>
                </td>
              </tr>
            ) : (
              filteredRutas.map((ruta) => (
                <tr key={ruta.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{ruta.nombre}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {getNombreProducto(ruta.productoId) || ruta.producto}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {ruta.pasos?.length || 0} paso(s)
                  </td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                    {getTiempoTotal(ruta.pasos || [])} min
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditarRuta(ruta)} 
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarRuta(ruta)} 
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nueva Ruta' : 'Editar Ruta'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre de la Ruta *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: Ruta Ensamblaje Kit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Producto *</label>
                <select
                  value={formData.productoId}
                  onChange={(e) => {
                    const producto = productos.find(p => p.id === e.target.value)
                    setFormData({ 
                      ...formData, 
                      productoId: e.target.value,
                      producto: producto?.nombre || ''
                    })
                  }}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="2"
                  placeholder="Descripción de la ruta..."
                />
              </div>

              {/* Agregar Paso */}
              <div className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Agregar Paso</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={nuevoPaso.nombre}
                    onChange={(e) => setNuevoPaso({ ...nuevoPaso, nombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Nombre del paso (Ej: Preparación)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoPaso.tiempoMinutos}
                      onChange={(e) => setNuevoPaso({ ...nuevoPaso, tiempoMinutos: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                      placeholder="Tiempo (minutos)"
                    />
                    <button
                      onClick={handleAgregarPaso}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <PlusCircle size={16} />
                      Agregar
                    </button>
                  </div>
                  <input
                    type="text"
                    value={nuevoPaso.descripcion}
                    onChange={(e) => setNuevoPaso({ ...nuevoPaso, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Descripción del paso (opcional)"
                  />
                </div>
              </div>

              {/* Lista de Pasos */}
              <div>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                  Pasos ({formData.pasos.length}) - Tiempo Total: {getTiempoTotal(formData.pasos)} min
                </h3>
                {formData.pasos.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No hay pasos agregados</p>
                ) : (
                  <div className="space-y-2">
                    {formData.pasos.map((paso, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="text-gray-400" size={20} />
                          <div className="flex-1">
                            <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                              {index + 1}. {paso.nombre}
                            </p>
                            {paso.descripcion && (
                              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{paso.descripcion}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                              {paso.tiempoMinutos} min
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEliminarPaso(index)}
                          className="p-1 hover:bg-gray-100 rounded text-red-600 ml-2"
                        >
                          <MinusCircle size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                onClick={handleGuardarRuta}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Crear' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RutasProcesos

