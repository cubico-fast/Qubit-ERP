# Reglas de Firestore para Cubic CRM - Sistema Multi-Tenant

Para que la aplicación funcione correctamente con el sistema multi-tenant, necesitas configurar las reglas de seguridad de Firestore en Firebase Console.

## ⚠️ IMPORTANTE: Estás en la sección incorrecta

**NO uses "Realtime Database"** - Necesitas ir a **"Firestore Database"** que es un servicio diferente.

## Pasos para configurar las reglas:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **cubic-9dfb1**
3. En el menú lateral izquierdo, busca y haz clic en **"Firestore Database"** (NO "Realtime Database")
4. Si no tienes Firestore habilitado, haz clic en **"Crear base de datos"** y selecciona modo de prueba
5. Una vez en Firestore Database, haz clic en la pestaña **"Reglas"** (Rules)
6. Reemplaza las reglas actuales con las siguientes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función helper para obtener el companyId del usuario desde custom claims
    function getUserCompanyId() {
      return request.auth != null && request.auth.token.companyId != null 
        ? request.auth.token.companyId 
        : null;
    }
    
    // Función helper para verificar si el usuario es administrador
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    // Función helper para verificar que el documento pertenece a la empresa del usuario
    function belongsToUserCompany(companyId) {
      return request.auth != null && 
             companyId != null && 
             companyId == getUserCompanyId();
    }
    
    // Función helper para verificar acceso (propio companyId o admin)
    function canAccessCompany(companyId) {
      return isAdmin() || belongsToUserCompany(companyId);
    }
    
    // Reglas para la colección companies
    match /companies/{companyId} {
      // Los usuarios pueden leer su propia empresa, admins pueden leer todas
      allow read: if request.auth != null && canAccessCompany(companyId);
      // Solo administradores pueden crear/actualizar empresas
      allow create, update: if request.auth != null && isAdmin();
      // Solo administradores pueden eliminar empresas
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Reglas para productos - Multi-tenant
    match /productos/{productoId} {
      // Lectura: solo productos de la empresa del usuario o admins
      allow read: if request.auth != null && 
                     (isAdmin() || 
                      (resource != null && resource.data.companyId == getUserCompanyId()));
      // Creación: solo con el companyId del usuario o admins
      allow create: if request.auth != null && 
                       (isAdmin() || 
                        (request.resource.data.companyId == getUserCompanyId() && 
                         request.resource.data.companyId != null));
      // Actualización: solo productos de la empresa del usuario o admins
      allow update: if request.auth != null && 
                       (isAdmin() || 
                        (resource != null && resource.data.companyId == getUserCompanyId() &&
                         request.resource.data.companyId == resource.data.companyId));
      // Eliminación: solo productos de la empresa del usuario o admins
      allow delete: if request.auth != null && 
                       (isAdmin() || 
                        (resource != null && resource.data.companyId == getUserCompanyId()));
    }
    
    // Reglas para ventas - Multi-tenant
    match /ventas/{ventaId} {
      // Lectura: solo ventas de la empresa del usuario o admins
      allow read: if request.auth != null && 
                     (isAdmin() || 
                      (resource != null && resource.data.companyId == getUserCompanyId()));
      // Creación: solo con el companyId del usuario o admins
      allow create: if request.auth != null && 
                       (isAdmin() || 
                        (request.resource.data.companyId == getUserCompanyId() && 
                         request.resource.data.companyId != null));
      // Actualización: solo ventas de la empresa del usuario o admins
      allow update: if request.auth != null && 
                       (isAdmin() || 
                        (resource != null && resource.data.companyId == getUserCompanyId() &&
                         request.resource.data.companyId == resource.data.companyId));
      // Eliminación: solo ventas de la empresa del usuario o admins
      allow delete: if request.auth != null && 
                       (isAdmin() || 
                        (resource != null && resource.data.companyId == getUserCompanyId()));
    }
    
    // Reglas para clientes - Multi-tenant
    match /clientes/{clienteId} {
      // Lectura: solo clientes de la empresa del usuario o admins
      allow read: if request.auth != null && 
                     (isAdmin() || 
                      (resource != null && resource.data.companyId == getUserCompanyId()));
      // Creación: solo con el companyId del usuario o admins
      allow create: if request.auth != null && 
                       (isAdmin() || 
                        (request.resource.data.companyId == getUserCompanyId() && 
                         request.resource.data.companyId != null));
      // Actualización: solo clientes de la empresa del usuario o admins
      allow update: if request.auth != null && 
                       (isAdmin() || 
                        (resource != null && resource.data.companyId == getUserCompanyId() &&
                         request.resource.data.companyId == resource.data.companyId));
      // Eliminación: solo clientes de la empresa del usuario o admins
      allow delete: if request.auth != null && 
                       (isAdmin() || 
                        (resource != null && resource.data.companyId == getUserCompanyId()));
    }
    
    // Reglas para usuarios
    match /users/{userId} {
      // Los usuarios pueden leer su propio documento
      // Los admins pueden leer todos
      allow read: if request.auth != null && 
                     (isAdmin() || request.auth.uid == userId);
      // Solo admins pueden crear/actualizar usuarios
      allow create, update: if request.auth != null && isAdmin();
      // Solo admins pueden eliminar usuarios
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Reglas para tokens de Meta (SEGURIDAD CRÍTICA)
    // Solo el usuario puede acceder a sus propios tokens
    match /marketing_tokens/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Permitir también acceso anónimo si userId es 'anonymous' (para desarrollo)
      allow read, write: if userId == 'anonymous';
    }
    
    // Reglas para configuración de Meta (pública, sin tokens)
    match /marketing_config/{userId} {
      allow read: if true;  // Configuración pública puede leerse
      allow write: if request.auth != null && request.auth.uid == userId;
      // Permitir también acceso anónimo si userId es 'anonymous' (para desarrollo)
      allow write: if userId == 'anonymous';
    }
    
    // Reglas para métricas de marketing - Multi-tenant
    match /marketing_metricas/{metricaId} {
      allow read: if request.auth != null && 
                     (isAdmin() || 
                      (resource != null && resource.data.companyId == getUserCompanyId()));
      allow create: if request.auth != null && 
                       (isAdmin() || 
                        (request.resource.data.companyId == getUserCompanyId() && 
                         request.resource.data.companyId != null));
      allow update, delete: if request.auth != null && 
                                (isAdmin() || 
                                 (resource != null && resource.data.companyId == getUserCompanyId()));
    }
    
    // Reglas para unidades de medida - Multi-tenant
    match /unidades_medida/{unidadId} {
      allow read: if request.auth != null && 
                     (isAdmin() || 
                      (resource != null && resource.data.companyId == getUserCompanyId()));
      allow create: if request.auth != null && 
                       (isAdmin() || 
                        (request.resource.data.companyId == getUserCompanyId() && 
                         request.resource.data.companyId != null));
      allow update, delete: if request.auth != null && 
                                (isAdmin() || 
                                 (resource != null && resource.data.companyId == getUserCompanyId()));
    }
  }
}
```

## ⚠️ IMPORTANTE - Nota sobre Autenticación

Las reglas anteriores asumen que estás usando Firebase Authentication con tokens personalizados que incluyen el `companyId`. 

**Si estás usando autenticación simple (sin Firebase Auth):**

Puedes usar reglas más simples que permitan acceso basado en el campo `companyId` almacenado en localStorage (aunque esto es menos seguro):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reglas para productos - Multi-tenant (modo desarrollo)
    match /productos/{productoId} {
      // Permitir acceso si el documento tiene companyId y coincide con el del usuario
      // NOTA: Esto requiere que el frontend siempre incluya el companyId correcto
      allow read, write: if true; // Para desarrollo - cambiar en producción
    }
    
    // Reglas para ventas - Multi-tenant (modo desarrollo)
    match /ventas/{ventaId} {
      allow read, write: if true; // Para desarrollo - cambiar en producción
    }
    
    // Reglas para clientes - Multi-tenant (modo desarrollo)
    match /clientes/{clienteId} {
      allow read, write: if true; // Para desarrollo - cambiar en producción
    }
    
    // Reglas para companies
    match /companies/{companyId} {
      allow read, write: if true; // Para desarrollo - cambiar en producción
    }
    
    // Reglas para tokens de Meta (SEGURIDAD CRÍTICA)
    match /marketing_tokens/{userId} {
      allow read, write: if true; // Para desarrollo - cambiar en producción
    }
    
    match /marketing_config/{userId} {
      allow read: if true;
      allow write: if true; // Para desarrollo - cambiar en producción
    }
  }
}
```

