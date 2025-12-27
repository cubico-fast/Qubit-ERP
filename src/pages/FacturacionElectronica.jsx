import { useState, useEffect } from 'react'
import { Receipt, Search, Download, FileText, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const FacturacionElectronica = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const ventasData = await getVentas(companyId)
      setVentas(ventasData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar solo facturas electrónicas (FACTURA, BOLETA)
  const facturas = ventas.filter(v => {
    const tipo = v.tipoComprobante?.toUpperCase() || ''
    return tipo.includes('FACTURA') || tipo.includes('BOLETA') || tipo === 'FE' || tipo === 'BE'
  })

  const filteredFacturas = facturas.filter(factura => {
    const matchesSearch = 
      factura.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.tipoComprobante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.vendedor?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filtroEstado === 'todos') return matchesSearch
    return matchesSearch && factura.estado === filtroEstado
  })

  const totalFacturado = filteredFacturas.filter(f => f.estado === 'Completada').reduce((sum, f) => sum + (f.total || 0), 0)
  const totalFacturas = filteredFacturas.length
  const facturasEmitidas = filteredFacturas.filter(f => f.estado === 'Completada').length
  const facturasAnuladas = filteredFacturas.filter(f => f.estado === 'Anulada').length

  const handleVerDetalle = (venta) => {
    setVentaSeleccionada(venta)
    setShowDetalleModal(true)
  }

  const handleDescargarPDF = (venta) => {
    // Simular descarga de PDF
    alert(`Descargando ${venta.tipoComprobante || 'Factura'} ${venta.id}`)
  }

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
            Facturación Electrónica
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de facturas y boletas electrónicas emitidas
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Facturado</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalFacturado)}</p>
            </div>
            <Receipt size={24} className="text-green-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Facturas</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{totalFacturas}</p>
            </div>
            <FileText size={24} className="text-primary-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Emitidas</p>
              <p className="text-2xl font-bold text-blue-600">{facturasEmitidas}</p>
            </div>
            <CheckCircle size={24} className="text-blue-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Anuladas</p>
              <p className="text-2xl font-bold text-red-600">{facturasAnuladas}</p>
            </div>
            <XCircle size={24} className="text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente, comprobante o número..."
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
          <option value="Completada">Emitidas</option>
          <option value="Anulada">Anuladas</option>
          <option value="Pendiente">Pendientes</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-background)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Comprobante</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Vendedor</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Base Imponible</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>IGV</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
                <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredFacturas.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No hay facturas electrónicas registradas
                  </td>
                </tr>
              ) : (
                filteredFacturas.map((factura) => (
                  <tr key={factura.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(factura.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {factura.tipoComprobante || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {factura.cliente || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {factura.vendedor || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(factura.baseImponible || factura.subtotal || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">
                      {formatCurrency(factura.impuesto || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(factura.total || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        factura.estado === 'Completada'
                          ? 'bg-green-100 text-green-800'
                          : factura.estado === 'Anulada'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {factura.estado || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleVerDetalle(factura)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver detalle"
                        >
                          <FileText size={16} />
                        </button>
                        {factura.estado === 'Completada' && (
                          <button
                            onClick={() => handleDescargarPDF(factura)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Descargar PDF"
                          >
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle */}
      {showDetalleModal && ventaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold">Detalle de Factura</h2>
              <button onClick={() => setShowDetalleModal(false)} className="text-white hover:text-gray-200">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Comprobante</p>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{ventaSeleccionada.tipoComprobante}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Fecha</p>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatDate(ventaSeleccionada.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cliente</p>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{ventaSeleccionada.cliente || '-'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Vendedor</p>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{ventaSeleccionada.vendedor || '-'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Productos</h3>
                <div className="space-y-2">
                  {ventaSeleccionada.productos?.map((producto, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-text)' }}>
                        {producto.cantidad}x {producto.nombre}
                      </span>
                      <span style={{ color: 'var(--color-text)' }}>
                        {formatCurrency(producto.subtotal || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal:</span>
                  <span style={{ color: 'var(--color-text)' }}>{formatCurrency(ventaSeleccionada.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>IGV:</span>
                  <span style={{ color: 'var(--color-text)' }}>{formatCurrency(ventaSeleccionada.impuesto || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span style={{ color: 'var(--color-text)' }}>Total:</span>
                  <span style={{ color: 'var(--color-text)' }}>{formatCurrency(ventaSeleccionada.total || 0)}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setShowDetalleModal(false)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacturacionElectronica

