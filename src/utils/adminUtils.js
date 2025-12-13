/**
 * Utilidades para administración de empresas y usuarios
 * Requiere Firebase Functions desplegadas
 */

import { httpsCallable } from 'firebase/functions'
import { getFunctions } from 'firebase/functions'
import { app } from '../config/firebase'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createOrUpdateCompany, getCompany, getAllCompanies } from './firebaseUtils'

const functions = getFunctions(app)

/**
 * Asignar custom claims a un usuario (companyId, admin)
 * @param {string} userId - ID del usuario en Firebase Auth
 * @param {string} companyId - ID de la empresa
 * @param {boolean} isAdmin - Si el usuario es administrador
 */
export const setUserClaims = async (userId, companyId, isAdmin = false) => {
  try {
    const setCustomClaims = httpsCallable(functions, 'setCustomClaims')
    const result = await setCustomClaims({ userId, companyId, isAdmin })
    return result.data
  } catch (error) {
    console.error('Error al asignar custom claims:', error)
    throw error
  }
}

/**
 * Obtener custom claims de un usuario
 * @param {string} userId - ID del usuario (opcional, si no se proporciona usa el usuario actual)
 */
export const getUserClaims = async (userId = null) => {
  try {
    const getUserClaimsFn = httpsCallable(functions, 'getUserClaims')
    const result = await getUserClaimsFn({ userId })
    return result.data
  } catch (error) {
    console.error('Error al obtener claims:', error)
    throw error
  }
}

/**
 * Crear un nuevo usuario y asignarle una empresa
 * @param {object} userData - Datos del usuario { email, password, companyId, isAdmin }
 */
export const createUserWithCompany = async (userData) => {
  try {
    // Nota: La creación de usuarios debe hacerse desde el backend
    // Por ahora, esta función solo actualiza el documento en Firestore
    // La creación real del usuario debe hacerse desde Firebase Admin SDK
    
    const { email, companyId, isAdmin, displayName } = userData
    
    // Verificar que la empresa existe
    const company = await getCompany(companyId)
    if (!company) {
      throw new Error(`La empresa ${companyId} no existe`)
    }
    
    // Crear documento de usuario en Firestore
    // El userId se asignará cuando se cree el usuario en Firebase Auth
    const usersRef = collection(db, 'users')
    const newUserRef = doc(usersRef)
    
    await setDoc(newUserRef, {
      email,
      companyId,
      admin: isAdmin || false,
      displayName: displayName || '',
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return {
      id: newUserRef.id,
      email,
      companyId,
      admin: isAdmin || false
    }
  } catch (error) {
    console.error('Error al crear usuario:', error)
    throw error
  }
}

/**
 * Actualizar usuario existente
 */
export const updateUser = async (userId, userData) => {
  try {
    const { companyId, isAdmin, displayName, activo } = userData
    
    // Actualizar custom claims si se proporciona companyId o isAdmin
    if (companyId !== undefined || isAdmin !== undefined) {
      await setUserClaims(userId, companyId, isAdmin)
    }
    
    // Actualizar documento en Firestore
    const userRef = doc(db, 'users', userId)
    const updateData = {
      updatedAt: serverTimestamp()
    }
    
    if (companyId !== undefined) updateData.companyId = companyId
    if (isAdmin !== undefined) updateData.admin = isAdmin
    if (displayName !== undefined) updateData.displayName = displayName
    if (activo !== undefined) updateData.activo = activo
    
    await updateDoc(userRef, updateData)
    
    return { success: true }
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    throw error
  }
}

/**
 * Obtener todos los usuarios de una empresa
 */
export const getUsersByCompany = async (companyId) => {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('companyId', '==', companyId))
    const querySnapshot = await getDocs(q)
    
    const users = []
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return users
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    throw error
  }
}

/**
 * Obtener todos los usuarios (solo para administradores)
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users')
    const querySnapshot = await getDocs(usersRef)
    
    const users = []
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return users
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    throw error
  }
}

/**
 * Activar/desactivar empresa
 */
export const toggleCompanyStatus = async (companyId, activa) => {
  try {
    const company = await getCompany(companyId)
    if (!company) {
      throw new Error(`La empresa ${companyId} no existe`)
    }
    
    await createOrUpdateCompany({
      companyId,
      ...company,
      activa: activa
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error al cambiar estado de empresa:', error)
    throw error
  }
}

/**
 * Obtener estadísticas de una empresa
 */
export const getCompanyStats = async (companyId) => {
  try {
    const [productos, ventas, clientes, usuarios] = await Promise.all([
      // Obtener productos
      import('./firebaseUtils').then(m => m.getProductos(companyId)),
      // Obtener ventas
      import('./firebaseUtils').then(m => m.getVentas(companyId)),
      // Obtener clientes
      import('./firebaseUtils').then(m => m.getClientes(companyId)),
      // Obtener usuarios
      getUsersByCompany(companyId)
    ])
    
    return {
      totalProductos: productos.length,
      totalVentas: ventas.length,
      totalClientes: clientes.length,
      totalUsuarios: usuarios.length,
      ventasTotal: ventas.reduce((sum, v) => sum + (v.total || 0), 0)
    }
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    throw error
  }
}

