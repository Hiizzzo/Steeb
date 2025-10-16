# Script completo para resolver problemas de EAS Build
Write-Host "🚀 Iniciando reparación completa de EAS Build para STEEB..." -ForegroundColor Green

# Paso 1: Verificar configuración actual
Write-Host "📋 Verificando configuración actual..." -ForegroundColor Yellow
Get-Content app.json | Select-String "newArchEnabled"
Get-Content package.json | Select-String "packageManager"
Get-Content eas.json

# Paso 2: Limpiar caché de npm y Expo
Write-Host "🧹 Limpiando caché..." -ForegroundColor Blue
npm cache clean --force
if (Test-Path ".expo") { Remove-Item -Recurse -Force ".expo" }
if (Test-Path ".cache") { Remove-Item -Recurse -Force ".cache" }

# Paso 3: Instalar Yarn globalmente
Write-Host "📦 Instalando Yarn..." -ForegroundColor Blue
npm install -g yarn@1.22.22

# Paso 4: Instalar dependencias con Expo
Write-Host "🔧 Instalando dependencias de Expo..." -ForegroundColor Blue
npx expo install --fix

# Paso 5: Instalar dependencias restantes con Yarn
Write-Host "📦 Instalando dependencias con Yarn..." -ForegroundColor Blue
yarn install

# Paso 6: Verificar instalación
Write-Host "✅ Verificando instalación..." -ForegroundColor Green
yarn --version
npx expo --version

# Paso 7: Forzar rebuild con EAS
Write-Host "🚀 Iniciando build de producción con EAS..." -ForegroundColor Magenta
Write-Host "Comando: eas build -p ios --profile production --clear-cache" -ForegroundColor Cyan

# Preguntar si desea ejecutar el build
$respuesta = Read-Host "¿Deseas ejecutar el build ahora? (S/N)"
if ($respuesta -eq "S" -or $respuesta -eq "s") {
    eas build -p ios --profile production --clear-cache
} else {
    Write-Host "📌 Para ejecutar el build manualmente, usa:" -ForegroundColor Yellow
    Write-Host "eas build -p ios --profile production --clear-cache" -ForegroundColor Cyan
}

Write-Host "✅ ¡Configuración completada!" -ForegroundColor Green