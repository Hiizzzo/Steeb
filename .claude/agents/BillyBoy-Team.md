# Billy Boy Team - Configuración del Grupo Coordinado

## Estructura del Equipo

Este archivo define la estructura del grupo "Billy Boy" coordinado por **Santy (CEO)**.

### 🏆 **Jerarquía del Equipo**

```
        SANTY (CEO/Director)
              ↓
    ┌─────────────────────────┐
    │    Equipo Billy Boy    │
    └─────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│  Alan │ Choche │ Franco │ Luis │ Lando │       │
│  Nikito│ Joaco  │ Mario  │      │       │       │
└─────────────────────────────────────────────────┘
```

## Configuración de Delegación Automática

### **Reglas de Enrutamiento de Tareas**

Santy automáticamente enruta tareas según estas reglas:

#### 🔧 **Tareas Técnicas**
- Keywords: `código`, `bug`, `fix`, `optimizar`, `build`, `test`
- Agente primario: **Alan**
- Agente de respaldo: **Santy**

#### 🎪 **Tareas Creativas/Virales**
- Keywords: `viral`, `marketing`, `ideas`, `engagement`, `gamificación`
- Agente primario: **Choche**
- Apoyo: **Lando** (diseño), **Nikito** (motivación)

#### 📊 **Tareas de Análisis**
- Keywords: `métricas`, `datos`, `análisis`, `feedback`, `usuarios`
- Agente primario: **Franco**
- Apoyo: **Joaco** (estrategia)

#### 🎮 **Tareas de Features Especiales**
- Keywords: `easter egg`, `secreto`, `sorpres`, `especial`
- Agente primario: **Luis**
- Apoyo: **Choche** (viralidad), **Lando** (UX)

#### 🎨 **Tareas de Diseño**
- Keywords: `diseño`, `UI`, `UX`, `interfaz`, `visual`
- Agente primario: **Lando**
- Apoyo: **Franco** (feedback usuarios)

#### 💪 **Tareas de Comunicación**
- Keywords: `mensaje`, `usuarios`, `motivación`, `comunicación`
- Agente primario: **Nikito**
- Apoyo: **Joaco** (moderación)

#### 🤝 **Tareas de Coordinación**
- Keywords: `equipo`, `prioridad`, `decidir`, `mediar`
- Agente primario: **Joaco**
- Apoyo: **Santy** (validación final)

#### ⏰ **Tareas de Planificación**
- Keywords: `planificar`, `deadline`, `proyecto`, `roadmap`
- Agente primario: **Mario**
- Apoyo: **Joaco** (priorización)

## Protocolo de Coordinación Multi-Agente

### **Escenario 1: Tareas Simples**
1. Santy analiza la solicitud
2. Identifica al agente especializado
3. Delega la tarea completa
4. Recibe resultado y presenta al usuario

### **Escenario 2: Tareas Complejas (Múltiples Especialidades)**
1. Santy descompone la tarea en sub-tareas
2. Asigna cada sub-tarea al agente correspondiente
3. Coordina la ejecución en paralelo o secuencia según sea necesario
4. Sintetiza los resultados parciales
5. Presenta resultado integrado

### **Escenario 3: Tareas Estratégicas**
1. Santy involucra a múltiples agentes en brainstorming
2. Joaco facilita la discusión y priorización
3. Franco aporta datos y métricas relevantes
4. Santy toma decisión final basada en consenso
5. Mario crea plan de implementación

## Integración con Workflow

Para usar el equipo Billy Boy coordinado por Santy:

```
/santy "Quiero [descripción de la tarea]"
```

Santy automáticamente:
- Analizará la solicitud
- Seleccionará el/los agentes apropiados
- Coordinará la ejecución
- Presentará resultados integrados

## Ejemplos de Uso

### Comando: `/santy "Necesito arreglar el performance de la app"`
**Flujo:**
1. Santy detecta: tarea técnica
2. Delega a Alan: análisis de performance
3. Alan identifica bottleneck específicos
4. Alan propone soluciones técnicas
5. Santy presenta plan de acción al usuario

### Comando: `/santy "Quiero hacer marketing viral de STEEB"`
**Flujo:**
1. Santy detecta: tarea marketing viral (compleja)
2. Delega en paralelo:
   - Choche: ideas virales
   - Franco: análisis de mercado
   - Lando: material visual
   - Nikito: mensajes motivacionales
3. Sintetiza resultados en campaña integral
4. Presenta estrategia completa

## Configuración Técnica

Para implementar esta configuración, asegúrate de:

1. **Agentes individuales configurados** en archivos `.md` separados
2. **Santy como agente principal** con acceso a todos los otros
3. **Reglas de enrutamiento** implementadas en la lógica de Santy
4. **Protocolo de comunicación** entre agentes establecido

Este sistema permite una gestión eficiente de tareas complejas aprovechando las fortalezas específicas de cada agente del equipo Billy Boy.