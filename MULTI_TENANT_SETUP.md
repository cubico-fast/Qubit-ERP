# 🏢 Configuración Multi-Tenant para Cubic CRM

Este documento explica cómo se ha implementado el sistema multi-tenant en Cubic CRM, permitiendo que cada cliente tenga su propio espacio aislado.

## 📋 Resumen de Cambios

### 1. Sistema de CompanyId

- **CompanyId por defecto**: `empresa_001`
- Cada cliente tendrá su propio `companyId` único
- Todos los datos están asociados a un `companyId` específico

### 2. Modificaciones Realizadas

#### AuthContext (`src/contexts/AuthContext.jsx`)
- ✅ Agregado manejo de `companyId` en el contexto de autenticación
- ✅ `companyId` se guarda en `localStorage` para persistencia
- ✅ Función `updateCompanyId()` para cambiar de empresa
- ✅ Valor por defecto: `empresa_001`

#### Firebase Utils (`src/utils/firebaseUtils.js`)
- ✅ Agregadas funciones para manejar la colección `companies`:
  - `createOrUpdateCompany()` - Crear o actualizar empresa
  - `getCompany()` - Obtener empresa por ID
  - `getAllCompanies()` - Obtener todas las empresas (admin)
- ✅ Modificadas todas las funciones para filtrar por `companyId`:
  - `getProductos(companyId)` - Solo productos de la empresa
  - `saveProducto(producto, companyId)` - Guardar con companyId
  - `updateProducto(productoId, data, companyId)` - Actualizar con validación
  - `deleteProducto(productoId, companyId)` - Eliminar con validación
  - `getVentas(companyId)` - Solo ventas de la empresa
  - `saveVenta(venta, companyId)` - Guardar con companyId
  - `updateVenta(ventaId, data, companyId)` - Actualizar con validación
  - `deleteVenta(ventaId, companyId)` - Eliminar con validación
  - `getClientes(companyId)` - Solo clientes de la empresa
  - `saveCliente(cliente, companyId)` - Guardar con companyId
  - `updateCliente(clienteId, data, companyId)` - Actualizar con validación
  - `deleteCliente(clienteId, companyId)` - Eliminar con validación

#### Páginas
- ✅ `RealizarVenta.jsx` actualizado para usar `companyId` del contexto
- ✅ Todas las operaciones ahora incluyen el `companyId` automáticamente

### 3. Colección Companies

Se ha creado una nueva colección en Firestore llamada `companies` con la siguiente estructura:

```javascript
{
  companyId: "empresa_001",
  nombre: "Empresa Principal",
  descripcion: "Descripción de la empresa",
  activa: true,
  fechaCreacion: "2024-01-01T00:00:00.000Z",
  configuracion: {
    moneda: "Soles",
    zonaHoraria: "America/Lima",
    formatoFecha: "DD/MM/YYYY"
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🚀 Configuración Inicial

### Paso 1: Crear la Empresa Inicial

Para crear la empresa inicial (`empresa_001`), puedes usar la función de inicialización:

```javascript
// En la consola del navegador o en un script de inicialización
import { initDefaultCompany } from './src/utils/initCompany'

initDefaultCompany()
  .then(() => {
    console.log('✅ Empresa inicial creada')
  })
  .catch(error => {
    console.error('❌ Error:', error)
  })
