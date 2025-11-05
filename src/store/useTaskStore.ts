// ============================================================================
// TASK STORE - GLOBAL STATE MANAGEMENT
// ============================================================================

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { Task, TaskFilters, TaskStats, SyncStatus } from '@/types';
// Importaciones de API activadas para producción
import { tasksAPI } from '@/api/tasks';
import { FirestoreTaskService } from '@/services/firestoreTaskService';
import { localStorageService } from '@/services/localStorageService';
import { auth } from '@/lib/firebase';

interface TaskStore {
  // ========== STATE ==========
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  lastSync: string | null;
  syncStatus: SyncStatus;
  filters: TaskFilters;
  selectedTaskIds: string[];
  viewMode: 'list' | 'calendar' | 'board';
  
  // Task statistics
  stats: TaskStats;

  // ========== ACTIONS ==========
  
  // Task CRUD operations
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Bulk operations
  bulkUpdateTasks: (updates: Array<{ id: string; updates: Partial<Task> }>) => Promise<void>;
  bulkDeleteTasks: (ids: string[]) => Promise<void>;
  
  // Task status operations
  toggleTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  
  // Subtask operations
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  updateSubtask: (taskId: string, subtaskId: string, updates: { title?: string; completed?: boolean }) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  
  // Data loading
  loadTasks: () => Promise<void>;
  loadTasksInRange: (startDate: string, endDate: string) => Promise<void>;
  loadTasksForDate: (date: string) => Promise<void>;
  
  // Real-time updates
  setupRealtimeListener: (userId?: string) => () => void;
  
  // Filtering and search
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  searchTasks: (query: string) => Promise<void>;
  
  // Selection
  selectTask: (id: string) => void;
  deselectTask: (id: string) => void;
  selectAllTasks: () => void;
  clearSelection: () => void;
  toggleTaskSelection: (id: string) => void;
  
  // View management
  setViewMode: (mode: 'list' | 'calendar' | 'board') => void;
  
  // Statistics
  calculateStats: () => void;
  
  // Sync operations
  syncWithServer: () => Promise<void>;
  setSyncStatus: (status: Partial<SyncStatus>) => void;
  
  // Local storage operations
  loadTasksFromLocal: () => void;
  exportTasksAsText: () => void;
  getTasksAsText: () => string;
  clearLocalStorage: () => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Loading state
  setLoading: (loading: boolean) => void;
}

const initialFilters: TaskFilters = {
  type: undefined,
  priority: undefined,
  status: undefined,
  completed: undefined,
  dateRange: undefined,
  tags: undefined,
  search: undefined,
};

const initialSyncStatus: SyncStatus = {
  isOnline: navigator.onLine,
  lastSync: null,
  pendingChanges: 0,
  syncInProgress: false,
  hasError: false,
};

const initialStats: TaskStats = {
  totalTasks: 0,
  completedTasks: 0,
  completionRate: 0,
  currentStreak: 0,
  maxStreak: 0,
  activeDays: 0,
  averageTasksPerDay: 0,
  averageCompletionTime: 0,
  mostProductiveHour: 9,
  mostProductiveDay: 'Monday',
};

// ========== RECURRENCE HELPERS ==========
const toDateOnly = (d: Date) => d.toISOString().split('T')[0];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Ajustar si el mes resultante no tiene el mismo día
  if (d.getDate() < day) {
    d.setDate(0); // último día del mes anterior
  }
  return d;
}

