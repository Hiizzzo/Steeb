# =============================================================================
# SCRIPT DE BUILD PARA iOS CON EAS - STEEB APP
# =============================================================================
# Este script prepara y ejecuta el build de iOS para EAS con autenticación

Write-Host "🚀 Preparando build de iOS para STEEB con EAS..." -ForegroundColor Green

# 1. Limpiar build anterior
Write-Host "🧹 Limpiando build anterior..." -ForegroundColor Yellow
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

# 2. Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install --legacy-peer-deps

# 3. Verificar configuración de EAS
Write-Host "🔍 Verificando configuración de EAS..." -ForegroundColor Yellow
npx eas build:list

# 4. Previsualizar build
Write-Host "👀 Previsualizando configuración del build..." -ForegroundColor Yellow
npx eas build --platform ios --profile production --non-interactive --dry-run

# 5. Ejecutar build
Write-Host "🏗️ Iniciando build de iOS para producción..." -ForegroundColor Green
Write-Host "⚠️ Este proceso tomará varios minutos..." -ForegroundColor Yellow

npx eas build --platform ios --profile production --non-interactive

Write-Host "✅ Build completado! Revisa el panel de EAS para descargar el .ipa" -ForegroundColor Green