import { useState, useEffect } from 'react'
import { TrendingUp, Search, DollarSign, Calendar, Plus, Edit, Trash, Eye, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getOportunidades, saveOportunidad, updateOportunidad, deleteOportunidad } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const Oportunidades = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [oportunidades, setOportunidades] = useState([])
  const [buscar, setBuscar] = useState('')
  const [filtroEtapa, setFiltroEtapa] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [oportunidadSeleccionada, setOportunidadSeleccionada] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    cliente: '',
    monto: '',
    montoEstimado: '',
    probabilidad: 50,
    etapa: 'Lead Nuevo',
    estado: 'Lead Nuevo',
    fechaCierre: '',
    responsable: '',
    descripcion: ''
  })

  useEffect(() => {
    loadOportunidades()
  }, [companyId])

  const loadOportunidades = async () => {
    try {
      setLoading(true)
      const oportunidadesData = await getOportunidades(companyId)
      setOportunidades(oportunidadesData || [])
    } catch (error) {
      console.error('Error al cargar oportunidades:', error)
      setOportunidades([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearOportunidad = () => {
    setModoModal('crear')
    setOportunidadSeleccionada(null)
    setFormData({
      nombre: '',
      cliente: '',
      monto: '',
      montoEstimado: '',
      probabilidad: 50,
      etapa: 'Lead Nuevo',
      estado: 'Lead Nuevo',
      fechaCierre: '',
      responsable: '',
      descripcion: ''
    })
    setShowModal(true)
  }

  const handleEditarOportunidad = (oportunidad) => {
    setModoModal('editar')
    setOportunidadSeleccionada(oportunidad)
    setFormData({
      nombre: oportunidad.nombre || '',
      cliente: oportunidad.cliente || '',
      monto: oportunidad.monto || oportunidad.montoEstimado || '',
      montoEstimado: oportunidad.montoEstimado || oportunidad.monto || '',
      probabilidad: oportunidad.probabilidad || 50,
      etapa: oportunidad.etapa || oportunidad.estado || 'Lead Nuevo',
      estado: oportunidad.estado || oportunidad.etapa || 'Lead Nuevo',
      fechaCierre: oportunidad.fechaCierre || '',
      responsable: oportunidad.responsable || '',
      descripcion: oportunidad.descripcion || ''
    })
    setShowModal(true)
  }

  const handleGuardarOportunidad = async () => {
    try {
      if (!formData.nombre || !formData.cliente) {
        alert('El nombre y el cliente son obligatorios')
        return
      }

      const montoNumero = parseFloat(formData.monto || formData.montoEstimado || 0)

      const oportunidadData = {
        ...formData,
        monto: montoNumero,
        montoEstimado: montoNumero,
        estado: formData.etapa || formData.estado,
        etapa: formData.etapa || formData.estado
      }

      if (modoModal === 'crear') {
        await saveOportunidad(oportunidadData, companyId)
        alert('✅ Oportunidad creada exitosamente')
      } else {
        await updateOportunidad(oportunidadSeleccionada.id, oportunidadData, companyId)
        alert('✅ Oportunidad actualizada exitosamente')
      }

      await loadOportunidades()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar oportunidad:', error)
      alert('Error al guardar la oportunidad: ' + error.message)
    }
  }

  const handleEliminarOportunidad = async (oportunidad) => {
    if (!window.confirm(`¿Está seguro de eliminar la oportunidad ${oportunidad.nombre}?`)) {
      return
    }

    try {
      await deleteOportunidad(oportunidad.id)
      await loadOportunidades()
      alert('✅ Oportunidad eliminada exitosamente')
    } catch (error) {
      console.error('Error al eliminar oportunidad:', error)
      alert('Error al eliminar la oportunidad: ' + error.message)
    }
  }

  const filteredOportunidades = oportunidades.filter(oportunidad => {
    const matchSearch = 
      oportunidad.nombre?.toLowerCase().includes(buscar.toLowerCase()) ||
      oportunidad.cliente?.toLowerCase().includes(buscar.toLowerCase()) ||
      (oportunidad.monto || oportunidad.montoEstimado)?.toString().includes(buscar)

    const etapa = oportunidad.etapa || oportunidad.estado || ''
    const matchEtapa = filtroEtapa === 'Todas' || etapa === filtroEtapa

    return matchSearch && matchEtapa
  })

  const estadisticas = {
    total: oportunidades.length,
    valorEstimado: oportunidades.reduce((sum, o) => sum + (parseFloat(o.monto || o.montoEstimado || 0)), 0),
    ganadas: oportunidades.filter(o => {
      const etapa = o.etapa || o.estado || ''
      return etapa === 'Ganada' || etapa === 'Ganado' || etapa === 'Cerrada Ganada'
    }).length,
    tasaConversion: oportunidades.length > 0 
      ? ((oportunidades.filter(o => {
          const etapa = o.etapa || o.estado || ''
          return etapa === 'Ganada' || etapa === 'Ganado' || etapa === 'Cerrada Ganada'
        }).length / oportunidades.length) * 100).toFixed(1)
      : 0
  }

  const getEtapaColor = (etapa) => {
    const etapaLower = (etapa || '').toLowerCase()
    if (etapaLower.includes('cotización') || etapaLower.includes('cotizacion')) return 'bg-yellow-100 text-yellow-800'
    if (etapaLower.includes('negociación') || etapaLower.includes('negociacion')) return 'bg-blue-100 text-blue-800'
    if (etapaLower.includes('propuesta')) return 'bg-purple-100 text-purple-800'
    if (etapaLower.includes('ganada') || etapaLower.includes('ganado')) return 'bg-green-100 text-green-800'
    if (etapaLower.includes('perdida') || etapaLower.includes('perdido')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Oportunidades de Venta
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Gestiona leads con posibilidad real de convertirse en ventas
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Oportunidades</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {loading ? '...' : estadisticas.total}
              </p>
            </div>
            <TrendingUp className="text-blue-500" size={32} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Valor Estimado</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : formatCurrency(estadisticas.valorEstimado)}
              </p>
            </div>
            <DollarSign className="text-green-600" size={32} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ganadas (mes)</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : estadisticas.ganadas}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-xl">✓</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tasa de Conversión</p>
              <p className="text-2xl font-bold text-blue-600">
                {loading ? '...' : `${estadisticas.tasaConversion}%`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones y Búsqueda */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar oportunidades por cliente, monto, etapa..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ 
              borderColor: 'var(--color-border)', 
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          />
        </div>
        <button 
          onClick={handleCrearOportunidad}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Oportunidad
        </button>
      </div>

      {/* Información sobre Oportunidades */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-900 mb-2">¿Cuándo un Lead se convierte en Oportunidad?</h3>
        <p className="text-sm text-green-800 mb-2">
          Cuando hay posibilidad real de venta:
        </p>
        <ul className="text-sm text-green-700 space-y-1 ml-4">
          <li>• Ya pidió precio o cotización</li>
          <li>• Solicitó una demostración</li>
          <li>• Confirmó interés en comprar</li>
          <li>• Está evaluando la propuesta</li>
        </ul>
      </div>

      {/* Filtros por etapa */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button 
          onClick={() => setFiltroEtapa('Todas')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors ${filtroEtapa === 'Todas' ? 'bg-blue-100' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Todas
        </button>
        <button 
          onClick={() => setFiltroEtapa('Cotización Enviada')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors ${filtroEtapa === 'Cotización Enviada' ? 'bg-yellow-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Cotización
        </button>
        <button 
          onClick={() => setFiltroEtapa('Negociación')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors ${filtroEtapa === 'Negociación' ? 'bg-blue-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Negociación
        </button>
        <button 
          onClick={() => setFiltroEtapa('Propuesta Final')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors ${filtroEtapa === 'Propuesta Final' ? 'bg-purple-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Propuesta Enviada
        </button>
        <button 
          onClick={() => setFiltroEtapa('Ganada')}
          className={`px-3 py-1 text-sm border rounded-full transition-colors ${filtroEtapa === 'Ganada' ? 'bg-green-50' : ''}`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          Ganadas
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Oportunidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente Potencial</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Monto Estimado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Probabilidad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Etapa</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha Cierre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Responsable</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Cargando...
                </td>
              </tr>
            ) : filteredOportunidades.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay oportunidades registradas</p>
                  <p className="text-sm">Comienza convirtiendo leads calificados en oportunidades de venta</p>
                </td>
              </tr>
            ) : (
              filteredOportunidades.map((oportunidad) => {
                const etapa = oportunidad.etapa || oportunidad.estado || 'Lead Nuevo'
                const monto = parseFloat(oportunidad.monto || oportunidad.montoEstimado || 0)
                const probabilidad = oportunidad.probabilidad || 50
                
                return (
                  <tr key={oportunidad.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{oportunidad.nombre}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{oportunidad.cliente}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(monto)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${probabilidad}%` }}
                          ></div>
                        </div>
                        <span className="text-sm" style={{ color: 'var(--color-text)' }}>{probabilidad}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getEtapaColor(etapa)}`}>
                        {etapa}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {oportunidad.fechaCierre ? formatDate(oportunidad.fechaCierre) : '-'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{oportunidad.responsable || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditarOportunidad(oportunidad)}
                          className="p-1 hover:bg-gray-100 rounded" 
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleEliminarOportunidad(oportunidad)}
                          className="p-1 hover:bg-gray-100 rounded" 
                          title="Eliminar"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar Oportunidad */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nueva Oportunidad' : 'Editar Oportunidad'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre Oportunidad *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Cliente *</label>
                  <input
                    type="text"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Monto Estimado (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value, montoEstimado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Probabilidad (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probabilidad}
                    onChange={(e) => setFormData({ ...formData, probabilidad: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Etapa</label>
                  <select
                    value={formData.etapa}
                    onChange={(e) => setFormData({ ...formData, etapa: e.target.value, estado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <option value="Lead Nuevo">Lead Nuevo</option>
                    <option value="Contactado">Contactado</option>
                    <option value="Cotización Enviada">Cotización Enviada</option>
                    <option value="Negociación">Negociación</option>
                    <option value="Propuesta Final">Propuesta Final</option>
                    <option value="Ganada">Ganada</option>
                    <option value="Perdida">Perdida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha de Cierre Esperada</label>
                  <input
                    type="date"
                    value={formData.fechaCierre}
                    onChange={(e) => setFormData({ ...formData, fechaCierre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Responsable</label>
                  <input
                    type="text"
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ 
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)'
                  }}
                  placeholder="Detalles adicionales sobre la oportunidad..."
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-4" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarOportunidad}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Crear Oportunidad' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Oportunidades
