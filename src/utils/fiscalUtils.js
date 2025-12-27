/**
 * Utilidades fiscales para Perú
 * Implementa cálculos de IGV, Impuesto a la Renta y reportes SUNAT
 */

// Constantes fiscales Perú
export const TASA_IGV = 0.18 // 18%
export const COEFICIENTE_RENTA_MENSUAL = 0.015 // 1.5% para pagos a cuenta mensual
export const TASA_RENTA_ANUAL = 0.295 // 29.5% para impuesto a la renta anual

/**
 * Calcula el IGV a partir de la base imponible
 * @param {number} baseImponible - Base imponible (precio sin IGV)
 * @returns {number} IGV calculado
 */
export const calcularIGV = (baseImponible) => {
  return Math.round((baseImponible * TASA_IGV) * 100) / 100
}

/**
 * Calcula la base imponible a partir del precio total (con IGV incluido)
 * @param {number} precioTotal - Precio total con IGV incluido
 * @returns {number} Base imponible (precio sin IGV)
 */
export const calcularBaseImponibleDesdeTotal = (precioTotal) => {
  return Math.round((precioTotal / (1 + TASA_IGV)) * 100) / 100
}

/**
 * Calcula el precio total a partir de la base imponible
 * @param {number} baseImponible - Base imponible (precio sin IGV)
 * @returns {number} Precio total con IGV
 */
export const calcularPrecioTotal = (baseImponible) => {
  return Math.round((baseImponible * (1 + TASA_IGV)) * 100) / 100
}

/**
 * Calcula el IGV mensual para PDT 621
 * @param {Array} ventas - Array de ventas del mes
 * @param {Array} compras - Array de compras del mes (con IGV crédito fiscal)
 * @returns {Object} Resumen del PDT 621
 */
export const calcularPDT621 = (ventas = [], compras = []) => {
  // IGV por ventas (débito fiscal)
  const igvVentas = ventas.reduce((sum, v) => {
    return sum + (v.impuesto || calcularIGV(v.baseImponible || v.subtotal || 0))
  }, 0)

  // IGV crédito fiscal (de compras)
  const igvCreditoFiscal = compras.reduce((sum, c) => {
    return sum + (c.igvCreditoFiscal || c.impuesto || 0)
  }, 0)

  // IGV a pagar
  const igvAPagar = Math.max(0, igvVentas - igvCreditoFiscal)

  // Base imponible de ventas
  const baseImponibleVentas = ventas.reduce((sum, v) => {
    return sum + (v.baseImponible || v.subtotal || 0)
  }, 0)

  // Base imponible de compras
  const baseImponibleCompras = compras.reduce((sum, c) => {
    return sum + (c.baseImponible || c.subtotal || 0)
  }, 0)

  return {
    igvVentas: Math.round(igvVentas * 100) / 100,
    igvCreditoFiscal: Math.round(igvCreditoFiscal * 100) / 100,
    igvAPagar: Math.round(igvAPagar * 100) / 100,
    baseImponibleVentas: Math.round(baseImponibleVentas * 100) / 100,
    baseImponibleCompras: Math.round(baseImponibleCompras * 100) / 100,
    totalVentas: Math.round((baseImponibleVentas + igvVentas) * 100) / 100,
    totalCompras: Math.round((baseImponibleCompras + igvCreditoFiscal) * 100) / 100
  }
}

/**
 * Calcula el pago a cuenta mensual del Impuesto a la Renta
 * @param {number} ventasMensuales - Total de ventas del mes
 * @returns {number} Pago a cuenta mensual
 */
export const calcularPagoCuentaRentaMensual = (ventasMensuales) => {
  return Math.round((ventasMensuales * COEFICIENTE_RENTA_MENSUAL) * 100) / 100
}

/**
 * Calcula el Impuesto a la Renta anual
 * @param {number} ingresos - Ingresos totales del año
 * @param {number} gastosDeducibles - Gastos deducibles del año
 * @param {number} pagosMensuales - Suma de pagos a cuenta mensuales realizados
 * @returns {Object} Resumen del Impuesto a la Renta anual
 */
export const calcularImpuestoRentaAnual = (ingresos, gastosDeducibles, pagosMensuales = 0) => {
  const utilidad = ingresos - gastosDeducibles
  const impuestoCalculado = Math.max(0, utilidad * TASA_RENTA_ANUAL)
  const impuestoAPagar = Math.max(0, impuestoCalculado - pagosMensuales)

  return {
    ingresos: Math.round(ingresos * 100) / 100,
    gastosDeducibles: Math.round(gastosDeducibles * 100) / 100,
    utilidad: Math.round(utilidad * 100) / 100,
    impuestoCalculado: Math.round(impuestoCalculado * 100) / 100,
    pagosMensuales: Math.round(pagosMensuales * 100) / 100,
    impuestoAPagar: Math.round(impuestoAPagar * 100) / 100
  }
}

/**
 * Genera el Registro de Ventas (RVIE) en formato SUNAT
 * @param {Array} ventas - Array de ventas
 * @returns {Array} Array de registros formateados para SUNAT
 */
