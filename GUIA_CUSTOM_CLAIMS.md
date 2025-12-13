# 🔐 Guía Completa: Configurar Custom Claims en Firebase

Esta guía te muestra **paso a paso** cómo configurar custom claims (`companyId` y `admin`) en Firebase Auth.

## 📋 Opciones Disponibles

Tienes 3 formas de configurar custom claims:

1. **✅ RECOMENDADO: Cloud Function** (ya la creamos)
2. **Script de Node.js** (rápido para pruebas)
3. **Firebase Console** (solo lectura, no permite asignar)

---

## 🚀 OPCIÓN 1: Usar Cloud Function (Recomendado)

### Paso 1: Desplegar la Cloud Function

```bash
# 1. Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# 2. Iniciar sesión
firebase login

# 3. Ir a la carpeta de functions
cd functions

# 4. Instalar dependencias
npm install firebase-admin

# 5. Volver a la raíz y desplegar
cd ..
firebase deploy --only functions:setCustomClaims,functions:getUserClaims
```

### Paso 2: Crear un Usuario en Firebase Auth

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **cubic-9dfb1**
3. Ve a **Authentication** → **Users**
4. Haz clic en **"Add user"**
5. Ingresa:
   - **Email**: `admin@tudominio.com`
   - **Password**: (una contraseña segura)
6. Anota el **UID** del usuario (aparece en la lista)

### Paso 3: Asignar Custom Claims desde el Frontend

Una vez desplegada la función, puedes usarla desde tu aplicación:

```javascript
// En la consola del navegador o en tu código
import { setUserClaims } from './src/utils/adminUtils'

// Asignar companyId y rol admin
await setUserClaims('UID_DEL_USUARIO', 'empresa_001', true)

// O asignar solo companyId (usuario normal)
await setUserClaims('UID_DEL_USUARIO', 'empresa_001', false)
```

**⚠️ IMPORTANTE**: Para usar esta función, el usuario que la ejecuta debe:
- Estar autenticado
- Tener `admin: true` en sus custom claims (o asignar a su propio usuario)

---

## ⚡ OPCIÓN 2: Script de Node.js (Rápido para Pruebas)

Esta es la forma más rápida para configurar el primer usuario administrador.

### Paso 1: Crear el Script

Crea un archivo `setup-admin.js` en la raíz del proyecto:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Descargar desde Firebase

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setupAdmin() {
  const email = 'admin@tudominio.com'; // Cambiar por tu email
  const companyId = 'empresa_001';
  
  try {
    // Buscar usuario por email
    const user = await admin.auth().getUserByEmail(email);
    console.log('✅ Usuario encontrado:', user.uid);
    
    // Asignar custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      companyId: companyId,
      admin: true
    });
    
    console.log('✅ Custom claims asignados exitosamente');
    console.log('   - companyId:', companyId);
    console.log('   - admin: true');
    
    // Verificar
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('✅ Claims verificados:', updatedUser.customClaims);
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('❌ Usuario no encontrado. Crea el usuario primero en Firebase Console');
    } else {
      console.error('❌ Error:', error);
    }
  }
  
  process.exit(0);
}

setupAdmin();
```

### Paso 2: Descargar Service Account Key

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** (⚙️) → **Service accounts**
4. Haz clic en **"Generate new private key"**
5. Descarga el archivo JSON
6. Renómbralo a `serviceAccountKey.json`
7. **⚠️ IMPORTANTE**: Agrega `serviceAccountKey.json` a `.gitignore` (NO subirlo a Git)

### Paso 3: Instalar Dependencias y Ejecutar

```bash
# Instalar firebase-admin
npm install firebase-admin

# Ejecutar el script
node setup-admin.js
```

---

## 🎯 OPCIÓN 3: Desde Firebase Console (Solo Lectura)

Firebase Console **NO permite asignar** custom claims, solo verlos. Pero puedes verificar si están configurados:

1. Ve a **Authentication** → **Users**
2. Haz clic en un usuario
3. En la sección **Custom claims**, verás los claims asignados

---

## 🔄 Verificar que los Custom Claims Funcionan

### Desde el Frontend

```javascript
import { auth } from './config/firebase'
import { onAuthStateChanged } from 'firebase/auth'

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Obtener el token con claims
    const tokenResult = await user.getIdTokenResult()
    
    console.log('Custom Claims:', tokenResult.claims)
    console.log('Company ID:', tokenResult.claims.companyId)
    console.log('Is Admin:', tokenResult.claims.admin)
  }
})
```

### Desde la Consola del Navegador

```javascript
// Después de iniciar sesión
const user = firebase.auth().currentUser
const token = await user.getIdTokenResult()
console.log('Claims:', token.claims)
```

---

## 🛠️ Solución de Problemas

### Problema 1: "Los claims no se actualizan"

**Solución**: El token se cachea. El usuario debe:
1. Cerrar sesión
2. Iniciar sesión nuevamente
3. O forzar actualización: `await user.getIdToken(true)`

### Problema 2: "Permission denied al llamar setCustomClaims"

**Causa**: El usuario no tiene permisos de admin.

**Solución**: 
- Si es el primer admin, usa el **Script de Node.js** (Opción 2)
- O asigna claims manualmente desde Firebase Admin SDK

### Problema 3: "No puedo desplegar la Cloud Function"

**Solución**:
```bash
# Verificar que estás en el directorio correcto
cd functions

# Verificar que firebase-admin está instalado
npm list firebase-admin

# Si no está, instalarlo
npm install firebase-admin

# Desplegar
firebase deploy --only functions
```

---

## 📝 Ejemplo Completo: Configurar Primer Admin

### Método Rápido (Script Node.js)

1. **Crear usuario en Firebase Console**:
   - Authentication → Add user
   - Email: `admin@tudominio.com`
   - Password: (segura)

2. **Descargar Service Account**:
   - Project Settings → Service accounts → Generate new private key

3. **Crear y ejecutar script**:
   ```bash
   # Crear setup-admin.js (código de arriba)
   # Colocar serviceAccountKey.json en la raíz
   npm install firebase-admin
   node setup-admin.js
   ```

4. **Verificar**:
   - El usuario debe cerrar sesión y volver a iniciar
   - Los claims estarán disponibles en `token.claims`

---

## 🎯 Checklist

- [ ] Usuario creado en Firebase Auth
- [ ] Service Account Key descargado (para script)
- [ ] Custom claims asignados (`companyId` y `admin`)
- [ ] Usuario cerró sesión y volvió a iniciar
- [ ] Claims verificados en el frontend
- [ ] Reglas de Firestore actualizadas

---

## 📚 Recursos

- [Firebase Custom Claims Docs](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

