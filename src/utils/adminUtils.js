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
import { getUsersCollection, getUserDoc, getRolesCollection, getRoleDoc, getCurrentCompanyId } from './firebasePaths'

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
 * @param {object} userData - Datos del usuario { email, password, companyId, role, isAdmin, displayName }
 * 
 * NOTA: La creación real del usuario en Firebase Auth debe hacerse desde:
 * 1. Una Cloud Function con Firebase Admin SDK, o
 * 2. Manualmente desde Firebase Console
 * 
 * Esta función crea el documento en Firestore. Cuando el usuario se cree en Firebase Auth,
 * se debe actualizar el documento con el UID correspondiente.
 */
export const createUserWithCompany = async (userData) => {
  try {
    const { email, password, companyId, role, isAdmin, displayName, activo } = userData
    
    // Verificar que la empresa existe
    const company = await getCompany(companyId)
    if (!company) {
      throw new Error(`La empresa ${companyId} no existe`)
    }
    
    // Intentar crear usuario usando Cloud Function si está disponible
    let userId = null
    try {
      const createUserFn = httpsCallable(functions, 'createUser')
      const result = await createUserFn({
        email,
        password,
        companyId,
        role: role || 'operativo',
        isAdmin: isAdmin || false,
        displayName: displayName || ''
      })
      
      if (result.data && result.data.uid) {
        userId = result.data.uid
        
        // Asignar custom claims
        if (userId) {
          await setUserClaims(userId, companyId, isAdmin || false)
        }
      }
    } catch (cloudFunctionError) {
      // Si no hay Cloud Function disponible, continuar solo con Firestore
      console.warn('Cloud Function no disponible. Se creará solo el documento en Firestore.')
      console.warn('El usuario debe crearse manualmente en Firebase Auth y luego actualizar este documento con el UID.')
    }
    
    // Crear documento de usuario en Firestore
    // Ahora usa: companies/{companyId}/users/{userId}
    const usersRef = getUsersCollection(companyId)
    const newUserRef = userId ? getUserDoc(userId, companyId) : doc(usersRef)
    
    await setDoc(newUserRef, {
      ...(userId && { uid: userId, userId: userId }),
      name: displayName || email.split('@')[0],
      email,
      roleId: role || 'operativo',
      active: activo !== undefined ? activo : true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return {
      id: newUserRef.id,
      email,
      companyId,
      role: role || 'operativo',
      admin: isAdmin || false,
      uid: userId
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
    const { companyId, role, isAdmin, displayName, activo } = userData
    
    // Actualizar custom claims si se proporciona companyId o isAdmin
    if (companyId !== undefined || isAdmin !== undefined) {
      const uid = userData.uid || userId
      try {
        await setUserClaims(uid, companyId, isAdmin)
      } catch (claimsError) {
        console.warn('No se pudieron actualizar los custom claims:', claimsError)
      }
    }
    
    // Actualizar documento en Firestore
    // Necesitamos obtener el companyId del usuario actual si no se proporciona
    const currentCompanyId = companyId || getCurrentCompanyId()
    const userRef = getUserDoc(userId, currentCompanyId)
    const updateData = {
      updatedAt: serverTimestamp()
    }
    
    if (role !== undefined) updateData.roleId = role
    if (displayName !== undefined) updateData.name = displayName
    if (activo !== undefined) updateData.active = activo
    
    await updateDoc(userRef, updateData)
    
    return { success: true }
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    throw error
  }
}

/**
 * Obtener todos los usuarios de una empresa
 * Ahora usa: companies/{companyId}/users
 */
export const getUsersByCompany = async (companyId) => {
  try {
    const usersRef = getUsersCollection(companyId)
    const querySnapshot = await getDocs(usersRef)
    
    const users = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        id: doc.id,
        userId: doc.id,
        email: data.email,
        name: data.name,
        roleId: data.roleId,
        active: data.active,
        companyId: companyId, // Agregar para compatibilidad
        ...data
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
 * Nota: Con la nueva estructura, esto requiere iterar sobre todas las empresas
 * Por ahora, retorna usuarios de la empresa actual
 */
export const getAllUsers = async () => {
  try {
    console.log('getAllUsers: Iniciando consulta a Firestore...')
    const companyId = getCurrentCompanyId()
    const usersRef = getUsersCollection(companyId)
    console.log('getAllUsers: Referencia a colección obtenida')
    
    const querySnapshot = await getDocs(usersRef)
    console.log('getAllUsers: QuerySnapshot obtenido, cantidad:', querySnapshot.size)
    
    const users = []
    querySnapshot.forEach((doc) => {
      const userData = doc.data()
      console.log('getAllUsers: Procesando usuario:', doc.id, userData)
      users.push({
        id: doc.id,
        userId: doc.id,
        companyId: companyId,
        ...userData
      })
    })
    
    console.log('getAllUsers: Total de usuarios encontrados:', users.length)
    return users
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    console.error('Detalles del error:', {
      code: error.code,
      message: error.message,
      name: error.name
    })
    // Si hay error de permisos o conexión, retornar array vacío en lugar de lanzar error
    if (error.code === 'permission-denied' || error.code === 'unavailable') {
      console.warn('Error de permisos o conexión, retornando array vacío')
      return []
    }
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

