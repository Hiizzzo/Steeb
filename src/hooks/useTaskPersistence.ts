import { useState, useEffect, useCallback } from 'react';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string;
}

const STORAGE_KEY = 'stebe-tasks';
const BACKUP_KEY = 'stebe-tasks-backup';
const VERSION_KEY = 'stebe-tasks-version';
const CURRENT_VERSION = '1.1.0'; // Incremented version for new persistence system
const DB_NAME = 'StebeTasksDB';
const DB_VERSION = 1;
const TASKS_STORE = 'tasks';

// IndexedDB utilities
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        const store = db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
        store.createIndex('version', 'version', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

const saveToIndexedDB = async (tasks: Task[]): Promise<boolean> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([TASKS_STORE], 'readwrite');
    const store = transaction.objectStore(TASKS_STORE);
    
    // Clear existing data
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve(true);
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Save new data with metadata
    const dataToSave = {
      id: 'current_tasks',
      tasks,
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
      appVersion: window.location.href // Track app version/URL
    };
    
    await new Promise((resolve, reject) => {
      const saveRequest = store.put(dataToSave);
      saveRequest.onsuccess = () => resolve(true);
      saveRequest.onerror = () => reject(saveRequest.error);
    });
    
    console.log('✅ Tareas guardadas en IndexedDB:', tasks.length);
    return true;
  } catch (error) {
    console.error('❌ Error al guardar en IndexedDB:', error);
    return false;
  }
};

