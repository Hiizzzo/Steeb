// Script para agregar campo categoria a todos los usuarios
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function agregarCampoCategoria() {
  try {
    // Obtener todos los usuarios
    const usersSnapshot = await db.collection('users').get();

    const batch = db.batch();
    let count = 0;

    usersSnapshot.forEach((doc) => {
      const userRef = db.collection('users').doc(doc.id);

      // Asignar categoría por defecto "white" a todos
      // Podés cambiar esta lógica según necesites
      const categoriaDefault = "white";

      batch.update(userRef, {
        categoria: categoriaDefault
      });

      count++;

      // Firebase batch limit is 500 operations
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`Procesados ${count} usuarios...`);
      }
    });

    // Commit final para los restantes
    if (count % 500 !== 0) {
      await batch.commit();
    }

    console.log(`¡Campo 'categoria' agregado a ${count} usuarios exitosamente!`);

  } catch (error) {
    console.error('Error al agregar campo categoria:', error);
  }
}

// Ejecutar el script
agregarCampoCategoria().then(() => {
  process.exit(0);
});