// Servicio para almacenamiento local de tareas en archivo de texto
import { Task } from '../types/task';

class LocalStorageService {
  private readonly TASKS_KEY = 'steeb_tasks_backup';
  private readonly TASKS_FILE_KEY = 'steeb_tasks_file';

  // Guardar tareas en localStorage como respaldo
  saveTasks(tasks: Task[]): void {
    try {
      const tasksData = {
        tasks,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasksData));
      
      // También crear un archivo de texto legible
      this.saveTasksAsText(tasks);
      
      console.log('💾 Tareas guardadas localmente:', tasks.length);
    } catch (error) {
      console.error('❌ Error al guardar tareas localmente:', error);
    }
  }

  // Cargar tareas desde localStorage
  loadTasks(): Task[] {
    try {
      const stored = localStorage.getItem(this.TASKS_KEY);
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      return data.tasks || [];
    } catch (error) {
      console.error('❌ Error al cargar tareas locales:', error);
      return [];
    }
  }

  // Guardar tareas como texto legible
  private saveTasksAsText(tasks: Task[]): void {
    try {
      const textContent = this.formatTasksAsText(tasks);
      localStorage.setItem(this.TASKS_FILE_KEY, textContent);
      
      // También intentar descargar como archivo
      this.downloadTasksAsFile(textContent);
    } catch (error) {
      console.error('❌ Error al crear archivo de texto:', error);
    }
  }

  // Formatear tareas como texto legible
  private formatTasksAsText(tasks: Task[]): string {
    const header = `STEEB - Lista de Tareas\nGenerado: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;
    
    const tasksByType = tasks.reduce((acc, task) => {
      const type = task.type || 'extra';
      if (!acc[type]) acc[type] = [];
      acc[type].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    let content = header;
    
    Object.entries(tasksByType).forEach(([type, typeTasks]) => {
      content += `📋 ${type.toUpperCase()}\n${'-'.repeat(20)}\n`;
      
      typeTasks.forEach((task, index) => {
        const status = task.completed ? '✅' : '⏳';
        const priority = task.priority ? ` [${task.priority}]` : '';
        const date = task.scheduledDate ? ` (${task.scheduledDate})` : '';
        
        content += `${index + 1}. ${status} ${task.title}${priority}${date}\n`;
        
        if (task.description) {
          content += `   📝 ${task.description}\n`;
        }
        
        if (task.notes) {
          content += `   📌 ${task.notes}\n`;
        }
        
        content += '\n';
      });
      
      content += '\n';
    });
    
    const stats = this.calculateTaskStats(tasks);
    content += `📊 ESTADÍSTICAS\n${'-'.repeat(20)}\n`;
    content += `Total de tareas: ${stats.total}\n`;
    content += `Completadas: ${stats.completed}\n`;
    content += `Pendientes: ${stats.pending}\n`;
    content += `Porcentaje completado: ${stats.completionRate}%\n`;
    
    return content;
  }

  // Descargar tareas como archivo de texto
  private downloadTasksAsFile(content: string): void {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `steeb-tareas-${new Date().toISOString().split('T')[0]}.txt`;
      
      // Solo descargar si el usuario lo solicita explícitamente
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error al crear archivo de descarga:', error);
    }
  }

  // Calcular estadísticas de tareas
  private calculateTaskStats(tasks: Task[]) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, pending, completionRate };
  }

  // Obtener contenido de texto de las tareas
  getTasksAsText(): string {
    return localStorage.getItem(this.TASKS_FILE_KEY) || 'No hay tareas guardadas';
  }

  // Limpiar almacenamiento local
  clearLocalStorage(): void {
    localStorage.removeItem(this.TASKS_KEY);
    localStorage.removeItem(this.TASKS_FILE_KEY);
    console.log('🗑️ Almacenamiento local limpiado');
  }

  // Exportar tareas manualmente
  exportTasks(): void {
    const tasks = this.loadTasks();
    const content = this.formatTasksAsText(tasks);
    this.downloadTasksAsFile(content);
  }
}

export const localStorageService = new LocalStorageService();
export default localStorageService;