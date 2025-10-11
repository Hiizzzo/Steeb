# 🔗 Cómo Conectar ChatGPT con STEBE

## ✅ Estado Actual

**El servidor MCP está corriendo en: `http://localhost:3001`**

## 📱 Pasos para Conectar ChatGPT

### Opción 1: ChatGPT Desktop (Recomendado)

1. **Abre ChatGPT Desktop**

2. **Habilita MCP**
   - Ve a: `Settings` (⚙️)
   - Click en: `Beta Features`
   - Activa: `Model Context Protocol`

3. **Agrega el Servidor STEBE**
   - Ve a: `Settings` → `Integrations`
   - Click en: `Add Integration`
   - Llena los campos:
     ```
     Name: STEBE
     Type: MCP Server
     URL: http://localhost:3001
     ```
   - Click en: `Save`

4. **Verifica la Conexión**
   
   En ChatGPT, escribe:
   ```
   "¿Puedes ver mi app STEBE? Muéstrame qué recursos tienes disponibles"
   ```
   
   ChatGPT debería responder con la lista de recursos disponibles.

---

### Opción 2: ChatGPT Web (Con Extensión)

1. **Instala la Extensión MCP Client**
   - Ve a Chrome Web Store
   - Busca: "MCP Client" o "Model Context Protocol"
   - Instala la extensión

2. **Configura la Extensión**
   - Click en el ícono de la extensión
   - Add Server:
     ```
     Name: STEBE
     URL: http://localhost:3001
     ```

3. **Usa ChatGPT Normalmente**
   
   La extensión inyectará el contexto automáticamente.

---

## 💬 Ejemplos de Preguntas para ChatGPT

Una vez conectado, prueba estas preguntas:

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

## 🎯 ¿Qué Puede Hacer ChatGPT Ahora?

Con el servidor MCP conectado, ChatGPT puede:

- ✅ **Leer tu código** - Accede a todos los archivos del proyecto
- ✅ **Buscar en el código** - Encuentra componentes, funciones, etc.
- ✅ **Analizar componentes** - Ve props, estado, lógica
- ✅ **Ver la arquitectura** - Conoce la estructura completa
- ✅ **Debuggear errores** - Lee el código exacto donde está el problema
- ✅ **Sugerir mejoras** - Basado en tu código real

---

## 🔧 Verificar que Funciona

### Desde el Navegador
Abre: `http://localhost:3001/health`

Deberías ver:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-10T04:41:32.000Z",
  "uptime": 123.45
}
```

### Desde PowerShell
```powershell
.\test-mcp.ps1
```

---

## 🐛 Solución de Problemas

### El servidor no responde

1. Verifica que esté corriendo:
   ```bash
   cd steeb-mcp
   npm start
   ```

2. Revisa el puerto:
   ```
   http://localhost:3001/health
   ```

### ChatGPT no se conecta

1. ✅ Verifica que tengas ChatGPT Plus o Team
2. ✅ Asegúrate de habilitar MCP en Beta Features
3. ✅ Usa la URL exacta: `http://localhost:3001`
4. ✅ Reinicia ChatGPT Desktop

### Error de firewall

Si Windows Firewall bloquea la conexión:
1. Panel de Control → Firewall de Windows
2. Permitir una aplicación
3. Agrega Node.js

---

## 📊 Recursos Disponibles

| Recurso | Descripción |
|---------|-------------|
| `stebe://app/architecture` | Arquitectura de la app |
| `stebe://app/components` | Lista de componentes |
| `stebe://app/stores` | Stores de Zustand |
| `stebe://app/services` | Servicios de Firebase |
| `stebe://app/types` | Tipos TypeScript |
| `stebe://docs/all` | Documentación |

## 🛠️ Herramientas Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `read_file` | Lee archivos |
| `list_directory` | Lista directorios |
| `search_code` | Busca en el código |
| `get_component_info` | Info de componentes |
| `analyze_issue` | Analiza problemas |

---

## 🎉 ¡Listo!

Ahora ChatGPT tiene acceso completo al contexto de tu app STEBE.

**Mantén el servidor MCP corriendo mientras desarrollas.**

Para detener el servidor: `Ctrl + C` en la terminal donde está corriendo.

---

## 📚 Más Información

- [Guía Completa](MCP_SETUP_GUIDE.md)
- [README del Servidor](steeb-mcp/README.md)
- [Inicio Rápido](QUICK_START_MCP.md)
