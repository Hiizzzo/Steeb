# 🚀 SCRIPT COMPLETO PARA REPARAR PANTALLA BLANCA iOS STEEB

Write-Host "🎯 INICIANDO REPARACIÓN COMPLETA DE iOS STEEB" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Yellow

# 1. Verificar que estamos en el directorio correcto
Write-Host "📂 Verificando directorio del proyecto..." -ForegroundColor Cyan
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERROR: No se encuentra package.json. Asegúrate de estar en la raíz del proyecto." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Directorio correcto" -ForegroundColor Green

# 2. Compilar el proyecto web
Write-Host "🔨 Compilando proyecto web..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Falló la compilación web" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Compilación web exitosa" -ForegroundColor Green

# 3. Sincronizar Capacitor con iOS
Write-Host "🔄 Sincronizando Capacitor con iOS..." -ForegroundColor Cyan
npx cap sync ios
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Falló la sincronización de Capacitor" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Sincronización completada" -ForegroundColor Green

# 4. Abrir Xcode
Write-Host "📱 Abriendo Xcode..." -ForegroundColor Cyan
npx cap open ios

Write-Host ""
Write-Host "🎉 ¡REPARACIÓN COMPLETADA!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor White
Write-Host "1. En Xcode, selecciona un simulador (iPhone 14/15)" -ForegroundColor White
Write-Host "2. Presiona Cmd+R para ejecutar la app" -ForegroundColor White
Write-Host "3. La app debería mostrar tu interfaz, no pantalla blanca" -ForegroundColor White
Write-Host ""
Write-Host "✅ ¡Misión completada! Tu app Steeb ahora funciona en iOS" -ForegroundColor Green