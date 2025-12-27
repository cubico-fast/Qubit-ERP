import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  query, 
  orderBy,
  where,
  getDoc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'
import {
  getCurrentCompanyId,
  getCompanyDoc,
  getCompanyInfoDoc,
  getUsersCollection,
  getUserDoc,
  getRolesCollection,
  getRoleDoc,
  getProductsCollection,
  getProductDoc,
  getContactsCollection,
  getContactDoc,
  getLeadsCollection,
  getLeadDoc,
  getOpportunitiesCollection,
  getOpportunityDoc,
  getActivitiesCollection,
  getActivityDoc,
  getQuotesCollection,
  getQuoteDoc,
  getOrdersCollection,
  getOrderDoc,
  getInvoicesCollection,
  getInvoiceDoc,
  getPaymentsCollection,
  getPaymentDoc,
  getSuppliersCollection,
  getSupplierDoc,
  getPurchaseRequestsCollection,
  getPurchaseRequestDoc,
  getPurchaseOrdersCollection,
  getPurchaseOrderDoc,
  getReceiptsCollection,
  getReceiptDoc,
  getSupplierEvaluationsCollection,
  getSupplierEvaluationDoc,
  getStockMovementsCollection,
  getStockMovementDoc,
  getWarehousesCollection,
  getWarehouseDoc,
  getTransfersCollection,
  getTransferDoc,
  getShipmentsCollection,
  getShipmentDoc,
  getWorkOrdersCollection,
  getWorkOrderDoc,
  getBomsCollection,
  getBomDoc,
  getRoutesCollection,
  getRouteDoc,
  getCostsCollection,
  getCostDoc,
  getQualityChecksCollection,
  getQualityCheckDoc,
  getEmployeesCollection,
  getEmployeeDoc,
  getAttendanceCollection,
  getAttendanceDoc,
  getPayrollCollection,
  getPayrollDoc,
  getRecruitmentCollection,
  getRecruitmentDoc,
  getEvaluationsCollection,
  getEvaluationDoc,
  getProjectsCollection,
  getProjectDoc,
  getTasksCollection,
  getTaskDoc,
  getResourcesCollection,
  getResourceDoc,
  getProjectCostsCollection,
  getProjectCostDoc,
  getDocumentsCollection,
  getDocumentDoc,
  getVersionsCollection,
  getVersionDoc,
  getApprovalFlowsCollection,
  getApprovalFlowDoc
} from './firebasePaths'

// ========== FUNCIONES PARA COMPANIES ==========

/**
 * Crear o actualizar una empresa en Firestore
 * Ahora usa la estructura: companies/{companyId}/info/main
 */
export const createOrUpdateCompany = async (companyData) => {
  try {
    const { companyId, ...data } = companyData
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    // Crear el documento de la empresa si no existe
    const companyRef = getCompanyDoc(companyIdToUse)
    await setDoc(companyRef, {
      companyId: companyIdToUse,
      createdAt: serverTimestamp()
    }, { merge: true })
    
    // Guardar la información en companies/{companyId}/info/main
    const infoRef = getCompanyInfoDoc(companyIdToUse)
    await setDoc(infoRef, {
      name: data.nombre || data.name || '',
      ruc: data.ruc || '',
      country: data.country || data.pais || '',
      currency: data.currency || data.moneda || 'PEN',
      createdAt: data.createdAt || serverTimestamp(),
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    return { id: companyIdToUse, companyId: companyIdToUse, ...data }
  } catch (error) {
    console.error('Error al crear/actualizar empresa:', error)
    throw error
  }
}

/**
 * Obtener una empresa por su companyId
 * Ahora lee desde companies/{companyId}/info/main
 */
export const getCompany = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const infoRef = getCompanyInfoDoc(companyIdToUse)
    const infoSnap = await getDoc(infoRef)
    
    if (infoSnap.exists()) {
      const data = infoSnap.data()
      return {
        id: companyIdToUse,
        companyId: companyIdToUse,
        nombre: data.name || data.nombre || '',
        name: data.name || data.nombre || '',
        ruc: data.ruc || '',
        country: data.country || data.pais || '',
        currency: data.currency || data.moneda || 'PEN',
        ...data
      }
    }
    return null
  } catch (error) {
    console.error('Error al obtener empresa:', error)
    throw error
  }
}

/**
 * Obtener todas las empresas (solo para administradores)
 */
export const getAllCompanies = async () => {
  try {
    const companiesRef = collection(db, 'companies')
    const querySnapshot = await getDocs(companiesRef)
    
    const companies = []
    for (const docSnap of querySnapshot.docs) {
      const companyId = docSnap.id
      const infoRef = getCompanyInfoDoc(companyId)
      const infoSnap = await getDoc(infoRef)
      
      if (infoSnap.exists()) {
        const data = infoSnap.data()
        companies.push({
          id: companyId,
          companyId: companyId,
          nombre: data.name || data.nombre || '',
          name: data.name || data.nombre || '',
          ruc: data.ruc || '',
          country: data.country || data.pais || '',
          currency: data.currency || data.moneda || 'PEN',
          ...data
        })
      }
    }
    
    return companies
  } catch (error) {
    console.error('Error al obtener empresas:', error)
    throw error
  }
}

// ========== FUNCIONES PARA PRODUCTOS ==========

/**
 * Obtener todos los productos desde Firebase
 * Ahora usa la estructura: companies/{companyId}/inventory/products
 */
export const getProductos = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const productosRef = getProductsCollection(companyIdToUse)
    let querySnapshot
    
    // Intentar ordenar por createdAt
    try {
      const q = query(productosRef, orderBy('createdAt', 'desc'))
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      // Si falla el orderBy, obtener todos sin ordenar
      console.warn('No se pudo ordenar por createdAt, obteniendo sin orden:', orderError)
      querySnapshot = await getDocs(productosRef)
    }
    
    const productos = []
    querySnapshot.forEach((doc) => {
      productos.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return productos
  } catch (error) {
    console.error('Error al obtener productos:', error)
    throw error
  }
}

/**
 * Guardar un nuevo producto en Firebase
 * Ahora usa la estructura: companies/{companyId}/inventory/products
 */
export const saveProducto = async (producto, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    // Remover el id temporal si existe, Firebase generará uno nuevo
    const { id, companyId: _, ...productoData } = producto
    
    // Limpiar valores undefined y null que pueden causar problemas
    const cleanedData = Object.fromEntries(
      Object.entries(productoData).filter(([_, v]) => v !== undefined)
    )
    
    // Asegurar que los arrays estén definidos
    if (!cleanedData.presentaciones) cleanedData.presentaciones = []
    if (!cleanedData.tallas) cleanedData.tallas = []
    if (!cleanedData.colores) cleanedData.colores = []
    if (!cleanedData.imagenes) cleanedData.imagenes = []
    if (!cleanedData.precioHistorial) cleanedData.precioHistorial = []
    
    // Obtener el número de productos existentes para generar el ID secuencial
    const productosRef = getProductsCollection(companyIdToUse)
    let numeroProducto = 1
    
    try {
      // Obtener todos los productos de esta empresa para contar
      const querySnapshot = await getDocs(productosRef)
      const productosExistentes = []
      querySnapshot.forEach((doc) => {
        productosExistentes.push(doc.data())
      })
      
      // Encontrar el número más alto y sumar 1
      const numerosExistentes = productosExistentes
        .map(p => p.numeroProducto)
        .filter(n => n !== undefined && n !== null)
        .map(n => typeof n === 'number' ? n : parseInt(n))
        .filter(n => !isNaN(n))
      
      if (numerosExistentes.length > 0) {
        numeroProducto = Math.max(...numerosExistentes) + 1
      }
    } catch (countError) {
      console.warn('Error al contar productos, usando número 1:', countError)
      numeroProducto = 1
    }
    
    // Agregar el número de producto secuencial
    cleanedData.numeroProducto = numeroProducto
    
    const docRef = await addDoc(productosRef, {
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...cleanedData }
  } catch (error) {
    console.error('Error al guardar producto:', error)
    console.error('Datos del producto:', producto)
    throw error
  }
}

/**
 * Actualizar un producto existente en Firebase
 * Ahora usa la estructura: companies/{companyId}/inventory/products
 */
export const updateProducto = async (productoId, productoData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    // Limpiar valores undefined y null que pueden causar problemas
    const { companyId: _, ...cleanedData } = Object.fromEntries(
      Object.entries(productoData).filter(([_, v]) => v !== undefined)
    )
    
    // Asegurar que los arrays estén definidos
    if (!cleanedData.presentaciones) cleanedData.presentaciones = []
    if (!cleanedData.tallas) cleanedData.tallas = []
    if (!cleanedData.colores) cleanedData.colores = []
    if (!cleanedData.imagenes) cleanedData.imagenes = []
    if (!cleanedData.precioHistorial) cleanedData.precioHistorial = []
    
    const productoRef = getProductDoc(productoId, companyIdToUse)
    
    await updateDoc(productoRef, {
      ...cleanedData,
      updatedAt: serverTimestamp()
    })
    
    return { id: productoId, ...cleanedData }
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    console.error('Datos del producto:', productoData)
    throw error
  }
}

/**
 * Eliminar un producto de Firebase
 */
/**
 * Eliminar un producto de Firebase
 * Ahora usa la estructura: companies/{companyId}/inventory/products
 */
export const deleteProducto = async (productoId, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const productoRef = getProductDoc(productoId, companyIdToUse)
    await deleteDoc(productoRef)
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    throw error
  }
}

// ========== FUNCIONES PARA VENTAS ==========

/**
 * Obtener todas las ventas desde Firebase
 * Ahora usa la estructura: companies/{companyId}/sales/orders
 */
export const getVentas = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const ventasRef = getOrdersCollection(companyIdToUse)
    // Intentar ordenar por fecha
    let querySnapshot
    try {
      const q = query(ventasRef, orderBy('fecha', 'desc'))
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      // Si falla el ordenamiento, obtener todos sin ordenar
      console.warn('No se pudo ordenar por fecha, obteniendo sin orden:', orderError)
      querySnapshot = await getDocs(ventasRef)
    }
    
    const ventas = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      
      // Normalizar el campo 'fecha' - PRIORIZAR createdAt de Firestore (timestamp del servidor - más confiable)
      let fechaNormalizada = null
      
      // PRIMERO: Usar createdAt de Firestore (timestamp del servidor - fecha real de creación)
      if (data.createdAt) {
        if (data.createdAt?.toDate) {
          // Es un Timestamp de Firestore
          const fechaCreated = data.createdAt.toDate()
          // Usar la fecha local (no UTC) para obtener el día correcto según la zona horaria del usuario
          const year = fechaCreated.getFullYear()
          const month = String(fechaCreated.getMonth() + 1).padStart(2, '0')
          const day = String(fechaCreated.getDate()).padStart(2, '0')
          fechaNormalizada = `${year}-${month}-${day}`
          
          // Log para debugging (solo para ventas recientes)
          if (fechaCreated.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
            console.log(`📅 Venta ${doc.id}: usando createdAt de Firestore`, {
              createdAt: data.createdAt.toDate().toISOString(),
              fechaNormalizada,
              fechaOriginal: data.fecha
            })
          }
        } else if (data.createdAt instanceof Date) {
          const year = data.createdAt.getFullYear()
          const month = String(data.createdAt.getMonth() + 1).padStart(2, '0')
          const day = String(data.createdAt.getDate()).padStart(2, '0')
          fechaNormalizada = `${year}-${month}-${day}`
        } else if (typeof data.createdAt === 'string') {
          // Si createdAt es un string ISO, extraer la fecha
          if (data.createdAt.includes('T')) {
            // Extraer solo la parte de la fecha antes de la T
            fechaNormalizada = data.createdAt.split('T')[0]
          } else {
            fechaNormalizada = data.createdAt
          }
        }
      }
      
      // SEGUNDO: Si no hay createdAt, usar el campo 'fecha' manual
      if (!fechaNormalizada && data.fecha) {
        let fechaVenta = data.fecha
        
        // Si fecha es un Timestamp de Firestore, convertirlo a string YYYY-MM-DD
        if (fechaVenta?.toDate) {
          const fechaDate = fechaVenta.toDate()
          const year = fechaDate.getFullYear()
          const month = String(fechaDate.getMonth() + 1).padStart(2, '0')
          const day = String(fechaDate.getDate()).padStart(2, '0')
          fechaNormalizada = `${year}-${month}-${day}`
        }
        // Si fecha es un string, asegurarse de que esté en formato YYYY-MM-DD
        else if (typeof fechaVenta === 'string') {
          // Si tiene hora (formato ISO), tomar solo la parte de la fecha
          if (fechaVenta.includes('T')) {
            fechaVenta = fechaVenta.split('T')[0]
          }
          // Si tiene espacios, tomar solo la parte antes del espacio
          if (fechaVenta.includes(' ')) {
            fechaVenta = fechaVenta.split(' ')[0]
          }
          // Validar formato YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}/.test(fechaVenta)) {
            fechaNormalizada = fechaVenta
          }
        }
        // Si fecha es un objeto Date, convertirlo a string
        else if (fechaVenta instanceof Date) {
          const year = fechaVenta.getFullYear()
          const month = String(fechaVenta.getMonth() + 1).padStart(2, '0')
          const day = String(fechaVenta.getDate()).padStart(2, '0')
          fechaNormalizada = `${year}-${month}-${day}`
        }
      }
      
      // TERCERO: Si aún no hay fecha, usar updatedAt como último recurso
      if (!fechaNormalizada && data.updatedAt) {
        if (data.updatedAt?.toDate) {
          const fechaUpdated = data.updatedAt.toDate()
          const year = fechaUpdated.getFullYear()
          const month = String(fechaUpdated.getMonth() + 1).padStart(2, '0')
          const day = String(fechaUpdated.getDate()).padStart(2, '0')
          fechaNormalizada = `${year}-${month}-${day}`
        }
      }
      
      // Si aún no hay fecha, usar fecha actual como último recurso
      if (!fechaNormalizada) {
        console.warn('Venta sin fecha válida en ningún campo, usando fecha actual:', doc.id)
        const hoy = new Date()
        const year = hoy.getFullYear()
        const month = String(hoy.getMonth() + 1).padStart(2, '0')
        const day = String(hoy.getDate()).padStart(2, '0')
        fechaNormalizada = `${year}-${month}-${day}`
      }
      
      ventas.push({
        id: doc.id,
        ...data,
        // Usar la fecha normalizada (siempre en formato YYYY-MM-DD)
        fecha: fechaNormalizada
      })
    })
    
    // Ordenar manualmente por fecha si no se pudo ordenar en la query
    ventas.sort((a, b) => {
      if (!a.fecha || !b.fecha) return 0
      return b.fecha.localeCompare(a.fecha) // Orden descendente (más reciente primero)
    })
    
    return ventas
  } catch (error) {
    console.error('Error al obtener ventas:', error)
    throw error
  }
}

