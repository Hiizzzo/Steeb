/**
 * ============================================================================
 * BACKFILL UTILITY - ownerUid Migration
 * ============================================================================
 *
 * ⚠️  ADVERTENCIA: Ejecutar UNA SOLA VEZ y luego ELIMINAR este archivo
 *
 * Esta utilidad recorre todas las colecciones del proyecto y agrega el campo
 * ownerUid a los documentos que aún no lo tengan. Esto es necesario para
 * cumplir con las nuevas reglas de seguridad de Firestore.
 *
 * USO:
 * 1. Asegúrate de estar logueado como administrador
 * 2. Ejecuta la función backfillOwnerUid()
 * 3. Espera a que complete todas las colecciones
 * 4. ELIMINA este archivo y el componente AdminBackfillScreen
 *
 * COLECCIONES AFECTADAS:
 * - tasks: Todas las tareas sin ownerUid
 * - statsDaily: Estadísticas diarias (si existe)
 * - streaks: Rachas de productividad (si existe)
 * ============================================================================
 */

import {
  getDocs,
  collection,
  writeBatch,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

/**
 * Colecciones que necesitan backfill de ownerUid
 * Ajusta según las colecciones reales de tu proyecto
 */
const COLLECTIONS_TO_BACKFILL = [
  'tasks',
  // Descomentar si existen estas colecciones
  // 'statsDaily',
  // 'streaks',
  // 'habits',
  // 'productivity',
];

/**
 * Realiza el backfill del campo ownerUid en todos los documentos que no lo tengan
 *
 * @param progressCallback - Callback opcional para reportar progreso
 * @returns Promise con el resumen de la operación
 */
export async function backfillOwnerUid(
  progressCallback?: (collection: string, processed: number, total: number) => void
): Promise<{
  success: boolean;
  message: string;
  results: {
    collection: string;
    totalDocs: number;
    updatedDocs: number;
    skippedDocs: number;
    errors: string[];
  }[];
}> {
  const results = [];

  try {
    // Verificar que hay un usuario autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay usuario autenticado. Inicia sesión primero.');
    }

    console.log('🚀 Iniciando backfill de ownerUid...');
    console.log('📋 Usuario:', currentUser.uid);
    console.log('📚 Colecciones a procesar:', COLLECTIONS_TO_BACKFILL);

    for (const collectionName of COLLECTIONS_TO_BACKFILL) {
      const collectionResult = {
        collection: collectionName,
        totalDocs: 0,
        updatedDocs: 0,
        skippedDocs: 0,
        errors: [] as string[],
      };

      try {
        console.log(`\n📁 Procesando colección: ${collectionName}`);

        // Obtener todos los documentos de la colección
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);

        collectionResult.totalDocs = snapshot.docs.length;
        console.log(`📊 Total documentos en ${collectionName}: ${collectionResult.totalDocs}`);

        if (collectionResult.totalDocs === 0) {
          console.log(`✅ Colección ${collectionName} está vacía, omitiendo...`);
          results.push(collectionResult);
          continue;
        }

        // Filtrar documentos que no tienen ownerUid
        const docsToUpdate = snapshot.docs.filter(doc => {
          const data = doc.data();
          return !data.ownerUid;
        });

        console.log(`🔧 Documentos sin ownerUid en ${collectionName}: ${docsToUpdate.length}`);

        if (docsToUpdate.length === 0) {
          console.log(`✅ Todos los documentos en ${collectionName} ya tienen ownerUid`);
          results.push(collectionResult);
          continue;
        }

        // Procesar en lotes de 500 (límite de Firestore)
        const BATCH_SIZE = 500;
        let processedCount = 0;

        for (let i = 0; i < docsToUpdate.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const batchDocs = docsToUpdate.slice(i, i + BATCH_SIZE);

          // Agregar operaciones al batch
          batchDocs.forEach((docSnapshot) => {
            try {
              batch.update(docSnapshot.ref, {
                ownerUid: currentUser.uid,
                // También agregamos un campo de migración para tracking
                migratedAt: new Date().toISOString(),
                migratedBy: currentUser.uid,
              });
            } catch (error) {
              const errorMsg = `Error preparando batch para doc ${docSnapshot.id}: ${error}`;
              console.error(errorMsg);
              collectionResult.errors.push(errorMsg);
            }
          });

          // Ejecutar el batch
          try {
            await batch.commit();
            processedCount += batchDocs.length;
            collectionResult.updatedDocs += batchDocs.length;

            console.log(`✅ Batch ${Math.floor(i/BATCH_SIZE) + 1} de ${collectionName} completado (${processedCount}/${docsToUpdate.length})`);

            // Reportar progreso
            if (progressCallback) {
              progressCallback(collectionName, processedCount, docsToUpdate.length);
            }
          } catch (error) {
            const errorMsg = `Error ejecutando batch en ${collectionName}: ${error}`;
            console.error(errorMsg);
            collectionResult.errors.push(errorMsg);
          }

          // Pequeña pausa para no sobrecargar Firestore
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        collectionResult.skippedDocs = collectionResult.totalDocs - docsToUpdate.length;
        console.log(`✅ Colección ${collectionName} completada: ${collectionResult.updatedDocs} actualizados, ${collectionResult.skippedDocs} omitidos`);

      } catch (error) {
        const errorMsg = `Error procesando colección ${collectionName}: ${error}`;
        console.error(errorMsg);
        collectionResult.errors.push(errorMsg);
      }

      results.push(collectionResult);
    }

    // Resumen final
    const totalUpdated = results.reduce((sum, r) => sum + r.updatedDocs, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skippedDocs, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    const success = totalErrors === 0;
    const message = success
      ? `✅ Backfill completado exitosamente. ${totalUpdated} documentos actualizados, ${totalSkipped} ya tenían ownerUid.`
      : `⚠️ Backfill completado con ${totalErrors} errores. ${totalUpdated} documentos actualizados, ${totalSkipped} omitidos.`;

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL BACKFILL');
    console.log('='.repeat(60));
    console.log(`📈 Total actualizados: ${totalUpdated}`);
    console.log(`📋 Total omitidos: ${totalSkipped}`);
    console.log(`❌ Total errores: ${totalErrors}`);
    console.log('='.repeat(60));

    return {
      success,
      message,
      results,
    };

  } catch (error) {
    const errorMessage = `Error fatal en backfill: ${error}`;
    console.error(errorMessage);

    return {
      success: false,
      message: errorMessage,
      results: [],
    };
  }
}

/**
 * Verifica el estado actual de las colecciones (cuántos documentos tienen/necesitan ownerUid)
 */
export async function checkBackfillStatus(): Promise<{
  collection: string;
  total: number;
  hasOwnerUid: number;
  needsOwnerUid: number;
}[]> {
  const status = [];

  try {
    for (const collectionName of COLLECTIONS_TO_BACKFILL) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      const total = snapshot.docs.length;
      const hasOwnerUid = snapshot.docs.filter(doc => doc.data().ownerUid).length;
      const needsOwnerUid = total - hasOwnerUid;

      status.push({
        collection: collectionName,
        total,
        hasOwnerUid,
        needsOwnerUid,
      });
    }
  } catch (error) {
    console.error('Error verificando estado del backfill:', error);
  }

  return status;
}

/**
 * Función auxiliar para verificar si el backfill es necesario
 */
export async function isBackfillNeeded(): Promise<boolean> {
  try {
    const status = await checkBackfillStatus();
    return status.some(s => s.needsOwnerUid > 0);
  } catch {
    return false;
  }
}