# 🚀 STEBE MCP Server

**Model Context Protocol Server para integración con ChatGPT**

Este servidor MCP permite que ChatGPT acceda al contexto completo de tu aplicación STEBE y pueda ayudarte con problemas, sugerencias y análisis de código en tiempo real.

## 📋 Características

- **Resources**: Expone información sobre arquitectura, componentes, stores, servicios y tipos
- **Tools**: Herramientas para leer archivos, buscar código, analizar componentes y más
- **Prompts**: Prompts predefinidos para debugging, mejoras y explicaciones de código
- **API REST**: Endpoints HTTP para fácil integración con ChatGPT

## 🛠️ Instalación

```bash
cd steeb-mcp
npm install
```

## 🚀 Uso

### Iniciar el servidor

```bash
npm start
```

El servidor se ejecutará en `http://localhost:3001`

### Modo desarrollo (con auto-reload)

```bash
npm run dev
```

## 📡 Endpoints Disponibles

### Información del Servidor

```http
GET http://localhost:3001/
```

Retorna información general del servidor MCP.

### Health Check

```http
GET http://localhost:3001/health
```

Verifica que el servidor esté funcionando.

### Listar Recursos

```http
GET http://localhost:3001/mcp/resources
```

Obtiene la lista de recursos disponibles:
- `stebe://app/architecture` - Arquitectura de la app
- `stebe://app/components` - Lista de componentes
- `stebe://app/stores` - Stores de Zustand
- `stebe://app/services` - Servicios de Firebase
- `stebe://app/types` - Tipos TypeScript
- `stebe://docs/all` - Documentación completa

### Obtener Recurso Específico

```http
GET http://localhost:3001/mcp/resources/stebe%3A%2F%2Fapp%2Farchitecture
```

### Listar Herramientas

```http
GET http://localhost:3001/mcp/tools
```

Herramientas disponibles:
- `read_file` - Lee archivos del proyecto
- `list_directory` - Lista contenido de directorios
- `search_code` - Busca texto en el código
- `get_component_info` - Info detallada de componentes
- `analyze_issue` - Analiza problemas y errores

### Ejecutar Herramienta

```http
POST http://localhost:3001/mcp/tools/execute
Content-Type: application/json

{
  "name": "read_file",
  "arguments": {
    "path": "src/components/TaskList.tsx"
  }
}
```

### Listar Prompts

```http
GET http://localhost:3001/mcp/prompts
```

Prompts predefinidos:
- `debug_component` - Ayuda a debuggear componentes
- `suggest_improvement` - Sugiere mejoras
- `explain_code` - Explica código

## 🔗 Integración con ChatGPT

### Opción 1: ChatGPT Desktop App (Recomendado)

1. Asegúrate de que el servidor MCP esté corriendo
2. Abre ChatGPT Desktop
3. Ve a Settings → Integrations → Add Integration
4. Configura:
   - **Name**: STEBE MCP
   - **URL**: `http://localhost:3001`
   - **Type**: MCP Server

### Opción 2: ChatGPT Web con Plugin

Si usas ChatGPT web, puedes usar el plugin de MCP:

1. Instala la extensión de navegador MCP Client
2. Configura el endpoint: `http://localhost:3001`
3. Autoriza la conexión

### Opción 3: API Directa

Puedes hacer llamadas directas desde ChatGPT usando Code Interpreter:

```python
import requests

# Obtener arquitectura
response = requests.get('http://localhost:3001/mcp/resources/stebe%3A%2F%2Fapp%2Farchitecture')
print(response.json()['content'])

# Buscar en código
response = requests.post('http://localhost:3001/mcp/tools/execute', json={
    "name": "search_code",
    "arguments": {
        "query": "useTaskStore",
        "filePattern": "*.tsx"
    }
})
print(response.json()['result'])
```

## 💡 Ejemplos de Uso

### Ejemplo 1: Analizar un componente

```bash
curl -X POST http://localhost:3001/mcp/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_component_info",
    "arguments": {
      "componentName": "TaskList"
    }
  }'
```

### Ejemplo 2: Buscar código

```bash
curl -X POST http://localhost:3001/mcp/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search_code",
    "arguments": {
      "query": "Firebase",
      "filePattern": "*.ts"
    }
  }'
```

### Ejemplo 3: Leer archivo

```bash
curl -X POST http://localhost:3001/mcp/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "name": "read_file",
    "arguments": {
      "path": "src/store/useTaskStore.ts"
    }
  }'
```

## 🎯 Casos de Uso con ChatGPT

Una vez conectado, puedes pedirle a ChatGPT:

### Debugging
> "Revisa el componente TaskList y dime por qué las tareas no se están mostrando"

ChatGPT usará `get_component_info` y `search_code` para analizar el problema.

### Mejoras
> "¿Cómo puedo mejorar el rendimiento del calendario?"

ChatGPT revisará los componentes relacionados y sugerirá optimizaciones.

### Explicaciones
> "Explícame cómo funciona el sistema de recurrencia de tareas"

ChatGPT leerá los archivos relevantes y te dará una explicación detallada.

### Análisis de Errores
> "Tengo un error en la consola: 'Cannot read property of undefined'. Está en TaskCard.tsx línea 45"

ChatGPT leerá el archivo, analizará el contexto y te dirá cómo solucionarlo.

## 🔒 Seguridad

- El servidor solo acepta conexiones desde `localhost` por defecto
- No expone credenciales ni datos sensibles
- Solo lee archivos, no modifica código (read-only)
- Puedes configurar CORS para mayor seguridad

## 🐛 Troubleshooting

### El servidor no inicia

```bash
# Verifica que el puerto 3001 esté libre
netstat -ano | findstr :3001

# Si está ocupado, cambia el puerto en server.js
# const PORT = process.env.PORT || 3002;
```

### ChatGPT no se conecta

1. Verifica que el servidor esté corriendo: `http://localhost:3001/health`
2. Revisa que no haya firewall bloqueando el puerto
3. Asegúrate de usar la URL correcta en la configuración

### Errores al leer archivos

- Verifica que las rutas sean relativas a la raíz del proyecto
- Usa `/` en lugar de `\` en las rutas
- Asegúrate de que el archivo exista

## 📚 Documentación Adicional

- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [STEBE Architecture](../ARCHITECTURE.md)
- [ChatGPT Integration Guide](https://platform.openai.com/docs)

## 🤝 Contribuir

Si quieres agregar más herramientas o recursos al servidor MCP:

1. Edita `server.js`
2. Agrega tu herramienta en la sección `MCP TOOLS`
3. Implementa la función helper correspondiente
4. Actualiza esta documentación

## 📝 Licencia

MIT - STEBE Team
