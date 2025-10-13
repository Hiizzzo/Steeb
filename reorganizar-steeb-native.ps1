# Script para reorganizar STEBE en un proyecto Expo nativo con expo-router

Write-Host "🚀 Reorganizando STEBE como proyecto Expo nativo..." -ForegroundColor Green

# Paso 1: Limpiar archivos innecesarios
Write-Host "🧹 Limpiando archivos innecesarios..." -ForegroundColor Yellow

# Eliminar archivos de Capacitor
if (Test-Path "capacitor.config.ts") {
    Remove-Item "capacitor.config.ts" -Force
    Write-Host "Eliminado capacitor.config.ts" -ForegroundColor Green
}

# Eliminar carpetas de iOS y Android de Capacitor
if (Test-Path "ios") {
    try {
        Remove-Item -Recurse -Force "ios" -ErrorAction SilentlyContinue
        Write-Host "Eliminada carpeta ios de Capacitor" -ForegroundColor Green
    } catch {
        Write-Host "No se pudo eliminar ios (puede estar en uso)" -ForegroundColor Yellow
    }
}

if (Test-Path "android") {
    try {
        Remove-Item -Recurse -Force "android" -ErrorAction SilentlyContinue
        Write-Host "Eliminada carpeta android de Capacitor" -ForegroundColor Green
    } catch {
        Write-Host "No se pudo eliminar android (puede estar en uso)" -ForegroundColor Yellow
    }
}

# Eliminar yarn.lock si existe
if (Test-Path "yarn.lock") {
    Remove-Item "yarn.lock" -Force
    Write-Host "Eliminado yarn.lock" -ForegroundColor Green
}

# Eliminar archivos de Vite
if (Test-Path "vite.config.ts") {
    Remove-Item "vite.config.ts" -Force
    Write-Host "Eliminado vite.config.ts" -ForegroundColor Green
}

if (Test-Path "index.html") {
    Remove-Item "index.html" -Force
    Write-Host "Eliminado index.html" -ForegroundColor Green
}

# Paso 2: Crear estructura de directorios
Write-Host "📁 Creando estructura de directorios..." -ForegroundColor Blue

if (Test-Path "src") {
    try {
        Remove-Item -Recurse -Force "src" -ErrorAction SilentlyContinue
        Write-Host "Eliminada carpeta src" -ForegroundColor Green
    } catch {
        Write-Host "No se pudo eliminar src" -ForegroundColor Yellow
    }
}

# Paso 3: Verificar archivos clave
Write-Host "✅ Verificando archivos clave..." -ForegroundColor Cyan

if (Test-Path "app.json") {
    Write-Host "✓ app.json encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ app.json no encontrado" -ForegroundColor Red
}

if (Test-Path "package.json") {
    Write-Host "✓ package.json encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ package.json no encontrado" -ForegroundColor Red
}

if (Test-Path "eas.json") {
    Write-Host "✓ eas.json encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ eas.json no encontrado" -ForegroundColor Red
}

if (Test-Path "app\_layout.tsx") {
    Write-Host "✓ app\_layout.tsx encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ app\_layout.tsx no encontrado" -ForegroundColor Red
}

if (Test-Path "index.tsx") {
    Write-Host "✓ index.tsx encontrado" -ForegroundColor Green
} else {
    Write-Host "✗ index.tsx no encontrado" -ForegroundColor Red
}

# Paso 4: Instalar dependencias
Write-Host "📦 Instalando dependencias de Expo..." -ForegroundColor Blue

try {
    npm install
    Write-Host "✓ Dependencias instaladas con npm" -ForegroundColor Green
} catch {
    Write-Host "✗ Error instalando dependencias con npm" -ForegroundColor Red
    Write-Host "Intentando con yarn..." -ForegroundColor Yellow
    try {
        yarn install
        Write-Host "✓ Dependencias instaladas con yarn" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error instalando dependencias" -ForegroundColor Red
    }
}

# Paso 5: Verificar configuración
Write-Host "🔍 Verificando configuración de Expo..." -ForegroundColor Blue

try {
    npx expo config --type public
    Write-Host "✓ Configuración de Expo verificada" -ForegroundColor Green
} catch {
    Write-Host "✗ Error verificando configuración de Expo" -ForegroundColor Red
}

# Paso 6: Preparar para build
Write-Host "🚀 Preparando entorno para build..." -ForegroundColor Magenta

try {
    npx expo install --fix
    Write-Host "✓ Dependencias de Expo corregidas" -ForegroundColor Green
} catch {
    Write-Host "No se pudo ejecutar expo install --fix" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ ¡Reorganización completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Ejecuta 'npm start' o 'expo start' para iniciar el proyecto"
Write-Host "2. Prueba la app en el simulador o dispositivo"
Write-Host "3. Cuando estés listo, ejecuta 'eas build --platform ios --profile production'"
Write-Host ""
Write-Host "Estructura final:" -ForegroundColor Yellow
Write-Host "- app.json (configuración de Expo)"
Write-Host "- package.json (dependencias)"
Write-Host "- eas.json (configuración de EAS Build)"
Write-Host "- app/_layout.tsx (layout principal con expo-router)"
Write-Host "- app/index.tsx (página principal)"
Write-Host "- assets/images/ (iconos y splash screen)"