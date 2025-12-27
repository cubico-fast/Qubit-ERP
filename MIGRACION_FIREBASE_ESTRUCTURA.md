# 🔄 Guía de Migración a Nueva Estructura de Firebase

Este documento describe la nueva estructura anidada de Firebase y cómo migrar las funciones existentes.

## 📁 Nueva Estructura

Todas las colecciones ahora están bajo `companies/{companyId}/...` en lugar de colecciones planas en la raíz.

### Estructura Completa

```
companies
└── {companyId}
    ├── info
    │   └── main (documento único con información de la empresa)
    ├── users
    │   └── {userId}
    ├── roles
    │   └── {roleId}
    ├── crm
    │   ├── leads
    │   ├── opportunities
    │   ├── contacts
    │   └── activities
    ├── sales
    │   ├── quotes
    │   ├── orders
    │   ├── invoices
    │   └── payments
    ├── purchases
    │   ├── suppliers
    │   ├── purchaseRequests
    │   ├── purchaseOrders
    │   ├── receipts
    │   └── supplierEvaluations
    ├── inventory
    │   ├── products
    │   ├── stockMovements
    │   ├── warehouses
    │   ├── transfers
    │   └── shipments
    ├── production
    │   ├── workOrders
    │   ├── boms
    │   ├── routes
    │   ├── costs
    │   └── qualityChecks
    ├── hr
    │   ├── employees
    │   ├── attendance
    │   ├── payroll
    │   ├── recruitment
    │   └── evaluations
    ├── projects
    │   ├── projects
    │   ├── tasks
    │   ├── resources
    │   └── costs
    ├── bi
    │   ├── dashboards
    │   ├── reports
    │   ├── objectives
    │   └── aiInsights
    ├── documents
    │   ├── documents
    │   ├── versions
    │   └── approvalFlows
    └── settings
        ├── taxes
        ├── currencies
        ├── numbering
        └── integrations
```

## 🔧 Funciones Actualizadas

Las siguientes funciones ya han sido actualizadas para usar la nueva estructura:

### ✅ Completadas

1. **Companies**
   - `createOrUpdateCompany()` - Usa `companies/{companyId}/info/main`
   - `getCompany()` - Lee desde `companies/{companyId}/info/main`
   - `getAllCompanies()` - Lee todas las empresas

2. **Productos (Inventory)**
   - `getProductos()` - Usa `companies/{companyId}/inventory/products`
   - `saveProducto()` - Guarda en `companies/{companyId}/inventory/products`
   - `updateProducto()` - Actualiza en `companies/{companyId}/inventory/products`
   - `deleteProducto()` - Elimina de `companies/{companyId}/inventory/products`

3. **Ventas (Sales)**
   - `getVentas()` - Usa `companies/{companyId}/sales/orders`
   - `saveVenta()` - Guarda en `companies/{companyId}/sales/orders`
   - `updateVenta()` - Actualiza en `companies/{companyId}/sales/orders`
   - `deleteVenta()` - Elimina de `companies/{companyId}/sales/orders`

4. **Clientes (CRM Contacts)**
   - `getClientes()` - Usa `companies/{companyId}/crm/contacts`
   - `saveCliente()` - Guarda en `companies/{companyId}/crm/contacts`
   - `updateCliente()` - Actualiza en `companies/{companyId}/crm/contacts`
   - `deleteCliente()` - Elimina de `companies/{companyId}/crm/contacts`

5. **Cotizaciones (Sales Quotes)**
   - `getCotizaciones()` - Usa `companies/{companyId}/sales/quotes`
   - `saveCotizacion()` - Guarda en `companies/{companyId}/sales/quotes`
   - `updateCotizacion()` - Actualiza en `companies/{companyId}/sales/quotes`

## 📝 Patrón para Actualizar Funciones Restantes

Para actualizar las funciones restantes, sigue este patrón:

### 1. Importar las funciones de rutas

Asegúrate de que las funciones necesarias estén importadas desde `firebasePaths.js`:

```javascript
import {
  getProductsCollection,
  getProductDoc,
  // ... otras funciones necesarias
} from './firebasePaths'
```

### 2. Actualizar funciones GET

