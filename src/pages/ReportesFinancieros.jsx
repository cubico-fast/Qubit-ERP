import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas, getOrdenesCompra, getFacturasProveedores, getNominas } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const ReportesFinancieros = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [estadoResultados, setEstadoResultados] = useState({
    ingresos: 0,
    costos: 0,
    utilidad: 0
  })
  const [flujoCaja, setFlujoCaja] = useState({
    ingresos: 0,
    egresos: 0,
    saldo: 0
  })

  useEffect(() => {
    calcularPeriodo()
  }, [periodo])

  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      loadReportes()
    }
  }, [companyId, fechaDesde, fechaHasta])

  const calcularPeriodo = () => {
    const ahora = new Date()
    let desde, hasta

    switch(periodo) {
      case 'mes':
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        hasta = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)
        break
      case 'trimestre':
        const trimestre = Math.floor(ahora.getMonth() / 3)
        desde = new Date(ahora.getFullYear(), trimestre * 3, 1)
        hasta = new Date(ahora.getFullYear(), (trimestre + 1) * 3, 0)
        break
      case 'año':
        desde = new Date(ahora.getFullYear(), 0, 1)
        hasta = new Date(ahora.getFullYear(), 11, 31)
        break
      default:
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        hasta = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)
    }

    setFechaDesde(desde.toISOString().split('T')[0])
    setFechaHasta(hasta.toISOString().split('T')[0])
  }

  const loadReportes = async () => {
    try {
      setLoading(true)
      
      const [ventasData, comprasData, facturasProveedoresData, nominasData] = await Promise.all([
        getVentas(companyId),
        getOrdenesCompra(companyId),
        getFacturasProveedores(companyId),
        getNominas(companyId)
      ])

      const fechaDesdeDate = new Date(fechaDesde)
      const fechaHastaDate = new Date(fechaHasta)

      // Estado de Resultados
      const ingresos = (ventasData || [])
        .filter(v => {
          if (!v.fecha) return false
          const fechaVenta = new Date(v.fecha)
          return fechaVenta >= fechaDesdeDate && fechaVenta <= fechaHastaDate && v.estado === 'Completada'
        })
        .reduce((sum, v) => sum + (parseFloat(v.total || v.montoTotal || 0)), 0)

      const costos = (comprasData || [])
        .filter(c => {
          if (!c.fecha) return false
          const fechaCompra = new Date(c.fecha)
          return fechaCompra >= fechaDesdeDate && fechaCompra <= fechaHastaDate
        })
        .reduce((sum, c) => sum + (parseFloat(c.total || c.montoTotal || 0)), 0)

      // Agregar costos de nómina
      const costosNomina = (nominasData || [])
        .filter(n => {
          if (!n.fechaGeneracion && !n.createdAt) return false
          const fecha = n.fechaGeneracion ? new Date(n.fechaGeneracion) : (n.createdAt?.toDate?.() || new Date(0))
          return fecha >= fechaDesdeDate && fecha <= fechaHastaDate
        })
        .reduce((sum, n) => sum + (parseFloat(n.totalNeto || 0)), 0)

      const totalCostos = costos + costosNomina
      const utilidad = ingresos - totalCostos

      setEstadoResultados({
        ingresos,
        costos: totalCostos,
        utilidad
      })

      // Flujo de Caja
      // Ingresos: ventas completadas y pagadas
      const ingresosCaja = (ventasData || [])
        .filter(v => {
          if (!v.fecha) return false
          const fecha = new Date(v.fecha)
          return fecha >= fechaDesdeDate && fecha <= fechaHastaDate && v.estado === 'Completada'
        })
        .reduce((sum, v) => sum + (parseFloat(v.total || v.montoTotal || 0)), 0)

      // Egresos: compras pagadas y facturas de proveedores
      const egresosCompras = (comprasData || [])
        .filter(c => {
          if (!c.fecha) return false
          const fecha = new Date(c.fecha)
          return fecha >= fechaDesdeDate && fecha <= fechaHastaDate
        })
        .reduce((sum, c) => sum + (parseFloat(c.total || c.montoTotal || 0)), 0)

      const egresosFacturas = (facturasProveedoresData || [])
        .filter(f => {
          if (!f.fechaPago) return false
          const fecha = new Date(f.fechaPago)
          return fecha >= fechaDesdeDate && fecha <= fechaHastaDate && f.estado === 'Pagado'
        })
        .reduce((sum, f) => sum + (parseFloat(f.monto || f.total || 0)), 0)

      const egresosCaja = egresosCompras + egresosFacturas

      // Agregar pagos de nómina al flujo de caja
      const egresosNomina = costosNomina

      setFlujoCaja({
        ingresos: ingresosCaja,
        egresos: egresosCaja + egresosNomina,
        saldo: ingresosCaja - (egresosCaja + egresosNomina)
      })

    } catch (error) {
      console.error('Error al cargar reportes financieros:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando reportes financieros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Reportes Financieros
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Análisis de salud económica: dinero, rentabilidad y obligaciones.
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <select
          value={periodo}
          onChange={(e) => {
            setPeriodo(e.target.value)
            calcularPeriodo()
          }}
          className="px-4 py-2 border rounded-lg"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
        >
          <option value="mes">Este Mes</option>
          <option value="trimestre">Este Trimestre</option>
          <option value="año">Este Año</option>
        </select>
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="px-4 py-2 border rounded-lg"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
        />
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="px-4 py-2 border rounded-lg"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
        />
        <button
          onClick={loadReportes}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Calendar size={20} />
          Actualizar
        </button>
      </div>

      {/* Estado de Resultados */}
      <div className="mb-6 p-6 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Estado de Resultados</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Ingresos:</span>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(estadoResultados.ingresos)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Costos:</span>
            <span className="text-xl font-bold text-red-600">{formatCurrency(estadoResultados.costos)}</span>
          </div>
          <div className="flex justify-between items-center p-4 border-t-2 border-b-2" style={{ borderColor: 'var(--color-border)' }}>
            <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>Utilidad:</span>
            <span className={`text-2xl font-bold ${estadoResultados.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(estadoResultados.utilidad)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Margen de Utilidad:</span>
            <span className={`font-bold ${estadoResultados.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {estadoResultados.ingresos > 0 
                ? ((estadoResultados.utilidad / estadoResultados.ingresos) * 100).toFixed(2)
                : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Flujo de Caja */}
      <div className="mb-6 p-6 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Flujo de Caja</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Ingresos:</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(flujoCaja.ingresos)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Egresos:</span>
            <span className="text-xl font-bold text-red-600">{formatCurrency(flujoCaja.egresos)}</span>
          </div>
          <div className="flex justify-between items-center p-4 border-t-2 border-b-2" style={{ borderColor: 'var(--color-border)' }}>
            <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>Saldo:</span>
            <span className={`text-2xl font-bold ${flujoCaja.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(flujoCaja.saldo)}
            </span>
          </div>
        </div>
      </div>

      {/* Resumen de Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Cuentas por Cobrar</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(0)}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Montos pendientes de recibir
          </p>
        </div>
        <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Cuentas por Pagar</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(0)}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Montos pendientes de pagar
          </p>
        </div>
      </div>
    </div>
  )
}

export default ReportesFinancieros

