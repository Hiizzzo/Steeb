// ============================================================================
// STEBE MCP SERVER - Model Context Protocol for ChatGPT Integration
// ============================================================================

import express from "express";
import https from "https";
import http from "http";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 📂 Rutas del proyecto
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_PATH = path.join(PROJECT_ROOT, 'src');
const DOCS_PATH = path.join(PROJECT_ROOT, 'docs');

// ============================================================================
// MCP PROTOCOL ENDPOINTS
// ============================================================================

/**
 * Root endpoint - MCP Server Info
 */
app.get("/", (req, res) => {
  res.json({
    name: "stebe-mcp-server",
    version: "2.0.0",
    description: "Model Context Protocol server for STEBE productivity app",
    capabilities: {
      resources: true,
      tools: true,
      prompts: true
    },
    endpoints: {
      resources: "/mcp/resources",
      tools: "/mcp/tools",
      prompts: "/mcp/prompts",
      health: "/health"
    }
  });
});

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================================================
// MCP RESOURCES - Exponer contexto de la app
// ============================================================================

/**
 * List available resources
 */
app.get("/mcp/resources", (req, res) => {
  res.json({
    resources: [
      {
        uri: "stebe://app/architecture",
        name: "App Architecture",
        description: "Arquitectura general de STEBE",
        mimeType: "text/markdown"
      },
      {
        uri: "stebe://app/components",
        name: "Components List",
        description: "Lista de componentes React disponibles",
        mimeType: "application/json"
      },
      {
        uri: "stebe://app/stores",
        name: "State Stores",
        description: "Stores de Zustand (estado global)",
        mimeType: "application/json"
      },
      {
        uri: "stebe://app/services",
        name: "Services",
        description: "Servicios de Firebase y API",
        mimeType: "application/json"
      },
      {
        uri: "stebe://app/types",
        name: "TypeScript Types",
        description: "Definiciones de tipos de la app",
        mimeType: "text/typescript"
      },
      {
        uri: "stebe://docs/all",
        name: "Documentation",
        description: "Toda la documentación disponible",
        mimeType: "text/markdown"
      }
    ]
  });
});

/**
 * Get specific resource
 */
app.get("/mcp/resources/:uri", (req, res) => {
  const uri = decodeURIComponent(req.params.uri);
  
  try {
    let content;
    
    switch(uri) {
      case "stebe://app/architecture":
        content = getArchitectureInfo();
        break;
      case "stebe://app/components":
        content = getComponentsList();
        break;
      case "stebe://app/stores":
        content = getStoresInfo();
        break;
      case "stebe://app/services":
        content = getServicesInfo();
        break;
      case "stebe://app/types":
        content = getTypesInfo();
        break;
      case "stebe://docs/all":
        content = getAllDocs();
        break;
      default:
        return res.status(404).json({ error: "Resource not found" });
    }
    
    res.json({
      uri,
      content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Error reading resource",
      message: error.message 
    });
  }
});

// ============================================================================
// MCP TOOLS - Acciones que ChatGPT puede ejecutar
// ============================================================================

/**
 * List available tools
 */
app.get("/mcp/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "read_file",
        description: "Lee el contenido de un archivo del proyecto",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Ruta relativa del archivo desde la raíz del proyecto"
            }
          },
          required: ["path"]
        }
      },
      {
        name: "list_directory",
        description: "Lista archivos y carpetas en un directorio",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Ruta del directorio (relativa o absoluta)"
            }
          },
          required: ["path"]
        }
      },
      {
        name: "search_code",
        description: "Busca texto o patrones en el código",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Texto a buscar"
            },
            filePattern: {
              type: "string",
              description: "Patrón de archivos (ej: *.tsx, *.ts)"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_component_info",
        description: "Obtiene información detallada de un componente",
        inputSchema: {
          type: "object",
          properties: {
            componentName: {
              type: "string",
              description: "Nombre del componente"
            }
          },
          required: ["componentName"]
        }
      },
      {
        name: "analyze_issue",
        description: "Analiza un problema o error en la app",
        inputSchema: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Descripción del problema"
            },
            context: {
              type: "string",
              description: "Contexto adicional (componente, archivo, etc.)"
            }
          },
          required: ["description"]
        }
      }
    ]
  });
});

/**
 * Execute tool
 */
app.post("/mcp/tools/execute", (req, res) => {
  const { name, arguments: args } = req.body;
  
  try {
    let result;
    
    switch(name) {
      case "read_file":
        result = readFile(args.path);
        break;
      case "list_directory":
        result = listDirectory(args.path);
        break;
      case "search_code":
        result = searchCode(args.query, args.filePattern);
        break;
      case "get_component_info":
        result = getComponentInfo(args.componentName);
        break;
      case "analyze_issue":
        result = analyzeIssue(args.description, args.context);
        break;
      default:
        return res.status(404).json({ error: "Tool not found" });
    }
    
    res.json({
      tool: name,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Error executing tool",
      message: error.message 
    });
  }
});

// ============================================================================
// MCP PROMPTS - Prompts predefinidos para ChatGPT
// ============================================================================

/**
 * List available prompts
 */
app.get("/mcp/prompts", (req, res) => {
  res.json({
    prompts: [
      {
        name: "debug_component",
        description: "Ayuda a debuggear un componente específico",
        arguments: [
          {
            name: "componentName",
            description: "Nombre del componente a debuggear",
            required: true
          },
          {
            name: "issue",
            description: "Descripción del problema",
            required: true
          }
        ]
      },
      {
        name: "suggest_improvement",
        description: "Sugiere mejoras para una funcionalidad",
        arguments: [
          {
            name: "feature",
            description: "Funcionalidad a mejorar",
            required: true
          }
        ]
      },
      {
        name: "explain_code",
        description: "Explica cómo funciona una parte del código",
        arguments: [
          {
            name: "filePath",
            description: "Ruta del archivo",
            required: true
          }
        ]
      }
    ]
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getArchitectureInfo() {
  const archFile = path.join(PROJECT_ROOT, 'ARCHITECTURE.md');
  if (fs.existsSync(archFile)) {
    return fs.readFileSync(archFile, 'utf-8');
  }
  
  return `
# STEBE App Architecture

## Stack Tecnológico
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Estado**: Zustand (stores)
- **Backend**: Firebase (Auth + Firestore)
- **AI**: Gemini + Ollama
- **Mobile**: Capacitor

## Estructura de Carpetas
- \`/src/components\`: Componentes React
- \`/src/store\`: Zustand stores (estado global)
- \`/src/services\`: Servicios de Firebase y API
- \`/src/hooks\`: Custom hooks
- \`/src/types\`: TypeScript types
- \`/src/lib\`: Utilidades y configuración
  `;
}

function getComponentsList() {
  const componentsDir = path.join(SRC_PATH, 'components');
  const files = fs.readdirSync(componentsDir)
    .filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'))
    .map(f => ({
      name: f.replace(/\.(tsx|jsx)$/, ''),
      path: `src/components/${f}`,
      type: f.endsWith('.tsx') ? 'TypeScript' : 'JavaScript'
    }));
  
  return {
    total: files.length,
    components: files
  };
}

function getStoresInfo() {
  const storeDir = path.join(SRC_PATH, 'store');
  if (!fs.existsSync(storeDir)) {
    return { stores: [] };
  }
  
  const stores = fs.readdirSync(storeDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .map(f => {
      const content = fs.readFileSync(path.join(storeDir, f), 'utf-8');
      const interfaceMatch = content.match(/interface\s+(\w+Store)/);
      
      return {
        name: f.replace(/\.(ts|js)$/, ''),
        path: `src/store/${f}`,
        interface: interfaceMatch ? interfaceMatch[1] : null
      };
    });
  
  return { stores };
}

function getServicesInfo() {
  const servicesDir = path.join(SRC_PATH, 'services');
  if (!fs.existsSync(servicesDir)) {
    return { services: [] };
  }
  
  const services = fs.readdirSync(servicesDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .map(f => ({
      name: f.replace(/\.(ts|js)$/, ''),
      path: `src/services/${f}`
    }));
  
  return { services };
}

function getTypesInfo() {
  const typesFile = path.join(SRC_PATH, 'types', 'index.ts');
  if (fs.existsSync(typesFile)) {
    return fs.readFileSync(typesFile, 'utf-8');
  }
  return "// No types file found";
}

function getAllDocs() {
  const docs = [];
  const mdFiles = fs.readdirSync(PROJECT_ROOT)
    .filter(f => f.endsWith('.md'));
  
  for (const file of mdFiles) {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf-8');
    docs.push({
      file,
      content: content.substring(0, 1000) + (content.length > 1000 ? '...' : '')
    });
  }
  
  return { docs };
}

function readFile(relativePath) {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const stats = fs.statSync(fullPath);
  
  return {
    path: relativePath,
    content,
    size: stats.size,
    modified: stats.mtime
  };
}

function listDirectory(dirPath) {
  const fullPath = dirPath.startsWith('/') || dirPath.includes(':') 
    ? dirPath 
    : path.join(PROJECT_ROOT, dirPath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  
  const items = fs.readdirSync(fullPath, { withFileTypes: true })
    .map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, item.name)
    }));
  
  return {
    path: dirPath,
    items
  };
}

function searchCode(query, filePattern = '*') {
  const results = [];
  
  function searchInDir(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        searchInDir(fullPath);
      } else if (item.isFile()) {
        // Aplicar filtro de patrón
        if (filePattern !== '*' && !item.name.match(filePattern.replace('*', '.*'))) {
          continue;
        }
        
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                file: path.relative(PROJECT_ROOT, fullPath),
                line: index + 1,
                content: line.trim()
              });
            }
          });
        } catch (err) {
          // Skip binary files
        }
      }
    }
  }
  
  searchInDir(SRC_PATH);
  
  return {
    query,
    totalResults: results.length,
    results: results.slice(0, 50) // Limitar a 50 resultados
  };
}

