# 🤖 Guía Completa: Conectar ChatGPT con tu App STEBE

Esta guía te muestra cómo conectar ChatGPT con tu aplicación STEBE usando el servidor MCP (Model Context Protocol), permitiendo que ChatGPT acceda al código, componentes, y contexto completo de tu app.

## 📋 ¿Qué es MCP?

**Model Context Protocol (MCP)** es un estándar que permite a los modelos de IA (como ChatGPT) conectarse con aplicaciones locales y acceder a su contexto en tiempo real.

### ✨ Beneficios

- **Acceso completo al código**: ChatGPT puede leer archivos, buscar código, y analizar componentes
- **Debugging inteligente**: Analiza errores con contexto completo de tu app
- **Sugerencias precisas**: Mejoras basadas en tu arquitectura real
- **Explicaciones detalladas**: Entiende cómo funciona cada parte de STEBE

---

## 🚀 Instalación y Configuración

### Paso 1: Verificar Requisitos

Necesitas tener instalado:
- **Node.js** v18 o superior ([Descargar](https://nodejs.org))
- **ChatGPT Desktop App** o **ChatGPT Plus** (para web)

Verifica Node.js:
```bash
node --version
# Debe mostrar v18.0.0 o superior
```

### Paso 2: Instalar Dependencias del Servidor MCP

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
cd steeb-mcp
npm install
```

### Paso 3: Iniciar el Servidor MCP

**Opción A - Usando el script automático (Recomendado):**

```bash
# Doble clic en el archivo:
start-for-chatgpt.bat
```

**Opción B - Manualmente:**

```bash
cd steeb-mcp
npm start
```

Deberías ver algo como:

```
╔════════════════════════════════════════════════════════════╗
║  🚀 STEBE MCP Server                                       ║
║  📡 Running on http://localhost:3001                       ║
║  🔗 Ready for ChatGPT integration                          ║
╚════════════════════════════════════════════════════════════╝
```

### Paso 4: Verificar que el Servidor Funciona

Abre tu navegador y ve a:
```
http://localhost:3001/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-10T...",
  "uptime": 123.45
}
```

---

## 🔗 Conectar con ChatGPT

### Método 1: ChatGPT Desktop App (Recomendado)

1. **Abre ChatGPT Desktop**
2. **Ve a Settings** (⚙️ en la esquina superior derecha)
3. **Selecciona "Integrations"** o "Beta Features"
4. **Haz clic en "Add Integration"** o "Add MCP Server"
5. **Configura el servidor:**
   - **Name**: `STEBE App`
   - **Server URL**: `http://localhost:3001`
   - **Type**: `MCP Server`
6. **Marca "I trust this application"** ✅
7. **Guarda la configuración**

### Método 2: ChatGPT Web (con extensión)

Si usas ChatGPT en el navegador:

1. **Instala la extensión MCP Client** para tu navegador
   - Chrome: [MCP Client Extension](https://chrome.google.com/webstore)
   - Firefox: Busca "MCP Client" en addons
   
2. **Configura la extensión:**
   - URL del servidor: `http://localhost:3001`
   - Autoriza la conexión local
   
3. **Recarga ChatGPT** y verás el ícono de MCP activo

### Método 3: Configuración Manual en ChatGPT

Si ChatGPT te permite configurar servidores MCP manualmente:

1. Abre el archivo de configuración de ChatGPT (ubicación varía según OS)
2. Agrega esta configuración:

```json
{
  "mcpServers": {
    "stebe-app": {
      "serverUrl": "http://localhost:3001",
      "name": "STEBE Productivity App",
      "capabilities": ["resources", "tools", "prompts"]
    }
  }
}
```

---

## 💬 Cómo Usar ChatGPT con STEBE

Una vez conectado, puedes hacer preguntas como:

### 📂 Explorar la Arquitectura

**Tú:**
> "¿Cuál es la arquitectura de mi app STEBE?"

**ChatGPT:**
> *Accede al recurso `stebe://app/architecture` y te explica la estructura completa*

---

### 🔍 Buscar Código

**Tú:**
> "Busca dónde se usa Firebase en mi proyecto"

**ChatGPT:**
> *Usa la herramienta `search_code` con query "Firebase" y te muestra todos los archivos*

---

### 🧩 Analizar Componentes

**Tú:**
> "Muéstrame el código del componente TaskList"

**ChatGPT:**
> *Usa `get_component_info` y te muestra el código, props, y estructura del componente*

---

### 🐛 Debugging

**Tú:**
> "Tengo un error en TaskCard.tsx línea 45: 'Cannot read property of undefined'. ¿Qué está pasando?"

**ChatGPT:**
> *Lee el archivo, analiza el contexto, y te da una solución específica*

---

### 💡 Sugerencias de Mejora

**Tú:**
> "¿Cómo puedo mejorar el rendimiento del calendario?"

**ChatGPT:**
> *Analiza los componentes del calendario y sugiere optimizaciones específicas*

---

### 📚 Explicaciones

**Tú:**
> "Explícame cómo funciona el sistema de recurrencia de tareas"

**ChatGPT:**
> *Lee los archivos relevantes y te da una explicación detallada con ejemplos*

---

## 🛠️ Herramientas Disponibles

El servidor MCP de STEBE proporciona estas herramientas a ChatGPT:

| Herramienta | Descripción | Ejemplo de Uso |
|------------|-------------|----------------|
| `read_file` | Lee cualquier archivo del proyecto | "Lee el archivo src/store/useTaskStore.ts" |
| `list_directory` | Lista archivos en una carpeta | "Muéstrame qué hay en src/components" |
| `search_code` | Busca texto en el código | "Busca 'useEffect' en archivos .tsx" |
| `get_component_info` | Analiza un componente React | "Analiza el componente Calendar" |
| `analyze_issue` | Ayuda a debuggear problemas | "Analiza por qué las tareas no se guardan" |

## 📦 Recursos Disponibles

ChatGPT puede acceder a estos recursos:

| Recurso | URI | Contenido |
|---------|-----|-----------|
| Arquitectura | `stebe://app/architecture` | Estructura general de la app |
| Componentes | `stebe://app/components` | Lista de todos los componentes React |
| Stores | `stebe://app/stores` | Stores de Zustand (estado global) |
| Servicios | `stebe://app/services` | Servicios de Firebase y API |
| Tipos | `stebe://app/types` | Definiciones TypeScript |
| Documentación | `stebe://docs/all` | Toda la documentación del proyecto |

---

## 🎯 Casos de Uso Avanzados

### 1. Refactorización Guiada

**Tú:**
> "Quiero refactorizar el componente TaskList para usar React Query. ¿Cómo lo hago?"

**ChatGPT:**
> *Lee el componente actual, analiza las dependencias, y te da un plan paso a paso con código específico*

---

### 2. Migración de Código

**Tú:**
> "Ayúdame a migrar de Zustand a Redux Toolkit"

**ChatGPT:**
> *Analiza todos tus stores, identifica patrones, y genera el código de migración*

---

### 3. Optimización de Rendimiento

**Tú:**
> "Mi app está lenta al cargar muchas tareas. ¿Qué puedo optimizar?"

**ChatGPT:**
> *Analiza los componentes de lista, identifica re-renders innecesarios, y sugiere memoización y virtualización*

---

### 4. Generación de Tests

**Tú:**
> "Genera tests para el componente AddTaskForm"

**ChatGPT:**
> *Lee el componente, identifica casos de uso, y genera tests completos con Jest y React Testing Library*

---

## 🔒 Seguridad y Privacidad

### ✅ Seguro

- El servidor **solo acepta conexiones desde localhost** (tu computadora)
- **No modifica archivos**, solo los lee (read-only)
- **No expone credenciales** ni datos sensibles
- **No envía datos a internet**, todo es local

### ⚠️ Consideraciones

- El servidor MCP debe estar corriendo para que ChatGPT pueda acceder
- ChatGPT puede leer **cualquier archivo** del proyecto que solicites
- Revisa las respuestas de ChatGPT antes de aplicar cambios de código

---

## 🐛 Solución de Problemas

### ❌ El servidor no inicia

**Error:** `Port 3001 already in use`

**Solución:**
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :3001

# Cambiar el puerto en server.js
# const PORT = process.env.PORT || 3002;
```

---

### ❌ ChatGPT no se conecta

**Problema:** "Cannot connect to MCP server"

**Soluciones:**
1. Verifica que el servidor esté corriendo: `http://localhost:3001/health`
2. Revisa el firewall de Windows (permite conexiones locales)
3. Asegúrate de usar la URL correcta: `http://localhost:3001`
4. Marca "I trust this application" en ChatGPT

---

### ❌ Errores al leer archivos

**Error:** `File not found`

**Solución:**
- Usa rutas relativas desde la raíz del proyecto
- Ejemplo correcto: `src/components/TaskList.tsx`
- Ejemplo incorrecto: `C:\Users\...\TaskList.tsx`

---

### ❌ ChatGPT dice "MCP server not available"

**Solución:**
1. Reinicia el servidor MCP
2. Reinicia ChatGPT Desktop
3. Verifica la configuración en Settings → Integrations
4. Revisa que el puerto 3001 esté libre

---

## 📊 Verificar Conexión

### Test Rápido

Pregúntale a ChatGPT:

> "¿Estás conectado al servidor MCP de STEBE?"

Si está conectado, debería responder algo como:

> "Sí, estoy conectado al servidor MCP de STEBE en http://localhost:3001. Puedo acceder a los recursos, herramientas y prompts de tu aplicación. ¿En qué puedo ayudarte?"

### Test de Funcionalidad

> "Lista los componentes de mi app STEBE"

ChatGPT debería usar la herramienta `list_directory` o el recurso `stebe://app/components` y mostrarte la lista real de componentes.

---

## 🚀 Comandos Útiles

### Iniciar el servidor
```bash
cd steeb-mcp
npm start
```

### Iniciar en modo desarrollo (auto-reload)
```bash
npm run dev
```

### Verificar salud del servidor
```bash
curl http://localhost:3001/health
```

### Ver recursos disponibles
```bash
curl http://localhost:3001/mcp/resources
```

### Ver herramientas disponibles
```bash
curl http://localhost:3001/mcp/tools
```

---

## 🎓 Ejemplos de Prompts Efectivos

### Para Debugging
```
"Analiza el componente Calendar y dime por qué las tareas 
recurrentes no se muestran correctamente"
```

### Para Mejoras
```
"Revisa el código de autenticación con Firebase y sugiere 
mejoras de seguridad"
```

### Para Aprendizaje
```
"Explícame paso a paso cómo funciona el sistema de 
persistencia de tareas en STEBE"
```

### Para Refactorización
```
"Ayúdame a separar la lógica de negocio del componente 
TaskList en un custom hook"
```

---

## 📚 Recursos Adicionales

- **Documentación MCP**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Arquitectura STEBE**: Ver `ARCHITECTURE.md` en la raíz del proyecto
- **Servidor MCP**: Ver `steeb-mcp/README.md` para detalles técnicos

---

## 💡 Tips y Mejores Prácticas

1. **Sé específico**: En lugar de "arregla esto", di "el componente TaskCard no muestra la fecha correctamente"
2. **Proporciona contexto**: Menciona el archivo, línea, o componente específico
3. **Pide explicaciones**: ChatGPT puede explicar código complejo de tu app
4. **Itera**: Si la primera respuesta no es perfecta, pide aclaraciones
5. **Verifica el código**: Siempre revisa el código generado antes de aplicarlo

---

## 🤝 Contribuir

Si encuentras formas de mejorar el servidor MCP o esta guía:

1. Edita los archivos en `steeb-mcp/`
2. Actualiza la documentación
3. Comparte tus mejoras

---

## ✅ Checklist de Configuración

- [ ] Node.js v18+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Servidor MCP iniciado (`npm start`)
- [ ] Health check exitoso (`http://localhost:3001/health`)
- [ ] ChatGPT configurado con la integración
- [ ] Conexión verificada (pregunta de test)
- [ ] Primer comando exitoso (listar componentes)

---

## 🎉 ¡Listo!

Ahora ChatGPT tiene acceso completo al contexto de tu aplicación STEBE y puede ayudarte con:

- ✅ Debugging de problemas complejos
- ✅ Refactorización de código
- ✅ Optimización de rendimiento
- ✅ Generación de tests
- ✅ Explicaciones detalladas
- ✅ Sugerencias de mejoras
- ✅ Migración de código
- ✅ Y mucho más...

**¡Disfruta programando con tu asistente IA personalizado!** 🚀

---

**Creado para STEBE** - Tu esfuerzo es tu mejor inversión 💪