function computeNextOccurrenceDate(currentDateStr: string | undefined, rule: import('@/types').RecurrenceRule | undefined): string | null {
  if (!rule || rule.frequency === 'none') return null;
  const interval = Math.max(1, rule.interval || 1);
  const base = currentDateStr ? new Date(currentDateStr) : new Date();

  let next: Date | null = null;

  if (rule.frequency === 'daily') {
    next = addDays(base, interval);
  } else if (rule.frequency === 'weekly') {
    const days = (rule.daysOfWeek && rule.daysOfWeek.length > 0) ? rule.daysOfWeek.slice().sort() : undefined;
    const baseDow = base.getDay(); // 0-6 (Sun-Sat)
    if (!days) {
      // Sin días específicos: saltar semanas completas
      next = addDays(base, 7 * interval);
    } else {
      // Encontrar el siguiente día de la semana definido
      let delta = 1;
      while (delta <= 7 * interval + 7) { // límite de búsqueda razonable
        const candidate = addDays(base, delta);
        const dow = candidate.getDay();
        const weeksDiff = Math.floor(delta / 7);
        if (days.includes(dow)) {
          // Asegurar intervalo por semanas: si estamos en la misma semana, weeksDiff puede ser 0; ajustamos a intervalo
          if (weeksDiff === 0 && baseDow < dow) {
            // mismo ciclo, día siguiente dentro de la semana actual
            next = candidate;
            break;
          }
          if (weeksDiff % interval === 0) {
            next = candidate;
            break;
          }
        }
        delta++;
      }
      // Si no encontramos con la regla exacta, como fallback sumar (interval) semanas al primer día seleccionado
      if (!next) {
        const first = days[0];
        const candidate = addDays(base, (7 * interval) + ((first - baseDow + 7) % 7 || 7));
        next = candidate;
      }
    }
  } else if (rule.frequency === 'monthly') {
    next = addMonths(base, interval);
  }

  if (!next) return null;

  const nextStr = toDateOnly(next);
  if (rule.endDate && nextStr > rule.endDate) return null;
  return nextStr;
}

