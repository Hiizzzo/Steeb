# ✅ MINIMAX M2 - Setup Completo

**Stebe AI ahora soporta MINIMAX M2 - IA potente para productividad**

---

## 🎯 Cambios realizados

### ✅ Servicio actualizado
- `src/services/llmService.ts` - Agrega soporte MINIMAX M2
  - Endpoint: `https://api.minimax.io/v1`
  - Modelo por defecto: `MiniMax-M2`
  - Compatible con OpenAI SDK

### ✅ Componente actualizado
- `src/components/SteebChatLLM.tsx` - UI para MINIMAX
  - MINIMAX M2 es la opción por defecto
  - Panel para pegar API key
  - Setup automático

### ✅ Documentación
- `MINIMAX_M2_SETUP.md` - Guía completa

---

## 🚀 Usar ahora (2 pasos)

### 1. Obtener API Key
```
https://platform.minimax.io/ → Regístrate → Obtén key
```

### 2. Usar en Stebe
```tsx
import SteebChatLLM from '@/components/SteebChatLLM';

<SteebChatLLM />
```

Selecciona **MINIMAX M2** y pega tu API key.

---

## ✨ Por qué MINIMAX M2?

| Aspecto | MINIMAX M2 |
|---------|-----------|
| **Parámetros** | 230B (10B activos) |
| **Especialidad** | Coding + Agentic tasks |
| **Context window** | 200K+ tokens |
| **Velocidad** | Muy rápido |
| **Pricing** | Competitivo |
| **Tool calling** | Sí |

**Perfecto para Stebe** - Especializado en tareas complejas y reasoning.

---

## 🔧 Configuración completa

### Automática (por defecto)
```tsx
// MINIMAX M2 ya está configurado
<SteebChatLLM />
```

### Manual
```tsx
await llmService.initialize({
  provider: 'minimax',
  apiKey: 'tu-api-key',
  model: 'MiniMax-M2',
  baseUrl: 'https://api.minimax.io/v1'
});
```

---

## 🎓 Métodos disponibles

### Chat
```tsx
const response = await llmService.sendMessage('mensaje');
```

### Análisis
```tsx
const analysis = await llmService.analyzeUserMessage('texto');
// { intent, extractedTasks, priority }
```

### Motivación
```tsx
const motivation = await llmService.getMotivationalResponse({
  tasksPending: 5
});
```

### Plan
```tsx
const plan = await llmService.generateTaskPlan('objetivo');
// { tasks, motivation, nextSteps }
```

---

## 📁 Archivos modificados

```
src/
├── services/
│   └── llmService.ts              ✏️ Agregué MINIMAX
├── components/
│   └── SteebChatLLM.tsx           ✏️ Agregué MINIMAX (por defecto)
└── ...

stebe/
├── MINIMAX_M2_SETUP.md            ✨ NUEVO
├── SETUP_MINIMAX_COMPLETO.md      ✨ NUEVO (este)
└── ...
```

---

## ✅ Checklist para probar

- [ ] Leo `MINIMAX_M2_SETUP.md`
- [ ] Obtengo API key en https://platform.minimax.io/
- [ ] Importo `SteebChatLLM` en mi app
- [ ] Abrí el componente en el navegador
- [ ] Selecciono MINIMAX M2
- [ ] Pego mi API key
- [ ] ¡Chat funciona!
- [ ] Envío mensajes
- [ ] Recibo respuestas

---

## 🎊 Ventajas finales

✅ **Ya integrado** - No requiere instalación extra  
✅ **Por defecto** - MINIMAX M2 es la opción principal  
✅ **Potente** - 230B parámetros  
✅ **Rápido** - Optimizado para latencia  
✅ **Económico** - Pricing competitivo  
✅ **Flexible** - También soporta Ollama, OpenAI, Google, Anthropic  
✅ **Listo** - Sin cambios en Git, archivos nuevos  

---

## 🚀 Próximos pasos

### HOY
1. Obtén API key en https://platform.minimax.io/
2. Lee `MINIMAX_M2_SETUP.md`
3. Importa `SteebChatLLM` en tu app
4. ¡Prueba!

### DESPUÉS
1. Personaliza prompts en `llmService.ts`
2. Integra en tus componentes
3. Experimenta con parámetros
4. ¡Elimina procrastinación con IA potente!

---

## 📞 Info rápida

**¿Cómo funciona MINIMAX M2?**
- Usa OpenAI SDK compatible
- Endpoint: `https://api.minimax.io/v1`
- Autenticación: API key en headers

**¿Por qué está por defecto?**
- Muy potente
- Buenas características
- Pricing razonable
- Excelente para Stebe

**¿Puedo cambiar a otro?**
- Sí, el chat tiene 5 opciones
- Ollama, OpenAI, Google, Anthropic
- También MINIMAX M2

---

## 🎯 Estado final

✅ **MINIMAX M2 integrado** en Stebe AI  
✅ **Por defecto** en SteebChatLLM  
✅ **Documentación completa** en MINIMAX_M2_SETUP.md  
✅ **Listo para probar** con tu API key  
✅ **Sin cambios en Git** - Archivo nuevos  
✅ **Flexible** - Sigue soportando otros providers  

---

**¡Stebe AI con MINIMAX M2 está LISTO! ⚡**

Obtén tu API key y empieza a usar IA potente para eliminar procrastinación.

---

*Configurado: 4 de Noviembre 2025*  
*Para Santiago*  
*Eliminando procrastinación con IA* 🔥
