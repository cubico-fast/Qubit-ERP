import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Package, FolderKanban, TrendingDown, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas, getOrdenesCompra, getProductos, getProyectos } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const ReportesGenerales = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [indicadores, setIndicadores] = useState({
    ventasMes: 0,
    comprasMes: 0,
    utilidadEstimada: 0,
    stockValorizado: 0,
    proyectosActivos: 0
  })

  useEffect(() => {
    loadIndicadores()
  }, [companyId])

  const loadIndicadores = async () => {
    try {
      setLoading(true)
      const ahora = new Date()
      const mesActual = ahora.getMonth() + 1
      const añoActual = ahora.getFullYear()
      const inicioMes = `${añoActual}-${String(mesActual).padStart(2, '0')}-01`
      const finMes = `${añoActual}-${String(mesActual).padStart(2, '0')}-31`

      const [ventasData, comprasData, productosData, proyectosData] = await Promise.all([
        getVentas(companyId),
        getOrdenesCompra(companyId),
        getProductos(companyId),
        getProyectos(companyId)
      ])

      // Calcular ventas del mes
      const ventasMes = (ventasData || [])
        .filter(v => {
          if (!v.fecha) return false
          const fechaVenta = new Date(v.fecha)
          return fechaVenta.getMonth() + 1 === mesActual && 
                 fechaVenta.getFullYear() === añoActual &&
                 v.estado === 'Completada'
        })
        .reduce((sum, v) => sum + (parseFloat(v.total || v.montoTotal || 0)), 0)

      // Calcular compras del mes
      const comprasMes = (comprasData || [])
        .filter(c => {
          if (!c.fecha) return false
          const fechaCompra = new Date(c.fecha)
          return fechaCompra.getMonth() + 1 === mesActual && 
                 fechaCompra.getFullYear() === añoActual
        })
        .reduce((sum, c) => sum + (parseFloat(c.total || c.montoTotal || 0)), 0)

      // Calcular stock valorizado
      const stockValorizado = (productosData || [])
        .reduce((sum, p) => {
          const stock = parseFloat(p.stock || 0)
          const precioCompra = parseFloat(p.precioCompra || p.precio || 0)
          return sum + (stock * precioCompra)
        }, 0)

      // Proyectos activos
      const proyectosActivos = (proyectosData || [])
        .filter(p => p.estado === 'En Ejecución' || p.estado === 'En Planificación')
        .length

      // Utilidad estimada (ventas - compras)
      const utilidadEstimada = ventasMes - comprasMes

      setIndicadores({
        ventasMes,
        comprasMes,
        utilidadEstimada,
        stockValorizado,
        proyectosActivos
      })
    } catch (error) {
      console.error('Error al cargar indicadores:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando indicadores...</p>
        </div>
      </div>
    )
  }

  const indicadoresCards = [
    {
      titulo: 'Ventas del Mes',
      valor: formatCurrency(indicadores.ventasMes),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      titulo: 'Compras del Mes',
      valor: formatCurrency(indicadores.comprasMes),
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      titulo: 'Utilidad Estimada',
      valor: formatCurrency(indicadores.utilidadEstimada),
      icon: TrendingUp,
      color: indicadores.utilidadEstimada >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: indicadores.utilidadEstimada >= 0 ? 'bg-green-100' : 'bg-red-100'
    },
    {
      titulo: 'Stock Valorizado',
      valor: formatCurrency(indicadores.stockValorizado),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      titulo: 'Proyectos Activos',
      valor: indicadores.proyectosActivos,
      icon: FolderKanban,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Reportes Generales
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Visión global del negocio. Indicadores clave de toda la empresa.
        </p>
      </div>

      {/* Indicadores Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {indicadoresCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div 
              key={index} 
              className="p-4 rounded-lg border" 
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={card.color} size={24} />
                </div>
              </div>
              <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {card.titulo}
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {card.valor}
              </p>
            </div>
          )
        })}
      </div>

      {/* Información adicional */}
      <div className="p-4 rounded-lg border bg-blue-50" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <strong>Nota:</strong> Estos indicadores se alimentan de los módulos de Ventas, Compras, Inventarios y Proyectos. 
          Se actualizan en tiempo real según los datos registrados en el ERP.
        </p>
      </div>
    </div>
  )
}

export default ReportesGenerales

