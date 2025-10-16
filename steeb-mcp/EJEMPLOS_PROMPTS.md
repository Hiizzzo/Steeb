# 💬 Ejemplos de Prompts para ChatGPT + STEBE

Una vez que hayas conectado ChatGPT con tu servidor MCP, puedes usar estos prompts para aprovechar al máximo la integración.

---

## 🔍 Exploración del Proyecto

### Ver la arquitectura completa
```
¿Cuál es la arquitectura de mi app STEBE? Dame un resumen del stack tecnológico y la estructura de carpetas.
```

### Listar componentes
```
Lista todos los componentes React de mi aplicación STEBE
```

### Ver stores de estado
```
Muéstrame qué stores de Zustand tengo y qué hace cada uno
```

### Explorar servicios
```
¿Qué servicios de backend tengo configurados? Muéstrame los servicios de Firebase
```

---

## 📂 Lectura de Código

### Leer un componente específico
```
Muéstrame el código completo del componente TaskList
```

### Leer un archivo de configuración
```
Lee el archivo vite.config.ts y explícame qué hace cada parte
```

### Ver tipos TypeScript
```
Muéstrame todas las definiciones de tipos TypeScript de la app
```

### Leer un store
```
Lee el archivo src/store/useTaskStore.ts y explícame cómo funciona
```

---

## 🔎 Búsqueda de Código

### Buscar uso de una librería
```
Busca dónde se usa Firebase en todo el proyecto
```

### Buscar un hook específico
```
Busca todos los lugares donde se usa useEffect en archivos .tsx
```

### Buscar una función
```
Busca la función "addTask" en el código
```

### Buscar imports
```
Busca todos los imports de React Query en el proyecto
```

---

## 🐛 Debugging

### Analizar un error específico
```
Tengo este error en la consola: "Cannot read property 'map' of undefined" 
en TaskCard.tsx línea 45. ¿Qué está pasando y cómo lo soluciono?
```

### Debuggear un componente
```
El componente Calendar no muestra las tareas recurrentes correctamente. 
Analiza el código y dime qué puede estar fallando.
```

### Revisar un flujo completo
```
Las tareas no se están guardando en Firebase. Revisa todo el flujo desde 
el formulario AddTaskForm hasta el servicio de Firebase y dime dónde está el problema.
```

### Analizar rendimiento
```
El componente TaskList es muy lento cuando hay muchas tareas. 
Analiza el código y sugiere optimizaciones.
```

---

## 💡 Mejoras y Refactorización

### Sugerir mejoras generales
```
Revisa el componente TaskCard y sugiere 3 mejoras que pueda implementar
```

### Optimización de rendimiento
```
¿Cómo puedo optimizar el rendimiento del calendario? 
Analiza los componentes relacionados y dame sugerencias específicas.
```

### Refactorización
```
Ayúdame a refactorizar el componente AddTaskForm para separar 
la lógica de negocio en un custom hook
```

### Mejora de accesibilidad
```
Revisa el componente TaskList y dime qué mejoras de accesibilidad 
(a11y) debería implementar
```

---

## 📚 Explicaciones

### Explicar un componente
```
Explícame paso a paso cómo funciona el componente Calendar y 
qué hace cada parte del código
```

### Explicar un sistema completo
```
Explícame cómo funciona el sistema de recurrencia de tareas en STEBE. 
¿Qué archivos están involucrados y cómo se comunican?
```

### Explicar integración
```
Explícame cómo está integrado Firebase con la app. 
¿Qué servicios uso y cómo se configuran?
```

### Explicar flujo de datos
```
Explícame el flujo de datos desde que el usuario crea una tarea 
hasta que se muestra en el calendario
```

---

## 🧪 Testing

### Generar tests
```
Genera tests completos para el componente AddTaskForm usando 
Jest y React Testing Library
```

### Revisar cobertura
```
¿Qué componentes críticos no tienen tests? Dame una lista priorizada
```

### Sugerir casos de prueba
```
Para el componente TaskCard, ¿qué casos de prueba debería implementar?
```

---

## 🎨 UI/UX

### Revisar diseño
```
Revisa el componente TaskCard y sugiere mejoras de UX
```

