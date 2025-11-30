import { useState } from 'react'
import { Plus, CheckCircle2, Circle, Clock, Calendar, User } from 'lucide-react'

const Tareas = () => {
  const [tareas, setTareas] = useState([
    {
      id: 1,
      titulo: 'Seguimiento con cliente Juan Pérez',
      descripcion: 'Llamar para discutir propuesta de servicio',
      prioridad: 'Alta',
      estado: 'Pendiente',
      fechaVencimiento: '2024-01-25',
      asignado: 'Admin Usuario',
      categoria: 'Ventas'
    },
    {
      id: 2,
      titulo: 'Preparar presentación para reunión',
      descripcion: 'Crear slides para presentación de productos',
      prioridad: 'Media',
      estado: 'En Progreso',
      fechaVencimiento: '2024-01-23',
      asignado: 'Admin Usuario',
      categoria: 'Marketing'
    },
    {
      id: 3,
      titulo: 'Revisar contratos pendientes',
      descripcion: 'Revisar y firmar 3 contratos pendientes',
      prioridad: 'Alta',
      estado: 'Pendiente',
      fechaVencimiento: '2024-01-22',
      asignado: 'Admin Usuario',
      categoria: 'Legal'
    },
    {
      id: 4,
      titulo: 'Actualizar base de datos de clientes',
      descripcion: 'Verificar y actualizar información de contactos',
      prioridad: 'Baja',
      estado: 'Completada',
      fechaVencimiento: '2024-01-20',
      asignado: 'Admin Usuario',
      categoria: 'Administración'
    },
  ])

  const toggleTarea = (id) => {
    setTareas(tareas.map(tarea => 
      tarea.id === id 
        ? { ...tarea, estado: tarea.estado === 'Completada' ? 'Pendiente' : 'Completada' }
        : tarea
    ))
  }

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Alta':
        return 'bg-red-100 text-red-800'
      case 'Media':
        return 'bg-yellow-100 text-yellow-800'
      case 'Baja':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const tareasPendientes = tareas.filter(t => t.estado !== 'Completada').length
  const tareasCompletadas = tareas.filter(t => t.estado === 'Completada').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tareas</h1>
          <p className="text-gray-600 mt-1">Gestiona tus tareas y actividades</p>
        </div>
        <button className="btn-primary mt-4 sm:mt-0 flex items-center space-x-2">
          <Plus size={20} />
          <span>Nueva Tarea</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tareas</p>
              <p className="text-2xl font-bold text-gray-900">{tareas.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-100">
              <Clock className="text-primary-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{tareasPendientes}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <Circle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completadas</p>
              <p className="text-2xl font-bold text-green-600">{tareasCompletadas}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tareas.map((tarea) => (
          <div 
            key={tarea.id} 
            className={`card hover:shadow-md transition-all ${
              tarea.estado === 'Completada' ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-start space-x-4">
              <button
                onClick={() => toggleTarea(tarea.id)}
                className="mt-1 flex-shrink-0"
              >
                {tarea.estado === 'Completada' ? (
                  <CheckCircle2 className="text-green-600" size={24} />
                ) : (
                  <Circle className="text-gray-400 hover:text-primary-600" size={24} />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${
                      tarea.estado === 'Completada' 
                        ? 'text-gray-500 line-through' 
                        : 'text-gray-900'
                    }`}>
                      {tarea.titulo}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{tarea.descripcion}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ml-4 ${getPrioridadColor(tarea.prioridad)}`}>
                    {tarea.prioridad}
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    {new Date(tarea.fechaVencimiento).toLocaleDateString('es-ES')}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User size={16} className="mr-2 text-gray-400" />
                    {tarea.asignado}
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                    {tarea.categoria}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    tarea.estado === 'Completada'
                      ? 'bg-green-100 text-green-800'
                      : tarea.estado === 'En Progreso'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tarea.estado}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tareas