export const useTaskStore = create<TaskStore>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // ========== INITIAL STATE ==========
        tasks: [],
        isLoading: false,
        error: null,
        lastSync: null,
        syncStatus: initialSyncStatus,
        filters: initialFilters,
        selectedTaskIds: [],
        viewMode: 'list',
        stats: initialStats,

        // ========== TASK CRUD OPERATIONS ==========
        
        setTasks: (tasks) => {
          set({ tasks });
          get().calculateStats();
        },

        addTask: async (taskData) => {
          // Validar que el título no esté vacío
          if (!taskData.title || !taskData.title.trim()) {
            console.warn('🚫 Intento de crear tarea con título vacío bloqueado en el store');
            set({ error: 'El título de la tarea no puede estar vacío' });
            return;
          }

          // Crear tarea localmente de forma inmediata (UI optimista)
          const userId = auth.currentUser?.uid;
          const newTask: Task = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: taskData.title.trim(),
            type: taskData.type || 'extra',
            completed: taskData.completed ?? false,
            status: taskData.status || 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...(userId && { userId }), // Agregar userId si está disponible
            // Solo incluir campos opcionales si tienen valores válidos
            ...(taskData.description && { description: taskData.description }),
            ...(taskData.subgroup && { subgroup: taskData.subgroup }),
            ...(taskData.priority && { priority: taskData.priority }),
            ...(taskData.scheduledDate && { scheduledDate: taskData.scheduledDate }),
            ...(taskData.scheduledTime && { scheduledTime: taskData.scheduledTime }),
            ...(taskData.notes && { notes: taskData.notes }),
            ...(taskData.tags && taskData.tags.length > 0 && { tags: taskData.tags }),
            ...(taskData.estimatedDuration && { estimatedDuration: taskData.estimatedDuration }),
            ...(taskData.recurrence && { recurrence: taskData.recurrence }),
            ...(taskData.subtasks && { subtasks: taskData.subtasks }),
          };
          
          console.log('⚡ Creando tarea instantáneamente:', taskData.title.trim());
          console.log('📊 Datos completos de la tarea:', {
            title: taskData.title,
            type: taskData.type,
            scheduledDate: taskData.scheduledDate,
            recurrence: taskData.recurrence,
            hasRecurrence: !!(taskData.recurrence && taskData.recurrence.frequency !== 'none'),
            hasScheduledDate: !!taskData.scheduledDate
          });
          
          // 1. ACTUALIZAR UI INMEDIATAMENTE (sin esperar Firebase)
          set(state => {
            const updatedTasks = [...state.tasks, newTask];
            console.log('📝 Tarea agregada al estado. Total de tareas:', updatedTasks.length);
            console.log('🔍 Nueva tarea creada:', {
              id: newTask.id,
              title: newTask.title,
              scheduledDate: newTask.scheduledDate,
              type: newTask.type
            });
            return {
              tasks: updatedTasks,
              error: null
            };
          });
          
          // 2. Si la tarea tiene recurrencia y fecha programada, generar instancias para el mes completo
          if (taskData.recurrence && taskData.recurrence.frequency !== 'none' && taskData.scheduledDate) {
            console.log('🔄 Generando instancias recurrentes para el mes completo:', taskData.title.trim());
            
            // Importar la función de generación de instancias mensuales
            const { generateMonthlyRecurrenceInstances } = await import('@/utils/recurrenceManager');
            const monthlyDates = generateMonthlyRecurrenceInstances(taskData.scheduledDate, taskData.recurrence);
            
            // Crear tareas para cada fecha del mes
            const monthlyTasks: Task[] = [];
            for (const date of monthlyDates) {
              // Verificar si ya existe una tarea para esa fecha
              const existingTask = get().tasks.find(t => 
                t.title === taskData.title.trim() &&
                t.type === taskData.type &&
                t.scheduledDate === date
              );
              
              if (!existingTask) {
                const monthlyTask: Task = {
                  ...newTask,
                  id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  scheduledDate: date,
                  subtasks: taskData.subtasks?.map(st => ({ 
                    ...st, 
                    completed: false,
                    id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                  })) || undefined,
                };
                monthlyTasks.push(monthlyTask);
              }
            }
            
            if (monthlyTasks.length > 0) {
              console.log(`📅 Creando ${monthlyTasks.length} instancias adicionales para el mes`);
              set(state => ({
                tasks: [...state.tasks, ...monthlyTasks],
              }));
              
              // Guardar las tareas adicionales en Firebase
              const userId = auth.currentUser?.uid;
              for (const monthlyTask of monthlyTasks) {
                FirestoreTaskService.createTask(monthlyTask, userId)
                  .then(() => {
                    console.log('✅ Instancia mensual sincronizada:', monthlyTask.scheduledDate);
                  })
                  .catch((error) => {
                    console.error('❌ Error al sincronizar instancia mensual:', error);
                  });
              }
            }
          }
          
          get().calculateStats();
          
          // 3. GUARDAR LOCALMENTE EN TEXTO (instantáneo)
          const currentTasks = get().tasks;
          localStorageService.saveTasks(currentTasks);
          console.log('💾 Tarea guardada localmente en texto');
          
          // 4. SINCRONIZAR CON FIREBASE EN SEGUNDO PLANO
          if (userId) {
            FirestoreTaskService.createTask(newTask, userId)
            .then(() => {
              console.log('✅ Tarea sincronizada con Firebase:', newTask.title);
            })
            .catch((error) => {
              console.error('❌ Error al sincronizar con Firebase:', error);
              // En caso de error, mantener la tarea local pero marcar el error
              set(state => ({ 
                ...state,
                error: 'Tarea creada localmente. Error de sincronización: ' + (error instanceof Error ? error.message : 'Error desconocido')
              }));
            });
          }
        },

        updateTask: async (id, updates) => {
          const previousTask = get().tasks.find(task => task.id === id);
          if (!previousTask) {
            console.error('❌ Tarea no encontrada para updateTask:', id);
            throw new Error('Tarea no encontrada');
          }

          console.log('📝 Actualizando tarea:', id, 'Updates:', Object.keys(updates));

          // Validar que haya cambios reales
          const hasRealChanges = Object.keys(updates).some(key => {
            const prevValue = previousTask[key as keyof Task];
            const newValue = updates[key as keyof Task];
            return prevValue !== newValue;
          });

          if (!hasRealChanges) {
            console.log('ℹ️ No hay cambios reales para actualizar');
            return;
          }

          try {
            // 1. ACTUALIZACIÓN OPTIMISTA LOCAL INMEDIATA
            const updatedTask = {
              ...previousTask,
              ...updates,
              updatedAt: new Date().toISOString()
            };

            set(state => ({
              tasks: state.tasks.map(task => task.id === id ? updatedTask : task),
              error: null
            }));

            get().calculateStats();
            console.log('✅ Estado local actualizado optimistamente');

            // 2. SINCRONIZACIÓN CON FIRESTORE (si hay usuario)
            const userId = auth.currentUser?.uid;
            if (userId) {
              try {
                // Filtrar campos que no deben enviarse a Firestore
                const { id: _omitId, createdAt: _omitCreatedAt, updatedAt: _omitUpdatedAt, userId: _omitUserId, ...firestoreUpdates } = (updates || {}) as any;

                await FirestoreTaskService.updateTask(id, firestoreUpdates);
                console.log('✅ Sincronización con Firestore exitosa');

                // Verificar si se marcó como completada y tiene recurrencia
                if (updates.completed === true && previousTask.recurrence && previousTask.scheduledDate) {
                  console.log('🔄 Tarea recurrente completada, generando siguiente ocurrencia:', previousTask.title);

                  const baseDate = updates.completedDate ? updates.completedDate.split('T')[0] : previousTask.scheduledDate;
                  const nextDate = computeNextOccurrenceDate(baseDate, previousTask.recurrence);

                  if (nextDate) {
                    console.log('📅 Creando siguiente ocurrencia para:', nextDate);

                    const existingTask = get().tasks.find(t =>
                      t.title === previousTask.title &&
                      t.type === previousTask.type &&
                      t.scheduledDate === nextDate &&
                      !t.completed
                    );

                    if (!existingTask) {
                      const resetSubtasks = previousTask.subtasks?.map(st => ({
                        ...st,
                        completed: false,
                        id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                      })) || undefined;

                      await get().addTask({
                        title: previousTask.title,
                        type: previousTask.type,
                        subgroup: previousTask.subgroup,
                        status: 'pending',
                        completed: false,
                        scheduledDate: nextDate,
                        scheduledTime: previousTask.scheduledTime,
                        notes: previousTask.notes,
                        tags: previousTask.tags,
                        subtasks: resetSubtasks,
                        recurrence: previousTask.recurrence,
                        priority: previousTask.priority,
                        estimatedDuration: previousTask.estimatedDuration,
                      } as any);

                      console.log('✨ Nueva ocurrencia creada para:', nextDate);
                    } else {
                      console.log('ℹ️ Ya existe una tarea para la fecha:', nextDate);
                    }
                  }
                }

              } catch (firestoreError) {
                console.warn('⚠️ Error sincronizando con Firestore (cambio local mantenido):', firestoreError.message);
                // No revertimos cambios locales, el usuario quiere que la tarea se actualice
              }
            } else {
              console.log('📱 Modo offline - Cambio guardado localmente');
            }

          } catch (error) {
            console.error('❌ Error crítico en updateTask:', error);
            set({
              error: error instanceof Error ? error.message : 'Error al actualizar la tarea'
            });
            throw error;
          }
        },

        deleteTask: async (id) => {
          const taskToDelete = get().tasks.find(task => task.id === id);
          if (!taskToDelete) {
            console.warn('Task not found when trying to delete:', id);
            return;
          }

          console.log('Deleting task (optimistic):', taskToDelete.title);

          set(state => ({
            tasks: state.tasks.filter(task => task.id !== id),
            selectedTaskIds: state.selectedTaskIds.filter(taskId => taskId !== id),
            error: null
          }));

          get().calculateStats();

          try {
            const snapshot = get().tasks;
            localStorageService.saveTasks(snapshot);
          } catch (storageError) {
            console.warn('Could not persist tasks locally after delete:', storageError);
          }

          const userId = auth.currentUser?.uid;

          try {
            await FirestoreTaskService.deleteTask(id, userId);
            console.log('Task deleted from Firestore');
          } catch (error) {
            console.error('Error deleting task from Firestore:', error);
            set(state => ({
              error: error instanceof Error ? error.message : 'Error al eliminar la tarea',
              syncStatus: {
                ...state.syncStatus,
                hasError: true,
                pendingChanges: (state.syncStatus?.pendingChanges ?? 0) + 1
              }
            }));
          }
        },

        // ========== BULK OPERATIONS ==========

        bulkUpdateTasks: async (updates) => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('📝 Actualizando tareas en lote offline:', updates.length);
            
            // En modo offline, solo aplicamos las actualizaciones localmente
            set(state => ({
              tasks: state.tasks.map(task => {
                const update = updates.find(u => u.id === task.id);
                return update ? { ...task, ...update.updates, updatedAt: new Date().toISOString() } : task;
              }),
              syncStatus: 'offline'
            }));
            
            console.log('✅ Tareas actualizadas en lote offline exitosamente');
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update tasks',
              syncStatus: 'error'
            });
          } finally {
            set({ isLoading: false });
            get().calculateStats();
          }
        },

        bulkDeleteTasks: async (ids) => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('🗑️ Eliminando tareas en lote offline:', ids.length);
            
            // En modo offline, solo eliminamos localmente
            set(state => ({
              tasks: state.tasks.filter(task => !ids.includes(task.id)),
              selectedTaskIds: state.selectedTaskIds.filter(id => !ids.includes(id)),
              syncStatus: 'offline'
            }));
            
            console.log('✅ Tareas eliminadas en lote offline exitosamente');
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete tasks',
              syncStatus: 'error'
            });
          } finally {
            set({ isLoading: false });
            get().calculateStats();
          }
        },

        // ========== TASK STATUS OPERATIONS ==========

        toggleTask: async (id) => {
          const currentTask = get().tasks.find(t => t.id === id);
          if (!currentTask) {
            console.error('❌ Tarea no encontrada para toggle:', id);
            throw new Error('Tarea no encontrada');
          }

          const willComplete = !currentTask.completed;
          const previousState = { ...currentTask };

          try {
            console.log('🔄 Toggle task:', currentTask.title, `${previousState.completed} → ${willComplete}`);

            // Actualización optimista local inmediata
            set(state => ({
              tasks: state.tasks.map(t =>
                t.id === id
                  ? {
                      ...t,
                      completed: willComplete,
                      status: willComplete ? 'completed' : 'pending',
                      completedDate: willComplete ? new Date().toISOString() : t.completedDate,
                      updatedAt: new Date().toISOString()
                    }
                  : t
              )
            }));

            get().calculateStats();
            console.log('✅ Estado local actualizado:', currentTask.title, '→', willComplete);

            // Sincronización con Firestore si hay usuario
            const userId = auth.currentUser?.uid;
            if (userId) {
              try {
                await FirestoreTaskService.updateTask(id, {
                  completed: willComplete,
                  status: willComplete ? 'completed' : 'pending',
                  completedDate: willComplete ? new Date().toISOString() : undefined,
                });
                console.log('✅ Sincronización exitosa con Firestore');
              } catch (firestoreError) {
                console.warn('⚠️ Error de sincronización (cambio local mantenido):', firestoreError.message);
                // El cambio local se mantiene aunque falle Firestore
              }
            } else {
              console.log('📱 Modo offline - Cambio guardado localmente');
            }

          } catch (error) {
            // Revertir estado local si algo falla gravemente
            console.error('❌ Error crítico en toggleTask - Revirtiendo estado:', error);
            set(state => ({
              tasks: state.tasks.map(t =>
                t.id === id ? previousState : t
              )
            }));
            get().calculateStats();
            throw error; // Re-lanzar para que el componente maneje el error
          }
        },

        completeTask: async (id) => {
          const task = get().tasks.find(t => t.id === id);
          if (!task) return;
          await get().updateTask(id, {
            completed: true,
            status: 'completed',
            completedDate: new Date().toISOString(),
          });
          // La lógica de recurrencia se maneja automáticamente en updateTask
        },

        // ========== SUBTASK OPERATIONS ==========

        toggleSubtask: async (taskId, subtaskId) => {
          const task = get().tasks.find(t => t.id === taskId);
          if (!task || !task.subtasks) return;
          
          const updatedSubtasks = task.subtasks.map(subtask =>
            subtask.id === subtaskId 
              ? { ...subtask, completed: !subtask.completed }
              : subtask
          );
          
          // Check if all subtasks are completed
          const allCompleted = updatedSubtasks.every(subtask => subtask.completed);
          
          get().updateTask(taskId, {
            subtasks: updatedSubtasks,
            completed: allCompleted,
            status: allCompleted ? 'completed' : task.status,
            completedDate: allCompleted ? new Date().toISOString() : task.completedDate,
          });
        },

        addSubtask: async (taskId, title) => {
          const task = get().tasks.find(t => t.id === taskId);
          if (!task) return;
          
          const newSubtask = {
            id: `subtask-${Date.now()}`,
            title,
            completed: false,
            createdAt: new Date().toISOString(),
          };
          
          const updatedSubtasks = [...(task.subtasks || []), newSubtask];
          
          get().updateTask(taskId, {
            subtasks: updatedSubtasks,
          });
        },

        updateSubtask: async (taskId, subtaskId, updates) => {
          const task = get().tasks.find(t => t.id === taskId);
          if (!task || !task.subtasks) return;
          
          const updatedSubtasks = task.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
          );
          
          get().updateTask(taskId, {
            subtasks: updatedSubtasks,
          });
        },

        deleteSubtask: async (taskId, subtaskId) => {
          const task = get().tasks.find(t => t.id === taskId);
          if (!task || !task.subtasks) return;
          
          const updatedSubtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId);
          
          get().updateTask(taskId, {
            subtasks: updatedSubtasks,
          });
        },

        // ========== DATA LOADING ==========

        loadTasks: async () => {
          try {
            set({ isLoading: true, error: null, syncStatus: 'syncing' });

            // Obtener userId del usuario autenticado
            const userId = auth.currentUser?.uid;

            console.log('📥 Intentando cargar tareas desde Firestore', userId ? `(userId=${userId})` : '(sin userId)');

            if (!userId) {
              console.log('📱 Modo offline - Cargando tareas desde almacenamiento local');
              get().loadTasksFromLocal();
              set({
                isLoading: false,
                syncStatus: 'offline',
                error: null
              });
              return;
            }

            try {
              // Cargar desde Firestore solo las tareas del usuario
              const tasks = await FirestoreTaskService.getTasks(userId);

              set({
                tasks: tasks || [],
                isLoading: false,
                lastSync: new Date().toISOString(),
                syncStatus: 'synced',
                error: null
              });

              get().calculateStats();
              console.log('✅ Tareas cargadas exitosamente desde Firestore:', tasks?.length || 0);
            } catch (firestoreError) {
              console.warn('⚠️ Error con Firestore, usando almacenamiento local:', firestoreError);
              get().loadTasksFromLocal();
              set({
                isLoading: false,
                syncStatus: 'offline',
                error: null
              });
            }
          } catch (error) {
            console.error('❌ Error general cargando tareas:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error al cargar las tareas',
              syncStatus: 'error'
            });
          }
        },

        // Nueva función para configurar listeners en tiempo real con Firestore
        setupRealtimeListener: (userId?: string) => {
          if (!userId) {
            console.log('📱 Modo offline - Sin listener en tiempo real');
            return () => {};
          }

          console.log('🔄 Intentando configurar listener con Firestore (userId=${userId})');

          try {
            const unsubscribe = FirestoreTaskService.subscribeToTasks(userId, (tasks) => {
              console.log('📡 Tareas actualizadas en tiempo real:', tasks.length);
              set({ tasks });
              get().calculateStats();
            });

            console.log('✅ Listener en tiempo real configurado');
            return unsubscribe;
          } catch (error) {
            console.warn('⚠️ Error configurando listener, usando modo offline:', error);
            return () => {};
          }
        },

        loadTasksInRange: async (startDate, endDate) => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('📅 Filtrando tareas offline por rango de fechas:', startDate, 'a', endDate);
            
            // En modo offline, filtramos las tareas existentes por el rango de fechas
            const allTasks = get().tasks || [];
            const filteredTasks = allTasks.filter(task => {
              if (!task.scheduledFor) return false;
              const taskDate = task.scheduledFor.split('T')[0]; // Obtener solo la fecha
              return taskDate >= startDate && taskDate <= endDate;
            });
            
            set({ tasks: filteredTasks });
            console.log('✅ Tareas filtradas offline:', filteredTasks.length);
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to load tasks' });
          } finally {
            set({ isLoading: false });
            get().calculateStats();
          }
        },

        loadTasksForDate: async (date) => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('📅 Filtrando tareas offline para fecha:', date);
            
            // En modo offline, filtramos las tareas existentes por la fecha específica
            const allTasks = get().tasks || [];
            const filteredTasks = allTasks.filter(task => {
              if (!task.scheduledFor) return false;
              const taskDate = task.scheduledFor.split('T')[0]; // Obtener solo la fecha
              return taskDate === date;
            });
            
            set({ tasks: filteredTasks });
            console.log('✅ Tareas filtradas offline para fecha:', filteredTasks.length);
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to load tasks' });
          } finally {
            set({ isLoading: false });
            get().calculateStats();
          }
        },

        // ========== FILTERING AND SEARCH ==========

        setFilters: (newFilters) => {
          set(state => ({
            filters: { ...state.filters, ...newFilters }
          }));
          // Reload tasks with new filters
          get().loadTasks();
        },

        clearFilters: () => {
          set({ filters: initialFilters });
          get().loadTasks();
        },

        searchTasks: async (query) => {
          set({ isLoading: true, error: null });
          
          try {
            console.log('🔍 Buscando tareas offline:', query);
            
            // En modo offline, buscamos en las tareas locales
            const allTasks = get().tasks || [];
            const searchResults = allTasks.filter(task => 
              task.title.toLowerCase().includes(query.toLowerCase()) ||
              (task.description && task.description.toLowerCase().includes(query.toLowerCase()))
            );
            
            set({ 
              tasks: searchResults,
              filters: { ...get().filters, search: query }
            });
            
            console.log('✅ Búsqueda offline completada:', searchResults.length, 'resultados');
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to search tasks' });
          } finally {
            set({ isLoading: false });
          }
        },

        // ========== SELECTION ==========

        selectTask: (id) => {
          set(state => ({
            selectedTaskIds: [...state.selectedTaskIds, id]
          }));
        },

        deselectTask: (id) => {
          set(state => ({
            selectedTaskIds: state.selectedTaskIds.filter(taskId => taskId !== id)
          }));
        },

        selectAllTasks: () => {
          set(state => ({
            selectedTaskIds: state.tasks.map(task => task.id)
          }));
        },

        clearSelection: () => {
          set({ selectedTaskIds: [] });
        },

        toggleTaskSelection: (id) => {
          const isSelected = get().selectedTaskIds.includes(id);
          if (isSelected) {
            get().deselectTask(id);
          } else {
            get().selectTask(id);
          }
        },

        // ========== VIEW MANAGEMENT ==========

        setViewMode: (mode) => {
          set({ viewMode: mode });
        },

        // ========== STATISTICS ==========

        calculateStats: () => {
          const { tasks } = get();
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter(task => task.completed).length;
          const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
          
          // Calculate streak
          let currentStreak = 0;
          let maxStreak = 0;
          let tempStreak = 0;
          
          const completedDates = tasks
            .filter(task => task.completed && task.completedDate)
            .map(task => task.completedDate!.split('T')[0])
            .sort();
          
          // Calculate current streak (from today backwards)
          let checkDate = new Date(now);
          while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (completedDates.includes(dateStr)) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
          
          // Calculate max streak
          for (let i = 0; i < completedDates.length; i++) {
            if (i === 0) {
              tempStreak = 1;
            } else {
              const prevDate = new Date(completedDates[i - 1]);
              const currentDate = new Date(completedDates[i]);
              const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                tempStreak++;
              } else {
                maxStreak = Math.max(maxStreak, tempStreak);
                tempStreak = 1;
              }
            }
          }
          maxStreak = Math.max(maxStreak, tempStreak);
          
          const activeDays = new Set(completedDates).size;
          const averageTasksPerDay = activeDays > 0 ? totalTasks / activeDays : 0;
          
          // Calculate average completion time
          const tasksWithDuration = tasks.filter(task => task.actualDuration && task.actualDuration > 0);
          const averageCompletionTime = tasksWithDuration.length > 0
            ? tasksWithDuration.reduce((sum, task) => sum + (task.actualDuration || 0), 0) / tasksWithDuration.length
            : 0;
          
          set({
            stats: {
              totalTasks,
              completedTasks,
              completionRate,
              currentStreak,
              maxStreak,
              activeDays,
              averageTasksPerDay,
              averageCompletionTime,
              mostProductiveHour: 9, // TODO: Calculate from actual data
              mostProductiveDay: 'Monday', // TODO: Calculate from actual data
            }
          });
        },

        // ========== SYNC OPERATIONS ==========

        syncWithServer: async () => {
          try {
            set({ syncStatus: { ...get().syncStatus, syncInProgress: true } });
            console.log('🔄 Sincronizando con Firestore...');
            
            // Recargar tareas desde Firestore
            await get().loadTasks();
            
            set({ 
              syncStatus: { 
                ...get().syncStatus, 
                syncInProgress: false, 
                lastSync: new Date().toISOString() 
              } 
            });
            
            console.log('✅ Sincronización con Firestore completada');
          } catch (error) {
            console.error('❌ Error en sincronización:', error);
            set({ 
              syncStatus: { 
                ...get().syncStatus, 
                syncInProgress: false, 
                hasError: true 
              } 
            });
          }
        },

        setSyncStatus: (status) => {
          set(state => ({
            syncStatus: { ...state.syncStatus, ...status }
          }));
        },

        // ========== ERROR HANDLING ==========

        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        // ========== LOADING STATE ==========

        setLoading: (loading) => {
          set({ isLoading: loading });
        },

        // ========== LOCAL STORAGE OPERATIONS ==========

        loadTasksFromLocal: () => {
          try {
            const localTasks = localStorageService.loadTasks();
            if (localTasks.length > 0) {
              set({ tasks: localTasks });
              get().calculateStats();
              console.log('📂 Tareas cargadas desde almacenamiento local:', localTasks.length);
            }
          } catch (error) {
            console.error('❌ Error al cargar tareas locales:', error);
          }
        },

        exportTasksAsText: () => {
          try {
            localStorageService.exportTasks();
            console.log('📄 Tareas exportadas como archivo de texto');
          } catch (error) {
            console.error('❌ Error al exportar tareas:', error);
          }
        },

        getTasksAsText: () => {
          try {
            return localStorageService.getTasksAsText();
          } catch (error) {
            console.error('❌ Error al obtener tareas como texto:', error);
            return 'Error al obtener las tareas';
          }
        },

        clearLocalStorage: () => {
          try {
            localStorageService.clearLocalStorage();
            console.log('🗑️ Almacenamiento local limpiado');
          } catch (error) {
            console.error('❌ Error al limpiar almacenamiento local:', error);
          }
        },
      })),
      {
        name: 'task-store',
        partialize: (state) => ({
          tasks: state.tasks,
          filters: state.filters,
          viewMode: state.viewMode,
          lastSync: state.lastSync,
        }),
      }
    ),
    {
      name: 'task-store',
    }
  )
);

