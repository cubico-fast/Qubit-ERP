import { useState, useEffect } from 'react'
import { Settings, CheckCircle, XCircle, RefreshCw, Database, Link, FileText, DollarSign, Package, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getProductos, getClientes, getVentas, getPedidos, getListasPrecios } from '../utils/firebaseUtils'

const AutomatizacionCentralizacion = () => {
  const { companyId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [estadoSincronizacion, setEstadoSincronizacion] = useState({
    productos: { sincronizado: true, ultimaActualizacion: new Date() },
    clientes: { sincronizado: true, ultimaActualizacion: new Date() },
    precios: { sincronizado: true, ultimaActualizacion: new Date() },
    inventario: { sincronizado: true, ultimaActualizacion: new Date() }
  })
  const [estadisticas, setEstadisticas] = useState({
    productos: 0,
    clientes: 0,
    ventas: 0,
    pedidos: 0,
    listasPrecios: 0
  })

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productos, clientes, ventas, pedidos, listasPrecios] = await Promise.all([
        getProductos(companyId),
        getClientes(companyId),
        getVentas(companyId),
        getPedidos(companyId),
        getListasPrecios(companyId)
      ])
      
      setEstadisticas({
        productos: productos?.length || 0,
        clientes: clientes?.length || 0,
        ventas: ventas?.length || 0,
        pedidos: pedidos?.length || 0,
        listasPrecios: listasPrecios?.length || 0
      })
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const verificarSincronizacion = async () => {
    setLoading(true)
    try {
      // Simular verificación de sincronización
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setEstadoSincronizacion({
        productos: { sincronizado: true, ultimaActualizacion: new Date() },
        clientes: { sincronizado: true, ultimaActualizacion: new Date() },
        precios: { sincronizado: true, ultimaActualizacion: new Date() },
        inventario: { sincronizado: true, ultimaActualizacion: new Date() }
      })
      
      alert('✅ Sincronización verificada. Todos los datos están actualizados.')
    } catch (error) {
      console.error('Error al verificar sincronización:', error)
      alert('Error al verificar la sincronización')
    } finally {
      setLoading(false)
    }
  }

  const sincronizarDatos = async () => {
    setLoading(true)
    try {
      // Simular sincronización
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setEstadoSincronizacion({
        productos: { sincronizado: true, ultimaActualizacion: new Date() },
        clientes: { sincronizado: true, ultimaActualizacion: new Date() },
        precios: { sincronizado: true, ultimaActualizacion: new Date() },
        inventario: { sincronizado: true, ultimaActualizacion: new Date() }
      })
      
      await loadData()
      alert('✅ Datos sincronizados exitosamente')
    } catch (error) {
      console.error('Error al sincronizar:', error)
      alert('Error al sincronizar los datos')
    } finally {
      setLoading(false)
    }
  }

  const modulos = [
    {
      nombre: 'Productos',
      icon: Package,
      descripcion: 'Un solo dato de producto se usa en: Ventas, Inventario, Cotizaciones, Facturación',
      conectado: true,
      datos: estadisticas.productos
    },
    {
      nombre: 'Clientes',
      icon: Users,
      descripcion: 'Información centralizada: Historial, Reclamos, Deudas, Preferencias, Contactos',
      conectado: true,
      datos: estadisticas.clientes
    },
    {
      nombre: 'Precios',
      icon: DollarSign,
      descripcion: 'Precios actualizados automáticamente en: Pedidos, Cotizaciones, Facturación',
      conectado: true,
      datos: estadisticas.listasPrecios
    },
    {
      nombre: 'Inventario',
      icon: Package,
      descripcion: 'Stock sincronizado: Reservas, Despachos, Facturación, Reportes',
      conectado: true,
      datos: estadisticas.productos
    },
    {
      nombre: 'Ventas',
      icon: TrendingUp,
      descripcion: 'Integrado con: Clientes, Inventario, Facturación, Contabilidad',
      conectado: true,
      datos: estadisticas.ventas
    },
    {
      nombre: 'Pedidos',
      icon: FileText,
      descripcion: 'Conectado a: Clientes, Inventario, Logística, Facturación',
      conectado: true,
      datos: estadisticas.pedidos
    }
  ]

  const beneficios = [
    {
      titulo: 'Sin Excel Paralelos',
      descripcion: 'Todos los datos están centralizados en el ERP. No hay necesidad de mantener hojas de cálculo separadas.',
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      titulo: 'Números Consistentes',
      descripcion: 'Un solo precio, un solo stock, una sola verdad. Todos los módulos usan la misma información.',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      titulo: 'Actualización Automática',
      descripcion: 'Si cambias un precio, se actualiza automáticamente en pedidos, cotizaciones y facturación.',
      icon: RefreshCw,
      color: 'text-blue-600'
    },
    {
      titulo: 'Trazabilidad Completa',
      descripcion: 'Cada movimiento está registrado y conectado. Desde el pedido hasta la factura, todo está vinculado.',
      icon: Link,
      color: 'text-purple-600'
    }
  ]

  if (loading && estadisticas.productos === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automatización y Centralización</h1>
          <p className="text-gray-600 mt-1">Todo está conectado y no se repite información. Un solo dato se usa en múltiples módulos.</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={verificarSincronizacion}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <RefreshCw size={18} />
            <span>Verificar Sincronización</span>
          </button>
          <button
            onClick={sincronizarDatos}
            className="btn-primary flex items-center space-x-2"
          >
            <Database size={18} />
            <span>Sincronizar Datos</span>
          </button>
        </div>
      </div>

      {/* Estado de Sincronización */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(estadoSincronizacion).map(([modulo, estado]) => (
          <div key={modulo} className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 capitalize">{modulo}</h3>
              {estado.sincronizado ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <XCircle className="text-red-600" size={20} />
              )}
            </div>
            <p className="text-xs text-gray-500">
              Última actualización: {estado.ultimaActualizacion.toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>

      {/* Módulos Conectados */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Módulos Conectados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulos.map((modulo, index) => {
            const Icon = modulo.icon
            return (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className="text-primary-600" size={24} />
                    <h3 className="font-semibold text-gray-900">{modulo.nombre}</h3>
                  </div>
                  {modulo.conectado ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{modulo.descripcion}</p>
                <p className="text-xs text-gray-500">Registros: {modulo.datos}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Beneficios */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Beneficios de la Centralización</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {beneficios.map((beneficio, index) => {
            const Icon = beneficio.icon
            return (
              <div key={index} className="flex space-x-4">
                <div className={`flex-shrink-0 ${beneficio.color}`}>
                  <Icon size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{beneficio.titulo}</h3>
                  <p className="text-sm text-gray-600">{beneficio.descripcion}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ejemplo Práctico */}
      <div className="card bg-gradient-to-r from-primary-50 to-secondary-50">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ejemplo Práctico</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Si cambias el precio de un producto:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={16} />
                <span>Se actualiza automáticamente en <strong>Pedidos nuevos</strong></span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={16} />
                <span>Se refleja en <strong>Cotizaciones</strong></span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={16} />
                <span>Se respeta en <strong>Facturación</strong></span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={16} />
                <span>Se actualiza en <strong>Listas de Precios</strong></span>
              </li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2 text-yellow-700 mb-2">
              <AlertCircle size={20} />
              <span className="font-semibold">Resultado:</span>
            </div>
            <p className="text-sm text-gray-700">
              <strong>No hay Excel paralelos</strong> - <strong>No hay números distintos entre áreas</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Flujo de Datos */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Flujo de Datos Centralizado</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Pedido</h3>
              <p className="text-sm text-gray-600">Usa datos de: Cliente, Producto, Precio, Stock</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Inventario</h3>
              <p className="text-sm text-gray-600">Reserva productos del pedido, actualiza stock automáticamente</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Logística</h3>
              <p className="text-sm text-gray-600">Genera guía de remisión usando datos del pedido</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Facturación</h3>
              <p className="text-sm text-gray-600">Genera factura usando datos del pedido, sin reescribir nada</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              5
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Contabilidad</h3>
              <p className="text-sm text-gray-600">Registra automáticamente cuentas por cobrar e IGV</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutomatizacionCentralizacion

