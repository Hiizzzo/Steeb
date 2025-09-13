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
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
      
      const tasksRef = collection(db, TASKS_COLLECTION);
      let q = query(tasksRef, orderBy('createdAt', 'desc'));
      
      // Si hay userId, filtrar por usuario
      if (userId) {
        q = query(tasksRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate,
      } as Task));
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
  static async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<Task> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');
      
      const now = Timestamp.now();
      const newTask = {
        ...taskData,
        userId: userId || 'anonymous',
        createdAt: now,
        updatedAt: now,
        dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
      };
      
      const tasksRef = collection(db, TASKS_COLLECTION);
      const docRef = await addDoc(tasksRef, newTask);
      
      return {
        id: docRef.id,
        ...taskData,
        userId: userId || 'anonymous',
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      } as Task;
    }, 'Crear tarea');
  }

  /**
   * Actualizar una tarea existente
   */
  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');
      
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
        dueDate: updates.dueDate ? Timestamp.fromDate(new Date(updates.dueDate)) : undefined,
      };
      
      // Remover campos undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });
      
      await updateDoc(taskRef, updateData);
      
      // Obtener la tarea actualizada
      const updatedTask = await this.getTask(taskId);
      if (!updatedTask) throw new Error('No se pudo obtener la tarea actualizada');
      
      return updatedTask;
    }, 'Actualizar tarea');
  }

  /**
   * Eliminar una tarea
   */
  static async deleteTask(taskId: string): Promise<void> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');
      
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await deleteDoc(taskRef);
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
  static async getTasksForDate(date: string, userId?: string): Promise<Task[]> {
    return handleFirebaseOperation(async () => {
      if (!db) throw new Error('Firestore no está inicializado');
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const tasksRef = collection(db, TASKS_COLLECTION);
      let q = query(
        tasksRef,
        where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
        where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('dueDate', 'asc')
      );
      
      if (userId) {
        q = query(
          tasksRef,
          where('userId', '==', userId),
          where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
          where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
          orderBy('dueDate', 'asc')
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate,
      } as Task));
    }, 'Obtener tareas por fecha');
  }

  /**
   * Escuchar cambios en tiempo real
   */
  static subscribeToTasks(userId: string | undefined, callback: (tasks: Task[]) => void): () => void {
    if (!db) {
      console.error('Firestore no está inicializado');
      return () => {};
    }
    
    const tasksRef = collection(db, TASKS_COLLECTION);
    let q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    if (userId) {
      q = query(tasksRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    }
    
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate,
      } as Task));
      
      callback(tasks);
    }, (error) => {
      console.error('Error al escuchar cambios en tareas:', error);
    });
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