import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users, ChevronRight } from 'lucide-react'
import { getOportunidades, getLeads } from '../utils/firebaseUtils'

const Pipeline = () => {
  const [etapas, setEtapas] = useState([
    { nombre: 'Lead Nuevo', cantidad: 0, valor: 0, color: 'bg-gray-500', key: 'Lead Nuevo' },
    { nombre: 'Contactado', cantidad: 0, valor: 0, color: 'bg-blue-500', key: 'Contactado' },
    { nombre: 'Cotización Enviada', cantidad: 0, valor: 0, color: 'bg-yellow-500', key: 'Cotización Enviada' },
    { nombre: 'Negociación', cantidad: 0, valor: 0, color: 'bg-orange-500', key: 'Negociación' },
    { nombre: 'Propuesta Final', cantidad: 0, valor: 0, color: 'bg-purple-500', key: 'Propuesta Final' },
    { nombre: 'Ganada', cantidad: 0, valor: 0, color: 'bg-green-500', key: 'Ganada' }
  ])
  const [estadisticas, setEstadisticas] = useState({
    oportunidadesActivas: 0,
    valorTotal: 0,
    tasaConversion: 0,
    cicloPromedio: 0
  })
  const [cargando, setCargando] = useState(true)

  // Mapeo de estados a etapas del embudo
  const mapeoEtapas = {
    'Lead Nuevo': 'Lead Nuevo',
    'Nuevo': 'Lead Nuevo',
    'Contactado': 'Contactado',
    'Cotización Enviada': 'Cotización Enviada',
    'Cotización': 'Cotización Enviada',
    'Negociación': 'Negociación',
    'Propuesta Final': 'Propuesta Final',
    'Propuesta': 'Propuesta Final',
    'Ganada': 'Ganada',
    'Ganado': 'Ganada',
    'Cerrada Ganada': 'Ganada'
  }

  // Cargar datos desde Firebase
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true)
        
        // Obtener oportunidades y leads
        const [oportunidades, leads] = await Promise.all([
          getOportunidades().catch(() => []),
          getLeads().catch(() => [])
        ])

        // Inicializar contadores por etapa
        const etapasData = [
          { nombre: 'Lead Nuevo', cantidad: 0, valor: 0, color: 'bg-gray-500', key: 'Lead Nuevo' },
          { nombre: 'Contactado', cantidad: 0, valor: 0, color: 'bg-blue-500', key: 'Contactado' },
          { nombre: 'Cotización Enviada', cantidad: 0, valor: 0, color: 'bg-yellow-500', key: 'Cotización Enviada' },
          { nombre: 'Negociación', cantidad: 0, valor: 0, color: 'bg-orange-500', key: 'Negociación' },
          { nombre: 'Propuesta Final', cantidad: 0, valor: 0, color: 'bg-purple-500', key: 'Propuesta Final' },
          { nombre: 'Ganada', cantidad: 0, valor: 0, color: 'bg-green-500', key: 'Ganada' }
        ]

        // Procesar leads nuevos (que no son oportunidades aún)
        const leadsNuevos = leads.filter(lead => {
          const estado = lead.estado || 'Nuevo'
          return estado === 'Nuevo' || estado === 'Lead Nuevo'
        })
        etapasData[0].cantidad += leadsNuevos.length

        // Procesar oportunidades por etapa
        oportunidades.forEach(oportunidad => {
          const estado = oportunidad.estado || oportunidad.etapa || 'Lead Nuevo'
          const etapaKey = mapeoEtapas[estado] || 'Lead Nuevo'
          
          const etapaIndex = etapasData.findIndex(e => e.key === etapaKey)
          if (etapaIndex !== -1) {
            etapasData[etapaIndex].cantidad += 1
            const valor = parseFloat(oportunidad.monto || oportunidad.valor || oportunidad.montoEstimado || 0)
            etapasData[etapaIndex].valor += valor
          }
        })

        // Calcular estadísticas globales
        const totalOportunidades = oportunidades.length
        const valorTotal = etapasData.reduce((sum, etapa) => sum + etapa.valor, 0)
        
        // Calcular tasa de conversión (Ganadas / Lead Nuevo)
        const leadsNuevosCount = etapasData[0].cantidad
        const ganadasCount = etapasData[5].cantidad
        const tasaConversion = leadsNuevosCount > 0 
          ? ((ganadasCount / leadsNuevosCount) * 100).toFixed(1) 
          : 0

        setEtapas(etapasData)
        setEstadisticas({
          oportunidadesActivas: totalOportunidades,
          valorTotal: valorTotal,
          tasaConversion: parseFloat(tasaConversion),
          cicloPromedio: 0 // Por ahora 0, se puede calcular con fechas más adelante
        })
      } catch (error) {
        console.error('Error al cargar datos del pipeline:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Pipeline / Embudo de Ventas
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Visualiza el proceso comercial y detecta dónde se estancan las ventas
        </p>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Oportunidades Activas</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {cargando ? '...' : estadisticas.oportunidadesActivas}
              </p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Valor Total Pipeline</p>
              <p className="text-2xl font-bold text-green-600">
                {cargando ? '...' : `S/ ${estadisticas.valorTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
            <DollarSign className="text-green-600" size={32} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tasa de Conversión</p>
              <p className="text-2xl font-bold text-purple-600">
                {cargando ? '...' : `${estadisticas.tasaConversion}%`}
              </p>
            </div>
            <TrendingUp className="text-purple-600" size={32} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ciclo Promedio</p>
              <p className="text-2xl font-bold text-blue-600">
                {cargando ? '...' : estadisticas.cicloPromedio > 0 ? `${estadisticas.cicloPromedio} días` : 'N/A'}
              </p>
            </div>
            <BarChart3 className="text-blue-600" size={32} />
          </div>
        </div>
      </div>

      {/* Información sobre Pipeline */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-purple-900 mb-2">¿Qué es el Pipeline / Embudo?</h3>
        <p className="text-sm text-purple-800 mb-2">
          Es la vista visual del proceso de ventas que te permite:
        </p>
        <ul className="text-sm text-purple-700 space-y-1 ml-4">
          <li>• Ver cuántos clientes hay en cada etapa</li>
          <li>• Identificar dónde se estancan las ventas</li>
          <li>• Calcular el valor potencial en cada fase</li>
          <li>• Priorizar esfuerzos comerciales</li>
        </ul>
      </div>

      {/* Embudo Visual */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Embudo de Conversión
        </h2>
        <div className="space-y-3">
          {etapas.map((etapa, index) => {
            // Calcular porcentaje basado en la cantidad real vs la primera etapa
            const primeraEtapaCantidad = etapas[0].cantidad
            let porcentaje = 0
            
            if (index === 0) {
              // La primera etapa siempre es 100% si tiene datos
              porcentaje = primeraEtapaCantidad > 0 ? 100 : 0
            } else {
              // Las demás etapas se calculan respecto a la primera
              porcentaje = primeraEtapaCantidad > 0 
                ? Math.round((etapa.cantidad / primeraEtapaCantidad) * 100) 
                : 0
            }
            
            // Ancho mínimo del 10% para etapas con datos (excepto la primera que puede ser menos si es muy pequeña)
            const anchoBarra = porcentaje > 0 
              ? (index === 0 ? Math.max(porcentaje, 5) : Math.max(porcentaje, 10)) 
              : 0
            
            return (
              <div key={index}>
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {etapa.nombre}
                  </span>
                  <div className="ml-auto flex items-center gap-4">
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {etapa.cantidad} {etapa.cantidad === 1 ? 'oportunidad' : 'oportunidades'}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      S/ {etapa.valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  {etapa.cantidad > 0 ? (
                    <div 
                      className={`h-16 rounded-lg ${etapa.color} transition-all duration-300 flex items-center justify-between px-4 text-white`}
                      style={{ width: `${anchoBarra}%` }}
                    >
                      <span className="font-semibold">{porcentaje}%</span>
                      {index < etapas.length - 1 && (
                        <ChevronRight size={24} className="opacity-70" />
                      )}
                    </div>
                  ) : (
                    <div 
                      className="h-16 rounded-lg bg-gray-200 transition-all duration-300 flex items-center justify-between px-4"
                      style={{ width: '100%' }}
                    >
                      <span className="font-semibold text-gray-500">0%</span>
                      {index < etapas.length - 1 && (
                        <ChevronRight size={24} className="opacity-30" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insights y Análisis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Etapas con Mayor Abandono
          </h3>
          <div className="space-y-3">
            {etapas.length > 0 && etapas.some(e => e.cantidad > 0) ? (
              etapas
                .map((etapa, index) => {
                  if (index === 0 || index === etapas.length - 1) return null // Excluir primera y última
                  const primeraCantidad = etapas[0].cantidad || 1
                  const etapaAnterior = etapas[index - 1].cantidad || 1
                  const tasaAbandono = etapaAnterior > 0 
                    ? ((etapaAnterior - etapa.cantidad) / etapaAnterior * 100).toFixed(1)
                    : 0
                  return { etapa, tasaAbandono, index }
                })
                .filter(item => item !== null)
                .sort((a, b) => parseFloat(b.tasaAbandono) - parseFloat(a.tasaAbandono))
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-red-900">{item.etapa.nombre}</span>
                    <span className="text-sm font-bold text-red-700">{item.tasaAbandono}%</span>
                  </div>
                ))
            ) : (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-900">No hay datos suficientes</span>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Recomendaciones
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 Comienza registrando leads y oportunidades para ver el embudo en acción
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-900">
                ⚡ Define bien cada etapa para medir conversiones correctamente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detalles por Etapa */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Oportunidades por Etapa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {etapas.slice(2, 5).map((etapa, index) => (
            <div 
              key={index}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  {etapa.nombre}
                </h3>
                <span className={`w-3 h-3 rounded-full ${etapa.color}`}></span>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                {etapa.cantidad}
              </p>
              <p className="text-sm text-green-600 font-semibold">
                S/ {etapa.valor.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Pipeline
