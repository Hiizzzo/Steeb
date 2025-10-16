# Script de construcción para iOS con manejo de errores (PowerShell)
Write-Host "🚀 Iniciando construcción de STEEB para iOS..." -ForegroundColor Green

# Verificar Node.js
$nodeVersion = node --version
Write-Host "📌 Versión de Node.js: $nodeVersion" -ForegroundColor Yellow

# Limpiar caché de npm
Write-Host "🧹 Limpiando caché de npm..." -ForegroundColor Blue
npm cache clean --force

# Instalar dependencias sin verificar engines
Write-Host "📦 Instalando dependencias..." -ForegroundColor Blue
npm install --no-optional --ignore-engines

# Verificar instalación
Write-Host "✅ Verificando instalación..." -ForegroundColor Green
npm list --depth=0

# Construir para producción
Write-Host "🔨 Construyendo para producción..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en la construcción" -ForegroundColor Red
    exit 1
}

# Sincronizar con Capacitor
Write-Host "📱 Sincronizando con Capacitor..." -ForegroundColor Blue
npx cap sync ios

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en sincronización con Capacitor" -ForegroundColor Red
    exit 1
}

Write-Host "✅ ¡Construcción completada!" -ForegroundColor Green
Write-Host "📌 Ahora abre Xcode con: npx cap open ios" -ForegroundColor Yellow