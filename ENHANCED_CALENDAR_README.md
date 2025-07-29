# 🎨 Enhanced Calendar - Calendario Altamente Dinámico para Stebe

## 📱 Descripción

**Enhanced Calendar** es un componente de calendario altamente animado y personalizable, diseñado específicamente para la app **Stebe**. Incorpora todas las mejoras visuales y de experiencia de usuario que transforman un calendario estático en una experiencia fluida y moderna.

## ✨ Características Implementadas

### 🎯 1. Animaciones al cambiar de mes
- **Deslizamiento horizontal** tipo iOS al navegar entre meses
- Transición suave con `spring` physics usando `framer-motion`
- Dirección inteligente (izquierda/derecha) según la navegación
- Estado de bloqueo durante animaciones para evitar glitches

```typescript
// Ejemplo de la animación de deslizamiento
const slideVariants = {
  initial: (direction: string) => ({
    x: direction === 'right' ? '100%' : '-100%',
    opacity: 0
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: config.monthTransition }
    }
  }
};
```

### 🎪 2. Rebote al seleccionar un día
- Efecto de **escala y rebote** al tocar una fecha
- Animación con easing personalizado para máximo impacto visual
- Feedback táctil inmediato con `whileTap` y `whileHover`

```typescript
const bounceVariants = {
  selected: {
    scale: [1, config.selectionBounce, 1],
    transition: { 
      duration: config.daySelection,
      ease: config.bounceEasing // [0.68, -0.55, 0.265, 1.55]
    }
  }
};
```

### 🔄 3. Vista "Mes" y "Semana" con transición animada
- Cambio fluido entre vistas con **fade + scale + rotateX**
- Efecto 3D sutil para mayor profundidad visual
- Layout animado del selector de vista

```typescript
const viewModeVariants = {
  initial: { scale: 0.8, opacity: 0, rotateX: -15 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};
```

### ✨ 4. Días con tareas marcados con animación
- **Indicadores de progreso** con gradientes dinámicos
- Animación `fade in` + `scale in` escalonada
- Barra de progreso que se llena animadamente
- Contador de tareas con delay controlado

```typescript
// Animación escalonada para cada día
{calendarDays.map((day, index) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ 
      delay: index * 0.01,  // Stagger effect
      type: "spring" 
    }}
  />
))}
```

### 🎨 5. Transición al seleccionar nueva fecha
- **Highlight suave** que se mueve entre días
- Seguimiento de posición para animaciones contextuales
- Efecto de resplandor al hacer hover
- Sombras dinámicas con colores del tema

### 🌙 6. Modo oscuro y claro automático
- **Auto-detección** del tema del sistema con `useColorScheme()`
- Gradientes adaptativos según el tema
- Paleta de colores optimizada para cada modo
- Transiciones suaves entre temas

```typescript
// Auto-detectar tema del sistema
const currentTheme = autoDetectTheme 
  ? (theme === 'system' ? systemTheme : theme)
  : theme;
```

### ⚙️ 7. Parámetros personalizables
- **Configuración completa** de duraciones y easing
- Colores personalizados para la marca Stebe
- Control granular de cada animación
- Props opcionales para habilitar/deshabilitar características

```typescript
const ANIMATION_CONFIG = {
  monthTransition: 0.4,
  daySelection: 0.3,
  viewModeTransition: 0.5,
  taskIndicator: 0.6,
  
  // Easing personalizado
  easing: [0.25, 0.46, 0.45, 0.94],
  bounceEasing: [0.68, -0.55, 0.265, 1.55],
  
  // Colores para Stebe
  colors: {
    primary: '#3B82F6',
    accent: '#8B5CF6',
    success: '#10B981',
    // ... más colores
  }
};
```

## 🚀 Uso del Componente

### Instalación básica

```tsx
import EnhancedCalendar from '@/components/EnhancedCalendar';

// Uso mínimo
<EnhancedCalendar
  tasks={tasks}
  onDateSelect={handleDateSelect}
  onToggleTask={handleToggleTask}
/>
```

### Configuración avanzada

```tsx
<EnhancedCalendar
  tasks={tasks}
  onDateSelect={handleDateSelect}
  onToggleTask={handleToggleTask}
  onAddTask={handleAddTask}
  
  // Configuración de animaciones
  animationConfig={{
    monthTransition: 0.6,    // Más lento
    daySelection: 0.2,       // Más rápido
    bounceEasing: [0.8, -0.6, 0.2, 1.6] // Más rebote
  }}
  
  // Características opcionales
  enableAnimations={true}
  showTaskIndicators={true}
  autoDetectTheme={true}
  enableMultipleSelection={false}
  
  // Límites de fecha
  minDate={new Date('2024-01-01')}
  maxDate={new Date('2024-12-31')}
/>
```

