# 🔒 Configuración de Custom Claims y Panel de Administración

Este documento explica cómo configurar los Custom Claims de Firebase Auth y usar el Panel de Administración para gestionar empresas y usuarios.

## 📋 Requisitos Previos

1. **Firebase Functions configuradas**
2. **Firebase Auth habilitado**
3. **Firestore Database configurado**

## 🚀 Paso 1: Desplegar Cloud Functions

### 1.1 Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 1.2 Iniciar sesión

```bash
firebase login
```

### 1.3 Inicializar Functions (si no lo has hecho)

```bash
firebase init functions
```

Cuando te pregunte:
- Selecciona tu proyecto Firebase
- Usa JavaScript
- Instala dependencias: **Sí**

### 1.4 Copiar la función

Copia el contenido de `firebase-functions/setCustomClaims.js` a `functions/index.js` o agrégalo al archivo existente:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// ... (código de setCustomClaims.js)
```

### 1.5 Instalar dependencias

```bash
cd functions
npm install firebase-admin
cd ..
```

### 1.6 Desplegar

```bash
firebase deploy --only functions:setCustomClaims,functions:getUserClaims
```

## 🔐 Paso 2: Configurar Reglas de Firestore

Ve a [Firebase Console](https://console.firebase.google.com/) → Firestore Database → Reglas y copia las reglas del archivo `FIRESTORE_RULES_MULTI_TENANT.md`.

**Importante**: Las reglas ahora usan `request.auth.token.companyId` y `request.auth.token.admin` desde los custom claims.

## 👤 Paso 3: Crear el Primer Usuario Administrador

### Opción A: Desde Firebase Console

1. Ve a **Authentication** → **Users**
2. Crea un nuevo usuario con email y contraseña
3. Anota el **UID** del usuario

### Opción B: Desde el código (requiere Firebase Admin SDK)

```javascript
// Ejecutar en una Cloud Function o script de Node.js
const admin = require('firebase-admin');

async function createAdminUser() {
  const user = await admin.auth().createUser({
    email: 'admin@tudominio.com',
    password: 'PasswordSeguro123!',
    displayName: 'Administrador'
  });

  // Asignar custom claims
  await admin.auth().setCustomUserClaims(user.uid, {
    companyId: 'empresa_001',
    admin: true
  });

  console.log('Usuario administrador creado:', user.uid);
}
```

## 🎯 Paso 4: Asignar Custom Claims a Usuarios

### Desde el Panel de Administración

1. Inicia sesión como administrador
2. Ve a `/admin`
3. Haz clic en la pestaña **Usuarios**
4. Crea o edita un usuario
5. Asigna la empresa y el rol (admin/usuario)

### Desde código (Cloud Function)

```javascript
import { setUserClaims } from './src/utils/adminUtils'

// Asignar companyId y rol
await setUserClaims('userId', 'empresa_001', false) // Usuario normal
await setUserClaims('userId', 'empresa_001', true)  // Administrador
```

## 📊 Paso 5: Usar el Panel de Administración

### Acceder al Panel

1. Inicia sesión como administrador
2. Navega a `/admin` en tu aplicación

### Funcionalidades

#### Gestión de Empresas
- ✅ Crear nuevas empresas
- ✅ Editar empresas existentes
- ✅ Activar/desactivar empresas
- ✅ Ver estadísticas por empresa (ventas, productos, clientes, usuarios)
- ✅ Configurar planes (gratis, básico, premium)
- ✅ Establecer límites (max usuarios, max ventas, max productos)

#### Gestión de Usuarios
- ✅ Ver todos los usuarios del sistema
- ✅ Asignar usuarios a empresas
- ✅ Asignar roles (admin/usuario)
- ✅ Activar/desactivar usuarios

## 🔄 Paso 6: Actualizar AuthContext (Opcional)

Si quieres migrar completamente a Firebase Auth, actualiza `AuthContext.jsx`:

```javascript
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'

// En el useEffect
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Obtener el token con custom claims
      const token = await user.getIdTokenResult()
      const companyId = token.claims.companyId || 'empresa_001'
      const isAdmin = token.claims.admin || false
      
      setCompanyId(companyId)
      setIsAdmin(isAdmin)
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
    setLoading(false)
  })
  
  return () => unsubscribe()
}, [])
```

## 🛡️ Seguridad

### Custom Claims en el Token

Los custom claims se incluyen en el JWT token de Firebase Auth:

```javascript
{
  "uid": "user123",
  "email": "user@example.com",
  "companyId": "empresa_001",
  "admin": false
}
```

### Validación en Firestore Rules

Las reglas validan automáticamente:
- ✅ `request.auth.token.companyId` - Empresa del usuario
- ✅ `request.auth.token.admin` - Si es administrador

### Protección del Panel de Admin

El panel de administración debería verificar que el usuario sea admin:

```javascript
// En AdminPanel.jsx o ProtectedRoute
const { isAdmin } = useAuth()

if (!isAdmin) {
  return <Navigate to="/" replace />
}
```

## 📝 Estructura de Datos

### Colección: `users`

```javascript
{
  uid: "user123",
  email: "user@example.com",
  companyId: "empresa_001",
  admin: false,
  displayName: "Nombre Usuario",
  activo: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Colección: `companies`

```javascript
{
  companyId: "empresa_001",
  nombre: "Mi Empresa",
  descripcion: "Descripción",
  activa: true,
  plan: "premium", // gratis, basico, premium
  limites: {
    maxUsuarios: 10,
    maxVentas: 1000,
    maxProductos: 500
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🐛 Solución de Problemas

### Los custom claims no se actualizan

**Problema**: Cambias los claims pero el usuario sigue viendo los antiguos.

**Solución**: El token se cachea. El usuario debe:
1. Cerrar sesión
2. Iniciar sesión nuevamente
3. O forzar la actualización del token: `await user.getIdToken(true)`

### Error: "Permission denied" en Firestore

**Problema**: Las reglas rechazan las operaciones.

**Solución**: 
1. Verifica que los custom claims estén asignados correctamente
2. Verifica que las reglas de Firestore estén actualizadas
3. Verifica que el usuario tenga el `companyId` correcto en el token

### El panel de admin no carga

**Problema**: No puedes acceder al panel.

**Solución**:
1. Verifica que el usuario tenga `admin: true` en los custom claims
2. Verifica que la ruta `/admin` esté configurada en `App.jsx`
3. Verifica que las Cloud Functions estén desplegadas

## 📚 Recursos Adicionales

- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Functions](https://firebase.google.com/docs/functions)

## ✅ Checklist de Implementación

- [ ] Cloud Functions desplegadas
- [ ] Reglas de Firestore actualizadas
- [ ] Primer usuario administrador creado
- [ ] Custom claims asignados correctamente
- [ ] Panel de administración accesible
- [ ] Pruebas de seguridad realizadas
- [ ] Documentación actualizada

