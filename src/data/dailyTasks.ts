export interface DailyTask {
  title: string;
  type: 'personal' | 'work' | 'meditation';
  subtasks?: string[];
  scheduledTime?: string;
}

export const dailyTasks: DailyTask[] = [
  {
    title: "Ejercicio matutino",
    type: "personal",
    subtasks: [
      "Hacer 20 flexiones",
      "30 segundos de plancha",
      "Estiramientos básicos"
    ],
    scheduledTime: "07:00"
  },
  {
    title: "Revisar emails y agenda",
    type: "work",
    subtasks: [
      "Revisar emails importantes",
      "Planificar el día",
      "Revisar reuniones pendientes"
    ],
    scheduledTime: "08:00"
  },
  {
    title: "Desayuno saludable",
    type: "personal",
    subtasks: [
      "Preparar café/té",
      "Comer frutas",
      "Tomar vitaminas"
    ],
    scheduledTime: "08:30"
  },
  {
    title: "Trabajo principal",
    type: "work",
    subtasks: [
      "Enfocarse en tareas prioritarias",
      "Tomar descansos cada 25 minutos",
      "Actualizar progreso"
    ],
    scheduledTime: "09:00"
  },
  {
    title: "Almuerzo y descanso",
    type: "personal",
    subtasks: [
      "Preparar/comer almuerzo",
      "Caminar 10 minutos",
      "Hidratarse"
    ],
    scheduledTime: "12:00"
  },
  {
    title: "Sesión de estudio/aprendizaje",
    type: "work",
    subtasks: [
      "Leer 30 minutos",
      "Tomar notas",
      "Practicar lo aprendido"
    ],
    scheduledTime: "14:00"
  },
  {
    title: "Ejercicio vespertino",
    type: "personal",
    subtasks: [
      "Cardio 20 minutos",
      "Ejercicios de fuerza",
      "Enfriamiento"
    ],
    scheduledTime: "17:00"
  },
  {
    title: "Reflexión y planificación",
    type: "meditation",
    subtasks: [
      "Meditar 10 minutos",
      "Revisar logros del día",
      "Planificar mañana"
    ],
    scheduledTime: "20:00"
  }
];

export const getDailyTasksForToday = (): DailyTask[] => {
  return dailyTasks.map(task => ({
    ...task,
    // Ajustar horarios según el día actual si es necesario
  }));
};