# Script completo para resolver problemas de build de iOS con Capacitor y EAS
# Basado en la documentación oficial de Expo y EAS CLI

Write-Host "🚀 Iniciando reparación completa de EAS Build para STEEB con Capacitor..." -ForegroundColor Green

# Paso 1: Verificar configuración actual
Write-Host "📋 Verificando configuración actual..." -ForegroundColor Yellow
Write-Host "Versión de EAS CLI:" -ForegroundColor Cyan
eas --version
Write-Host "Versión de Expo CLI:" -ForegroundColor Cyan
npx expo --version

# Paso 2: Limpiar caché de npm y Expo
Write-Host "🧹 Limpiando caché..." -ForegroundColor Blue
npm cache clean --force
eas build:clear-cache

# Paso 3: Limpiar directorios de build
Write-Host "🗂️ Limpiando directorios de build..." -ForegroundColor Blue
if (Test-Path ".expo") { 
    Write-Host "Eliminando directorio .expo..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".expo" 
}
if (Test-Path ".cache") { 
    Write-Host "Eliminando directorio .cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".cache" 
}
if (Test-Path "dist") { 
    Write-Host "Eliminando directorio dist..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist" 
}

# Paso 4: Instalar Yarn si no está disponible
Write-Host "📦 Verificando Yarn..." -ForegroundColor Blue
try {
    $yarnVersion = yarn --version
    Write-Host "Yarn version $yarnVersion encontrado" -ForegroundColor Green
}
catch {
    Write-Host "Yarn no encontrado, instalando..." -ForegroundColor Red
    npm install -g yarn@1.22.22
}

# Paso 5: Instalar dependencias con Yarn (ignorando engines)
Write-Host "📦 Instalando dependencias con Yarn..." -ForegroundColor Blue
yarn install --ignore-engines

# Paso 6: Construir el proyecto para producción
Write-Host "🔨 Construyendo el proyecto para producción..." -ForegroundColor Blue
yarn build

# Paso 7: Sincronizar Capacitor con iOS
Write-Host "🔧 Sincronizando Capacitor con iOS..." -ForegroundColor Blue
npx cap sync ios

# Paso 8: Verificar configuración de EAS
Write-Host "✅ Verificando configuración de EAS..." -ForegroundColor Green
eas build:configure --platform ios

# Paso 9: Inspeccionar el proyecto antes del build (opcional, para diagnóstico)
Write-Host "🔍 Inspeccionando el proyecto antes del build..." -ForegroundColor Yellow
$respuesta = Read-Host "¿Deseas inspeccionar el proyecto antes del build? (S/N)"
if ($respuesta -eq "S" -or $respuesta -eq "s") {
    Write-Host "Creando directorio de inspección..." -ForegroundColor Cyan
    if (Test-Path "inspect-build") {
        Remove-Item -Recurse -Force "inspect-build"
    }
    New-Item -ItemType Directory -Path "inspect-build"
    eas build:inspect -p ios -s pre-build -o inspect-build -e production --force
    Write-Host "Inspección completada. Revisa el directorio inspect-build" -ForegroundColor Green
}

# Paso 10: Ejecutar build con EAS
Write-Host "🚀 Iniciando build de producción con EAS..." -ForegroundColor Magenta
Write-Host "Comando: eas build -p ios --profile production --clear-cache --verbose-logs --wait" -ForegroundColor Cyan

# Preguntar si desea ejecutar el build
$respuesta = Read-Host "¿Deseas ejecutar el build ahora? (S/N)"
if ($respuesta -eq "S" -or $respuesta -eq "s") {
    # Ejecutar con variables de entorno para evitar sincronización automática de capabilities
    $env:EXPO_NO_CAPABILITY_SYNC = "1"
    $env:EXPO_DEBUG = "1"
    
    Write-Host "Ejecutando build con EXPO_NO_CAPABILITY_SYNC=1 y EXPO_DEBUG=1" -ForegroundColor Yellow
    eas build -p ios --profile production --clear-cache --verbose-logs --wait
    
    # Limpiar variables de entorno
    Remove-Item Env:EXPO_NO_CAPABILITY_SYNC
    Remove-Item Env:EXPO_DEBUG
} else {
    Write-Host "📌 Para ejecutar el build manualmente, usa:" -ForegroundColor Yellow
    Write-Host "EXPO_NO_CAPABILITY_SYNC=1 EXPO_DEBUG=1 eas build -p ios --profile production --clear-cache --verbose-logs --wait" -ForegroundColor Cyan
}

Write-Host "✅ ¡Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen de cambios aplicados:" -ForegroundColor Cyan
Write-Host "1. Limpiado caché de npm y EAS"
Write-Host "2. Instaladas dependencias con yarn --ignore-engines"
Write-Host "3. Construido proyecto para producción"
Write-Host "4. Sincronizado Capacitor con iOS"
Write-Host "5. Configurado EXPO_NO_CAPABILITY_SYNC=1 para evitar problemas de capabilities"
Write-Host "6. Configurado EXPO_DEBUG=1 para logs detallados"
Write-Host ""
Write-Host "Si el build falla, revisa:" -ForegroundColor Yellow
Write-Host "- Los logs del build para identificar el problema específico"
Write-Host "- La configuración en app.json y eas.json"
Write-Host "- Que no haya conflictos entre npm y yarn"