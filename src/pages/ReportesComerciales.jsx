import { useState, useEffect } from 'react'
import { TrendingUp, Users, ShoppingCart, Package, BarChart, PieChart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas, getClientes, getOportunidades, getProductos } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const ReportesComerciales = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [reportes, setReportes] = useState({
    ventasPorCliente: [],
    ventasPorProducto: [],
    productosMasVendidos: [],
    tasaConversion: 0,
    clientesRentables: []
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
      
      const [ventasData, clientesData, oportunidadesData, productosData] = await Promise.all([
        getVentas(companyId),
        getClientes(companyId),
        getOportunidades(companyId),
        getProductos(companyId)
      ])

      const fechaDesdeDate = new Date(fechaDesde)
      const fechaHastaDate = new Date(fechaHasta)

      // Filtrar ventas del período
      const ventasPeriodo = (ventasData || [])
        .filter(v => {
          if (!v.fecha) return false
          const fechaVenta = new Date(v.fecha)
          return fechaVenta >= fechaDesdeDate && fechaVenta <= fechaHastaDate && v.estado === 'Completada'
        })

      // Ventas por Cliente
      const ventasPorClienteMap = new Map()
      ventasPeriodo.forEach(v => {
        const clienteId = v.clienteId || v.cliente || 'Sin Cliente'
        const clienteNombre = clientesData?.find(c => c.id === clienteId)?.nombre || clienteId
        const monto = parseFloat(v.total || v.montoTotal || 0)
        
        if (ventasPorClienteMap.has(clienteNombre)) {
          ventasPorClienteMap.set(clienteNombre, ventasPorClienteMap.get(clienteNombre) + monto)
        } else {
          ventasPorClienteMap.set(clienteNombre, monto)
        }
      })
      
      const ventasPorCliente = Array.from(ventasPorClienteMap.entries())
        .map(([cliente, monto]) => ({ cliente, monto }))
        .sort((a, b) => b.monto - a.monto)
        .slice(0, 10)

      // Ventas por Producto
      const ventasPorProductoMap = new Map()
      ventasPeriodo.forEach(v => {
        const productos = v.productos || []
        productos.forEach(p => {
          const productoNombre = p.nombre || p.producto || 'Sin Nombre'
          const monto = parseFloat(p.subtotal || (p.precio || 0) * (p.cantidad || 0))
          
          if (ventasPorProductoMap.has(productoNombre)) {
            ventasPorProductoMap.set(productoNombre, ventasPorProductoMap.get(productoNombre) + monto)
          } else {
            ventasPorProductoMap.set(productoNombre, monto)
          }
        })
      })

      const ventasPorProducto = Array.from(ventasPorProductoMap.entries())
        .map(([producto, monto]) => ({ producto, monto }))
        .sort((a, b) => b.monto - a.monto)
        .slice(0, 10)

      // Tasa de Conversión (Oportunidades ganadas / Total oportunidades)
      const oportunidadesPeriodo = (oportunidadesData || [])
        .filter(o => {
          if (!o.fechaCreacion) return false
          const fecha = o.fechaCreacion?.toDate?.() || new Date(o.createdAt || 0)
          return fecha >= fechaDesdeDate && fecha <= fechaHastaDate
        })
      
      const oportunidadesGanadas = oportunidadesPeriodo.filter(o => o.estado === 'Ganada').length
      const tasaConversion = oportunidadesPeriodo.length > 0 
        ? (oportunidadesGanadas / oportunidadesPeriodo.length) * 100 
        : 0

      // Clientes Rentables (top clientes por monto)
      const clientesRentables = ventasPorCliente.slice(0, 5)

      setReportes({
        ventasPorCliente,
        ventasPorProducto,
        productosMasVendidos: ventasPorProducto,
        tasaConversion,
        clientesRentables
      })

    } catch (error) {
      console.error('Error al cargar reportes comerciales:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando reportes comerciales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Reportes Comerciales
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Qué vendes, a quién y cómo. Ventas por cliente, vendedor, productos más vendidos y conversión del embudo.
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Tasa de Conversión</h3>
            <BarChart className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {reportes.tasaConversion.toFixed(1)}%
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Oportunidades ganadas / Total oportunidades
          </p>
        </div>
        <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Top Clientes</h3>
            <Users className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {reportes.clientesRentables.length}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Clientes más rentables del período
          </p>
        </div>
      </div>

      {/* Ventas por Cliente */}
      <div className="mb-6 p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Users className="text-blue-600" size={24} />
          Ventas por Cliente
        </h2>
        {reportes.ventasPorCliente.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No hay datos de ventas por cliente en el período seleccionado
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Total Ventas</th>
                </tr>
              </thead>
              <tbody>
                {reportes.ventasPorCliente.map((item, index) => (
                  <tr key={index} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-2 font-semibold" style={{ color: 'var(--color-text)' }}>{item.cliente}</td>
                    <td className="px-4 py-2 text-right font-bold text-green-600">{formatCurrency(item.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Productos Más Vendidos */}
      <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Package className="text-purple-600" size={24} />
          Productos Más Vendidos
        </h2>
        {reportes.productosMasVendidos.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No hay datos de productos vendidos en el período seleccionado
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Total Ventas</th>
                </tr>
              </thead>
              <tbody>
                {reportes.productosMasVendidos.map((item, index) => (
                  <tr key={index} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-2 font-semibold" style={{ color: 'var(--color-text)' }}>{item.producto}</td>
                    <td className="px-4 py-2 text-right font-bold text-purple-600">{formatCurrency(item.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportesComerciales

