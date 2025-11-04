# 🚀 LLM.js Setup - Stebe AI sin dependencias externas

## ¿Qué es LLM.js?

**@themaximalist/llm.js** es una librería universal que ya está en tu proyecto.

✅ **Interfaz única** para todos los LLMs  
✅ **Soporta Ollama** (local, gratis, SIN API keys)  
✅ **También soporta** OpenAI, Google, Anthropic  
✅ **Ya instalado** en tu proyecto  

---

## 🎯 Lo que obtuviste

### Componente
- `src/components/SteebChatLLM.tsx` - Chat UI completo

### Servicio
- `src/services/llmService.ts` - Integración con LLM.js

---

## ⚡ Uso rápido

### Opción 1: Ollama (Recomendado - GRATIS y LOCAL)

```tsx
import SteebChatLLM from '@/components/SteebChatLLM';

export default function App() {
  return <SteebChatLLM />;
}
```

Cuando abras el componente:
1. Verás 4 opciones de LLM
2. Elige **Ollama** (recomendado)
3. Asegúrate que Ollama está corriendo localmente
4. ¡Listo!

### Opción 2: Servicio directo

```tsx
import llmService from '@/services/llmService';

// Inicializar con Ollama
const initialized = await llmService.initialize({
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'mistral'
});

// Usar
const response = await llmService.sendMessage('Hola Steeb');
```

---

## 📋 Requisitos por provider

### Ollama (Recomendado)
```bash
# 1. Instala Ollama desde https://ollama.ai
# 2. Abre terminal y ejecuta:
ollama run mistral

# ¡Listo! Se ejecuta en http://localhost:11434
```

**Ventajas:**
- ✅ Completamente gratis
- ✅ Totalmente privado (local)
- ✅ Sin API keys
- ✅ Funciona offline
- ✅ Muy rápido

**Desventajas:**
- ❌ Necesita instalar Ollama en tu máquina
- ❌ Usa recursos locales

---

### OpenAI
1. Ve a https://platform.openai.com/api/keys
2. Crea una API key
3. Pégala en el chat

**Ventajas:**
- ✅ Muy potente (GPT-4, GPT-3.5)
- ✅ Rápido

**Desventajas:**
- ❌ Requiere pago (crédito)
- ❌ Requiere API key

---

### Google Gemini
1. Ve a https://makersuite.google.com/app/apikey
2. Crea una API key gratis
3. Pégala en el chat

**Ventajas:**
- ✅ Gratis (limited)
- ✅ Muy potente

**Desventajas:**
- ❌ Limitaciones de cuota
- ❌ Requiere Google account

---

### Anthropic Claude
1. Ve a https://console.anthropic.com
2. Crea una API key
3. Pégala en el chat

**Ventajas:**
- ✅ Excelente calidad

**Desventajas:**
- ❌ Requiere pago
- ❌ Precio más alto

---

## 🎯 Configuración con Ollama

### Paso 1: Instalar Ollama

Descarga desde: https://ollama.ai

### Paso 2: Ejecutar un modelo

```bash
# Ejecutar en terminal
ollama run mistral
```

O elige otro modelo:
```bash
ollama run llama2
ollama run neural-chat
ollama run orca-mini
ollama run openchat
```

### Paso 3: Verificar conexión

Abre en navegador:
```
http://localhost:11434/api/tags
```

Deberías ver tus modelos en JSON.

### Paso 4: Usar en Stebe

1. Abre `SteebChatLLM`
2. Elige **Ollama**
3. Verifica que `http://localhost:11434` es correcto
4. Elige el modelo que ejecutaste
5. ¡Chat!

---

## 📖 Métodos disponibles

### Chat simple
```tsx
const response = await llmService.sendMessage('Tu mensaje');
```

### Analizar intención
```tsx
const analysis = await llmService.analyzeUserMessage(
  'Necesito aprender React'
);
// Responde: { intent, extractedTasks, priority }
```

### Motivación
```tsx
const motivation = await llmService.getMotivationalResponse({
  tasksPending: 5,
  userMood: 'tired'
});
```

### Generar plan
```tsx
const plan = await llmService.generateTaskPlan(
  'Quiero aprender TypeScript'
);
// Responde: { tasks, motivation, nextSteps }
```

### Verificar estado
```tsx
const ready = llmService.isReady();
const info = llmService.getProviderInfo();
// { provider, ready, requiresApiKey }
```

### Cambiar provider
```tsx
await llmService.switchProvider({
  provider: 'openai',
  apiKey: 'tu-api-key',
  model: 'gpt-3.5-turbo'
});
```

---

## ✅ Checklist rápido

### Para Ollama
- [ ] Instale Ollama desde ollama.ai
- [ ] Ejecuté `ollama run mistral` en terminal
- [ ] Importé `SteebChatLLM` en mi app
- [ ] Elijí Ollama en el chat
- [ ] ¡Funciona!

### Para OpenAI / Google
- [ ] Obtuve mi API key
- [ ] Importé `SteebChatLLM`
- [ ] Elijí el provider
- [ ] Pegué mi key
- [ ] ¡Funciona!

---

## 🆘 Troubleshooting

### "Connection refused" en Ollama
**Solución:**
- Verifica que ejecutaste `ollama run mistral`
- Verifica que Ollama está corriendo
- Intenta `http://localhost:11434` en navegador

### "API key inválida"
**Solución:**
- Copia la key sin espacios
- Verifica que sea la key correcta
- Intenta crear una nueva key

### "Respuesta lenta"
**Solución:**
- Si es Ollama, intenta modelo más pequeño: `orca-mini`
- Si es OpenAI, el servidor puede estar saturado
- Intenta de nuevo después

### "Modelo no encontrado"
**Solución:**
- Para Ollama: ejecuta `ollama pull mistral` primero
- Para otros: verifica el nombre del modelo

---

## 🧪 Testear los métodos

```tsx
import llmService from '@/services/llmService';

// En una función
const test = async () => {
  // Inicializar
  await llmService.initialize({ provider: 'ollama' });
  
  // Test 1: Chat simple
  const msg = await llmService.sendMessage('Hola');
  console.log('Test 1:', msg);
  
  // Test 2: Análisis
  const analysis = await llmService.analyzeUserMessage('Tengo 3 tareas');
  console.log('Test 2:', analysis);
  
  // Test 3: Motivación
  const mot = await llmService.getMotivationalResponse();
  console.log('Test 3:', mot);
  
  // Test 4: Plan
  const plan = await llmService.generateTaskPlan('Aprender React');
  console.log('Test 4:', plan);
};

test();
```

---

## 💡 Tips

### Para mejor performance
1. Usa Ollama con modelo pequeño (`orca-mini`)
2. O usa OpenAI (más rápido en general)
3. Limpia contexto si tarda: `llmService.clearContext()`

### Para privacidad total
1. Usa Ollama (todo local)
2. No necesitas internet
3. Tus datos nunca salen de tu máquina

### Para mejor calidad
1. Usa `mistral` o `neural-chat` en Ollama
2. O usa OpenAI GPT-4
3. O usa Anthropic Claude

---

## 🚀 Próximos pasos

1. **Elige tu provider:**
   - Ollama (LOCAL, GRATIS) ← Recomendado
   - OpenAI (Potente, costo bajo)
   - Google (Gratis limited)

2. **Configura:**
   - Ollama: `ollama run mistral`
   - Otros: Obtén tu API key

3. **Usa en tu app:**
   ```tsx
   <SteebChatLLM />
   ```

4. **¡Elimina procrastinación!** 🔥

---

## 📚 Modelos disponibles

### Ollama (Local)
- `mistral` - Muy bueno, balance
- `llama2` - Clásico, muy usado
- `neural-chat` - Optimizado para chat
- `orca-mini` - Pequeño, rápido
- `openchat` - Open source potente

### OpenAI
- `gpt-4` - Mejor, más caro
- `gpt-3.5-turbo` - Balance precio/calidad

### Google
- `gemini-pro` - Potente, gratis (limited)

### Anthropic
- `claude-3-opus` - Mejor, más caro
- `claude-3-sonnet` - Balance

---

## 🎊 ¡Listo!

Tu Stebe AI con LLM.js está configurado.

**Próximo paso:** Abre tu app y disfruta del chat.

---

**Más info:** https://llmjs.themaximalist.com/
**Ollama:** https://ollama.ai
