# Changelog - STEBE MCP Server

## [2.0.0] - 2025-10-10

### 🎉 Lanzamiento Inicial del Servidor MCP

#### ✨ Características Principales

**MCP Resources**
- `stebe://app/architecture` - Arquitectura completa de la app
- `stebe://app/components` - Lista de todos los componentes React
- `stebe://app/stores` - Información de Zustand stores
- `stebe://app/services` - Servicios de Firebase y API
- `stebe://app/types` - Definiciones TypeScript
- `stebe://docs/all` - Documentación completa del proyecto

**MCP Tools**
- `read_file` - Lee cualquier archivo del proyecto
- `list_directory` - Lista contenido de directorios
- `search_code` - Busca texto/patrones en el código
- `get_component_info` - Obtiene info detallada de componentes
- `analyze_issue` - Analiza problemas y sugiere soluciones

**MCP Prompts**
- `debug_component` - Asistencia para debugging
- `suggest_improvement` - Sugerencias de mejoras
- `explain_code` - Explicaciones de código

#### 🛠️ Endpoints API

- `GET /` - Información del servidor
- `GET /health` - Health check
- `GET /mcp/resources` - Lista de recursos
- `GET /mcp/resources/:uri` - Obtener recurso específico
- `GET /mcp/tools` - Lista de herramientas
- `POST /mcp/tools/execute` - Ejecutar herramienta
- `GET /mcp/prompts` - Lista de prompts

#### 📦 Infraestructura

- Express.js como servidor HTTP
- CORS habilitado para localhost
- Soporte para JSON hasta 50MB
- Manejo de errores robusto
- Logging detallado

#### 📚 Documentación

- README completo con ejemplos
- Guía de configuración detallada (MCP_SETUP_GUIDE.md)
- Inicio rápido (QUICK_START_MCP.md)
- Script de inicio automático (start-mcp.bat)
- Script de pruebas (test-mcp.js)

#### 🔒 Seguridad

- Solo acceso desde localhost por defecto
- Read-only (no modifica archivos)
- No expone credenciales
- Límite de resultados en búsquedas

#### 🎯 Casos de Uso

- Debugging asistido por ChatGPT
- Análisis de código en tiempo real
- Sugerencias de mejoras contextuales
- Explicaciones de arquitectura
- Búsqueda inteligente de código

---

## Próximas Versiones

### [2.1.0] - Planificado

**Nuevas Herramientas**
- `analyze_performance` - Análisis de rendimiento
- `suggest_refactor` - Sugerencias de refactorización
- `check_dependencies` - Verificar dependencias

**Mejoras**
- Caché de recursos para mejor rendimiento
- WebSocket para actualizaciones en tiempo real
- Soporte para múltiples proyectos

### [2.2.0] - Planificado

**Integración Avanzada**
- Soporte para modificar archivos (con confirmación)
- Integración con Git
- Análisis de commits y PRs
- Sugerencias automáticas de tests

---

## Notas de Versión

### Compatibilidad

- Node.js >= 18.0.0
- ChatGPT Plus o Team (para Desktop App)
- Navegadores modernos (Chrome, Edge, Brave)

### Dependencias

- express: ^5.1.0
- cors: ^2.8.5

### Licencia

MIT - STEBE Team
