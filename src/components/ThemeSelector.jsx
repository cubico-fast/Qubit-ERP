import { useState, useRef, useEffect } from 'react'
import { Palette, Check, ChevronDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeSelector = () => {
  const { currentTheme, theme, changeTheme, themes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-opacity-80"
        style={{
          backgroundColor: `var(--color-primary-600)`,
          color: 'white'
        }}
        title="Cambiar tema"
      >
        <Palette size={18} />
        <span className="hidden sm:inline font-medium">{theme.name}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 rounded-lg shadow-xl border z-50 overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)'
          }}
        >
          <div className="p-2">
            <div 
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Seleccionar Tema
            </div>
            {Object.entries(themes).map(([key, themeOption]) => (
              <button
                key={key}
                onClick={() => {
                  changeTheme(key)
                  setIsOpen(false)
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all"
                style={{
                  backgroundColor: currentTheme === key 
                    ? `var(--color-primary-50)` 
                    : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (currentTheme !== key) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'
                    e.currentTarget.style.opacity = '0.5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentTheme !== key) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.opacity = '1'
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                    style={{
                      backgroundColor: themeOption.colors.primary[500],
                      borderColor: themeOption.colors.primary[700]
                    }}
                  />
                  <div className="text-left">
                    <div 
                      className="font-medium text-sm"
                      style={{ color: `var(--color-text)` }}
                    >
                      {themeOption.name}
                    </div>
                    <div 
                      className="text-xs"
                      style={{ color: `var(--color-text-secondary)` }}
                    >
                      {themeOption.description}
                    </div>
                  </div>
                </div>
                {currentTheme === key && (
                  <Check 
                    size={18} 
                    style={{ color: `var(--color-primary-600)` }} 
                    className="flex-shrink-0"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeSelector

