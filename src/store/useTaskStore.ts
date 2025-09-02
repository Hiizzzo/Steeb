// ============================================================================
// TASK STORE - GLOBAL STATE MANAGEMENT
// ============================================================================

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { Task, TaskFilters, TaskStats, SyncStatus } from '@/types';
// Importaciones de API removidas para modo offline
// import { tasksAPI } from '@/api/tasks';
// import { FirestoreTaskService } from '@/services/firestoreTaskService';
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

          try {
            set({ isLoading: true, error: null });
            
            console.log('📝 Creando nueva tarea offline:', taskData.title.trim());
            
            // Crear tarea offline
            const newTask: Task = {
              id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...taskData,
              title: taskData.title.trim(),
              completed: taskData.completed ?? false,
              status: taskData.status || 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            // Actualizar estado local
            set(state => ({
              tasks: [...state.tasks, newTask],
              isLoading: false,
              error: null
            }));
            
            get().calculateStats();
            console.log('✅ Tarea creada exitosamente offline');
          } catch (error) {
            console.error('❌ Error al crear tarea:', error);
            set({ 
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error al crear la tarea'
            });
          }
        },

        updateTask: async (id, updates) => {
          try {
            const previousTask = get().tasks.find(task => task.id === id);
            if (!previousTask) {
              throw new Error('Tarea no encontrada');
            }
            
            set({ isLoading: true, error: null });
            console.log('📝 Actualizando tarea offline:', id);
            
            // Actualizar offline
            const updatedTask = {
              ...previousTask,
              ...updates,
              updatedAt: new Date().toISOString()
            };
            
            // Actualizar estado local
            set(state => ({
              tasks: state.tasks.map(task => task.id === id ? updatedTask : task),
              isLoading: false,
              error: null
            }));
            
            get().calculateStats();
            console.log('✅ Tarea actualizada exitosamente offline');
          } catch (error) {
            console.error('❌ Error al actualizar tarea:', error);
            set({ 
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error al actualizar la tarea'
            });
          }
        },

        deleteTask: async (id) => {
          try {
            const taskToDelete = get().tasks.find(task => task.id === id);
            if (!taskToDelete) {
              throw new Error('Task not found');
            }
            
            set({ isLoading: true, error: null });
            console.log('🗑️ Eliminando tarea offline:', taskToDelete.title);
            
            // Actualizar estado local
            set(state => ({
              tasks: state.tasks.filter(task => task.id !== id),
              selectedTaskIds: state.selectedTaskIds.filter(taskId => taskId !== id),
              isLoading: false,
              error: null
            }));
            
            get().calculateStats();
            console.log('✅ Tarea eliminada exitosamente offline');
          } catch (error) {
            console.error('❌ Error al eliminar tarea:', error);
            set({ 
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error al eliminar la tarea'
            });
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
          const task = get().tasks.find(t => t.id === id);
          if (!task) return;
          
          const willComplete = !task.completed;
          await get().updateTask(id, {
            completed: willComplete,
            status: willComplete ? 'completed' : 'pending',
            completedDate: willComplete ? new Date().toISOString() : undefined,
          });
          // Auto-crear siguiente ocurrencia si corresponde
          if (willComplete && task.recurrence) {
            const nextDate = computeNextOccurrenceDate(task.scheduledDate, task.recurrence);
            if (nextDate) {
              const resetSubtasks = task.subtasks?.map(st => ({ ...st, completed: false })) || undefined;
              await get().addTask({
                title: task.title,
                type: task.type,
                subgroup: task.subgroup,
                status: 'pending',
                completed: false,
                scheduledDate: nextDate,
                scheduledTime: task.scheduledTime,
                notes: task.notes,
                tags: task.tags,
                subtasks: resetSubtasks,
                recurrence: task.recurrence,
              } as any);
            }
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
          if (task.recurrence) {
            const nextDate = computeNextOccurrenceDate(task.scheduledDate, task.recurrence);
            if (nextDate) {
              const resetSubtasks = task.subtasks?.map(st => ({ ...st, completed: false })) || undefined;
              await get().addTask({
                title: task.title,
                type: task.type,
                subgroup: task.subgroup,
                status: 'pending',
                completed: false,
                scheduledDate: nextDate,
                scheduledTime: task.scheduledTime,
                notes: task.notes,
                tags: task.tags,
                subtasks: resetSubtasks,
                recurrence: task.recurrence,
              } as any);
            }
          }
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
            
            console.log('📥 Cargando tareas offline (modo local)');
            
            // En modo offline, simplemente inicializamos con las tareas existentes en el estado
            // o con un array vacío si no hay tareas
            const currentTasks = get().tasks || [];
            
            set({ 
              tasks: currentTasks,
              isLoading: false,
              lastSync: new Date().toISOString(),
              syncStatus: 'offline',
              error: null
            });
            
            get().calculateStats();
            console.log('✅ Tareas cargadas exitosamente offline:', currentTasks.length);
          } catch (error) {
            console.error('❌ Error cargando tareas:', error);
            set({ 
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error al cargar las tareas',
              syncStatus: 'error'
            });
          }
        },

        // Nueva función para configurar listeners en tiempo real (modo offline)
        setupRealtimeListener: (userId?: string) => {
          console.log('🔄 Listener en tiempo real deshabilitado (modo offline)');
          
          // En modo offline, retornamos una función vacía
          return () => {
            console.log('🔄 Listener offline cleanup (no action needed)');
          };
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
          // Sync is now handled by localStorage persistence
          console.log('✅ Sync with localStorage - no server needed');
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