# Script optimizado para build de iOS con EAS para STEBE
Write-Host "🚀 Iniciando build optimizado de iOS con EAS para STEEB..." -ForegroundColor Green

# Paso 1: Verificar configuración
Write-Host "📋 Verificando configuración..." -ForegroundColor Yellow
Write-Host "Versión de EAS CLI:" -ForegroundColor Cyan
eas --version
Write-Host "Versión de Expo CLI:" -ForegroundColor Cyan
npx expo --version

# Paso 2: Limpiar caché
Write-Host "🧹 Limpiando caché de EAS..." -ForegroundColor Blue
eas build:clear-cache

# Paso 3: Sincronizar Capacitor
Write-Host "🔧 Sincronizando Capacitor con iOS..." -ForegroundColor Blue
npx cap sync ios

# Paso 4: Verificar configuración de EAS
Write-Host "✅ Verificando configuración de EAS..." -ForegroundColor Green
eas build:configure --platform ios

# Paso 5: Ejecutar build con opciones optimizadas
Write-Host "🚀 Iniciando build de iOS..." -ForegroundColor Magenta
Write-Host "Este proceso puede tardar varios minutos..." -ForegroundColor Yellow

# Opciones del build:
# --platform ios: Build para iOS
# --profile production: Perfil de producción
# --clear-cache: Limpiar caché antes del build
# --verbose-logs: Logs detallados para diagnóstico
# --wait: Esperar a que termine el build
eas build --platform ios --profile production --clear-cache --verbose-logs --wait

Write-Host "✅ ¡Build completado!" -ForegroundColor Green
Write-Host "Si el build fue exitoso, puedes subir la app a App Store con:" -ForegroundColor Cyan
Write-Host "eas submit --platform ios --profile production" -ForegroundColor Yellow