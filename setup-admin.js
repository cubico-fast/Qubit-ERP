/**
 * Script para configurar el primer usuario administrador
 * 
 * USO:
 * 1. Descarga serviceAccountKey.json desde Firebase Console
 * 2. npm install firebase-admin
 * 3. node setup-admin.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Verificar que existe el service account key
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: No se encontró serviceAccountKey.json');
  console.log('\n📥 Para obtenerlo:');
  console.log('1. Ve a Firebase Console → Project Settings → Service accounts');
  console.log('2. Haz clic en "Generate new private key"');
  console.log('3. Descarga el JSON y renómbralo a serviceAccountKey.json');
  console.log('4. Colócalo en la raíz del proyecto');
  process.exit(1);
}

// Inicializar Firebase Admin
try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin inicializado correctamente\n');
} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin:', error.message);
  process.exit(1);
}

async function setupAdmin() {
  // ⚙️ CONFIGURACIÓN - Cambiar estos valores
  const email = process.argv[2] || 'admin@tudominio.com'; // Email del usuario
  const companyId = process.argv[3] || 'empresa_001'; // Company ID
  const isAdmin = process.argv[4] !== 'false'; // true por defecto
  
  console.log('🔧 Configuración:');
  console.log(`   Email: ${email}`);
  console.log(`   Company ID: ${companyId}`);
  console.log(`   Admin: ${isAdmin}\n`);
  
  try {
    // Buscar usuario por email
    console.log('🔍 Buscando usuario...');
    const user = await admin.auth().getUserByEmail(email);
    console.log('✅ Usuario encontrado:', user.uid);
    console.log(`   Nombre: ${user.displayName || 'N/A'}`);
    console.log(`   Email: ${user.email}\n`);
    
    // Asignar custom claims
    console.log('🔐 Asignando custom claims...');
    await admin.auth().setCustomUserClaims(user.uid, {
      companyId: companyId,
      admin: isAdmin
    });
    
    console.log('✅ Custom claims asignados exitosamente');
    console.log(`   - companyId: ${companyId}`);
    console.log(`   - admin: ${isAdmin}\n`);
    
    // Verificar
    console.log('🔍 Verificando claims...');
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('✅ Claims verificados:', updatedUser.customClaims);
    
    // Actualizar documento en Firestore
    console.log('\n📝 Actualizando documento en Firestore...');
    const userRef = admin.firestore().collection('users').doc(user.uid);
    await userRef.set({
      uid: user.uid,
      email: user.email,
      companyId: companyId,
      admin: isAdmin,
      displayName: user.displayName || '',
      activo: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Documento en Firestore actualizado\n');
    
    console.log('🎉 ¡Configuración completada!');
    console.log('\n⚠️ IMPORTANTE:');
    console.log('   El usuario debe CERRAR SESIÓN y VOLVER A INICIAR');
    console.log('   para que los custom claims se actualicen en el token.\n');
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ Usuario no encontrado');
      console.log('\n📝 Para crear el usuario:');
      console.log('1. Ve a Firebase Console → Authentication → Users');
      console.log('2. Haz clic en "Add user"');
      console.log(`3. Ingresa el email: ${email}`);
      console.log('4. Establece una contraseña');
      console.log('5. Ejecuta este script nuevamente\n');
    } else {
      console.error('❌ Error:', error.message);
      console.error(error);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

// Ejecutar
setupAdmin();

