# 🚀 START HERE - Integración Groq AI en Steeb

## ¿Qué acabo de recibir?

Una **integración completa y gratuita de IA** para tu app Steeb usando Groq.

✅ **Completamente funcional**  
✅ **Sin costo** (Groq es gratis)  
✅ **Fácil de usar**  
✅ **Listo para producción**  

---

## 📋 En 3 pasos

### 1️⃣ Obtener API Key (2 min)
```
1. Ve a: https://console.groq.com/keys
2. Crea cuenta (gratis, usa GitHub)
3. Copia la API key
```

### 2️⃣ Copiar & Pegar (1 min)
Elige una opción:

**Opción A - Chat completo** (Recomendado)
```tsx
import SteebChatGroq from '@/components/SteebChatGroq';

export default function Page() {
  return <SteebChatGroq />;
}
```

**Opción B - Servicio directo**
```tsx
import groqService from '@/services/groqService';

const response = await groqService.sendMessage('Tu mensaje');
```

**Opción C - Probar demos**
```tsx
import SteebAIDemo from '@/components/SteebAIDemo';

<SteebAIDemo />
```

### 3️⃣ Usar (2 min)
Abre la app → Pega tu API key → ¡Listo!

---

## 📁 Qué hay en esta carpeta

### Componentes (usa en tu app)
- **SteebChatGroq.tsx** - Chat UI completo, solo importa y usa
- **SteebAIDemo.tsx** - 4 demos para aprender cómo funciona

### Servicios (funcionalidad)
- **groqService.ts** - Toda la lógica de IA

### Configuración
- **steebAiConfig.ts** - Prompts y settings centralizados

### Documentación
- **GROQ_QUICK_START.md** - Inicio en 5 minutos ⭐ LEE ESTO
- **GROQ_AI_SETUP.md** - Guía completa con 15+ ejemplos
- **COPY_PASTE_EXAMPLES.md** - 10 ejemplos listos para usar
- **GROQ_INDEX.md** - Índice completo de todo

---

## 🎯 Elige tu caso de uso

### Solo quiero chat IA
→ Usa `SteebChatGroq` directamente

### Quiero integrar IA en mis componentes
→ Lee `COPY_PASTE_EXAMPLES.md`

### Quiero personalizar todo
→ Lee `GROQ_AI_SETUP.md`

### Quiero probar primero
→ Abre `SteebAIDemo`

### Necesito documentación completa
→ Lee `GROQ_INDEX.md`

---

## ⚡ Ejemplo SUPER rápido

```tsx
// 1. Importar
import SteebChatGroq from '@/components/SteebChatGroq';

// 2. Usar
<SteebChatGroq />

// 3. ¡Listo!
```

**Eso es TODO.** El componente maneja:
- Pedir la API key
- Guardarla en localStorage
- Conectarse a Groq
- Hacer chat inteligente

---

## 🔑 Tu API Key

```
⚠️ MUY IMPORTANTE:
- La key se guarda en localStorage (tu navegador)
- No se envía a servidores externos (excepto Groq)
- Es completamente privada
- Puedes borrarla cuando quieras
```

Obtener gratis en: https://console.groq.com/keys

---

## 🎓 Funcionalidades

### Chat simple
```tsx
const msg = await groqService.sendMessage('Hola');
```

### Analizar intención
```tsx
const analysis = await groqService.analyzeUserMessage(
  'Necesito aprender React'
);
// Responde: { intent, extractedTasks, priority, ... }
```

### Generar tareas
```tsx
const tasks = await groqService.generateSmartTasks(
  'Quiero terminar mi proyecto',
  { timeAvailable: '3 hours' }
);
// Responde: { tasks[], motivation, nextSteps[] }
```

### Respuesta contextual
```tsx
const response = await groqService.getIntelligentResponse(
  'Estoy cansado',
  { userMood: 'tired', recentTasks: [...] }
);
```

---

## ✨ Lo que hace Steeb AI

- 💬 **Chat inteligente** - Entiende tu contexto
- 📊 **Análisis automático** - Extrae tareas de tus mensajes
- 📋 **Generación de planes** - Crea planes de acción automáticamente
- 🔥 **Motivación** - Respuestas motivacionales personalizadas
- 🧠 **Contextual** - Entiende tus tareas, tu humor, la hora del día

---

## 🚨 Troubleshooting rápido

| Problema | Solución |
|----------|----------|
| "Necesitas API key" | Ve a console.groq.com/keys y crea una |
| "API key inválida" | Verifica sin espacios al inicio/final |
| "No funciona" | Abre console (F12) para ver errores |
| "Respuestas lentas" | Groq es muy rápido, es tu conexión |

---

## 📚 Recursos

| Documento | Para qué |
|-----------|----------|
| **GROQ_QUICK_START.md** | Empezar rápido (5 min) |
| **COPY_PASTE_EXAMPLES.md** | Copiar & pegar código |
| **GROQ_AI_SETUP.md** | Entender todo (completo) |
| **GROQ_INDEX.md** | Ver qué hay en esta carpeta |
| **SteebAIDemo.tsx** | Probar en vivo |

---

## 💡 Tips

1. **Primero**: Obtén tu API key
2. **Segundo**: Importa `SteebChatGroq` en una página
3. **Tercero**: Abre la app y pega tu key
4. **Cuarto**: ¡Usa y personaliza!

---

## 🎯 Próximos pasos recomendados

1. ✅ Obtén tu API key en https://console.groq.com/keys
2. ✅ Lee `GROQ_QUICK_START.md` (5 minutos)
3. ✅ Importa `SteebChatGroq` en tu app
4. ✅ Prueba que funciona
5. ✅ Personaliza según necesites

---

## 📞 Soporte

Si tienes problemas:

1. Abre **DevTools** (F12)
2. Revisa la **Console**
3. Busca mensajes de error
4. Revisa los documentos correspondientes

---

## 🔐 Privacidad

✅ API key guardada localmente (navegador)  
✅ No se envía a servidores externos (excepto Groq)  
✅ Bajo tu control completo  
✅ Puedes borrarla cuando quieras  

---

## 💰 Costos

**$0** - Completamente gratis

Groq tiene límites MUY generosos:
- 30 mensajes/minuto
- Ilimitado por día
- Para uso personal: nunca llegarás a límite

---

## 🎊 ¡Listo!

Tu integración de IA está lista.

**Empieza ahora:**
1. API key en https://console.groq.com/keys
2. Importa `SteebChatGroq`
3. ¡Elimina procrastinación! 🔥

---

**¿Dudas? Lee los documentos o mira SteebAIDemo.tsx**

¡Stebe AI está listo para conquistar el mundo! 🚀
