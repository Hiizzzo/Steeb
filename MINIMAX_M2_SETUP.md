# ⚡ MINIMAX M2 Setup - Stebe AI

## 🎯 ¿Qué es MINIMAX M2?

**Modelo IA potente especializado en coding y agentic workflows**

- 🚀 **230 billones parámetros** (10B activados)
- 📝 **Excelente para código** - Multi-file editing, coding tasks
- 🧠 **Context window** - Hasta 200,000+ tokens
- ⚡ **Muy rápido** - Optimizado para latencia baja
- 🔧 **Tool calling** - Puede llamar herramientas externas
- 💰 **Precio bajo** - Competitive pricing

---

## 🚀 Empezar en 2 pasos

### Paso 1: Obtener API Key

**Opción A - Plataforma oficial MINIMAX**
1. Ve a: https://platform.minimax.io/
2. Regístrate
3. Obtén tu API key
4. Guárdala seguro

**Opción B - A través de CometAPI**
1. Ve a: https://www.cometapi.com/
2. Busca MINIMAX M2
3. Obtén tu API key

### Paso 2: Usar en Stebe

1. Abre el chat de Stebe
2. Elige **MINIMAX M2** (ahora es la opción por defecto)
3. Pega tu API key
4. ¡Listo!

---

## 🔧 Configuración

### En el componente (ya configurado)

```tsx
import SteebChatLLM from '@/components/SteebChatLLM';

<SteebChatLLM />
```

El componente viene con MINIMAX M2 por defecto.

### En el servicio (manual)

```tsx
import llmService from '@/services/llmService';

await llmService.initialize({
  provider: 'minimax',
  apiKey: 'tu-api-key',
  model: 'MiniMax-M2',
  baseUrl: 'https://api.minimax.io/v1' // Por defecto
});

// Usar
const response = await llmService.sendMessage('Tu mensaje');
```

---

## 📊 Características

### Excelente en:
- ✅ Generación de código
- ✅ Debugging y fix loops
- ✅ Múltiples archivos
- ✅ Tareas de reasoning
- ✅ Tool calling

### Ideal para:
- 💻 Asistentes de coding
- 🤖 Agentes autónomos
- 🔄 Flujos multi-paso
- 📝 Análisis de código
- 🛠️ Automatización

---

## 🎓 Ejemplos de uso

### Chat simple
```tsx
const response = await llmService.sendMessage(
  'Analiza este código y sugiere mejoras'
);
```

### Análisis
```tsx
const analysis = await llmService.analyzeUserMessage(
  'Necesito refactorizar mi componente React'
);
```

### Motivación
```tsx
const motivation = await llmService.getMotivationalResponse({
  tasksPending: 3,
  userMood: 'focused'
});
```

### Plan
```tsx
const plan = await llmService.generateTaskPlan(
  'Quiero aprender TypeScript avanzado'
);
```

---

## 💰 Pricing

MINIMAX M2 tiene pricing competitivo:
- **Input tokens:** $0.15/1M tokens (aprox)
- **Output tokens:** $0.60/1M tokens (aprox)

Para uso en Stebe, el costo es muy bajo.

---

## 📝 Parámetros recomendados

Para Stebe, usar:
- **Temperature:** 0.7 (balance creativo/preciso)
- **Top P:** 0.95 (diversidad controlada)
- **Top K:** 40 (buena variedad)
- **Max tokens:** 1024 (respuestas completas)

---

## 🆘 Troubleshooting

### "API key inválida"
**Solución:**
- Verifica que copiaste la key sin espacios
- Intenta generar una nueva key
- Asegúrate de que esté en el formato correcto

### "Respuesta vacía"
**Solución:**
- Intenta un mensaje más específico
- Verifica que la API key tiene crédito/cuota
- Intenta de nuevo después

### "Respuesta lenta"
**Solución:**
- MINIMAX es generalmente rápido
- Puede ser tu conexión
- Intenta en otro navegador

### "Modelo no encontrado"
**Solución:**
- Verifica que uses `MiniMax-M2` (correcto)
- Que la API key esté activa

---

## ✅ Checklist

- [ ] Leí esta guía
- [ ] Obtuve mi API key en https://platform.minimax.io/
- [ ] Abrí el chat de Stebe
- [ ] Elijí MINIMAX M2
- [ ] Pegué mi API key
- [ ] El chat funciona
- [ ] ¡Estoy usando Stebe AI!

---

## 🎊 Ventajas de MINIMAX M2 para Stebe

✅ **Muy potente** - 230B parámetros  
✅ **Rápido** - Optimizado para latencia  
✅ **Económico** - Pricing bajo  
✅ **Context largo** - 200K+ tokens  
✅ **Tool calling** - Puede integrar herramientas  
✅ **Perfecto para coding** - Si quieres análisis de código en Stebe  

---

## 📚 Recursos

- **MINIMAX oficial:** https://platform.minimax.io/
- **CometAPI:** https://www.cometapi.com/
- **Documentación:** https://platform.minimax.io/docs/

---

**¡MINIMAX M2 está listo en Stebe! 🚀**

Usa tu API key y empieza a eliminar procrastinación con IA potente.
