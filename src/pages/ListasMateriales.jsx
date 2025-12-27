import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Edit, Trash, X, Package, PlusCircle, MinusCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getBOMs, saveBOM, updateBOM, deleteBOM, getProductos } from '../utils/firebaseUtils'

const ListasMateriales = () => {
  const { companyId } = useAuth()
  const [boms, setBoms] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [bomSeleccionado, setBomSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    productoId: '',
    producto: '',
    descripcion: '',
    materiales: []
  })

  const [nuevoMaterial, setNuevoMaterial] = useState({
    productoId: '',
    cantidad: '',
    unidad: 'Unidad'
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [bomsData, productosData] = await Promise.all([
        getBOMs(companyId),
        getProductos(companyId)
      ])
      
      setBoms(bomsData || [])
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setBoms([])
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearBOM = () => {
    setModoModal('crear')
    setBomSeleccionado(null)
    setFormData({
      nombre: '',
      productoId: '',
      producto: '',
      descripcion: '',
      materiales: []
    })
    setNuevoMaterial({
      productoId: '',
      cantidad: '',
      unidad: 'Unidad'
    })
    setShowModal(true)
  }

  const handleEditarBOM = (bom) => {
    setModoModal('editar')
    setBomSeleccionado(bom)
    setFormData({
      nombre: bom.nombre || '',
      productoId: bom.productoId || '',
      producto: bom.producto || '',
      descripcion: bom.descripcion || '',
      materiales: bom.materiales || []
    })
    setNuevoMaterial({
      productoId: '',
      cantidad: '',
      unidad: 'Unidad'
    })
    setShowModal(true)
  }

  const handleAgregarMaterial = () => {
    if (!nuevoMaterial.productoId || !nuevoMaterial.cantidad) {
      alert('Seleccione un producto y cantidad')
      return
    }

    const producto = productos.find(p => p.id === nuevoMaterial.productoId)
    const material = {
      productoId: nuevoMaterial.productoId,
      producto: producto?.nombre || '',
      cantidad: parseFloat(nuevoMaterial.cantidad),
      unidad: nuevoMaterial.unidad
    }

    setFormData({
      ...formData,
      materiales: [...formData.materiales, material]
    })

    setNuevoMaterial({
      productoId: '',
      cantidad: '',
      unidad: 'Unidad'
    })
  }

  const handleEliminarMaterial = (index) => {
    const nuevosMateriales = formData.materiales.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      materiales: nuevosMateriales
    })
  }

  const handleGuardarBOM = async () => {
    try {
      if (!formData.nombre || !formData.productoId || formData.materiales.length === 0) {
        alert('Nombre, producto y al menos un material son obligatorios')
        return
      }

      const producto = productos.find(p => p.id === formData.productoId)
      const bomData = {
        ...formData,
        producto: producto?.nombre || formData.producto
      }

      if (modoModal === 'crear') {
        await saveBOM(bomData, companyId)
        alert('✅ BOM creado exitosamente')
      } else {
        await updateBOM(bomSeleccionado.id, bomData, companyId)
        alert('✅ BOM actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar BOM:', error)
      alert('Error al guardar BOM: ' + error.message)
    }
  }

  const handleEliminarBOM = async (bom) => {
    if (!window.confirm(`¿Está seguro de eliminar el BOM ${bom.nombre}?`)) {
      return
    }

    try {
      await deleteBOM(bom.id)
      await loadData()
      alert('✅ BOM eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar BOM:', error)
      alert('Error al eliminar BOM: ' + error.message)
    }
  }

  const getNombreProducto = (productoId) => {
    const producto = productos.find(p => p.id === productoId)
    return producto ? producto.nombre : productoId
  }

  const filteredBOMs = boms.filter(bom =>
    bom.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getNombreProducto(bom.productoId)?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando BOMs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Listas de Materiales (BOM)
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Define qué insumos se necesitan para producir algo. Si no hay stock → alerta o compra.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total BOMs</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{boms.length}</p>
            </div>
            <FileText className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar BOMs..."
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
          onClick={handleCrearBOM}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo BOM
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>BOM</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto Final</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Materiales</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredBOMs.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <FileText size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay BOMs registrados</p>
                  <p className="text-sm">Comienza creando una lista de materiales</p>
                </td>
              </tr>
            ) : (
              filteredBOMs.map((bom) => (
                <tr key={bom.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{bom.nombre || `BOM-${bom.id.substring(0, 8)}`}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {getNombreProducto(bom.productoId) || bom.producto}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {bom.materiales?.length || 0} material(es)
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditarBOM(bom)} 
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarBOM(bom)} 
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
                {modoModal === 'crear' ? 'Nuevo BOM' : 'Editar BOM'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre del BOM *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: BOM Kit Oficina"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Producto Final *</label>
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
                  placeholder="Descripción del BOM..."
                />
              </div>

              {/* Agregar Material */}
              <div className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Agregar Material</h3>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="col-span-2">
                    <select
                      value={nuevoMaterial.productoId}
                      onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, productoId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    >
                      <option value="">Seleccionar material...</option>
                      {productos.map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoMaterial.cantidad}
                      onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, cantidad: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                      placeholder="Cantidad"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAgregarMaterial}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <PlusCircle size={16} />
                  Agregar Material
                </button>
              </div>

              {/* Lista de Materiales */}
              <div>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Materiales ({formData.materiales.length})</h3>
                {formData.materiales.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No hay materiales agregados</p>
                ) : (
                  <div className="space-y-2">
                    {formData.materiales.map((material, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: 'var(--color-text)' }}>{material.producto}</p>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {material.cantidad} {material.unidad}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEliminarMaterial(index)}
                          className="p-1 hover:bg-gray-100 rounded text-red-600"
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
                onClick={handleGuardarBOM}
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

export default ListasMateriales

