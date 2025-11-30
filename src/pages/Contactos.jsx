import { useState } from 'react'
import { Plus, Search, Mail, Phone, Building, Calendar } from 'lucide-react'

const Contactos = () => {
  const [contactos] = useState([
    {
      id: 1,
      nombre: 'Roberto Silva',
      email: 'roberto@example.com',
      telefono: '+34 600 111 222',
      empresa: 'Tech Corp',
      cargo: 'Director',
      ultimoContacto: '2024-01-15',
      estado: 'Caliente'
    },
    {
      id: 2,
      nombre: 'Laura Fernández',
      email: 'laura@example.com',
      telefono: '+34 600 222 333',
      empresa: 'Marketing Pro',
      cargo: 'Gerente',
      ultimoContacto: '2024-01-10',
      estado: 'Tibio'
    },
    {
      id: 3,
      nombre: 'Pedro Ruiz',
      email: 'pedro@example.com',
      telefono: '+34 600 333 444',
      empresa: 'Design Studio',
      cargo: 'CEO',
      ultimoContacto: '2024-01-05',
      estado: 'Frío'
    },
    {
      id: 4,
      nombre: 'Sofía Morales',
      email: 'sofia@example.com',
      telefono: '+34 600 444 555',
      empresa: 'Innovation Hub',
      cargo: 'CTO',
      ultimoContacto: '2024-01-20',
      estado: 'Caliente'
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')

  const filteredContactos = contactos.filter(contacto =>
    contacto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contacto.empresa.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Caliente':
        return 'bg-red-100 text-red-800'
      case 'Tibio':
        return 'bg-yellow-100 text-yellow-800'
      case 'Frío':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contactos</h1>
          <p className="text-gray-600 mt-1">Gestiona tus contactos y leads</p>
        </div>
        <button className="btn-primary mt-4 sm:mt-0 flex items-center space-x-2">
          <Plus size={20} />
          <span>Nuevo Contacto</span>
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar contactos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContactos.map((contacto) => (
          <div key={contacto.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  {contacto.nombre.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{contacto.nombre}</h3>
                  <p className="text-sm text-gray-600">{contacto.cargo}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(contacto.estado)}`}>
                {contacto.estado}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Building size={16} className="mr-2 text-gray-400" />
                {contacto.empresa}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail size={16} className="mr-2 text-gray-400" />
                {contacto.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone size={16} className="mr-2 text-gray-400" />
                {contacto.telefono}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-2 text-gray-400" />
                Último contacto: {new Date(contacto.ultimoContacto).toLocaleDateString('es-ES')}
              </div>
            </div>

            <div className="flex space-x-2 pt-4 border-t border-gray-200">
              <button className="flex-1 btn-secondary text-sm">Ver Detalles</button>
              <button className="flex-1 btn-primary text-sm">Contactar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Contactos