## 📋 Props del Componente

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `tasks` | `Task[]` | `[]` | Array de tareas para mostrar |
| `onToggleTask` | `(id: string) => void` | - | Callback al completar/descompletar tarea |
| `onAddTask` | `(date?: string) => void` | - | Callback para agregar nueva tarea |
| `onDateSelect` | `(date: string) => void` | - | Callback al seleccionar fecha |
| `animationConfig` | `Partial<AnimationConfig>` | `{}` | Configuración de animaciones |
| `enableAnimations` | `boolean` | `true` | Habilitar/deshabilitar animaciones |
| `showTaskIndicators` | `boolean` | `true` | Mostrar indicadores de tareas |
| `autoDetectTheme` | `boolean` | `true` | Auto-detectar tema del sistema |
| `enableMultipleSelection` | `boolean` | `false` | Permitir selección múltiple |

## 🎭 Demo Interactivo

El componente `EnhancedCalendarDemo` proporciona una demostración completa con:

- **Panel de configuración** en tiempo real
- **Controles de animación** ajustables
- **Vista de tareas** del día seleccionado
- **Showcase de características** implementadas

```tsx
import EnhancedCalendarDemo from '@/components/EnhancedCalendarDemo';

// En tu página o ruta
<EnhancedCalendarDemo />
```

## 🎨 Diseño y UX

### Principios de diseño aplicados

1. **Minimalismo**: Interface limpia sin elementos innecesarios
2. **Feedback inmediato**: Respuesta visual a cada interacción
3. **Consistencia**: Animaciones coherentes en toda la app
4. **Accesibilidad**: Colores con buen contraste y animaciones opcionales
5. **Performance**: Optimizaciones para 60fps constantes

### Paleta de colores Stebe

```scss
// Colores principales
$primary: #3B82F6;      // Azul principal
$accent: #8B5CF6;       // Púrpura para acentos
$success: #10B981;      // Verde para completadas
$warning: #F59E0B;      // Amarillo para en progreso
$error: #EF4444;        // Rojo para urgentes

// Gradientes
$selected-gradient: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
$today-gradient: linear-gradient(135deg, #10B981 0%, #3B82F6 100%);
```

## 🔧 Personalización Avanzada

### Modificar duraciones de animación

```typescript
const customConfig = {
  monthTransition: 0.8,     // Transición más lenta
  daySelection: 0.15,       // Selección más rápida
  viewModeTransition: 0.4,  // Vista media
  taskIndicator: 1.0,       // Indicadores más lentos
  highlight: 0.6            // Highlight más suave
};
```

### Personalizar colores

```typescript
const customColors = {
  primary: '#FF6B6B',       // Rojo como primario
  accent: '#4ECDC4',        // Turquesa como acento
  success: '#45B7D1',       // Azul para completadas
  // ... más personalizaciones
};
```

### Easing personalizado

```typescript
const customEasing = {
  easing: [0.4, 0.0, 0.2, 1],           // Material Design
  bounceEasing: [0.175, 0.885, 0.32, 1.275], // Bounce suave
};
```

## 📱 Responsive Design

El calendario se adapta automáticamente a diferentes tamaños de pantalla:

- **Mobile**: Vista compacta optimizada para touch
- **Tablet**: Vista expandida con más espacio
- **Desktop**: Vista completa con paneles laterales

## 🚀 Performance

### Optimizaciones implementadas

1. **Memoización**: `useMemo` para cálculos pesados
2. **Callbacks optimizados**: `useCallback` para evitar re-renders
3. **Lazy loading**: Componentes cargados bajo demanda
4. **AnimatePresence**: Gestión eficiente de animaciones de montaje/desmontaje
5. **Stagger inteligente**: Delays mínimos para fluidez visual

### Métricas objetivo

- **FPS**: 60fps constantes durante animaciones
- **Time to Interactive**: < 200ms
- **Memory usage**: < 50MB adicionales
- **Bundle size**: < 100KB adicionales

## 🔮 Futuras Mejoras

### Próximas características

1. **Gestos táctiles**: Swipe para cambiar mes
2. **Drag & Drop**: Mover tareas entre días
3. **Vista anual**: Calendario expandido con animaciones
4. **Notificaciones**: Alertas animadas para recordatorios
5. **Integración AR**: Vista de calendario en realidad aumentada

### Roadmap técnico

- [ ] Migración a `react-native-reanimated` v3
- [ ] Soporte para `react-native-gesture-handler`
- [ ] Optimizaciones con `react-native-skia`
- [ ] Tests de performance automatizados

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una branch para tu feature
3. Implementa los cambios con tests
4. Asegúrate de que las animaciones sean fluidas
5. Crea un Pull Request con descripción detallada

## 📄 Licencia

Este componente es parte del proyecto **Stebe** y está bajo la licencia del proyecto principal.

---

**Desarrollado con ❤️ para la app Stebe** | Calendario que transforma la productividad en una experiencia visual increíble.