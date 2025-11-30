/**
 * Utilidades para formatear fechas y horas
 */

// Cache para la hora de la red
let networkTimeCache = null
let networkTimeLastFetch = null
const CACHE_DURATION = 60000 // 1 minuto

/**
 * Obtener la hora actual desde la red (API pública)
 * Usa World Time API para obtener la hora de Perú
 */
export const getNetworkTime = async () => {
  try {
    // Si tenemos un cache reciente, usarlo
    if (networkTimeCache && networkTimeLastFetch && (Date.now() - networkTimeLastFetch) < CACHE_DURATION) {
      const timeDiff = Date.now() - networkTimeLastFetch
      return new Date(networkTimeCache.getTime() + timeDiff)
    }

    // Obtener hora desde World Time API (zona horaria de Lima, Perú)
    const response = await fetch('https://worldtimeapi.org/api/timezone/America/Lima')
    if (!response.ok) {
      throw new Error('Error al obtener hora de la red')
    }
    
    const data = await response.json()
    const networkTime = new Date(data.datetime)
    
    // Guardar en cache
    networkTimeCache = networkTime
    networkTimeLastFetch = Date.now()
    
    return networkTime
  } catch (error) {
    console.warn('Error al obtener hora de la red, usando hora local:', error)
    // Si falla, usar hora local como fallback
    return new Date()
  }
}

/**
 * Obtener la fecha actual en formato YYYY-MM-DD
 * Usa hora de la red si está disponible
 */
export const getCurrentDate = async () => {
  try {
    const date = await getNetworkTime()
    return date.toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Obtener la fecha y hora actual en formato ISO
 * Usa hora de la red si está disponible
 */
export const getCurrentDateTime = async () => {
  try {
    const date = await getNetworkTime()
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

/**
 * Obtener la fecha actual de forma síncrona (para compatibilidad)
 * Usa hora local como fallback
 */
export const getCurrentDateSync = () => {
  return new Date().toISOString().split('T')[0]
}

/**
 * Formatear fecha en formato español (DD/MM/YYYY)
 */
export const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  if (isNaN(date.getTime())) return dateString
  
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Formatear fecha y hora en formato español (DD/MM/YYYY HH:MM)
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return ''
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  if (isNaN(date.getTime())) return dateString
  
  return date.toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formatear solo la hora (HH:MM)
 */
export const formatTime = (dateString) => {
  if (!dateString) return ''
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  if (isNaN(date.getTime())) return dateString
  
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Obtener el nombre del mes en español
 */
export const getMonthName = (monthIndex) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[monthIndex] || ''
}

/**
 * Obtener el nombre del día en español
 */
export const getDayName = (dayIndex) => {
  const days = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ]
  return days[dayIndex] || ''
}

/**
 * Obtener fecha relativa (hoy, ayer, hace X días)
 */
export const getRelativeDate = (dateString) => {
  if (!dateString) return ''
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  
  return formatDate(date)
}

/**
 * Obtener los últimos N meses desde la fecha actual
 * Retorna array con abreviaturas de meses en español
 */
export const getLastMonths = (count = 6, startDate = null) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const date = startDate || new Date()
  const result = []
  
  for (let i = count - 1; i >= 0; i--) {
    const monthDate = new Date(date.getFullYear(), date.getMonth() - i, 1)
    result.push({
      mes: months[monthDate.getMonth()],
      mesCompleto: getMonthName(monthDate.getMonth()),
      fecha: monthDate,
      año: monthDate.getFullYear(),
      mesNumero: monthDate.getMonth() + 1
    })
  }
  
  return result
}

/**
 * Obtener el mes actual
 */
export const getCurrentMonth = async () => {
  try {
    const date = await getNetworkTime()
    return {
      mes: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][date.getMonth()],
      mesCompleto: getMonthName(date.getMonth()),
      año: date.getFullYear(),
      mesNumero: date.getMonth() + 1
    }
  } catch {
    const date = new Date()
    return {
      mes: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][date.getMonth()],
      mesCompleto: getMonthName(date.getMonth()),
      año: date.getFullYear(),
      mesNumero: date.getMonth() + 1
    }
  }
}

/**
 * Obtener el mes actual de forma síncrona
 */
export const getCurrentMonthSync = () => {
  const date = new Date()
  return {
    mes: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][date.getMonth()],
    mesCompleto: getMonthName(date.getMonth()),
    año: date.getFullYear(),
    mesNumero: date.getMonth() + 1
  }
}

