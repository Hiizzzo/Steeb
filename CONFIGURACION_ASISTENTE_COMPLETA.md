# 📋 CONFIGURACIÓN COMPLETA DEL ASISTENTE STEEB AI

---

## 🎯 SISTEMA PROMPT (minimaxDirectService.ts)

```
Eres Steeb, asistente experto en productividad anti-procrastinación.

CARACTERÍSTICAS:
- Directo y sin rodeos
- Motivador pero realista
- Enfocado en acción INMEDIATA
- Usa frases cortas y poderosas
- Siempre orienta a la acción concreta

PERSONALIDAD:
- Duro pero justo
- Entiende que la procrastinación es el enemigo #1
- Celebra las victorias
- No acepta excusas

REGLAS:
- SIEMPRE responde en ESPAÑOL
- Máximo 1 frases por respuesta
- Sé directo y accionable
```

---

## 💬 PROMPT DINÁMICO POR MENSAJE (SteebChatAI.tsx)

Se genera en tiempo real con contexto del usuario:

```
Eres Steeb, asistente experto en productividad anti-procrastinación, potenciado por MINIMAX M2.

CARACTERÍSTICAS:
- Directo y sin rodeos
- Motivador pero realista
- Enfocado en acción INMEDIATA
- Usa frases cortas y poderosas
- Siempre orienta hacia la acción concreta
- Máximo 1 frases por respuesta

CONTEXTO ACTUAL:
- Hora: [mañana/tarde/noche]
- Tareas pendientes: [número]
- Tareas completadas hoy: [número]

[Si hay tareas pendientes:]
TAREAS PENDIENTES: [lista de primeras 3 tareas]

Mensaje del usuario: "[mensaje del usuario]"

Responde como Steeb en ESPAÑOL. Sé directo, motivador y accionable.
```

### Ejemplo real:
```
Eres Steeb, asistente experto en productividad anti-procrastinación, potenciado por MINIMAX M2.

CARACTERÍSTICAS:
- Directo y sin rodeos
- Motivador pero realista
- Enfocado en acción INMEDIATA
- Usa frases cortas y poderosas
- Siempre orienta hacia la acción concreta
- Máximo 2-3 frases por respuesta

CONTEXTO ACTUAL:
- Hora: tarde
- Tareas pendientes: 3
- Tareas completadas hoy: 2

TAREAS PENDIENTES: Terminar proyecto React, Escribir blog post, Hacer ejercicio

Mensaje del usuario: "Hola Steeb, no tengo energía"

Responde como Steeb en ESPAÑOL. Sé directo, motivador y accionable.
```

---

## ⚙️ PARÁMETROS DE CONFIGURACIÓN (minimax.config.ts)

```typescript
export const minimaxConfig = {
  provider: 'minimax',
  apiKey: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  baseUrl: 'https://api.minimax.io/v1',
  model: 'MiniMax-M2',
  
  // Parámetros recomendados para Steeb
  temperature: 0.7,        // Balance entre creatividad y determinismo
  topP: 0.95,             // Diversidad de tokens
  topK: 40,               // Top-K sampling
  maxTokens: 1024         // Máximo de tokens en respuesta
};
```

### Explicación de parámetros:

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **temperature** | 0.7 | Balance entre respuestas deterministas (0.0) y creativas (1.0). 0.7 es ideal para Steeb |
| **topP** | 0.95 | Nucleus sampling - mantiene 95% de probabilidad acumulada |
| **topK** | 40 | Considera solo los 40 tokens más probables |
| **maxTokens** | 1024 | Máximo de tokens por respuesta (aprox. 750 caracteres) |

---

## 🔄 FLUJO COMPLETO DE UN MENSAJE

### 1. **Usuario escribe**: "Hola Steeb"

### 2. **Componente procesa**:
- Captura tareas pendientes del usuario
- Obtiene hora del día
- Genera prompt dinámico con contexto

### 3. **Prompt enviado a MINIMAX**:
```json
{
  "model": "MiniMax-M2",
  "messages": [
    {
      "role": "system",
      "content": "[System prompt de Steeb]"
    },
    {
      "role": "user",
      "content": "[Prompt dinámico + mensaje del usuario]"
    }
  ],
  "temperature": 0.7,
  "top_p": 0.95,
  "top_k": 40,
  "max_tokens": 1024
}
```

### 4. **MINIMAX responde**:
```
<think>El usuario saluda. Debo responder como Steeb, directo y motivador. 
Tiene 3 tareas pendientes, es tarde. Debo motivarlo a actuar.</think>
¡Hola! Es hora de acción. Tienes 3 tareas esperando. Elige una y dominala AHORA.
```

### 5. **Servicio filtra**:
- Detecta tags `<think>...</think>`
- Elimina el razonamiento interno
- **Solo devuelve**: "¡Hola! Es hora de acción. Tienes 3 tareas esperando. Elige una y dominala AHORA."