// ========== SELECTORS ==========

export const useTaskSelectors = () => {
  const store = useTaskStore();
  
  return {
    // Filter selectors
    getTasksByType: (type: import('@/types').TaskType) =>
      store.tasks.filter(task => task.type === type),
    
    getTasksByStatus: (status: 'pending' | 'in_progress' | 'completed' | 'cancelled') =>
      store.tasks.filter(task => task.status === status),
    
    getCompletedTasks: () =>
      store.tasks.filter(task => task.completed),
    
    getPendingTasks: () =>
      store.tasks.filter(task => !task.completed),
    
    getOverdueTasks: () => {
      const today = new Date().toISOString().split('T')[0];
      return store.tasks.filter(task => 
        task.scheduledDate && 
        task.scheduledDate < today && 
        !task.completed
      );
    },
    
    getTasksForDate: (date: string) =>
      store.tasks.filter(task => task.scheduledDate === date),
    
    getTasksInRange: (startDate: string, endDate: string) =>
      store.tasks.filter(task => 
        task.scheduledDate && 
        task.scheduledDate >= startDate && 
        task.scheduledDate <= endDate
      ),
    
    getSelectedTasks: () =>
      store.tasks.filter(task => store.selectedTaskIds.includes(task.id)),
    
    // Search selector
    searchTasks: (query: string) =>
      store.tasks.filter(task =>
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.notes?.toLowerCase().includes(query.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      ),
  };
};

// ========== AUTO-SYNC SETUP ==========

// Monitor online status
window.addEventListener('online', () => {
  useTaskStore.getState().setSyncStatus({ isOnline: true });
  useTaskStore.getState().syncWithServer();
});

window.addEventListener('offline', () => {
  useTaskStore.getState().setSyncStatus({ isOnline: false });
});

// Auto-sync every 5 minutes when online
setInterval(() => {
  const { syncStatus, syncWithServer } = useTaskStore.getState();
  if (syncStatus.isOnline && !syncStatus.syncInProgress) {
    syncWithServer();
  }
}, 5 * 60 * 1000);