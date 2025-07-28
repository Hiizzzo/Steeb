# 📱 iPhone Calendar Component - Documentación

## 🎯 Descripción

Componente de calendario estilo iPhone/Apple Calendar para React con TypeScript. Diseñado para replicar la experiencia nativa de iOS con todas las funcionalidades modernas.

## ✨ Características Principales

### 🔄 Vistas Múltiples
- **Vista Mensual**: Calendario completo con navegación por meses
- **Vista de Día**: Vista detallada con gestión de tareas
- **Vista Semanal**: (preparada para futura implementación)

### 🎨 Diseño Estilo iPhone
- **Tema claro/oscuro**: Automático según configuración del sistema
- **Animaciones fluidas**: Transiciones suaves con Framer Motion
- **Gestos táctiles**: Hover, tap, y animaciones de respuesta
- **Tipografía nativa**: Fuentes del sistema similares a iOS

### 📅 Funcionalidades Avanzadas
- **Selección individual o múltiple**: Configurable según necesidades
- **Límites de fechas**: minDate y maxDate opcionales
- **Indicadores visuales**: Barras de progreso con colores según completación
- **Tooltips informativos**: Preview de tareas al hacer hover
- **Localización automática**: Español incluido, extensible a otros idiomas

### 🎯 Integración con Tareas
- **Mostrar eventos/marcadores**: Puntos y barras en días con tareas
- **Gestión completa**: Completar tareas, manejar subtareas
- **Colores personalizados**: Sistema de colores según % de completación:
  - 🔴 Rojo: 0-25% completado
  - 🟡 Amarillo: 26-50% completado  
  - 🔵 Azul: 51-75% completado
  - 🟢 Verde: 76-100% completado

## 🛠️ Instalación y Uso

### Prerequisitos
```bash
# Ya instalados en tu proyecto stebe
npm install framer-motion next-themes lucide-react
```

### Importación Básica
```tsx
import iPhoneCalendar from '@/components/iPhoneCalendar';

// Uso mínimo
<iPhoneCalendar />
```

### Ejemplo Completo
```tsx
import React, { useState } from 'react';
import iPhoneCalendar from '@/components/iPhoneCalendar';

const MyCalendarPage = () => {
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Reunión importante',
      type: 'work',
      completed: false,
      scheduledDate: '2024-01-15',
      scheduledTime: '09:00',
      subtasks: [
        { id: 's1', title: 'Preparar presentación', completed: true },
        { id: 's2', title: 'Revisar documentos', completed: false }
      ]
    }
  ]);

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? {
            ...task, 
            subtasks: task.subtasks?.map(sub => 
              sub.id === subtaskId 
                ? { ...sub, completed: !sub.completed }
                : sub
            )
          }
        : task
    ));
  };

  const handleAddTask = (date?: string) => {
    // Lógica para agregar nueva tarea
    console.log('Agregar tarea para:', date);
  };

  return (
    <iPhoneCalendar
      tasks={tasks}
      onToggleTask={handleToggleTask}
      onToggleSubtask={handleToggleSubtask}
      onAddTask={handleAddTask}
      enableMultipleSelection={false}
      minDate={new Date('2024-01-01')}
      maxDate={new Date('2024-12-31')}
    />
  );
};
```

## 📝 API Reference

### Props del Componente

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `tasks` | `Task[]` | `[]` | Array de tareas a mostrar |
| `onToggleTask` | `(id: string) => void` | - | Callback al completar/incompletar tarea |
| `onToggleSubtask` | `(taskId: string, subtaskId: string) => void` | - | Callback para subtareas |
| `onAddTask` | `(date?: string) => void` | - | Callback para agregar nueva tarea |
| `onDeleteTask` | `(id: string) => void` | - | Callback para eliminar tarea |
| `onShowTaskDetail` | `(id: string) => void` | - | Callback para mostrar detalle |
| `enableMultipleSelection` | `boolean` | `false` | Habilitar selección múltiple |
| `minDate` | `Date` | - | Fecha mínima seleccionable |
| `maxDate` | `Date` | - | Fecha máxima seleccionable |
| `selectedDates` | `string[]` | `[]` | Fechas preseleccionadas (modo múltiple) |
| `onDateSelect` | `(date: string, dates?: string[]) => void` | - | Callback al seleccionar fecha |

### Interfaz Task
```typescript
interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;     // Formato: 'YYYY-MM-DD'
  scheduledTime?: string;     // Formato: 'HH:MM'
  completedDate?: string;     // ISO string
  notes?: string;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}
```

## 🎨 Personalización

### Colores de Tema
El calendario automáticamente detecta el tema (claro/oscuro) usando `next-themes` y adapta sus colores:

```typescript
// Colores automáticos según tema
const isDark = theme === 'dark';

// Aplicación en estilos
className={`${
  isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
}`}
```

### Localización
```typescript
// Cambiar idioma (actualmente español)
const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
```

### Personalizar Colores de Completación
```typescript
const getCompletionColor = (percentage: number) => {
  if (percentage === 0) return 'bg-gray-200';
  if (percentage <= 25) return 'bg-red-500';     // Personalizable
  if (percentage <= 50) return 'bg-yellow-500';  // Personalizable  
  if (percentage <= 75) return 'bg-blue-500';    // Personalizable
  return 'bg-green-500';                         // Personalizable
};
```

