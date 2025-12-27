import { useState, useEffect } from 'react'
import { Package, AlertCircle, Clock, TrendingDown, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getProductos, getPedidos, getOrdenesProduccion, getEnvios } from '../utils/firebaseUtils'

const ReportesOperativos = () => {
  const { companyId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [indicadores, setIndicadores] = useState({
    stockCritico: 0,
    ordenesAtrasadas: 0,
    productosStockMinimo: [],
    pedidosAtrasados: [],
    produccionVsPlan: 0,
    mermas: 0
  })

  useEffect(() => {
    loadIndicadores()
  }, [companyId])

  const loadIndicadores = async () => {
    try {
      setLoading(true)
      
      const [productosData, pedidosData, ordenesProduccionData, enviosData] = await Promise.all([
        getProductos(companyId),
        getPedidos(companyId),
        getOrdenesProduccion(companyId),
        getEnvios(companyId)
      ])

      const ahora = new Date()

      // Stock crítico (productos con stock por debajo del mínimo)
      const productosStockMinimo = (productosData || [])
        .filter(p => {
          const stock = parseFloat(p.stock || 0)
          const stockMinimo = parseFloat(p.stockMinimo || 0)
          return stockMinimo > 0 && stock < stockMinimo
        })

      // Pedidos atrasados
      const pedidosAtrasados = (pedidosData || [])
        .filter(p => {
          if (!p.fechaEntrega || p.estado === 'Entregado' || p.estado === 'Cancelado') return false
          const fechaEntrega = new Date(p.fechaEntrega)
          return fechaEntrega < ahora && p.estado !== 'Entregado'
        })

      // Órdenes de producción atrasadas
      const ordenesAtrasadas = (ordenesProduccionData || [])
        .filter(o => {
          if (!o.fechaFinEstimada || o.estado === 'Completada' || o.estado === 'Cancelada') return false
          const fechaFin = new Date(o.fechaFinEstimada)
          return fechaFin < ahora && o.estado !== 'Completada'
        })

      setIndicadores({
        stockCritico: productosStockMinimo.length,
        ordenesAtrasadas: ordenesAtrasadas.length,
        productosStockMinimo: productosStockMinimo.slice(0, 10), // Primeros 10
        pedidosAtrasados: pedidosAtrasados.slice(0, 10), // Primeros 10
        produccionVsPlan: 0, // Se puede calcular comparando ordenes completadas vs planificadas
        mermas: 0 // Se puede obtener de movimientos de stock tipo "Merma"
      })
    } catch (error) {
      console.error('Error al cargar indicadores operativos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando reportes operativos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Reportes Operativos
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Eficiencia y ejecución: stock mínimo vs real, órdenes atrasadas, producción vs plan, mermas.
        </p>
      </div>

      {/* Indicadores Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Stock Crítico</p>
              <p className="text-2xl font-bold text-red-600">{indicadores.stockCritico}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>productos</p>
            </div>
            <AlertCircle className="text-red-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pedidos Atrasados</p>
              <p className="text-2xl font-bold text-orange-600">{indicadores.pedidosAtrasados.length}</p>
            </div>
            <Clock className="text-orange-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Órdenes Atrasadas</p>
              <p className="text-2xl font-bold text-yellow-600">{indicadores.ordenesAtrasadas}</p>
            </div>
            <XCircle className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Mermas</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{indicadores.mermas}</p>
            </div>
            <TrendingDown className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Productos con Stock Crítico */}
      <div className="mb-6 p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <AlertCircle className="text-red-600" size={24} />
          Productos con Stock Crítico
        </h2>
        {indicadores.productosStockMinimo.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No hay productos con stock crítico
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Producto</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Stock Actual</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Stock Mínimo</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {indicadores.productosStockMinimo.map((producto) => {
                  const stock = parseFloat(producto.stock || 0)
                  const stockMinimo = parseFloat(producto.stockMinimo || 0)
                  const diferencia = stock - stockMinimo
                  return (
                    <tr key={producto.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="px-4 py-2 font-semibold" style={{ color: 'var(--color-text)' }}>{producto.nombre}</td>
                      <td className="px-4 py-2 text-right" style={{ color: 'var(--color-text)' }}>{stock}</td>
                      <td className="px-4 py-2 text-right" style={{ color: 'var(--color-text)' }}>{stockMinimo}</td>
                      <td className={`px-4 py-2 text-right font-bold ${diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {diferencia < 0 ? `-${Math.abs(diferencia)}` : `+${diferencia}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pedidos Atrasados */}
      <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Clock className="text-orange-600" size={24} />
          Pedidos Atrasados
        </h2>
        {indicadores.pedidosAtrasados.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No hay pedidos atrasados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Pedido</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha Entrega</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Días Atraso</th>
                </tr>
              </thead>
              <tbody>
                {indicadores.pedidosAtrasados.map((pedido) => {
                  const fechaEntrega = new Date(pedido.fechaEntrega)
                  const diasAtraso = Math.floor((new Date() - fechaEntrega) / (1000 * 60 * 60 * 24))
                  return (
                    <tr key={pedido.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="px-4 py-2 font-semibold" style={{ color: 'var(--color-text)' }}>
                        {pedido.numeroPedido || pedido.id}
                      </td>
                      <td className="px-4 py-2" style={{ color: 'var(--color-text)' }}>{pedido.cliente || '-'}</td>
                      <td className="px-4 py-2" style={{ color: 'var(--color-text)' }}>
                        {pedido.fechaEntrega ? new Date(pedido.fechaEntrega).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                          {pedido.estado || 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-red-600">
                        {diasAtraso} días
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportesOperativos

