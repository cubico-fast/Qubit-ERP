import { useState, useEffect } from 'react'
import { Settings, Plus, Search, Edit, X, Power, PowerOff, ExternalLink } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getIntegraciones, saveIntegracion, updateIntegracionEstado } from '../utils/firebaseUtils'

const Integraciones = () => {
  const { companyId } = useAuth()
  const [integraciones, setIntegraciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [integracionEditando, setIntegracionEditando] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'API',
    descripcion: '',
    url: '',
    apiKey: '',
    apiSecret: '',
    configuracion: '',
    activa: false
  })

  const tiposIntegracion = ['API', 'Webhook', 'Email', 'SMS', 'WhatsApp', 'Facebook', 'Google', 'Otro']

  const integracionesPredefinidas = [
    {
      nombre: 'Sunat API',
      tipo: 'API',
      descripcion: 'Integración con SUNAT para facturación electrónica',
      url: 'https://api.sunat.gob.pe'
    },
    {
      nombre: 'WhatsApp Business',
      tipo: 'WhatsApp',
      descripcion: 'Integración con WhatsApp Business API para envío de mensajes'
    },
    {
      nombre: 'Email SMTP',
      tipo: 'Email',
      descripcion: 'Configuración de servidor SMTP para envío de correos'
    }
  ]

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const integracionesData = await getIntegraciones(companyId)
      setIntegraciones(integracionesData || [])
    } catch (error) {
      console.error('Error al cargar integraciones:', error)
      setIntegraciones([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearIntegracion = () => {
    setIntegracionEditando(null)
    setFormData({
      nombre: '',
      tipo: 'API',
      descripcion: '',
      url: '',
      apiKey: '',
      apiSecret: '',
      configuracion: '',
      activa: false
    })
    setShowModal(true)
  }

  const handleEditarIntegracion = (integracion) => {
    setIntegracionEditando(integracion)
    setFormData({
      nombre: integracion.nombre || '',
      tipo: integracion.tipo || 'API',
      descripcion: integracion.descripcion || '',
      url: integracion.url || '',
      apiKey: integracion.apiKey || '',
      apiSecret: integracion.apiSecret || '',
      configuracion: integracion.configuracion || '',
      activa: integracion.activa || false
    })
    setShowModal(true)
  }

  const handleGuardarIntegracion = async () => {
    try {
      if (!formData.nombre) {
        alert('El nombre es obligatorio')
        return
      }

      const integracionData = {
        ...formData
      }

      if (integracionEditando) {
        integracionData.id = integracionEditando.id
      }

      await saveIntegracion(integracionData, companyId)
      alert('✅ Integración guardada exitosamente')
      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar integración:', error)
      alert('Error al guardar integración: ' + error.message)
    }
  }

  const handleToggleEstado = async (integracion) => {
    try {
      await updateIntegracionEstado(integracion.id, !integracion.activa, companyId)
      await loadData()
      alert(`✅ Integración ${!integracion.activa ? 'activada' : 'desactivada'} exitosamente`)
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('Error al cambiar estado: ' + error.message)
    }
  }

  const handleAgregarPredefinida = (integracion) => {
    setIntegracionEditando(null)
    setFormData({
      nombre: integracion.nombre,
      tipo: integracion.tipo,
      descripcion: integracion.descripcion,
      url: integracion.url || '',
      apiKey: '',
      apiSecret: '',
      configuracion: '',
      activa: false
    })
    setShowModal(true)
  }

  const filteredIntegraciones = integraciones.filter(integ =>
    integ.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integ.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integ.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando integraciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Integraciones
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Configura integraciones con servicios externos como APIs, webhooks, email, SMS, etc.
        </p>
      </div>

      {/* Integraciones Predefinidas */}
      <div className="mb-6 p-4 border rounded-lg bg-blue-50" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Integraciones Predefinidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {integracionesPredefinidas.map((integ, index) => {
            const existe = integraciones.some(i => i.nombre === integ.nombre)
            return (
              <div 
                key={index} 
                className="p-3 border rounded-lg flex items-center justify-between"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{integ.nombre}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{integ.descripcion}</p>
                </div>
                {existe ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Configurada</span>
                ) : (
                  <button
                    onClick={() => handleAgregarPredefinida(integ)}
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
            placeholder="Buscar integraciones..."
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
          onClick={handleCrearIntegracion}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Integración
        </button>
      </div>

      {/* Lista de Integraciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegraciones.length === 0 ? (
          <div className="col-span-full p-12 text-center border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <Settings size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>No hay integraciones configuradas</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Comienza agregando una integración predefinida o crea una nueva</p>
          </div>
        ) : (
          filteredIntegraciones.map((integracion) => (
            <div 
              key={integracion.id} 
              className="p-4 border rounded-lg hover:shadow-md transition-all"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                      {integracion.nombre}
                    </h3>
                    {integracion.activa ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                        <Power size={12} />
                        Activa
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 flex items-center gap-1">
                        <PowerOff size={12} />
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-2 px-2 py-1 bg-blue-100 text-blue-800 rounded inline-block">
                    {integracion.tipo}
                  </p>
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {integracion.descripcion || 'Sin descripción'}
                  </p>
                  {integracion.url && (
                    <a 
                      href={integracion.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      <ExternalLink size={12} />
                      {integracion.url}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button 
                  onClick={() => handleToggleEstado(integracion)} 
                  className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  {integracion.activa ? 'Desactivar' : 'Activar'}
                </button>
                <button 
                  onClick={() => handleEditarIntegracion(integracion)} 
                  className="px-3 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
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
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {integracionEditando ? 'Editar Integración' : 'Nueva Integración'}
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
                  placeholder="Ej: Sunat API, WhatsApp Business..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  {tiposIntegracion.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
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
                  placeholder="Descripción de la integración..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>URL / Endpoint</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>API Key</label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="API Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>API Secret</label>
                  <input
                    type="password"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="API Secret"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Configuración Adicional (JSON)</label>
                <textarea
                  value={formData.configuracion}
                  onChange={(e) => setFormData({ ...formData, configuracion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="4"
                  placeholder='{"key": "value"}'
                />
              </div>

              <div>
                <label className="flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <input
                    type="checkbox"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    className="rounded"
                  />
                  <span>Integración Activa</span>
                </label>
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
                onClick={handleGuardarIntegracion}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Integraciones

