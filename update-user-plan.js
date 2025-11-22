// Script simple para agregar campo tipoUsuario
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function agregarTipoUsuario() {
  try {
    const usersSnapshot = await db.collection('users').get();

    for (const doc of usersSnapshot.docs) {
      await db.collection('users').doc(doc.id).update({
        tipoUsuario: 'white' // Todos empiezan en plan white por defecto
      });
    }

    console.log(`¡Campo 'tipoUsuario' agregado a ${usersSnapshot.docs.length} usuarios!`);

  } catch (error) {
    console.error('Error:', error);
  }
}

agregarTipoUsuario();