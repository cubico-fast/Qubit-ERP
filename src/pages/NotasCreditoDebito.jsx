import { useState, useEffect } from 'react'
import { FileCheck, Search, Plus, ArrowUp, ArrowDown, Calendar, X, Receipt } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { 
  getNotasCreditoDebito, 
  saveNotaCreditoDebito, 
  getVentas,
  saveAsientoContable 
} from '../utils/firebaseUtils'
import { formatDate, getCurrentDateSync } from '../utils/dateUtils'
import { calcularIGV } from '../utils/fiscalUtils'

const NotasCreditoDebito = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [notas, setNotas] = useState([])
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'credito', // 'credito' o 'debito'
    facturaId: '',
    fecha: getCurrentDateSync(),
    motivo: '',
    baseImponible: '',
    igv: 0,
    total: 0
  })
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [notasData, ventasData] = await Promise.all([
        getNotasCreditoDebito(companyId),
        getVentas(companyId)
      ])
      setNotas(notasData)
      
      // Filtrar solo facturas completadas (no anuladas) para poder crear notas
      const facturasValidas = ventasData.filter(v => {
        const tipo = v.tipoComprobante?.toUpperCase() || ''
        return (tipo.includes('FACTURA') || tipo.includes('BOLETA') || tipo === 'FE' || tipo === 'BE') 
          && v.estado === 'Completada'
      })
      setVentas(facturasValidas)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular IGV y total cuando cambia la base imponible
  useEffect(() => {
    if (formData.baseImponible) {
      const base = parseFloat(formData.baseImponible) || 0
      const igv = calcularIGV(base)
      const total = base + igv
      setFormData(prev => ({
        ...prev,
        igv,
        total
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        igv: 0,
        total: 0
      }))
    }
  }, [formData.baseImponible])

  // Cuando se selecciona una factura, cargar sus datos
  const handleSeleccionarFactura = (facturaId) => {
    const factura = ventas.find(v => v.id === facturaId)
    if (factura) {
      setFacturaSeleccionada(factura)
      setFormData(prev => ({
        ...prev,
        facturaId: facturaId,
        cliente: factura.cliente || '',
        clienteId: factura.clienteId || ''
      }))
    }
  }

  const handleGuardarNota = async () => {
    try {
      if (!formData.facturaId) {
        alert('Por favor selecciona una factura original')
        return
      }
      if (!formData.motivo) {
        alert('Por favor ingresa el motivo de la nota')
        return
      }
      if (!formData.baseImponible || parseFloat(formData.baseImponible) <= 0) {
        alert('Por favor ingresa un monto válido')
        return
      }

      const baseImponible = parseFloat(formData.baseImponible)
      const igv = calcularIGV(baseImponible)
      const total = baseImponible + igv

      // Crear la nota
      const notaData = {
        tipo: formData.tipo, // 'credito' o 'debito'
        facturaId: formData.facturaId,
        facturaNumero: facturaSeleccionada?.tipoComprobante || '',
        fecha: formData.fecha,
        motivo: formData.motivo,
        cliente: facturaSeleccionada?.cliente || '',
        clienteId: facturaSeleccionada?.clienteId || '',
        baseImponible,
        igv,
        total,
        moneda: facturaSeleccionada?.moneda || 'PEN',
        estado: 'Emitida'
      }

      // Generar número de comprobante
      const tipoComprobante = formData.tipo === 'credito' ? 'NC' : 'ND'
      const numeroNota = `${tipoComprobante}01-${String(notas.length + 1).padStart(8, '0')}`
      notaData.numeroComprobante = numeroNota
      notaData.tipoComprobante = numeroNota

      // Guardar la nota
      const notaGuardada = await saveNotaCreditoDebito(notaData, companyId)

      // Generar asientos contables automáticos
      await generarAsientosContables(notaGuardada, facturaSeleccionada)

      alert(`✅ Nota de ${formData.tipo === 'credito' ? 'Crédito' : 'Débito'} guardada exitosamente`)
      
      // Limpiar formulario y cerrar modal
      setFormData({
        tipo: 'credito',
        facturaId: '',
        fecha: getCurrentDateSync(),
        motivo: '',
        baseImponible: '',
        igv: 0,
        total: 0
      })
      setFacturaSeleccionada(null)
      setShowModal(false)
      
      // Recargar datos
      await loadData()
    } catch (error) {
      console.error('Error al guardar nota:', error)
      alert('Error al guardar la nota: ' + error.message)
    }
  }

  const generarAsientosContables = async (nota, facturaOriginal) => {
    try {
      const asientos = []
      const fecha = nota.fecha || new Date().toISOString().split('T')[0]
      const descripcionBase = `Nota de ${nota.tipo === 'credito' ? 'Crédito' : 'Débito'} ${nota.numeroComprobante} - ${nota.cliente || 'Cliente'}`

      if (nota.tipo === 'credito') {
        // NOTA DE CRÉDITO: Reduce o anula una factura
        // Asiento 1: Debe - Ventas (reduce ingresos)
        asientos.push({
          fecha,
          descripcion: `${descripcionBase} - Reducción de Ventas`,
          tipo: 'automatico',
          cuenta: '701 - Ventas',
          debe: nota.baseImponible,
          haber: 0,
          referencia: nota.id || '',
          origen: 'nota_credito'
        })

        // Asiento 2: Debe - IGV por pagar (reduce pasivo)
        if (nota.igv > 0) {
          asientos.push({
            fecha,
            descripcion: `${descripcionBase} - Reducción de IGV`,
            tipo: 'automatico',
            cuenta: '4011 - IGV',
            debe: nota.igv,
            haber: 0,
            referencia: nota.id || '',
            origen: 'nota_credito'
          })
        }

        // Asiento 3: Haber - Cuentas por Cobrar (reduce activo)
        asientos.push({
          fecha,
          descripcion: `${descripcionBase} - Reducción de Cuentas por Cobrar`,
          tipo: 'automatico',
          cuenta: '121 - Cuentas por Cobrar',
          debe: 0,
          haber: nota.total,
          referencia: nota.id || '',
          origen: 'nota_credito'
        })
      } else {
        // NOTA DE DÉBITO: Aumenta el monto de una factura
        // Asiento 1: Debe - Cuentas por Cobrar (aumenta activo)
        asientos.push({
          fecha,
          descripcion: `${descripcionBase} - Aumento de Cuentas por Cobrar`,
          tipo: 'automatico',
          cuenta: '121 - Cuentas por Cobrar',
          debe: nota.total,
          haber: 0,
          referencia: nota.id || '',
          origen: 'nota_debito'
        })

        // Asiento 2: Haber - Ingresos varios (aumenta ingresos)
        asientos.push({
          fecha,
          descripcion: `${descripcionBase} - Ingresos Adicionales`,
          tipo: 'automatico',
          cuenta: '701 - Ventas',
          debe: 0,
          haber: nota.baseImponible,
          referencia: nota.id || '',
          origen: 'nota_debito'
        })

        // Asiento 3: Haber - IGV por pagar (aumenta pasivo)
        if (nota.igv > 0) {
          asientos.push({
            fecha,
            descripcion: `${descripcionBase} - Aumento de IGV`,
            tipo: 'automatico',
            cuenta: '4011 - IGV',
            debe: 0,
            haber: nota.igv,
            referencia: nota.id || '',
            origen: 'nota_debito'
          })
        }
      }

      // Guardar todos los asientos
      for (const asiento of asientos) {
        await saveAsientoContable(asiento, companyId)
      }
    } catch (error) {
      console.error('Error al generar asientos contables:', error)
      throw error
    }
  }

  const filteredNotas = notas.filter(nota => {
    const matchesSearch = 
      nota.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nota.numeroComprobante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nota.facturaNumero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nota.motivo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filtroTipo === 'todos') return matchesSearch
    return matchesSearch && nota.tipo === filtroTipo
  })

  const totalCredito = filteredNotas.filter(n => n.tipo === 'credito').reduce((sum, n) => sum + (n.total || 0), 0)
  const totalDebito = filteredNotas.filter(n => n.tipo === 'debito').reduce((sum, n) => sum + (n.total || 0), 0)
  const totalNotas = filteredNotas.length

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
            Notas de Crédito y Débito
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de notas de crédito y débito emitidas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Nueva Nota
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Notas</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{totalNotas}</p>
            </div>
            <FileCheck size={24} className="text-primary-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Notas de Crédito</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCredito)}</p>
            </div>
            <ArrowDown size={24} className="text-green-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Notas de Débito</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebito)}</p>
            </div>
            <ArrowUp size={24} className="text-red-600" />
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
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-2 border rounded-lg"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <option value="todos">Todos los tipos</option>
          <option value="credito">Notas de Crédito</option>
          <option value="debito">Notas de Débito</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-background)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Comprobante</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Factura Original</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cliente</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Monto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No hay notas de crédito o débito registradas
                  </td>
                </tr>
              ) : (
                filteredNotas.map((nota) => (
                  <tr key={nota.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(nota.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        nota.tipo === 'credito'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {nota.tipo === 'credito' ? 'Crédito' : 'Débito'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {nota.numeroComprobante || nota.tipoComprobante || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {nota.facturaNumero || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {nota.cliente || '-'}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      nota.tipo === 'credito' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {nota.tipo === 'credito' ? '-' : '+'}
                      {formatCurrency(nota.total || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {nota.motivo || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear nota */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Nueva Nota de {formData.tipo === 'credito' ? 'Crédito' : 'Débito'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({
                    tipo: 'credito',
                    facturaId: '',
                    fecha: getCurrentDateSync(),
                    motivo: '',
                    baseImponible: '',
                    igv: 0,
                    total: 0
                  })
                  setFacturaSeleccionada(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo de nota */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Tipo de Nota
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="credito"
                      checked={formData.tipo === 'credito'}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                      className="w-4 h-4"
                    />
                    <span style={{ color: 'var(--color-text)' }}>Nota de Crédito (Reduce factura)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="debito"
                      checked={formData.tipo === 'debito'}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                      className="w-4 h-4"
                    />
                    <span style={{ color: 'var(--color-text)' }}>Nota de Débito (Aumenta factura)</span>
                  </label>
                </div>
              </div>

              {/* Seleccionar factura */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Factura Original *
                </label>
                <select
                  value={formData.facturaId}
                  onChange={(e) => handleSeleccionarFactura(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <option value="">Selecciona una factura</option>
                  {ventas.map((venta) => (
                    <option key={venta.id} value={venta.id}>
                      {venta.tipoComprobante || 'Factura'} - {venta.cliente || 'Cliente'} - {formatCurrency(venta.total || 0)} - {formatDate(venta.fecha)}
                    </option>
                  ))}
                </select>
                {facturaSeleccionada && (
                  <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm"><strong>Factura:</strong> {facturaSeleccionada.tipoComprobante || 'N/A'}</p>
                    <p className="text-sm"><strong>Cliente:</strong> {facturaSeleccionada.cliente || 'N/A'}</p>
                    <p className="text-sm"><strong>Total Factura:</strong> {formatCurrency(facturaSeleccionada.total || 0)}</p>
                  </div>
                )}
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Motivo *
                </label>
                <select
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <option value="">Selecciona un motivo</option>
                  {formData.tipo === 'credito' ? (
                    <>
                      <option value="Devolución de productos">Devolución de productos</option>
                      <option value="Descuento posterior">Descuento posterior</option>
                      <option value="Error en el precio">Error en el precio</option>
                      <option value="Anulación de la venta">Anulación de la venta</option>
                      <option value="Error en datos del cliente">Error en datos del cliente</option>
                    </>
                  ) : (
                    <>
                      <option value="Intereses por mora">Intereses por mora</option>
                      <option value="Cargos adicionales">Cargos adicionales</option>
                      <option value="Error por cobrar menos">Error por cobrar menos</option>
                      <option value="Penalidades">Penalidades</option>
                    </>
                  )}
                </select>
              </div>

              {/* Base imponible */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Base Imponible (sin IGV) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.baseImponible}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseImponible: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                />
              </div>

              {/* Resumen de cálculos */}
              {formData.baseImponible && parseFloat(formData.baseImponible) > 0 && (
                <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Base Imponible:</span>
                    <span style={{ color: 'var(--color-text)' }}>{formatCurrency(parseFloat(formData.baseImponible) || 0)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: 'var(--color-text-secondary)' }}>IGV (18%):</span>
                    <span style={{ color: 'var(--color-text)' }}>{formatCurrency(formData.igv)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text)' }}>Total:</span>
                    <span className={formData.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}>
                      {formData.tipo === 'credito' ? '-' : '+'}{formatCurrency(formData.total)}
                    </span>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleGuardarNota}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Guardar Nota
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setFormData({
                      tipo: 'credito',
                      facturaId: '',
                      fecha: getCurrentDateSync(),
                      motivo: '',
                      baseImponible: '',
                      igv: 0,
                      total: 0
                    })
                    setFacturaSeleccionada(null)
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotasCreditoDebito
