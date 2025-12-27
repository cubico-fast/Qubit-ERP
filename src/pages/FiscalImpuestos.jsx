import { useState, useEffect } from 'react'
import { Receipt, Search, Calendar, DollarSign, FileText, TrendingUp, TrendingDown, Download, Calculator, BookOpen, FileCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas, getAsientosContables, getFacturasProveedores } from '../utils/firebaseUtils'
import { formatDate, getLastMonths } from '../utils/dateUtils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  calcularIGV,
  calcularPDT621,
  calcularPagoCuentaRentaMensual,
  calcularImpuestoRentaAnual,
  generarRegistroVentas,
  generarRegistroCompras,
  exportarATXT,
  descargarArchivo,
  obtenerComprasDesdeAsientos
} from '../utils/fiscalUtils'

const FiscalImpuestos = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [ventas, setVentas] = useState([])
  const [asientos, setAsientos] = useState([])
  const [facturasProveedores, setFacturasProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes')
  const [searchTerm, setSearchTerm] = useState('')
  const [tabActivo, setTabActivo] = useState('resumen') // resumen, pdt621, renta, reportes

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ventasData, asientosData, facturasData] = await Promise.all([
        getVentas(companyId),
        getAsientosContables(companyId),
        getFacturasProveedores(companyId)
      ])
      setVentas(ventasData)
      setAsientos(asientosData)
      setFacturasProveedores(facturasData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular impuestos de las ventas
  const calcularImpuestos = () => {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1)
    
    let ventasFiltradas = ventas
    
    if (filtroPeriodo === 'mes') {
      ventasFiltradas = ventas.filter(v => {
        const fechaVenta = new Date(v.fecha)
        return fechaVenta >= inicioMes
      })
    } else if (filtroPeriodo === 'anio') {
      ventasFiltradas = ventas.filter(v => {
        const fechaVenta = new Date(v.fecha)
        return fechaVenta >= inicioAnio
      })
    }
    
    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + (v.total || 0), 0)
    const totalBaseImponible = ventasFiltradas.reduce((sum, v) => sum + (v.baseImponible || v.subtotal || 0), 0)
    const totalIGV = ventasFiltradas.reduce((sum, v) => {
      // Si no tiene IGV calculado, calcularlo automáticamente
      if (v.impuesto) return sum + v.impuesto
      const base = v.baseImponible || v.subtotal || 0
      return sum + calcularIGV(base)
    }, 0)
    const totalICBPER = ventasFiltradas.reduce((sum, v) => sum + (v.icbper || 0), 0)
    const totalRetenciones = ventasFiltradas.reduce((sum, v) => sum + (v.totalRetenido || 0), 0)
    
    return {
      totalVentas,
      totalBaseImponible,
      totalIGV,
      totalICBPER,
      totalRetenciones,
      ventas: ventasFiltradas
    }
  }

  const { totalVentas, totalBaseImponible, totalIGV, totalICBPER, totalRetenciones, ventas: ventasFiltradas } = calcularImpuestos()

  // Calcular PDT 621 (IGV mensual)
  const calcularPDT621Mensual = () => {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    
    const ventasMes = ventas.filter(v => {
      const fechaVenta = new Date(v.fecha)
      return fechaVenta >= inicioMes && fechaVenta <= finMes
    })
    
    const comprasMes = obtenerComprasDesdeAsientos(asientos, inicioMes, finMes)
    
    return calcularPDT621(ventasMes, comprasMes)
  }

  const pdt621 = calcularPDT621Mensual()

  // Calcular Impuesto a la Renta mensual
  const calcularRentaMensual = () => {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    
    const ventasMes = ventas.filter(v => {
      const fechaVenta = new Date(v.fecha)
      return fechaVenta >= inicioMes && fechaVenta <= finMes
    })
    
    const totalVentasMes = ventasMes.reduce((sum, v) => sum + (v.total || 0), 0)
    return calcularPagoCuentaRentaMensual(totalVentasMes)
  }

  const pagoCuentaMensual = calcularRentaMensual()

  // Calcular Impuesto a la Renta anual
  const calcularRentaAnual = () => {
    const hoy = new Date()
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1)
    const finAnio = new Date(hoy.getFullYear(), 11, 31)
    
    const ventasAnio = ventas.filter(v => {
      const fechaVenta = new Date(v.fecha)
      return fechaVenta >= inicioAnio && fechaVenta <= finAnio
    })
    
    const ingresos = ventasAnio.reduce((sum, v) => sum + (v.total || 0), 0)
    
    // Calcular gastos deducibles desde asientos contables
    const gastosDeducibles = asientos
      .filter(a => {
        const fecha = new Date(a.fecha)
        return fecha >= inicioAnio && fecha <= finAnio && 
               (a.cuenta?.includes('Gastos') || a.cuenta?.includes('Costo'))
      })
      .reduce((sum, a) => sum + (a.debe || 0), 0)
    
    // Calcular pagos mensuales realizados
    const pagosMensuales = ventasAnio.reduce((sum, v) => {
      const fechaVenta = new Date(v.fecha)
      const mes = fechaVenta.getMonth()
      const ventasMes = ventasAnio.filter(v2 => {
        const fechaVenta2 = new Date(v2.fecha)
        return fechaVenta2.getMonth() === mes
      })
      const totalVentasMes = ventasMes.reduce((s, v2) => s + (v2.total || 0), 0)
      return sum + calcularPagoCuentaRentaMensual(totalVentasMes)
    }, 0) / 12 // Promedio mensual
    
    return calcularImpuestoRentaAnual(ingresos, gastosDeducibles, pagosMensuales)
  }

  const rentaAnual = calcularRentaAnual()

  // Funciones para exportar reportes SUNAT
  const exportarRegistroVentas = () => {
    const registroVentas = generarRegistroVentas(ventasFiltradas)
    const contenido = exportarATXT(registroVentas, 'ventas')
    const fecha = new Date().toISOString().split('T')[0]
    descargarArchivo(contenido, `Registro_Ventas_${fecha}.txt`)
  }

  const exportarRegistroCompras = () => {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    const comprasMes = obtenerComprasDesdeAsientos(asientos, inicioMes, finMes)
    const registroCompras = generarRegistroCompras(comprasMes)
    const contenido = exportarATXT(registroCompras, 'compras')
    const fecha = new Date().toISOString().split('T')[0]
    descargarArchivo(contenido, `Registro_Compras_${fecha}.txt`)
  }

  // Datos para gráfico mensual
  const datosMensuales = getLastMonths(6).map(mes => {
    const ventasMes = ventas.filter(v => {
      const fecha = new Date(v.fecha)
      return fecha.getMonth() === mes.mes - 1 && fecha.getFullYear() === mes.año
    })
    
    return {
      mes: mes.nombre,
      baseImponible: ventasMes.reduce((sum, v) => sum + (v.baseImponible || v.subtotal || 0), 0),
      igv: ventasMes.reduce((sum, v) => sum + (v.impuesto || 0), 0),
      icbper: ventasMes.reduce((sum, v) => sum + (v.icbper || 0), 0)
    }
  })

  const filteredVentas = ventasFiltradas.filter(venta => {
    const searchLower = searchTerm.toLowerCase()
    return (
      venta.cliente?.toLowerCase().includes(searchLower) ||
      venta.tipoComprobante?.toLowerCase().includes(searchLower) ||
      venta.id?.toLowerCase().includes(searchLower)
    )
  })

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
            Fiscal / Impuestos
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de impuestos indirectos y directos, retenciones y declaraciones - Perú
          </p>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setTabActivo('resumen')}
          className={`px-4 py-2 font-medium transition-colors ${
            tabActivo === 'resumen'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{ color: tabActivo === 'resumen' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
        >
          Resumen
        </button>
        <button
          onClick={() => setTabActivo('pdt621')}
          className={`px-4 py-2 font-medium transition-colors ${
            tabActivo === 'pdt621'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{ color: tabActivo === 'pdt621' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
        >
          PDT 621 (IGV)
        </button>
        <button
          onClick={() => setTabActivo('renta')}
          className={`px-4 py-2 font-medium transition-colors ${
            tabActivo === 'renta'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{ color: tabActivo === 'renta' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
        >
          Impuesto a la Renta
        </button>
        <button
          onClick={() => setTabActivo('reportes')}
          className={`px-4 py-2 font-medium transition-colors ${
            tabActivo === 'reportes'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{ color: tabActivo === 'reportes' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
        >
          Reportes SUNAT
        </button>
      </div>

      {/* Contenido según tab activo */}
      {tabActivo === 'resumen' && (
        <>
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
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="px-4 py-2 border rounded-lg"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <option value="todos">Todos los períodos</option>
              <option value="mes">Este mes</option>
              <option value="anio">Este año</option>
            </select>
          </div>

          {/* Resumen de Impuestos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Ventas</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{formatCurrency(totalVentas)}</p>
            </div>
            <TrendingUp size={20} className="text-primary-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Base Imponible</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{formatCurrency(totalBaseImponible)}</p>
            </div>
            <DollarSign size={20} className="text-blue-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>IGV (18%)</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(totalIGV)}</p>
            </div>
            <Receipt size={20} className="text-orange-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>ICBPER</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(totalICBPER)}</p>
            </div>
            <FileText size={20} className="text-purple-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Retenciones</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalRetenciones)}</p>
            </div>
            <TrendingDown size={20} className="text-red-600" />
          </div>
        </div>
      </div>

      {/* Gráfico de impuestos mensuales */}
      <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Impuestos por Mes
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={datosMensuales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="baseImponible" fill="#3b82f6" name="Base Imponible" />
            <Bar dataKey="igv" fill="#f97316" name="IGV" />
            <Bar dataKey="icbper" fill="#a855f7" name="ICBPER" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla de ventas con impuestos */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="px-6 py-4 border-b" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
            Detalle de Ventas e Impuestos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-background)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Comprobante</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Base Imponible</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>IGV</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>ICBPER</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No hay ventas registradas
                  </td>
                </tr>
              ) : (
                filteredVentas.map((venta) => (
                  <tr key={venta.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(venta.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {venta.cliente || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {venta.tipoComprobante || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(venta.baseImponible || venta.subtotal || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">
                      {formatCurrency(venta.impuesto || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-purple-600">
                      {formatCurrency(venta.icbper || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(venta.total || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>)}

      {/* Tab PDT 621 */}
      {tabActivo === 'pdt621' && (
        <div className="space-y-6">
          <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                PDT 621 - Declaración Mensual de IGV
              </h2>
              <FileCheck className="text-primary-600" size={24} />
            </div>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Resumen del IGV del mes actual para la declaración PDT 621 ante SUNAT
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>IGV por Ventas (Débito Fiscal)</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Base Imponible:</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(pdt621.baseImponibleVentas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>IGV (18%):</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(pdt621.igvVentas)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Total Ventas:</span>
                    <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>{formatCurrency(pdt621.totalVentas)}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>IGV Crédito Fiscal (Compras)</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Base Imponible:</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(pdt621.baseImponibleCompras)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>IGV Crédito Fiscal:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(pdt621.igvCreditoFiscal)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Total Compras:</span>
                    <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>{formatCurrency(pdt621.totalCompras)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800 mb-1">IGV a Pagar al Estado</p>
                  <p className="text-3xl font-bold text-orange-900">{formatCurrency(pdt621.igvAPagar)}</p>
                  <p className="text-xs text-orange-700 mt-2">
                    Cálculo: IGV Ventas ({formatCurrency(pdt621.igvVentas)}) - IGV Crédito Fiscal ({formatCurrency(pdt621.igvCreditoFiscal)})
                  </p>
                </div>
                <Calculator className="text-orange-600" size={48} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Impuesto a la Renta */}
      {tabActivo === 'renta' && (
        <div className="space-y-6">
          {/* Pago a Cuenta Mensual */}
          <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                Pago a Cuenta Mensual (1.5%)
              </h2>
              <Calendar className="text-primary-600" size={24} />
            </div>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Coeficiente SUNAT: 1.5% sobre las ventas del mes
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">Pago a Cuenta del Mes</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(pagoCuentaMensual)}</p>
                </div>
                <DollarSign className="text-blue-600" size={32} />
              </div>
            </div>
          </div>

          {/* Impuesto a la Renta Anual */}
          <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                Impuesto a la Renta Anual (29.5%)
              </h2>
              <Calculator className="text-primary-600" size={24} />
            </div>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Cálculo del Impuesto a la Renta anual basado en ingresos y gastos deducibles
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Ingresos y Gastos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Ingresos Totales:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(rentaAnual.ingresos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Gastos Deducibles:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(rentaAnual.gastosDeducibles)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Utilidad:</span>
                    <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>{formatCurrency(rentaAnual.utilidad)}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Cálculo del Impuesto</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Impuesto Calculado (29.5%):</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{formatCurrency(rentaAnual.impuestoCalculado)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Pagos Mensuales:</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(rentaAnual.pagosMensuales)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Impuesto a Pagar:</span>
                    <span className="font-bold text-lg text-orange-600">{formatCurrency(rentaAnual.impuestoAPagar)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Reportes SUNAT */}
      {tabActivo === 'reportes' && (
        <div className="space-y-6">
          <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Libros Electrónicos SUNAT
              </h2>
              <BookOpen className="text-primary-600" size={24} />
            </div>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Genera y exporta los libros electrónicos requeridos por SUNAT en formato TXT (PLE)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registro de Ventas */}
              <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Receipt className="text-blue-600" size={24} />
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    Registro de Ventas (RVIE)
                  </h3>
                </div>
                <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Exporta el registro de ventas con IGV calculado automáticamente
                </p>
                <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Resumen:</p>
                  <ul className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Total de ventas: {ventasFiltradas.length}</li>
                    <li>• Base imponible: {formatCurrency(totalBaseImponible)}</li>
                    <li>• IGV total: {formatCurrency(totalIGV)}</li>
                  </ul>
                </div>
                <button
                  onClick={exportarRegistroVentas}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={20} />
                  Exportar Registro de Ventas (TXT)
                </button>
              </div>

              {/* Registro de Compras */}
              <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="text-green-600" size={24} />
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    Registro de Compras (RCE)
                  </h3>
                </div>
                <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Exporta el registro de compras con IGV crédito fiscal
                </p>
                <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Resumen:</p>
                  <ul className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <li>• Base imponible compras: {formatCurrency(pdt621.baseImponibleCompras)}</li>
                    <li>• IGV crédito fiscal: {formatCurrency(pdt621.igvCreditoFiscal)}</li>
                    <li>• Total compras: {formatCurrency(pdt621.totalCompras)}</li>
                  </ul>
                </div>
                <button
                  onClick={exportarRegistroCompras}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={20} />
                  Exportar Registro de Compras (TXT)
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Los archivos generados están en formato TXT compatible con el PLE (Programa de Libros Electrónicos) de SUNAT. 
                Asegúrate de validar los datos antes de presentarlos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FiscalImpuestos

