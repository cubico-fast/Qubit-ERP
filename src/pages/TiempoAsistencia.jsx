import { useState, useEffect } from 'react'
import { Clock, Plus, Search, Edit, X, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getAsistencias, saveAsistencia, updateAsistencia, getPersonal } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const TiempoAsistencia = () => {
  const { companyId } = useAuth()
  const [asistencias, setAsistencias] = useState([])
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [asistenciaSeleccionada, setAsistenciaSeleccionada] = useState(null)

  const [formData, setFormData] = useState({
    empleadoId: '',
    fecha: new Date().toISOString().split('T')[0],
    horaEntrada: '08:00',
    horaSalida: '17:00',
    tardanza: '0',
    horasExtras: '0',
    tipo: 'Normal',
    motivo: '',
    observaciones: ''
  })

  const tiposAsistencia = ['Normal', 'Falta', 'Permiso', 'Vacaciones', 'Licencia']

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [asistenciasData, personalData] = await Promise.all([
        getAsistencias(companyId),
        getPersonal(companyId)
      ])
      
      setAsistencias(asistenciasData || [])
      setPersonal(personalData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setAsistencias([])
      setPersonal([])
    } finally {
      setLoading(false)
    }
  }

  const calcularHorasTrabajadas = (entrada, salida) => {
    if (!entrada || !salida) return 0
    const [hE, mE] = entrada.split(':').map(Number)
    const [hS, mS] = salida.split(':').map(Number)
    const horas = hS - hE
    const minutos = mS - mE
    return horas + minutos / 60
  }

  const calcularTardanza = (entrada, tipo, horaEsperada = '08:00') => {
    if (!entrada || tipo !== 'Normal') return 0
    const [hE, mE] = entrada.split(':').map(Number)
    const [hEs, mEs] = horaEsperada.split(':').map(Number)
    const minutosEntrada = hE * 60 + mE
    const minutosEsperada = hEs * 60 + mEs
    return Math.max(0, minutosEntrada - minutosEsperada)
  }

  const handleNuevaAsistencia = () => {
    setAsistenciaSeleccionada(null)
    setFormData({
      empleadoId: '',
      fecha: new Date().toISOString().split('T')[0],
      horaEntrada: '08:00',
      horaSalida: '17:00',
      tardanza: '0',
      horasExtras: '0',
      tipo: 'Normal',
      motivo: '',
      observaciones: ''
    })
    setShowModal(true)
  }

  const handleGuardarAsistencia = async () => {
    try {
      if (!formData.empleadoId || !formData.fecha) {
        alert('Empleado y fecha son obligatorios')
        return
      }

      const horasTrabajadas = calcularHorasTrabajadas(formData.horaEntrada, formData.horaSalida)
      const tardanzaMinutos = calcularTardanza(formData.horaEntrada, formData.tipo)
      const horasExtras = parseFloat(formData.horasExtras) || 0

      const asistenciaData = {
        ...formData,
        horasTrabajadas: horasTrabajadas.toFixed(2),
        tardanza: tardanzaMinutos.toString(),
        horasExtras: horasExtras.toString(),
        motivo: formData.tipo !== 'Normal' ? formData.motivo : ''
      }

      if (asistenciaSeleccionada) {
        await updateAsistencia(asistenciaSeleccionada.id, asistenciaData, companyId)
        alert('✅ Asistencia actualizada exitosamente')
      } else {
        await saveAsistencia(asistenciaData, companyId)
        alert('✅ Asistencia registrada exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar asistencia:', error)
      alert('Error al guardar asistencia: ' + error.message)
    }
  }

  const getNombreEmpleado = (empleadoId) => {
    const empleado = personal.find(p => p.id === empleadoId)
    return empleado ? (empleado.nombreCompleto || `${empleado.nombre || ''} ${empleado.apellido || ''}`) : empleadoId
  }

  const filteredAsistencias = asistencias.filter(asist =>
    getNombreEmpleado(asist.empleadoId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asist.fecha?.includes(fechaFiltro)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando asistencias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Tiempo y Asistencia
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Control de ingreso/salida, tardanzas, faltas, permisos y vacaciones. Calcula horas trabajadas e identifica horas extras.
        </p>
      </div>

      {/* Acciones y Filtros */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por empleado..."
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
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          />
        </div>
        <button 
          onClick={handleNuevaAsistencia}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Asistencia
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Empleado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tipo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Entrada</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Salida</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Horas</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tardanza</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Extras</th>
            </tr>
          </thead>
          <tbody>
            {filteredAsistencias.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Clock size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay asistencias registradas</p>
                  <p className="text-sm">Comienza registrando asistencias</p>
                </td>
              </tr>
            ) : (
              filteredAsistencias.map((asist) => (
                <tr key={asist.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {asist.fecha ? formatDate(asist.fecha) : '-'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {getNombreEmpleado(asist.empleadoId)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      asist.tipo === 'Normal' 
                        ? 'bg-green-100 text-green-800'
                        : asist.tipo === 'Falta'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {asist.tipo || 'Normal'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{asist.horaEntrada || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{asist.horaSalida || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                    {asist.horasTrabajadas || '0'}h
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>
                    {parseInt(asist.tardanza || 0) > 0 ? (
                      <span className="text-red-600 font-semibold">{asist.tardanza} min</span>
                    ) : (
                      <span className="text-green-600">0 min</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                    {parseFloat(asist.horasExtras || 0) > 0 ? `${asist.horasExtras}h` : '-'}
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
                {asistenciaSeleccionada ? 'Editar Asistencia' : 'Nueva Asistencia'}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Empleado *</label>
                  <select
                    value={formData.empleadoId}
                    onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Seleccionar empleado...</option>
                    {personal.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombreCompleto || `${emp.nombre || ''} ${emp.apellido || ''}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Fecha *</label>
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  {tiposAsistencia.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              {formData.tipo === 'Normal' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Hora de Entrada</label>
                      <input
                        type="time"
                        value={formData.horaEntrada}
                        onChange={(e) => {
                          const nuevaTardanza = calcularTardanza(e.target.value, formData.tipo)
                          setFormData({ 
                            ...formData, 
                            horaEntrada: e.target.value,
                            tardanza: nuevaTardanza.toString()
                          })
                        }}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Hora de Salida</label>
                      <input
                        type="time"
                        value={formData.horaSalida}
                        onChange={(e) => setFormData({ ...formData, horaSalida: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Horas Extras</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.horasExtras}
                      onChange={(e) => setFormData({ ...formData, horasExtras: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {formData.tipo !== 'Normal' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Motivo</label>
                  <input
                    type="text"
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="Motivo de la falta/permiso/vacaciones"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Observaciones adicionales..."
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
                onClick={handleGuardarAsistencia}
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

export default TiempoAsistencia

