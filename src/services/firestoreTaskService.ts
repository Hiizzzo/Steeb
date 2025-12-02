// @ts-nocheck
// ============================================================================
// FIRESTORE TASK SERVICE - DIRECT FIREBASE CONNECTION
// ============================================================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Task } from '@/types';
import { handleFirebaseOperation } from '@/lib/firebaseErrorHandler';

const TASKS_COLLECTION = 'tasks';

export class FirestoreTaskService {

  /**
   * Obtener todas las tareas del usuario
   */
  static async getTasks(userId?: string): Promise<Task[]> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');

      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Necesitás iniciar sesión');

      const tasksRef = collection(db, TASKS_COLLECTION);
      const q = query(tasksRef, where('ownerUid', '==', uid), orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate,
      } as Task));

      return items;
    }, 'Obtener tareas');
  }

  /**
   * Obtener una tarea específica por ID
   */
  static async getTask(taskId: string): Promise<Task | null> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');

      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      const snapshot = await getDoc(taskRef);

      if (!snapshot.exists()) return null;

      const data = snapshot.data();
      return {
        id: snapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        dueDate: data.dueDate?.toDate?.()?.toISOString() || data.dueDate,
      } as Task;
    }, 'Obtener tarea');
  }

  /**
   * Crear una nueva tarea
   */
  static async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');

      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Necesitás iniciar sesión');

      const newTask = {
        ...taskData,
        ownerUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
      };

      const tasksRef = collection(db, TASKS_COLLECTION);
      const docRef = await addDoc(tasksRef, newTask);

      return {
        id: docRef.id,
        ...taskData,
        ownerUid: uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Task;
    }, 'Crear tarea');
  }

  /**
   * Actualizar una tarea existente
   */
  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');

      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Necesitás iniciar sesión');

      const taskRef = doc(db, TASKS_COLLECTION, taskId);

      // Remover ownerUid si viene en los updates para no modificarlo
      const { ownerUid, ...safeUpdates } = updates;

      const updateData = {
        ...safeUpdates,
        updatedAt: serverTimestamp(),
        dueDate: safeUpdates.dueDate ? Timestamp.fromDate(new Date(safeUpdates.dueDate)) : undefined,
      };

      // Remover campos undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      try {
        await updateDoc(taskRef, updateData);

        // Obtener la tarea actualizada
        const updatedTask = await this.getTask(taskId);
        if (!updatedTask) throw new Error('No se pudo obtener la tarea actualizada');

        return updatedTask;
      } catch (error: any) {
        // Manejar errores de red específicos sin interrumpir la UI
        if (error?.message?.includes('ERR_ABORTED') ||
          error?.message?.includes('net::ERR_') ||
          error?.code === 'cancelled') {
          console.warn('⚠️ Operación cancelada o error de red, continuando...', error.message);
          // Retornar una tarea simulada para no interrumpir la UI
          return {
            id: taskId,
            ...safeUpdates,
            updatedAt: new Date().toISOString()
          } as Task;
        }
        throw error;
      }
    }, 'Actualizar tarea');
  }

  /**
   * Eliminar una tarea
   */
  static async deleteTask(taskId: string): Promise<void> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');

      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Necesitás iniciar sesión');

      const taskRef = doc(db, TASKS_COLLECTION, taskId);

      try {
        // Verificar que la tarea pertenece al usuario antes de eliminar
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
          // Si la tarea no existe en Firestore, consideramos que ya fue eliminada
          console.warn('⚠️ Tarea no encontrada en Firestore (ya eliminada o local):', taskId);
          return;
        }

        const taskData = taskDoc.data();
        if (taskData.ownerUid !== uid) {
          throw new Error('No tienes permisos para eliminar esta tarea');
        }

        await deleteDoc(taskRef);
      } catch (error: any) {
        // Si es un error de permisos y el ID parece local (empieza con task_), 
        // asumimos que no existe en el servidor y permitimos la eliminación local
        if (error?.code === 'permission-denied' && taskId.startsWith('task_')) {
          console.warn('⚠️ Permiso denegado en tarea local, asumiendo no sincronizada:', taskId);
          return;
        }
        throw error;
      }
    }, 'Eliminar tarea');
  }

  /**
   * Marcar/desmarcar tarea como completada
   */
  static async toggleTask(taskId: string): Promise<Task> {
    return handleFirebaseOperation(async () => {
      const task = await this.getTask(taskId);
      if (!task) throw new Error('Tarea no encontrada');

      const updates: Partial<Task> = {
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null,
      };

      return await this.updateTask(taskId, updates);
    }, 'Alternar estado de tarea');
  }

  /**
   * Obtener tareas por fecha
   */
  static async getTasksForDate(date: string): Promise<Task[]> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');

      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Necesitás iniciar sesión');

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const tasksRef = collection(db, TASKS_COLLECTION);
      const q = query(
        tasksRef,
        where('ownerUid', '==', uid),
        where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
        where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('dueDate', 'asc')
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate,
      } as Task));

      return items;
    }, 'Obtener tareas por fecha');
  }

  /**
   * Escuchar cambios en tiempo real
   */
  static subscribeToTasks(userId: string | undefined, callback: (tasks: Task[]) => void): () => void {
    // Validación más robusta para evitar errores críticos
    try {
      if (!db) {
        console.warn('📱 Firestore no está inicializado - Modo offline');
        callback([]);
        return () => { };
      }

      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.warn('📱 Usuario no autenticado - Modo offline');
        callback([]);
        return () => { };
      }

      // Validar que la colección existe antes de hacer la consulta
      const tasksRef = collection(db, TASKS_COLLECTION);
      if (!tasksRef) {
        console.warn('📱 Colección de tareas no disponible - Modo offline');
        callback([]);
        return () => { };
      }

      const q = query(tasksRef, where('ownerUid', '==', uid), orderBy('createdAt', 'desc'));

      let unsubscribe: (() => void) | null = null;

      try {
        unsubscribe = onSnapshot(q,
          (snapshot) => {
            try {
              const tasks = snapshot.docs.map(doc => {
                try {
                  const data = doc.data();
                  return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
                    dueDate: data.dueDate?.toDate?.()?.toISOString() || data.dueDate,
                  } as Task;
                } catch (docError) {
                  console.warn('⚠️ Error procesando documento:', doc.id, docError);
                  return null;
                }
              }).filter(Boolean) as Task[];

              ('📡 Tareas actualizadas en tiempo real:', tasks.length);
              callback(tasks);
            } catch (processingError) {
              console.error('❌ Error procesando snapshot:', processingError);
              callback([]);
            }
          },
          (error) => {
            console.warn('📱 Error en listener de Firebase - Modo offline activado:', error);

            // No mostrar errores críticos en la UI, solo en consola
            if (error?.message?.includes('permission-denied') ||
              error?.code === 'permission-denied') {
              console.warn('📱 Permisos denegados - Modo offline');
            } else if (error?.message?.includes('ERR_ABORTED') ||
              error?.message?.includes('net::ERR_') ||
              error?.code === 'cancelled' ||
              error?.code === 'unavailable') {
              console.warn('📱 Error de conexión - Modo offline temporal');
            } else {
              console.warn('📱 Error desconocido - Activando modo offline:', error);
            }

            // Enviar lista vacía para evitar que la app se bloquee
            callback([]);
          }
        );
      } catch (snapshotError) {
        console.error('❌ Error creando snapshot:', snapshotError);
        callback([]);
        return () => { };
      }

      // Devolver función de unsubscribe segura
      return () => {
        try {
          if (unsubscribe) {
            unsubscribe();
          }
        } catch (unsubError) {
          console.warn('⚠️ Error en unsubscribe:', unsubError);
        }
      };

    } catch (criticalError) {
      console.error('🚨 Error crítico en subscribeToTasks:', criticalError);
      // Enviar lista vacía para evitar que la app se bloquee
      callback([]);
      return () => { };
    }
  }

  /**
   * Operaciones en lote
   */
  static async bulkUpdateTasks(updates: Array<{ id: string; updates: Partial<Task> }>): Promise<void> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');

      const batch = writeBatch(db);

      updates.forEach(({ id, updates: taskUpdates }) => {
        const taskRef = doc(db, TASKS_COLLECTION, id);
        const updateData = {
          ...taskUpdates,
          updatedAt: Timestamp.now(),
        };
        batch.update(taskRef, updateData);
      });

      await batch.commit();
    }, 'Actualización en lote');
  }

  /**
   * Eliminar múltiples tareas
   */
  static async bulkDeleteTasks(taskIds: string[]): Promise<void> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');

      const batch = writeBatch(db);

      taskIds.forEach(id => {
        const taskRef = doc(db, TASKS_COLLECTION, id);
        batch.delete(taskRef);
      });

      await batch.commit();
    }, 'Eliminación en lote');
  }
}

export default FirestoreTaskService;
