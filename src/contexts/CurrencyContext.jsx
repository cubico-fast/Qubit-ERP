import { createContext, useContext, useState, useEffect } from 'react'

const CurrencyContext = createContext()

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency debe usarse dentro de CurrencyProvider')
  }
  return context
}

// Tasa de cambio aproximada: 1 USD = 3.7 PEN
const EXCHANGE_RATE = 3.7

export const CurrencyProvider = ({ children }) => {
  // Obtener la moneda guardada en localStorage o usar 'USD' por defecto
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('currency')
    return saved || 'USD'
  })

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('currency', currency)
  }, [currency])

  // Función para formatear valores según la moneda
  const formatCurrency = (value) => {
    if (currency === 'PEN') {
      // Los valores ya están en soles, mostrar tal cual
      return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else {
      // USD
      return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  // Función para obtener el símbolo de la moneda
  const getCurrencySymbol = () => {
    return currency === 'PEN' ? 'S/' : '$'
  }

  // Función para convertir un valor a la moneda seleccionada
  const convertValue = (value) => {
    // Los valores ya están en la moneda correcta, no se necesita conversión
    return value
  }

  const value = {
    currency,
    setCurrency,
    formatCurrency,
    getCurrencySymbol,
    convertValue
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

