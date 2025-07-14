export interface DailyTask {
  title: string;
  type: 'personal' | 'work' | 'meditation';
  subtasks?: string[];
  scheduledTime?: string;
  notes?: string; // Notas adicionales de la tarea
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
    scheduledTime: "07:00",
    notes: "Comenzar el día con energía. Asegúrate de hacer cada ejercicio lentamente y con buena forma. Si sientes dolor, detente."
  },
  {
    title: "Revisar emails y agenda",
    type: "work",
    subtasks: [
      "Revisar emails importantes",
      "Planificar el día",
      "Revisar reuniones pendientes"
    ],
    scheduledTime: "08:00",
    notes: "Priorizar emails urgentes. Marcar en rojo las reuniones importantes del día y preparar materiales necesarios."
  },
  {
    title: "Desayuno saludable",
    type: "personal",
    subtasks: [
      "Preparar café/té",
      "Comer frutas",
      "Tomar vitaminas"
    ],
    scheduledTime: "08:30",
    notes: "El desayuno es la comida más importante del día. Incluir proteínas, carbohidratos complejos y grasas saludables."
  },
  {
    title: "Trabajo principal",
    type: "work",
    subtasks: [
      "Enfocarse en tareas prioritarias",
      "Tomar descansos cada 25 minutos",
      "Actualizar progreso"
    ],
    scheduledTime: "09:00",
    notes: "Usar técnica Pomodoro. Eliminar distracciones del teléfono y redes sociales. Enfocarse en máximo 3 tareas principales."
  },
  {
    title: "Almuerzo y descanso",
    type: "personal",
    subtasks: [
      "Preparar/comer almuerzo",
      "Caminar 10 minutos",
      "Hidratarse"
    ],
    scheduledTime: "12:00",
    notes: "Tomar un verdadero descanso. Alejarse de la pantalla, comer conscientemente y dar un paseo corto para recargar energía."
  },
  {
    title: "Sesión de estudio/aprendizaje",
    type: "work",
    subtasks: [
      "Leer 30 minutos",
      "Tomar notas",
      "Practicar lo aprendido"
    ],
    scheduledTime: "14:00",
    notes: "Aprendizaje continuo es clave. Elegir un tema específico, tomar notas activamente y aplicar lo aprendido en un proyecto."
  },
  {
    title: "Ejercicio vespertino",
    type: "personal",
    subtasks: [
      "Cardio 20 minutos",
      "Ejercicios de fuerza",
      "Enfriamiento"
    ],
    scheduledTime: "17:00",
    notes: "Liberar estrés del día. Alternar entre cardio y fuerza. Incluir música motivadora y terminar con estiramientos."
  },
  {
    title: "Reflexión y planificación",
    type: "meditation",
    subtasks: [
      "Meditar 10 minutos",
      "Revisar logros del día",
      "Planificar mañana"
    ],
    scheduledTime: "20:00",
    notes: "Cerrar el día con gratitud. Reflexionar sobre lo logrado, aprender de los errores y planificar prioridades para mañana."
  }
];

export const getDailyTasksForToday = (): DailyTask[] => {
  return dailyTasks.map(task => ({
    ...task,
    // Ajustar horarios según el día actual si es necesario
  }));
};