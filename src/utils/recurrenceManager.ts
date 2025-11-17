import { Task, RecurrenceRule } from '@/types';
import { useTaskStore } from '@/store/useTaskStore';

// Función para obtener la fecha actual en formato YYYY-MM-DD
const toDateOnly = (d: Date) => d.toISOString().split('T')[0];

// Función para agregar días a una fecha
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Función para agregar meses a una fecha
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
}

// Función para calcular la siguiente fecha de ocurrencia
function computeNextOccurrenceDate(currentDateStr: string, rule: RecurrenceRule): string | null {
  if (!rule || rule.frequency === 'none') return null;
  
  const interval = Math.max(1, rule.interval || 1);
  const base = new Date(currentDateStr);
  let next: Date | null = null;

  if (rule.frequency === 'daily') {
    next = addDays(base, interval);
  } else if (rule.frequency === 'weekly') {
    const days = (rule.daysOfWeek && rule.daysOfWeek.length > 0) ? rule.daysOfWeek.slice().sort() : undefined;
    const baseDow = base.getDay();
    
    if (!days) {
      next = addDays(base, 7 * interval);
    } else {
      // Si todos los días están seleccionados (0,1,2,3,4,5,6), simplemente avanzar al día siguiente
      if (days.length === 7) {
        next = addDays(base, 1);
      } else {
        let delta = 1;
        while (delta <= 7 * interval + 7) {
          const candidate = addDays(base, delta);
          const dow = candidate.getDay();
          const weeksDiff = Math.floor(delta / 7);
          
          if (days.includes(dow)) {
            if (weeksDiff === 0 && baseDow < dow) {
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
        
        if (!next) {
          const first = days[0];
          const candidate = addDays(base, (7 * interval) + ((first - baseDow + 7) % 7 || 7));
          next = candidate;
        }
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

// Función para generar todas las fechas faltantes hasta hoy
function generateMissingDates(lastDate: string, rule: RecurrenceRule, today: string): string[] {
  const dates: string[] = [];
  let currentDate = lastDate;
  
  while (true) {
    const nextDate = computeNextOccurrenceDate(currentDate, rule);
    if (!nextDate || nextDate > today) break;
    
    dates.push(nextDate);
    currentDate = nextDate;
  }
  
  return dates;
}

// Nueva función para generar todas las instancias de una tarea recurrente para el mes completo
export function generateMonthlyRecurrenceInstances(startDate: string, rule: RecurrenceRule): string[] {
  if (!rule || rule.frequency === 'none') return [];

  const dates: string[] = [];
  const start = new Date(startDate);
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Obtener el primer y último día del mes actual
  const firstDayOfMonth = toDateOnly(new Date(currentYear, currentMonth, 1));
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const endOfMonth = toDateOnly(new Date(currentYear, currentMonth, lastDayOfMonth));
  
  // Para tareas diarias, generar desde el primer día del mes o desde startDate (lo que sea más reciente)
  let generationStart = startDate;
  if (rule.frequency === 'daily' && startDate < firstDayOfMonth) {
    generationStart = firstDayOfMonth;
  }
  
  // INCLUIR LA FECHA INICIAL si está en el rango
  if (startDate >= firstDayOfMonth && startDate <= endOfMonth) {
    dates.push(startDate);
  }
  
  let currentDate = generationStart;
  
  // Generar todas las fechas hasta el final del mes
  while (true) {
    const nextDate = computeNextOccurrenceDate(currentDate, rule);
    if (!nextDate || nextDate > endOfMonth) break;
    
    // Verificar que la fecha esté en el mismo mes
    const nextDateObj = new Date(nextDate);
    if (nextDateObj.getMonth() !== currentMonth || nextDateObj.getFullYear() !== currentYear) break;
    
    // Solo agregar si no está ya en el array
    if (!dates.includes(nextDate)) {
      dates.push(nextDate);
    }
    currentDate = nextDate;
  }
  
  // Para tareas diarias, también generar hacia atrás desde startDate hasta el primer día del mes
  if (rule.frequency === 'daily' && startDate > firstDayOfMonth) {
    let backwardDate = startDate;
    while (true) {
      const prevDate = addDays(new Date(backwardDate), -1 * (rule.interval || 1));
      const prevDateStr = toDateOnly(prevDate);
      
      if (prevDateStr < firstDayOfMonth) break;
      
      if (!dates.includes(prevDateStr)) {
        dates.push(prevDateStr);
      }
      backwardDate = prevDateStr;
    }
  }
  
  // Ordenar las fechas
  dates.sort();
  
  if (import.meta.env.DEV) console.log(`📅 Fechas generadas para ${startDate} con regla:`, rule);
  if (import.meta.env.DEV) console.log(`📅 Instancias generadas:`, dates);
  return dates;
}

// Función principal para procesar tareas recurrentes
export async function processRecurringTasks(): Promise<void> {
  const store = useTaskStore.getState();
  const tasks = store.tasks;
  const today = toDateOnly(new Date());
  
  if (import.meta.env.DEV) console.log('🔄 Procesando tareas recurrentes para el día:', today);
  
  // Encontrar todas las tareas completadas con recurrencia
  const completedRecurringTasks = tasks.filter(task => 
    task.completed && 
    task.recurrence && 
    task.recurrence.frequency !== 'none' &&
    task.scheduledDate
  );
  
  if (import.meta.env.DEV) console.log(`📋 Encontradas ${completedRecurringTasks.length} tareas recurrentes completadas`);
  
  for (const task of completedRecurringTasks) {
    if (!task.scheduledDate || !task.recurrence) continue;
    
    // Verificar si ya existe una tarea pendiente para hoy con el mismo título y tipo
    const existingTaskForToday = tasks.find(t => 
      t.title === task.title &&
      t.type === task.type &&
      t.scheduledDate === today &&
      !t.completed
    );
    
    if (existingTaskForToday) {
      if (import.meta.env.DEV) console.log(`✅ Ya existe tarea pendiente para hoy: ${task.title}`);
      continue;
    }
    
    // Generar todas las fechas faltantes desde la última ocurrencia hasta hoy
    const missingDates = generateMissingDates(task.scheduledDate, task.recurrence, today);
    
    if (missingDates.length > 0) {
      if (import.meta.env.DEV) console.log(`📅 Generando ${missingDates.length} ocurrencias faltantes para: ${task.title}`);
      
      // Crear tareas para cada fecha faltante
      for (const date of missingDates) {
        // Verificar si ya existe una tarea para esta fecha
        const existingTask = tasks.find(t => 
          t.title === task.title &&
          t.type === task.type &&
          t.scheduledDate === date
        );
        
        if (!existingTask) {
          const resetSubtasks = task.subtasks?.map(st => ({ 
            ...st, 
            completed: false,
            id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          })) || undefined;
          
          await store.addTask({
            title: task.title,
            type: task.type,
            subgroup: task.subgroup,
            status: 'pending',
            completed: false,
            scheduledDate: date,
            scheduledTime: task.scheduledTime,
            notes: task.notes,
            tags: task.tags,
            subtasks: resetSubtasks,
            recurrence: task.recurrence,
            priority: task.priority,
            estimatedDuration: task.estimatedDuration,
          });
          
          if (import.meta.env.DEV) console.log(`✨ Creada tarea recurrente: ${task.title} para ${date}`);
        }
      }
    }
  }
  
  if (import.meta.env.DEV) console.log('✅ Procesamiento de tareas recurrentes completado');
}

// Función para inicializar el procesamiento automático
export function initializeRecurrenceManager(): void {
  // Ejecutar inmediatamente al cargar la app
  setTimeout(() => {
    processRecurringTasks().catch(error => {
      console.error('❌ Error procesando tareas recurrentes:', error);
    });
  }, 1000);
  
  // Ejecutar cada vez que cambie el día (verificar cada hora)
  setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Solo ejecutar una vez al día, preferiblemente temprano en la mañana
    if (currentHour === 6) {
      processRecurringTasks().catch(error => {
        console.error('❌ Error procesando tareas recurrentes:', error);
      });
    }
  }, 60 * 60 * 1000); // Cada hora
}
