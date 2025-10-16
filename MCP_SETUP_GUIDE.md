# 🔗 Guía de Configuración MCP para ChatGPT

Esta guía te ayudará a conectar ChatGPT con tu app STEBE usando el servidor MCP (Model Context Protocol).

## 🎯 ¿Qué es MCP?

MCP (Model Context Protocol) es un protocolo que permite que ChatGPT acceda al contexto de tu aplicación en tiempo real. Con esto, ChatGPT puede:

- ✅ Ver la estructura de tu código
- ✅ Leer archivos específicos
- ✅ Buscar en el código
- ✅ Analizar componentes
- ✅ Sugerir soluciones basadas en tu código real
- ✅ Debuggear problemas específicos

## 🚀 Inicio Rápido

### Paso 1: Iniciar el Servidor MCP

**Opción A: Usando el script de inicio (Recomendado)**

```bash
# Doble clic en el archivo
steeb-mcp/start-mcp.bat
```

**Opción B: Manualmente**

```bash
cd steeb-mcp
npm install
npm start
```

El servidor se iniciará en `http://localhost:3001`

### Paso 2: Verificar que Funciona

Abre tu navegador y ve a:
```
http://localhost:3001/health
```

Deberías ver: `{"status":"healthy",...}`

### Paso 3: Conectar ChatGPT

Tienes 3 opciones para conectar ChatGPT:

---

## 📱 Opción 1: ChatGPT Desktop App (Más Fácil)

### Requisitos
- ChatGPT Desktop App instalada
- Cuenta ChatGPT Plus o Team

### Pasos

1. **Abre ChatGPT Desktop**

2. **Ve a Settings**
   - Click en tu perfil (esquina superior derecha)
   - Settings → Beta Features

3. **Habilita MCP**
   - Activa "Model Context Protocol"

4. **Agrega el Servidor**
   - Settings → Integrations → Add Integration
   - Configura:
     ```
     Name: STEBE
     Type: MCP Server
     URL: http://localhost:3001
     ```

5. **Prueba la Conexión**
   
   En ChatGPT, escribe:
   ```
   "¿Puedes ver mi app STEBE? Muéstrame la arquitectura"
   ```

---

## 🌐 Opción 2: ChatGPT Web con Extensión

### Requisitos
- Navegador Chrome/Edge/Brave
- Extensión MCP Client

### Pasos

1. **Instala la Extensión MCP Client**
   - [Chrome Web Store - MCP Client](https://chrome.google.com/webstore)
   - Busca "MCP Client" o "Model Context Protocol"

2. **Configura la Extensión**
   - Click en el ícono de la extensión
   - Add Server:
     ```
     Name: STEBE
     URL: http://localhost:3001
     ```

3. **Usa ChatGPT Normalmente**
   
   La extensión inyectará el contexto automáticamente cuando sea relevante.

---

## 💻 Opción 3: API Directa (Para Desarrolladores)

Si tienes ChatGPT Plus con Code Interpreter, puedes hacer llamadas directas:

```python
import requests

# Obtener lista de componentes
response = requests.get('http://localhost:3001/mcp/resources/stebe%3A%2F%2Fapp%2Fcomponents')
components = response.json()['content']
print(components)

# Buscar código
response = requests.post('http://localhost:3001/mcp/tools/execute', json={
    "name": "search_code",
    "arguments": {
        "query": "useTaskStore",
        "filePattern": "*.tsx"
    }
})
results = response.json()['result']
print(results)
```

---

## 🎨 Ejemplos de Uso

Una vez conectado, puedes hacer preguntas como:

### 🐛 Debugging

**Tú:**
> "Tengo un error en TaskList.tsx línea 45 que dice 'Cannot read property completed of undefined'. ¿Qué está pasando?"

**ChatGPT:**
> *[Lee TaskList.tsx usando el MCP]*
> 
> El problema está en la línea 45 donde intentas acceder a `task.completed` sin verificar primero si `task` existe. Aquí está la solución:
> 
> ```tsx
> {tasks?.map(task => task && (
>   <TaskCard key={task.id} completed={task.completed} />
> ))}
> ```

### 💡 Mejoras

**Tú:**
> "¿Cómo puedo mejorar el rendimiento del calendario? Se siente lento cuando hay muchas tareas"

**ChatGPT:**
> *[Analiza CalendarView.tsx y useTaskStore.ts]*
> 
> Veo 3 optimizaciones que puedes hacer:
> 
> 1. Usa `useMemo` para filtrar tareas por fecha
> 2. Implementa virtualización con `react-window`
> 3. Agrega índices en Firestore para las queries de fecha
> 
> Aquí está el código...

### 📚 Explicaciones

**Tú:**
> "Explícame cómo funciona el sistema de recurrencia de tareas"

**ChatGPT:**
> *[Lee useTaskStore.ts y recurrenceManager.ts]*
> 
> El sistema de recurrencia funciona así:
> 
> 1. Cuando creas una tarea con recurrencia...
> 2. Se genera la primera instancia...
> 3. Al completarla, se calcula la siguiente fecha...
> 
> [Explicación detallada con código]

### 🔍 Análisis de Código

**Tú:**
> "¿Qué componentes usan Firebase Auth?"

**ChatGPT:**
> *[Busca en el código usando search_code]*
> 
> Encontré 5 componentes que usan Firebase Auth:
> 
> 1. `AuthProvider.tsx` - Proveedor principal
> 2. `AuthScreen.tsx` - Pantalla de login
> 3. `SettingsView.tsx` - Logout
> 4. `useAuth.ts` - Hook personalizado
> 5. `useFirebaseAuth.ts` - Lógica de autenticación

---

## 🔧 Configuración Avanzada

### Cambiar el Puerto

Si el puerto 3001 está ocupado:

1. Edita `steeb-mcp/server.js`:
   ```javascript
   const PORT = process.env.PORT || 3002; // Cambiar aquí
   ```

2. O crea un archivo `.env`:
   ```
   PORT=3002
   ```

### Habilitar CORS para Otros Orígenes

Si necesitas acceder desde otro dominio:

```javascript
// En server.js
app.use(cors({
  origin: ['http://localhost:3000', 'https://tu-dominio.com']
}));
```

### Agregar Autenticación

Para mayor seguridad, puedes agregar un token:

```javascript
// En server.js
app.use((req, res, next) => {
  const token = req.headers['authorization'];
  if (token !== 'Bearer tu-token-secreto') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

---

## 📊 Recursos Disponibles

El servidor MCP expone estos recursos:

| URI | Descripción |
|-----|-------------|
| `stebe://app/architecture` | Arquitectura de la app |
| `stebe://app/components` | Lista de componentes React |
| `stebe://app/stores` | Stores de Zustand |
| `stebe://app/services` | Servicios de Firebase |
| `stebe://app/types` | Tipos TypeScript |
| `stebe://docs/all` | Documentación completa |

## 🛠️ Herramientas Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `read_file` | Lee archivos del proyecto |
| `list_directory` | Lista contenido de carpetas |
| `search_code` | Busca texto en el código |
| `get_component_info` | Info detallada de componentes |
| `analyze_issue` | Analiza problemas y errores |

## 🐛 Solución de Problemas

### El servidor no inicia

```bash
# Verifica que Node.js esté instalado
node --version

# Debe ser >= 18.0.0
# Si no, descarga desde https://nodejs.org
```

### ChatGPT no se conecta

1. ✅ Verifica que el servidor esté corriendo: `http://localhost:3001/health`
2. ✅ Revisa el firewall de Windows
3. ✅ Asegúrate de usar la URL correcta
4. ✅ Reinicia ChatGPT Desktop

### Error "EADDRINUSE"

El puerto 3001 está ocupado:

```bash
# Windows: Encuentra qué proceso usa el puerto
netstat -ano | findstr :3001

# Mata el proceso (reemplaza PID)
taskkill /PID <PID> /F

# O cambia el puerto en server.js
```

### ChatGPT dice "No puedo acceder a recursos externos"

- Asegúrate de tener ChatGPT Plus o Team
- Verifica que MCP esté habilitado en Settings → Beta Features
- Prueba reiniciar la app de ChatGPT

---

## 🎯 Mejores Prácticas

### 1. Mantén el Servidor Corriendo

Deja el servidor MCP corriendo mientras desarrollas. Puedes minimizar la ventana.

### 2. Sé Específico en tus Preguntas

❌ "Arregla mi app"
✅ "El componente TaskCard no muestra la fecha correctamente. Está en src/components/TaskCard.tsx línea 67"

### 3. Proporciona Contexto

❌ "Tengo un error"
✅ "Tengo un error 'undefined is not a function' en la consola cuando hago click en el botón de completar tarea. El error viene de TaskList.tsx"

### 4. Usa los Prompts Predefinidos

El servidor incluye prompts optimizados:
- `debug_component` - Para debugging
- `suggest_improvement` - Para mejoras
- `explain_code` - Para explicaciones

---

## 📚 Recursos Adicionales

- [Documentación MCP](https://modelcontextprotocol.io)
- [STEBE Architecture](ARCHITECTURE.md)
- [ChatGPT API Docs](https://platform.openai.com/docs)

---

## 🤝 Soporte

Si tienes problemas:

1. Revisa esta guía
2. Verifica los logs del servidor MCP
3. Prueba los endpoints manualmente con curl/Postman
4. Revisa la consola del navegador

---

## 🎉 ¡Listo!

Ahora ChatGPT tiene acceso completo al contexto de tu app STEBE y puede ayudarte de forma mucho más efectiva con debugging, mejoras y análisis de código.

**¡Feliz coding! 🚀**
