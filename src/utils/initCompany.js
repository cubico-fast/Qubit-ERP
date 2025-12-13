/**
 * Utilidad para inicializar la empresa por defecto en Firestore
 * Ejecutar esta función una vez para crear la empresa inicial
 */

import { createOrUpdateCompany } from './firebaseUtils'

/**
 * Inicializar la empresa por defecto (empresa_001)
 * Esta función debe ejecutarse una vez al configurar el sistema
 */
export const initDefaultCompany = async () => {
  try {
    const companyData = {
      companyId: 'empresa_001',
      nombre: 'Empresa Principal',
      descripcion: 'Empresa principal del sistema CRM',
      activa: true,
      fechaCreacion: new Date().toISOString(),
      configuracion: {
        moneda: 'Soles',
        zonaHoraria: 'America/Lima',
        formatoFecha: 'DD/MM/YYYY'
      }
    }
    
    const result = await createOrUpdateCompany(companyData)
    console.log('✅ Empresa inicial creada exitosamente:', result)
    return result
  } catch (error) {
    console.error('❌ Error al inicializar empresa:', error)
    throw error
  }
}

/**
 * Verificar si la empresa existe
 */
export const checkCompanyExists = async (companyId = 'empresa_001') => {
  try {
    const { getCompany } = await import('./firebaseUtils')
    const company = await getCompany(companyId)
    return company !== null
  } catch (error) {
    console.error('Error al verificar empresa:', error)
    return false
  }
}