function getComponentInfo(componentName) {
  const possiblePaths = [
    path.join(SRC_PATH, 'components', `${componentName}.tsx`),
    path.join(SRC_PATH, 'components', `${componentName}.jsx`),
    path.join(SRC_PATH, 'components', componentName, 'index.tsx'),
    path.join(SRC_PATH, 'components', componentName, 'index.jsx'),
  ];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extraer props interface
      const propsMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/s);
      
      return {
        name: componentName,
        path: path.relative(PROJECT_ROOT, filePath),
        props: propsMatch ? propsMatch[1].trim() : null,
        content: content.substring(0, 2000)
      };
    }
  }
  
  throw new Error(`Component not found: ${componentName}`);
}

function analyzeIssue(description, context) {
  // Esta función puede expandirse con análisis más sofisticado
  return {
    issue: description,
    context: context || 'general',
    suggestions: [
      "Revisa los logs de la consola del navegador",
      "Verifica que todos los imports estén correctos",
      "Asegúrate de que el componente esté correctamente registrado",
      "Revisa el estado en Zustand stores"
    ],
    relatedFiles: searchCode(context || description, '*.tsx').results.slice(0, 5)
  };
}

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3001;
const USE_HTTPS = process.env.USE_HTTPS !== 'false'; // Por defecto usa HTTPS

// Intentar cargar certificados SSL
const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

let server;
let protocol = 'http';

if (USE_HTTPS && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  try {
    // Usar HTTPS si los certificados existen
    const options = {
      key: fs.readFileSync(keyPath, 'utf8'),
      cert: fs.readFileSync(certPath, 'utf8')
    };
    
    server = https.createServer(options, app);
    protocol = 'https';
    
    console.log('🔐 Usando HTTPS con certificado autofirmado');
  } catch (error) {
    console.log('⚠️  Error cargando certificados SSL:', error.message);
    console.log('💡 Usando HTTP como fallback');
    server = http.createServer(app);
    protocol = 'http';
  }
} else {
  // Fallback a HTTP
  server = http.createServer(app);
  protocol = 'http';
  
  if (USE_HTTPS) {
    console.log('⚠️  Certificados SSL no encontrados, usando HTTP');
    console.log('💡 Para ChatGPT, necesitas HTTPS. Soluciones:');
    console.log('   1. Marca "I trust this application" en ChatGPT');
    console.log('   2. O genera certificados: npm run generate-cert');
  }
}

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 STEBE MCP Server                                       ║
║  📡 Running on ${protocol}://localhost:${PORT}${protocol === 'http' ? '                      ' : '                     '}║
║  🔗 Ready for ChatGPT integration                          ║
╚════════════════════════════════════════════════════════════╝

${protocol === 'https' ? '🔒 Servidor seguro (HTTPS)\n' : '⚠️  Servidor sin cifrado (HTTP) - Solo para desarrollo\n'}
Available endpoints:
  • GET  /                    - Server info
  • GET  /health              - Health check
  • GET  /mcp/resources       - List resources
  • GET  /mcp/tools           - List tools
  • GET  /mcp/prompts         - List prompts
  • POST /mcp/tools/execute   - Execute tool

${protocol === 'http' ? '💡 Para usar HTTPS (requerido por ChatGPT):\n   npm run generate-cert\n   npm start\n' : '✅ ChatGPT puede conectarse de forma segura\n'}  `);
});
