import { useState, useEffect } from 'react'
import { TrendingUp, Search, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas, getClientes, getAsientosContables } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const CuentasPorCobrar = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [ventas, setVentas] = useState([])
  const [clientes, setClientes] = useState([])
  const [asientos, setAsientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ventasData, clientesData, asientosData] = await Promise.all([
        getVentas(companyId),
        getClientes(companyId),
        getAsientosContables(companyId)
      ])
      
      setVentas(ventasData)
      setClientes(clientesData)
      setAsientos(asientosData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular cuentas por cobrar basadas en ventas
  const calcularCuentasPorCobrar = () => {
    const cuentas = []
    const clienteMap = new Map(clientes.map(c => [c.id, c]))
    
    ventas.forEach(venta => {
      // Asumir que ventas con forma de pago diferente a "contado" son pendientes
      const esPendiente = venta.formaPago !== 'contado' && venta.formaPago !== 'efectivo'
      const diasVencido = esPendiente ? calcularDiasVencido(venta.fecha) : 0
      
      if (esPendiente || venta.estado === 'Pendiente') {
        const cliente = clienteMap.get(venta.clienteId) || { nombre: venta.cliente || 'Cliente' }
        
        cuentas.push({
          id: venta.id,
          ventaId: venta.id,
          cliente: cliente.nombre,
          clienteId: venta.clienteId,
          fecha: venta.fecha,
          fechaVencimiento: calcularFechaVencimiento(venta.fecha, venta.formaPago),
          monto: venta.total || 0,
          montoPagado: 0, // Se puede calcular si hay pagos registrados
          saldo: venta.total || 0,
          diasVencido,
          estado: diasVencido > 0 ? 'vencido' : diasVencido === 0 ? 'por_vencer' : 'vigente',
          tipoComprobante: venta.tipoComprobante,
          referencia: venta.id
        })
      }
    })

    // Incluir asientos contables que afecten Cuentas por Cobrar
    asientos
      .filter(a => a.cuenta?.toLowerCase().includes('cuentas por cobrar'))
      .forEach(a => {
        const monto = (a.debe || 0) - (a.haber || 0)
        if (monto <= 0) return
        const diasVencido = calcularDiasVencido(a.fecha)
        cuentas.push({
          id: `asiento-${a.id}`,
          ventaId: a.referencia || a.id,
          cliente: a.descripcion || 'Cliente',
          clienteId: '',
          fecha: a.fecha,
          fechaVencimiento: calcularFechaVencimiento(a.fecha, 'credito_30'),
          monto: monto,
          montoPagado: 0,
          saldo: monto,
          diasVencido,
          estado: diasVencido > 0 ? 'vencido' : diasVencido === 0 ? 'por_vencer' : 'vigente',
          tipoComprobante: a.cuenta,
          referencia: a.referencia || a.id
        })
      })
    
    return cuentas.sort((a, b) => {
      if (a.estado === 'vencido' && b.estado !== 'vencido') return -1
      if (a.estado !== 'vencido' && b.estado === 'vencido') return 1
      return new Date(b.fecha) - new Date(a.fecha)
    })
  }

  const calcularFechaVencimiento = (fecha, formaPago) => {
    const fechaBase = new Date(fecha)
    let dias = 0
    
    if (formaPago === 'credito_15') dias = 15
    else if (formaPago === 'credito_30') dias = 30
    else if (formaPago === 'credito_60') dias = 60
    else if (formaPago === 'credito_90') dias = 90
    else dias = 30 // Por defecto
    
    fechaBase.setDate(fechaBase.getDate() + dias)
    return fechaBase.toISOString().split('T')[0]
  }

  const calcularDiasVencido = (fecha) => {
    const hoy = new Date()
    const fechaVenta = new Date(fecha)
    const dias = Math.floor((hoy - fechaVenta) / (1000 * 60 * 60 * 24))
    return Math.max(0, dias - 30) // Asumiendo 30 días de crédito por defecto
  }

  const cuentasPorCobrar = calcularCuentasPorCobrar()

  const filteredCuentas = cuentasPorCobrar.filter(cuenta => {
    const matchesSearch = 
      cuenta.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuenta.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filtroEstado === 'todos') return matchesSearch
    return matchesSearch && cuenta.estado === filtroEstado
  })

  const totalPorCobrar = filteredCuentas.reduce((sum, c) => sum + c.saldo, 0)
  const totalVencido = filteredCuentas.filter(c => c.estado === 'vencido').reduce((sum, c) => sum + c.saldo, 0)
  const totalPorVencer = filteredCuentas.filter(c => c.estado === 'por_vencer').reduce((sum, c) => sum + c.saldo, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Cuentas por Cobrar
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de facturación y cobros a clientes
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total por Cobrar</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPorCobrar)}</p>
            </div>
            <TrendingUp size={24} className="text-blue-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Vencido</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalVencido)}</p>
            </div>
            <AlertCircle size={24} className="text-red-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Por Vencer</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPorVencer)}</p>
            </div>
            <Clock size={24} className="text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente o referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-4 py-2 border rounded-lg"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <option value="todos">Todos los estados</option>
          <option value="vencido">Vencido</option>
          <option value="por_vencer">Por Vencer</option>
          <option value="vigente">Vigente</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-background)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Vencimiento</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Comprobante</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Monto</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Saldo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Días</th>
              </tr>
            </thead>
            <tbody>
              {filteredCuentas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No hay cuentas por cobrar registradas
                  </td>
                </tr>
              ) : (
                filteredCuentas.map((cuenta) => (
                  <tr key={cuenta.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {cuenta.cliente}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(cuenta.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(cuenta.fechaVencimiento)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {cuenta.tipoComprobante || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(cuenta.monto)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(cuenta.saldo)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        cuenta.estado === 'vencido' 
                          ? 'bg-red-100 text-red-800'
                          : cuenta.estado === 'por_vencer'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {cuenta.estado === 'vencido' ? 'Vencido' : cuenta.estado === 'por_vencer' ? 'Por Vencer' : 'Vigente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {cuenta.diasVencido > 0 ? `${cuenta.diasVencido} días` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CuentasPorCobrar

