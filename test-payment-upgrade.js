/**
 * Script de prueba para simular la actualización de un usuario a Black
 * después de un pago exitoso.
 * 
 * Uso:
 * node test-payment-upgrade.js <userId>
 * 
 * Ejemplo:
 * node test-payment-upgrade.js abc123xyz
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Firebase Admin
const serviceAccount = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

try {
    initializeApp({
        credential: cert(serviceAccount)
    });
    console.log('✅ Firebase Admin inicializado correctamente');
} catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    process.exit(1);
}

const db = getFirestore();
const auth = getAuth();

/**
 * Actualiza un usuario a tipo Black (Premium)
 */
async function upgradeUserToBlack(userId) {
    try {
        console.log(`\n🔄 Iniciando actualización del usuario: ${userId}`);

        // 1. Verificar que el usuario existe en Firebase Auth
        try {
            const userRecord = await auth.getUser(userId);
            console.log(`✅ Usuario encontrado en Auth: ${userRecord.email}`);
        } catch (error) {
            console.error(`❌ Usuario no encontrado en Firebase Auth: ${userId}`);
            return false;
        }

        // 2. Actualizar en Firestore
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.log(`⚠️ Usuario no existe en Firestore, creando documento...`);
        } else {
            const currentData = userDoc.data();
            console.log(`📋 Estado actual:`, {
                tipoUsuario: currentData.tipoUsuario,
                hasDarkVersion: currentData.hasDarkVersion,
                categoria: currentData.categoria
            });
        }

        // 3. Actualizar a Black
        const updateData = {
            tipoUsuario: 'Black',
            hasDarkVersion: true,
            categoria: 'premium',
            updatedAt: new Date().toISOString(),
            paymentVerified: true,
            paymentDate: new Date().toISOString()
        };

        await userRef.set(updateData, { merge: true });
        console.log(`✅ Usuario actualizado a Black exitosamente`);

        // 4. Verificar la actualización
        const updatedDoc = await userRef.get();
        const updatedData = updatedDoc.data();
        console.log(`\n📊 Estado después de la actualización:`, {
            tipoUsuario: updatedData.tipoUsuario,
            hasDarkVersion: updatedData.hasDarkVersion,
            categoria: updatedData.categoria,
            paymentVerified: updatedData.paymentVerified,
            paymentDate: updatedData.paymentDate
        });

        console.log(`\n🎉 ¡Actualización completada! El usuario ahora es Black/Premium`);
        return true;

    } catch (error) {
        console.error(`❌ Error actualizando usuario:`, error);
        return false;
    }
}

/**
 * Listar todos los usuarios y sus tipos
 */
async function listUsers() {
    try {
        console.log(`\n📋 Listando usuarios en Firestore...\n`);

        const usersSnapshot = await db.collection('users').limit(10).get();

        if (usersSnapshot.empty) {
            console.log('No se encontraron usuarios en Firestore');
            return;
        }

        usersSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`👤 ${doc.id}`);
            console.log(`   Email: ${data.email || 'N/A'}`);
            console.log(`   Tipo: ${data.tipoUsuario || 'N/A'}`);
            console.log(`   Dark Mode: ${data.hasDarkVersion ? '✅' : '❌'}`);
            console.log(`   Categoría: ${data.categoria || 'N/A'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error listando usuarios:', error);
    }
}

/**
 * Función principal
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
🧪 Script de Prueba - Actualización de Usuario a Black

Uso:
  node test-payment-upgrade.js <userId>     - Actualizar usuario específico
  node test-payment-upgrade.js --list       - Listar usuarios

Ejemplos:
  node test-payment-upgrade.js abc123xyz
  node test-payment-upgrade.js --list
    `);
        process.exit(0);
    }

    const command = args[0];

    if (command === '--list') {
        await listUsers();
    } else {
        const userId = command;
        const success = await upgradeUserToBlack(userId);
        process.exit(success ? 0 : 1);
    }
}

// Ejecutar
main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