## 🔒 Seguridad en Producción

Para producción, deberías:

1. **Implementar Firebase Authentication** con tokens personalizados que incluyan el `companyId`
2. **Usar las reglas completas** que verifican el `companyId` del token
3. **Implementar roles de administrador** para gestión multi-tenant
4. **Validar siempre en el frontend** que el `companyId` se incluye en todas las operaciones

## 📝 Crear la primera empresa

Para crear la empresa inicial (`empresa_001`), puedes ejecutar este código en la consola del navegador después de iniciar sesión:

```javascript
// Ejecutar en la consola del navegador después de importar las funciones
import { createOrUpdateCompany } from './src/utils/firebaseUtils'

createOrUpdateCompany({
  companyId: 'empresa_001',
  nombre: 'Empresa Principal',
  descripcion: 'Empresa principal del sistema',
  activa: true
}).then(() => {
  console.log('✅ Empresa creada exitosamente')
}).catch(error => {
  console.error('Error al crear empresa:', error)
})
```

## Crear índices necesarios

Si ves un error sobre índices faltantes:

1. Ve a **Firestore Database** > **Índices**
2. Haz clic en el enlace del error que aparecerá en la consola del navegador
3. O crea manualmente índices compuestos para:
   - Colección: `productos`
     - Campos: `companyId` (Ascendente), `createdAt` (Descendente)
   - Colección: `ventas`
     - Campos: `companyId` (Ascendente), `fecha` (Descendente)
   - Colección: `clientes`
     - Campos: `companyId` (Ascendente), `createdAt` (Descendente)

