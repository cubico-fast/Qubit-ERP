import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, TrendingDown, Calendar, DollarSign, ArrowUp, ArrowDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas, getMovimientosTesoreria, saveMovimientoTesoreria, getFacturasProveedores } from '../utils/firebaseUtils'
import { formatDate, getLastMonths } from '../utils/dateUtils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Tesoreria = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [ventas, setVentas] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'ingreso',
    concepto: '',
    monto: '',
    banco: '',
    cuenta: '',
    descripcion: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ventasData, movimientosData, facturasData] = await Promise.all([
        getVentas(companyId),
        getMovimientosTesoreria(companyId),
        getFacturasProveedores(companyId)
      ])
      
      setVentas(ventasData)
      setMovimientos(movimientosData)
      setFacturas(facturasData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    try {
      if (!formData.concepto || !formData.monto) {
        alert('Por favor completa todos los campos requeridos')
        return
      }
      
      await saveMovimientoTesoreria({
        ...formData,
        monto: parseFloat(formData.monto)
      }, companyId)
      
      await loadData()
      setShowModal(false)
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'ingreso',
        concepto: '',
        monto: '',
        banco: '',
        cuenta: '',
        descripcion: ''
      })
    } catch (error) {
      console.error('Error al guardar movimiento:', error)
      alert('Error al guardar el movimiento')
    }
  }

  // Calcular flujo de caja desde ventas y movimientos
  const calcularFlujoCaja = () => {
    const ingresos = []
    const egresos = []
    
    // Ingresos desde ventas
    ventas.forEach(venta => {
      if (venta.total && venta.fecha) {
        ingresos.push({
          fecha: venta.fecha,
          monto: venta.total,
          concepto: `Venta ${venta.tipoComprobante || 'Factura'}`,
          origen: 'venta',
          referencia: venta.id
        })
      }
    })
    
    // Movimientos manuales
    movimientos.forEach(mov => {
      if (mov.tipo === 'ingreso') {
        ingresos.push({
          fecha: mov.fecha,
          monto: mov.monto || 0,
          concepto: mov.concepto || mov.descripcion,
          origen: 'manual',
          referencia: mov.id
        })
      } else {
        egresos.push({
          fecha: mov.fecha,
          monto: mov.monto || 0,
          concepto: mov.concepto || mov.descripcion,
          origen: 'manual',
          referencia: mov.id
        })
      }
    })
    
    // Egresos desde facturas de proveedores pagadas
    facturas.filter(f => f.estado === 'pagado').forEach(factura => {
      egresos.push({
        fecha: factura.fecha || new Date().toISOString().split('T')[0],
        monto: factura.monto || 0,
        concepto: `Pago a proveedor - ${factura.numero}`,
        origen: 'pago_proveedor',
        referencia: factura.id
      })
    })
    
    return { ingresos, egresos }
  }

  const { ingresos, egresos } = calcularFlujoCaja()
  const totalIngresos = ingresos.reduce((sum, i) => sum + (i.monto || 0), 0)
  const totalEgresos = egresos.reduce((sum, e) => sum + (e.monto || 0), 0)
  const saldo = totalIngresos - totalEgresos

  // Datos para gráfico de flujo de caja mensual
  const datosMensuales = getLastMonths(6).map(mes => {
    const ingresosMes = ingresos
      .filter(i => {
        const fecha = new Date(i.fecha)
        return fecha.getMonth() === mes.mes - 1 && fecha.getFullYear() === mes.año
      })
      .reduce((sum, i) => sum + (i.monto || 0), 0)
    
    const egresosMes = egresos
      .filter(e => {
        const fecha = new Date(e.fecha)
        return fecha.getMonth() === mes.mes - 1 && fecha.getFullYear() === mes.año
      })
      .reduce((sum, e) => sum + (e.monto || 0), 0)
    
    return {
      mes: mes.nombre,
      ingresos: ingresosMes,
      egresos: egresosMes,
      saldo: ingresosMes - egresosMes
    }
  })

  // Movimientos recientes combinados
  const movimientosRecientes = [...ingresos, ...egresos]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10)

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
            Tesorería
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de bancos, cajas y flujo de caja
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Wallet size={20} />
          Nuevo Movimiento
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Ingresos</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIngresos)}</p>
            </div>
            <TrendingUp size={24} className="text-green-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Egresos</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalEgresos)}</p>
            </div>
            <TrendingDown size={24} className="text-red-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Saldo</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(saldo))}
              </p>
            </div>
            <Wallet size={24} className={saldo >= 0 ? 'text-green-600' : 'text-red-600'} />
          </div>
        </div>
      </div>

      {/* Gráfico de flujo de caja */}
      <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Flujo de Caja Mensual
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datosMensuales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="ingresos" stroke="#22c55e" name="Ingresos" />
            <Line type="monotone" dataKey="egresos" stroke="#ef4444" name="Egresos" />
            <Line type="monotone" dataKey="saldo" stroke="#3b82f6" name="Saldo" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Movimientos recientes */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="px-6 py-4 border-b" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Movimientos Recientes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-background)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Concepto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tipo</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {movimientosRecientes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                movimientosRecientes.map((mov, index) => (
                  <tr key={index} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(mov.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {mov.concepto}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        mov.origen === 'venta' || (mov.origen === 'manual' && mov.tipo === 'ingreso')
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mov.origen === 'venta' || (mov.origen === 'manual' && mov.tipo === 'ingreso') ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      mov.origen === 'venta' || (mov.origen === 'manual' && mov.tipo === 'ingreso')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {mov.origen === 'venta' || (mov.origen === 'manual' && mov.tipo === 'ingreso') ? '+' : '-'}
                      {formatCurrency(mov.monto || 0)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold">Nuevo Movimiento</h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha *</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Concepto *</label>
                <input
                  type="text"
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monto *</label>
                <input
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  step="0.01"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Banco</label>
                  <input
                    type="text"
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cuenta</label>
                  <input
                    type="text"
                    value={formData.cuenta}
                    onChange={(e) => setFormData({ ...formData, cuenta: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={handleGuardar} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tesoreria