/**
 * Guardar una nueva venta en Firebase
 * Ahora usa la estructura: companies/{companyId}/sales/orders
 */
export const saveVenta = async (venta, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    // Remover el id temporal si existe
    const { id, companyId: _, ...ventaData } = venta
    
    const ventasRef = getOrdersCollection(companyIdToUse)
    const fechaVenta = ventaData.fecha || new Date().toISOString().split('T')[0]
    
    const docRef = await addDoc(ventasRef, {
      ...ventaData,
      fecha: fechaVenta,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...ventaData }
  } catch (error) {
    console.error('Error al guardar venta:', error)
    throw error
  }
}

/**
 * Actualizar una venta existente en Firebase
 * Ahora usa la estructura: companies/{companyId}/sales/orders
 */
export const updateVenta = async (ventaId, ventaData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { companyId: _, ...cleanedData } = ventaData
    const ventaRef = getOrderDoc(ventaId, companyIdToUse)
    
    await updateDoc(ventaRef, {
      ...cleanedData,
      updatedAt: serverTimestamp()
    })
    
    return { id: ventaId, ...cleanedData }
  } catch (error) {
    console.error('Error al actualizar venta:', error)
    throw error
  }
}

/**
 * Eliminar una venta de Firebase
 * Ahora usa la estructura: companies/{companyId}/sales/orders
 */
export const deleteVenta = async (ventaId, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const ventaRef = getOrderDoc(ventaId, companyIdToUse)
    await deleteDoc(ventaRef)
  } catch (error) {
    console.error('Error al eliminar venta:', error)
    throw error
  }
}

// ========== FUNCIONES PARA CLIENTES ==========

/**
 * Obtener todos los clientes desde Firebase
 * Ahora usa la estructura: companies/{companyId}/crm/contacts
 */
export const getClientes = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const clientesRef = getContactsCollection(companyIdToUse)
    let querySnapshot
    
    try {
      const q = query(clientesRef, orderBy('createdAt', 'desc'))
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      // Si falla el orderBy, intentar solo con el filtro de companyId
      try {
        const q = query(clientesRef, where('companyId', '==', companyIdToUse))
        querySnapshot = await getDocs(q)
      } catch (filterError) {
        // Si también falla el filtro, obtener todos y filtrar en memoria
        console.warn('No se pudo filtrar por companyId en la query, filtrando en memoria:', filterError)
        const allSnapshot = await getDocs(clientesRef)
        const clientes = []
        allSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.companyId === companyIdToUse) {
            clientes.push({
              id: doc.id,
              ...data
            })
          }
        })
        return clientes
      }
    }
    
    const clientes = []
    querySnapshot.forEach((doc) => {
      clientes.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return clientes
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    throw error
  }
}

/**
 * Guardar un nuevo cliente en Firebase
 */
/**
 * Guardar un nuevo cliente en Firebase
 * Ahora usa la estructura: companies/{companyId}/crm/contacts
 */
export const saveCliente = async (cliente, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    const { id, companyId: _, ...clienteData } = cliente
    const cleanedData = {}
    
    // Limpiar datos undefined
    for (const key in clienteData) {
      if (clienteData[key] !== undefined && clienteData[key] !== null) {
        cleanedData[key] = clienteData[key]
      }
    }
    
    const clientesRef = getContactsCollection(companyIdToUse)
    const docRef = await addDoc(clientesRef, {
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...cleanedData }
  } catch (error) {
    console.error('Error al guardar cliente:', error)
    throw error
  }
}

/**
 * Actualizar un cliente existente en Firebase
 * Ahora usa la estructura: companies/{companyId}/crm/contacts
 */
export const updateCliente = async (clienteId, clienteData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    const { companyId: _, ...cleanedData } = Object.fromEntries(
      Object.entries(clienteData).filter(([_, v]) => v !== undefined && v !== null)
    )
    
    const clienteRef = getContactDoc(clienteId, companyIdToUse)
    
    await updateDoc(clienteRef, {
      ...cleanedData,
      updatedAt: serverTimestamp()
    })
    
    return { id: clienteId, ...cleanedData }
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    throw error
  }
}

/**
 * Eliminar un cliente de Firebase
 * Ahora usa la estructura: companies/{companyId}/crm/contacts
 */
export const deleteCliente = async (clienteId, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const clienteRef = getContactDoc(clienteId, companyIdToUse)
    await deleteDoc(clienteRef)
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    throw error
  }
}

// ========== FUNCIONES PARA MÉTRICAS DE MARKETING ==========

/**
 * Guardar métricas de marketing en Firestore
 * @param {object} metricasData - Datos de las métricas a guardar (debe incluir platform y accountId)
 * @param {string} platform - 'instagram' o 'facebook'
 * @param {string} accountId - ID de la cuenta (Instagram Account ID o Facebook Page ID)
 */
export const guardarMetricasMarketing = async (metricasData, platform, accountId) => {
  try {
    const metricasRef = collection(db, 'marketing_metricas')
    const timestamp = new Date().toISOString()
    
    // Estructura de datos para guardar (evitar duplicar platform)
    const { platform: _, accountId: __, ...restData } = metricasData
    
    const dataToSave = {
      platform: platform,
      accountId: accountId,
      timestamp: timestamp,
      fecha: new Date().toISOString().split('T')[0], // Fecha en formato YYYY-MM-DD
      ...restData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(metricasRef, dataToSave)
    return { id: docRef.id, ...dataToSave }
  } catch (error) {
    console.error('Error al guardar métricas de marketing:', error)
    throw error
  }
}

/**
 * Obtener métricas de marketing desde Firestore
 * @param {string} platform - 'instagram' o 'facebook' (opcional)
 * @param {string} accountId - ID de la cuenta (opcional)
 * @param {number} limit - Límite de resultados (opcional, por defecto 100)
 */
export const obtenerMetricasMarketing = async (platform = null, accountId = null, limit = 100) => {
  try {
    const metricasRef = collection(db, 'marketing_metricas')
    let q = query(metricasRef, orderBy('timestamp', 'desc'))
    
    // Aplicar filtros si se proporcionan
    if (platform) {
      q = query(q, orderBy('platform'), orderBy('timestamp', 'desc'))
    }
    
    const querySnapshot = await getDocs(q)
    const metricas = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Aplicar filtros en memoria si es necesario
      if ((!platform || data.platform === platform) && 
          (!accountId || data.accountId === accountId)) {
        metricas.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    // Limitar resultados
    return metricas.slice(0, limit)
  } catch (error) {
    console.error('Error al obtener métricas de marketing:', error)
    throw error
  }
}

/**
 * Obtener las últimas métricas de una plataforma específica
 * @param {string} platform - 'instagram' o 'facebook'
 * @param {string} accountId - ID de la cuenta
 */
export const obtenerUltimasMetricas = async (platform, accountId) => {
  try {
    const metricas = await obtenerMetricasMarketing(platform, accountId, 1)
    return metricas.length > 0 ? metricas[0] : null
  } catch (error) {
    console.error('Error al obtener últimas métricas:', error)
    throw error
  }
}

// ========== FUNCIONES PARA UNIDADES DE MEDIDA ==========

/**
 * Obtener todas las unidades de medida desde Firebase
 */
export const getUnidadesMedida = async () => {
  try {
    const unidadesRef = collection(db, 'unidades_medida')
    let querySnapshot
    
    try {
      const q = query(unidadesRef, orderBy('nombre', 'asc'))
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      console.warn('No se pudo ordenar unidades por nombre, obteniendo sin orden:', orderError)
      querySnapshot = await getDocs(unidadesRef)
    }
    
    const unidades = []
    querySnapshot.forEach((doc) => {
      unidades.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return unidades
  } catch (error) {
    console.error('Error al obtener unidades de medida:', error)
    throw error
  }
}

/**
 * Guardar una nueva unidad de medida en Firebase
 */
export const saveUnidadMedida = async (unidad) => {
  try {
    const { id, ...unidadData } = unidad
    
    // Limpiar valores undefined y null
    const cleanedData = Object.fromEntries(
      Object.entries(unidadData).filter(([_, v]) => v !== undefined && v !== null)
    )
    
    const unidadesRef = collection(db, 'unidades_medida')
    const docRef = await addDoc(unidadesRef, {
      ...cleanedData,
      valor_posicional: parseFloat(cleanedData.valor_posicional) || parseFloat(cleanedData.cantidad) || 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...cleanedData }
  } catch (error) {
    console.error('Error al guardar unidad de medida:', error)
    throw error
  }
}

/**
 * Actualizar una unidad de medida existente en Firebase
 */
export const updateUnidadMedida = async (unidadId, unidadData) => {
  try {
    const cleanedData = Object.fromEntries(
      Object.entries(unidadData).filter(([_, v]) => v !== undefined && v !== null)
    )
    
    const unidadRef = doc(db, 'unidades_medida', unidadId)
    await updateDoc(unidadRef, {
      ...cleanedData,
      valor_posicional: parseFloat(cleanedData.valor_posicional) || parseFloat(cleanedData.cantidad) || 1,
      updatedAt: serverTimestamp()
    })
    
    return { id: unidadId, ...cleanedData }
  } catch (error) {
    console.error('Error al actualizar unidad de medida:', error)
    throw error
  }
}

/**
 * Eliminar una unidad de medida de Firebase
 */
export const deleteUnidadMedida = async (unidadId) => {
  try {
    const unidadRef = doc(db, 'unidades_medida', unidadId)
    await deleteDoc(unidadRef)
  } catch (error) {
    console.error('Error al eliminar unidad de medida:', error)
    throw error
  }
}

// ========== FUNCIONES PARA FINANZAS ==========

/**
 * Obtener proveedores filtrados por companyId
 */
export const getProveedores = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const proveedoresRef = collection(db, 'proveedores')
    const q = query(
      proveedoresRef,
      where('companyId', '==', companyIdToUse),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const proveedores = []
    querySnapshot.forEach((doc) => {
      proveedores.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return proveedores
  } catch (error) {
    console.error('Error al obtener proveedores:', error)
    throw error
  }
}

/**
 * Guardar un proveedor
 */
export const saveProveedor = async (proveedor, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...proveedorData } = proveedor
    
    const proveedoresRef = collection(db, 'proveedores')
    const docRef = await addDoc(proveedoresRef, {
      ...proveedorData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...proveedorData }
  } catch (error) {
    console.error('Error al guardar proveedor:', error)
    throw error
  }
}

/**
 * Obtener facturas de proveedores (cuentas por pagar)
 */
export const getFacturasProveedores = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const facturasRef = collection(db, 'facturas_proveedores')
    const q = query(
      facturasRef,
      where('companyId', '==', companyIdToUse),
      orderBy('fechaVencimiento', 'asc')
    )
    const querySnapshot = await getDocs(q)
    
    const facturas = []
    querySnapshot.forEach((doc) => {
      facturas.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return facturas
  } catch (error) {
    console.error('Error al obtener facturas de proveedores:', error)
    throw error
  }
}

/**
 * Guardar factura de proveedor
 */
export const saveFacturaProveedor = async (factura, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...facturaData } = factura
    
    const facturasRef = collection(db, 'facturas_proveedores')
    const docRef = await addDoc(facturasRef, {
      ...facturaData,
      companyId: companyIdToUse,
      estado: facturaData.estado || 'pendiente',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...facturaData }
  } catch (error) {
    console.error('Error al guardar factura de proveedor:', error)
    throw error
  }
}

/**
 * Obtener asientos contables
 */
export const getAsientosContables = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const asientosRef = collection(db, 'asientos_contables')
    const q = query(
      asientosRef,
      where('companyId', '==', companyIdToUse),
      orderBy('fecha', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const asientos = []
    querySnapshot.forEach((doc) => {
      asientos.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return asientos
  } catch (error) {
    console.error('Error al obtener asientos contables:', error)
    throw error
  }
}

/**
 * Guardar asiento contable
 */
export const saveAsientoContable = async (asiento, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...asientoData } = asiento
    
    const asientosRef = collection(db, 'asientos_contables')
    const docRef = await addDoc(asientosRef, {
      ...asientoData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...asientoData }
  } catch (error) {
    console.error('Error al guardar asiento contable:', error)
    throw error
  }
}

/**
 * Obtener movimientos de tesorería
 */
export const getMovimientosTesoreria = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const movimientosRef = collection(db, 'movimientos_tesoreria')
    const q = query(
      movimientosRef,
      where('companyId', '==', companyIdToUse),
      orderBy('fecha', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const movimientos = []
    querySnapshot.forEach((doc) => {
      movimientos.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return movimientos
  } catch (error) {
    console.error('Error al obtener movimientos de tesorería:', error)
    throw error
  }
}

/**
 * Guardar movimiento de tesorería
 */
export const saveMovimientoTesoreria = async (movimiento, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...movimientoData } = movimiento
    
    const movimientosRef = collection(db, 'movimientos_tesoreria')
    const docRef = await addDoc(movimientosRef, {
      ...movimientoData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...movimientoData }
  } catch (error) {
    console.error('Error al guardar movimiento de tesorería:', error)
    throw error
  }
}

// ========== FUNCIONES PARA COTIZACIONES ==========

/**
 * Obtener cotizaciones filtradas por companyId
 */
/**
 * Obtener todas las cotizaciones desde Firebase
 * Ahora usa la estructura: companies/{companyId}/sales/quotes
 */
export const getCotizaciones = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const cotizacionesRef = getQuotesCollection(companyIdToUse)
    const q = query(cotizacionesRef, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const cotizaciones = []
    querySnapshot.forEach((doc) => {
      cotizaciones.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return cotizaciones
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)
    throw error
  }
}

/**
 * Guardar una cotización
 * Ahora usa la estructura: companies/{companyId}/sales/quotes
 */
export const saveCotizacion = async (cotizacion, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, companyId: _, ...cotizacionData } = cotizacion
    
    const cotizacionesRef = getQuotesCollection(companyIdToUse)
    const docRef = await addDoc(cotizacionesRef, {
      ...cotizacionData,
      estado: cotizacionData.estado || 'pendiente',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...cotizacionData }
  } catch (error) {
    console.error('Error al guardar cotización:', error)
    throw error
  }
}

/**
 * Actualizar una cotización existente
 */
/**
 * Actualizar una cotización existente
 * Ahora usa la estructura: companies/{companyId}/sales/quotes
 */
export const updateCotizacion = async (cotizacionId, cotizacionData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { companyId: _, ...cleanedData } = cotizacionData
    const cotizacionRef = getQuoteDoc(cotizacionId, companyIdToUse)
    
    await updateDoc(cotizacionRef, {
      ...cleanedData,
      updatedAt: serverTimestamp()
    })
    
    return { id: cotizacionId, ...cleanedData }
  } catch (error) {
    console.error('Error al actualizar cotización:', error)
    throw error
  }
}

/**
 * Eliminar una cotización
 */
/**
 * Eliminar una cotización
 * Ahora usa la estructura: companies/{companyId}/sales/quotes
 */
export const deleteCotizacion = async (cotizacionId, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const cotizacionRef = getQuoteDoc(cotizacionId, companyIdToUse)
    await deleteDoc(cotizacionRef)
  } catch (error) {
    console.error('Error al eliminar cotización:', error)
    throw error
  }
}

// ========== FUNCIONES PARA LISTAS DE PRECIOS ==========

/**
 * Obtener listas de precios filtradas por companyId
 */
export const getListasPrecios = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const listasRef = collection(db, 'listas_precios')
    const q = query(
      listasRef,
      where('companyId', '==', companyIdToUse),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const listas = []
    querySnapshot.forEach((doc) => {
      listas.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return listas
  } catch (error) {
    console.error('Error al obtener listas de precios:', error)
    throw error
  }
}

/**
 * Guardar una lista de precios
 */
export const saveListaPrecios = async (lista, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...listaData } = lista
    
    const listasRef = collection(db, 'listas_precios')
    const docRef = await addDoc(listasRef, {
      ...listaData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...listaData }
  } catch (error) {
    console.error('Error al guardar lista de precios:', error)
    throw error
  }
}

// ========== FUNCIONES PARA GARANTÍAS ==========

/**
 * Obtener garantías filtradas por companyId
 */
export const getGarantias = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const garantiasRef = collection(db, 'garantias')
    const q = query(
      garantiasRef,
      where('companyId', '==', companyIdToUse),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const garantias = []
    querySnapshot.forEach((doc) => {
      garantias.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return garantias
  } catch (error) {
    console.error('Error al obtener garantías:', error)
    throw error
  }
}

/**
 * Guardar una garantía
 */
export const saveGarantia = async (garantia, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...garantiaData } = garantia
    
    const garantiasRef = collection(db, 'garantias')
    const docRef = await addDoc(garantiasRef, {
      ...garantiaData,
      companyId: companyIdToUse,
      estado: garantiaData.estado || 'activa',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...garantiaData }
  } catch (error) {
    console.error('Error al guardar garantía:', error)
    throw error
  }
}

/**
 * Actualizar una garantía existente
 */
export const updateGarantia = async (garantiaId, garantiaData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const garantiaRef = doc(db, 'garantias', garantiaId)
    
    // Verificar que la garantía pertenezca a la empresa antes de actualizar
    const garantiaSnap = await getDoc(garantiaRef)
    if (garantiaSnap.exists()) {
      const garantia = garantiaSnap.data()
      if (garantia.companyId !== companyIdToUse) {
        throw new Error('No tienes permiso para actualizar esta garantía')
      }
    }
    
    // Asegurar que el companyId se mantenga
    garantiaData.companyId = companyIdToUse
    
    await updateDoc(garantiaRef, {
      ...garantiaData,
      updatedAt: serverTimestamp()
    })
    
    return { id: garantiaId, ...garantiaData }
  } catch (error) {
    console.error('Error al actualizar garantía:', error)
    throw error
  }
}

// ========== FUNCIONES PARA RECLAMOS ==========

/**
 * Obtener reclamos filtrados por companyId
 */
export const getReclamos = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const reclamosRef = collection(db, 'reclamos')
    const q = query(
      reclamosRef,
      where('companyId', '==', companyIdToUse),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const reclamos = []
    querySnapshot.forEach((doc) => {
      reclamos.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return reclamos
  } catch (error) {
    console.error('Error al obtener reclamos:', error)
    throw error
  }
}

/**
 * Guardar un reclamo
 */
export const saveReclamo = async (reclamo, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...reclamoData } = reclamo
    
    const reclamosRef = collection(db, 'reclamos')
    const docRef = await addDoc(reclamosRef, {
      ...reclamoData,
      companyId: companyIdToUse,
      estado: reclamoData.estado || 'Registrado',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...reclamoData }
  } catch (error) {
    console.error('Error al guardar reclamo:', error)
    throw error
  }
}

/**
 * Actualizar un reclamo existente
 */
export const updateReclamo = async (reclamoId, reclamoData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const reclamosRef = collection(db, 'reclamos')
    const reclamoDoc = doc(reclamosRef, reclamoId)
    
    await updateDoc(reclamoDoc, {
      ...reclamoData,
      updatedAt: serverTimestamp()
    })
    
    return { id: reclamoId, ...reclamoData }
  } catch (error) {
    console.error('Error al actualizar reclamo:', error)
    throw error
  }
}

// ========== FUNCIONES PARA NOTAS DE CRÉDITO Y DÉBITO ==========

/**
 * Obtener todas las notas de crédito y débito filtradas por companyId
 */
export const getNotasCreditoDebito = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const notasRef = collection(db, 'notas_credito_debito')
    let querySnapshot
    
    try {
      const q = query(
        notasRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fecha', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      // Si falla el orderBy, intentar solo con el filtro de companyId
      try {
        const q = query(notasRef, where('companyId', '==', companyIdToUse))
        querySnapshot = await getDocs(q)
      } catch (filterError) {
        // Si también falla el filtro, obtener todos y filtrar en memoria
        console.warn('No se pudo filtrar por companyId en la query, filtrando en memoria:', filterError)
        const allSnapshot = await getDocs(notasRef)
        const notas = []
        allSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.companyId === companyIdToUse) {
            notas.push({
              id: doc.id,
              ...data
            })
          }
        })
        // Ordenar por fecha en memoria
        return notas.sort((a, b) => {
          const fechaA = a.fecha || a.createdAt?.toDate?.() || new Date(0)
          const fechaB = b.fecha || b.createdAt?.toDate?.() || new Date(0)
          return fechaB - fechaA
        })
      }
    }
    
    const notas = []
    querySnapshot.forEach((doc) => {
      notas.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return notas
  } catch (error) {
    console.error('Error al obtener notas de crédito y débito:', error)
    throw error
  }
}

/**
 * Guardar una nueva nota de crédito o débito en Firebase
 */
export const saveNotaCreditoDebito = async (nota, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    // Remover el id temporal si existe
    const { id, ...notaData } = nota
    
    // Agregar companyId a la nota
    notaData.companyId = companyIdToUse
    
    const notasRef = collection(db, 'notas_credito_debito')
    const docRef = await addDoc(notasRef, {
      ...notaData,
      fecha: notaData.fecha || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...notaData }
  } catch (error) {
    console.error('Error al guardar nota de crédito/débito:', error)
    throw error
  }
}

// ========== FUNCIONES PARA PEDIDOS ==========

/**
 * Obtener todos los pedidos desde Firebase filtrados por companyId
 */
export const getPedidos = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const pedidosRef = collection(db, 'pedidos')
    
    let querySnapshot
    try {
      const q = query(
        pedidosRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fecha', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (error) {
      const allSnapshot = await getDocs(pedidosRef)
      querySnapshot = allSnapshot
    }
    
    const pedidos = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.companyId === companyIdToUse || !companyIdToUse) {
        pedidos.push({
          id: doc.id,
          ...data,
          fecha: data.fecha || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
        })
      }
    })
    
    return pedidos
  } catch (error) {
    console.error('Error al obtener pedidos:', error)
    throw error
  }
}

/**
 * Guardar un nuevo pedido en Firebase
 */
export const savePedido = async (pedido, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...pedidoData } = pedido
    
    const pedidosRef = collection(db, 'pedidos')
    const docRef = await addDoc(pedidosRef, {
      ...pedidoData,
      companyId: companyIdToUse,
      estado: pedidoData.estado || 'Pendiente',
      fecha: pedidoData.fecha || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...pedidoData }
  } catch (error) {
    console.error('Error al guardar pedido:', error)
    throw error
  }
}

/**
 * Actualizar un pedido existente
 */
export const updatePedido = async (pedidoId, pedidoData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const pedidoRef = doc(db, 'pedidos', pedidoId)
    
    await updateDoc(pedidoRef, {
      ...pedidoData,
      updatedAt: serverTimestamp()
    })
    
    return { id: pedidoId, ...pedidoData }
  } catch (error) {
    console.error('Error al actualizar pedido:', error)
    throw error
  }
}

/**
 * Eliminar un pedido
 */
export const deletePedido = async (pedidoId, companyId = null) => {
  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId)
    await deleteDoc(pedidoRef)
    return true
  } catch (error) {
    console.error('Error al eliminar pedido:', error)
    throw error
  }
}

// ========== FUNCIONES PARA ENVÍOS Y LOGÍSTICA ==========

/**
 * Obtener todos los envíos desde Firebase filtrados por companyId
 */
export const getEnvios = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const enviosRef = collection(db, 'envios')
    
    let querySnapshot
    try {
      const q = query(
        enviosRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fechaEnvio', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (error) {
      const allSnapshot = await getDocs(enviosRef)
      querySnapshot = allSnapshot
    }
    
    const envios = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.companyId === companyIdToUse || !companyIdToUse) {
        envios.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    return envios
  } catch (error) {
    console.error('Error al obtener envíos:', error)
    throw error
  }
}

/**
 * Guardar un nuevo envío en Firebase
 */
export const saveEnvio = async (envio, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...envioData } = envio
    
    const enviosRef = collection(db, 'envios')
    const docRef = await addDoc(enviosRef, {
      ...envioData,
      companyId: companyIdToUse,
      estado: envioData.estado || 'Pendiente',
      fechaEnvio: envioData.fechaEnvio || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...envioData }
  } catch (error) {
    console.error('Error al guardar envío:', error)
    throw error
  }
}

/**
 * Actualizar un envío existente
 */
export const updateEnvio = async (envioId, envioData, companyId = null) => {
  try {
    const envioRef = doc(db, 'envios', envioId)
    
    await updateDoc(envioRef, {
      ...envioData,
      updatedAt: serverTimestamp()
    })
    
    return { id: envioId, ...envioData }
  } catch (error) {
    console.error('Error al actualizar envío:', error)
    throw error
  }
}