```

### Paso 2: Configurar Reglas de Firestore

Ve a Firebase Console y actualiza las reglas de Firestore según el documento:
- `FIRESTORE_RULES_MULTI_TENANT.md` - Reglas completas con seguridad
- `FIRESTORE_RULES.md` - Reglas básicas para desarrollo

**Importante**: Las reglas deben validar que cada usuario solo pueda acceder a los datos de su `companyId`.

### Paso 3: Crear Índices Compuestos

Firestore requiere índices compuestos para consultas que filtran por `companyId` y ordenan por otro campo:

1. Ve a **Firestore Database** > **Índices**
2. Crea los siguientes índices:

**Índice 1: Productos**
- Colección: `productos`
- Campos:
  - `companyId` (Ascendente)
  - `createdAt` (Descendente)

**Índice 2: Ventas**
- Colección: `ventas`
- Campos:
  - `companyId` (Ascendente)
  - `fecha` (Descendente)

**Índice 3: Clientes**
- Colección: `clientes`
- Campos:
  - `companyId` (Ascendente)
  - `createdAt` (Descendente)

## 🔒 Seguridad

### Validaciones Implementadas

1. **Frontend**: Todas las funciones de Firebase incluyen automáticamente el `companyId` del usuario autenticado
2. **Backend (Firestore Rules)**: Las reglas validan que solo se pueda acceder a datos del `companyId` del usuario
3. **Validación en operaciones**: Antes de actualizar o eliminar, se verifica que el documento pertenezca a la empresa

### Reglas de Seguridad

Las reglas de Firestore garantizan que:
- ✅ Los usuarios solo pueden leer datos de su propia empresa
- ✅ Los usuarios solo pueden crear datos con su propio `companyId`
- ✅ Los usuarios solo pueden actualizar/eliminar datos de su propia empresa
- ✅ Los administradores pueden acceder a todas las empresas

## 📝 Uso en el Frontend

### Obtener el CompanyId

```javascript
import { useAuth } from '../contexts/AuthContext'

function MiComponente() {
  const { companyId } = useAuth()
  
  // companyId será 'empresa_001' por defecto
  console.log('Company ID:', companyId)
}
```

### Usar las Funciones de Firebase

Todas las funciones ahora aceptan `companyId` como parámetro opcional. Si no se proporciona, se usa automáticamente el del contexto:

```javascript
import { getProductos, saveProducto } from '../utils/firebaseUtils'
import { useAuth } from '../contexts/AuthContext'

function MiComponente() {
  const { companyId } = useAuth()
  
  // Obtener productos (usa companyId automáticamente)
  const productos = await getProductos(companyId)
  
  // Guardar producto (usa companyId automáticamente)
  await saveProducto(productoData, companyId)
}
```

## 🔄 Migración de Datos Existentes

Si ya tienes datos en Firestore sin `companyId`, necesitarás migrarlos:

```javascript
// Script de migración (ejecutar una vez)
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from './config/firebase'

async function migrarDatos() {
  const companyId = 'empresa_001'
  
  // Migrar productos
  const productosRef = collection(db, 'productos')
  const productosSnap = await getDocs(productosRef)
  
  productosSnap.forEach(async (docSnap) => {
    const data = docSnap.data()
    if (!data.companyId) {
      await updateDoc(doc(db, 'productos', docSnap.id), {
        companyId: companyId
      })
    }
  })
  
  // Migrar ventas
  const ventasRef = collection(db, 'ventas')
  const ventasSnap = await getDocs(ventasRef)
  
  ventasSnap.forEach(async (docSnap) => {
    const data = docSnap.data()
    if (!data.companyId) {
      await updateDoc(doc(db, 'ventas', docSnap.id), {
        companyId: companyId
      })
    }
  })
  
  // Migrar clientes
  const clientesRef = collection(db, 'clientes')
  const clientesSnap = await getDocs(clientesRef)
  
  clientesSnap.forEach(async (docSnap) => {
    const data = docSnap.data()
    if (!data.companyId) {
      await updateDoc(doc(db, 'clientes', docSnap.id), {
        companyId: companyId
      })
    }
  })
  
  console.log('✅ Migración completada')
}
```

## 🎯 Próximos Pasos

1. ✅ Sistema multi-tenant implementado
2. ⏳ Configurar reglas de Firestore en producción
3. ⏳ Crear índices compuestos necesarios
4. ⏳ Migrar datos existentes (si aplica)
5. ⏳ Implementar interfaz para cambiar de empresa (si es necesario)
6. ⏳ Agregar roles de administrador para gestión multi-tenant

## 📚 Documentación Relacionada

- `FIRESTORE_RULES_MULTI_TENANT.md` - Reglas de seguridad completas
- `src/utils/firebaseUtils.js` - Funciones de Firebase con multi-tenant
- `src/contexts/AuthContext.jsx` - Contexto de autenticación con companyId
- `src/utils/initCompany.js` - Utilidad para inicializar empresas

