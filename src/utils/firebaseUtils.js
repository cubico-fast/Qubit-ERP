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

// ========== FUNCIONES PARA COMPANIES ==========

/**
 * Obtener el companyId actual del usuario desde localStorage
 * Si no existe, retorna el companyId por defecto
 */
const getCurrentCompanyId = () => {
  return localStorage.getItem('cubic_companyId') || 'empresa_001'
}

/**
 * Crear o actualizar una empresa en Firestore
 */
export const createOrUpdateCompany = async (companyData) => {
  try {
    const { companyId, ...data } = companyData
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    const companyRef = doc(db, 'companies', companyIdToUse)
    
    await setDoc(companyRef, {
      companyId: companyIdToUse,
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: data.createdAt || serverTimestamp()
    }, { merge: true })
    
    return { id: companyIdToUse, companyId: companyIdToUse, ...data }
  } catch (error) {
    console.error('Error al crear/actualizar empresa:', error)
    throw error
  }
}

/**
 * Obtener una empresa por su companyId
 */
export const getCompany = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const companyRef = doc(db, 'companies', companyIdToUse)
    const companySnap = await getDoc(companyRef)
    
    if (companySnap.exists()) {
      return {
        id: companySnap.id,
        ...companySnap.data()
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
    querySnapshot.forEach((doc) => {
      companies.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return companies
  } catch (error) {
    console.error('Error al obtener empresas:', error)
    throw error
  }
}

// ========== FUNCIONES PARA PRODUCTOS ==========

/**
 * Obtener todos los productos desde Firebase filtrados por companyId
 */
export const getProductos = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const productosRef = collection(db, 'productos')
    let querySnapshot
    
    // Intentar ordenar por createdAt y filtrar por companyId
    try {
      const q = query(
        productosRef, 
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      // Si falla el orderBy, intentar solo con el filtro de companyId
      try {
        const q = query(productosRef, where('companyId', '==', companyIdToUse))
        querySnapshot = await getDocs(q)
      } catch (filterError) {
        // Si también falla el filtro, obtener todos y filtrar en memoria
        console.warn('No se pudo filtrar por companyId en la query, filtrando en memoria:', filterError)
        const allSnapshot = await getDocs(productosRef)
        const productos = []
        allSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.companyId === companyIdToUse) {
            productos.push({
              id: doc.id,
              ...data
            })
          }
        })
        return productos
      }
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
 */
export const saveProducto = async (producto, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    // Remover el id temporal si existe, Firebase generará uno nuevo
    const { id, ...productoData } = producto
    
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
    
    // Agregar companyId al producto
    cleanedData.companyId = companyIdToUse
    
    // Obtener el número de productos existentes para generar el ID secuencial
    const productosRef = collection(db, 'productos')
    let numeroProducto = 1
    
    try {
      // Obtener todos los productos de esta empresa para contar
      const q = query(productosRef, where('companyId', '==', companyIdToUse))
      const querySnapshot = await getDocs(q)
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
 */
export const updateProducto = async (productoId, productoData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
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
    
    // Asegurar que el companyId se mantenga
    cleanedData.companyId = companyIdToUse
    
    const productoRef = doc(db, 'productos', productoId)
    
    // Verificar que el producto pertenezca a la empresa antes de actualizar
    const productoSnap = await getDoc(productoRef)
    if (productoSnap.exists()) {
      const productoData = productoSnap.data()
      if (productoData.companyId !== companyIdToUse) {
        throw new Error('No tienes permiso para actualizar este producto')
      }
    }
    
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
export const deleteProducto = async (productoId, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const productoRef = doc(db, 'productos', productoId)
    
    // Verificar que el producto pertenezca a la empresa antes de eliminar
    const productoSnap = await getDoc(productoRef)
    if (productoSnap.exists()) {
      const productoData = productoSnap.data()
      if (productoData.companyId !== companyIdToUse) {
        throw new Error('No tienes permiso para eliminar este producto')
      }
    }
    
    await deleteDoc(productoRef)
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    throw error
  }
}

// ========== FUNCIONES PARA VENTAS ==========

/**
 * Obtener todas las ventas desde Firebase filtradas por companyId
 */
export const getVentas = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const ventasRef = collection(db, 'ventas')
    // Intentar ordenar por fecha y filtrar por companyId
    let querySnapshot
    try {
      const q = query(
        ventasRef, 
        where('companyId', '==', companyIdToUse),
        orderBy('fecha', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      // Si falla el ordenamiento, intentar solo con el filtro de companyId
      try {
        const q = query(ventasRef, where('companyId', '==', companyIdToUse))
        querySnapshot = await getDocs(q)
      } catch (filterError) {
        // Si también falla el filtro, obtener todos y filtrar en memoria
        console.warn('No se pudo filtrar por companyId en la query, filtrando en memoria:', filterError)
        const allSnapshot = await getDocs(ventasRef)
        const ventas = []
        allSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.companyId === companyIdToUse) {
            // ... resto del código de normalización de fecha
            let fechaNormalizada = null
            
            if (data.createdAt) {
              if (data.createdAt?.toDate) {
                const fechaCreated = data.createdAt.toDate()
                const year = fechaCreated.getFullYear()
                const month = String(fechaCreated.getMonth() + 1).padStart(2, '0')
                const day = String(fechaCreated.getDate()).padStart(2, '0')
                fechaNormalizada = `${year}-${month}-${day}`
              } else if (data.createdAt instanceof Date) {
                const year = data.createdAt.getFullYear()
                const month = String(data.createdAt.getMonth() + 1).padStart(2, '0')
                const day = String(data.createdAt.getDate()).padStart(2, '0')
                fechaNormalizada = `${year}-${month}-${day}`
              } else if (typeof data.createdAt === 'string') {
                if (data.createdAt.includes('T')) {
                  fechaNormalizada = data.createdAt.split('T')[0]
                } else {
                  fechaNormalizada = data.createdAt
                }
              }
            }
            
            if (!fechaNormalizada && data.fecha) {
              let fechaVenta = data.fecha
              if (fechaVenta?.toDate) {
                const fechaDate = fechaVenta.toDate()
                const year = fechaDate.getFullYear()
                const month = String(fechaDate.getMonth() + 1).padStart(2, '0')
                const day = String(fechaDate.getDate()).padStart(2, '0')
                fechaNormalizada = `${year}-${month}-${day}`
              } else if (typeof fechaVenta === 'string') {
                if (fechaVenta.includes('T')) {
                  fechaVenta = fechaVenta.split('T')[0]
                }
                if (fechaVenta.includes(' ')) {
                  fechaVenta = fechaVenta.split(' ')[0]
                }
                if (/^\d{4}-\d{2}-\d{2}/.test(fechaVenta)) {
                  fechaNormalizada = fechaVenta
                }
              } else if (fechaVenta instanceof Date) {
                const year = fechaVenta.getFullYear()
                const month = String(fechaVenta.getMonth() + 1).padStart(2, '0')
                const day = String(fechaVenta.getDate()).padStart(2, '0')
                fechaNormalizada = `${year}-${month}-${day}`
              }
            }
            
            if (!fechaNormalizada && data.updatedAt) {
              if (data.updatedAt?.toDate) {
                const fechaUpdated = data.updatedAt.toDate()
                const year = fechaUpdated.getFullYear()
                const month = String(fechaUpdated.getMonth() + 1).padStart(2, '0')
                const day = String(fechaUpdated.getDate()).padStart(2, '0')
                fechaNormalizada = `${year}-${month}-${day}`
              }
            }
            
            if (!fechaNormalizada) {
              const hoy = new Date()
              const year = hoy.getFullYear()
              const month = String(hoy.getMonth() + 1).padStart(2, '0')
              const day = String(hoy.getDate()).padStart(2, '0')
              fechaNormalizada = `${year}-${month}-${day}`
            }
            
            ventas.push({
              id: doc.id,
              ...data,
              fecha: fechaNormalizada
            })
          }
        })
        
        ventas.sort((a, b) => {
          if (!a.fecha || !b.fecha) return 0
          return b.fecha.localeCompare(a.fecha)
        })
        
        return ventas
      }
    }
    
    const ventas = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      
      // Solo procesar ventas que pertenezcan a la empresa
      if (data.companyId !== companyIdToUse) {
        return
      }
      
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
 */
export const saveVenta = async (venta, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    // Remover el id temporal si existe
    const { id, ...ventaData } = venta
    
    // Agregar companyId a la venta
    ventaData.companyId = companyIdToUse
    
    const ventasRef = collection(db, 'ventas')
    const docRef = await addDoc(ventasRef, {
      ...ventaData,
      fecha: ventaData.fecha || new Date().toISOString().split('T')[0], // Usar fecha proporcionada o actual
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
 */
export const updateVenta = async (ventaId, ventaData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const ventaRef = doc(db, 'ventas', ventaId)
    
    // Verificar que la venta pertenezca a la empresa antes de actualizar
    const ventaSnap = await getDoc(ventaRef)
    if (ventaSnap.exists()) {
      const venta = ventaSnap.data()
      if (venta.companyId !== companyIdToUse) {
        throw new Error('No tienes permiso para actualizar esta venta')
      }
    }
    
    // Asegurar que el companyId se mantenga
    ventaData.companyId = companyIdToUse
    
    await updateDoc(ventaRef, {
      ...ventaData,
      updatedAt: serverTimestamp()
    })
    
    return { id: ventaId, ...ventaData }
  } catch (error) {
    console.error('Error al actualizar venta:', error)
    throw error
  }
}

/**
 * Eliminar una venta de Firebase
 */
export const deleteVenta = async (ventaId, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const ventaRef = doc(db, 'ventas', ventaId)
    
    // Verificar que la venta pertenezca a la empresa antes de eliminar
    const ventaSnap = await getDoc(ventaRef)
    if (ventaSnap.exists()) {
      const venta = ventaSnap.data()
      if (venta.companyId !== companyIdToUse) {
        throw new Error('No tienes permiso para eliminar esta venta')
      }
    }
    
    await deleteDoc(ventaRef)
  } catch (error) {
    console.error('Error al eliminar venta:', error)
    throw error
  }
}

// ========== FUNCIONES PARA CLIENTES ==========

/**
 * Obtener todos los clientes desde Firebase filtrados por companyId
 */
export const getClientes = async (companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const clientesRef = collection(db, 'clientes')
    let querySnapshot
    
    try {
      const q = query(
        clientesRef, 
        where('companyId', '==', companyIdToUse),
        orderBy('createdAt', 'desc')
      )
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
export const saveCliente = async (cliente, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    const { id, ...clienteData } = cliente
    const cleanedData = {}
    
    // Limpiar datos undefined
    for (const key in clienteData) {
      if (clienteData[key] !== undefined && clienteData[key] !== null) {
        cleanedData[key] = clienteData[key]
      }
    }
    
    // Agregar companyId al cliente
    cleanedData.companyId = companyIdToUse
    
    const clientesRef = collection(db, 'clientes')
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
 */
export const updateCliente = async (clienteId, clienteData, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    
    const cleanedData = {}
    
    for (const key in clienteData) {
      if (clienteData[key] !== undefined && clienteData[key] !== null) {
        cleanedData[key] = clienteData[key]
      }
    }
    
    // Asegurar que el companyId se mantenga
    cleanedData.companyId = companyIdToUse
    
    const clienteRef = doc(db, 'clientes', clienteId)
    
    // Verificar que el cliente pertenezca a la empresa antes de actualizar
    const clienteSnap = await getDoc(clienteRef)
    if (clienteSnap.exists()) {
      const cliente = clienteSnap.data()
      if (cliente.companyId !== companyIdToUse) {
        throw new Error('No tienes permiso para actualizar este cliente')
      }
    }
    
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
 */
export const deleteCliente = async (clienteId, companyId = null) => {
  try {
    const companyIdToUse = companyId || getCurrentCompanyId()
    const clienteRef = doc(db, 'clientes', clienteId)
    
    // Verificar que el cliente pertenezca a la empresa antes de eliminar
    const clienteSnap = await getDoc(clienteRef)
    if (clienteSnap.exists()) {
      const cliente = clienteSnap.data()
      if (cliente.companyId !== companyIdToUse) {
        throw new Error('No tienes permiso para eliminar este cliente')
      }
    }
    
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

