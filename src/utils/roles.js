/**
 * Definición de roles del sistema ERP
 */

export const ROLES = {
  ADMIN: {
    id: 'admin',
    nombre: 'Administrador General',
    descripcion: 'Control total del ERP y la empresa',
    icon: '🧠',
    permisos: ['all']
  },
  CONTADOR: {
    id: 'contador',
    nombre: 'Contador / Finanzas',
    descripcion: 'Garantizar salud financiera y cumplimiento legal',
    icon: '🧾',
    permisos: ['ventas_lectura', 'compras_lectura', 'finanzas', 'bi_financiero', 'rrhh_nomina']
  },
  GERENTE: {
    id: 'gerente',
    nombre: 'Gerente / Director',
    descripcion: 'Tomar decisiones estratégicas',
    icon: '🧑‍💼',
    permisos: ['bi', 'ventas_lectura', 'proyectos', 'rrhh_lectura']
  },
  VENTAS: {
    id: 'ventas',
    nombre: 'Ejecutivo Comercial / Ventas',
    descripcion: 'Vender',
    icon: '📞',
    permisos: ['crm', 'gestion_comercial', 'ventas']
  },
  MARKETING: {
    id: 'marketing',
    nombre: 'Marketing',
    descripcion: 'Generar oportunidades de venta',
    icon: '🧠',
    permisos: ['crm', 'bi_comercial']
  },
  COMPRAS: {
    id: 'compras',
    nombre: 'Compras / Abastecimiento',
    descripcion: 'Comprar bien, a buen precio y a tiempo',
    icon: '🛒',
    permisos: ['compras', 'inventarios_lectura']
  },
  ALMACEN: {
    id: 'almacen',
    nombre: 'Almacén / Logística',
    descripcion: 'Controlar productos físicos',
    icon: '📦',
    permisos: ['inventarios', 'logistica']
  },
  PRODUCCION: {
    id: 'produccion',
    nombre: 'Producción / Operaciones',
    descripcion: 'Fabricar productos',
    icon: '🏭',
    permisos: ['produccion', 'inventarios']
  },
  RRHH: {
    id: 'rrhh',
    nombre: 'Recursos Humanos',
    descripcion: 'Gestionar personas',
    icon: '👨‍💼',
    permisos: ['rrhh']
  },
  PROYECTOS: {
    id: 'proyectos',
    nombre: 'Jefe de Proyecto',
    descripcion: 'Entregar proyectos rentables',
    icon: '🧑‍🔧',
    permisos: ['proyectos', 'bi_proyecto']
  },
  SOPORTE: {
    id: 'soporte',
    nombre: 'Atención al Cliente / Postventa',
    descripcion: 'Retener clientes',
    icon: '🧾',
    permisos: ['postventa', 'crm']
  },
  OPERATIVO: {
    id: 'operativo',
    nombre: 'Usuario Operativo (Básico)',
    descripcion: 'Ejecutar tareas puntuales',
    icon: '🧑‍💻',
    permisos: ['limitados']
  }
}

export const ROLES_LIST = Object.values(ROLES)

export const getRoleById = (roleId) => {
  return ROLES[roleId?.toUpperCase()] || ROLES.OPERATIVO
}

export const getRoleName = (roleId) => {
  const role = getRoleById(roleId)
  return role ? `${role.icon} ${role.nombre}` : 'Usuario'
}

