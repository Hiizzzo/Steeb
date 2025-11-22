# 🔧 STEEB Backend - Fix Requerido

## 📋 PROBLEMA IDENTIFICADO

### Situación Actual:
- **Backend (Vercel)**: `https://v0-steeb-api-backend.vercel.app/api/steeb`
- **Frontend**: Espera estructura específica con `remainingMessages`
- **Resultado**: Usuario ve "0 mensajes disponibles hoy" ❌

### Estructura que devuelve el backend actual:
```json
{
  "response": "respuesta de DeepSeek",
  "cached": false,
  "userId": "user-123",
  "model": "deepseek-chat",
  "timestamp": "2025-11-21T22:40:49.380Z"
}
```

### Estructura que necesita el frontend:
```json
{
  "success": true,
  "data": {
    "reply": "respuesta de DeepSeek",
    "user": {
      "messageCount": 5,
      "remainingMessages": 45
    }
  }
}
```

---

## 🎯 SOLUCIÓN REQUERIDA

### Modificar el endpoint `/api/steeb` para que:

1. **Mantener DeepSeek** (no tocar la integración existente)
2. **Añadir sistema de límites** (opcional pero recomendado)
3. **Devolver estructura correcta** (obligatorio)

---

## 📝 IMPLEMENTACIÓN SUGERIDA

### Estructura del código del backend:

```javascript
// Endpoint: /api/steeb
// Método: POST

// 1. Configuración
const DAILY_MESSAGE_LIMIT = 50;
const userStore = new Map(); // o usar base de datos real

// 2. Funciones de manejo de usuarios
function getOrCreateUser(userId) {
  // Implementar lógica para obtener/crear usuario
  // Resetear límite diario si es necesario
}

function decrementMessageCount(user) {
  // Actualizar contadores si hay mensajes disponibles
}

// 3. Lógica principal del endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId } = req.body;

    // Validaciones básicas
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Message y userId son requeridos'
      });
    }

    // 🎯 SISTEMA DE LÍMITES (opcional)
    let user = getOrCreateUser(userId);

    if (user.remainingMessages <= 0) {
      return res.status(429).json({
        success: false,
        error: 'Has alcanzado tu límite diario de mensajes. Vuelve mañana.',
        data: {
          user: {
            messageCount: user.messageCount,
            remainingMessages: 0
          }
        }
      });
    }

    // 🤖 LLAMADA A DEEPSEEK (mantener implementación existente)
    const deepseekResponse = await callDeepSeekAPI(message, userId);

    // Actualizar contador del usuario
    user = decrementMessageCount(user);

    // 🔄 RESPUESTA CORRECTA PARA EL FRONTEND
    const response = {
      success: true,
      data: {
        reply: deepseekResponse.response, // Mantener respuesta de DeepSeek
        user: {
          messageCount: user.messageCount,
          remainingMessages: user.remainingMessages
        }
      },
      meta: {
        model: deepseekResponse.model || 'deepseek-chat',
        cached: deepseekResponse.cached || false,
        timestamp: deepseekResponse.timestamp || new Date().toISOString()
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error en /api/steeb:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}
```

---

## ⚡ OPTIMIZACIÓN DE VELOCIDAD REQUERIDA

### Problema: Los mensajes llegan demasiado lentos
**Sugerencias para optimizar:**

1. **Caching inteligente:**
   ```javascript
   // Cache para respuestas similares (Redis/Memory)
   const cacheKey = `${message.substring(0, 50)}_${userId}`;
   const cached = await getCache(cacheKey);
   if (cached) {
     return { response: cached, cached: true };
   }
   ```

2. **Timeouts agresivos:**
   ```javascript
   const controller = new AbortController();
   setTimeout(() => controller.abort(), 5000); // 5s máximo

   const response = await fetch(deepseekURL, {
     signal: controller.signal,
     timeout: 5000
   });
   ```

3. **Streaming (si es posible):**
   ```javascript
   // Implementar streaming de respuestas
   // Para feedback inmediato al usuario
   ```

4. **Headers de optimización:**
   ```javascript
   res.setHeader('Cache-Control', 'public, max-age=300');
   res.setHeader('Connection', 'keep-alive');
   ```

5. **Monitor de latencia:**
   ```javascript
   const startTime = Date.now();
   // ... proceso
   const duration = Date.now() - startTime;
   console.log(`Request processed in ${duration}ms`);
   ```

---

## 🚀 DEPLOYMENT

### Pasos después de la implementación:

1. **Actualizar el backend en Vercel**
2. **Probar con frontend:**
   ```bash
   curl -X POST https://v0-steeb-api-backend.vercel.app/api/steeb \
     -H "Content-Type: application/json" \
     -d '{"message":"test","userId":"test-123"}'
   ```
3. **Verificar estructura correcta en respuesta**
4. **Probar en la app STEEB**

---

## 📊 TESTING REQUERIDO

### Tests unitarios:
- ✅ Verificar estructura de respuesta
- ✅ Validar límites de mensajes
- ✅ Testear manejo de errores
- ✅ Verificar velocidad de respuesta (< 3s)

### Tests de integración:
- ✅ Frontend recibe `remainingMessages`
- ✅ DeepSeek sigue funcionando
- ✅ No rompe flows existentes

---

## 🔗 FRONTEND ESPERA

### Archivos afectados:
- `src/services/steebApi.ts`
- `src/services/steebApi.native.ts`

### Cómo procesa el frontend:
```typescript
// Extrae datos de la respuesta
const reply: string = payload?.data?.reply ?? '';
const messageCount: number = payload?.data?.user?.messageCount ?? 0;
const remainingMessages: number = payload?.data?.user?.remainingMessages ?? 0;
```

---

## 📞 CONTACTO

**Para dudas sobre esta implementación:**
- Requerimientos: Santiago (Santy)
- Contexto: Problema de "0 mensajes disponibles"
- Prioridad: Alta (afecta UX del usuario)

---

**IMPORTANTE:** Mantener la integración con DeepSeek exactamente como está, solo adaptar la estructura de respuesta.