// ========== FUNCIONES PARA KARDEX/INVENTARIOS ==========

/**
 * Obtener movimientos de kardex desde Firebase filtrados por companyId
 */
export const getKardex = async (productoId = null, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const kardexRef = collection(db, 'kardex')
    
    let q
    if (productoId) {
      try {
        q = query(
          kardexRef,
          where('companyId', '==', companyIdToUse),
          where('productoId', '==', productoId),
          orderBy('fecha', 'desc')
        )
      } catch (error) {
        q = query(kardexRef, where('companyId', '==', companyIdToUse))
      }
    } else {
      try {
        q = query(
          kardexRef,
          where('companyId', '==', companyIdToUse),
          orderBy('fecha', 'desc')
        )
      } catch (error) {
        q = query(kardexRef)
      }
    }
    
    const querySnapshot = await getDocs(q)
    const movimientos = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.companyId === companyIdToUse) {
        if (!productoId || data.productoId === productoId) {
          movimientos.push({
            id: doc.id,
            ...data
          })
        }
      }
    })
    
    return movimientos
  } catch (error) {
    console.error('Error al obtener kardex:', error)
    throw error
  }
}

/**
 * Guardar un movimiento de kardex en Firebase
 */
export const saveMovimientoKardex = async (movimiento, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...movimientoData } = movimiento
    
    const kardexRef = collection(db, 'kardex')
    const docRef = await addDoc(kardexRef, {
      ...movimientoData,
      companyId: companyIdToUse,
      fecha: movimientoData.fecha || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...movimientoData }
  } catch (error) {
    console.error('Error al guardar movimiento de kardex:', error)
    throw error
  }
}

/**
 * Obtener stock por almacén
 */
export const getStockAlmacen = async (almacenId = null, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const stockRef = collection(db, 'stock_almacen')
    
    let q
    if (almacenId) {
      try {
        q = query(
          stockRef,
          where('companyId', '==', companyIdToUse),
          where('almacenId', '==', almacenId)
        )
      } catch (error) {
        q = query(stockRef, where('companyId', '==', companyIdToUse))
      }
    } else {
      q = query(stockRef, where('companyId', '==', companyIdToUse))
    }
    
    const querySnapshot = await getDocs(q)
    const stock = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.companyId === companyIdToUse) {
        if (!almacenId || data.almacenId === almacenId) {
          stock.push({
            id: doc.id,
            ...data
          })
        }
      }
    })
    
    return stock
  } catch (error) {
    console.error('Error al obtener stock por almacén:', error)
    throw error
  }
}

/**
 * Actualizar stock en almacén
 */
export const updateStockAlmacen = async (productoId, almacenId, cantidad, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const stockRef = collection(db, 'stock_almacen')
    
    // Buscar si ya existe un registro para este producto en este almacén
    const q = query(
      stockRef,
      where('companyId', '==', companyIdToUse),
      where('productoId', '==', productoId),
      where('almacenId', '==', almacenId)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      // Crear nuevo registro
      await addDoc(stockRef, {
        companyId: companyIdToUse,
        productoId,
        almacenId,
        cantidad,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      })
    } else {
      // Actualizar registro existente
      const docRef = querySnapshot.docs[0].ref
      await updateDoc(docRef, {
        cantidad,
        updatedAt: serverTimestamp()
      })
    }
    
    return true
  } catch (error) {
    console.error('Error al actualizar stock por almacén:', error)
    throw error
  }
}

// ========== FUNCIONES PARA ALMACENES ==========

/**
 * Obtener almacenes filtrados por companyId
 */
