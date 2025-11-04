# Configuración del Backend Proxy para MINIMAX

## ¿Por qué un proxy?

Tu API key de MINIMAX estaba **expuesta en el frontend**. Cualquiera podía verla en el navegador (Dev Tools) y usarla para agotar tu cuota.

Con este proxy:
- ✅ Tu API key está **protegida en el servidor**
- ✅ El frontend NO expone la key
- ✅ Solo tu servidor comunica con MINIMAX
- ✅ Múltiples usuarios comparten de forma segura

---

## Instalación y Setup

### 1. Instalar dependencias del servidor

```bash
cd server
npm install express cors dotenv
```

### 2. Crear archivo `.env` en la carpeta `server`

Copia el contenido de `.env.example` y agrega tu API key:

```
MINIMAX_API_KEY=tu_api_key_aqui
PORT=3001
```

**Reemplaza `tu_api_key_aqui` con tu API key real de MINIMAX.**

### 3. Iniciar el servidor proxy

```bash
cd server
node minimax-proxy.js
```

Deberías ver:
```
🚀 MINIMAX Proxy Server ejecutándose en puerto 3001
✅ API Key protegida en servidor
```

### 4. Verificar que está funcionando

En otra terminal, prueba:
```bash
curl http://localhost:3001/api/health
```

Deberías recibir:
```json
{"status":"OK","message":"MINIMAX Proxy Server running"}
```

### 5. Iniciar la app Steeb (en otra terminal)

```bash
npm run dev
```

---

## Variables de entorno

### Backend (`server/.env`)
```
MINIMAX_API_KEY=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3001
```

### Frontend (`.env.local`)
```
REACT_APP_PROXY_URL=http://localhost:3001
```

---

## Cómo funciona el flujo

```
Usuario en navegador
    ↓
[Frontend - SteebChatAI]
    ↓ (envía a proxy, sin API key)
[Backend Proxy - server/minimax-proxy.js]
    ↓ (reenvía con API key protegida)
[MINIMAX M2 API]
    ↓
[Backend Proxy]
    ↓
[Frontend]
    ↓
Mostrar respuesta al usuario
```

---

## Producción

Para desplegar en producción:

1. **Usar variables de entorno en tu hosting** (Railway, Vercel, Heroku, etc.)
2. **Cambiar `REACT_APP_PROXY_URL`** a la URL de tu servidor en producción
3. **Mantener la API key SOLO en el servidor** (nunca en el frontend)

Ejemplo con Vercel + Railway:
- **Frontend en Vercel**: `REACT_APP_PROXY_URL=https://tu-proxy.railway.app`
- **Backend en Railway**: Variables de entorno con `MINIMAX_API_KEY`

---

## Troubleshooting

### "Error: Proxy server not available"
- ¿Está ejecutándose `node server/minimax-proxy.js`?
- ¿Puerto 3001 está disponible?
- Intenta: `npx lsof -i :3001` (macOS/Linux) o `netstat -ano | findstr :3001` (Windows)

### "Error conectando con el servidor"
- Verifica que el backend está corriendo
- Revisa la consola del backend por errores
- Asegúrate que `MINIMAX_API_KEY` está en `server/.env`

### La API key sigue expuesta
- Verifica que NO está en `src/config/minimax.config.ts`
- Usa el nuevo `steebProxyService` en lugar de `minimaxDirectService`
- Limpia el cache del navegador (Ctrl+Shift+Del)

---

## Archivos importantes

- `server/minimax-proxy.js` - Backend proxy
- `src/services/steebProxyService.ts` - Servicio del frontend que llama al proxy
- `src/components/SteebChatAI.tsx` - Componente actualizado para usar el proxy
- `.env.local` - Configuración del frontend

---

## API del Proxy

### POST `/api/chat`
Envía un mensaje a MINIMAX y obtiene la respuesta.

**Request:**
```json
{
  "messages": [
    {"role": "system", "content": "Eres Steeb..."},
    {"role": "user", "content": "Hola Steeb"}
  ]
}
```

**Response:**
```json
{
  "content": "¡Hola! ¿Qué necesitas conquistar hoy?"
}
```

### GET `/api/health`
Verifica que el servidor está funcionando.

**Response:**
```json
{
  "status": "OK",
  "message": "MINIMAX Proxy Server running"
}
```

---

## Seguridad

✅ API key protegida en el servidor
✅ Frontend no expone credenciales
✅ CORS configurado
✅ Validación de inputs

Para producción, considera:
- Agregar autenticación/rate limiting
- Usar HTTPS
- Loguear accesos
- Monitorear uso de MINIMAX