### Mejorar responsive
```
El componente Calendar no se ve bien en móvil. 
Analiza el código y sugiere mejoras responsive
```

### Consistencia de diseño
```
Revisa todos los componentes de formulario y dime si hay 
inconsistencias en el diseño
```

---

## 🔐 Seguridad

### Revisar autenticación
```
Revisa el código de autenticación con Firebase y dime si hay 
problemas de seguridad
```

### Validación de datos
```
Revisa el componente AddTaskForm y dime si la validación de datos es suficiente
```

### Manejo de errores
```
Revisa cómo manejo los errores en los servicios de Firebase. 
¿Hay mejoras que pueda implementar?
```

---

## 📊 Análisis de Código

### Complejidad
```
Analiza la complejidad del componente Calendar. 
¿Es demasiado complejo? ¿Debería dividirlo?
```

### Dependencias
```
¿Qué componentes dependen del store useTaskStore? 
Dame un mapa de dependencias
```

### Código duplicado
```
Busca código duplicado en los componentes de formulario y 
sugiere cómo eliminarlo
```

---

## 🚀 Nuevas Funcionalidades

### Planear nueva feature
```
Quiero agregar notificaciones push a la app. 
Analiza la estructura actual y dame un plan de implementación paso a paso
```

### Integración de librería
```
Quiero integrar React Query para el manejo de datos. 
Analiza el código actual y dime cómo hacerlo sin romper nada
```

### Migración
```
Quiero migrar de Zustand a Redux Toolkit. 
Analiza todos los stores y dame un plan de migración
```

---

## 🔧 Configuración

### Revisar configuración
```
Revisa mi configuración de Vite y dime si hay optimizaciones que pueda agregar
```

### Configuración de build
```
Analiza mi configuración de build y sugiere mejoras para producción
```

### Variables de entorno
```
Revisa cómo manejo las variables de entorno. ¿Hay mejoras de seguridad?
```

---

## 📝 Documentación

### Generar documentación
```
Genera documentación completa para el componente TaskList 
incluyendo props, ejemplos de uso, y casos especiales
```

### README de componente
```
Crea un README.md para el componente Calendar explicando 
cómo usarlo y qué props acepta
```

### Comentarios de código
```
Revisa el componente AddTaskForm y agrega comentarios JSDoc 
donde sea necesario
```

---

## 🎯 Casos de Uso Avanzados

### Análisis completo de feature
```
Analiza toda la funcionalidad de tareas recurrentes:
1. ¿Qué componentes están involucrados?
2. ¿Cómo fluyen los datos?
3. ¿Hay bugs potenciales?
4. ¿Qué mejoras sugieres?
5. ¿Qué tests faltan?
```

### Auditoría de código
```
Haz una auditoría completa del código relacionado con autenticación:
- Seguridad
- Manejo de errores
- UX
- Performance
- Tests
```

### Plan de optimización
```
Analiza toda la app y dame un plan de optimización priorizado:
1. Problemas críticos
2. Mejoras de rendimiento
3. Mejoras de UX
4. Refactorizaciones recomendadas
```

---

## 💡 Tips para Mejores Resultados

1. **Sé específico**: Menciona archivos, componentes, o líneas específicas
2. **Da contexto**: Explica qué intentas lograr
3. **Pide ejemplos**: "Dame un ejemplo de código" funciona mejor que solo "explícame"
4. **Itera**: Si la primera respuesta no es perfecta, pide aclaraciones
5. **Combina prompts**: Puedes hacer preguntas complejas que combinen varios aspectos

---

## 🎓 Prompts de Aprendizaje

### Entender un patrón
```
Explícame el patrón de diseño que uso en los componentes de formulario. 
¿Es un buen patrón? ¿Hay alternativas mejores?
```

### Mejores prácticas
```
Revisa el componente TaskList y dime si sigo las mejores prácticas 
de React. ¿Qué debería mejorar?
```

### Comparar enfoques
```
Muéstrame dos formas diferentes de implementar el componente Calendar: 
la forma actual y una alternativa más moderna
```

---

**¡Experimenta con estos prompts y descubre todo lo que ChatGPT puede hacer con acceso a tu código!** 🚀

Tu esfuerzo es tu mejor inversión 💪