export const getAlmacenes = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const almacenesRef = collection(db, 'almacenes')
    
    try {
      const q = query(
        almacenesRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const almacenes = []
      querySnapshot.forEach((doc) => {
        almacenes.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return almacenes
    } catch (error) {
      // Si falla el orderBy, intentar solo con el filtro
      const q = query(almacenesRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const almacenes = []
      querySnapshot.forEach((doc) => {
        almacenes.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return almacenes.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0)
        const dateB = b.createdAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener almacenes:', error)
    throw error
  }
}

/**
 * Guardar un almacén
 */
export const saveAlmacen = async (almacen, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...almacenData } = almacen
    
    const almacenesRef = collection(db, 'almacenes')
    const docRef = await addDoc(almacenesRef, {
      ...almacenData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...almacenData }
  } catch (error) {
    console.error('Error al guardar almacén:', error)
    throw error
  }
}

/**
 * Actualizar un almacén
 */
export const updateAlmacen = async (almacenId, almacenData, companyId = null) => {
  try {
    const almacenRef = doc(db, 'almacenes', almacenId)
    
    await updateDoc(almacenRef, {
      ...almacenData,
      updatedAt: serverTimestamp()
    })
    
    return { id: almacenId, ...almacenData }
  } catch (error) {
    console.error('Error al actualizar almacén:', error)
    throw error
  }
}

/**
 * Eliminar un almacén
 */
export const deleteAlmacen = async (almacenId) => {
  try {
    const almacenRef = doc(db, 'almacenes', almacenId)
    await deleteDoc(almacenRef)
    return true
  } catch (error) {
    console.error('Error al eliminar almacén:', error)
    throw error
  }
}

/**
 * Obtener transferencias entre almacenes
 */
export const getTransferencias = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const transferenciasRef = collection(db, 'transferencias_almacenes')
    
    try {
      const q = query(
        transferenciasRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fecha', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const transferencias = []
      querySnapshot.forEach((doc) => {
        transferencias.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return transferencias
    } catch (error) {
      const q = query(transferenciasRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const transferencias = []
      querySnapshot.forEach((doc) => {
        transferencias.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return transferencias.sort((a, b) => {
        const dateA = new Date(a.fecha || 0)
        const dateB = new Date(b.fecha || 0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener transferencias:', error)
    throw error
  }
}

/**
 * Guardar una transferencia entre almacenes
 */
export const saveTransferencia = async (transferencia, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...transferenciaData } = transferencia
    
    const transferenciasRef = collection(db, 'transferencias_almacenes')
    const docRef = await addDoc(transferenciasRef, {
      ...transferenciaData,
      companyId: companyIdToUse,
      fecha: transferenciaData.fecha || new Date().toISOString().split('T')[0],
      estado: transferenciaData.estado || 'Pendiente',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...transferenciaData }
  } catch (error) {
    console.error('Error al guardar transferencia:', error)
    throw error
  }
}

// ========== FUNCIONES PARA PRODUCCIÓN ==========

/**
 * Obtener órdenes de producción filtradas por companyId
 */
export const getOrdenesProduccion = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const ordenesRef = collection(db, 'ordenes_produccion')
    
    try {
      const q = query(
        ordenesRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fechaInicio', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const ordenes = []
      querySnapshot.forEach((doc) => {
        ordenes.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return ordenes
    } catch (error) {
      const q = query(ordenesRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const ordenes = []
      querySnapshot.forEach((doc) => {
        ordenes.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return ordenes.sort((a, b) => {
        const dateA = new Date(a.fechaInicio || 0)
        const dateB = new Date(b.fechaInicio || 0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener órdenes de producción:', error)
    throw error
  }
}

/**
 * Guardar una orden de producción
 */
export const saveOrdenProduccion = async (orden, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...ordenData } = orden
    
    const ordenesRef = collection(db, 'ordenes_produccion')
    const docRef = await addDoc(ordenesRef, {
      ...ordenData,
      companyId: companyIdToUse,
      estado: ordenData.estado || 'Pendiente',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...ordenData }
  } catch (error) {
    console.error('Error al guardar orden de producción:', error)
    throw error
  }
}

/**
 * Actualizar una orden de producción
 */
export const updateOrdenProduccion = async (ordenId, ordenData, companyId = null) => {
  try {
    const ordenRef = doc(db, 'ordenes_produccion', ordenId)
    
    await updateDoc(ordenRef, {
      ...ordenData,
      updatedAt: serverTimestamp()
    })
    
    return { id: ordenId, ...ordenData }
  } catch (error) {
    console.error('Error al actualizar orden de producción:', error)
    throw error
  }
}

/**
 * Eliminar una orden de producción
 */
export const deleteOrdenProduccion = async (ordenId) => {
  try {
    const ordenRef = doc(db, 'ordenes_produccion', ordenId)
    await deleteDoc(ordenRef)
    return true
  } catch (error) {
    console.error('Error al eliminar orden de producción:', error)
    throw error
  }
}

/**
 * Obtener BOMs (Listas de Materiales) filtradas por companyId
 */
export const getBOMs = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const bomsRef = collection(db, 'boms')
    
    try {
      const q = query(
        bomsRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const boms = []
      querySnapshot.forEach((doc) => {
        boms.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return boms
    } catch (error) {
      const q = query(bomsRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const boms = []
      querySnapshot.forEach((doc) => {
        boms.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return boms.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0)
        const dateB = b.createdAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener BOMs:', error)
    throw error
  }
}

/**
 * Guardar un BOM
 */
export const saveBOM = async (bom, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...bomData } = bom
    
    const bomsRef = collection(db, 'boms')
    const docRef = await addDoc(bomsRef, {
      ...bomData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...bomData }
  } catch (error) {
    console.error('Error al guardar BOM:', error)
    throw error
  }
}

/**
 * Actualizar un BOM
 */
export const updateBOM = async (bomId, bomData, companyId = null) => {
  try {
    const bomRef = doc(db, 'boms', bomId)
    
    await updateDoc(bomRef, {
      ...bomData,
      updatedAt: serverTimestamp()
    })
    
    return { id: bomId, ...bomData }
  } catch (error) {
    console.error('Error al actualizar BOM:', error)
    throw error
  }
}

/**
 * Eliminar un BOM
 */
export const deleteBOM = async (bomId) => {
  try {
    const bomRef = doc(db, 'boms', bomId)
    await deleteDoc(bomRef)
    return true
  } catch (error) {
    console.error('Error al eliminar BOM:', error)
    throw error
  }
}

/**
 * Obtener rutas de producción filtradas por companyId
 */
export const getRutasProduccion = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const rutasRef = collection(db, 'rutas_produccion')
    
    try {
      const q = query(
        rutasRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const rutas = []
      querySnapshot.forEach((doc) => {
        rutas.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return rutas
    } catch (error) {
      const q = query(rutasRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const rutas = []
      querySnapshot.forEach((doc) => {
        rutas.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return rutas.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0)
        const dateB = b.createdAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener rutas de producción:', error)
    throw error
  }
}

/**
 * Guardar una ruta de producción
 */
export const saveRutaProduccion = async (ruta, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...rutaData } = ruta
    
    const rutasRef = collection(db, 'rutas_produccion')
    const docRef = await addDoc(rutasRef, {
      ...rutaData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...rutaData }
  } catch (error) {
    console.error('Error al guardar ruta de producción:', error)
    throw error
  }
}

/**
 * Actualizar una ruta de producción
 */
export const updateRutaProduccion = async (rutaId, rutaData, companyId = null) => {
  try {
    const rutaRef = doc(db, 'rutas_produccion', rutaId)
    
    await updateDoc(rutaRef, {
      ...rutaData,
      updatedAt: serverTimestamp()
    })
    
    return { id: rutaId, ...rutaData }
  } catch (error) {
    console.error('Error al actualizar ruta de producción:', error)
    throw error
  }
}

/**
 * Eliminar una ruta de producción
 */
export const deleteRutaProduccion = async (rutaId) => {
  try {
    const rutaRef = doc(db, 'rutas_produccion', rutaId)
    await deleteDoc(rutaRef)
    return true
  } catch (error) {
    console.error('Error al eliminar ruta de producción:', error)
    throw error
  }
}

/**
 * Obtener registros de costeo filtrados por companyId
 */
export const getCosteos = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const costeosRef = collection(db, 'costeos')
    
    try {
      const q = query(
        costeosRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fecha', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const costeos = []
      querySnapshot.forEach((doc) => {
        costeos.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return costeos
    } catch (error) {
      const q = query(costeosRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const costeos = []
      querySnapshot.forEach((doc) => {
        costeos.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return costeos.sort((a, b) => {
        const dateA = new Date(a.fecha || 0)
        const dateB = new Date(b.fecha || 0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener costeos:', error)
    throw error
  }
}

/**
 * Guardar un costeo
 */
export const saveCosteo = async (costeo, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...costeoData } = costeo
    
    const costeosRef = collection(db, 'costeos')
    const docRef = await addDoc(costeosRef, {
      ...costeoData,
      companyId: companyIdToUse,
      fecha: costeoData.fecha || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...costeoData }
  } catch (error) {
    console.error('Error al guardar costeo:', error)
    throw error
  }
}

/**
 * Obtener registros de control de calidad filtrados por companyId
 */
export const getControlCalidad = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const calidadRef = collection(db, 'control_calidad')
    
    try {
      const q = query(
        calidadRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fecha', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const registros = []
      querySnapshot.forEach((doc) => {
        registros.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return registros
    } catch (error) {
      const q = query(calidadRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const registros = []
      querySnapshot.forEach((doc) => {
        registros.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return registros.sort((a, b) => {
        const dateA = new Date(a.fecha || 0)
        const dateB = new Date(b.fecha || 0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener control de calidad:', error)
    throw error
  }
}

/**
 * Guardar un registro de control de calidad
 */
export const saveControlCalidad = async (registro, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...registroData } = registro
    
    const calidadRef = collection(db, 'control_calidad')
    const docRef = await addDoc(calidadRef, {
      ...registroData,
      companyId: companyIdToUse,
      fecha: registroData.fecha || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...registroData }
  } catch (error) {
    console.error('Error al guardar control de calidad:', error)
    throw error
  }
}

/**
 * Actualizar un registro de control de calidad
 */
export const updateControlCalidad = async (registroId, registroData, companyId = null) => {
  try {
    const registroRef = doc(db, 'control_calidad', registroId)
    
    await updateDoc(registroRef, {
      ...registroData,
      updatedAt: serverTimestamp()
    })
    
    return { id: registroId, ...registroData }
  } catch (error) {
    console.error('Error al actualizar control de calidad:', error)
    throw error
  }
}

/**
 * Eliminar un registro de control de calidad
 */
export const deleteControlCalidad = async (registroId) => {
  try {
    const registroRef = doc(db, 'control_calidad', registroId)
    await deleteDoc(registroRef)
    return true
  } catch (error) {
    console.error('Error al eliminar control de calidad:', error)
    throw error
  }
}

// ========== FUNCIONES PARA RECURSOS HUMANOS ==========

/**
 * Obtener personal/empleados filtrados por companyId
 */
export const getPersonal = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const personalRef = collection(db, 'personal')
    
    try {
      const q = query(
        personalRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const personal = []
      querySnapshot.forEach((doc) => {
        personal.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return personal
    } catch (error) {
      const q = query(personalRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const personal = []
      querySnapshot.forEach((doc) => {
        personal.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return personal.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0)
        const dateB = b.createdAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener personal:', error)
    throw error
  }
}

/**
 * Guardar un empleado
 */
export const savePersonal = async (empleado, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...empleadoData } = empleado
    
    const personalRef = collection(db, 'personal')
    const docRef = await addDoc(personalRef, {
      ...empleadoData,
      companyId: companyIdToUse,
      estado: empleadoData.estado || 'Activo',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...empleadoData }
  } catch (error) {
    console.error('Error al guardar empleado:', error)
    throw error
  }
}

/**
 * Actualizar un empleado
 */
export const updatePersonal = async (empleadoId, empleadoData, companyId = null) => {
  try {
    const empleadoRef = doc(db, 'personal', empleadoId)
    
    await updateDoc(empleadoRef, {
      ...empleadoData,
      updatedAt: serverTimestamp()
    })
    
    return { id: empleadoId, ...empleadoData }
  } catch (error) {
    console.error('Error al actualizar empleado:', error)
    throw error
  }
}

/**
 * Eliminar un empleado
 */
export const deletePersonal = async (empleadoId) => {
  try {
    const empleadoRef = doc(db, 'personal', empleadoId)
    await deleteDoc(empleadoRef)
    return true
  } catch (error) {
    console.error('Error al eliminar empleado:', error)
    throw error
  }
}

/**
 * Obtener asistencias filtradas por companyId
 */
export const getAsistencias = async (companyId = null, fechaDesde = null, fechaHasta = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const asistenciasRef = collection(db, 'asistencias')
    
    try {
      const q = query(
        asistenciasRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fecha', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const asistencias = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (!fechaDesde || (data.fecha >= fechaDesde && (!fechaHasta || data.fecha <= fechaHasta))) {
          asistencias.push({
            id: doc.id,
            ...data
          })
        }
      })
      
      return asistencias
    } catch (error) {
      const q = query(asistenciasRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const asistencias = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (!fechaDesde || (data.fecha >= fechaDesde && (!fechaHasta || data.fecha <= fechaHasta))) {
          asistencias.push({
            id: doc.id,
            ...data
          })
        }
      })
      
      return asistencias.sort((a, b) => {
        const dateA = new Date(a.fecha || 0)
        const dateB = new Date(b.fecha || 0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener asistencias:', error)
    throw error
  }
}

/**
 * Guardar una asistencia
 */
export const saveAsistencia = async (asistencia, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...asistenciaData } = asistencia
    
    const asistenciasRef = collection(db, 'asistencias')
    const docRef = await addDoc(asistenciasRef, {
      ...asistenciaData,
      companyId: companyIdToUse,
      fecha: asistenciaData.fecha || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...asistenciaData }
  } catch (error) {
    console.error('Error al guardar asistencia:', error)
    throw error
  }
}

/**
 * Actualizar una asistencia
 */
export const updateAsistencia = async (asistenciaId, asistenciaData, companyId = null) => {
  try {
    const asistenciaRef = doc(db, 'asistencias', asistenciaId)
    
    await updateDoc(asistenciaRef, {
      ...asistenciaData,
      updatedAt: serverTimestamp()
    })
    
    return { id: asistenciaId, ...asistenciaData }
  } catch (error) {
    console.error('Error al actualizar asistencia:', error)
    throw error
  }
}

/**
 * Obtener nóminas filtradas por companyId
 */
export const getNominas = async (companyId = null, periodo = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const nominasRef = collection(db, 'nominas')
    
    try {
      const q = query(
        nominasRef,
        where('companyId', '==', companyIdToUse),
        orderBy('periodo', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const nominas = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (!periodo || data.periodo === periodo) {
          nominas.push({
            id: doc.id,
            ...data
          })
        }
      })
      
      return nominas
    } catch (error) {
      const q = query(nominasRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const nominas = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (!periodo || data.periodo === periodo) {
          nominas.push({
            id: doc.id,
            ...data
          })
        }
      })
      
      return nominas.sort((a, b) => {
        return (b.periodo || '').localeCompare(a.periodo || '')
      })
    }
  } catch (error) {
    console.error('Error al obtener nóminas:', error)
    throw error
  }
}

/**
 * Guardar una nómina
 */
export const saveNomina = async (nomina, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...nominaData } = nomina
    
    const nominasRef = collection(db, 'nominas')
    const docRef = await addDoc(nominasRef, {
      ...nominaData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...nominaData }
  } catch (error) {
    console.error('Error al guardar nómina:', error)
    throw error
  }
}

/**
 * Actualizar una nómina
 */
export const updateNomina = async (nominaId, nominaData, companyId = null) => {
  try {
    const nominaRef = doc(db, 'nominas', nominaId)
    
    await updateDoc(nominaRef, {
      ...nominaData,
      updatedAt: serverTimestamp()
    })
    
    return { id: nominaId, ...nominaData }
  } catch (error) {
    console.error('Error al actualizar nómina:', error)
    throw error
  }
}

/**
 * Obtener registros de talento humano filtrados por companyId
 */
export const getTalentoHumano = async (companyId = null, tipo = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const talentoRef = collection(db, 'talento_humano')
    
    try {
      const q = query(
        talentoRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const registros = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (!tipo || data.tipo === tipo) {
          registros.push({
            id: doc.id,
            ...data
          })
        }
      })
      
      return registros
    } catch (error) {
      const q = query(talentoRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const registros = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (!tipo || data.tipo === tipo) {
          registros.push({
            id: doc.id,
            ...data
          })
        }
      })
      
      return registros.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0)
        const dateB = b.createdAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener talento humano:', error)
    throw error
  }
}

/**
 * Guardar un registro de talento humano
 */
export const saveTalentoHumano = async (registro, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...registroData } = registro
    
    const talentoRef = collection(db, 'talento_humano')
    const docRef = await addDoc(talentoRef, {
      ...registroData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...registroData }
  } catch (error) {
    console.error('Error al guardar talento humano:', error)
    throw error
  }
}

/**
 * Actualizar un registro de talento humano
 */
export const updateTalentoHumano = async (registroId, registroData, companyId = null) => {
  try {
    const registroRef = doc(db, 'talento_humano', registroId)
    
    await updateDoc(registroRef, {
      ...registroData,
      updatedAt: serverTimestamp()
    })
    
    return { id: registroId, ...registroData }
  } catch (error) {
    console.error('Error al actualizar talento humano:', error)
    throw error
  }
}

/**
 * Eliminar un registro de talento humano
 */
export const deleteTalentoHumano = async (registroId) => {
  try {
    const registroRef = doc(db, 'talento_humano', registroId)
    await deleteDoc(registroRef)
    return true
  } catch (error) {
    console.error('Error al eliminar talento humano:', error)
    throw error
  }
}

// ========== FUNCIONES PARA PROYECTOS ==========

/**
 * Obtener proyectos filtrados por companyId
 */
export const getProyectos = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const proyectosRef = collection(db, 'proyectos')
    
    try {
      const q = query(
        proyectosRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fechaInicio', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const proyectos = []
      querySnapshot.forEach((doc) => {
        proyectos.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return proyectos
    } catch (error) {
      const q = query(proyectosRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const proyectos = []
      querySnapshot.forEach((doc) => {
        proyectos.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return proyectos.sort((a, b) => {
        const dateA = new Date(a.fechaInicio || 0)
        const dateB = new Date(b.fechaInicio || 0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener proyectos:', error)
    throw error
  }
}

/**
 * Guardar un proyecto
 */
export const saveProyecto = async (proyecto, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...proyectoData } = proyecto
    
    const proyectosRef = collection(db, 'proyectos')
    const docRef = await addDoc(proyectosRef, {
      ...proyectoData,
      companyId: companyIdToUse,
      estado: proyectoData.estado || 'En Planificación',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...proyectoData }
  } catch (error) {
    console.error('Error al guardar proyecto:', error)
    throw error
  }
}

/**
 * Actualizar un proyecto
 */
export const updateProyecto = async (proyectoId, proyectoData, companyId = null) => {
  try {
    const proyectoRef = doc(db, 'proyectos', proyectoId)
    
    await updateDoc(proyectoRef, {
      ...proyectoData,
      updatedAt: serverTimestamp()
    })
    
    return { id: proyectoId, ...proyectoData }
  } catch (error) {
    console.error('Error al actualizar proyecto:', error)
    throw error
  }
}

/**
 * Eliminar un proyecto
 */
export const deleteProyecto = async (proyectoId) => {
  try {
    const proyectoRef = doc(db, 'proyectos', proyectoId)
    await deleteDoc(proyectoRef)
    return true
  } catch (error) {
    console.error('Error al eliminar proyecto:', error)
    throw error
  }
}

/**
 * Obtener tareas filtradas por companyId y proyectoId (opcional)
 */
export const getTareas = async (companyId = null, proyectoId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const tareasRef = collection(db, 'tareas')
    
    let q
    if (proyectoId) {
      try {
        q = query(
          tareasRef,
          where('companyId', '==', companyIdToUse),
          where('proyectoId', '==', proyectoId),
          orderBy('fechaCreacion', 'desc')
        )
      } catch (error) {
        q = query(
          tareasRef,
          where('companyId', '==', companyIdToUse),
          where('proyectoId', '==', proyectoId)
        )
      }
    } else {
      try {
        q = query(
          tareasRef,
          where('companyId', '==', companyIdToUse),
          orderBy('fechaCreacion', 'desc')
        )
      } catch (error) {
        q = query(tareasRef, where('companyId', '==', companyIdToUse))
      }
    }
    
    const querySnapshot = await getDocs(q)
    const tareas = []
    
    querySnapshot.forEach((doc) => {
      tareas.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return tareas
  } catch (error) {
    console.error('Error al obtener tareas:', error)
    throw error
  }
}

/**
 * Guardar una tarea
 */
export const saveTarea = async (tarea, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...tareaData } = tarea
    
    const tareasRef = collection(db, 'tareas')
    const docRef = await addDoc(tareasRef, {
      ...tareaData,
      companyId: companyIdToUse,
      estado: tareaData.estado || 'Pendiente',
      fechaCreacion: tareaData.fechaCreacion || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...tareaData }
  } catch (error) {
    console.error('Error al guardar tarea:', error)
    throw error
  }
}

/**
 * Actualizar una tarea
 */
export const updateTarea = async (tareaId, tareaData, companyId = null) => {
  try {
    const tareaRef = doc(db, 'tareas', tareaId)
    
    await updateDoc(tareaRef, {
      ...tareaData,
      updatedAt: serverTimestamp()
    })
    
    return { id: tareaId, ...tareaData }
  } catch (error) {
    console.error('Error al actualizar tarea:', error)
    throw error
  }
}

/**
 * Eliminar una tarea
 */
export const deleteTarea = async (tareaId) => {
  try {
    const tareaRef = doc(db, 'tareas', tareaId)
    await deleteDoc(tareaRef)
    return true
  } catch (error) {
    console.error('Error al eliminar tarea:', error)
    throw error
  }
}

/**
 * Obtener asignaciones de recursos filtradas por companyId y proyectoId (opcional)
 */
export const getAsignacionesRecursos = async (companyId = null, proyectoId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const asignacionesRef = collection(db, 'asignaciones_recursos')
    
    let q
    if (proyectoId) {
      try {
        q = query(
          asignacionesRef,
          where('companyId', '==', companyIdToUse),
          where('proyectoId', '==', proyectoId)
        )
      } catch (error) {
        q = query(
          asignacionesRef,
          where('companyId', '==', companyIdToUse),
          where('proyectoId', '==', proyectoId)
        )
      }
    } else {
      q = query(asignacionesRef, where('companyId', '==', companyIdToUse))
    }
    
    const querySnapshot = await getDocs(q)
    const asignaciones = []
    
    querySnapshot.forEach((doc) => {
      asignaciones.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return asignaciones
  } catch (error) {
    console.error('Error al obtener asignaciones de recursos:', error)
    throw error
  }
}

/**
 * Guardar una asignación de recurso
 */
export const saveAsignacionRecurso = async (asignacion, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...asignacionData } = asignacion
    
    const asignacionesRef = collection(db, 'asignaciones_recursos')
    const docRef = await addDoc(asignacionesRef, {
      ...asignacionData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...asignacionData }
  } catch (error) {
    console.error('Error al guardar asignación de recurso:', error)
    throw error
  }
}

/**
 * Actualizar una asignación de recurso
 */
export const updateAsignacionRecurso = async (asignacionId, asignacionData, companyId = null) => {
  try {
    const asignacionRef = doc(db, 'asignaciones_recursos', asignacionId)
    
    await updateDoc(asignacionRef, {
      ...asignacionData,
      updatedAt: serverTimestamp()
    })
    
    return { id: asignacionId, ...asignacionData }
  } catch (error) {
    console.error('Error al actualizar asignación de recurso:', error)
    throw error
  }
}

/**
 * Eliminar una asignación de recurso
 */
export const deleteAsignacionRecurso = async (asignacionId) => {
  try {
    const asignacionRef = doc(db, 'asignaciones_recursos', asignacionId)
    await deleteDoc(asignacionRef)
    return true
  } catch (error) {
    console.error('Error al eliminar asignación de recurso:', error)
    throw error
  }
}

/**
 * Obtener costos de proyectos filtrados por companyId y proyectoId (opcional)
 */
export const getCostosProyecto = async (companyId = null, proyectoId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const costosRef = collection(db, 'costos_proyecto')
    
    let q
    if (proyectoId) {
      q = query(
        costosRef,
        where('companyId', '==', companyIdToUse),
        where('proyectoId', '==', proyectoId)
      )
    } else {
      q = query(costosRef, where('companyId', '==', companyIdToUse))
    }
    
    const querySnapshot = await getDocs(q)
    const costos = []
    
    querySnapshot.forEach((doc) => {
      costos.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return costos
  } catch (error) {
    console.error('Error al obtener costos de proyecto:', error)
    throw error
  }
}

/**
 * Guardar un costo de proyecto
 */
export const saveCostoProyecto = async (costo, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...costoData } = costo
    
    const costosRef = collection(db, 'costos_proyecto')
    const docRef = await addDoc(costosRef, {
      ...costoData,
      companyId: companyIdToUse,
      fecha: costoData.fecha || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...costoData }
  } catch (error) {
    console.error('Error al guardar costo de proyecto:', error)
    throw error
  }
}

/**
 * Actualizar un costo de proyecto
 */
export const updateCostoProyecto = async (costoId, costoData, companyId = null) => {
  try {
    const costoRef = doc(db, 'costos_proyecto', costoId)
    
    await updateDoc(costoRef, {
      ...costoData,
      updatedAt: serverTimestamp()
    })
    
    return { id: costoId, ...costoData }
  } catch (error) {
    console.error('Error al actualizar costo de proyecto:', error)
    throw error
  }
}

/**
 * Eliminar un costo de proyecto
 */
export const deleteCostoProyecto = async (costoId) => {
  try {
    const costoRef = doc(db, 'costos_proyecto', costoId)
    await deleteDoc(costoRef)
    return true
  } catch (error) {
    console.error('Error al eliminar costo de proyecto:', error)
    throw error
  }
}

// ========== FUNCIONES PARA OPORTUNIDADES ==========

/**
 * Obtener todas las oportunidades desde Firebase filtradas por companyId
 */
export const getOportunidades = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const oportunidadesRef = collection(db, 'oportunidades')
    
    let querySnapshot
    try {
      const q = query(
        oportunidadesRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (error) {
      // Si falla el orderBy, intentar solo con el filtro de companyId
      try {
        const q = query(oportunidadesRef, where('companyId', '==', companyIdToUse))
        querySnapshot = await getDocs(q)
      } catch (filterError) {
        // Si también falla el filtro, obtener todos y filtrar en memoria
        console.warn('No se pudo filtrar por companyId en la query, filtrando en memoria:', filterError)
        const allSnapshot = await getDocs(oportunidadesRef)
        const oportunidades = []
        allSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.companyId === companyIdToUse) {
            oportunidades.push({
              id: doc.id,
              ...data
            })
          }
        })
        return oportunidades
      }
    }
    
    const oportunidades = []
    querySnapshot.forEach((doc) => {
      oportunidades.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return oportunidades
  } catch (error) {
    console.error('Error al obtener oportunidades:', error)
    throw error
  }
}

/**
 * Guardar una nueva oportunidad en Firebase
 */
export const saveOportunidad = async (oportunidad, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...oportunidadData } = oportunidad
    
    const oportunidadesRef = collection(db, 'oportunidades')
    const docRef = await addDoc(oportunidadesRef, {
      ...oportunidadData,
      companyId: companyIdToUse,
      estado: oportunidadData.estado || 'Lead Nuevo',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...oportunidadData }
  } catch (error) {
    console.error('Error al guardar oportunidad:', error)
    throw error
  }
}

/**
 * Actualizar una oportunidad existente en Firebase
 */
export const updateOportunidad = async (oportunidadId, oportunidadData, companyId = null) => {
  try {
    const oportunidadRef = doc(db, 'oportunidades', oportunidadId)
    
    await updateDoc(oportunidadRef, {
      ...oportunidadData,
      updatedAt: serverTimestamp()
    })
    
    return { id: oportunidadId, ...oportunidadData }
  } catch (error) {
    console.error('Error al actualizar oportunidad:', error)
    throw error
  }
}

/**
 * Eliminar una oportunidad de Firebase
 */
export const deleteOportunidad = async (oportunidadId) => {
  try {
    const oportunidadRef = doc(db, 'oportunidades', oportunidadId)
    await deleteDoc(oportunidadRef)
    return true
  } catch (error) {
    console.error('Error al eliminar oportunidad:', error)
    throw error
  }
}

// ========== FUNCIONES PARA LEADS ==========

/**
 * Obtener todos los leads desde Firebase filtrados por companyId
 */
export const getLeads = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const leadsRef = collection(db, 'leads')
    
    let querySnapshot
    try {
      const q = query(
        leadsRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (error) {
      // Si falla el orderBy, intentar solo con el filtro de companyId
      try {
        const q = query(leadsRef, where('companyId', '==', companyIdToUse))
        querySnapshot = await getDocs(q)
      } catch (filterError) {
        // Si también falla el filtro, obtener todos y filtrar en memoria
        console.warn('No se pudo filtrar por companyId en la query, filtrando en memoria:', filterError)
        const allSnapshot = await getDocs(leadsRef)
        const leads = []
        allSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.companyId === companyIdToUse) {
            leads.push({
              id: doc.id,
              ...data
            })
          }
        })
        return leads
      }
    }
    
    const leads = []
    querySnapshot.forEach((doc) => {
      leads.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return leads
  } catch (error) {
    console.error('Error al obtener leads:', error)
    throw error
  }
}

/**
 * Guardar un nuevo lead en Firebase
 */
export const saveLead = async (lead, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...leadData } = lead
    
    const leadsRef = collection(db, 'leads')
    const docRef = await addDoc(leadsRef, {
      ...leadData,
      companyId: companyIdToUse,
      estado: leadData.estado || 'Nuevo',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...leadData }
  } catch (error) {
    console.error('Error al guardar lead:', error)
    throw error
  }
}

/**
 * Actualizar un lead existente en Firebase
 */
export const updateLead = async (leadId, leadData, companyId = null) => {
  try {
    const leadRef = doc(db, 'leads', leadId)
    
    await updateDoc(leadRef, {
      ...leadData,
      updatedAt: serverTimestamp()
    })
    
    return { id: leadId, ...leadData }
  } catch (error) {
    console.error('Error al actualizar lead:', error)
    throw error
  }
}

/**
 * Eliminar un lead de Firebase
 */
export const deleteLead = async (leadId) => {
  try {
    const leadRef = doc(db, 'leads', leadId)
    await deleteDoc(leadRef)
    return true
  } catch (error) {
    console.error('Error al eliminar lead:', error)
    throw error
  }
}

// ========== FUNCIONES PARA ACTIVIDADES ==========

/**
 * Obtener todas las actividades desde Firebase filtradas por companyId
 */
export const getActividades = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const actividadesRef = collection(db, 'actividades')
    
    let querySnapshot
    try {
      const q = query(
        actividadesRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fecha', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (error) {
      // Si falla el orderBy, intentar solo con el filtro de companyId
      try {
        const q = query(actividadesRef, where('companyId', '==', companyIdToUse))
        querySnapshot = await getDocs(q)
      } catch (filterError) {
        // Si también falla el filtro, obtener todos y filtrar en memoria
        console.warn('No se pudo filtrar por companyId en la query, filtrando en memoria:', filterError)
        const allSnapshot = await getDocs(actividadesRef)
        const actividades = []
        allSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.companyId === companyIdToUse) {
            actividades.push({
              id: doc.id,
              ...data
            })
          }
        })
        return actividades
      }
    }
    
    const actividades = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      actividades.push({
        id: doc.id,
        ...data,
        fecha: data.fecha || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
      })
    })
    
    return actividades
  } catch (error) {
    console.error('Error al obtener actividades:', error)
    throw error
  }
}

/**
 * Guardar una nueva actividad en Firebase
 */
export const saveActividad = async (actividad, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...actividadData } = actividad
    
    const actividadesRef = collection(db, 'actividades')
    const docRef = await addDoc(actividadesRef, {
      ...actividadData,
      companyId: companyIdToUse,
      estado: actividadData.estado || 'pendiente',
      fecha: actividadData.fecha || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...actividadData }
  } catch (error) {
    console.error('Error al guardar actividad:', error)
    throw error
  }
}

/**
 * Actualizar una actividad existente en Firebase
 */
export const updateActividad = async (actividadId, actividadData, companyId = null) => {
  try {
    const actividadRef = doc(db, 'actividades', actividadId)
    
    await updateDoc(actividadRef, {
      ...actividadData,
      updatedAt: serverTimestamp()
    })
    
    return { id: actividadId, ...actividadData }
  } catch (error) {
    console.error('Error al actualizar actividad:', error)
    throw error
  }
}

/**
 * Eliminar una actividad de Firebase
 */
export const deleteActividad = async (actividadId) => {
  try {
    const actividadRef = doc(db, 'actividades', actividadId)
    await deleteDoc(actividadRef)
    return true
  } catch (error) {
    console.error('Error al eliminar actividad:', error)
    throw error
  }
}

// ========== FUNCIONES PARA CONTACTOS ==========

/**
 * Obtener todos los contactos desde Firebase filtrados por companyId
 */
export const getContactos = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const contactosRef = collection(db, 'contactos')
    
    let querySnapshot
    try {
      const q = query(
        contactosRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (error) {
      // Si falla el orderBy, intentar solo con el filtro de companyId
      try {
        const q = query(contactosRef, where('companyId', '==', companyIdToUse))
        querySnapshot = await getDocs(q)
      } catch (filterError) {
        // Si también falla el filtro, obtener todos y filtrar en memoria
        console.warn('No se pudo filtrar por companyId en la query, filtrando en memoria:', filterError)
        const allSnapshot = await getDocs(contactosRef)
        const contactos = []
        allSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.companyId === companyIdToUse) {
            contactos.push({
              id: doc.id,
              ...data
            })
          }
        })
        return contactos
      }
    }
    
    const contactos = []
    querySnapshot.forEach((doc) => {
      contactos.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return contactos
  } catch (error) {
    console.error('Error al obtener contactos:', error)
    throw error
  }
}

/**
 * Guardar un nuevo contacto en Firebase
 */
export const saveContacto = async (contacto, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...contactoData } = contacto
    
    const contactosRef = collection(db, 'contactos')
    const docRef = await addDoc(contactosRef, {
      ...contactoData,
      companyId: companyIdToUse,
      estado: contactoData.estado || 'Tibio',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...contactoData }
  } catch (error) {
    console.error('Error al guardar contacto:', error)
    throw error
  }
}

/**
 * Actualizar un contacto existente en Firebase
 */
export const updateContacto = async (contactoId, contactoData, companyId = null) => {
  try {
    const contactoRef = doc(db, 'contactos', contactoId)
    
    await updateDoc(contactoRef, {
      ...contactoData,
      updatedAt: serverTimestamp()
    })
    
    return { id: contactoId, ...contactoData }
  } catch (error) {
    console.error('Error al actualizar contacto:', error)
    throw error
  }
}

/**
 * Eliminar un contacto de Firebase
 */
export const deleteContacto = async (contactoId) => {
  try {
    const contactoRef = doc(db, 'contactos', contactoId)
    await deleteDoc(contactoRef)
    return true
  } catch (error) {
    console.error('Error al eliminar contacto:', error)
    throw error
  }
}

// ========== FUNCIONES PARA PROVEEDORES (Completar CRUD) ==========

/**
 * Actualizar un proveedor existente
 */
export const updateProveedor = async (proveedorId, proveedorData, companyId = null) => {
  try {
    const proveedorRef = doc(db, 'proveedores', proveedorId)
    
    await updateDoc(proveedorRef, {
      ...proveedorData,
      updatedAt: serverTimestamp()
    })
    
    return { id: proveedorId, ...proveedorData }
  } catch (error) {
    console.error('Error al actualizar proveedor:', error)
    throw error
  }
}

/**
 * Eliminar un proveedor
 */
export const deleteProveedor = async (proveedorId) => {
  try {
    const proveedorRef = doc(db, 'proveedores', proveedorId)
    await deleteDoc(proveedorRef)
    return true
  } catch (error) {
    console.error('Error al eliminar proveedor:', error)
    throw error
  }
}

// ========== FUNCIONES PARA COURRIERS ==========

/**
 * Obtener courriers filtrados por companyId
 */
export const getCourriers = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const courriersRef = collection(db, 'courriers')
    
    try {
      const q = query(
        courriersRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const courriers = []
      querySnapshot.forEach((doc) => {
        courriers.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return courriers
    } catch (error) {
      // Si falla el orderBy, intentar solo con el filtro
      const q = query(courriersRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const courriers = []
      querySnapshot.forEach((doc) => {
        courriers.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return courriers.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0)
        const dateB = b.createdAt?.toDate?.() || new Date(0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener courriers:', error)
    throw error
  }
}

/**
 * Guardar un courrier
 */
export const saveCourrier = async (courrier, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...courrierData } = courrier
    
    const courriersRef = collection(db, 'courriers')
    const docRef = await addDoc(courriersRef, {
      ...courrierData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...courrierData }
  } catch (error) {
    console.error('Error al guardar courrier:', error)
    throw error
  }
}

/**
 * Actualizar un courrier
 */
export const updateCourrier = async (courrierId, courrierData, companyId = null) => {
  try {
    const courrierRef = doc(db, 'courriers', courrierId)
    
    await updateDoc(courrierRef, {
      ...courrierData,
      updatedAt: serverTimestamp()
    })
    
    return { id: courrierId, ...courrierData }
  } catch (error) {
    console.error('Error al actualizar courrier:', error)
    throw error
  }
}

/**
 * Eliminar un courrier
 */
export const deleteCourrier = async (courrierId) => {
  try {
    const courrierRef = doc(db, 'courriers', courrierId)
    await deleteDoc(courrierRef)
    return true
  } catch (error) {
    console.error('Error al eliminar courrier:', error)
    throw error
  }
}

// ========== FUNCIONES PARA GESTIÓN DOCUMENTAL ==========

/**
 * Obtener documentos filtrados por companyId
 */
export const getDocumentos = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const documentosRef = collection(db, 'documentos')
    
    try {
      const q = query(
        documentosRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fechaCreacion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const documentos = []
      querySnapshot.forEach((doc) => {
        documentos.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return documentos
    } catch (error) {
      const q = query(documentosRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const documentos = []
      querySnapshot.forEach((doc) => {
        documentos.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return documentos.sort((a, b) => {
        const dateA = a.fechaCreacion?.toDate?.() || new Date(a.createdAt || 0)
        const dateB = b.fechaCreacion?.toDate?.() || new Date(b.createdAt || 0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener documentos:', error)
    throw error
  }
}

/**
 * Guardar un documento
 */
export const saveDocumento = async (documento, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...documentoData } = documento
    
    const documentosRef = collection(db, 'documentos')
    const docRef = await addDoc(documentosRef, {
      ...documentoData,
      companyId: companyIdToUse,
      versionActual: documentoData.versionActual || '1.0',
      estado: documentoData.estado || 'Borrador',
      fechaCreacion: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...documentoData }
  } catch (error) {
    console.error('Error al guardar documento:', error)
    throw error
  }
}

/**
 * Actualizar un documento
 */
export const updateDocumento = async (documentoId, documentoData, companyId = null) => {
  try {
    const documentoRef = doc(db, 'documentos', documentoId)
    
    await updateDoc(documentoRef, {
      ...documentoData,
      updatedAt: serverTimestamp()
    })
    
    return { id: documentoId, ...documentoData }
  } catch (error) {
    console.error('Error al actualizar documento:', error)
    throw error
  }
}

/**
 * Eliminar un documento
 */
export const deleteDocumento = async (documentoId) => {
  try {
    const documentoRef = doc(db, 'documentos', documentoId)
    await deleteDoc(documentoRef)
    return true
  } catch (error) {
    console.error('Error al eliminar documento:', error)
    throw error
  }
}

/**
 * Obtener versiones de un documento
 */
export const getVersionesDocumento = async (documentoId, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const versionesRef = collection(db, 'documentos', documentoId, 'versiones')
    
    try {
      const q = query(
        versionesRef,
        where('companyId', '==', companyIdToUse),
        orderBy('numeroVersion', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const versiones = []
      querySnapshot.forEach((doc) => {
        versiones.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return versiones
    } catch (error) {
      const q = query(versionesRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const versiones = []
      querySnapshot.forEach((doc) => {
        versiones.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return versiones.sort((a, b) => parseFloat(b.numeroVersion || 0) - parseFloat(a.numeroVersion || 0))
    }
  } catch (error) {
    console.error('Error al obtener versiones:', error)
    throw error
  }
}

/**
 * Crear una nueva versión de un documento
 */
export const crearVersionDocumento = async (documentoId, versionData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const versionesRef = collection(db, 'documentos', documentoId, 'versiones')
    
    const usuarioActual = localStorage.getItem('cubic_usuario') || 'Admin Usuario'
    
    const docRef = await addDoc(versionesRef, {
      ...versionData,
      companyId: companyIdToUse,
      creadoPor: usuarioActual,
      fechaCreacion: serverTimestamp(),
      createdAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...versionData }
  } catch (error) {
    console.error('Error al crear versión:', error)
    throw error
  }
}

/**
 * Obtener flujos de aprobación filtrados por companyId
 */
export const getFlujosAprobacion = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const flujosRef = collection(db, 'flujos_aprobacion')
    
    try {
      const q = query(
        flujosRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const flujos = []
      querySnapshot.forEach((doc) => {
        flujos.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return flujos
    } catch (error) {
      const q = query(flujosRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const flujos = []
      querySnapshot.forEach((doc) => {
        flujos.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return flujos
    }
  } catch (error) {
    console.error('Error al obtener flujos de aprobación:', error)
    throw error
  }
}

/**
 * Guardar un flujo de aprobación
 */
export const saveFlujoAprobacion = async (flujo, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...flujoData } = flujo
    
    const flujosRef = collection(db, 'flujos_aprobacion')
    const docRef = await addDoc(flujosRef, {
      ...flujoData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...flujoData }
  } catch (error) {
    console.error('Error al guardar flujo de aprobación:', error)
    throw error
  }
}

/**
 * Actualizar un flujo de aprobación
 */
export const updateFlujoAprobacion = async (flujoId, flujoData, companyId = null) => {
  try {
    const flujoRef = doc(db, 'flujos_aprobacion', flujoId)
    
    await updateDoc(flujoRef, {
      ...flujoData,
      updatedAt: serverTimestamp()
    })
    
    return { id: flujoId, ...flujoData }
  } catch (error) {
    console.error('Error al actualizar flujo de aprobación:', error)
    throw error
  }
}

/**
 * Eliminar un flujo de aprobación
 */
export const deleteFlujoAprobacion = async (flujoId) => {
  try {
    const flujoRef = doc(db, 'flujos_aprobacion', flujoId)
    await deleteDoc(flujoRef)
    return true
  } catch (error) {
    console.error('Error al eliminar flujo de aprobación:', error)
    throw error
  }
}

/**
 * Obtener aprobaciones de un documento
 */
export const getAprobacionesDocumento = async (documentoId, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const aprobacionesRef = collection(db, 'documentos', documentoId, 'aprobaciones')
    
    const q = query(aprobacionesRef, where('companyId', '==', companyIdToUse))
    const querySnapshot = await getDocs(q)
    
    const aprobaciones = []
    querySnapshot.forEach((doc) => {
      aprobaciones.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return aprobaciones.sort((a, b) => {
      const fechaA = a.fechaAprobacion?.toDate?.() || new Date(a.createdAt || 0)
      const fechaB = b.fechaAprobacion?.toDate?.() || new Date(b.createdAt || 0)
      return fechaB - fechaA
    })
  } catch (error) {
    console.error('Error al obtener aprobaciones:', error)
    throw error
  }
}

/**
 * Crear/Actualizar aprobación de un documento
 */
export const saveAprobacionDocumento = async (documentoId, aprobacionData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const aprobacionesRef = collection(db, 'documentos', documentoId, 'aprobaciones')
    
    const usuarioActual = localStorage.getItem('cubic_usuario') || 'Admin Usuario'
    
    const docRef = await addDoc(aprobacionesRef, {
      ...aprobacionData,
      companyId: companyIdToUse,
      aprobadoPor: usuarioActual,
      fechaAprobacion: serverTimestamp(),
      createdAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...aprobacionData }
  } catch (error) {
    console.error('Error al guardar aprobación:', error)
    throw error
  }
}

// ========== FUNCIONES PARA ADMINISTRACIÓN Y SEGURIDAD ==========

/**
 * Obtener roles y permisos
 */
export const getRoles = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const rolesRef = collection(db, 'roles')
    
    try {
      const q = query(
        rolesRef,
        where('companyId', '==', companyIdToUse),
        orderBy('nombre', 'asc')
      )
      const querySnapshot = await getDocs(q)
      
      const roles = []
      querySnapshot.forEach((doc) => {
        roles.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return roles
    } catch (error) {
      const q = query(rolesRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const roles = []
      querySnapshot.forEach((doc) => {
        roles.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return roles.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
    }
  } catch (error) {
    console.error('Error al obtener roles:', error)
    throw error
  }
}

/**
 * Guardar un rol
 */
export const saveRol = async (rol, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...rolData } = rol
    
    const rolesRef = collection(db, 'roles')
    const docRef = await addDoc(rolesRef, {
      ...rolData,
      companyId: companyIdToUse,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...rolData }
  } catch (error) {
    console.error('Error al guardar rol:', error)
    throw error
  }
}

/**
 * Actualizar un rol
 */
export const updateRol = async (rolId, rolData, companyId = null) => {
  try {
    const rolRef = doc(db, 'roles', rolId)
    
    await updateDoc(rolRef, {
      ...rolData,
      updatedAt: serverTimestamp()
    })
    
    return { id: rolId, ...rolData }
  } catch (error) {
    console.error('Error al actualizar rol:', error)
    throw error
  }
}

/**
 * Eliminar un rol
 */
export const deleteRol = async (rolId) => {
  try {
    const rolRef = doc(db, 'roles', rolId)
    await deleteDoc(rolRef)
    return true
  } catch (error) {
    console.error('Error al eliminar rol:', error)
    throw error
  }
}

/**
 * Obtener registros de auditoría
 */
export const getAuditoria = async (companyId = null, fechaDesde = null, fechaHasta = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const auditoriaRef = collection(db, 'auditoria')
    
    let q
    try {
      if (fechaDesde && fechaHasta) {
        q = query(
          auditoriaRef,
          where('companyId', '==', companyIdToUse),
          where('fecha', '>=', fechaDesde),
          where('fecha', '<=', fechaHasta),
          orderBy('fecha', 'desc')
        )
      } else {
        q = query(
          auditoriaRef,
          where('companyId', '==', companyIdToUse),
          orderBy('fecha', 'desc')
        )
      }
      const querySnapshot = await getDocs(q)
      
      const registros = []
      querySnapshot.forEach((doc) => {
        registros.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return registros
    } catch (error) {
      q = query(auditoriaRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
      
      const registros = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (!fechaDesde || (data.fecha >= fechaDesde && (!fechaHasta || data.fecha <= fechaHasta))) {
          registros.push({
            id: doc.id,
            ...data
          })
        }
      })
      
      return registros.sort((a, b) => {
        const dateA = new Date(a.fecha || a.createdAt?.toDate?.() || 0)
        const dateB = new Date(b.fecha || b.createdAt?.toDate?.() || 0)
        return dateB - dateA
      })
    }
  } catch (error) {
    console.error('Error al obtener auditoría:', error)
    throw error
  }
}

/**
 * Guardar registro de auditoría
 */
export const saveAuditoria = async (registro, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const usuarioActual = localStorage.getItem('cubic_usuario') || 'Admin Usuario'
    
    const auditoriaRef = collection(db, 'auditoria')
    await addDoc(auditoriaRef, {
      ...registro,
      companyId: companyIdToUse,
      usuario: usuarioActual,
      fecha: registro.fecha || new Date().toISOString(),
      createdAt: serverTimestamp()
    })
    
    return true
  } catch (error) {
    console.error('Error al guardar auditoría:', error)
    throw error
  }
}

/**
 * Obtener parámetros generales
 */
export const getParametros = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const parametrosRef = collection(db, 'parametros')
    
    const q = query(
      parametrosRef,
      where('companyId', '==', companyIdToUse)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return {}
    }
    
    const parametros = {}
    querySnapshot.forEach((doc) => {
      parametros[doc.id] = {
        id: doc.id,
        ...doc.data()
      }
    })
    
    return parametros
  } catch (error) {
    console.error('Error al obtener parámetros:', error)
    throw error
  }
}

/**
 * Guardar parámetro
 */
export const saveParametro = async (parametro, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, clave, valor, descripcion } = parametro
    
    const parametrosRef = collection(db, 'parametros')
    
    // Buscar si ya existe un parámetro con esta clave
    const q = query(
      parametrosRef,
      where('companyId', '==', companyIdToUse),
      where('clave', '==', clave)
    )
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      // Actualizar existente
      const docRef = querySnapshot.docs[0].ref
      await updateDoc(docRef, {
        valor,
        descripcion,
        updatedAt: serverTimestamp()
      })
      return { id: docRef.id, clave, valor, descripcion }
    } else {
      // Crear nuevo
      const docRef = await addDoc(parametrosRef, {
        clave,
        valor,
        descripcion,
        companyId: companyIdToUse,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return { id: docRef.id, clave, valor, descripcion }
    }
  } catch (error) {
    console.error('Error al guardar parámetro:', error)
    throw error
  }
}

/**
 * Obtener integraciones
 */
export const getIntegraciones = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const integracionesRef = collection(db, 'integraciones')
    
    const q = query(
      integracionesRef,
      where('companyId', '==', companyIdToUse)
    )
    const querySnapshot = await getDocs(q)
    
    const integraciones = []
    querySnapshot.forEach((doc) => {
      integraciones.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return integraciones
  } catch (error) {
    console.error('Error al obtener integraciones:', error)
    throw error
  }
}

/**
 * Guardar integración
 */
export const saveIntegracion = async (integracion, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...integracionData } = integracion
    
    const integracionesRef = collection(db, 'integraciones')
    
    if (id) {
      // Actualizar existente
      const integracionRef = doc(db, 'integraciones', id)
      await updateDoc(integracionRef, {
        ...integracionData,
        updatedAt: serverTimestamp()
      })
      return { id, ...integracionData }
    } else {
      // Crear nuevo
      const docRef = await addDoc(integracionesRef, {
        ...integracionData,
        companyId: companyIdToUse,
        activa: integracionData.activa || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return { id: docRef.id, ...integracionData }
    }
  } catch (error) {
    console.error('Error al guardar integración:', error)
    throw error
  }
}

/**
 * Actualizar estado de integración
 */
export const updateIntegracionEstado = async (integracionId, activa, companyId = null) => {
  try {
    const integracionRef = doc(db, 'integraciones', integracionId)
    
    await updateDoc(integracionRef, {
      activa,
      updatedAt: serverTimestamp()
    })
    
    return true
  } catch (error) {
    console.error('Error al actualizar estado de integración:', error)
    throw error
  }
}

// ========== FUNCIONES PARA SOLICITUDES DE COMPRA ==========

/**
 * Obtener todas las solicitudes de compra desde Firebase filtradas por companyId
 */
export const getSolicitudesCompra = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const solicitudesRef = collection(db, 'solicitudes_compra')
    
    let querySnapshot
    try {
      const q = query(
        solicitudesRef,
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (error) {
      const q = query(solicitudesRef, where('companyId', '==', companyIdToUse))
      querySnapshot = await getDocs(q)
    }
    
    const solicitudes = []
    querySnapshot.forEach((doc) => {
      solicitudes.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return solicitudes
  } catch (error) {
    console.error('Error al obtener solicitudes de compra:', error)
    throw error
  }
}

/**
 * Guardar una nueva solicitud de compra
 */
export const saveSolicitudCompra = async (solicitud, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...solicitudData } = solicitud
    
    const solicitudesRef = collection(db, 'solicitudes_compra')
    const docRef = await addDoc(solicitudesRef, {
      ...solicitudData,
      companyId: companyIdToUse,
      estado: solicitudData.estado || 'pendiente',
      fecha: solicitudData.fecha || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...solicitudData }
  } catch (error) {
    console.error('Error al guardar solicitud de compra:', error)
    throw error
  }
}

/**
 * Actualizar una solicitud de compra existente
 */
export const updateSolicitudCompra = async (solicitudId, solicitudData, companyId = null) => {
  try {
    const solicitudRef = doc(db, 'solicitudes_compra', solicitudId)
    
    await updateDoc(solicitudRef, {
      ...solicitudData,
      updatedAt: serverTimestamp()
    })
    
    return { id: solicitudId, ...solicitudData }
  } catch (error) {
    console.error('Error al actualizar solicitud de compra:', error)
    throw error
  }
}

/**
 * Eliminar una solicitud de compra
 */
export const deleteSolicitudCompra = async (solicitudId) => {
  try {
    const solicitudRef = doc(db, 'solicitudes_compra', solicitudId)
    await deleteDoc(solicitudRef)
    return true
  } catch (error) {
    console.error('Error al eliminar solicitud de compra:', error)
    throw error
  }
}

// ========== FUNCIONES PARA ÓRDENES DE COMPRA ==========

/**
 * Obtener todas las órdenes de compra desde Firebase filtradas por companyId
 */
export const getOrdenesCompra = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const ordenesRef = collection(db, 'ordenes_compra')
    
    let querySnapshot
    try {
      const q = query(
        ordenesRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fecha', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (error) {
      const q = query(ordenesRef, where('companyId', '==', companyIdToUse))
      querySnapshot = await getDocs(q)
    }
    
    const ordenes = []
    querySnapshot.forEach((doc) => {
      ordenes.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return ordenes
  } catch (error) {
    console.error('Error al obtener órdenes de compra:', error)
    throw error
  }
}

/**
 * Guardar una nueva orden de compra
 */
export const saveOrdenCompra = async (orden, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...ordenData } = orden
    
    const ordenesRef = collection(db, 'ordenes_compra')
    const docRef = await addDoc(ordenesRef, {
      ...ordenData,
      companyId: companyIdToUse,
      estado: ordenData.estado || 'pendiente',
      fecha: ordenData.fecha || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...ordenData }
  } catch (error) {
    console.error('Error al guardar orden de compra:', error)
    throw error
  }
}

/**
 * Actualizar una orden de compra existente
 */
export const updateOrdenCompra = async (ordenId, ordenData, companyId = null) => {
  try {
    const ordenRef = doc(db, 'ordenes_compra', ordenId)
    
    await updateDoc(ordenRef, {
      ...ordenData,
      updatedAt: serverTimestamp()
    })
    
    return { id: ordenId, ...ordenData }
  } catch (error) {
    console.error('Error al actualizar orden de compra:', error)
    throw error
  }
}

/**
 * Eliminar una orden de compra
 */
export const deleteOrdenCompra = async (ordenId) => {
  try {
    const ordenRef = doc(db, 'ordenes_compra', ordenId)
    await deleteDoc(ordenRef)
    return true
  } catch (error) {
    console.error('Error al eliminar orden de compra:', error)
    throw error
  }
}

// ========== FUNCIONES PARA RECEPCIÓN Y CONTROL ==========

/**
 * Obtener todas las recepciones desde Firebase filtradas por companyId
 */
export const getRecepciones = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const recepcionesRef = collection(db, 'recepciones')
    
    let querySnapshot
    try {
      const q = query(
        recepcionesRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fechaRecepcion', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (error) {
      const q = query(recepcionesRef, where('companyId', '==', companyIdToUse))
      querySnapshot = await getDocs(q)
    }
    
    const recepciones = []
    querySnapshot.forEach((doc) => {
      recepciones.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return recepciones
  } catch (error) {
    console.error('Error al obtener recepciones:', error)
    throw error
  }
}

/**
 * Guardar una nueva recepción
 */
export const saveRecepcion = async (recepcion, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...recepcionData } = recepcion
    
    const recepcionesRef = collection(db, 'recepciones')
    const docRef = await addDoc(recepcionesRef, {
      ...recepcionData,
      companyId: companyIdToUse,
      estado: recepcionData.estado || 'pendiente',
      fechaRecepcion: recepcionData.fechaRecepcion || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...recepcionData }
  } catch (error) {
    console.error('Error al guardar recepción:', error)
    throw error
  }
}

/**
 * Actualizar una recepción existente
 */
export const updateRecepcion = async (recepcionId, recepcionData, companyId = null) => {
  try {
    const recepcionRef = doc(db, 'recepciones', recepcionId)
    
    await updateDoc(recepcionRef, {
      ...recepcionData,
      updatedAt: serverTimestamp()
    })
    
    return { id: recepcionId, ...recepcionData }
  } catch (error) {
    console.error('Error al actualizar recepción:', error)
    throw error
  }
}

/**
 * Eliminar una recepción
 */
export const deleteRecepcion = async (recepcionId) => {
  try {
    const recepcionRef = doc(db, 'recepciones', recepcionId)
    await deleteDoc(recepcionRef)
    return true
  } catch (error) {
    console.error('Error al eliminar recepción:', error)
    throw error
  }
}

// ========== FUNCIONES PARA EVALUACIÓN DE PROVEEDORES ==========

/**
 * Obtener evaluaciones de proveedores desde Firebase
 */
export const getEvaluacionesProveedores = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const evaluacionesRef = collection(db, 'evaluaciones_proveedores')
    
    let querySnapshot
    try {
      const q = query(
        evaluacionesRef,
        where('companyId', '==', companyIdToUse),
        orderBy('fechaEvaluacion', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (error) {
      const q = query(evaluacionesRef, where('companyId', '==', companyIdToUse))
      querySnapshot = await getDocs(q)
    }
    
    const evaluaciones = []
    querySnapshot.forEach((doc) => {
      evaluaciones.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return evaluaciones
  } catch (error) {
    console.error('Error al obtener evaluaciones:', error)
    throw error
  }
}

/**
 * Guardar una nueva evaluación de proveedor
 */
export const saveEvaluacionProveedor = async (evaluacion, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const { id, ...evaluacionData } = evaluacion
    
    const evaluacionesRef = collection(db, 'evaluaciones_proveedores')
    const docRef = await addDoc(evaluacionesRef, {
      ...evaluacionData,
      companyId: companyIdToUse,
      fechaEvaluacion: evaluacionData.fechaEvaluacion || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { id: docRef.id, ...evaluacionData }
  } catch (error) {
    console.error('Error al guardar evaluación:', error)
    throw error
  }
}

/**
 * Calcular estadísticas de evaluación de un proveedor basado en recepciones y órdenes
 */
export const calcularEstadisticasProveedor = async (proveedorId, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    // Obtener órdenes del proveedor
    const ordenes = await getOrdenesCompra(companyIdToUse)
    const ordenesProveedor = ordenes.filter(o => o.proveedorId === proveedorId)
    
    // Obtener recepciones relacionadas
    const recepciones = await getRecepciones(companyIdToUse)
    const recepcionesProveedor = recepciones.filter(r => 
      ordenesProveedor.some(o => o.id === r.ordenCompraId)
    )
    
    // Calcular métricas
    const totalOrdenes = ordenesProveedor.length
    const totalRecepciones = recepcionesProveedor.length
    const recepcionesCompletas = recepcionesProveedor.filter(r => r.estado === 'completa').length
    const recepcionesConIncidencias = recepcionesProveedor.filter(r => 
      r.incidencias && r.incidencias.length > 0
    ).length
    
    // Calcular puntualidad (comparar fecha recepción con fecha esperada)
    const recepcionesPuntuales = recepcionesProveedor.filter(r => {
      if (!r.fechaRecepcion || !r.fechaEsperada) return false
      const fechaRecepcion = new Date(r.fechaRecepcion)
      const fechaEsperada = new Date(r.fechaEsperada)
      return fechaRecepcion <= fechaEsperada
    }).length
    
    const puntualidad = totalRecepciones > 0 ? (recepcionesPuntuales / totalRecepciones) * 100 : 0
    
    // Calcular calidad (productos defectuosos)
    const totalProductosRecibidos = recepcionesProveedor.reduce((sum, r) => 
      sum + (parseInt(r.cantidadRecibida) || 0), 0
    )
    const totalProductosDefectuosos = recepcionesProveedor.reduce((sum, r) => 
      sum + (parseInt(r.cantidadRechazada) || 0), 0
    )
    const calidad = totalProductosRecibidos > 0 
      ? ((totalProductosRecibidos - totalProductosDefectuosos) / totalProductosRecibidos) * 100 
      : 100
    
    // Calcular calificación general (promedio ponderado)
    const calificacion = (puntualidad * 0.4 + calidad * 0.4 + (recepcionesCompletas / Math.max(totalRecepciones, 1)) * 100 * 0.2) / 100
    
    return {
      totalOrdenes,
      totalRecepciones,
      recepcionesCompletas,
      recepcionesConIncidencias,
      puntualidad: puntualidad.toFixed(1),
      calidad: calidad.toFixed(1),
      calificacion: (calificacion * 5).toFixed(1), // Escala de 0-5
      totalProductosRecibidos,
      totalProductosDefectuosos
    }
  } catch (error) {
    console.error('Error al calcular estadísticas del proveedor:', error)
    throw error
  }
}

