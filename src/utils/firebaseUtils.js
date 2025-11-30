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
    const q = query(ventasRef, orderBy('fecha', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const ventas = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      ventas.push({
        id: doc.id,
        ...data,
        // Convertir timestamps de Firestore a fechas si es necesario
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString().split('T')[0] : data.fecha
      })
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

