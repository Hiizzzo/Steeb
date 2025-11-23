// Script para ver avatares de usuarios
const admin = require('firebase-admin');

// Cargar service account
let serviceAccount;
try {
  serviceAccount = require('./service-account.json');
} catch (e) {
  console.log('❌ No se encontró service-account.json');
  console.log('💡 Descargalo desde: Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'steeboriginal'
});

const db = admin.firestore();

async function verAvatares() {
  try {
    console.log('🔍 Buscando usuarios y sus avatares...\n');

    const usersSnapshot = await db.collection('users').limit(10).get();

    if (usersSnapshot.empty) {
      console.log('📭 No hay usuarios en la base de datos');
      return;
    }

    console.log('👥 USUARIOS Y SUS AVATARES:');
    console.log('=============================');

    let i = 1;
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const email = userData.email || 'sin-email';
      const name = userData.name || userData.displayName || 'Sin nombre';
      const avatar = userData.avatar || '❌ Sin avatar';

      console.log(`\n${i}. 📧 ${email}`);
      console.log(`   👤 Nombre: ${name}`);
      console.log(`   🖼️  Avatar: ${avatar}`);
      console.log(`   🆔 UID: ${doc.id}`);
      i++;
    }

    console.log('\n💡 Para ver tu avatar específico:');
    console.log('1. Buscá tu email en la lista');
    console.log('2. Copiá la URL del avatar');
    console.log('3. Esa URL se enviará al backend en cada pago');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verAvatares();