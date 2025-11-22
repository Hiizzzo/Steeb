// Script para actualizar el tipo de usuario específico
const admin = require('firebase-admin');

const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'steeboriginal'
});

const db = admin.firestore();

async function updateSpecificUser(uid, nuevoTipo) {
  try {
    if (!uid || !nuevoTipo) {
      console.log('❌ Uso: node update-specific-user.js [UID] [TIPO]');
      console.log('💡 Tipos válidos: white, black, shiny');
      return;
    }

    if (!['white', 'black', 'shiny'].includes(nuevoTipo)) {
      console.log('❌ Tipo inválido. Usá: white, black, o shiny');
      return;
    }

    console.log(`🔄 Actualizando usuario ${uid} a tipo ${nuevoTipo}...`);

    // Verificar que el usuario existe
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      console.log('❌ Usuario no encontrado en la base de datos');
      return;
    }

    const userData = userDoc.data();
    console.log(`📧 Usuario: ${userData.email || 'sin-email'}`);
    console.log(`📋 Tipo actual: ${userData.tipoUsuario || 'SIN CAMPO'}`);

    // Actualizar el campo
    await db.collection('users').doc(uid).update({
      tipoUsuario: nuevoTipo,
      updatedAt: new Date()
    });

    console.log(`✅ Usuario actualizado exitosamente a tipo: ${nuevoTipo}`);

    // Verificar la actualización
    const updatedDoc = await db.collection('users').doc(uid).get();
    const updatedData = updatedDoc.data();

    console.log(`📋 Nuevo tipo: ${updatedData.tipoUsuario}`);

  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
  } finally {
    process.exit(0);
  }
}

// Obtener parámetros de línea de comandos
const args = process.argv.slice(2);
const [uid, tipo] = args;

updateSpecificUser(uid, tipo);