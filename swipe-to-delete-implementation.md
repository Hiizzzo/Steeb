# Implementación de Deslizar para Eliminar Tareas

## Funcionalidad Implementada

Se ha añadido la funcionalidad de **deslizar hacia la izquierda** para eliminar tareas en la aplicación STEBE. Esta funcionalidad está disponible tanto en la vista principal de tareas como en la vista de calendario.

## Características Principales

### 🎯 **Gesto de Deslizamiento**
- **Dirección**: Deslizar hacia la izquierda (desde derecha hacia izquierda)
- **Plataformas**: Funciona en dispositivos táctiles (móviles/tablets) y con mouse (desktop)
- **Feedback Visual**: Aparece un fondo rojo con icono de papelera durante el deslizamiento

### 📱 **Experiencia de Usuario**
- **Umbral de Activación**: Se requiere deslizar al menos 80px para activar la eliminación
- **Indicador Visual**: Aparece el icono de papelera cuando se desliza más de 120px
- **Animaciones Suaves**: Transiciones fluidas durante el deslizamiento
- **Cancelación**: Si no se completa el gesto, la tarea vuelve a su posición original

### ⚙️ **Funcionalidad Técnica**
- **Prevención de Clicks Accidentales**: Durante el deslizamiento se deshabilitan otros clicks
- **Feedback de Eliminación**: Toast notification confirmando la eliminación
- **Persistencia**: Los cambios se guardan automáticamente en localStorage

## Componentes Modificados

### 1. **TaskCard.tsx**
- ✅ Agregado soporte para touch events y mouse events
- ✅ Agregada prop `onDelete` opcional
- ✅ Implementado fondo rojo de eliminación
- ✅ Prevención de interacciones durante el deslizamiento

### 2. **TaskItem.tsx**
- ✅ Misma funcionalidad que TaskCard para consistencia
- ✅ Adaptado al diseño específico del componente
- ✅ Mantenimiento de la funcionalidad existente

### 3. **Index.tsx** (Página Principal)
- ✅ Agregada función `handleDeleteTask`
- ✅ Implementado toast de confirmación
- ✅ Conectado con ambos componentes de tarea

### 4. **CalendarView.tsx**
- ✅ Agregada prop `onDelete` al interface
- ✅ Funcionalidad disponible en modal de fechas específicas
- ✅ Consistencia con la vista principal

## Cómo Usar la Funcionalidad

### En Dispositivos Móviles:
1. Mantén presionada una tarea
2. Desliza hacia la izquierda
3. Cuando aparezca el icono rojo de papelera, suelta para eliminar
4. Si cambias de opinión, desliza de vuelta o suelta antes del umbral

### En Desktop (con Mouse):
1. Haz click y mantén presionado sobre una tarea
2. Arrastra hacia la izquierda mientras mantienes presionado
3. Cuando aparezca el indicador rojo, suelta el mouse para eliminar

## Configuración Técnica

### Umbrales de Activación:
```typescript
const SWIPE_THRESHOLD = 80;     // Distancia mínima para eliminar (px)
const DELETE_THRESHOLD = 120;   // Distancia para mostrar indicador (px)
```

### Estados Manejados:
- `swipeOffset`: Distancia actual del deslizamiento
- `isDragging`: Si el usuario está deslizando actualmente
- `showDeleteButton`: Si mostrar el indicador visual

## Beneficios de la Implementación

### ✨ **Experiencia de Usuario Mejorada**
- Eliminación rápida e intuitiva de tareas
- Feedback visual claro del estado de la acción
- Prevención de eliminaciones accidentales

### 🔄 **Consistencia**
- Misma funcionalidad en todos los componentes de tarea
- Funciona igual en vista principal y calendario
- Comportamiento uniforme en móvil y desktop

### 🛡️ **Seguridad**
- Confirmación visual antes de eliminar
- Toast notification de confirmación
- Posibilidad de cancelar la acción

## Compatibilidad

- ✅ **React 18.3.1**
- ✅ **TypeScript**
- ✅ **Dispositivos táctiles** (iOS/Android)
- ✅ **Desktop browsers** (Chrome, Firefox, Safari, Edge)
- ✅ **Navegadores móviles**

## Próximas Mejoras Sugeridas

1. **Animación de "Undo"**: Opción para deshacer eliminación por unos segundos
2. **Vibración Táctil**: Feedback háptico en dispositivos compatibles
3. **Sonido de Eliminación**: Audio feedback opcional
4. **Deslizamiento para Completar**: Deslizar hacia la derecha para marcar como completada

---

## Notas Técnicas

La implementación utiliza:
- **Touch Events**: `touchstart`, `touchmove`, `touchend`
- **Mouse Events**: `mousedown`, `mousemove`, `mouseup`, `mouseleave`
- **CSS Transforms**: Para el movimiento fluido de las tarjetas
- **React Hooks**: `useState`, `useRef` para el manejo de estado
- **Lucide React**: Para los iconos de papelera

Esta funcionalidad mejora significativamente la usabilidad de la aplicación, permitiendo a los usuarios gestionar sus tareas de manera más eficiente y natural.