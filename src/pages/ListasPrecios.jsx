import { useState, useEffect } from 'react'
import { DollarSign, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getListasPrecios, saveListaPrecios, getProductos } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const ListasPrecios = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [listas, setListas] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activa: true,
    productos: []
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [listasData, productosData] = await Promise.all([
        getListasPrecios(companyId),
        getProductos(companyId)
      ])
      
      setListas(listasData)
      setProductos(productosData)
      
      // Si no hay listas, crear una lista básica desde productos
      if (listasData.length === 0 && productosData.length > 0) {
        const listaBasica = {
          nombre: 'Lista General',
          descripcion: 'Lista de precios general basada en productos',
          activa: true,
          productos: productosData.map(p => ({
            productoId: p.id,
            nombre: p.nombre,
            precio: p.precio || p.precioVenta || 0
          }))
        }
        try {
          await saveListaPrecios(listaBasica, companyId)
          const nuevasListas = await getListasPrecios(companyId)
          setListas(nuevasListas)
        } catch (error) {
          console.error('Error al crear lista básica:', error)
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    try {
      if (!formData.nombre) {
        alert('El nombre de la lista es requerido')
        return
      }
      
      await saveListaPrecios(formData, companyId)
      await loadData()
      setShowModal(false)
      setFormData({
        nombre: '',
        descripcion: '',
        activa: true,
        productos: []
      })
    } catch (error) {
      console.error('Error al guardar lista:', error)
      alert('Error al guardar la lista de precios')
    }
  }

  const filteredListas = listas.filter(lista => {
    const searchLower = searchTerm.toLowerCase()
    return (
      lista.nombre?.toLowerCase().includes(searchLower) ||
      lista.descripcion?.toLowerCase().includes(searchLower)
    )
  })

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
            Listas de Precios
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de listas de precios para clientes y productos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Lista
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar listas de precios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        />
      </div>

      {/* Lista de precios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredListas.length === 0 ? (
          <div className="col-span-full text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
            No hay listas de precios registradas
          </div>
        ) : (
          filteredListas.map((lista) => (
            <div
              key={lista.id}
              className="border rounded-lg p-4"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                    {lista.nombre}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {lista.descripcion || 'Sin descripción'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  lista.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {lista.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Productos: {lista.productos?.length || 0}
                </p>
                {lista.createdAt && (
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Creada: {formatDate(lista.createdAt.toDate?.() || lista.createdAt)}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit size={18} />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold">Nueva Lista de Precios</h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.activa}
                  onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm" style={{ color: 'var(--color-text)' }}>Lista activa</label>
              </div>
              <p className="text-sm text-gray-600">Nota: La funcionalidad completa de agregar productos estará disponible próximamente.</p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={handleGuardar} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListasPrecios

