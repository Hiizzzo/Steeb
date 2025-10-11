# 🚀 Inicio Rápido - Conectar ChatGPT con STEBE

## ⚡ En 3 Pasos

### 1️⃣ Inicia el Servidor MCP

**Doble clic en:**
```
steeb-mcp/start-mcp.bat
```

O desde la terminal:
```bash
cd steeb-mcp
npm start
```

Verás esto:
```
╔════════════════════════════════════════════════════════════╗
║  🚀 STEBE MCP Server                                       ║
║  📡 Running on http://localhost:3001                       ║
║  🔗 Ready for ChatGPT integration                          ║
╚════════════════════════════════════════════════════════════╝
```

### 2️⃣ Verifica que Funciona

Abre tu navegador:
```
http://localhost:3001/health
```

Deberías ver: `{"status":"healthy",...}`

### 3️⃣ Conecta ChatGPT

#### Opción A: ChatGPT Desktop (Recomendado)

1. Abre ChatGPT Desktop
2. Settings → Beta Features → Habilita "Model Context Protocol"
3. Settings → Integrations → Add Integration
   - Name: `STEBE`
   - URL: `http://localhost:3001`

#### Opción B: ChatGPT Web

1. Instala la extensión "MCP Client" en Chrome
2. Configura: `http://localhost:3001`

---

## 💬 Ejemplos de Uso

Una vez conectado, prueba estas preguntas:

### Debugging
```
"Tengo un error en TaskList.tsx línea 45. ¿Qué está mal?"
```

### Análisis
```
"¿Qué componentes usan Firebase Auth?"
```

### Mejoras
```
"¿Cómo puedo mejorar el rendimiento del calendario?"
```

### Explicaciones
```
"Explícame cómo funciona el sistema de recurrencia de tareas"
```

---

## 📚 Documentación Completa

- **Guía Detallada**: [MCP_SETUP_GUIDE.md](MCP_SETUP_GUIDE.md)
- **README del Servidor**: [steeb-mcp/README.md](steeb-mcp/README.md)

---

## 🐛 Problemas Comunes

### El servidor no inicia
```bash
# Verifica Node.js
node --version  # Debe ser >= 18.0.0

# Instala dependencias
cd steeb-mcp
npm install
```

### Puerto ocupado
```bash
# Cambia el puerto en steeb-mcp/server.js
const PORT = 3002;  // Línea 582
```

### ChatGPT no se conecta
1. ✅ Verifica: `http://localhost:3001/health`
2. ✅ Reinicia ChatGPT Desktop
3. ✅ Revisa el firewall de Windows

---

## 🎯 ¿Qué Puede Hacer ChatGPT Ahora?

Con el servidor MCP, ChatGPT puede:

- ✅ **Leer tu código** - Ve todos los archivos del proyecto
- ✅ **Buscar en el código** - Encuentra componentes, funciones, etc.
- ✅ **Analizar componentes** - Entiende props, estado, lógica
- ✅ **Ver la arquitectura** - Conoce la estructura completa
- ✅ **Debuggear errores** - Lee el código exacto donde está el problema
- ✅ **Sugerir mejoras** - Basado en tu código real, no genérico

---

## 🎉 ¡Listo!

Ahora ChatGPT es tu asistente de desarrollo con acceso completo a tu app STEBE.

**Mantén el servidor MCP corriendo mientras desarrollas** 🚀
