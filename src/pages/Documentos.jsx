import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Edit, Trash, X, Upload, Download, Clock, User, Link as LinkIcon, Eye, History } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getDocumentos, saveDocumento, updateDocumento, deleteDocumento, getVersionesDocumento, crearVersionDocumento, getClientes, getProveedores, getProyectos, getPersonal } from '../utils/firebaseUtils'
import { formatDate } from '../utils/dateUtils'

const Documentos = () => {
  const { companyId } = useAuth()
  const [documentos, setDocumentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [showHistorialModal, setShowHistorialModal] = useState(false)
  const [modoModal, setModoModal] = useState('crear')
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null)
  const [versiones, setVersiones] = useState([])

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Contrato',
    area: 'Comercial',
    descripcion: '',
    estado: 'Borrador',
    tipoVinculacion: '',
    idVinculado: '',
    archivoUrl: '',
    archivoNombre: '',
    versionActual: '1.0'
  })

  const tiposDocumento = ['Contrato', 'Factura', 'Cotización', 'Orden de Compra', 'Guía de Remisión', 'Nota de Crédito', 'CV', 'Evaluación', 'Comprobante', 'Otro']
  const areas = ['Comercial', 'Finanzas', 'RRHH', 'Producción', 'Legal', 'Administración']
  const estados = ['Borrador', 'En Revisión', 'Aprobado', 'Vigente', 'Archivado']
  const tiposVinculacion = ['', 'Cliente', 'Proveedor', 'Proyecto', 'Empleado', 'Venta', 'Compra']

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [documentosData, clientesData, proveedoresData, proyectosData, personalData] = await Promise.all([
        getDocumentos(companyId),
        getClientes(companyId),
        getProveedores(companyId),
        getProyectos(companyId),
        getPersonal(companyId)
      ])
      
      setDocumentos(documentosData || [])
      setClientes(clientesData || [])
      setProveedores(proveedoresData || [])
      setProyectos(proyectosData || [])
      setPersonal(personalData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setDocumentos([])
      setClientes([])
      setProveedores([])
      setProyectos([])
      setPersonal([])
    } finally {
      setLoading(false)
    }
  }

  const loadVersiones = async (documentoId) => {
    try {
      const versionesData = await getVersionesDocumento(documentoId, companyId)
      setVersiones(versionesData || [])
    } catch (error) {
      console.error('Error al cargar versiones:', error)
      setVersiones([])
    }
  }

  const handleCrearDocumento = () => {
    setModoModal('crear')
    setDocumentoSeleccionado(null)
    setFormData({
      nombre: '',
      tipo: 'Contrato',
      area: 'Comercial',
      descripcion: '',
      estado: 'Borrador',
      tipoVinculacion: '',
      idVinculado: '',
      archivoUrl: '',
      archivoNombre: '',
      versionActual: '1.0'
    })
    setShowModal(true)
  }

  const handleEditarDocumento = (documento) => {
    setModoModal('editar')
    setDocumentoSeleccionado(documento)
    setFormData({
      nombre: documento.nombre || '',
      tipo: documento.tipo || 'Contrato',
      area: documento.area || 'Comercial',
      descripcion: documento.descripcion || '',
      estado: documento.estado || 'Borrador',
      tipoVinculacion: documento.tipoVinculacion || '',
      idVinculado: documento.idVinculado || '',
      archivoUrl: documento.archivoUrl || '',
      archivoNombre: documento.archivoNombre || '',
      versionActual: documento.versionActual || '1.0'
    })
    setShowModal(true)
  }

  const handleGuardarDocumento = async () => {
    try {
      if (!formData.nombre) {
        alert('El nombre del documento es obligatorio')
        return
      }

      const documentoData = {
        ...formData,
        versionActual: formData.versionActual || '1.0'
      }

      if (modoModal === 'crear') {
        await saveDocumento(documentoData, companyId)
        alert('✅ Documento creado exitosamente')
      } else {
        await updateDocumento(documentoSeleccionado.id, documentoData, companyId)
        alert('✅ Documento actualizado exitosamente')
      }

      await loadData()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar documento:', error)
      alert('Error al guardar documento: ' + error.message)
    }
  }

  const handleEliminarDocumento = async (documento) => {
    if (!window.confirm(`¿Está seguro de eliminar el documento "${documento.nombre}"?`)) {
      return
    }

    try {
      await deleteDocumento(documento.id)
      await loadData()
      alert('✅ Documento eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar documento:', error)
      alert('Error al eliminar documento: ' + error.message)
    }
  }

  const handleCrearVersion = async () => {
    try {
      if (!documentoSeleccionado) return

      const versionesActuales = await getVersionesDocumento(documentoSeleccionado.id, companyId)
      const ultimaVersion = versionesActuales.length > 0 
        ? parseFloat(versionesActuales[0].numeroVersion || '1.0')
        : parseFloat(documentoSeleccionado.versionActual || '1.0')
      
      const nuevaVersion = (ultimaVersion + 0.1).toFixed(1)

      await crearVersionDocumento(documentoSeleccionado.id, {
        numeroVersion: nuevaVersion,
        descripcion: `Versión ${nuevaVersion}`,
        cambios: formData.descripcion || 'Sin descripción de cambios'
      }, companyId)

      await updateDocumento(documentoSeleccionado.id, {
        versionActual: nuevaVersion
      }, companyId)

      alert(`✅ Versión ${nuevaVersion} creada exitosamente`)
      await loadData()
      setShowVersionModal(false)
    } catch (error) {
      console.error('Error al crear versión:', error)
      alert('Error al crear versión: ' + error.message)
    }
  }

  const handleVerHistorial = async (documento) => {
    setDocumentoSeleccionado(documento)
    await loadVersiones(documento.id)
    setShowHistorialModal(true)
  }

  const getNombreVinculado = (tipo, id) => {
    if (!tipo || !id) return '-'
    
    switch(tipo) {
      case 'Cliente':
        const cliente = clientes.find(c => c.id === id)
        return cliente ? cliente.nombre : id
      case 'Proveedor':
        const proveedor = proveedores.find(p => p.id === id)
        return proveedor ? proveedor.nombre : id
      case 'Proyecto':
        const proyecto = proyectos.find(p => p.id === id)
        return proyecto ? proyecto.nombre : id
      case 'Empleado':
        const empleado = personal.find(e => e.id === id)
        return empleado ? (empleado.nombreCompleto || `${empleado.nombre || ''} ${empleado.apellido || ''}`) : id
      default:
        return id
    }
  }

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'Vigente':
        return 'bg-green-100 text-green-800'
      case 'Aprobado':
        return 'bg-blue-100 text-blue-800'
      case 'En Revisión':
        return 'bg-yellow-100 text-yellow-800'
      case 'Borrador':
        return 'bg-gray-100 text-gray-800'
      case 'Archivado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOpcionesVinculacion = () => {
    switch(formData.tipoVinculacion) {
      case 'Cliente':
        return clientes.map(c => ({ id: c.id, nombre: c.nombre }))
      case 'Proveedor':
        return proveedores.map(p => ({ id: p.id, nombre: p.nombre }))
      case 'Proyecto':
        return proyectos.map(p => ({ id: p.id, nombre: p.nombre }))
      case 'Empleado':
        return personal.map(e => ({ 
          id: e.id, 
          nombre: e.nombreCompleto || `${e.nombre || ''} ${e.apellido || ''}` 
        }))
      default:
        return []
    }
  }

  const filteredDocumentos = documentos.filter(doc =>
    doc.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(doc => 
    (filtroTipo === 'Todos' || doc.tipo === filtroTipo) &&
    (filtroEstado === 'Todos' || doc.estado === filtroEstado)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Cargando documentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Documentos
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Repositorio oficial de la empresa. Centraliza documentos, controla versiones y vincula a procesos del ERP.
        </p>
      </div>

      {/* Acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar documentos..."
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
        <div className="flex gap-2">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="Todos">Todos los tipos</option>
            {tiposDocumento.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            <option value="Todos">Todos los estados</option>
            {estados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
          <button 
            onClick={handleCrearDocumento}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Documento
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <table className="w-full">
          <thead className="bg-gray-50" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Documento</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Tipo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Área</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Versión</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Vinculado a</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocumentos.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <FileText size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No hay documentos registrados</p>
                  <p className="text-sm">Comienza creando un documento</p>
                </td>
              </tr>
            ) : (
              filteredDocumentos.map((documento) => (
                <tr key={documento.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{documento.nombre}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {documento.descripcion || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{documento.tipo}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{documento.area}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>
                    v{documento.versionActual || '1.0'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                    {documento.tipoVinculacion ? (
                      <span className="flex items-center gap-1">
                        <LinkIcon size={14} />
                        {getNombreVinculado(documento.tipoVinculacion, documento.idVinculado)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(documento.estado)}`}>
                      {documento.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleVerHistorial(documento)} 
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Ver historial de versiones"
                      >
                        <History size={16} />
                      </button>
                      <button 
                        onClick={() => handleEditarDocumento(documento)} 
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleEliminarDocumento(documento)} 
                        className="p-1 hover:bg-gray-100 rounded text-red-600" 
                        title="Eliminar"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Documento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {modoModal === 'crear' ? 'Nuevo Documento' : 'Editar Documento'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Nombre del Documento *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="Ej: Contrato ABC SAC"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    {tiposDocumento.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Área</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    {estados.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="3"
                  placeholder="Descripción del documento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Vincular a</label>
                  <select
                    value={formData.tipoVinculacion}
                    onChange={(e) => setFormData({ ...formData, tipoVinculacion: e.target.value, idVinculado: '' })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Sin vinculación</option>
                    {tiposVinculacion.filter(t => t !== '').map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                {formData.tipoVinculacion && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Seleccionar {formData.tipoVinculacion}</label>
                    <select
                      value={formData.idVinculado}
                      onChange={(e) => setFormData({ ...formData, idVinculado: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    >
                      <option value="">Seleccionar...</option>
                      {getOpcionesVinculacion().map(opcion => (
                        <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>URL del Archivo</label>
                <input
                  type="text"
                  value={formData.archivoUrl}
                  onChange={(e) => setFormData({ ...formData, archivoUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              {modoModal === 'editar' && (
                <button
                  onClick={() => {
                    setShowVersionModal(true)
                    setShowModal(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <History size={16} />
                  Nueva Versión
                </button>
              )}
              <button
                onClick={handleGuardarDocumento}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {modoModal === 'crear' ? 'Crear' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Versión */}
      {showVersionModal && documentoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-lg w-full" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Nueva Versión de {documentoSeleccionado.nombre}
              </h2>
              <button 
                onClick={() => setShowVersionModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Descripción de Cambios</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  rows="4"
                  placeholder="Describe los cambios en esta versión..."
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setShowVersionModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearVersion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Versión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial de Versiones */}
      {showHistorialModal && documentoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Historial de Versiones - {documentoSeleccionado.nombre}
              </h2>
              <button 
                onClick={() => setShowHistorialModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {versiones.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                  No hay versiones registradas
                </p>
              ) : (
                <div className="space-y-4">
                  {versiones.map((version) => (
                    <div 
                      key={version.id} 
                      className="p-4 border rounded-lg"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                            Versión {version.numeroVersion}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {version.cambios || version.descripcion || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {version.creadoPor || 'Usuario'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {version.fechaCreacion?.toDate ? formatDate(version.fechaCreacion.toDate().toISOString().split('T')[0]) : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setShowHistorialModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Documentos

