import { useState, useEffect } from 'react'
import { CheckSquare, Plus, Search, Edit, Trash, X, ArrowRight, User, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getFlujosAprobacion, saveFlujoAprobacion, updateFlujoAprobacion, deleteFlujoAprobacion, getDocumentos } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const FlujosAprobacion = () => {
  const { companyId } = useAuth()
  const [flujos, setFlujos] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [flujoSeleccionado, setFlujoSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipoDocumento: '',
    pasos: [
      { orden: 1, area: '', usuario: '', obligatorio: true }
    ]
  })

  const areas = ['Legal', 'Gerencia', 'Finanzas', 'Comercial', 'RRHH', 'Producción', 'Administración']

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [flujosData, documentosData] = await Promise.all([
        getFlujosAprobacion(companyId),
        getDocumentos(companyId)
      ])
      
      setFlujos(flujosData || [])
      setDocumentos(documentosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setFlujos([])
      setDocumentos([])
    } finally {
      setLoading(false)
    }
  }

  const handleCrearFlujo = () => {
    setModoModal('crear')
    setFlujoSeleccionado(null)
    setFormData({
      nombre: '',
      descripcion: '',
      tipoDocumento: '',
      pasos: [
        { orden: 1, area: '', usuario: '', obligatorio: true }
      ]
    })
    setShowModal(true)
  }

  const handleEditarFlujo = (flujo) => {
    setModoModal('editar')
    setFlujoSeleccionado(flujo)
    setFormData({
      nombre: flujo.nombre || '',
      descripcion: flujo.descripcion || '',
      tipoDocumento: flujo.tipoDocumento || '',
      pasos: flujo.pasos && flujo.pasos.length > 0 
        ? flujo.pasos 
        : [{ orden: 1, area: '', usuario: '', obligatorio: true }]
    })
    setShowModal(true)
  }

  const handleGuardarFlujo = async () => {
    try {
      if (!formData.nombre || formData.pasos.length === 0) {
        alert('Nombre y al menos un paso son obligatorios')
        return
      }

      const flujoData = {
        ...formData,
        pasos: formData.pasos.map((paso, index) => ({
          ...paso,
          orden: index + 1
        }))
      }

      if (modoModal === 'crear') {
        await saveFlujoAprobacion(flujoData, companyId)
        alert('✅ Flujo de aprobación creado exitosamente')
      } else {
        await updateFlujoAprobacion(flujoSeleccionado.id, flujoData, companyId)
        alert('✅ Flujo de aprobación actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar flujo:', error)
      alert('Error al guardar flujo: ' + error.message)
    }
  }

  const handleEliminarFlujo = async (flujo) => {
    if (!window.confirm(`¿Está seguro de eliminar el flujo "${flujo.nombre}"?`)) {
      return
    }

    try {
      await deleteFlujoAprobacion(flujo.id)
      await loadData()
      alert('✅ Flujo eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar flujo:', error)
      alert('Error al eliminar flujo: ' + error.message)
    }
  }

  const handleAgregarPaso = () => {
    const nuevoPaso = {
      orden: formData.pasos.length + 1,
      area: '',
      usuario: '',
      obligatorio: true
    }
    setFormData({
      ...formData,
      pasos: [...formData.pasos, nuevoPaso]
    })
  }

  const handleEliminarPaso = (index) => {
    if (formData.pasos.length <= 1) {
      alert('Debe haber al menos un paso en el flujo')
      return
    }
    const nuevosPasos = formData.pasos.filter((_, i) => i !== index)
      .map((paso, i) => ({ ...paso, orden: i + 1 }))
    setFormData({
      ...formData,
      pasos: nuevosPasos
    })
  }

  const handleCambiarPaso = (index, campo, valor) => {
    const nuevosPasos = [...formData.pasos]
    nuevosPasos[index] = {
      ...nuevosPasos[index],
      [campo]: valor
    }
    setFormData({
      ...formData,
      pasos: nuevosPasos
    })
  }

  const getDocumentosPorFlujo = (tipoDocumento) => {
    if (!tipoDocumento) return documentos
    return documentos.filter(d => d.tipo === tipoDocumento)
  }

  const filteredFlujos = flujos.filter(flujo =>
    flujo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flujo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando flujos de aprobación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Flujos de Aprobación
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Define reglas para aprobar documentos antes de usarlos. Nadie puede saltarse pasos.
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <strong>Ejemplo:</strong> Un contrato debe pasar por: 1) Área Legal → 2) Gerencia → 3) Firma.
          Estados: Borrador → En revisión → Aprobado → Vigente
        </p>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar flujos..."
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
          onClick={handleCrearFlujo}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Flujo
        </button>
      </div>

      {/* Lista de Flujos */}
      <div className="space-y-4">
        {filteredFlujos.length === 0 ? (
          <div className="p-12 text-center border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>No hay flujos de aprobación</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Comienza creando un flujo de aprobación</p>
          </div>
        ) : (
          filteredFlujos.map((flujo) => {
            const documentosFlujo = getDocumentosPorFlujo(flujo.tipoDocumento)
            return (
              <div 
                key={flujo.id} 
                className="p-4 border rounded-lg hover:shadow-md transition-all"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>{flujo.nombre}</h3>
                    <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {flujo.descripcion || '-'}
                    </p>
                    {flujo.tipoDocumento && (
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Tipo de documento: <strong>{flujo.tipoDocumento}</strong> ({documentosFlujo.length} documento(s))
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditarFlujo(flujo)} 
                      className="p-1 hover:bg-gray-100 rounded" 
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleEliminarFlujo(flujo)} 
                      className="p-1 hover:bg-gray-100 rounded text-red-600" 
                      title="Eliminar"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>

                {/* Pasos del Flujo */}
                <div className="flex items-center gap-2 flex-wrap">
                  {flujo.pasos && flujo.pasos.length > 0 ? (
                    flujo.pasos
                      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                      .map((paso, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-blue-800">{paso.orden || index + 1}</span>
                              <span className="text-sm font-semibold text-blue-900">
                                {paso.area || 'Sin área'}
                              </span>
                              {paso.obligatorio && (
                                <span className="text-xs bg-red-500 text-white px-1 rounded">*</span>
                              )}
                            </div>
                          </div>
                          {index < flujo.pasos.length - 1 && (
                            <ArrowRight className="text-gray-400" size={16} />
                          )}
                        </div>
                      ))
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Sin pasos definidos</p>
                  )}
                </div>
              </div>
            )
          })
        )}
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
                {modoModal === 'crear' ? 'Nuevo Flujo de Aprobación' : 'Editar Flujo de Aprobación'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre del Flujo *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: Aprobación de Contratos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="2"
                  placeholder="Descripción del flujo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tipo de Documento (Opcional)</label>
                <select
                  value={formData.tipoDocumento}
                  onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Todos los tipos</option>
                  <option value="Contrato">Contrato</option>
                  <option value="Factura">Factura</option>
                  <option value="Cotización">Cotización</option>
                  <option value="Orden de Compra">Orden de Compra</option>
                  <option value="Guía de Remisión">Guía de Remisión</option>
                  <option value="CV">CV</option>
                  <option value="Evaluación">Evaluación</option>
                </select>
              </div>

              {/* Pasos del Flujo */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Pasos del Flujo *</label>
                  <button
                    onClick={handleAgregarPaso}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Agregar Paso
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.pasos.map((paso, index) => (
                    <div 
                      key={index} 
                      className="p-3 border rounded-lg flex gap-3 items-center"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                        {paso.orden || index + 1}
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <select
                          value={paso.area}
                          onChange={(e) => handleCambiarPaso(index, 'area', e.target.value)}
                          className="px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                        >
                          <option value="">Seleccionar área...</option>
                          {areas.map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={paso.usuario}
                          onChange={(e) => handleCambiarPaso(index, 'usuario', e.target.value)}
                          className="px-3 py-2 border rounded-lg text-sm"
                          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                          placeholder="Usuario específico (opcional)"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text)' }}>
                          <input
                            type="checkbox"
                            checked={paso.obligatorio}
                            onChange={(e) => handleCambiarPaso(index, 'obligatorio', e.target.checked)}
                            className="rounded"
                          />
                          Obligatorio
                        </label>
                        {formData.pasos.length > 1 && (
                          <button
                            onClick={() => handleEliminarPaso(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar paso"
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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
                onClick={handleGuardarFlujo}
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

export default FlujosAprobacion

