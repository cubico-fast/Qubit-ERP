import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'

const Placeholder = () => {
  const location = useLocation()
  const pageName = location.pathname.split('/').pop() || 'Página'
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <Construction size={64} className="mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          {pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ')}
        </h1>
        <p className="text-gray-600 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Esta sección está en desarrollo y estará disponible próximamente.
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Módulo profesional del ERP en construcción.
        </p>
      </div>
    </div>
  )
}

export default Placeholder

