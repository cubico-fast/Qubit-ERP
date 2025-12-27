import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Search, Edit, Trash, X, DollarSign, Calculator, TrendingDown, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getCostosProyecto, saveCostoProyecto, updateCostoProyecto, deleteCostoProyecto, getProyectos, getAsignacionesRecursos } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const ControlCostos = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [costos, setCostos] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [costoSeleccionado, setCostoSeleccionado] = useState(null)

  const [formData, setFormData] = useState({
    proyectoId: '',
    concepto: '',
    tipo: 'Mano de Obra',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: ''
  })

  const tiposCosto = ['Mano de Obra', 'Gastos', 'Materiales', 'Servicios Externos', 'Viáticos', 'Licencias', 'Otros']

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [costosData, proyectosData, asignacionesData] = await Promise.all([
        getCostosProyecto(companyId),
        getProyectos(companyId),
        getAsignacionesRecursos(companyId)
      ])
      
      setCostos(costosData || [])
      setProyectos(proyectosData || [])
      setAsignaciones(asignacionesData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setCostos([])
      setProyectos([])
      setAsignaciones([])
    } finally {
      setLoading(false)
    }
  }

  const calcularCostosProyecto = (proyectoId) => {
    // Costos directos registrados
    const costosDirectos = costos
      .filter(c => c.proyectoId === proyectoId)
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0)
    
    // Costos de asignaciones de recursos
    const costosRecursos = asignaciones
      .filter(a => a.proyectoId === proyectoId)
      .reduce((sum, a) => sum + (parseFloat(a.costoTotal) || (parseFloat(a.costoHora) || 0) * (parseFloat(a.horasAsignadas) || 0)), 0)
    
    return costosDirectos + costosRecursos
  }

  const calcularRentabilidadProyecto = (proyecto) => {
    const costoTotal = calcularCostosProyecto(proyecto.id)
    const ingreso = parseFloat(proyecto.presupuesto) || 0
    const utilidad = ingreso - costoTotal
    const margen = ingreso > 0 ? (utilidad / ingreso) * 100 : 0
    const porcentajeCostos = ingreso > 0 ? (costoTotal / ingreso) * 100 : 0
    return { costoTotal, ingreso, utilidad, margen, porcentajeCostos }
  }

  const handleCrearCosto = () => {
    setModoModal('crear')
    setCostoSeleccionado(null)
    setFormData({
      proyectoId: '',
      concepto: '',
      tipo: 'Mano de Obra',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      descripcion: ''
    })
    setShowModal(true)
  }

  const handleEditarCosto = (costo) => {
    setModoModal('editar')
    setCostoSeleccionado(costo)
    setFormData({
      proyectoId: costo.proyectoId || '',
      concepto: costo.concepto || '',
      tipo: costo.tipo || 'Mano de Obra',
      monto: costo.monto || '',
      fecha: costo.fecha || new Date().toISOString().split('T')[0],
      descripcion: costo.descripcion || ''
    })
    setShowModal(true)
  }

  const handleGuardarCosto = async () => {
    try {
      if (!formData.proyectoId || !formData.concepto || !formData.monto) {
        alert('Proyecto, concepto y monto son obligatorios')
        return
      }

      const costoData = {
        ...formData,
        monto: parseFloat(formData.monto)
      }

      if (modoModal === 'crear') {
        await saveCostoProyecto(costoData, companyId)
        alert('✅ Costo registrado exitosamente')
      } else {
        await updateCostoProyecto(costoSeleccionado.id, costoData, companyId)
        alert('✅ Costo actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar costo:', error)
      alert('Error al guardar costo: ' + error.message)
    }
  }

  const handleEliminarCosto = async (costo) => {
    if (!window.confirm(`¿Está seguro de eliminar este costo?`)) {
      return
    }

    try {
      await deleteCostoProyecto(costo.id)
      await loadData()
      alert('✅ Costo eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar costo:', error)
      alert('Error al eliminar costo: ' + error.message)
    }
  }

  const getNombreProyecto = (proyectoId) => {
    const proyecto = proyectos.find(p => p.id === proyectoId)
    return proyecto ? proyecto.nombre : proyectoId
  }

  const filteredProyectos = proyectos.filter(proy =>
    proy.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proy.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(proy => filtroProyecto === 'Todos' || proy.id === filtroProyecto)

  // Resumen general
  const resumenGeneral = proyectos.reduce((acc, proy) => {
    const rent = calcularRentabilidadProyecto(proy)
    return {
      totalIngresos: acc.totalIngresos + rent.ingreso,
      totalCostos: acc.totalCostos + rent.costoTotal,
      totalUtilidad: acc.totalUtilidad + rent.utilidad,
      proyectosRentables: acc.proyectosRentables + (rent.utilidad > 0 ? 1 : 0),
      proyectosConPerdidas: acc.proyectosConPerdidas + (rent.utilidad < 0 ? 1 : 0)
    }
  }, { totalIngresos: 0, totalCostos: 0, totalUtilidad: 0, proyectosRentables: 0, proyectosConPerdidas: 0 })

  const margenGeneral = resumenGeneral.totalIngresos > 0 
    ? (resumenGeneral.totalUtilidad / resumenGeneral.totalIngresos) * 100 
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando costos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Control de Costos y Rentabilidad
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Controla todos los costos del proyecto y analiza la rentabilidad. Muestra ingresos, costos, utilidad y margen.
        </p>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Ingresos</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(resumenGeneral.totalIngresos)}</p>
            </div>
            <TrendingUp className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Costos</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(resumenGeneral.totalCostos)}</p>
            </div>
            <TrendingDown className="text-red-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Utilidad Total</p>
              <p className={`text-2xl font-bold ${resumenGeneral.totalUtilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(resumenGeneral.totalUtilidad)}
              </p>
            </div>
            <Calculator className={resumenGeneral.totalUtilidad >= 0 ? 'text-green-600' : 'text-red-600'} size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Margen General</p>
              <p className={`text-2xl font-bold ${margenGeneral >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {margenGeneral.toFixed(1)}%
              </p>
            </div>
            <DollarSign className={margenGeneral >= 0 ? 'text-green-600' : 'text-red-600'} size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Proyectos Rentables</p>
              <p className="text-2xl font-bold text-green-600">{resumenGeneral.proyectosRentables}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {resumenGeneral.proyectosConPerdidas} con pérdidas
              </p>
            </div>
            <AlertCircle className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar proyectos..."
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
        <div className="flex gap-2">
          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="Todos">Todos los proyectos</option>
            {proyectos.map(proy => (
              <option key={proy.id} value={proy.id}>{proy.nombre}</option>
            ))}
          </select>
          <button 
            onClick={handleCrearCosto}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Registrar Costo
          </button>
        </div>
      </div>

      {/* Tabla de Proyectos con Rentabilidad */}
      <div className="border rounded-lg overflow-hidden mb-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Proyecto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Ingresos</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Costos</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Utilidad</th>
              <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Margen</th>
              <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredProyectos.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay proyectos</p>
                  <p className="text-sm">Comienza creando proyectos</p>
                </td>
              </tr>
            ) : (
              filteredProyectos.map((proyecto) => {
                const rentabilidad = calcularRentabilidadProyecto(proyecto)
                return (
                  <tr key={proyecto.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>{proyecto.nombre}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{proyecto.cliente || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(rentabilidad.ingreso)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-semibold">
                      {formatCurrency(rentabilidad.costoTotal)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${rentabilidad.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(rentabilidad.utilidad)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${rentabilidad.margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {rentabilidad.margen.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rentabilidad.utilidad >= 0 ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Rentable
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Con Pérdidas
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tabla de Costos Detallados */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Costos Registrados</h2>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <table className="w-full">
            <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Proyecto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Concepto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tipo</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Monto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {costos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    <DollarSign size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No hay costos registrados</p>
                    <p className="text-sm">Comienza registrando costos</p>
                  </td>
                </tr>
              ) : (
                costos
                  .filter(c => filtroProyecto === 'Todos' || c.proyectoId === filtroProyecto)
                  .map((costo) => (
                    <tr key={costo.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                        {costo.fecha ? formatDate(costo.fecha) : '-'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                        {getNombreProyecto(costo.proyectoId)}
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>
                        {costo.concepto}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                        {costo.tipo}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        {formatCurrency(costo.monto || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditarCosto(costo)} 
                            className="p-1 hover:bg-gray-100 rounded" 
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleEliminarCosto(costo)} 
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
                {modoModal === 'crear' ? 'Registrar Costo' : 'Editar Costo'}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Proyecto *</label>
                <select
                  value={formData.proyectoId}
                  onChange={(e) => setFormData({ ...formData, proyectoId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Seleccionar proyecto...</option>
                  {proyectos.map(proy => (
                    <option key={proy.id} value={proy.id}>{proy.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Concepto *</label>
                <input
                  type="text"
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: Viáticos, Licencias, Materiales, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    {tiposCosto.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Monto *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    placeholder="0.00"
                  />
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

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Descripción del costo..."
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
                onClick={handleGuardarCosto}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Registrar' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlCostos

