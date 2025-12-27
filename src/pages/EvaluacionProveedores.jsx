import { useState, useEffect } from 'react'
import { CheckSquare, Star, TrendingUp, TrendingDown, Clock, Package, AlertCircle, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getProveedores, calcularEstadisticasProveedor, getRecepciones, getOrdenesCompra } from '../utils/firebaseUtils'

const EvaluacionProveedores = () => {
  const { companyId } = useAuth()
  const [proveedores, setProveedores] = useState([])
  const [estadisticas, setEstadisticas] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const proveedoresData = await getProveedores(companyId)
      setProveedores(proveedoresData || [])

      // Calcular estadísticas para cada proveedor
      const stats = {}
      for (const proveedor of proveedoresData) {
        try {
          const statsProv = await calcularEstadisticasProveedor(proveedor.id, companyId)
          stats[proveedor.id] = statsProv
        } catch (error) {
          console.error(`Error al calcular stats para ${proveedor.id}:`, error)
          stats[proveedor.id] = {
            totalOrdenes: 0,
            totalRecepciones: 0,
            puntualidad: '0',
            calidad: '100',
            calificacion: '0',
            recepcionesCompletas: 0,
            recepcionesConIncidencias: 0
          }
        }
      }
      setEstadisticas(stats)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setProveedores([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.ruc?.includes(searchTerm)
  )

  const getCalificacionColor = (calificacion) => {
    const cal = parseFloat(calificacion) || 0
    if (cal >= 4) return 'text-green-600'
    if (cal >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCalificacionBgColor = (calificacion) => {
    const cal = parseFloat(calificacion) || 0
    if (cal >= 4) return 'bg-green-100'
    if (cal >= 3) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const renderStars = (calificacion) => {
    const cal = parseFloat(calificacion) || 0
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={20}
          className={i <= Math.round(cal) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
        />
      )
    }
    return stars
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Evaluación de Proveedores
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Mide puntualidad, calidad, precio y reclamos para tomar mejores decisiones
        </p>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{ 
              borderColor: 'var(--color-border)', 
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          />
        </div>
      </div>

      {/* Información */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-purple-900 mb-2">📊 Evaluación de Proveedores: Clave para Decisiones</h3>
        <p className="text-sm text-purple-800 mb-2">
          El ERP te dice: A quién seguir comprando, a quién evitar, a quién negociar.
        </p>
        <ul className="text-sm text-purple-700 space-y-1 ml-4">
          <li>• Mide: Puntualidad, Calidad, Precio, Reclamos</li>
          <li>• Ejemplo: Entregas a tiempo: 90%, Productos defectuosos: 2%, Calificación: 4.5/5</li>
        </ul>
      </div>

      {/* Lista de Proveedores con Evaluación */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
          Cargando evaluaciones...
        </div>
      ) : filteredProveedores.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
          <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">No hay proveedores para evaluar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProveedores.map((proveedor) => {
            const stats = estadisticas[proveedor.id] || {
              totalOrdenes: 0,
              totalRecepciones: 0,
              puntualidad: '0',
              calidad: '100',
              calificacion: '0',
              recepcionesCompletas: 0,
              recepcionesConIncidencias: 0
            }

            return (
              <div 
                key={proveedor.id}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                      {proveedor.nombre}
                    </h3>
                    {proveedor.ruc && (
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        RUC: {proveedor.ruc}
                      </p>
                    )}
                    {proveedor.productos && (
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Productos: {proveedor.productos}
                      </p>
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${getCalificacionBgColor(stats.calificacion)}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getCalificacionColor(stats.calificacion)}`}>
                        {stats.calificacion}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>/ 5</span>
                    </div>
                    <div className="flex items-center mt-1">
                      {renderStars(stats.calificacion)}
                    </div>
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={16} className="text-blue-600" />
                      <p className="text-xs font-medium text-blue-900">Puntualidad</p>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{stats.puntualidad}%</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={16} className="text-green-600" />
                      <p className="text-xs font-medium text-green-900">Calidad</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">{stats.calidad}%</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-purple-600" />
                      <p className="text-xs font-medium text-purple-900">Órdenes</p>
                    </div>
                    <p className="text-lg font-bold text-purple-600">{stats.totalOrdenes}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle size={16} className="text-orange-600" />
                      <p className="text-xs font-medium text-orange-900">Incidencias</p>
                    </div>
                    <p className="text-lg font-bold text-orange-600">{stats.recepcionesConIncidencias}</p>
                  </div>
                </div>

                {/* Detalles Adicionales */}
                {stats.totalRecepciones > 0 && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Total Recepciones</p>
                        <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{stats.totalRecepciones}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Completas</p>
                        <p className="font-semibold text-green-600">{stats.recepcionesCompletas}</p>
                      </div>
                      {stats.totalProductosRecibidos > 0 && (
                        <div>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Productos Recibidos</p>
                          <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{stats.totalProductosRecibidos}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {stats.totalRecepciones === 0 && (
                  <div className="mt-4 pt-4 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      No hay datos suficientes para evaluar. Realiza compras y recepciones para generar métricas.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default EvaluacionProveedores









