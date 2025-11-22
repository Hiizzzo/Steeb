// Script para probar acceso a temas manualmente
// Este script actualiza un usuario a BLACK para que pueda alternar entre WHITE y DARK

const admin = require('firebase-admin');

// Verificar si tenemos el service account
let serviceAccount;
try {
  serviceAccount = require('./service-account.json');
} catch (e) {
  console.log('❌ No se encontró service-account.json');
  console.log('💡 Descargalo desde: Firebase Console → Project Settings → Service Accounts');
  console.log('📁 Colocalo en la raíz del proyecto como service-account.json');

  console.log('\n🧪 ALTERNATIVA: Probá manualmente desde Firebase Console:');
  console.log('1. Andá a Firebase Console → Firestore Database');
  console.log('2. Buscá la colección "users"');
  console.log('3. Encontrá tu usuario por email');
  console.log('4. Agregá el campo "tipoUsuario" con valor "black"');
  console.log('5. Guardá los cambios');

  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'steeboriginal'
});

const db = admin.firestore();

async function probarAccesoTemas() {
  try {
    console.log('🔍 Verificando usuarios en Firebase...\n');

    const usersSnapshot = await db.collection('users').limit(5).get();

    if (usersSnapshot.empty) {
      console.log('📭 No hay usuarios en la base de datos');
      return;
    }

    console.log('📋 USUARIOS ENCONTRADOS:');
    console.log('=======================');

    let i = 1;
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const email = userData.email || 'sin-email';
      const tipo = userData.tipoUsuario || 'SIN-TIPO';

      console.log(`\n${i}. ${email}`);
      console.log(`   UID: ${doc.id}`);
      console.log(`   Tipo actual: ${tipo}`);
      i++;
    }

    console.log('\n⚡ ACCIONES DISPONIBLES:');
    console.log('========================');

    // Encontrar el primer usuario sin tipoUsuario o con tipoUsuario "white"
    let targetUser = null;
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      if (!userData.tipoUsuario || userData.tipoUsuario === 'white') {
        targetUser = {
          uid: doc.id,
          email: userData.email,
          tipoActual: userData.tipoUsuario || 'SIN-CAMPO'
        };
        break;
      }
    }

    if (targetUser) {
      console.log(`\n🎯 USUARIO PARA PROBAR:`);
      console.log(`Email: ${targetUser.email}`);
      console.log(`Tipo actual: ${targetUser.tipoActual}`);
      console.log(`UID: ${targetUser.uid}`);

      console.log('\n💻 COMANDO PARA ACTUALIZAR A BLACK:');
      console.log(`node update-specific-user.js ${targetUser.uid} black`);

      console.log('\n💻 COMANDO PARA ACTUALIZAR A SHINY:');
      console.log(`node update-specific-user.js ${targetUser.uid} shiny`);

      console.log('\n🔄 O ACTUALIZÁ MANUALMENTE DESDE FIREBASE CONSOLE:');
      console.log('1. Firebase Console → Firestore Database');
      console.log(`2. Buscá el usuario: ${targetUser.email}`);
      console.log('3. Agregá/editá el campo: tipoUsuario = "black"');
      console.log('4. Guardá y probá la app');

    } else {
      console.log('\n✅ Todos los usuarios ya tienen tipoUsuario definido');
      console.log('💡 Para probar con un usuario específico, usá:');
      console.log('node update-specific-user.js [UID] [white|black|shiny]');
    }

    console.log('\n🧪 COMO PROBAR EN LA APP:');
    console.log('=========================');
    console.log('1. Iniciá la app: npm start');
    console.log('2. Logueate con el usuario actualizado');
    console.log('3. Intentá cambiar el tema con el botón');
    console.log('📋 RESULTADOS ESPERADOS:');
    console.log('   • WHITE: Solo puede usar Light Mode');
    console.log('   • BLACK: Puede alternar Light ↔ Dark + tiradas Shiny');
    console.log('   • SHINY: Puede usar todos los modos');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

probarAccesoTemas();