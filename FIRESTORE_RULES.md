# Reglas de Firestore para Cubic CRM

Para que la aplicación funcione correctamente, necesitas configurar las reglas de seguridad de Firestore en Firebase Console.

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
    // Reglas para productos
    match /productos/{productoId} {
      allow read: if true;  // Permitir lectura a todos
      allow create: if true; // Permitir creación a todos (cambiar según necesites)
      allow update: if true; // Permitir actualización a todos (cambiar según necesites)
      allow delete: if true; // Permitir eliminación a todos (cambiar según necesites)
    }
    
    // Reglas para ventas
    match /ventas/{ventaId} {
      allow read: if true;  // Permitir lectura a todos
      allow create: if true; // Permitir creación a todos (cambiar según necesites)
      allow update: if true; // Permitir actualización a todos (cambiar según necesites)
      allow delete: if true; // Permitir eliminación a todos (cambiar según necesites)
    }
  }
}
```

## ⚠️ IMPORTANTE - Seguridad en Producción

Las reglas anteriores permiten acceso completo a todos los usuarios. **Solo úsalas para desarrollo/testing**.

Para producción, deberías implementar autenticación y reglas más restrictivas, por ejemplo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden acceder
    match /productos/{productoId} {
      allow read, write: if request.auth != null;
    }
    
    match /ventas/{ventaId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Crear índices necesarios

Si ves un error sobre índices faltantes:

1. Ve a **Firestore Database** > **Índices**
2. Haz clic en el enlace del error que aparecerá en la consola del navegador
3. O crea manualmente un índice compuesto para:
   - Colección: `productos`
   - Campos: `createdAt` (Ascendente)

