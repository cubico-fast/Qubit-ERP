import { useState, useEffect } from 'react'
import { Settings, Plus, Search, Edit, Trash, X, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getParametros, saveParametro } from '../utils/firebaseUtils'

const ParametrosGenerales = () => {
  const { companyId } = useAuth()
  const [parametros, setParametros] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [parametroEditando, setParametroEditando] = useState(null)

  const [formData, setFormData] = useState({
    clave: '',
    valor: '',
    descripcion: ''
  })

  const parametrosPredefinidos = [
    { clave: 'IGV', valor: '18', descripcion: 'Porcentaje de IGV en Perú' },
    { clave: 'Moneda', valor: 'PEN', descripcion: 'Moneda principal del sistema' },
    { clave: 'FormatoFecha', valor: 'DD/MM/YYYY', descripcion: 'Formato de fecha' },
    { clave: 'FormatoHora', valor: 'HH:mm', descripcion: 'Formato de hora' },
    { clave: 'Pais', valor: 'Perú', descripcion: 'País de la empresa' },
    { clave: 'Timezone', valor: 'America/Lima', descripcion: 'Zona horaria' }
  ]

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const parametrosData = await getParametros(companyId)
      setParametros(parametrosData || {})
    } catch (error) {
      console.error('Error al cargar parámetros:', error)
      setParametros({})
    } finally {
      setLoading(false)
    }
  }

  const handleCrearParametro = () => {
    setParametroEditando(null)
    setFormData({
      clave: '',
      valor: '',
      descripcion: ''
    })
    setShowModal(true)
  }

  const handleEditarParametro = (parametro) => {
    setParametroEditando(parametro)
    setFormData({
      clave: parametro.clave || '',
      valor: parametro.valor || '',
      descripcion: parametro.descripcion || ''
    })
    setShowModal(true)
  }

  const handleGuardarParametro = async () => {
    try {
      if (!formData.clave || formData.valor === undefined) {
        alert('Clave y valor son obligatorios')
        return
      }

      await saveParametro(formData, companyId)
      alert('✅ Parámetro guardado exitosamente')
      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar parámetro:', error)
      alert('Error al guardar parámetro: ' + error.message)
    }
  }

  const handleAgregarPredefinido = async (parametro) => {
    try {
      await saveParametro({
        clave: parametro.clave,
        valor: parametro.valor,
        descripcion: parametro.descripcion
      }, companyId)
      alert(`✅ Parámetro "${parametro.clave}" agregado exitosamente`)
      await loadData()
    } catch (error) {
      console.error('Error al agregar parámetro:', error)
      alert('Error al agregar parámetro: ' + error.message)
    }
  }

  const parametrosArray = Object.values(parametros)

  const filteredParametros = parametrosArray.filter(param =>
    param.clave?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    param.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando parámetros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Parámetros Generales
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Configura los parámetros generales del sistema como IGV, moneda, formato de fechas, etc.
        </p>
      </div>

      {/* Parámetros Predefinidos */}
      <div className="mb-6 p-4 border rounded-lg bg-blue-50" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Parámetros Predefinidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {parametrosPredefinidos.map((param) => {
            const existe = parametrosArray.some(p => p.clave === param.clave)
            return (
              <div 
                key={param.clave} 
                className="p-3 border rounded-lg flex items-center justify-between"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{param.clave}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{param.descripcion}</p>
                </div>
                {existe ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Configurado</span>
                ) : (
                  <button
                    onClick={() => handleAgregarPredefinido(param)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Agregar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar parámetros..."
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
          onClick={handleCrearParametro}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Parámetro
        </button>
      </div>

      {/* Lista de Parámetros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParametros.length === 0 ? (
          <div className="col-span-full p-12 text-center border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <Settings size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>No hay parámetros configurados</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Comienza agregando parámetros predefinidos o crea uno nuevo</p>
          </div>
        ) : (
          filteredParametros.map((parametro) => (
            <div 
              key={parametro.id} 
              className="p-4 border rounded-lg hover:shadow-md transition-all"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <Settings className="text-blue-600" size={20} />
                    {parametro.clave}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {parametro.descripcion || 'Sin descripción'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{parametro.valor}</p>
                </div>
                <button 
                  onClick={() => handleEditarParametro(parametro)} 
                  className="p-1 hover:bg-gray-100 rounded" 
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-2xl w-full" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {parametroEditando ? 'Editar Parámetro' : 'Nuevo Parámetro'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Clave *</label>
                <input
                  type="text"
                  value={formData.clave}
                  onChange={(e) => setFormData({ ...formData, clave: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: IGV, MONEDA, FORMATO_FECHA..."
                  disabled={!!parametroEditando}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Valor *</label>
                <input
                  type="text"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Valor del parámetro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Descripción del parámetro..."
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
                onClick={handleGuardarParametro}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParametrosGenerales

