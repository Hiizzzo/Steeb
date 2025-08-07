// Sample tasks for demonstration purposes
export const generateSampleTasks = () => {
  const now = new Date();
  const today = new Date().toISOString().split('T')[0];
  const tasks = [];

  // Add some tasks completed today for testing the hide functionality
  const todayTasks = [
    {
      id: `today-completed-1`,
      title: `Revisar emails matutinos`,
      type: 'work' as 'personal' | 'work' | 'meditation',
      completed: true,
      completedDate: new Date().toISOString(),
      scheduledDate: today,
      category: 'work' as any,
      notes: `Completada hoy para testear funcionalidad`
    },
    {
      id: `today-completed-2`,
      title: `Ejercicio de 30 minutos`,
      type: 'personal' as 'personal' | 'work' | 'meditation',
      completed: true,
      completedDate: new Date().toISOString(),
      scheduledDate: today,
      category: 'exercise' as any,
      notes: `Completada hoy para testear funcionalidad`
    },
    {
      id: `today-completed-3`,
      title: `Meditación matutina`,
      type: 'meditation' as 'personal' | 'work' | 'meditation',
      completed: true,
      completedDate: new Date().toISOString(),
      scheduledDate: today,
      category: 'personal' as any,
      notes: `Completada hoy para testear funcionalidad`
    },
    {
      id: `today-pending-1`,
      title: `Llamada importante`,
      type: 'work' as 'personal' | 'work' | 'meditation',
      completed: false,
      scheduledDate: today,
      category: 'work' as any,
      notes: `Tarea pendiente para hoy`
    },
    {
      id: `today-pending-2`,
      title: `Leer capítulo del libro`,
      type: 'personal' as 'personal' | 'work' | 'meditation',
      completed: false,
      scheduledDate: today,
      category: 'study' as any,
      notes: `Tarea pendiente para hoy`
    }
  ];

  tasks.push(...todayTasks);

  // Generate tasks for this week (showing various patterns)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    
    // Different task counts per day to show varied bar heights
    const taskCount = [3, 5, 2, 4, 6, 1, 3][i]; // Monday to Sunday
    
    for (let j = 0; j < taskCount; j++) {
      tasks.push({
        id: `week-${i}-${j}`,
        title: `Tarea ${j + 1} - ${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}`,
        type: ['personal', 'work', 'meditation'][j % 3] as 'personal' | 'work' | 'meditation',
        completed: true,
        completedDate: dayDate.toISOString(),
        scheduledDate: dayDate.toISOString(),
        category: ['work', 'study', 'exercise', 'personal', 'project'][j % 5] as any,
        notes: `Tarea completada el ${dayDate.toLocaleDateString()}`
      });
    }
  }

  // Generate some tasks for previous weeks in this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let week = 0; week < 3; week++) {
    const weekStart = new Date(startOfMonth);
    weekStart.setDate(startOfMonth.getDate() + (week * 7));
    
    if (weekStart < startOfWeek) { // Only for previous weeks
      const weekTaskCount = [8, 12, 15][week]; // Increasing progression
      
      for (let i = 0; i < weekTaskCount; i++) {
        const taskDate = new Date(weekStart);
        taskDate.setDate(weekStart.getDate() + (i % 7));
        
        tasks.push({
          id: `month-${week}-${i}`,
          title: `Tarea mensual ${i + 1} - Semana ${week + 1}`,
          type: ['personal', 'work', 'meditation'][i % 3] as 'personal' | 'work' | 'meditation',
          completed: true,
          completedDate: taskDate.toISOString(),
          scheduledDate: taskDate.toISOString(),
          category: ['work', 'study', 'exercise', 'personal', 'project'][i % 5] as any
        });
      }
    }
  }

  // Generate some tasks for previous months this year
  for (let month = 0; month < now.getMonth(); month++) {
    const monthTaskCount = [15, 20, 25, 18, 22, 30, 28, 35, 40][month] || 20;
    
    for (let i = 0; i < monthTaskCount; i++) {
      const taskDate = new Date(now.getFullYear(), month, 1 + (i % 28));
      
      tasks.push({
        id: `year-${month}-${i}`,
        title: `Tarea anual ${i + 1} - ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'][month]}`,
        type: ['personal', 'work', 'meditation'][i % 3] as 'personal' | 'work' | 'meditation',
        completed: true,
        completedDate: taskDate.toISOString(),
        scheduledDate: taskDate.toISOString(),
        category: ['work', 'study', 'exercise', 'personal', 'project'][i % 5] as any
      });
    }
  }

  return tasks;
};

// Function to load sample data into localStorage
export const loadSampleData = () => {
  const sampleTasks = generateSampleTasks();
  localStorage.setItem('stebe-tasks', JSON.stringify(sampleTasks));
  console.log(`Loaded ${sampleTasks.length} sample tasks`);
  return sampleTasks;
};

// Function to clear sample data
export const clearSampleData = () => {
  localStorage.removeItem('stebe-tasks');
  console.log('Sample data cleared');
};