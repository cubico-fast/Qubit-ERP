import { useState, useEffect } from 'react'
import { FileCheck, Plus, Search, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getVentas, getAsientosContables, saveAsientoContable } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const ContabilidadGeneral = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [asientos, setAsientos] = useState([])
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('todos')
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    tipoOperacion: 'manual', // manual, venta, compra
    tipo: 'manual',
    debe: '',
    haber: '',
    cuenta: '',
    referencia: '',
    // Campos para Venta
    ventaCliente: '',
    ventaMonto: '',
    ventaImpuesto: '',
    // Campos para Compra
    compraProveedor: '',
    compraMonto: '',
    compraImpuesto: ''
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [asientosData, ventasData] = await Promise.all([
        getAsientosContables(companyId),
        getVentas(companyId)
      ])
      
      setAsientos(asientosData)
      setVentas(ventasData)
      
      // Generar asientos automáticos desde ventas si no existen
      if (asientosData.length === 0 && ventasData.length > 0) {
        await generarAsientosDesdeVentas(ventasData)
        const nuevosAsientos = await getAsientosContables(companyId)
        setAsientos(nuevosAsientos)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const generarAsientosDesdeVentas = async (ventasData) => {
    const asientosGenerados = []
    
    for (const venta of ventasData) {
      if (venta.total && venta.fecha) {
        // Asiento: Debe - Cuentas por Cobrar, Haber - Ventas
        const asientoVenta = {
          fecha: venta.fecha,
          descripcion: `Venta ${venta.tipoComprobante || 'Factura'} - ${venta.cliente || 'Cliente'}`,
          tipo: 'automatico',
          cuenta: '121 - Cuentas por Cobrar',
          debe: venta.total,
          haber: 0,
          referencia: venta.id || '',
          origen: 'venta'
        }
        
        const asientoIngreso = {
          fecha: venta.fecha,
          descripcion: `Ingreso por Venta - ${venta.cliente || 'Cliente'}`,
          tipo: 'automatico',
          cuenta: '701 - Ventas',
          debe: 0,
          haber: venta.subtotal || venta.total,
          referencia: venta.id || '',
          origen: 'venta'
        }
        
        if (venta.impuesto && venta.impuesto > 0) {
          const asientoImpuesto = {
            fecha: venta.fecha,
            descripcion: `IGV por Venta`,
            tipo: 'automatico',
            cuenta: '4011 - IGV',
            debe: 0,
            haber: venta.impuesto,
            referencia: venta.id || '',
            origen: 'venta'
          }
          asientosGenerados.push(asientoImpuesto)
        }
        
        asientosGenerados.push(asientoVenta, asientoIngreso)
      }
    }
    
    // Guardar asientos generados
    for (const asiento of asientosGenerados) {
      try {
        await saveAsientoContable(asiento, companyId)
      } catch (error) {
        console.error('Error al guardar asiento:', error)
      }
    }
  }

  const handleGuardar = async () => {
    try {
      let asientosAGuardar = []
      
      if (formData.tipoOperacion === 'venta') {
        // Lógica de VENTA según activos/pasivos
        const monto = parseFloat(formData.ventaMonto) || 0
        const impuesto = parseFloat(formData.ventaImpuesto) || 0
        const subtotal = monto - impuesto
        
        if (!formData.ventaCliente || monto === 0) {
          alert('Por favor completa el cliente y el monto de la venta')
          return
        }
        
        // VENTA: Activo aumenta (Cuentas por Cobrar) → DEBE
        // VENTA: Ingreso aumenta (Ventas) → HABER
        asientosAGuardar = [
          {
            fecha: formData.fecha,
            descripcion: `Venta a ${formData.ventaCliente}`,
            tipo: 'manual',
            cuenta: '121 - Cuentas por Cobrar', // Activo aumenta → DEBE
            debe: monto,
            haber: 0,
            referencia: formData.referencia || '',
            origen: 'venta_manual'
          },
          {
            fecha: formData.fecha,
            descripcion: `Ingreso por Venta - ${formData.ventaCliente}`,
            tipo: 'manual',
            cuenta: '701 - Ventas', // Ingreso aumenta → HABER
            debe: 0,
            haber: subtotal,
            referencia: formData.referencia || '',
            origen: 'venta_manual'
          }
        ]
        
        // Si hay impuesto (IGV)
        if (impuesto > 0) {
          asientosAGuardar.push({
            fecha: formData.fecha,
            descripcion: `IGV por Venta`,
            tipo: 'manual',
            cuenta: '4011 - IGV', // Pasivo aumenta → HABER
            debe: 0,
            haber: impuesto,
            referencia: formData.referencia || '',
            origen: 'venta_manual'
          })
        }
        
      } else if (formData.tipoOperacion === 'compra') {
        // Lógica de COMPRA según activos/pasivos
        const monto = parseFloat(formData.compraMonto) || 0
        const impuesto = parseFloat(formData.compraImpuesto) || 0
        const subtotal = monto - impuesto
        
        if (!formData.compraProveedor || monto === 0) {
          alert('Por favor completa el proveedor y el monto de la compra')
          return
        }
        
        // COMPRA: Activo aumenta (Inventario/Mercaderías) → DEBE
        // COMPRA: Pasivo aumenta (Cuentas por Pagar) → HABER
        asientosAGuardar = [
          {
            fecha: formData.fecha,
            descripcion: `Compra a ${formData.compraProveedor}`,
            tipo: 'manual',
            cuenta: '201 - Mercaderías', // Activo aumenta → DEBE
            debe: subtotal,
            haber: 0,
            referencia: formData.referencia || '',
            origen: 'compra_manual'
          },
          {
            fecha: formData.fecha,
            descripcion: `Cuentas por Pagar - ${formData.compraProveedor}`,
            tipo: 'manual',
            cuenta: '421 - Cuentas por Pagar', // Pasivo aumenta → HABER
            debe: 0,
            haber: monto,
            referencia: formData.referencia || '',
            origen: 'compra_manual'
          }
        ]
        
        // Si hay impuesto (IGV)
        if (impuesto > 0) {
          asientosAGuardar.push({
            fecha: formData.fecha,
            descripcion: `IGV por Compra`,
            tipo: 'manual',
            cuenta: '4011 - IGV Crédito Fiscal', // Activo aumenta → DEBE
            debe: impuesto,
            haber: 0,
            referencia: formData.referencia || '',
            origen: 'compra_manual'
          })
        }
        
      } else {
        // Asiento MANUAL
        if (!formData.descripcion || !formData.cuenta) {
          alert('Por favor completa todos los campos requeridos')
          return
        }
        
        const debe = parseFloat(formData.debe) || 0
        const haber = parseFloat(formData.haber) || 0
        
        if (debe === 0 && haber === 0) {
          alert('Debe o Haber debe tener un valor mayor a 0')
          return
        }
        
        asientosAGuardar = [{
          ...formData,
          debe,
          haber
        }]
      }
      
      // Guardar todos los asientos
      for (const asiento of asientosAGuardar) {
        await saveAsientoContable(asiento, companyId)
      }
      
      await loadData()
      setShowModal(false)
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        tipoOperacion: 'manual',
        tipo: 'manual',
        debe: '',
        haber: '',
        cuenta: '',
        referencia: '',
        ventaCliente: '',
        ventaMonto: '',
        ventaImpuesto: '',
        compraProveedor: '',
        compraMonto: '',
        compraImpuesto: ''
      })
    } catch (error) {
      console.error('Error al guardar asiento:', error)
      alert('Error al guardar el asiento')
    }
  }

  const filteredAsientos = asientos.filter(asiento => {
    const matchesSearch = 
      asiento.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asiento.cuenta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asiento.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filtroFecha === 'todos') return matchesSearch
    
    const fechaAsiento = new Date(asiento.fecha)
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1)
    
    if (filtroFecha === 'mes') {
      return matchesSearch && fechaAsiento >= inicioMes
    }
    if (filtroFecha === 'anio') {
      return matchesSearch && fechaAsiento >= inicioAnio
    }
    
    return matchesSearch
  })

  const totalDebe = filteredAsientos.reduce((sum, a) => sum + (parseFloat(a.debe) || 0), 0)
  const totalHaber = filteredAsientos.reduce((sum, a) => sum + (parseFloat(a.haber) || 0), 0)
  const balance = totalDebe - totalHaber

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
            Contabilidad General
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestión de asientos contables y plan de cuentas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Asiento
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por descripción, cuenta o referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          />
        </div>
        <select
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="px-4 py-2 border rounded-lg"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <option value="todos">Todos los períodos</option>
          <option value="mes">Este mes</option>
          <option value="anio">Este año</option>
        </select>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Debe</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDebe)}</p>
            </div>
            <TrendingUp size={24} className="text-blue-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Haber</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalHaber)}</p>
            </div>
            <TrendingDown size={24} className="text-green-600" />
          </div>
        </div>
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Balance</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(balance))}
              </p>
            </div>
            <DollarSign size={24} className={balance >= 0 ? 'text-green-600' : 'text-red-600'} />
          </div>
        </div>
      </div>

      {/* Tabla de asientos */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-background)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Descripción</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Cuenta</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Debe</th>
                <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Haber</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {filteredAsientos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No hay asientos contables registrados
                  </td>
                </tr>
              ) : (
                filteredAsientos.map((asiento) => (
                  <tr key={asiento.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {formatDate(asiento.fecha)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {asiento.descripcion}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {asiento.cuenta || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-blue-600">
                      {asiento.debe > 0 ? formatCurrency(asiento.debe) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      {asiento.haber > 0 ? formatCurrency(asiento.haber) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        asiento.tipo === 'automatico' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {asiento.tipo === 'automatico' ? 'Automático' : 'Manual'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para nuevo asiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8">
            <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold">Nuevo Asiento Contable</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({
                    fecha: new Date().toISOString().split('T')[0],
                    descripcion: '',
                    tipoOperacion: 'manual',
                    tipo: 'manual',
                    debe: '',
                    haber: '',
                    cuenta: '',
                    referencia: '',
                    ventaCliente: '',
                    ventaMonto: '',
                    ventaImpuesto: '',
                    compraProveedor: '',
                    compraMonto: '',
                    compraImpuesto: ''
                  })
                }}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto" style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}>
              {/* Tipo de Operación */}
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Operación *</label>
                <select
                  value={formData.tipoOperacion}
                  onChange={(e) => setFormData({ ...formData, tipoOperacion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="manual">Manual</option>
                  <option value="venta">Venta</option>
                  <option value="compra">Compra</option>
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {formData.tipoOperacion === 'venta' && 'Se generarán asientos automáticos: DEBE (Cuentas por Cobrar) y HABER (Ventas)'}
                  {formData.tipoOperacion === 'compra' && 'Se generarán asientos automáticos: DEBE (Mercaderías) y HABER (Cuentas por Pagar)'}
                  {formData.tipoOperacion === 'manual' && 'Ingresa los asientos manualmente'}
                </p>
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

              {/* Campos según tipo de operación */}
              {formData.tipoOperacion === 'venta' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cliente *</label>
                    <input
                      type="text"
                      value={formData.ventaCliente}
                      onChange={(e) => setFormData({ ...formData, ventaCliente: e.target.value })}
                      placeholder="Nombre del cliente"
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Monto Total *</label>
                      <input
                        type="number"
                        value={formData.ventaMonto}
                        onChange={(e) => setFormData({ ...formData, ventaMonto: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">IGV (18%)</label>
                      <input
                        type="number"
                        value={formData.ventaImpuesto}
                        onChange={(e) => setFormData({ ...formData, ventaImpuesto: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        step="0.01"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Asientos que se crearán:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• DEBE: 121 - Cuentas por Cobrar (Activo aumenta)</li>
                      <li>• HABER: 701 - Ventas (Ingreso aumenta)</li>
                      {formData.ventaImpuesto && parseFloat(formData.ventaImpuesto) > 0 && (
                        <li>• HABER: 4011 - IGV (Pasivo aumenta)</li>
                      )}
                    </ul>
                  </div>
                </>
              )}

              {formData.tipoOperacion === 'compra' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Proveedor *</label>
                    <input
                      type="text"
                      value={formData.compraProveedor}
                      onChange={(e) => setFormData({ ...formData, compraProveedor: e.target.value })}
                      placeholder="Nombre del proveedor"
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Monto Total *</label>
                      <input
                        type="number"
                        value={formData.compraMonto}
                        onChange={(e) => setFormData({ ...formData, compraMonto: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">IGV (18%)</label>
                      <input
                        type="number"
                        value={formData.compraImpuesto}
                        onChange={(e) => setFormData({ ...formData, compraImpuesto: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        step="0.01"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-green-800 mb-1">Asientos que se crearán:</p>
                    <ul className="text-xs text-green-700 space-y-1">
                      <li>• DEBE: 201 - Mercaderías (Activo aumenta)</li>
                      <li>• HABER: 421 - Cuentas por Pagar (Pasivo aumenta)</li>
                      {formData.compraImpuesto && parseFloat(formData.compraImpuesto) > 0 && (
                        <li>• DEBE: 4011 - IGV Crédito Fiscal (Activo aumenta)</li>
                      )}
                    </ul>
                  </div>
                </>
              )}

              {formData.tipoOperacion === 'manual' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción *</label>
                    <input
                      type="text"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Cuenta *</label>
                    <select
                      value={formData.cuenta}
                      onChange={(e) => setFormData({ ...formData, cuenta: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Seleccionar cuenta</option>
                      <optgroup label="⚡ Cuentas Principales">
                        <option value="121 - Cuentas por Cobrar">121 - Cuentas por Cobrar</option>
                        <option value="421 - Cuentas por Pagar">421 - Cuentas por Pagar</option>
                      </optgroup>
                      <optgroup label="Activos">
                        <option value="101 - Caja">101 - Caja</option>
                        <option value="102 - Bancos">102 - Bancos</option>
                        <option value="121 - Cuentas por Cobrar">121 - Cuentas por Cobrar</option>
                        <option value="201 - Mercaderías">201 - Mercaderías</option>
                        <option value="301 - Inmuebles">301 - Inmuebles</option>
                        <option value="302 - Maquinaria">302 - Maquinaria</option>
                      </optgroup>
                      <optgroup label="Pasivos">
                        <option value="421 - Cuentas por Pagar">421 - Cuentas por Pagar</option>
                        <option value="4011 - IGV">4011 - IGV</option>
                        <option value="4011 - IGV Crédito Fiscal">4011 - IGV Crédito Fiscal</option>
                        <option value="4211 - Remuneraciones por Pagar">4211 - Remuneraciones por Pagar</option>
                        <option value="4212 - Impuestos por Pagar">4212 - Impuestos por Pagar</option>
                      </optgroup>
                      <optgroup label="Patrimonio">
                        <option value="501 - Capital">501 - Capital</option>
                        <option value="502 - Reservas">502 - Reservas</option>
                        <option value="503 - Utilidades">503 - Utilidades</option>
                      </optgroup>
                      <optgroup label="Ingresos">
                        <option value="701 - Ventas">701 - Ventas</option>
                        <option value="702 - Ingresos por Servicios">702 - Ingresos por Servicios</option>
                        <option value="703 - Otros Ingresos">703 - Otros Ingresos</option>
                      </optgroup>
                      <optgroup label="Gastos">
                        <option value="601 - Costo de Ventas">601 - Costo de Ventas</option>
                        <option value="602 - Gastos Administrativos">602 - Gastos Administrativos</option>
                        <option value="603 - Gastos de Venta">603 - Gastos de Venta</option>
                        <option value="604 - Gastos Financieros">604 - Gastos Financieros</option>
                      </optgroup>
                    </select>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      O ingresa una cuenta personalizada:
                    </p>
                    <input
                      type="text"
                      value={formData.cuenta}
                      onChange={(e) => setFormData({ ...formData, cuenta: e.target.value })}
                      placeholder="Ej: 121 - Cuentas por Cobrar o 421 - Cuentas por Pagar"
                      className="w-full px-3 py-2 border rounded-lg mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Debe</label>
                      <input
                        type="number"
                        value={formData.debe}
                        onChange={(e) => setFormData({ ...formData, debe: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        step="0.01"
                        placeholder="Activo aumenta"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Haber</label>
                      <input
                        type="number"
                        value={formData.haber}
                        onChange={(e) => setFormData({ ...formData, haber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        step="0.01"
                        placeholder="Pasivo aumenta"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600">
                      <strong>Regla:</strong> Activo aumenta → DEBE | Activo disminuye → HABER<br/>
                      <strong>Regla:</strong> Pasivo aumenta → HABER | Pasivo disminuye → DEBE
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Referencia</label>
                <input
                  type="text"
                  value={formData.referencia}
                  onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Número de documento, factura, etc."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({
                    fecha: new Date().toISOString().split('T')[0],
                    descripcion: '',
                    tipoOperacion: 'manual',
                    tipo: 'manual',
                    debe: '',
                    haber: '',
                    cuenta: '',
                    referencia: '',
                    ventaCliente: '',
                    ventaMonto: '',
                    ventaImpuesto: '',
                    compraProveedor: '',
                    compraMonto: '',
                    compraImpuesto: ''
                  })
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContabilidadGeneral

