/**
 * Utilidad para generar rutas de Firestore según la nueva estructura anidada
 * Todas las rutas están bajo companies/{companyId}/...
 */

import { db } from '../config/firebase'
import { collection, doc } from 'firebase/firestore'

/**
 * Obtener el companyId actual del usuario desde localStorage
 */
export const getCurrentCompanyId = () => {
  return localStorage.getItem('cubic_companyId') || 'empresa_001'
}

/**
 * Genera la referencia a un documento de empresa
 */
export const getCompanyDoc = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse)
}

/**
 * Genera la referencia a la colección de información de la empresa
 */
export const getCompanyInfoCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'info')
}

/**
 * Genera la referencia al documento de información de la empresa
 */
export const getCompanyInfoDoc = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'info', 'main')
}

// ========== USUARIOS Y ROLES ==========

/**
 * Genera la referencia a la colección de usuarios de la empresa
 */
export const getUsersCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'users')
}

/**
 * Genera la referencia a un documento de usuario
 */
export const getUserDoc = (userId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'users', userId)
}

/**
 * Genera la referencia a la colección de roles de la empresa
 */
export const getRolesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'roles')
}

/**
 * Genera la referencia a un documento de rol
 */
export const getRoleDoc = (roleId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'roles', roleId)
}

// ========== CRM ==========

/**
 * Genera la referencia a la colección de leads
 */
export const getLeadsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'crm', 'leads')
}

/**
 * Genera la referencia a un documento de lead
 */
export const getLeadDoc = (leadId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'crm', 'leads', leadId)
}

/**
 * Genera la referencia a la colección de oportunidades
 */
export const getOpportunitiesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'crm', 'opportunities')
}

/**
 * Genera la referencia a un documento de oportunidad
 */
export const getOpportunityDoc = (opportunityId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'crm', 'opportunities', opportunityId)
}

/**
 * Genera la referencia a la colección de contactos
 */
export const getContactsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'crm', 'contacts')
}

/**
 * Genera la referencia a un documento de contacto
 */
export const getContactDoc = (contactId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'crm', 'contacts', contactId)
}

/**
 * Genera la referencia a la colección de actividades
 */
export const getActivitiesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'crm', 'activities')
}

/**
 * Genera la referencia a un documento de actividad
 */
export const getActivityDoc = (activityId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'crm', 'activities', activityId)
}

// ========== VENTAS ==========

/**
 * Genera la referencia a la colección de cotizaciones
 */
export const getQuotesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'sales', 'quotes')
}

/**
 * Genera la referencia a un documento de cotización
 */
export const getQuoteDoc = (quoteId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'sales', 'quotes', quoteId)
}

/**
 * Genera la referencia a la colección de órdenes
 */
export const getOrdersCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'sales', 'orders')
}

/**
 * Genera la referencia a un documento de orden
 */
export const getOrderDoc = (orderId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'sales', 'orders', orderId)
}

/**
 * Genera la referencia a la colección de facturas
 */
export const getInvoicesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'sales', 'invoices')
}

/**
 * Genera la referencia a un documento de factura
 */
export const getInvoiceDoc = (invoiceId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'sales', 'invoices', invoiceId)
}

/**
 * Genera la referencia a la colección de pagos
 */
export const getPaymentsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'sales', 'payments')
}

/**
 * Genera la referencia a un documento de pago
 */
export const getPaymentDoc = (paymentId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'sales', 'payments', paymentId)
}

// ========== COMPRAS ==========

/**
 * Genera la referencia a la colección de proveedores
 */
export const getSuppliersCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'purchases', 'suppliers')
}

/**
 * Genera la referencia a un documento de proveedor
 */
export const getSupplierDoc = (supplierId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'purchases', 'suppliers', supplierId)
}

/**
 * Genera la referencia a la colección de solicitudes de compra
 */
export const getPurchaseRequestsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'purchases', 'purchaseRequests')
}

/**
 * Genera la referencia a un documento de solicitud de compra
 */
export const getPurchaseRequestDoc = (requestId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'purchases', 'purchaseRequests', requestId)
}

/**
 * Genera la referencia a la colección de órdenes de compra
 */
export const getPurchaseOrdersCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'purchases', 'purchaseOrders')
}

/**
 * Genera la referencia a un documento de orden de compra
 */
export const getPurchaseOrderDoc = (poId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'purchases', 'purchaseOrders', poId)
}

/**
 * Genera la referencia a la colección de recepciones
 */
export const getReceiptsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'purchases', 'receipts')
}

/**
 * Genera la referencia a un documento de recepción
 */
export const getReceiptDoc = (receiptId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'purchases', 'receipts', receiptId)
}

/**
 * Genera la referencia a la colección de evaluaciones de proveedores
 */
export const getSupplierEvaluationsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'purchases', 'supplierEvaluations')
}

/**
 * Genera la referencia a un documento de evaluación de proveedor
 */
export const getSupplierEvaluationDoc = (evaluationId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'purchases', 'supplierEvaluations', evaluationId)
}

// ========== INVENTARIO ==========

/**
 * Genera la referencia a la colección de productos
 */
export const getProductsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'inventory', 'products')
}

/**
 * Genera la referencia a un documento de producto
 */
export const getProductDoc = (productId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'inventory', 'products', productId)
}

/**
 * Genera la referencia a la colección de movimientos de stock
 */
export const getStockMovementsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'inventory', 'stockMovements')
}

/**
 * Genera la referencia a un documento de movimiento de stock
 */
export const getStockMovementDoc = (movementId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'inventory', 'stockMovements', movementId)
}

/**
 * Genera la referencia a la colección de almacenes
 */
export const getWarehousesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'inventory', 'warehouses')
}

/**
 * Genera la referencia a un documento de almacén
 */
export const getWarehouseDoc = (warehouseId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'inventory', 'warehouses', warehouseId)
}

/**
 * Genera la referencia a la colección de transferencias
 */
export const getTransfersCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'inventory', 'transfers')
}

/**
 * Genera la referencia a un documento de transferencia
 */
export const getTransferDoc = (transferId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'inventory', 'transfers', transferId)
}

/**
 * Genera la referencia a la colección de envíos
 */
export const getShipmentsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'inventory', 'shipments')
}

/**
 * Genera la referencia a un documento de envío
 */
export const getShipmentDoc = (shipmentId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'inventory', 'shipments', shipmentId)
}

// ========== PRODUCCIÓN ==========

/**
 * Genera la referencia a la colección de órdenes de trabajo
 */
export const getWorkOrdersCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'production', 'workOrders')
}

/**
 * Genera la referencia a un documento de orden de trabajo
 */
export const getWorkOrderDoc = (workOrderId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'production', 'workOrders', workOrderId)
}

/**
 * Genera la referencia a la colección de BOMs (Listas de Materiales)
 */
export const getBomsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'production', 'boms')
}

/**
 * Genera la referencia a un documento de BOM
 */
export const getBomDoc = (bomId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'production', 'boms', bomId)
}

/**
 * Genera la referencia a la colección de rutas
 */
export const getRoutesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'production', 'routes')
}

/**
 * Genera la referencia a un documento de ruta
 */
export const getRouteDoc = (routeId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'production', 'routes', routeId)
}

/**
 * Genera la referencia a la colección de costos
 */
export const getCostsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'production', 'costs')
}

/**
 * Genera la referencia a un documento de costo
 */
export const getCostDoc = (costId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'production', 'costs', costId)
}

/**
 * Genera la referencia a la colección de controles de calidad
 */
export const getQualityChecksCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'production', 'qualityChecks')
}

/**
 * Genera la referencia a un documento de control de calidad
 */
export const getQualityCheckDoc = (checkId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'production', 'qualityChecks', checkId)
}

// ========== RECURSOS HUMANOS ==========

/**
 * Genera la referencia a la colección de empleados
 */
export const getEmployeesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'hr', 'employees')
}

/**
 * Genera la referencia a un documento de empleado
 */
export const getEmployeeDoc = (employeeId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'hr', 'employees', employeeId)
}

/**
 * Genera la referencia a la colección de asistencias
 */
export const getAttendanceCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'hr', 'attendance')
}

/**
 * Genera la referencia a un documento de asistencia
 */
export const getAttendanceDoc = (attendanceId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'hr', 'attendance', attendanceId)
}

/**
 * Genera la referencia a la colección de nóminas
 */
export const getPayrollCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'hr', 'payroll')
}

/**
 * Genera la referencia a un documento de nómina
 */
export const getPayrollDoc = (payrollId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'hr', 'payroll', payrollId)
}

/**
 * Genera la referencia a la colección de reclutamiento
 */
export const getRecruitmentCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'hr', 'recruitment')
}

/**
 * Genera la referencia a un documento de reclutamiento
 */
export const getRecruitmentDoc = (recruitmentId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'hr', 'recruitment', recruitmentId)
}

/**
 * Genera la referencia a la colección de evaluaciones
 */
export const getEvaluationsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'hr', 'evaluations')
}

/**
 * Genera la referencia a un documento de evaluación
 */
export const getEvaluationDoc = (evaluationId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'hr', 'evaluations', evaluationId)
}

// ========== PROYECTOS ==========

/**
 * Genera la referencia a la colección de proyectos
 */
export const getProjectsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'projects', 'projects')
}

/**
 * Genera la referencia a un documento de proyecto
 */
export const getProjectDoc = (projectId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'projects', 'projects', projectId)
}

/**
 * Genera la referencia a la colección de tareas
 */
export const getTasksCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'projects', 'tasks')
}

/**
 * Genera la referencia a un documento de tarea
 */
export const getTaskDoc = (taskId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'projects', 'tasks', taskId)
}

/**
 * Genera la referencia a la colección de recursos
 */
export const getResourcesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'projects', 'resources')
}

/**
 * Genera la referencia a un documento de recurso
 */
export const getResourceDoc = (resourceId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'projects', 'resources', resourceId)
}

/**
 * Genera la referencia a la colección de costos de proyecto
 */
export const getProjectCostsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'projects', 'costs')
}

/**
 * Genera la referencia a un documento de costo de proyecto
 */
export const getProjectCostDoc = (projectCostId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'projects', 'costs', projectCostId)
}

// ========== BI ==========

/**
 * Genera la referencia a la colección de dashboards
 */
export const getDashboardsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'bi', 'dashboards')
}

/**
 * Genera la referencia a un documento de dashboard
 */
export const getDashboardDoc = (dashboardId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'bi', 'dashboards', dashboardId)
}

/**
 * Genera la referencia a la colección de reportes
 */
export const getReportsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'bi', 'reports')
}

/**
 * Genera la referencia a un documento de reporte
 */
export const getReportDoc = (reportId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'bi', 'reports', reportId)
}

/**
 * Genera la referencia a la colección de objetivos
 */
export const getObjectivesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'bi', 'objectives')
}

/**
 * Genera la referencia a un documento de objetivo
 */
export const getObjectiveDoc = (objectiveId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'bi', 'objectives', objectiveId)
}

/**
 * Genera la referencia a la colección de insights de IA
 */
export const getAiInsightsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'bi', 'aiInsights')
}

/**
 * Genera la referencia a un documento de insight de IA
 */
export const getAiInsightDoc = (insightId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'bi', 'aiInsights', insightId)
}

// ========== DOCUMENTOS ==========

/**
 * Genera la referencia a la colección de documentos
 */
export const getDocumentsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'documents', 'documents')
}

/**
 * Genera la referencia a un documento
 */
export const getDocumentDoc = (documentId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'documents', 'documents', documentId)
}

/**
 * Genera la referencia a la colección de versiones de documentos
 */
export const getDocumentVersionsCollection = (documentId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'documents', 'documents', documentId, 'versions')
}

/**
 * Genera la referencia a un documento de versión
 */
export const getDocumentVersionDoc = (documentId, versionId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'documents', 'documents', documentId, 'versions', versionId)
}

/**
 * Genera la referencia a la colección de versiones (colección independiente)
 */
export const getVersionsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'documents', 'versions')
}