const loadFromIndexedDB = async (): Promise<Task[] | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([TASKS_STORE], 'readonly');
    const store = transaction.objectStore(TASKS_STORE);
    
    const data = await new Promise<any>((resolve, reject) => {
      const request = store.get('current_tasks');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (data && data.tasks && Array.isArray(data.tasks)) {
      console.log('📱 Tareas cargadas desde IndexedDB:', data.tasks.length);
      return data.tasks;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error al cargar desde IndexedDB:', error);
    return null;
  }
};

export const useTaskPersistence = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);

  // Enhanced save function with multiple storage layers
  const saveTasksToStorage = useCallback(async (tasksToSave: Task[]) => {
    try {
      const dataToSave = {
        tasks: tasksToSave,
        timestamp: new Date().toISOString(),
        version: CURRENT_VERSION,
        appVersion: window.location.href
      };

      // Layer 1: Try IndexedDB first (most reliable)
      const indexedDBSuccess = await saveToIndexedDB(tasksToSave);
      
      // Layer 2: Always save to localStorage as immediate backup
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        localStorage.setItem(BACKUP_KEY, JSON.stringify(dataToSave));
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      } catch (localStorageError) {
        console.warn('⚠️ localStorage lleno o bloqueado:', localStorageError);
      }
      
      // Layer 3: Save to sessionStorage as temporary backup
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (sessionStorageError) {
        console.warn('⚠️ sessionStorage error:', sessionStorageError);
      }
      
      // Layer 4: Create URL-based backup for critical cases
      try {
        const urlBackup = btoa(JSON.stringify({
          tasks: tasksToSave.slice(-10), // Only last 10 tasks to avoid URL length limits
          timestamp: new Date().toISOString(),
          isUrlBackup: true
        }));
        
        // Store in a hidden element or meta tag
        let backupMeta = document.querySelector('meta[name="task-backup"]') as HTMLMetaElement;
        if (!backupMeta) {
          backupMeta = document.createElement('meta');
          backupMeta.name = 'task-backup';
          document.head.appendChild(backupMeta);
        }
        backupMeta.content = urlBackup;
      } catch (urlBackupError) {
        console.warn('⚠️ URL backup failed:', urlBackupError);
      }
      
      if (indexedDBSuccess) {
        setLastSaved(new Date());
        setHasError(false);
        console.log('✅ Tareas guardadas exitosamente en múltiples capas:', tasksToSave.length);
      } else {
        console.warn('⚠️ IndexedDB falló, pero localStorage/sessionStorage pueden tener los datos');
        setHasError(true);
      }
      
    } catch (error) {
      console.error('❌ Error crítico al guardar tareas:', error);
      setHasError(true);
    }
  }, []);

  // Enhanced load function with multiple recovery methods
  const loadTasksFromStorage = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Method 1: Try IndexedDB first
      console.log('🔍 Intentando cargar desde IndexedDB...');
      const indexedDBTasks = await loadFromIndexedDB();
      if (indexedDBTasks && indexedDBTasks.length > 0) {
        console.log('✅ Datos cargados desde IndexedDB:', indexedDBTasks.length);
        setTasks(indexedDBTasks);
        setLastSaved(new Date());
        return indexedDBTasks;
      }
      
      // Method 2: Try localStorage
      console.log('🔍 Intentando cargar desde localStorage...');
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const localStorageTasks = parsedData.tasks || parsedData;
        
        if (Array.isArray(localStorageTasks) && localStorageTasks.length > 0) {
          console.log('✅ Datos cargados desde localStorage:', localStorageTasks.length);
          setTasks(localStorageTasks);
          
          // Save to IndexedDB for future use
          await saveToIndexedDB(localStorageTasks);
          return localStorageTasks;
        }
      }
      
      // Method 3: Try backup localStorage
      console.log('🔍 Intentando cargar desde backup localStorage...');
      const backupData = localStorage.getItem(BACKUP_KEY);
      if (backupData) {
        const parsedBackup = JSON.parse(backupData);
        const backupTasks = parsedBackup.tasks || parsedBackup;
        
        if (Array.isArray(backupTasks) && backupTasks.length > 0) {
          console.log('✅ Datos restaurados desde backup:', backupTasks.length);
          setTasks(backupTasks);
          
          // Restore to main storage and IndexedDB
          await saveTasksToStorage(backupTasks);
          return backupTasks;
        }
      }
      
      // Method 4: Try sessionStorage
      console.log('🔍 Intentando cargar desde sessionStorage...');
      const sessionData = sessionStorage.getItem(STORAGE_KEY);
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData);
        const sessionTasks = parsedSession.tasks || parsedSession;
        
        if (Array.isArray(sessionTasks) && sessionTasks.length > 0) {
          console.log('✅ Datos recuperados desde sessionStorage:', sessionTasks.length);
          setTasks(sessionTasks);
          
          // Restore to all storage methods
          await saveTasksToStorage(sessionTasks);
          return sessionTasks;
        }
      }
      
      // Method 5: Try URL backup from meta tag
      console.log('🔍 Intentando cargar desde backup URL...');
      const backupMeta = document.querySelector('meta[name="task-backup"]') as HTMLMetaElement;
      if (backupMeta && backupMeta.content) {
        try {
          const urlBackup = JSON.parse(atob(backupMeta.content));
          if (urlBackup.tasks && Array.isArray(urlBackup.tasks) && urlBackup.tasks.length > 0) {
            console.log('✅ Datos recuperados desde backup URL:', urlBackup.tasks.length);
            setTasks(urlBackup.tasks);
            
            // Restore to all storage methods
            await saveTasksToStorage(urlBackup.tasks);
            return urlBackup.tasks;
          }
        } catch (urlBackupError) {
          console.warn('⚠️ Error al decodificar backup URL:', urlBackupError);
        }
      }
      
      // If no data found, initialize empty
      console.log('🆕 No se encontraron datos, inicializando vacío');
      setTasks([]);
      return [];
      
    } catch (error) {
      console.error('💥 Error crítico al cargar tareas:', error);
      setTasks([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to update tasks with enhanced persistence
  const updateTasks = useCallback(async (newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks(prevTasks => {
      const updatedTasks = typeof newTasks === 'function' ? newTasks(prevTasks) : newTasks;
      
      // Save immediately with debounce
      setTimeout(async () => {
        await saveTasksToStorage(updatedTasks);
      }, 100);
      
      return updatedTasks;
    });
  }, [saveTasksToStorage]);

  // Enhanced export function
  const exportTasks = useCallback(async () => {
    try {
      // Get the most recent data from all sources
      const indexedDBTasks = await loadFromIndexedDB();
      const localStorageTasks = localStorage.getItem(STORAGE_KEY);
      
      const exportData = {
        indexedDBTasks: indexedDBTasks || [],
        localStorageTasks: localStorageTasks ? JSON.parse(localStorageTasks) : null,
        currentTasks: tasks,
        exportDate: new Date().toISOString(),
        version: CURRENT_VERSION,
        lastSaved: lastSaved?.toISOString(),
        appVersion: window.location.href
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stebe-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      console.log('📤 Backup completo exportado exitosamente');
    } catch (error) {
      console.error('❌ Error al exportar backup:', error);
    }
  }, [tasks, lastSaved]);

  // Function to clear corrupted data from all sources
  const clearCorruptedData = useCallback(async () => {
    try {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      localStorage.removeItem(VERSION_KEY);
      
      // Clear sessionStorage
      sessionStorage.removeItem(STORAGE_KEY);
      
      // Clear IndexedDB
      try {
        const db = await openDB();
        const transaction = db.transaction([TASKS_STORE], 'readwrite');
        const store = transaction.objectStore(TASKS_STORE);
        store.clear();
      } catch (dbError) {
        console.warn('⚠️ Error al limpiar IndexedDB:', dbError);
      }
      
      // Clear URL backup
      const backupMeta = document.querySelector('meta[name="task-backup"]') as HTMLMetaElement;
      if (backupMeta) {
        backupMeta.remove();
      }
      
      setTasks([]);
      setLastSaved(null);
      setHasError(false);
      console.log('🧹 Todos los datos limpiados exitosamente');
    } catch (error) {
      console.error('❌ Error al limpiar datos:', error);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadTasksFromStorage();
  }, [loadTasksFromStorage]);

  // Enhanced auto-save (every 15 seconds instead of 30)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (tasks.length > 0 && (!lastSaved || Date.now() - lastSaved.getTime() > 15000)) {
        console.log('🔄 Auto-guardado periódico...');
        await saveTasksToStorage(tasks);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [tasks, lastSaved, saveTasksToStorage]);

  // Save before page unload/reload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (tasks.length > 0) {
        await saveTasksToStorage(tasks);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && tasks.length > 0) {
        await saveTasksToStorage(tasks);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tasks, saveTasksToStorage]);

  // Detect app updates and preserve data
  useEffect(() => {
    const handleAppUpdate = async () => {
      // Create a permanent backup when app updates are detected
      if (tasks.length > 0) {
        console.log('🔄 Detectada actualización de la app, creando backup permanente...');
        await saveTasksToStorage(tasks);
        
        // Also save to a version-specific backup
        const versionBackup = {
          tasks,
          timestamp: new Date().toISOString(),
          version: CURRENT_VERSION,
          isVersionBackup: true
        };
        
        try {
          localStorage.setItem(`stebe-tasks-v${CURRENT_VERSION}`, JSON.stringify(versionBackup));
        } catch (error) {
          console.warn('⚠️ No se pudo crear backup de versión:', error);
        }
      }
    };

    // Listen for app updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleAppUpdate);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleAppUpdate);
      }
    };
  }, [tasks, saveTasksToStorage]);

  return {
    tasks,
    updateTasks,
    isLoading,
    lastSaved,
    hasError,
    exportTasks,
    clearCorruptedData,
    forceReload: loadTasksFromStorage
  };
};