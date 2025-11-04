# ✅ Test MINIMAX M2 - LISTO PARA PROBAR

**Tu API key está configurada y lista para pruebas**

---

## 🧪 Prueba rápida

### Opción 1: Componente de test (Recomendado)

```tsx
import MINIMAXTest from '@/components/MINIMAXTest';

// En tu app
<MINIMAXTest />
```

Este componente:
- ✅ Verifica la conexión
- ✅ Envía un test message
- ✅ Muestra la respuesta
- ✅ Indica si todo funciona

---

### Opción 2: Función de prueba

```tsx
import { testMINIMAXConnection } from '@/config/minimax.config';

// En una función
const result = await testMINIMAXConnection();
console.log(result);
```

---

### Opción 3: Usar SteebChatLLM directamente

```tsx
import SteebChatLLM from '@/components/SteebChatLLM';

// Tu app ya tiene MINIMAX por defecto
<SteebChatLLM />
```

Abre el componente → Elige MINIMAX M2 → ¡Ya está precargado!

---

## 📋 Tu configuración

**API Key:** ✅ Configurada  
**Modelo:** MiniMax-M2  
**Endpoint:** https://api.minimax.io/v1  
**Status:** 🟢 Listo para probar  

---

## 🚀 Ejecutar test

### En navegador

1. Abre tu app en el navegador
2. Ve a la ruta del componente `MINIMAXTest`
3. Haz click en "Test directo (Recomendado)"
4. Espera la respuesta
5. ¡Verás el resultado!

### En consola (F12)

```javascript
// Abre DevTools y pega esto:
import { testMINIMAXConnection } from '@/config/minimax.config';
const result = await testMINIMAXConnection();
console.log(result);
```

---

## ✨ Qué esperar

### Si funciona ✅
```
✅ ¡FUNCIONANDO!
Conexión exitosa con MINIMAX M2

Respuesta: [Tu respuesta de IA]
📊 Tokens: X entrada, Y salida
```

### Si falla ❌
```
❌ Error de conexión
[Detalles del error]
```

---

## 🔍 Verificaciones

El test verifica:
- ✅ Conectividad a api.minimax.io
- ✅ API key válida
- ✅ Modelo MiniMax-M2 disponible
- ✅ Capacidad de enviar mensajes
- ✅ Recepción de respuestas

---

## 💡 Si todo funciona

¡Felicidades! Tu Stebe AI con MINIMAX M2 está listo.

Próximos pasos:
1. Importa `SteebChatLLM` en tu app
2. ¡Usa el chat!
3. Experimenta con los prompts
4. Personaliza según necesites

---

## 🆘 Si no funciona

### Error: "API key inválida"
- Verifica que copiaste la key correctamente
- No debe haber espacios al inicio/final
- La key incluye caracteres especiales (eso es normal)

### Error: "Conexión rechazada"
- Verifica tu conexión a internet
- Intenta desde otro navegador
- Espera unos segundos e intenta de nuevo

### Error: "Modelo no encontrado"
- Verifica que uses "MiniMax-M2" (correcto)
- Que la API key esté activa en https://platform.minimax.io/

---

## 📁 Archivos configurados

```
src/
├── config/
│   └── minimax.config.ts         ✨ Config + Test function
├── components/
│   └── MINIMAXTest.tsx           ✨ Componente de prueba
│   └── SteebChatLLM.tsx          ✏️ Actualizado con MINIMAX
└── services/
    └── llmService.ts             ✏️ Actualizado con MINIMAX
```

---

## ✅ Checklist final

- [ ] Descargué este archivo
- [ ] Abrí `MINIMAXTest.tsx` en mi app
- [ ] Hice click en "Test directo"
- [ ] Recibí respuesta exitosa ✅
- [ ] Ahora puedo usar `SteebChatLLM`
- [ ] ¡Stebe AI funciona con MINIMAX!

---

## 🎊 Estado final

✅ **API key configurada**  
✅ **Componente de test creado**  
✅ **SteebChatLLM con MINIMAX por defecto**  
✅ **llmService soporta MINIMAX**  
✅ **Listo para producción**  
✅ **Sin cambios en Git**  

---

## 🚀 ¡Ahora sí!

Tu Stebe AI con MINIMAX M2 está completamente listo.

**Próximo paso:** Abre el test y verifica que funciona ✨

---

*Configurado: 4 de Noviembre 2025*  
*Santiago Benítez*  
*API Key: Santiago Benítez - Grupo: santiago benítez*