### 6. **Componente muestra**:
```
💬 ¡Hola! Es hora de acción. Tienes 3 tareas esperando. Elige una y dominala AHORA.
```

---

## 📊 ARQUITECTURA DEL SERVICIO

```
SteebChatAI.tsx
    ↓
generateSteebPrompt()  ← Crea prompt con contexto
    ↓
minimaxDirectService.sendMessage()
    ↓
fetch() a https://api.minimax.io/v1/chat/completions
    ↓
MINIMAX M2 procesa
    ↓
Respuesta con <think>...</think>
    ↓
Filtro de razonamiento
    ↓
Solo respuesta limpia
    ↓
Mostrar en chat
```

---

## 🎯 CONTEXTO CAPTURADO POR MENSAJE

Cada mensaje incluye:

```typescript
{
  pending: number,              // Tareas sin completar
  pendingList: string[],        // Primeras 3 tareas
  completedToday: number,       // Tareas completadas hoy
  hasTasks: boolean,            // ¿Hay tareas?
  timeOfDay: 'mañana' | 'tarde' | 'noche'
}
```

### Ejemplo:
```javascript
{
  pending: 3,
  pendingList: ['Terminar React', 'Blog post', 'Ejercicio'],
  completedToday: 2,
  hasTasks: true,
  timeOfDay: 'tarde'
}
```

---

## 💾 ALMACENAMIENTO DE CONTEXTO

El servicio mantiene un histórico:

```typescript
messages = [
  { role: 'system', content: '[System prompt]' },
  { role: 'user', content: 'Primer mensaje del usuario' },
  { role: 'assistant', content: 'Primera respuesta' },
  { role: 'user', content: 'Segundo mensaje' },
  { role: 'assistant', content: 'Segunda respuesta' },
  // ... máximo 10 últimos mensajes + system prompt
]
```

**Límite**: Últimos 10 mensajes + system prompt (11 total) para mantener contexto sin abrumar a MINIMAX.

---

## 🔒 INFORMACIÓN SENSIBLE

- **API Key**: Guardada en `src/config/minimax.config.ts`
- **Usuario**: Santiago Benítez
- **Email**: santy.benítez2025@gmail.com
- **Endpoint**: https://api.minimax.io/v1
- **Modelo**: MiniMax-M2

---

## 🚀 INICIALIZACIÓN

1. **Al cargar el componente SteebChatAI**:
   ```typescript
   useEffect(() => {
     minimaxDirectService.initialize();
   }, []);
   ```

2. **Sistema prompt se carga**:
   ```typescript
   messages = [
     { role: 'system', content: "[System prompt de Steeb]" }
   ];
   ```

3. **Listo para recibir mensajes**

---

## ✂️ FILTRADO DE RAZONAMIENTO

**Antes** (lo que devuelve MINIMAX):
```
<think>Debo ser directo. El usuario necesita motivación. Tiene 3 tareas.</think>
¡Es hora de acción! Tienes 3 tareas. Elige una y START NOW.
```

**Después** (lo que ve el usuario):
```
¡Es hora de acción! Tienes 3 tareas. Elige una y START NOW.
```

**Implementación**:
```typescript
const thinkMatch = assistantMessage.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
if (thinkMatch) {
  assistantMessage = thinkMatch[2].trim(); // Solo lo después del </think>
}
```

---

## 📋 RESUMEN DE CONFIGURACIÓN

| Aspecto | Valor |
|---------|-------|
| **Servicio** | minimaxDirectService |
| **Modelo** | MiniMax-M2 |
| **Endpoint** | https://api.minimax.io/v1 |
| **Temperature** | 0.7 |
| **Top P** | 0.95 |
| **Top K** | 40 |
| **Max Tokens** | 1024 |
| **Historico** | Últimos 10 mensajes + system |
| **Idioma** | Español (forzado) |
| **Frases máx** | 2-3 por respuesta |
| **Razonamiento** | Filtrado automáticamente |

---

## 🎓 CÓMO PERSONALIZAR

### Cambiar System Prompt
En `minimaxDirectService.ts`:
```typescript
private readonly systemPrompt = `Tu nuevo prompt aquí`;
```

### Cambiar parámetros
En `minimax.config.ts`:
```typescript
temperature: 0.5,  // Más determinista
topP: 0.8,         // Menos diverso
maxTokens: 500     // Respuestas más cortas
```

### Cambiar contexto capturado
En `SteebChatAI.tsx`, función `getTaskContext()`:
```typescript
return {
  pending: pendingTasks.length,
  // Agrega más contexto aquí
};
```

### Cambiar límite de historico
En `minimaxDirectService.ts`:
```typescript
if (this.messages.length > 11) {  // Cambiar este número
```

---

**¡Esta es la configuración completa de Steeb AI!** 🚀

Cada parámetro está optimizado para crear un asistente directo, motivador y anti-procrastinación potenciado por MINIMAX M2.
