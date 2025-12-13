import { useState } from 'react'
import { Target, Plus, Edit, Trash2, CheckCircle, Circle, TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useCurrency } from '../contexts/CurrencyContext'

const Objetivos = () => {
  const { formatCurrency } = useCurrency()
  const [objetivos, setObjetivos] = useState([
    {
      id: 1,
      titulo: 'Aumentar ventas mensuales',
      descripcion: 'Alcanzar S/ 150,000 en ventas este mes',
      meta: 150000,
      actual: 114000,
      fechaLimite: '2025-12-31',
      estado: 'en_progreso',
      categoria: 'Ventas'
    },
    {
      id: 2,
      titulo: 'Aumentar clientes activos',
      descripcion: 'Llegar a 500 clientes activos',
      meta: 500,
      actual: 330,
      fechaLimite: '2025-12-31',
      estado: 'en_progreso',
      categoria: 'Clientes'
    }
  ])

  const [showModal, setShowModal] = useState(false)
  const [objetivoEditando, setObjetivoEditando] = useState(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    meta: '',
    fechaLimite: '',
    categoria: 'Ventas'
  })

  const calcularProgreso = (actual, meta) => {
    return Math.min((actual / meta) * 100, 100).toFixed(1)
  }

  const calcularFaltante = (actual, meta) => {
    return Math.max(meta - actual, 0)
  }

  const formatearValor = (valor, categoria) => {
    if (categoria === 'Ventas') {
      return formatCurrency(valor)
    }
    return valor.toLocaleString('es-ES')
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pendiente':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleGuardar = () => {
    if (objetivoEditando) {
      // Editar
      setObjetivos(objetivos.map(obj => 
        obj.id === objetivoEditando.id 
          ? { ...objetivoEditando, ...formData, meta: parseFloat(formData.meta) }
          : obj
      ))
    } else {
      // Crear nuevo
      const nuevoObjetivo = {
        id: objetivos.length + 1,
        ...formData,
        meta: parseFloat(formData.meta),
        actual: 0,
        estado: 'pendiente'
      }
      setObjetivos([...objetivos, nuevoObjetivo])
    }
    setShowModal(false)
    setObjetivoEditando(null)
    setFormData({
      titulo: '',
      descripcion: '',
      meta: '',
      fechaLimite: '',
      categoria: 'Ventas'
    })
  }

  const handleEditar = (objetivo) => {
    setObjetivoEditando(objetivo)
    setFormData({
      titulo: objetivo.titulo,
      descripcion: objetivo.descripcion,
      meta: objetivo.meta.toString(),
      fechaLimite: objetivo.fechaLimite,
      categoria: objetivo.categoria
    })
    setShowModal(true)
  }

  const handleEliminar = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este objetivo?')) {
      setObjetivos(objetivos.filter(obj => obj.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Objetivos
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestiona y monitorea tus objetivos de negocio
          </p>
        </div>
        <button
          onClick={() => {
            setObjetivoEditando(null)
            setFormData({
              titulo: '',
              descripcion: '',
              meta: '',
              fechaLimite: '',
              categoria: 'Ventas'
            })
            setShowModal(true)
          }}
          className="mt-4 sm:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Objetivo
        </button>
      </div>

      {/* Lista de Objetivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {objetivos.map((objetivo) => {
          const progreso = calcularProgreso(objetivo.actual, objetivo.meta)
          return (
            <div
              key={objetivo.id}
              className="border rounded-lg p-6"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={20} className="text-primary-600" />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                      {objetivo.titulo}
                    </h3>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {objetivo.descripcion}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getEstadoColor(objetivo.estado)}`}>
                    {objetivo.estado === 'completado' ? 'Completado' : 
                     objetivo.estado === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditar(objetivo)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleEliminar(objetivo.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Métrica Comparativa Visual */}
              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Valor Actual */}
                  <div className="text-center p-3 rounded-lg border-2 border-blue-200" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Actual
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatearValor(objetivo.actual, objetivo.categoria)}
                    </p>
                  </div>
                  
                  {/* Meta Deseada */}
                  <div className="text-center p-3 rounded-lg border-2 border-green-200" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Meta
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatearValor(objetivo.meta, objetivo.categoria)}
                    </p>
                  </div>
                </div>

                {/* Gráfico de Barras Comparativo */}
                <div className="mb-3" style={{ height: '120px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Actual',
                          valor: objetivo.actual,
                          color: '#3b82f6'
                        },
                        {
                          name: 'Meta',
                          valor: objetivo.meta,
                          color: '#22c55e'
                        }
                      ]}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        domain={[0, objetivo.meta * 1.1]}
                        tickFormatter={(value) => {
                          if (objetivo.categoria === 'Ventas') {
                            return formatCurrency(value)
                          }
                          return value.toLocaleString('es-ES')
                        }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={60}
                      />
                      <Tooltip
                        formatter={(value) => {
                          return formatearValor(value, objetivo.categoria)
                        }}
                      />
                      <Bar 
                        dataKey="valor" 
                        radius={[0, 8, 8, 0]}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#22c55e" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Información de Diferencia */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {objetivo.actual >= objetivo.meta ? (
                      <>
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-green-600 font-semibold">
                          Objetivo alcanzado
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUp size={16} className="text-orange-600" />
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          Faltan: <span className="font-semibold text-orange-600">
                            {formatearValor(calcularFaltante(objetivo.actual, objetivo.meta), objetivo.categoria)}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    {progreso}% completado
                  </span>
                </div>

                {/* Comparación Visual Adicional - Barras Horizontales */}
                <div className="mt-4 space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-blue-600">Actual</span>
                      <span className="font-semibold">{formatearValor(objetivo.actual, objetivo.categoria)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                      <div
                        className="bg-blue-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ 
                          width: `${Math.min((objetivo.actual / objetivo.meta) * 100, 100)}%`,
                          maxWidth: '100%'
                        }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {Math.min((objetivo.actual / objetivo.meta) * 100, 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-green-600">Meta</span>
                      <span className="font-semibold">{formatearValor(objetivo.meta, objetivo.categoria)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                      <div
                        className="bg-green-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: '100%' }}
                      >
                        <span className="text-xs font-semibold text-white">100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              </div>

              {/* Información adicional */}
              <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <span>Categoría: {objetivo.categoria}</span>
                <span>Fecha límite: {new Date(objetivo.fechaLimite).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal para crear/editar objetivo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold">
                {objetivoEditando ? 'Editar Objetivo' : 'Nuevo Objetivo'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setObjetivoEditando(null)
                }}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meta *</label>
                  <input
                    type="number"
                    value={formData.meta}
                    onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={formData.fechaLimite}
                    onChange={(e) => setFormData({ ...formData, fechaLimite: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Ventas">Ventas</option>
                  <option value="Clientes">Clientes</option>
                  <option value="Productos">Productos</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setObjetivoEditando(null)
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {objetivoEditando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Objetivos