## 🔄 Funciones Programáticas

### Seleccionar Fecha Programáticamente
```typescript
// Para selección individual
const selectDate = (dateString: string) => {
  setSelectedDate(new Date(dateString));
};

// Ejemplo de uso
selectDate('2024-01-15'); // Similar a calendar.select(calendar.today)
```

### Mostrar Marcadores en Días con Tareas
```typescript
// El componente automáticamente muestra marcadores según datos de tareas
const tasksForDay = tasks.filter(task => 
  task.scheduledDate === dateString || 
  task.completedDate?.split('T')[0] === dateString
);

// Cálculo automático de indicadores visuales
const completionPercentage = (completedTasks / totalTasks) * 100;
```

### Personalizar Celdas según Fecha
```typescript
// El componente incluye clases condicionales automáticas
className={`
  ${calendarDay.isToday ? 'bg-blue-500 text-white' : 'bg-white'}
  ${calendarDay.isSelected ? 'ring-2 ring-blue-500' : ''}
  ${calendarDay.totalTasks > 0 ? 'has-tasks' : 'no-tasks'}
`}
```

## 🎯 Ejemplos de Integración

### En ViewController (componente existente)
```tsx
// Reemplazar CalendarView existente
import iPhoneCalendar from '@/components/iPhoneCalendar';

// En MonthlyCalendarPage.tsx
<iPhoneCalendar
  tasks={tasks}
  onToggleTask={handleToggleTask}
  onToggleSubtask={handleToggleSubtask}
  onAddTask={handleAddTask}
/>
```

### Como Widget en Pantalla Principal
```tsx
// En pages/Index.tsx
{viewMode === 'calendar' && (
  <iPhoneCalendar
    tasks={tasks}
    onToggleTask={onToggleTask}
    onToggleSubtask={onToggleSubtask}
    onAddTask={onAddTask}
    onDateSelect={(date) => {
      // Cambiar a vista de día específico
      setSelectedCalendarDate(date);
    }}
  />
)}
```

### Configuración de Límites de Fecha
```tsx
<iPhoneCalendar
  minDate={new Date()} // Solo fechas futuras
  maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // Máximo 1 año
  tasks={tasks}
/>
```

## 🚀 Características Avanzadas

### Animaciones Personalizadas
```typescript
// Configurar animaciones de transición
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Animación de hover en celdas
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

### Gestos de Navegación
```typescript
// Navegación por gestos (incluida automáticamente)
const navigateMonth = useCallback((direction: 'prev' | 'next') => {
  if (isAnimating) return; // Prevenir múltiples animaciones
  
  setIsAnimating(true);
  // Lógica de navegación...
  setTimeout(() => setIsAnimating(false), 300);
}, [currentDate, isAnimating]);
```

### Soporte para Swipe (futuro)
```typescript
// Preparado para implementar gestos de swipe
const swipeHandlers = useSwipeable({
  onSwipedLeft: () => navigateMonth('next'),
  onSwipedRight: () => navigateMonth('prev'),
  preventDefaultTouchmoveEvent: true,
  trackMouse: true
});
```

## 🎨 Comparación con Otros Calendarios

| Característica | iPhone Calendar | react-day-picker | Otras librerías |
|----------------|-----------------|-------------------|-----------------|
| Tema claro/oscuro | ✅ Automático | ⚠️ Manual | ⚠️ Limitado |
| Animaciones | ✅ Fluidas | ❌ Ninguna | ⚠️ Básicas |
| Vista de día | ✅ Completa | ❌ No incluida | ⚠️ Limitada |
| Gestión de tareas | ✅ Integrada | ❌ No incluida | ❌ Separada |
| Estilo iOS | ✅ Nativo | ❌ Genérico | ⚠️ Personalizable |
| TypeScript | ✅ Completo | ✅ Incluido | ⚠️ Parcial |
| Tooltips | ✅ Inteligentes | ❌ Básicos | ⚠️ Limitados |
| Localización | ✅ Español | ✅ i18n | ⚠️ Variable |

## 🔧 Troubleshooting

### Problemas Comunes

1. **Animaciones no funcionan**
   ```bash
   npm install framer-motion
   ```

2. **Tema no cambia automáticamente**
   - Verificar que `next-themes` esté configurado en `main.tsx`
   - Verificar el ThemeProvider en el root de la app

3. **Fechas en formato incorrecto**
   ```typescript
   // Usar siempre formato ISO para fechas
   const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
   ```

4. **Performance en listas grandes de tareas**
   ```typescript
   // Usar useMemo para cálculos pesados
   const calendarDays = useMemo(() => {
     // Lógica de generación
   }, [currentDate, tasks, selectedDate]);
   ```

## 📱 Compatibilidad

- ✅ React 18+
- ✅ TypeScript 5+
- ✅ Tailwind CSS 3+
- ✅ Framer Motion 11+
- ✅ Next-themes 0.3+
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Dispositivos móviles y desktop
- ✅ Modo oscuro/claro
- ✅ Accesibilidad (ARIA labels)

¡El calendario está listo para usar y puede reemplazar fácilmente cualquier implementación existente en tu app stebe! 🎉