# 📊 Productivity Stats Dashboard

Una vista móvil responsiva de estadísticas de productividad con diseño minimalista en blanco y negro, inspirada en el estilo Stebe.

## ✨ Características

- **Diseño minimalista**: Paleta de colores blanco y negro con toques de gris
- **Responsive**: Optimizado para dispositivos móviles
- **Animaciones suaves**: Animaciones CSS elegantes y profesionales
- **Componentes modulares**: Versión HTML y React disponibles
- **Tipografía moderna**: Fuente Inter para máxima legibilidad

## 🎨 Componentes Incluidos

### 1. Header con Stebe Character
- Personaje Stebe dibujado en SVG
- Texto motivacional: "Tu esfuerzo es tu mejor inversión"
- Animaciones de entrada desde izquierda y derecha

### 2. KPI Cards
- **Tasks Completadas**: 12/20 con barra de progreso animada
- **Streak**: 3-Day con ícono de medalla
- **Time Spent**: 4h 30m

### 3. Weekly Activity Chart
- Gráfico de línea SVG con animación de dibujo
- Punto activo con animación pulse
- Grilla de fondo sutil

### 4. Task Statistics
- Gráfico donut con 59% de completación
- Animación de dibujo circular
- Barra de progreso horizontal

### 5. Consistency Streak
- Barras verticales para cada día de la semana
- Animación secuencial de crecimiento
- Etiquetas de días

## 🚀 Uso

### Versión HTML
Simplemente abre el archivo `productivity-stats.html` en tu navegador:

```bash
open productivity-stats.html
```

### Versión React

1. **Instala las dependencias**:
```bash
npm install react react-dom
```

2. **Importa el componente**:
```jsx
import ProductivityStats from './ProductivityStats';
import './ProductivityStats.css';

function App() {
  return (
    <div className="App">
      <ProductivityStats />
    </div>
  );
}
```

3. **Personaliza los datos**:
```jsx
// Puedes modificar los valores en el componente
const kpiData = {
  tasksCompleted: "15-20",
  streak: "5-Day",
  timeSpent: "6h 15m"
};
```

## 🎯 Animaciones Incluidas

- **fadeInLeft/Right**: Entrada del header
- **fadeInUp**: Entrada escalonada de las KPI cards
- **progressGrow**: Crecimiento de barras de progreso
- **drawLine**: Dibujo de línea del gráfico semanal
- **drawDonut**: Dibujo del gráfico circular
- **growUp**: Crecimiento de barras de consistencia
- **pulse**: Pulsación del punto activo en el gráfico

## 📱 Responsive Breakpoints

- **400px**: Diseño móvil principal
- **375px**: Ajustes para móviles pequeños
- **320px**: Grilla de una columna para pantallas muy pequeñas

## 🛠️ Personalización

### Colores
```css
:root {
  --primary-black: #000000;
  --background-white: #ffffff;
  --text-gray: #666666;
  --border-gray: #e5e5e5;
}
```

### Tipografía
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Timing de Animaciones
Las animaciones están configuradas con delays específicos para crear una secuencia fluida:
- Header: 0.2s - 0.4s
- KPI Cards: 0.6s - 1.0s
- Charts: 1.6s - 4.0s

## 📁 Estructura de Archivos

```
├── productivity-stats.html     # Versión HTML standalone
├── ProductivityStats.jsx       # Componente React principal
├── ProductivityStats.css       # Estilos CSS
├── App.jsx                     # Ejemplo de uso
├── App.css                     # Estilos del contenedor
└── README.md                   # Documentación
```

## 🎨 Estilo Stebe

El diseño sigue los principios del estilo Stebe:
- **Minimalismo**: Sin elementos innecesarios
- **Claridad**: Jerarquía visual clara
- **Motivación**: Mensajes positivos y alentadores
- **Profesionalismo**: Diseño limpio y moderno
- **Funcionalidad**: Cada elemento tiene un propósito

## 🔧 Tecnologías

- **HTML5**: Estructura semántica
- **CSS3**: Animaciones y diseño responsive
- **SVG**: Gráficos vectoriales escalables
- **React**: Componentes modulares (opcional)
- **Inter Font**: Tipografía moderna

## 💡 Próximas Mejoras

- [ ] Integración con datos en tiempo real
- [ ] Temas personalizables
- [ ] Más tipos de gráficos
- [ ] Exportación de métricas
- [ ] Modo oscuro

---

**¡Tu esfuerzo es tu mejor inversión!** 💪
