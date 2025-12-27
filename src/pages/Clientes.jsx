import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Eye, DollarSign, AlertCircle, ShoppingCart, User, Calendar, TrendingUp, TrendingDown, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { getClientes, saveCliente, updateCliente, deleteCliente, getVentas, getReclamos } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const Clientes = () => {
  const { companyId } = useAuth()
  const { formatCurrency } = useCurrency()
  const [clientes, setClientes] = useState([])
  const [ventas, setVentas] = useState([])
  const [reclamos, setReclamos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    ciudad: '',
    direccion: '',
    estado: 'Activo',
    limiteCredito: 0,
    diasCredito: 30,
    contacto: '',
    preferencias: []
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [clientesData, ventasData, reclamosData] = await Promise.all([
        getClientes(companyId),
        getVentas(companyId),
        getReclamos(companyId)
      ])
      
      setClientes(clientesData || [])
      setVentas(ventasData || [])
      setReclamos(reclamosData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setClientes([])
      setVentas([])
      setReclamos([])
    } finally {
      setLoading(false)
    }
  }

  const getHistorialCliente = (clienteId) => {
    return ventas.filter(v => v.clienteId === clienteId || v.cliente === clientes.find(c => c.id === clienteId)?.nombre)
  }

  const getReclamosCliente = (clienteId) => {
    return reclamos.filter(r => r.clienteId === clienteId)
  }

  const getDeudaCliente = (clienteId) => {
    const ventasCliente = getHistorialCliente(clienteId)
    const ventasPendientes = ventasCliente.filter(v => 
      v.estado === 'Completada' && 
      v.formaPago === 'Crédito'
    )
    
    return ventasPendientes.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
  }

  const getVentasUltimosMeses = (clienteId, meses = 6) => {
    const ventasCliente = getHistorialCliente(clienteId)
    const fechaLimite = new Date()
    fechaLimite.setMonth(fechaLimite.getMonth() - meses)
    
    return ventasCliente.filter(v => {
      const fechaVenta = new Date(v.fecha || v.createdAt)
      return fechaVenta >= fechaLimite
    })
  }

  const evaluarCliente = (cliente) => {
    const historial = getHistorialCliente(cliente.id)
    const reclamosCliente = getReclamosCliente(cliente.id)
    const deuda = getDeudaCliente(cliente.id)
    const ventasRecientes = getVentasUltimosMeses(cliente.id, 6)
    const totalVentasRecientes = ventasRecientes.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0)
    
    const limiteCredito = parseFloat(cliente.limiteCredito || 0)
    const porcentajeUso = limiteCredito > 0 ? (deuda / limiteCredito) * 100 : 0
    
    let riesgo = 'Bajo'
    let puedeVender = true
    let requiereAprobacion = false
    
    // Evaluar riesgo
    if (reclamosCliente.length > 2 || porcentajeUso > 90) {
      riesgo = 'Alto'
      puedeVender = false
      requiereAprobacion = true
    } else if (reclamosCliente.length > 0 || porcentajeUso > 70) {
      riesgo = 'Medio'
      puedeVender = true
      requiereAprobacion = true
    }
    
    return {
      historial,
      reclamos: reclamosCliente,
      deuda,
      totalVentasRecientes,
      porcentajeUso,
      riesgo,
      puedeVender,
      requiereAprobacion
    }
  }

  const handleCrearCliente = () => {
    setModoModal('crear')
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      empresa: '',
      ciudad: '',
      direccion: '',
      estado: 'Activo',
      limiteCredito: 0,
      diasCredito: 30,
      contacto: '',
      preferencias: []
    })
    setShowModal(true)
  }

  const handleEditarCliente = (cliente) => {
    setModoModal('editar')
    setClienteSeleccionado(cliente)
    setFormData({
      nombre: cliente.nombre || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      empresa: cliente.empresa || '',
      ciudad: cliente.ciudad || '',
      direccion: cliente.direccion || '',
      estado: cliente.estado || 'Activo',
      limiteCredito: cliente.limiteCredito || 0,
      diasCredito: cliente.diasCredito || 30,
      contacto: cliente.contacto || '',
      preferencias: cliente.preferencias || []
    })
    setShowModal(true)
  }

  const handleGuardarCliente = async () => {
    try {
      if (!formData.nombre || !formData.email) {
        alert('Debe completar nombre y email')
        return
      }
      
      if (modoModal === 'crear') {
        await saveCliente(formData, companyId)
      } else {
        await updateCliente(clienteSeleccionado.id, formData, companyId)
      }
      
      await loadData()
      setShowModal(false)
      alert('✅ Cliente guardado exitosamente')
    } catch (error) {
      console.error('Error al guardar cliente:', error)
      alert('Error al guardar el cliente: ' + error.message)
    }
  }

  const handleVerDetalle = (cliente) => {
    setClienteSeleccionado(cliente)
    setShowDetalleModal(true)
  }

  const handleEliminarCliente = async (cliente) => {
    if (!window.confirm(`¿Está seguro de eliminar al cliente ${cliente.nombre}?`)) {
      return
    }
    
    try {
      await deleteCliente(cliente.id, companyId)
      await loadData()
      alert('✅ Cliente eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar cliente:', error)
      alert('Error al eliminar el cliente: ' + error.message)
    }
  }

  const filteredClientes = clientes.filter(cliente => {
    const matchSearch = 
      cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchEstado = filtroEstado === 'Todos' || cliente.estado === filtroEstado
    
    return matchSearch && matchEstado
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes (CRM)</h1>
          <p className="text-gray-600 mt-1">Centraliza información del cliente: historial, reclamos, deudas y preferencias</p>
        </div>
        <button onClick={handleCrearCliente} className="btn-primary mt-4 sm:mt-0 flex items-center space-x-2">
          <Plus size={20} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <p className="text-sm text-gray-600 mb-1">Con Deuda</p>
          <p className="text-2xl font-bold text-yellow-600">
            {clientes.filter(c => getDeudaCliente(c.id) > 0).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Con Reclamos</p>
          <p className="text-2xl font-bold text-red-600">
            {clientes.filter(c => getReclamosCliente(c.id).length > 0).length}
          </p>
        </div>
      </div>

      {/* Filtros */}
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
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ventas (6 meses)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deuda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reclamos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Riesgo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => {
                  const evaluacion = evaluarCliente(cliente)
                  const deuda = evaluacion.deuda
                  const reclamosCount = evaluacion.reclamos.length
                  
                  return (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                            {cliente.nombre?.split(' ').map(n => n[0]).join('') || 'C'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{cliente.nombre || 'N/A'}</div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin size={12} className="mr-1" />
                              {cliente.ciudad || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cliente.empresa || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div className="flex items-center text-gray-600">
                            <Mail size={14} className="mr-1" />
                            {cliente.email || 'N/A'}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Phone size={14} className="mr-1" />
                            {cliente.telefono || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(evaluacion.totalVentasRecientes)}
                        </div>
                        <div className="text-xs text-gray-500">{evaluacion.historial.length} venta(s)</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          deuda > 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {formatCurrency(deuda)}
                        </div>
                        {cliente.limiteCredito > 0 && (
                          <div className="text-xs text-gray-500">
                            {evaluacion.porcentajeUso.toFixed(1)}% usado
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          reclamosCount > 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {reclamosCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          evaluacion.riesgo === 'Alto' ? 'bg-red-100 text-red-800' :
                          evaluacion.riesgo === 'Medio' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {evaluacion.riesgo}
                        </span>
                        {evaluacion.requiereAprobacion && (
                          <div className="text-xs text-yellow-600 mt-1">Requiere aprobación</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          cliente.estado === 'Activo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {cliente.estado || 'Activo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleVerDetalle(cliente)}
                            className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEditarCliente(cliente)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminarCliente(cliente)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {modoModal === 'crear' ? 'Nuevo Cliente' : 'Editar Cliente'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <input
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Crédito</label>
                  <input
                    type="number"
                    value={formData.limiteCredito}
                    onChange={(e) => setFormData({ ...formData, limiteCredito: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Días de Crédito</label>
                  <input
                    type="number"
                    value={formData.diasCredito}
                    onChange={(e) => setFormData({ ...formData, diasCredito: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCliente}
                className="btn-primary"
              >
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Cliente */}
      {showDetalleModal && clienteSeleccionado && (() => {
        const evaluacion = evaluarCliente(clienteSeleccionado)
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Detalle del Cliente</h2>
                <button onClick={() => setShowDetalleModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Información Básica */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nombre</p>
                      <p className="text-lg font-semibold">{clienteSeleccionado.nombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Empresa</p>
                      <p className="text-lg font-semibold">{clienteSeleccionado.empresa || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-lg font-semibold">{clienteSeleccionado.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="text-lg font-semibold">{clienteSeleccionado.telefono || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ciudad</p>
                      <p className="text-lg font-semibold">{clienteSeleccionado.ciudad || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Límite de Crédito</p>
                      <p className="text-lg font-semibold">{formatCurrency(clienteSeleccionado.limiteCredito || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Resumen Comercial */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Comercial</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card">
                      <p className="text-sm text-gray-600">Ventas (6 meses)</p>
                      <p className="text-xl font-bold text-primary-600">{formatCurrency(evaluacion.totalVentasRecientes)}</p>
                    </div>
                    <div className="card">
                      <p className="text-sm text-gray-600">Deuda Actual</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(evaluacion.deuda)}</p>
                    </div>
                    <div className="card">
                      <p className="text-sm text-gray-600">Reclamos</p>
                      <p className="text-xl font-bold text-yellow-600">{evaluacion.reclamos.length}</p>
                    </div>
                    <div className="card">
                      <p className="text-sm text-gray-600">Riesgo</p>
                      <p className={`text-xl font-bold ${
                        evaluacion.riesgo === 'Alto' ? 'text-red-600' :
                        evaluacion.riesgo === 'Medio' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {evaluacion.riesgo}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Historial de Compras */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Compras</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {evaluacion.historial.length === 0 ? (
                      <p className="text-gray-500">No hay compras registradas</p>
                    ) : (
                      evaluacion.historial.slice(0, 10).map((venta, index) => (
                        <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">{venta.tipoComprobante || venta.id}</span>
                            <span className="text-xs text-gray-500 ml-2">{formatDate(venta.fecha)}</span>
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(venta.total || 0)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Reclamos */}
                {evaluacion.reclamos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reclamos</h3>
                    <div className="space-y-2">
                      {evaluacion.reclamos.map((reclamo, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{reclamo.numeroReclamo || reclamo.id}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              reclamo.estado === 'Resuelto' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {reclamo.estado || 'Pendiente'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{reclamo.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowDetalleModal(false)}
                  className="btn-primary"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default Clientes
