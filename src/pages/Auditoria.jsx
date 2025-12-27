import { useState, useEffect } from 'react'
import { FileCheck, Search, Calendar, User, Clock, Filter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getAuditoria } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const Auditoria = () => {
  const { companyId } = useAuth()
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('Todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const acciones = ['Crear', 'Editar', 'Eliminar', 'Login', 'Logout', 'Exportar', 'Importar', 'Aprobar', 'Rechazar', 'Otro']

  useEffect(() => {
    loadData()
  }, [companyId, fechaDesde, fechaHasta])

  const loadData = async () => {
    try {
      setLoading(true)
      const registrosData = await getAuditoria(companyId, fechaDesde || null, fechaHasta || null)
      setRegistros(registrosData || [])
    } catch (error) {
      console.error('Error al cargar auditoría:', error)
      setRegistros([])
    } finally {
      setLoading(false)
    }
  }

  const getAccionColor = (accion) => {
    switch(accion) {
      case 'Crear':
        return 'bg-green-100 text-green-800'
      case 'Editar':
        return 'bg-blue-100 text-blue-800'
      case 'Eliminar':
        return 'bg-red-100 text-red-800'
      case 'Login':
        return 'bg-purple-100 text-purple-800'
      case 'Logout':
        return 'bg-gray-100 text-gray-800'
      case 'Exportar':
        return 'bg-yellow-100 text-yellow-800'
      case 'Aprobar':
        return 'bg-green-100 text-green-800'
      case 'Rechazar':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRegistros = registros.filter(reg =>
    reg.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.accion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.modulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.detalle?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(reg => filtroAccion === 'Todos' || reg.accion === filtroAccion)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando registros de auditoría...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Auditoría
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Registro de todas las acciones realizadas en el sistema para trazabilidad y cumplimiento.
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar..."
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
          <div>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              <option value="Todos">Todas las acciones</option>
              {acciones.map(accion => (
                <option key={accion} value={accion}>{accion}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              placeholder="Fecha desde"
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
          <div>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              placeholder="Fecha hasta"
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Registros</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{registros.length}</p>
            </div>
            <FileCheck className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Creaciones</p>
              <p className="text-2xl font-bold text-green-600">
                {registros.filter(r => r.accion === 'Crear').length}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ediciones</p>
              <p className="text-2xl font-bold text-blue-600">
                {registros.filter(r => r.accion === 'Editar').length}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Eliminaciones</p>
              <p className="text-2xl font-bold text-red-600">
                {registros.filter(r => r.accion === 'Eliminar').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Fecha y Hora</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Usuario</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acción</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Módulo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistros.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <FileCheck size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay registros de auditoría</p>
                  <p className="text-sm">Los registros aparecerán aquí cuando se realicen acciones en el sistema</p>
                </td>
              </tr>
            ) : (
              filteredRegistros.map((registro) => {
                const fecha = registro.fecha?.toDate ? registro.fecha.toDate() : new Date(registro.fecha || registro.createdAt?.toDate?.() || Date.now())
                return (
                  <tr key={registro.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span>{formatDate(fecha.toISOString().split('T')[0])}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span style={{ color: 'var(--color-text)' }}>{registro.usuario || 'Usuario'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getAccionColor(registro.accion)}`}>
                        {registro.accion || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{registro.modulo || '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{registro.detalle || '-'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Auditoria

