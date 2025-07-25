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
const CURRENT_VERSION = '1.0.0';

export const useTaskPersistence = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);

  // Función para guardar con respaldo
  const saveTasksToStorage = useCallback((tasksToSave: Task[]) => {
    try {
      const dataToSave = {
        tasks: tasksToSave,
        timestamp: new Date().toISOString(),
        version: CURRENT_VERSION
      };

      // Guardar datos principales
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      // Crear respaldo
      localStorage.setItem(BACKUP_KEY, JSON.stringify(dataToSave));
      
      // Guardar versión
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      
      setLastSaved(new Date());
      setHasError(false);
      
      console.log('✅ Tareas guardadas exitosamente:', tasksToSave.length);
    } catch (error) {
      console.error('❌ Error al guardar tareas:', error);
      setHasError(true);
      
      // Intentar guardar en backup si falla el principal
      try {
        const backupData = {
          tasks: tasksToSave,
          timestamp: new Date().toISOString(),
          version: CURRENT_VERSION,
          isBackup: true
        };
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
        console.log('⚠️ Guardado en backup exitoso');
        setHasError(false); // Si el backup funciona, no hay error crítico
      } catch (backupError) {
        console.error('💥 Error crítico: no se pudo guardar ni en backup:', backupError);
        setHasError(true);
      }
    }
  }, []);

  // Función para cargar datos con recuperación automática
  const loadTasksFromStorage = useCallback(() => {
    try {
      setIsLoading(true);
      
      // Intentar cargar datos principales
      const savedData = localStorage.getItem(STORAGE_KEY);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Verificar si es el formato nuevo con metadatos
        if (parsedData.tasks && Array.isArray(parsedData.tasks)) {
          console.log('📱 Cargando tareas desde storage principal:', parsedData.tasks.length);
          setTasks(parsedData.tasks);
          setLastSaved(parsedData.timestamp ? new Date(parsedData.timestamp) : null);
          return parsedData.tasks;
        }
        
        // Formato legacy (array directo)
        if (Array.isArray(parsedData)) {
          console.log('🔄 Migrando formato legacy:', parsedData.length);
          setTasks(parsedData);
          
          // Migrar al nuevo formato
          saveTasksToStorage(parsedData);
          return parsedData;
        }
      }
      
      // Si falla, intentar cargar desde backup
      console.log('⚠️ No se encontraron datos principales, intentando backup...');
      const backupData = localStorage.getItem(BACKUP_KEY);
      
      if (backupData) {
        const parsedBackup = JSON.parse(backupData);
        const backupTasks = parsedBackup.tasks || parsedBackup;
        
        if (Array.isArray(backupTasks)) {
          console.log('🔧 Restaurando desde backup:', backupTasks.length);
          setTasks(backupTasks);
          
          // Restaurar en storage principal
          saveTasksToStorage(backupTasks);
          return backupTasks;
        }
      }
      
      // Si no hay datos, inicializar vacío
      console.log('🆕 Inicializando con datos vacíos');
      setTasks([]);
      return [];
      
    } catch (error) {
      console.error('💥 Error crítico al cargar tareas:', error);
      
      // En caso de error total, intentar recovery básico
      try {
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (rawData && rawData !== 'undefined' && rawData !== 'null') {
          console.log('🚨 Intentando recovery básico...');
          const basicParsed = JSON.parse(rawData);
          if (Array.isArray(basicParsed)) {
            setTasks(basicParsed);
            return basicParsed;
          }
        }
      } catch (recoveryError) {
        console.error('💀 Recovery básico falló:', recoveryError);
      }
      
      // Último recurso: vacío
      setTasks([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [saveTasksToStorage]);

  // Función para actualizar tareas con persistencia automática
  const updateTasks = useCallback((newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks(prevTasks => {
      const updatedTasks = typeof newTasks === 'function' ? newTasks(prevTasks) : newTasks;
      
      // Guardar automáticamente con debounce
      setTimeout(() => {
        saveTasksToStorage(updatedTasks);
      }, 100);
      
      return updatedTasks;
    });
  }, [saveTasksToStorage]);

  // Función para exportar datos (para backup manual)
  const exportTasks = useCallback(() => {
    try {
      const exportData = {
        tasks,
        exportDate: new Date().toISOString(),
        version: CURRENT_VERSION,
        lastSaved: lastSaved?.toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stebe-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      console.log('📤 Backup exportado exitosamente');
    } catch (error) {
      console.error('❌ Error al exportar backup:', error);
    }
  }, [tasks, lastSaved]);

  // Función para limpiar storage corrupto
  const clearCorruptedData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      localStorage.removeItem(VERSION_KEY);
      setTasks([]);
      setLastSaved(null);
      console.log('🧹 Storage limpiado exitosamente');
    } catch (error) {
      console.error('❌ Error al limpiar storage:', error);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadTasksFromStorage();
  }, [loadTasksFromStorage]);

  // Auto-guardar periódico (cada 30 segundos si hay cambios)
  useEffect(() => {
    const interval = setInterval(() => {
      if (tasks.length > 0 && (!lastSaved || Date.now() - lastSaved.getTime() > 30000)) {
        console.log('🔄 Auto-guardado periódico...');
        saveTasksToStorage(tasks);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [tasks, lastSaved, saveTasksToStorage]);

  // Guardar antes de cerrar la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (tasks.length > 0) {
        saveTasksToStorage(tasks);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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