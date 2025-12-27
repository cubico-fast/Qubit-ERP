import { useState, useEffect } from 'react'
import { DollarSign, Plus, Search, Eye, X, Calculator, FileText, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getNominas, saveNomina, updateNomina, getPersonal, getAsistencias } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const Nomina = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [nominas, setNominas] = useState([])
  const [personal, setPersonal] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [nominaSeleccionada, setNominaSeleccionada] = useState(null)
  const [detalleNomina, setDetalleNomina] = useState(null)

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [nominasData, personalData, asistenciasData] = await Promise.all([
        getNominas(companyId),
        getPersonal(companyId),
        getAsistencias(companyId)
      ])
      
      setNominas(nominasData || [])
      setPersonal(personalData || [])
      setAsistencias(asistenciasData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setNominas([])
      setPersonal([])
      setAsistencias([])
    } finally {
      setLoading(false)
    }
  }

  const generarPeriodo = () => {
    const ahora = new Date()
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    const año = ahora.getFullYear()
    return `${año}-${mes}`
  }

  const calcularNominaEmpleado = (empleado, periodo) => {
    // Obtener asistencias del período
    const asistenciasEmpleado = asistencias.filter(a => 
      a.empleadoId === empleado.id && 
      a.fecha?.startsWith(periodo)
    )

    // Calcular días trabajados
    const diasTrabajados = asistenciasEmpleado.filter(a => a.tipo === 'Normal').length
    const faltas = asistenciasEmpleado.filter(a => a.tipo === 'Falta').length

    // Sueldo base
    const sueldoBase = parseFloat(empleado.sueldoBase) || 0
    const sueldoProporcional = (sueldoBase / 30) * diasTrabajados

    // Horas extras
    const totalHorasExtras = asistenciasEmpleado.reduce((sum, a) => 
      sum + (parseFloat(a.horasExtras) || 0), 0
    )
    const valorHora = sueldoBase / (30 * 8)
    const pagoHorasExtras = totalHorasExtras * valorHora * 1.5 // 50% más

    // Asignación familiar (ejemplo)
    const asignacionFamiliar = 102.50

    // Ingresos totales
    const ingresosTotales = sueldoProporcional + pagoHorasExtras + asignacionFamiliar

    // Descuentos
    const afp = ingresosTotales * 0.13 // 13% AFP
    const adelantos = 0 // Se puede agregar después

    // Total descuentos
    const totalDescuentos = afp + adelantos

    // Neto a pagar
    const netoPagar = ingresosTotales - totalDescuentos

    return {
      empleadoId: empleado.id,
      empleado: empleado.nombreCompleto || `${empleado.nombre || ''} ${empleado.apellido || ''}`,
      sueldoBase: sueldoProporcional,
      horasExtras: pagoHorasExtras,
      asignacionFamiliar,
      ingresosTotales,
      afp,
      adelantos,
      totalDescuentos,
      netoPagar,
      diasTrabajados,
      faltas,
      horasExtrasCount: totalHorasExtras
    }
  }

  const handleGenerarNomina = () => {
    const periodoGenerado = periodo || generarPeriodo()
    const empleadosActivos = personal.filter(p => p.estado === 'Activo')
    
    const detalles = empleadosActivos.map(emp => calcularNominaEmpleado(emp, periodoGenerado))
    
    const nominaTotal = {
      periodo: periodoGenerado,
      empleados: detalles,
      totalIngresos: detalles.reduce((sum, d) => sum + d.ingresosTotales, 0),
      totalDescuentos: detalles.reduce((sum, d) => sum + d.totalDescuentos, 0),
      totalNeto: detalles.reduce((sum, d) => sum + d.netoPagar, 0),
      fechaGeneracion: new Date().toISOString().split('T')[0]
    }

    setDetalleNomina(nominaTotal)
    setShowModal(true)
  }

  const handleGuardarNomina = async () => {
    try {
      if (!detalleNomina) return

      await saveNomina(detalleNomina, companyId)
      alert('✅ Nómina generada y guardada exitosamente')
      await loadData()
      setShowModal(false)
      setDetalleNomina(null)
    } catch (error) {
      console.error('Error al guardar nómina:', error)
      alert('Error al guardar nómina: ' + error.message)
    }
  }

  const verDetalle = (nomina) => {
    setDetalleNomina(nomina)
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando nóminas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Nómina
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Calcula automáticamente todo lo que se paga. Incluye sueldo, horas extras, descuentos (AFP, ONP) y neto a pagar.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Nóminas</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{nominas.length}</p>
            </div>
            <FileText className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por período..."
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
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            placeholder="Período"
          />
        </div>
        <button 
          onClick={handleGenerarNomina}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Calculator size={20} />
          Generar Nómina
        </button>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Período</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Empleados</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Total Ingresos</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Total Descuentos</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Neto a Pagar</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {nominas.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <Calculator size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay nóminas generadas</p>
                  <p className="text-sm">Comienza generando una nómina</p>
                </td>
              </tr>
            ) : (
              nominas.map((nomina) => (
                <tr key={nomina.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>{nomina.periodo}</td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>
                    {nomina.empleados?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>
                    {formatCurrency(nomina.totalIngresos || 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {formatCurrency(nomina.totalDescuentos || 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">
                    {formatCurrency(nomina.totalNeto || 0)}
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => verDetalle(nomina)}
                      className="p-1 hover:bg-gray-100 rounded text-blue-600" 
                      title="Ver Detalle"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detalle */}
      {showModal && detalleNomina && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Detalle de Nómina - {detalleNomina.periodo}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setDetalleNomina(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Ingresos</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(detalleNomina.totalIngresos)}</p>
                </div>
                <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Descuentos</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(detalleNomina.totalDescuentos)}</p>
                </div>
                <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Neto a Pagar</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(detalleNomina.totalNeto)}</p>
                </div>
              </div>

              {/* Tabla de Empleados */}
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                <table className="w-full">
                  <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Empleado</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Días Trab.</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Sueldo Base</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>H. Extras</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Asig. Fam.</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Ingresos</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>AFP</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleNomina.empleados?.map((detalle, index) => (
                      <tr key={index} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>{detalle.empleado}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>{detalle.diasTrabajados}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>{formatCurrency(detalle.sueldoBase)}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>{formatCurrency(detalle.horasExtras)}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--color-text)' }}>{formatCurrency(detalle.asignacionFamiliar)}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(detalle.ingresosTotales)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(detalle.afp)}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(detalle.netoPagar)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => {
                  setShowModal(false)
                  setDetalleNomina(null)
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cerrar
              </button>
              {!detalleNomina.id && (
                <button
                  onClick={handleGuardarNomina}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Guardar Nómina
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Nomina