export const generarRegistroVentas = (ventas) => {
  return ventas.map((venta, index) => {
    const fecha = venta.fecha || new Date().toISOString().split('T')[0]
    const tipoComprobante = venta.tipoComprobante || 'FACTURA'
    const numero = venta.numeroComprobante || venta.id || `F001-${String(index + 1).padStart(8, '0')}`
    const cliente = venta.cliente || 'Cliente'
    const rucCliente = venta.rucCliente || ''
    const baseImponible = venta.baseImponible || venta.subtotal || 0
    const igv = venta.impuesto || calcularIGV(baseImponible)
    const total = venta.total || (baseImponible + igv)

    return {
      fecha,
      tipoComprobante,
      numero,
      cliente,
      rucCliente,
      baseImponible: Math.round(baseImponible * 100) / 100,
      igv: Math.round(igv * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  })
}

/**
 * Genera el Registro de Compras (RCE) en formato SUNAT
 * @param {Array} compras - Array de compras/facturas de proveedores
 * @returns {Array} Array de registros formateados para SUNAT
 */
export const generarRegistroCompras = (compras) => {
  return compras.map((compra, index) => {
    const fecha = compra.fecha || compra.fechaVencimiento || new Date().toISOString().split('T')[0]
    const tipoComprobante = compra.tipoComprobante || 'FACTURA'
    const numero = compra.numero || compra.id || `C001-${String(index + 1).padStart(8, '0')}`
    const proveedor = compra.proveedorNombre || compra.proveedor || 'Proveedor'
    const rucProveedor = compra.rucProveedor || compra.ruc || ''
    const baseImponible = compra.baseImponible || compra.subtotal || (compra.monto ? calcularBaseImponibleDesdeTotal(compra.monto) : 0)
    const igvCreditoFiscal = compra.igvCreditoFiscal || compra.impuesto || calcularIGV(baseImponible)
    const total = compra.total || compra.monto || (baseImponible + igvCreditoFiscal)

    return {
      fecha,
      tipoComprobante,
      numero,
      proveedor,
      rucProveedor,
      baseImponible: Math.round(baseImponible * 100) / 100,
      igvCreditoFiscal: Math.round(igvCreditoFiscal * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  })
}

/**
 * Exporta datos a formato TXT para SUNAT (PLE)
 * @param {Array} registros - Array de registros
 * @param {string} tipo - Tipo de registro ('ventas' o 'compras')
 * @returns {string} Contenido del archivo TXT
 */
export const exportarATXT = (registros, tipo = 'ventas') => {
  let contenido = ''
  
  if (tipo === 'ventas') {
    // Encabezado para Registro de Ventas
    contenido += 'FECHA|TIPO_COMPROBANTE|NUMERO|CLIENTE|RUC|BASE_IMPONIBLE|IGV|TOTAL\n'
    registros.forEach(reg => {
      contenido += `${reg.fecha}|${reg.tipoComprobante}|${reg.numero}|${reg.cliente}|${reg.rucCliente}|${reg.baseImponible.toFixed(2)}|${reg.igv.toFixed(2)}|${reg.total.toFixed(2)}\n`
    })
  } else if (tipo === 'compras') {
    // Encabezado para Registro de Compras
    contenido += 'FECHA|TIPO_COMPROBANTE|NUMERO|PROVEEDOR|RUC|BASE_IMPONIBLE|IGV_CREDITO_FISCAL|TOTAL\n'
    registros.forEach(reg => {
      contenido += `${reg.fecha}|${reg.tipoComprobante}|${reg.numero}|${reg.proveedor}|${reg.rucProveedor}|${reg.baseImponible.toFixed(2)}|${reg.igvCreditoFiscal.toFixed(2)}|${reg.total.toFixed(2)}\n`
    })
  }
  
  return contenido
}

/**
 * Descarga un archivo de texto
 * @param {string} contenido - Contenido del archivo
 * @param {string} nombreArchivo - Nombre del archivo
 */
export const descargarArchivo = (contenido, nombreArchivo) => {
  const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Obtiene las ventas de un período específico
 * @param {Array} ventas - Array de todas las ventas
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Array} Ventas filtradas por período
 */
export const filtrarPorPeriodo = (ventas, fechaInicio, fechaFin) => {
  return ventas.filter(venta => {
    const fechaVenta = new Date(venta.fecha)
    return fechaVenta >= fechaInicio && fechaVenta <= fechaFin
  })
}

/**
 * Obtiene las compras de un período específico desde asientos contables
 * @param {Array} asientos - Array de asientos contables
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Array} Compras extraídas de los asientos
 */
export const obtenerComprasDesdeAsientos = (asientos, fechaInicio, fechaFin) => {
  const compras = []
  const asientosCompras = asientos.filter(a => 
    a.origen === 'compra_manual' || 
    a.cuenta?.includes('Mercaderías') ||
    a.cuenta?.includes('IGV Crédito Fiscal')
  )

  // Agrupar asientos por referencia (misma compra)
  const comprasAgrupadas = {}
  
  asientosCompras.forEach(asiento => {
    const fecha = new Date(asiento.fecha)
    if (fecha >= fechaInicio && fecha <= fechaFin) {
      const ref = asiento.referencia || asiento.id
      if (!comprasAgrupadas[ref]) {
        comprasAgrupadas[ref] = {
          fecha: asiento.fecha,
          proveedor: asiento.descripcion?.replace('Compra a ', '').replace('Cuentas por Pagar - ', '') || 'Proveedor',
          baseImponible: 0,
          igvCreditoFiscal: 0,
          total: 0
        }
      }

      if (asiento.cuenta?.includes('Mercaderías')) {
        comprasAgrupadas[ref].baseImponible += asiento.debe || 0
      } else if (asiento.cuenta?.includes('IGV Crédito Fiscal')) {
        comprasAgrupadas[ref].igvCreditoFiscal += asiento.debe || 0
      } else if (asiento.cuenta?.includes('Cuentas por Pagar')) {
        comprasAgrupadas[ref].total += asiento.haber || 0
      }
    }
  })

  return Object.values(comprasAgrupadas)
}

