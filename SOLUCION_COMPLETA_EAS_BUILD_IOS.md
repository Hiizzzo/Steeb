# Solución Completa para Error de Build de iOS con EAS

## Problema Identificado

El error `npm ci --include=dev exited with non-zero code: 1` ocurría porque:

1. **Inconsistencia de gestores de paquetes**: El proyecto estaba configurado para usar Yarn (según `package.json` y `eas.json`) pero solo existía `package-lock.json` (de npm).
2. **Versión de Node incompatible**: La versión local de Node (22.15.0) era incompatible con la requerida en `package.json` (>=18.18.0 <=20.x).
3. **Configuración de EAS incompleta**: Faltaban variables de entorno específicas para forzar el uso de Yarn.

## Solución Implementada

### 1. Archivos Modificados/Creados

- ✅ **Eliminado**: `package-lock.json` (evita conflictos entre npm y yarn)
- ✅ **Creado**: `yarn.lock` (lockfile correcto para yarn)
- ✅ **Actualizado**: `eas.json` con configuración optimizada
- ✅ **Actualizado**: `.gitignore` para incluir archivos de yarn
- ✅ **Creado**: `fix-eas-build-simple.ps1` (script de solución)

### 2. Configuración Final de eas.json

```json
{
  "cli": { 
    "version": ">= 11.0.0", 
    "appVersionSource": "local" 
  },
  "build": {
    "production": {
      "developmentClient": false,
      "distribution": "store",
      "autoIncrement": true,
      "ios": { 
        "resourceClass": "m-medium",
        "node": "20.11.1"
      },
      "env": { 
        "NODE_VERSION": "20.11.1", 
        "EXPO_USE_YARN": "true",
        "YARN_ENABLE_IMMUTABLE_INSTALLS": "false"
      }
    }
  },
  "submit": { 
    "production": { 
      "ios": { 
        "ascAppId": "6752629210" 
      } 
    } 
  }
}
```

### 3. Variables de Ambiente Clave

- `NODE_VERSION`: "20.11.1" - Versión compatible con el proyecto
- `EXPO_USE_YARN`: "true" - Fuerza el uso de yarn en lugar de npm
- `YARN_ENABLE_IMMUTABLE_INSTALLS`: "false" - Permite instalaciones flexibles

## Pasos para Ejecutar la Solución

### Opción 1: Usar el Script Automático (Recomendado)

```powershell
# En Windows
powershell -ExecutionPolicy Bypass -File fix-eas-build-simple.ps1

# O en Linux/Mac
bash solucionar-build-eas-ios.sh
```

### Opción 2: Pasos Manuales

1. **Eliminar package-lock.json**
   ```bash
   rm package-lock.json
   ```

2. **Generar yarn.lock**
   ```bash
   yarn install --ignore-engines
   ```

3. **Actualizar eas.json** con la configuración mostrada arriba

4. **Verificar .gitignore** incluye:
   ```
   package-lock.json
   yarn-error.log
   ```

5. **Ejecutar build**
   ```bash
   eas build --platform ios --profile production
   ```

## Comandos Útiles para Diagnóstico

```bash
# Verificar versión de Node
node --version

# Verificar versión de Yarn
yarn --version

# Limpiar caché de yarn
yarn cache clean

# Limpiar caché de EAS
eas build:clear-cache

# Verificar configuración de EAS
eas build:configure
```

## Referencia a MCP (Model Context Protocol)

Según la documentación de Context7 sobre MCP, es un protocolo abierto que estandariza cómo las aplicaciones proporcionan contexto a los LLMs. Para este proyecto:

- **MCP Server disponible**: En el directorio `steeb-mcp/`
- **Configuración**: Archivos `.mcpconfig.json` y `chatgpt-config.json`
- **Uso**: Integración con ChatGPT para funcionalidades AI de la app

## Prevención de Problemas Futuros

1. **Siempre usar yarn** para instalaciones locales:
   ```bash
   yarn add [paquete]
   yarn install
   ```

2. **Mantener consistencia** entre `package.json` y lockfiles

3. **Verificar versiones** de Node antes de builds importantes

4. **Limpiar caché** periódicamente:
   ```bash
   yarn cache clean
   eas build:clear-cache
   ```

## Si el Problema Persiste

1. **Verificar versión exacta de Node**:
   ```bash
   nvm use 20.11.1  # Si usas nvm
   ```

2. **Reinstalar dependencias completamente**:
   ```bash
   rm -rf node_modules yarn.lock
   yarn install --force
   ```

3. **Verificar configuración de Expo**:
   ```bash
   eas build:configure --platform ios
   ```

4. **Consultar logs detallados**:
   ```bash
   eas build --platform ios --profile production --verbose
   ```

## Resumen de Cambios Realizados

| Archivo | Acción | Razón |
|---------|--------|-------|
| `package-lock.json` | Eliminado | Conflicto npm/yarn |
| `yarn.lock` | Creado | Lockfile correcto |
| `eas.json` | Actualizado | Configuración óptima |
| `.gitignore` | Actualizado | Prevenir commits incorrectos |
| `fix-eas-build-simple.ps1` | Creado | Automatización de solución |

---

**Estado**: ✅ Solución completada y probada
**Comando final**: `eas build --platform ios --profile production`