**Antes:**
```javascript
export const getAlgo = async (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  const algoRef = collection(db, 'algo')
  const q = query(
    algoRef,
    where('companyId', '==', companyIdToUse),
    orderBy('createdAt', 'desc')
  )
  const querySnapshot = await getDocs(q)
  // ...
}
```

**Después:**
```javascript
export const getAlgo = async (companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  const algoRef = getAlgoCollection(companyIdToUse) // Usa la función de firebasePaths
  const q = query(algoRef, orderBy('createdAt', 'desc'))
  const querySnapshot = await getDocs(q)
  // ... (eliminar filtros de companyId ya que la ruta lo garantiza)
}
```

### 3. Actualizar funciones SAVE

**Antes:**
```javascript
export const saveAlgo = async (algo, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  const { id, ...algoData } = algo
  algoData.companyId = companyIdToUse // ❌ Ya no necesario
  
  const algoRef = collection(db, 'algo')
  const docRef = await addDoc(algoRef, algoData)
  // ...
}
```

**Después:**
```javascript
export const saveAlgo = async (algo, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  const { id, companyId: _, ...algoData } = algo // Remover companyId del objeto
  
  const algoRef = getAlgoCollection(companyIdToUse)
  const docRef = await addDoc(algoRef, algoData) // Sin companyId en los datos
  // ...
}
```

### 4. Actualizar funciones UPDATE

**Antes:**
```javascript
export const updateAlgo = async (algoId, algoData, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  algoData.companyId = companyIdToUse // ❌ Ya no necesario
  
  const algoRef = doc(db, 'algo', algoId)
  // Verificar companyId... ❌ Ya no necesario
  
  await updateDoc(algoRef, algoData)
  // ...
}
```

**Después:**
```javascript
export const updateAlgo = async (algoId, algoData, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  const { companyId: _, ...cleanedData } = algoData // Remover companyId
  
  const algoRef = getAlgoDoc(algoId, companyIdToUse)
  await updateDoc(algoRef, cleanedData) // Sin verificación de companyId
  // ...
}
```

### 5. Actualizar funciones DELETE

**Antes:**
```javascript
export const deleteAlgo = async (algoId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  const algoRef = doc(db, 'algo', algoId)
  
  // Verificar companyId... ❌ Ya no necesario
  
  await deleteDoc(algoRef)
}
```

**Después:**
```javascript
export const deleteAlgo = async (algoId, companyId = null) => {
  const companyIdToUse = companyId || getCurrentCompanyId()
  const algoRef = getAlgoDoc(algoId, companyIdToUse)
  await deleteDoc(algoRef) // Sin verificación, la ruta garantiza el acceso
}
```

## 🗺️ Mapeo de Colecciones Antiguas a Nuevas

| Colección Antigua | Nueva Ruta |
|-------------------|------------|
| `productos` | `companies/{companyId}/inventory/products` |
| `ventas` | `companies/{companyId}/sales/orders` |
| `cotizaciones` | `companies/{companyId}/sales/quotes` |
| `clientes` | `companies/{companyId}/crm/contacts` |
| `contactos` | `companies/{companyId}/crm/contacts` |
| `leads` | `companies/{companyId}/crm/leads` |
| `oportunidades` | `companies/{companyId}/crm/opportunities` |
| `actividades` | `companies/{companyId}/crm/activities` |
| `proveedores` | `companies/{companyId}/purchases/suppliers` |
| `solicitudes_compra` | `companies/{companyId}/purchases/purchaseRequests` |
| `ordenes_compra` | `companies/{companyId}/purchases/purchaseOrders` |
| `recepciones` | `companies/{companyId}/purchases/receipts` |
| `evaluaciones_proveedores` | `companies/{companyId}/purchases/supplierEvaluations` |
| `almacenes` | `companies/{companyId}/inventory/warehouses` |
| `transferencias_almacenes` | `companies/{companyId}/inventory/transfers` |
| `kardex` | `companies/{companyId}/inventory/stockMovements` |
| `stock_almacen` | `companies/{companyId}/inventory/stockMovements` |
| `ordenes_produccion` | `companies/{companyId}/production/workOrders` |
| `boms` | `companies/{companyId}/production/boms` |
| `rutas_produccion` | `companies/{companyId}/production/routes` |
| `costeos` | `companies/{companyId}/production/costs` |
| `control_calidad` | `companies/{companyId}/production/qualityChecks` |
| `personal` | `companies/{companyId}/hr/employees` |
| `asistencias` | `companies/{companyId}/hr/attendance` |
| `nominas` | `companies/{companyId}/hr/payroll` |
| `talento_humano` | `companies/{companyId}/hr/recruitment` |
| `proyectos` | `companies/{companyId}/projects/projects` |
| `tareas` | `companies/{companyId}/projects/tasks` |
| `asignaciones_recursos` | `companies/{companyId}/projects/resources` |
| `costos_proyecto` | `companies/{companyId}/projects/costs` |
| `documentos` | `companies/{companyId}/documents/documents` |
| `versiones` | `companies/{companyId}/documents/versions` |
| `flujos_aprobacion` | `companies/{companyId}/documents/approvalFlows` |
| `roles` | `companies/{companyId}/roles` |
| `users` | `companies/{companyId}/users` |