/**
 * Genera la referencia a un documento de versión (colección independiente)
 */
export const getVersionDoc = (versionId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'documents', 'versions', versionId)
}

/**
 * Genera la referencia a la colección de flujos de aprobación
 */
export const getApprovalFlowsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'documents', 'approvalFlows')
}

/**
 * Genera la referencia a un documento de flujo de aprobación
 */
export const getApprovalFlowDoc = (flowId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return doc(db, 'companies', companyIdToUse, 'documents', 'approvalFlows', flowId)
}

// ========== CONFIGURACIÓN ==========

/**
 * Genera la referencia a la colección de impuestos en settings
 */
export const getTaxesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'settings', 'taxes')
}

/**
 * Genera la referencia a la colección de monedas en settings
 */
export const getCurrenciesCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'settings', 'currencies')
}

/**
 * Genera la referencia a la colección de numeración en settings
 */
export const getNumberingCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'settings', 'numbering')
}

/**
 * Genera la referencia a la colección de integraciones en settings
 */
export const getIntegrationsCollection = (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  return collection(db, 'companies', companyIdToUse, 'settings', 'integrations')
}

// ========== COLECCIONES LEGACY (para migración gradual) ==========
// Estas funciones mantienen compatibilidad con la estructura antigua
// mientras se migra gradualmente

/**
 * Mapeo de colecciones antiguas a nuevas rutas
 * Útil para migración de datos
 */
export const COLLECTION_MAPPING = {
  // CRM
  'clientes': 'crm/contacts',
  'contactos': 'crm/contacts',
  'leads': 'crm/leads',
  'oportunidades': 'crm/opportunities',
  'actividades': 'crm/activities',
  
  // Ventas
  'ventas': 'sales/orders',
  'cotizaciones': 'sales/quotes',
  'facturas_proveedores': 'sales/invoices', // Nota: esto podría ser purchases también
  'pedidos': 'sales/orders',
  'envios': 'inventory/shipments',
  'notas_credito_debito': 'sales/invoices', // O una subcolección específica
  'garantias': 'sales/orders', // O una subcolección
  'reclamos': 'sales/orders', // O una subcolección
  'listas_precios': 'settings/pricing', // O una colección específica
  
  // Compras
  'proveedores': 'purchases/suppliers',
  'solicitudes_compra': 'purchases/purchaseRequests',
  'ordenes_compra': 'purchases/purchaseOrders',
  'recepciones': 'purchases/receipts',
  'evaluaciones_proveedores': 'purchases/supplierEvaluations',
  
  // Inventario
  'productos': 'inventory/products',
  'almacenes': 'inventory/warehouses',
  'transferencias_almacenes': 'inventory/transfers',
  'kardex': 'inventory/stockMovements',
  'stock_almacen': 'inventory/stockMovements',
  
  // Producción
  'ordenes_produccion': 'production/workOrders',
  'boms': 'production/boms',
  'rutas_produccion': 'production/routes',
  'costeos': 'production/costs',
  'control_calidad': 'production/qualityChecks',
  
  // RRHH
  'personal': 'hr/employees',
  'asistencias': 'hr/attendance',
  'nominas': 'hr/payroll',
  'talento_humano': 'hr/recruitment',
  
  // Proyectos
  'proyectos': 'projects/projects',
  'tareas': 'projects/tasks',
  'asignaciones_recursos': 'projects/resources',
  'costos_proyecto': 'projects/costs',
  
  // Documentos
  'documentos': 'documents/documents',
  'versiones': 'documents/versions',
  'flujos_aprobacion': 'documents/approvalFlows',
  
  // Configuración
  'roles': 'roles',
  'unidades_medida': 'settings/units',
  'asientos_contables': 'accounting/entries',
  'movimientos_tesoreria': 'accounting/treasury',
  'parametros': 'settings/parameters',
  'integraciones': 'settings/integrations',
  'auditoria': 'audit/logs',
  'courriers': 'logistics/couriers',
  'marketing_metricas': 'marketing/metrics',
  'emailConfig': 'settings/email'
}

