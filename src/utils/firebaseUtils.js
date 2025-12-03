import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'

// ========== FUNCIONES PARA PRODUCTOS ==========

/**
 * Obtener todos los productos desde Firebase
 */
export const getProductos = async () => {
  try {
    const productosRef = collection(db, 'productos')
    let querySnapshot
    
    // Intentar ordenar por createdAt, si falla (por falta de índice), obtener sin ordenar
    try {
      const q = query(productosRef, orderBy('createdAt', 'desc'))
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      // Si falla el orderBy, obtener sin ordenar
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
 */
export const saveProducto = async (producto) => {
  try {
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
    
    // Obtener el número de productos existentes para generar el ID secuencial
    const productosRef = collection(db, 'productos')
    let numeroProducto = 1
    
    try {
      // Obtener todos los productos para contar
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
 */
export const updateProducto = async (productoId, productoData) => {
  try {
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
    
    const productoRef = doc(db, 'productos', productoId)
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
export const deleteProducto = async (productoId) => {
  try {
    const productoRef = doc(db, 'productos', productoId)
    await deleteDoc(productoRef)
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    throw error
  }
}

// ========== FUNCIONES PARA VENTAS ==========

/**
 * Obtener todas las ventas desde Firebase
 */
export const getVentas = async () => {
  try {
    const ventasRef = collection(db, 'ventas')
    // Intentar ordenar por fecha, pero si falla (porque fecha es string), obtener sin ordenar
    let querySnapshot
    try {
      const q = query(ventasRef, orderBy('fecha', 'desc'))
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      // Si falla el ordenamiento (puede pasar si fecha es string sin índice), obtener sin ordenar
      console.warn('No se pudo ordenar por fecha, obteniendo sin orden:', orderError)
      querySnapshot = await getDocs(ventasRef)
    }
    
    const ventas = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      
      // Normalizar el campo 'fecha' - priorizar createdAt de Firestore si está disponible
      // porque es más confiable (timestamp del servidor)
      let fechaNormalizada = null
      
      // PRIMERO: Intentar usar createdAt (timestamp del servidor - más confiable)
      if (data.createdAt) {
        if (data.createdAt?.toDate) {
          // Es un Timestamp de Firestore
          const fechaCreated = data.createdAt.toDate()
          // Convertir a fecha en zona horaria de Perú (UTC-5)
          // Obtener la fecha en formato YYYY-MM-DD considerando la zona horaria
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
          // Si createdAt es un string ISO, extraer la fecha
          if (data.createdAt.includes('T')) {
            fechaNormalizada = data.createdAt.split('T')[0]
          } else {
            fechaNormalizada = data.createdAt
          }
        }
      }
      
      // SEGUNDO: Si no hay createdAt o no se pudo usar, usar el campo 'fecha'
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
      
      // Si aún no hay fecha normalizada, usar updatedAt como último recurso
      if (!fechaNormalizada && data.updatedAt) {
        console.warn('Venta sin fecha válida, usando updatedAt como último recurso:', doc.id)
        if (data.updatedAt?.toDate) {
          const fechaUpdated = data.updatedAt.toDate()
          const year = fechaUpdated.getFullYear()
          const month = String(fechaUpdated.getMonth() + 1).padStart(2, '0')
          const day = String(fechaUpdated.getDate()).padStart(2, '0')
          fechaNormalizada = `${year}-${month}-${day}`
        }
      }
      
      // Si aún no hay fecha, registrar advertencia
      if (!fechaNormalizada) {
        console.warn('Venta sin fecha válida en ningún campo:', doc.id, data)
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
export const saveVenta = async (venta) => {
  try {
    // Remover el id temporal si existe
    const { id, ...ventaData } = venta
    
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
export const updateVenta = async (ventaId, ventaData) => {
  try {
    const ventaRef = doc(db, 'ventas', ventaId)
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
export const deleteVenta = async (ventaId) => {
  try {
    const ventaRef = doc(db, 'ventas', ventaId)
    await deleteDoc(ventaRef)
  } catch (error) {
    console.error('Error al eliminar venta:', error)
    throw error
  }
}

// ========== FUNCIONES PARA CLIENTES ==========

/**
 * Obtener todos los clientes desde Firebase
 */
export const getClientes = async () => {
  try {
    const clientesRef = collection(db, 'clientes')
    let querySnapshot
    
    try {
      const q = query(clientesRef, orderBy('createdAt', 'desc'))
      querySnapshot = await getDocs(q)
    } catch (orderError) {
      console.warn('No se pudo ordenar clientes por createdAt, obteniendo sin orden:', orderError)
      querySnapshot = await getDocs(clientesRef)
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
export const saveCliente = async (cliente) => {
  try {
    const { id, ...clienteData } = cliente
    const cleanedData = {}
    
    // Limpiar datos undefined
    for (const key in clienteData) {
      if (clienteData[key] !== undefined && clienteData[key] !== null) {
        cleanedData[key] = clienteData[key]
      }
    }
    
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
export const updateCliente = async (clienteId, clienteData) => {
  try {
    const cleanedData = {}
    
    for (const key in clienteData) {
      if (clienteData[key] !== undefined && clienteData[key] !== null) {
        cleanedData[key] = clienteData[key]
      }
    }
    
    const clienteRef = doc(db, 'clientes', clienteId)
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
export const deleteCliente = async (clienteId) => {
  try {
    const clienteRef = doc(db, 'clientes', clienteId)
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

