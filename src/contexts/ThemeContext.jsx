import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  return context
}

// Definición de temas
export const themes = {
  profesional: {
    name: 'Profesional',
    description: 'Estilo corporativo limpio y moderno',
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      sidebar: 'linear-gradient(to bottom, #0369a1, #075985)',
      card: '#ffffff',
    },
    font: 'Inter, sans-serif',
    style: 'modern'
  },
  hacker: {
    name: 'Code',
    description: 'Estilo terminal con líneas verdes sobre negro',
    colors: {
      primary: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      background: '#000000',
      surface: '#000000',
      text: '#00ff00',
      textSecondary: '#00ff88',
      border: '#00ff00',
      sidebar: 'linear-gradient(to bottom, #000000, #000000)',
      card: '#000000',
    },
    font: 'Courier New, monospace',
    style: 'code'
  },
  calido: {
    name: 'Cálido',
    description: 'Colores cálidos y acogedores',
    colors: {
      primary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
      },
      background: '#fffaf5',
      surface: '#ffffff',
      text: '#1c1917',
      textSecondary: '#78716c',
      border: '#e7e5e4',
      sidebar: 'linear-gradient(to bottom, #c2410c, #9a3412)',
      card: '#ffffff',
    },
    font: 'Inter, sans-serif',
    style: 'warm'
  },
  minimalista: {
    name: 'Minimalista',
    description: 'Diseño limpio y minimalista',
    colors: {
      primary: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
      },
      background: '#ffffff',
      surface: '#fafafa',
      text: '#171717',
      textSecondary: '#737373',
      border: '#e5e5e5',
      sidebar: 'linear-gradient(to bottom, #404040, #262626)',
      card: '#ffffff',
    },
    font: 'Inter, sans-serif',
    style: 'minimal'
  },
  amarilloGris: {
    name: 'Amarillo y Gris',
    description: 'Tema elegante con amarillo dorado y grises neutros',
    colors: {
      primary: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308',
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12',
      },
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      sidebar: 'linear-gradient(to bottom, #ca8a04, #a16207)',
      card: '#ffffff',
    },
    font: 'Inter, sans-serif',
    style: 'yellow-gray'
  },
  dark: {
    name: 'Dark',
    description: 'Tema oscuro - Amarillo dorado sobre fondos oscuros',
    colors: {
      primary: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308',
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12',
      },
      background: '#0d0d0d',
      surface: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#a3a3a3',
      border: '#2a2a2a',
      sidebar: 'linear-gradient(to bottom, #1a1a1a, #0d0d0d)',
      card: '#1a1a1a',
    },
    font: 'Inter, sans-serif',
    style: 'Dark'
  },
  sage: {
    name: 'Salvia',
    description: 'Tema natural con verde salvia y tonos tierra',
    colors: {
      primary: {
        50: '#f4f7f5',
        100: '#e8f0ea',
        200: '#c9dccf',
        300: '#a5c4ae',
        400: '#7ba082',
        500: '#5a7a5f',
        600: '#4a6350',
        700: '#3d5143',
        800: '#324136',
        900: '#29362d',
      },
      background: '#fafaf7',
      surface: '#ffffff',
      text: '#2d3e2f',
      textSecondary: '#5a6b5d',
      border: '#d4e0d6',
      sidebar: 'linear-gradient(to bottom, #5a7a5f, #4a6350)',
      card: '#ffffff',
    },
    font: 'Inter, sans-serif',
    style: 'sage'
  }
}

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Cargar tema guardado o usar profesional por defecto
    const savedTheme = localStorage.getItem('cubic-theme')
    return savedTheme && themes[savedTheme] ? savedTheme : 'profesional'
  })

  useEffect(() => {
    // Aplicar tema al documento
    const theme = themes[currentTheme]
    const root = document.documentElement

    // Aplicar variables CSS
    Object.entries(theme.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value)
    })

    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-surface', theme.colors.surface)
    root.style.setProperty('--color-text', theme.colors.text)
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--color-border', theme.colors.border)
    root.style.setProperty('--color-sidebar', theme.colors.sidebar)
    root.style.setProperty('--color-card', theme.colors.card)
    root.style.setProperty('--font-family', theme.font)

    // Aplicar clase al body para estilos específicos
    document.body.className = `theme-${theme.style}`
    document.body.style.backgroundColor = theme.colors.background
    document.body.style.color = theme.colors.text
    document.body.style.fontFamily = theme.font

    // Guardar tema en localStorage
    localStorage.setItem('cubic-theme', currentTheme)
  }, [currentTheme])

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName)
    }
  }

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      theme: themes[currentTheme],
      changeTheme,
      themes
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

