import { useState, useEffect } from 'react'
import { CreditCard, Plus, Search, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getProveedores, getFacturasProveedores, saveProveedor, saveFacturaProveedor, getAsientosContables } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const CuentasPorPagar = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [proveedores, setProveedores] = useState([])
  const [facturas, setFacturas] = useState([])
  const [asientos, setAsientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModalProveedor, setShowModalProveedor] = useState(false)
  const [showModalFactura, setShowModalFactura] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [formProveedor, setFormProveedor] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    contacto: ''
  })
  const [formFactura, setFormFactura] = useState({
    proveedorId: '',
    numero: '',
    fecha: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    monto: '',
    descripcion: '',
    estado: 'pendiente'
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [proveedoresData, facturasData, asientosData] = await Promise.all([
        getProveedores(companyId),
        getFacturasProveedores(companyId),
        getAsientosContables(companyId)
      ])
      
      setProveedores(proveedoresData)
      setFacturas(facturasData)
      setAsientos(asientosData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardarProveedor = async () => {
    try {
      if (!formProveedor.nombre) {
        alert('El nombre del proveedor es requerido')
        return
      }
      
      await saveProveedor(formProveedor, companyId)
      await loadData()
      setShowModalProveedor(false)
      setFormProveedor({
        nombre: '',
        ruc: '',
        direccion: '',
        telefono: '',
        email: '',
        contacto: ''
      })
    } catch (error) {
      console.error('Error al guardar proveedor:', error)
      alert('Error al guardar el proveedor')
    }
  }

  const handleGuardarFactura = async () => {
    try {
      if (!formFactura.proveedorId || !formFactura.numero || !formFactura.monto) {
        alert('Por favor completa todos los campos requeridos')
        return
      }
      
      const fechaVenc = formFactura.fechaVencimiento || calcularFechaVencimiento(formFactura.fecha, 30)
      
      await saveFacturaProveedor({
        ...formFactura,
        monto: parseFloat(formFactura.monto),
        fechaVencimiento: fechaVenc
      }, companyId)
      
      await loadData()
      setShowModalFactura(false)
      setFormFactura({
        proveedorId: '',
        numero: '',
        fecha: new Date().toISOString().split('T')[0],
        fechaVencimiento: '',
        monto: '',
        descripcion: '',
        estado: 'pendiente'
      })
    } catch (error) {
      console.error('Error al guardar factura:', error)
      alert('Error al guardar la factura')
    }
  }

  const calcularFechaVencimiento = (fecha, dias) => {
    const fechaBase = new Date(fecha)
    fechaBase.setDate(fechaBase.getDate() + dias)
    return fechaBase.toISOString().split('T')[0]
  }

  const calcularDiasVencido = (fechaVencimiento) => {
    if (!fechaVencimiento) return 0
    const hoy = new Date()
    const vencimiento = new Date(fechaVencimiento)
    const dias = Math.floor((hoy - vencimiento) / (1000 * 60 * 60 * 24))
    return Math.max(0, dias)
  }

  const facturasConInfo = facturas.map(factura => {
    const proveedor = proveedores.find(p => p.id === factura.proveedorId)
    const diasVencido = calcularDiasVencido(factura.fechaVencimiento)
    
    return {
      ...factura,
      proveedorNombre: proveedor?.nombre || 'Proveedor desconocido',
      diasVencido,
      estadoCalculado: factura.estado === 'pagado' ? 'pagado' : diasVencido > 0 ? 'vencido' : 'pendiente'
    }
  })

  // Incluir asientos contables que afecten Cuentas por Pagar
  const facturasDesdeAsientos = asientos
    .filter(a => a.cuenta?.toLowerCase().includes('cuentas por pagar'))
    .map(a => {
      // Si la cuenta por pagar está en HABER, el saldo es haber - debe
      const saldo = (a.haber || 0) - (a.debe || 0)
      const diasVencido = calcularDiasVencido(a.fecha)
      const estadoCalc = saldo <= 0 ? 'pagado' : diasVencido > 0 ? 'vencido' : 'pendiente'
      return {
        id: `asiento-${a.id}`,
        proveedorId: '',
        proveedorNombre: a.descripcion || 'Proveedor',
        numero: a.referencia || a.id,
        fecha: a.fecha,
        fechaVencimiento: a.fecha,
        monto: Math.abs(saldo),
        descripcion: a.descripcion || '',
        estado: estadoCalc,
        diasVencido,
        estadoCalculado: estadoCalc
      }
    })

  const filteredFacturas = facturasConInfo.filter(factura => {
    const matchesSearch = 
      factura.proveedorNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filtroEstado === 'todos') return matchesSearch
    return matchesSearch && factura.estadoCalculado === filtroEstado
  })

  const totalPendiente = filteredFacturas.filter(f => f.estadoCalculado === 'pendiente').reduce((sum, f) => sum + (f.monto || 0), 0)
  const totalVencido = filteredFacturas.filter(f => f.estadoCalculado === 'vencido').reduce((sum, f) => sum + (f.monto || 0), 0)
  const totalPagado = filteredFacturas.filter(f => f.estadoCalculado === 'pagado').reduce((sum, f) => sum + (f.monto || 0), 0)

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
            Cuentas por Pagar
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de facturas de proveedores y pagos pendientes
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pendiente</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPendiente)}</p>
            </div>
            <AlertCircle size={24} className="text-yellow-600" />
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
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pagado</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPagado)}</p>
            </div>
            <CheckCircle size={24} className="text-green-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por proveedor, número o descripción..."
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
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
          <option value="pagado">Pagado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-background)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Proveedor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Número</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Vencimiento</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Monto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Días</th>
              </tr>
            </thead>
            <tbody>
              {filteredFacturas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No hay facturas registradas
                  </td>
                </tr>
              ) : (
                filteredFacturas.map((factura) => (
                  <tr key={factura.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {factura.proveedorNombre}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {factura.numero}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(factura.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(factura.fechaVencimiento)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(factura.monto || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        factura.estadoCalculado === 'pagado'
                          ? 'bg-green-100 text-green-800'
                          : factura.estadoCalculado === 'vencido'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {factura.estadoCalculado === 'pagado' ? 'Pagado' : factura.estadoCalculado === 'vencido' ? 'Vencido' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {factura.diasVencido > 0 ? `${factura.diasVencido} días` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Proveedor */}
      {showModalProveedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold">Nuevo Proveedor</h2>
              <button onClick={() => setShowModalProveedor(false)} className="text-white hover:text-gray-200">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formProveedor.nombre}
                  onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">RUC</label>
                  <input
                    type="text"
                    value={formProveedor.ruc}
                    onChange={(e) => setFormProveedor({ ...formProveedor, ruc: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formProveedor.telefono}
                    onChange={(e) => setFormProveedor({ ...formProveedor, telefono: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formProveedor.email}
                  onChange={(e) => setFormProveedor({ ...formProveedor, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input
                  type="text"
                  value={formProveedor.direccion}
                  onChange={(e) => setFormProveedor({ ...formProveedor, direccion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowModalProveedor(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={handleGuardarProveedor} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Factura */}
      {showModalFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold">Nueva Factura</h2>
              <button onClick={() => setShowModalFactura(false)} className="text-white hover:text-gray-200">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Proveedor *</label>
                <select
                  value={formFactura.proveedorId}
                  onChange={(e) => setFormFactura({ ...formFactura, proveedorId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Número *</label>
                  <input
                    type="text"
                    value={formFactura.numero}
                    onChange={(e) => setFormFactura({ ...formFactura, numero: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monto *</label>
                  <input
                    type="number"
                    value={formFactura.monto}
                    onChange={(e) => setFormFactura({ ...formFactura, monto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={formFactura.fecha}
                    onChange={(e) => setFormFactura({ ...formFactura, fecha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vencimiento</label>
                  <input
                    type="date"
                    value={formFactura.fechaVencimiento}
                    onChange={(e) => setFormFactura({ ...formFactura, fechaVencimiento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={formFactura.descripcion}
                  onChange={(e) => setFormFactura({ ...formFactura, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowModalFactura(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={handleGuardarFactura} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CuentasPorPagar

