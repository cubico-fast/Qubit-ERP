import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'

const Clientes = () => {
  const { formatCurrency } = useCurrency()
  const [clientes] = useState([
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      telefono: '+34 600 123 456',
      empresa: 'Tech Solutions',
      ciudad: 'Madrid',
      estado: 'Activo',
      ventas: 12500
    },
    {
      id: 2,
      nombre: 'María García',
      email: 'maria@example.com',
      telefono: '+34 600 234 567',
      empresa: 'Digital Marketing',
      ciudad: 'Barcelona',
      estado: 'Activo',
      ventas: 8900
    },
    {
      id: 3,
      nombre: 'Carlos López',
      email: 'carlos@example.com',
      telefono: '+34 600 345 678',
      empresa: 'Innovation Labs',
      ciudad: 'Valencia',
      estado: 'Inactivo',
      ventas: 5600
    },
    {
      id: 4,
      nombre: 'Ana Martínez',
      email: 'ana@example.com',
      telefono: '+34 600 456 789',
      empresa: 'Creative Studio',
      ciudad: 'Sevilla',
      estado: 'Activo',
      ventas: 15200
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gestiona tu base de datos de clientes</p>
        </div>
        <button className="btn-primary mt-4 sm:mt-0 flex items-center space-x-2">
          <Plus size={20} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
            />
          </div>
          <div className="flex space-x-2">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Todos los estados</option>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Clientes</p>
          <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Clientes Activos</p>
          <p className="text-2xl font-bold text-green-600">
            {clientes.filter(c => c.estado === 'Activo').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Ventas Totales</p>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(clientes.reduce((sum, c) => sum + c.ventas, 0))}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ventas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                        {cliente.nombre.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin size={12} className="mr-1" />
                          {cliente.ciudad}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{cliente.empresa}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center space-x-4">
                      <div className="flex items-center text-gray-600">
                        <Mail size={14} className="mr-1" />
                        {cliente.email}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone size={14} className="mr-1" />
                        {cliente.telefono}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      cliente.estado === 'Activo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cliente.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(cliente.ventas)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Clientes

