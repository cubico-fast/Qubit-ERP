/**
 * Firebase Cloud Function para asignar Custom Claims (companyId, admin)
 * 
 * Esta función permite asignar custom claims a usuarios de Firebase Auth
 * Solo usuarios con rol de administrador pueden ejecutar esta función
 * 
 * Instalación:
 * 1. npm install -g firebase-tools
 * 2. firebase login
 * 3. firebase init functions
 * 4. npm install en la carpeta functions/
 * 5. firebase deploy --only functions:setCustomClaims
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Asignar custom claims a un usuario
 * Solo usuarios con rol admin pueden ejecutar esta función
 */
exports.setCustomClaims = functions.https.onCall(async (data, context) => {
  // Verificar que el usuario esté autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debes estar autenticado para usar esta función'
    );
  }

  const { userId, companyId, isAdmin } = data;

  // Validar datos
  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Se requiere userId'
    );
  }

  // Verificar que el usuario que hace la petición sea admin
  // O que esté asignando claims a su propio usuario
  const callerUid = context.auth.uid;
  const callerUser = await admin.auth().getUser(callerUid);
  const callerIsAdmin = callerUser.customClaims?.admin === true;

  // Solo admins pueden asignar claims a otros usuarios
  // O el usuario puede asignar su propio companyId (pero no admin)
  if (userId !== callerUid && !callerIsAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden asignar claims a otros usuarios'
    );
  }

  // Si no es admin, no puede asignar rol de admin
  if (isAdmin === true && !callerIsAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden asignar el rol de administrador'
    );
  }

  try {
    // Obtener los claims actuales del usuario
    const user = await admin.auth().getUser(userId);
    const currentClaims = user.customClaims || {};

    // Preparar nuevos claims
    const newClaims = {
      ...currentClaims,
      ...(companyId && { companyId: companyId }),
      ...(isAdmin !== undefined && { admin: isAdmin === true })
    };

    // Asignar los custom claims
    await admin.auth().setCustomUserClaims(userId, newClaims);

    // Actualizar también el documento del usuario en Firestore si existe
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.update({
        companyId: companyId || userDoc.data().companyId,
        admin: isAdmin !== undefined ? isAdmin : userDoc.data().admin,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Crear documento si no existe
      await userRef.set({
        uid: userId,
        email: user.email || '',
        companyId: companyId || 'empresa_001',
        admin: isAdmin === true || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      success: true,
      message: 'Custom claims asignados exitosamente',
      claims: newClaims
    };
  } catch (error) {
    console.error('Error al asignar custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error al asignar custom claims: ' + error.message
    );
  }
});

/**
 * Obtener información de un usuario incluyendo sus custom claims
 */
exports.getUserClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debes estar autenticado'
    );
  }

  const { userId } = data;
  const callerUid = context.auth.uid;

  // Solo admins pueden ver claims de otros usuarios
  // O el usuario puede ver sus propios claims
  if (userId && userId !== callerUid) {
    const callerUser = await admin.auth().getUser(callerUid);
    if (callerUser.customClaims?.admin !== true) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Solo administradores pueden ver claims de otros usuarios'
      );
    }
  }

  const targetUserId = userId || callerUid;

  try {
    const user = await admin.auth().getUser(targetUserId);
    return {
      uid: user.uid,
      email: user.email,
      customClaims: user.customClaims || {},
      displayName: user.displayName
    };
  } catch (error) {
    console.error('Error al obtener claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error al obtener claims: ' + error.message
    );
  }
});

