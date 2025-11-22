// Script para verificar tipos de usuario en Firebase
const admin = require('firebase-admin');

// Usar las variables de entorno o el archivo de servicio
let serviceAccount;
try {
  serviceAccount = require('./service-account.json');
} catch (e) {
  console.log('❌ No se encontró service-account.json');
  console.log('💡 Descargalo desde: Firebase Console → Project Settings → Service Accounts');
  console.log('📁 Colocalo en la raíz del proyecto como service-account.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'steeboriginal'
});

const db = admin.firestore();

async function verificarTiposDeUsuario() {
  try {
    console.log('🔍 Verificando usuarios en Firebase...\n');

    // Obtener todos los usuarios
    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('📭 No hay usuarios en la base de datos');
      return;
    }

    console.log(`👥 Total de usuarios: ${usersSnapshot.docs.length}\n`);

    // Contadores para cada tipo
    const tipos = {
      white: 0,
      black: 0,
      shiny: 0,
      otros: new Set()
    };

    const usuarios = [];

    // Analizar cada usuario
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const tipoUsuario = userData?.tipoUsuario;
      const role = userData?.role;
      const email = userData?.email || 'sin-email';

      usuarios.push({
        uid: doc.id,
        email: email,
        tipoUsuario: tipoUsuario || 'NO-DEFINIDO',
        role: role || 'NO-DEFINIDO',
        shinyRolls: userData?.shinyRolls || 0,
        createdAt: userData?.createdAt?.toDate() || 'NO-DEFINIDO'
      });

      // Contar tipos
      if (tipoUsuario) {
        if (['white', 'black', 'shiny'].includes(tipoUsuario)) {
          tipos[tipoUsuario]++;
        } else {
          tipos.otros.add(tipoUsuario);
        }
      } else {
        tipos.otros.add('SIN-CAMPO');
      }
    });

    // Mostrar resumen
    console.log('📊 RESUMEN DE TIPOS DE USUARIO:');
    console.log('================================');
    console.log(`🤍 White: ${tipos.white} usuarios`);
    console.log(`⚫ Black: ${tipos.black} usuarios`);
    console.log(`✨ Shiny: ${tipos.shiny} usuarios`);

    if (tipos.otros.size > 0) {
      console.log(`❓ Otros: ${tipos.otros.size} usuarios`);
      console.log('   Valores:', Array.from(tipos.otros).join(', '));
    }

    console.log('\n📋 DETALLE DE USUARIOS:');
    console.log('=========================');

    usuarios.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Tipo: ${user.tipoUsuario}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Shiny Rolls: ${user.shinyRolls}`);
      console.log(`   Creado: ${user.createdAt}`);
    });

    // Opciones para modificar
    console.log('\n🛠️  SCRIPTS DISPONIBLES:');
    console.log('========================');
    console.log('1. Para establecer "white" a todos los usuarios sin tipo:');
    console.log('   node update-user-plan.js');
    console.log('\n2. Para actualizar un usuario específico:');
    console.log('   node update-specific-user.js [uid] [tipo]');

  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar
verificarTiposDeUsuario();