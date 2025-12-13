import { useState } from 'react'
import { Brain, Sparkles, TrendingUp, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react'

const ReporteIA = () => {
  const [cargando, setCargando] = useState(false)
  const [reporte, setReporte] = useState(null)

  const generarReporte = async () => {
    setCargando(true)
    
    // Simular generación de reporte (en producción esto llamaría a una API de IA)
    setTimeout(() => {
      setReporte({
        resumen: 'Tu negocio muestra un crecimiento positivo del 17% este mes. Las ventas han aumentado consistentemente, especialmente en productos de la categoría premium.',
        insights: [
          {
            tipo: 'oportunidad',
            titulo: 'Oportunidad de Crecimiento',
            descripcion: 'Los clientes que compran productos premium tienen un 40% más de probabilidad de realizar compras recurrentes. Considera crear un programa de fidelización para este segmento.',
            impacto: 'Alto',
            accion: 'Crear programa de fidelización premium'
          },
          {
            tipo: 'alerta',
            titulo: 'Atención Requerida',
            descripcion: 'Las ventas en la categoría "Electrónicos" han disminuido un 15% este mes. Revisa el inventario y considera promociones especiales.',
            impacto: 'Medio',
            accion: 'Revisar estrategia de marketing para electrónicos'
          },
          {
            tipo: 'recomendacion',
            titulo: 'Recomendación Estratégica',
            descripcion: 'El horario de mayor venta es entre 2pm y 6pm. Considera aumentar el personal durante estas horas para mejorar el servicio.',
            impacto: 'Medio',
            accion: 'Optimizar horarios de personal'
          }
        ],
        metricas: [
          { nombre: 'Tendencia de Ventas', valor: '+17%', estado: 'positivo' },
          { nombre: 'Satisfacción del Cliente', valor: '4.5/5', estado: 'positivo' },
          { nombre: 'Tasa de Conversión', valor: '23%', estado: 'positivo' },
          { nombre: 'Retención de Clientes', valor: '68%', estado: 'neutro' }
        ],
        predicciones: [
          'Se espera un aumento del 12% en ventas para el próximo mes',
          'La demanda de productos premium continuará creciendo',
          'El mes de diciembre mostrará un pico de ventas del 35%'
        ]
      })
      setCargando(false)
    }, 2000)
  }

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'oportunidad':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'alerta':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'recomendacion':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTipoIcono = (tipo) => {
    switch (tipo) {
      case 'oportunidad':
        return <TrendingUp size={20} />
      case 'alerta':
        return <AlertCircle size={20} />
      case 'recomendacion':
        return <Lightbulb size={20} />
      default:
        return <Brain size={20} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Reporte IA
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Análisis inteligente y predicciones de tu negocio
          </p>
        </div>
        <button
          onClick={generarReporte}
          disabled={cargando}
          className="mt-4 sm:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              <span>Generando...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Generar Reporte IA</span>
            </>
          )}
        </button>
      </div>

      {!reporte && !cargando && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <Brain size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            No hay reporte generado
          </h3>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Haz clic en "Generar Reporte IA" para obtener análisis inteligente de tu negocio
          </p>
        </div>
      )}

      {cargando && (
        <div className="border rounded-lg p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <RefreshCw size={48} className="mx-auto mb-4 text-primary-600 animate-spin" />
          <p className="text-lg" style={{ color: 'var(--color-text)' }}>
            Analizando datos y generando insights...
          </p>
        </div>
      )}

      {reporte && (
        <div className="space-y-6">
          {/* Resumen Ejecutivo */}
          <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Brain size={24} className="text-primary-600" />
              Resumen Ejecutivo
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {reporte.resumen}
            </p>
          </div>

          {/* Insights */}
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Insights Clave
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reporte.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-5 ${getTipoColor(insight.tipo)}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="mt-1">
                      {getTipoIcono(insight.tipo)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{insight.titulo}</h3>
                      <p className="text-sm mb-3 opacity-90">{insight.descripcion}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Impacto: {insight.impacto}</span>
                        <span className="opacity-75">{insight.accion}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas */}
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Métricas Clave
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {reporte.metricas.map((metrica, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 text-center"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {metrica.nombre}
                  </p>
                  <p className={`text-2xl font-bold ${
                    metrica.estado === 'positivo' ? 'text-green-600' :
                    metrica.estado === 'negativo' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {metrica.valor}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Predicciones */}
          <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <TrendingUp size={24} className="text-primary-600" />
              Predicciones
            </h2>
            <ul className="space-y-3">
              {reporte.predicciones.map((prediccion, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Sparkles size={18} className="text-primary-600 mt-1 flex-shrink-0" />
                  <p style={{ color: 'var(--color-text-secondary)' }}>{prediccion}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReporteIA

