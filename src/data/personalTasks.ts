// Tareas predefinidas para la sección personal
export const personalTasks = [
  {
    title: "Revisar emails pendientes",
    type: "personal" as const,
    subgroup: "organizacion" as const,
    priority: "medium" as const,
    estimatedDuration: 30,
  },
  {
    title: "Planificar fin de semana",
    type: "personal" as const, 
    subgroup: "organizacion" as const,
    priority: "low" as const,
    estimatedDuration: 15,
  },
  {
    title: "Leer 30 páginas de libro",
    type: "personal" as const,
    subgroup: "aprendizaje" as const,
    priority: "medium" as const,
    estimatedDuration: 45,
  },
  {
    title: "Hacer ejercicio en casa",
    type: "personal" as const,
    subgroup: "salud" as const,
    priority: "high" as const,
    estimatedDuration: 60,
  },
  {
    title: "Escribir en el diario",
    type: "personal" as const,
    subgroup: "creatividad" as const,
    priority: "low" as const,
    estimatedDuration: 20,
  },
  {
    title: "Llamar a un amigo/familiar",
    type: "personal" as const,
    subgroup: "social" as const,
    priority: "medium" as const,
    estimatedDuration: 30,
  },
  {
    title: "Ver un documental educativo",
    type: "personal" as const,
    subgroup: "entretenimiento" as const,
    priority: "low" as const,
    estimatedDuration: 90,
  },
  {
    title: "Organizar espacio de trabajo",
    type: "personal" as const,
    subgroup: "productividad" as const,
    priority: "medium" as const,
    estimatedDuration: 45,
  }
];