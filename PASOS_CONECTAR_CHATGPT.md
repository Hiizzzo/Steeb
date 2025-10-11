# 📱 Pasos para Conectar ChatGPT con STEBE

## ✅ Solución al Error "Unsafe URL"

Viste el error **"Error creating connector - Unsafe URL"** porque ChatGPT requiere que confíes explícitamente en aplicaciones locales HTTP.

---

## 🚀 Paso a Paso (5 minutos)

### 1️⃣ Inicia el Servidor MCP

**Doble clic en:**
```
steeb-mcp/start-mcp.bat
```

Verás:
```
╔════════════════════════════════════════════════════════════╗
║  🚀 STEBE MCP Server                                       ║
║  📡 Running on http://localhost:3001                       ║
╚════════════════════════════════════════════════════════════╝
```

✅ **Deja esta ventana abierta** (minimízala si quieres)

---

### 2️⃣ Abre ChatGPT Desktop

1. Abre la aplicación ChatGPT Desktop
2. Click en tu **perfil** (esquina superior derecha)
3. Ve a **Settings** ⚙️

---

### 3️⃣ Habilita Model Context Protocol

1. En Settings, ve a **Beta Features**
2. Busca **"Model Context Protocol"**
3. **Actívalo** (toggle a ON)

---

### 4️⃣ Agrega el Conector STEBE

1. En Settings, ve a **Integrations**
2. Click en **"Add Integration"** o **"New Connector"**
3. Llena el formulario:

```
┌─────────────────────────────────────────┐
│ Icon: (opcional)                        │
│                                         │
│ Name: STEBE                             │
│                                         │
│ Description: (opcional)                 │
│ STEBE productivity app MCP server       │
│                                         │
│ MCP Server URL:                         │
│ http://localhost:3001                   │
│                                         │
│ Authentication:                         │
│ No authentication                       │
│                                         │
│ ☑ I trust this application             │ ← ¡IMPORTANTE!
│ Custom connectors are not verified...   │
│                                         │
│         [Cancel]  [Create]              │
└─────────────────────────────────────────┘
```

4. **MUY IMPORTANTE:** Marca el checkbox ✅ **"I trust this application"**

5. Click en **"Create"**

---

### 5️⃣ Verifica la Conexión

En ChatGPT, escribe:

```
¿Puedes ver mi app STEBE? Muéstrame qué recursos tienes disponibles
```

**ChatGPT debería responder algo como:**

> Sí, puedo ver tu app STEBE. Tengo acceso a los siguientes recursos:
> 
> 1. **App Architecture** - Arquitectura general de STEBE
> 2. **Components List** - Lista de componentes React disponibles
> 3. **State Stores** - Stores de Zustand (estado global)
> 4. **Services** - Servicios de Firebase y API
> 5. **TypeScript Types** - Definiciones de tipos
> 6. **Documentation** - Toda la documentación disponible
>
> También tengo herramientas para leer archivos, buscar código, analizar componentes...

✅ **¡Listo! ChatGPT está conectado con STEBE**

---

## 💡 Ahora Puedes Hacer

### 🐛 Debugging
```
"Tengo un error en TaskList.tsx línea 45. ¿Qué está mal?"
```

### 🔍 Búsqueda
```
"¿Qué componentes usan Firebase Auth?"
```

### 💡 Mejoras
```
"¿Cómo puedo mejorar el rendimiento del calendario?"
```

### 📚 Explicaciones
```
"Explícame cómo funciona el sistema de recurrencia de tareas"
```

### 🏗️ Arquitectura
```
"Muéstrame la arquitectura completa de STEBE"
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué dice "Unsafe URL"?

ChatGPT considera que las URLs HTTP (sin HTTPS) son potencialmente inseguras. Por eso requiere que marques "I trust this application" para confirmar que sabes que es seguro.

### ¿Es seguro marcar "I trust this application"?

**Sí, es 100% seguro** porque:
- ✅ El servidor solo corre en tu máquina local
- ✅ No hay conexiones a internet
- ✅ Los datos no salen de tu computadora
- ✅ Solo tú tienes acceso

### ¿Puedo usar HTTPS en lugar de HTTP?

Sí, pero es más complejo:
1. Ejecuta: `npm run generate-cert` en `steeb-mcp/`
2. Usa URL: `https://localhost:3001`
3. Aún necesitarás marcar "I trust this application"

Para desarrollo local, HTTP es suficiente.

### ¿Tengo que dejar el servidor corriendo?

Sí, mientras quieras usar ChatGPT con STEBE:
- ✅ Deja la ventana del servidor abierta (o minimizada)
- ✅ Para detenerlo: `Ctrl + C` en la terminal
- ✅ Para reiniciarlo: Doble clic en `start-mcp.bat`

### ¿Qué pasa si cierro el servidor?

ChatGPT mostrará errores de conexión. Simplemente reinicia el servidor con `start-mcp.bat`

---

## 🐛 Solución de Problemas

### Error: "Connection refused"

**Causa:** El servidor no está corriendo

**Solución:**
```bash
cd steeb-mcp
start-mcp.bat
```

### Error: "Timeout"

**Causa:** Firewall bloqueando la conexión

**Solución:**
1. Panel de Control → Firewall de Windows
2. Permitir una aplicación
3. Agrega Node.js

### El checkbox "I trust this application" no aparece

**Solución:**
1. Asegúrate de tener ChatGPT Plus o Team
2. Verifica que MCP esté habilitado en Beta Features
3. Reinicia ChatGPT Desktop

---

## 📊 Resumen Visual

```
┌─────────────────┐
│  1. Inicia      │
│  start-mcp.bat  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Abre        │
│  ChatGPT        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Habilita    │
│  MCP en Beta    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Add         │
│  Integration    │
│  ✅ I trust     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. ¡Listo!     │
│  Prueba con     │
│  ChatGPT        │
└─────────────────┘
```

---

## 🎉 ¡Felicidades!

Ahora ChatGPT tiene acceso completo al contexto de tu app STEBE y puede ayudarte con:

- ✅ Debugging de errores específicos
- ✅ Búsqueda en el código
- ✅ Análisis de componentes
- ✅ Sugerencias de mejoras
- ✅ Explicaciones de arquitectura
- ✅ Y mucho más...

**¡Disfruta tu asistente de desarrollo potenciado! 🚀**