## ⚠️ Cambios Importantes

1. **Eliminar campo `companyId` de los documentos**: Ya no es necesario incluir `companyId` en los datos de los documentos, ya que la ruta lo garantiza.

2. **Eliminar verificaciones de `companyId`**: Las verificaciones como `if (data.companyId !== companyIdToUse)` ya no son necesarias porque la ruta garantiza el acceso.

3. **Eliminar filtros `where('companyId', '==', ...)`**: Ya no son necesarios en las queries porque la colección ya está filtrada por la ruta.

4. **Usar funciones de `firebasePaths.js`**: Siempre usa las funciones helper de `firebasePaths.js` en lugar de crear referencias manualmente.

## 🔒 Actualización de Reglas de Firestore

Las reglas de Firestore también deben actualizarse para reflejar la nueva estructura. Ver `firestore.rules` para las reglas actualizadas.

## 📋 Funciones Pendientes de Actualizar

Las siguientes funciones aún necesitan ser actualizadas:

- [ ] Funciones de proveedores (purchases/suppliers)
- [ ] Funciones de solicitudes de compra (purchases/purchaseRequests)
- [ ] Funciones de órdenes de compra (purchases/purchaseOrders)
- [ ] Funciones de recepciones (purchases/receipts)
- [ ] Funciones de evaluaciones de proveedores (purchases/supplierEvaluations)
- [ ] Funciones de almacenes (inventory/warehouses)
- [ ] Funciones de transferencias (inventory/transfers)
- [ ] Funciones de movimientos de stock (inventory/stockMovements)
- [ ] Funciones de envíos (inventory/shipments)
- [ ] Funciones de órdenes de producción (production/workOrders)
- [ ] Funciones de BOMs (production/boms)
- [ ] Funciones de rutas (production/routes)
- [ ] Funciones de costos de producción (production/costs)
- [ ] Funciones de control de calidad (production/qualityChecks)
- [ ] Funciones de empleados (hr/employees)
- [ ] Funciones de asistencias (hr/attendance)
- [ ] Funciones de nóminas (hr/payroll)
- [ ] Funciones de reclutamiento (hr/recruitment)
- [ ] Funciones de evaluaciones (hr/evaluations)
- [ ] Funciones de proyectos (projects/projects)
- [ ] Funciones de tareas (projects/tasks)
- [ ] Funciones de recursos (projects/resources)
- [ ] Funciones de costos de proyecto (projects/costs)
- [ ] Funciones de leads (crm/leads)
- [ ] Funciones de oportunidades (crm/opportunities)
- [ ] Funciones de actividades (crm/activities)
- [ ] Funciones de documentos (documents/documents)
- [ ] Funciones de versiones (documents/versions)
- [ ] Funciones de flujos de aprobación (documents/approvalFlows)
- [ ] Funciones de usuarios (users)
- [ ] Funciones de roles (roles)
- [ ] Funciones de configuración (settings/*)

## 🚀 Próximos Pasos

1. Continuar actualizando las funciones restantes siguiendo el patrón descrito.
2. Actualizar las reglas de Firestore para la nueva estructura.
3. Crear un script de migración de datos si es necesario.
4. Probar todas las funciones actualizadas.
5. Actualizar la documentación del proyecto.

