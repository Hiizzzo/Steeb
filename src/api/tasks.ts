// ============================================================================
// TASKS API
// ============================================================================

import { apiClient } from './client';
import { Task, ApiResponse, TaskFilters, PaginationParams } from '@/types';

export const tasksAPI = {
  // ========== CRUD OPERATIONS ==========
  
  /**
   * Get all tasks with optional filtering and pagination
   */
  async getTasks(
    filters?: TaskFilters, 
    pagination?: PaginationParams
  ): Promise<ApiResponse<{ tasks: Task[]; total: number; page: number; totalPages: number }>> {
    const params = {
      ...filters,
      ...pagination,
      // Convert arrays to comma-separated strings for URL params
      type: filters?.type?.join(','),
      priority: filters?.priority?.join(','),
      status: filters?.status?.join(','),
      tags: filters?.tags?.join(','),
    };

    return apiClient.get('/tasks', params);
  },

  /**
   * Get a single task by ID
   */
  async getTask(id: string): Promise<ApiResponse<Task>> {
    return apiClient.get(`/tasks/${id}`);
  },

  /**
   * Create a new task
   */
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Task>> {
    const newTask = {
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return apiClient.post('/tasks', newTask);
  },

  /**
   * Update an existing task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    const updatedTask = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return apiClient.put(`/tasks/${id}`, updatedTask);
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<ApiResponse<{ id: string }>> {
    return apiClient.delete(`/tasks/${id}`);
  },

  // ========== BULK OPERATIONS ==========

  /**
   * Create multiple tasks at once
   */
  async createTasks(tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ApiResponse<Task[]>> {
    const newTasks = tasks.map(task => ({
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return apiClient.post('/tasks/bulk', { tasks: newTasks });
  },

  /**
   * Update multiple tasks at once
   */
  async updateTasks(updates: Array<{ id: string; updates: Partial<Task> }>): Promise<ApiResponse<Task[]>> {
    const bulkUpdates = updates.map(({ id, updates }) => ({
      id,
      updates: {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    }));

    return apiClient.put('/tasks/bulk', { updates: bulkUpdates });
  },

  /**
   * Delete multiple tasks at once
   */
  async deleteTasks(ids: string[]): Promise<ApiResponse<{ deletedIds: string[] }>> {
    return apiClient.delete('/tasks/bulk', { ids });
  },

  // ========== TASK STATUS OPERATIONS ==========

  /**
   * Mark task as completed
   */
  async completeTask(id: string): Promise<ApiResponse<Task>> {
    return apiClient.put(`/tasks/${id}/complete`, {
      completed: true,
      status: 'completed',
      completedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Mark task as incomplete
   */
  async uncompleteTask(id: string): Promise<ApiResponse<Task>> {
    return apiClient.put(`/tasks/${id}/complete`, {
      completed: false,
      status: 'pending',
      completedDate: null,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Toggle task completion status
   */
  async toggleTask(id: string): Promise<ApiResponse<Task>> {
    const taskResponse = await this.getTask(id);
    if (!taskResponse.success || !taskResponse.data) {
      return taskResponse;
    }

    const task = taskResponse.data;
    return task.completed ? this.uncompleteTask(id) : this.completeTask(id);
  },

  // ========== SUBTASK OPERATIONS ==========

  /**
   * Add a subtask to an existing task
   */
  async addSubtask(taskId: string, subtaskTitle: string): Promise<ApiResponse<Task>> {
    return apiClient.post(`/tasks/${taskId}/subtasks`, {
      title: subtaskTitle,
      completed: false,
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * Update a subtask
   */
  async updateSubtask(
    taskId: string, 
    subtaskId: string, 
    updates: { title?: string; completed?: boolean }
  ): Promise<ApiResponse<Task>> {
    return apiClient.put(`/tasks/${taskId}/subtasks/${subtaskId}`, updates);
  },

  /**
   * Delete a subtask
   */
  async deleteSubtask(taskId: string, subtaskId: string): Promise<ApiResponse<Task>> {
    return apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  },

  /**
   * Toggle subtask completion
   */
  async toggleSubtask(taskId: string, subtaskId: string): Promise<ApiResponse<Task>> {
    return apiClient.put(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
  },

  // ========== CALENDAR OPERATIONS ==========

  /**
   * Get tasks for a specific date range
   */
  async getTasksInRange(startDate: string, endDate: string): Promise<ApiResponse<Task[]>> {
    return apiClient.get('/tasks/range', {
      start: startDate,
      end: endDate,
    });
  },

  /**
   * Get tasks for a specific date
   */
  async getTasksForDate(date: string): Promise<ApiResponse<Task[]>> {
    return apiClient.get('/tasks/date', { date });
  },

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<ApiResponse<Task[]>> {
    return apiClient.get('/tasks/overdue');
  },

  /**
   * Get upcoming tasks (next 7 days)
   */
  async getUpcomingTasks(days: number = 7): Promise<ApiResponse<Task[]>> {
    return apiClient.get('/tasks/upcoming', { days });
  },

  // ========== SEARCH & FILTER ==========

  /**
   * Search tasks by text
   */
  async searchTasks(query: string): Promise<ApiResponse<Task[]>> {
    return apiClient.get('/tasks/search', { q: query });
  },

  /**
   * Get tasks by type
   */
  async getTasksByType(type: 'personal' | 'work' | 'meditation'): Promise<ApiResponse<Task[]>> {
    return apiClient.get('/tasks/type', { type });
  },

  /**
   * Get tasks by priority
   */
  async getTasksByPriority(priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<ApiResponse<Task[]>> {
    return apiClient.get('/tasks/priority', { priority });
  },

  /**
   * Get tasks by tags
   */
  async getTasksByTags(tags: string[]): Promise<ApiResponse<Task[]>> {
    return apiClient.get('/tasks/tags', { tags: tags.join(',') });
  },

  // ========== STATISTICS ==========

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<ApiResponse<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
    averageCompletionTime: number;
  }>> {
    return apiClient.get('/tasks/stats');
  },

  /**
   * Get productivity metrics
   */
  async getProductivityMetrics(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<ApiResponse<any>> {
    return apiClient.get('/tasks/metrics', { period });
  },

  // ========== SYNC & BACKUP ==========

  /**
   * Sync local tasks with server
   */
  async syncTasks(localTasks: Task[]): Promise<ApiResponse<{
    updated: Task[];
    conflicts: Array<{ local: Task; remote: Task }>;
    lastSync: string;
  }>> {
    return apiClient.post('/tasks/sync', {
      tasks: localTasks,
      lastSync: localStorage.getItem('lastSync'),
    });
  },

  /**
   * Create backup of all tasks
   */
  async backupTasks(): Promise<ApiResponse<{ backupId: string; url?: string }>> {
    return apiClient.post('/tasks/backup');
  },

  /**
   * Restore tasks from backup
   */
  async restoreTasks(backupId: string): Promise<ApiResponse<Task[]>> {
    return apiClient.post('/tasks/restore', { backupId });
  },

  // ========== IMPORT/EXPORT ==========

  /**
   * Export tasks to various formats
   */
  async exportTasks(format: 'json' | 'csv' | 'ical' = 'json'): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.get('/tasks/export', { format });
  },

  /**
   * Import tasks from file
   */
  async importTasks(file: File, format: 'json' | 'csv' | 'ical'): Promise<ApiResponse<{
    imported: number;
    skipped: number;
    errors: string[];
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    // Note: This would need a special method in apiClient for FormData
    const response = await fetch(`${apiClient.baseURL}/tasks/import`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': localStorage.getItem('auth-token') ? 
          `Bearer ${localStorage.getItem('auth-token')}` : '',
      },
    });

    const data = await response.json();
    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.error,
      timestamp: new Date().toISOString(),
    };
  },
};

// ============================================================================
// OFFLINE FALLBACK
// ============================================================================

/**
 * Wrapper that provides offline fallback for all API operations
 */
export const createOfflineTasksAPI = (localStorageKey: string = 'stebe-tasks') => {
  const getLocalTasks = (): Task[] => {
    try {
      const stored = localStorage.getItem(localStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const setLocalTasks = (tasks: Task[]): void => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks locally:', error);
    }
  };

  return {
    ...tasksAPI,

    // Override with offline-first approach
    async getTasks(filters?: TaskFilters, pagination?: PaginationParams) {
      try {
        // Try API first
        const response = await tasksAPI.getTasks(filters, pagination);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('API unavailable, using local storage');
      }

      // Fallback to local storage
      const localTasks = getLocalTasks();
      let filteredTasks = localTasks;

      // Apply basic filtering locally
      if (filters?.completed !== undefined) {
        filteredTasks = filteredTasks.filter(task => task.completed === filters.completed);
      }
      if (filters?.type?.length) {
        filteredTasks = filteredTasks.filter(task => filters.type!.includes(task.type));
      }

      return {
        success: true,
        data: {
          tasks: filteredTasks,
          total: filteredTasks.length,
          page: pagination?.page || 1,
          totalPages: Math.ceil(filteredTasks.length / (pagination?.limit || 10)),
        },
        timestamp: new Date().toISOString(),
      };
    },

    async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        status: task.status || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const response = await tasksAPI.createTask(task);
        if (response.success && response.data) {
          // Update local storage with server response
          const localTasks = getLocalTasks();
          const updatedTasks = [...localTasks.filter(t => t.id !== response.data!.id), response.data];
          setLocalTasks(updatedTasks);
          return response;
        }
      } catch (error) {
        console.warn('API unavailable, saving locally');
      }

      // Fallback to local storage
      const localTasks = getLocalTasks();
      const updatedTasks = [...localTasks, newTask];
      setLocalTasks(updatedTasks);

      return {
        success: true,
        data: newTask,
        timestamp: new Date().toISOString(),
      };
    },

    async updateTask(id: string, updates: Partial<Task>) {
      try {
        const response = await tasksAPI.updateTask(id, updates);
        if (response.success && response.data) {
          // Update local storage with server response
          const localTasks = getLocalTasks();
          const updatedTasks = localTasks.map(task => 
            task.id === id ? response.data! : task
          );
          setLocalTasks(updatedTasks);
          return response;
        }
      } catch (error) {
        console.warn('API unavailable, updating locally');
      }

      // Fallback to local storage
      const localTasks = getLocalTasks();
      const taskIndex = localTasks.findIndex(task => task.id === id);
      
      if (taskIndex === -1) {
        return {
          success: false,
          error: 'Task not found',
          timestamp: new Date().toISOString(),
        };
      }

      const updatedTask = {
        ...localTasks[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const updatedTasks = [...localTasks];
      updatedTasks[taskIndex] = updatedTask;
      setLocalTasks(updatedTasks);

      return {
        success: true,
        data: updatedTask,
        timestamp: new Date().toISOString(),
      };
    },

    async deleteTask(id: string) {
      try {
        const response = await tasksAPI.deleteTask(id);
        if (response.success) {
          // Update local storage
          const localTasks = getLocalTasks();
          const updatedTasks = localTasks.filter(task => task.id !== id);
          setLocalTasks(updatedTasks);
          return response;
        }
      } catch (error) {
        console.warn('API unavailable, deleting locally');
      }

      // Fallback to local storage
      const localTasks = getLocalTasks();
      const taskExists = localTasks.find(task => task.id === id);
      
      if (!taskExists) {
        return {
          success: false,
          error: 'Task not found',
          timestamp: new Date().toISOString(),
        };
      }

      const updatedTasks = localTasks.filter(task => task.id !== id);
      setLocalTasks(updatedTasks);

      return {
        success: true,
        data: { id },
        timestamp: new Date().toISOString(),
      };
    },

    // Add more offline methods as needed...
  };
};