# Script para solucionar el problema de build de iOS con EAS
# Problema: EAS Build intenta usar npm ci pero el proyecto está configurado para usar yarn

Write-Host "🔧 Solucionando problema de build de iOS con EAS..." -ForegroundColor Green

# 1. Eliminar package-lock.json para evitar conflictos
Write-Host "📦 Eliminando package-lock.json para evitar conflictos..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "✅ package-lock.json eliminado" -ForegroundColor Green
}

# 2. Verificar si yarn está instalado
try {
    $yarnVersion = yarn --version
    Write-Host "✅ Yarn versión $yarnVersion encontrado" -ForegroundColor Green
}
catch {
    Write-Host "❌ Yarn no encontrado, instalando..." -ForegroundColor Red
    npm install -g yarn
}

# 3. Generar yarn.lock con la versión correcta de Node
Write-Host "📋 Generando yarn.lock con dependencias..." -ForegroundColor Yellow
try {
    yarn install --ignore-engines
    Write-Host "✅ yarn install completado" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Error durante yarn install, intentando sin --ignore-engines..." -ForegroundColor Yellow
    yarn install
}

# 4. Verificar que yarn.lock se haya creado
if (Test-Path "yarn.lock") {
    Write-Host "✅ yarn.lock generado exitosamente" -ForegroundColor Green
}
else {
    Write-Host "❌ Error: No se pudo generar yarn.lock" -ForegroundColor Red
    exit 1
}

# 5. Actualizar eas.json para asegurar configuración correcta
Write-Host "⚙️ Verificando configuración de eas.json..." -ForegroundColor Yellow
$easConfig = @{
    cli = @{
        version = ">= 11.0.0"
        appVersionSource = "local"
    }
    build = @{
        production = @{
            developmentClient = $false
            distribution = "store"
            autoIncrement = $true
            ios = @{
                resourceClass = "m-medium"
                node = "20.11.1"
            }
            env = @{
                NODE_VERSION = "20.11.1"
                EXPO_USE_YARN = "true"
                YARN_ENABLE_IMMUTABLE_INSTALLS = "false"
            }
        }
    }
    submit = @{
        production = @{
            ios = @{
                ascAppId = "6752629210"
            }
        }
    }
}

$easJson = $easConfig | ConvertTo-Json -Depth 10
Set-Content -Path "eas.json" -Value $easJson
Write-Host "✅ eas.json actualizado" -ForegroundColor Green

# 6. Asegurar que .gitignore incluya los archivos correctos
Write-Host "📝 Verificando .gitignore..." -ForegroundColor Yellow
$gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue

if ($gitignoreContent -notcontains "package-lock.json") {
    Add-Content ".gitignore" "package-lock.json"
    Write-Host "✅ Agregado package-lock.json a .gitignore" -ForegroundColor Green
}

if ($gitignoreContent -notcontains "yarn-error.log") {
    Add-Content ".gitignore" "yarn-error.log"
    Write-Host "✅ Agregado yarn-error.log a .gitignore" -ForegroundColor Green
}

# 7. Crear directorio scripts si no existe
if (!(Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" -Force
    Write-Host "✅ Directorio scripts creado" -ForegroundColor Green
}

# 8. Crear un script de prebuild si no existe
$prebuildScript = @"
#!/bin/bash
# Prebuild script para EAS Build
echo "🚀 Ejecutando prebuild..."

# Asegurar que yarn esté disponible
if ! command -v yarn &> /dev/null; then
    echo "❌ yarn no encontrado, instalando..."
    npm install -g yarn
fi

# Instalar dependencias con yarn
echo "📦 Instalando dependencias con yarn..."
yarn install --immutable || yarn install --ignore-engines

echo "✅ Prebuild completado"
"@

Set-Content -Path "scripts/prebuild.sh" -Value $prebuildScript
Write-Host "✅ Script prebuild.sh creado" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Solución completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumen de los cambios realizados:" -ForegroundColor Cyan
Write-Host "  1. ✅ Eliminado package-lock.json"
Write-Host "  2. ✅ Generado yarn.lock con yarn install --ignore-engines"
Write-Host "  3. ✅ Actualizado eas.json con configuración correcta"
Write-Host "  4. ✅ Verificado .gitignore"
Write-Host "  5. ✅ Creado script prebuild.sh"
Write-Host ""
Write-Host "🚀 Ahora puedes ejecutar:" -ForegroundColor Yellow
Write-Host "  eas build --platform ios --profile production"
Write-Host ""
Write-Host "📝 Nota: Si aún tienes problemas, asegúrate de:" -ForegroundColor Cyan
Write-Host "  - Tener la versión correcta de Node (20.11.1)"
Write-Host "  - Usar yarn localmente para todas las instalaciones"
Write-Host "  - Limpiar la caché de EAS si es necesario: eas build:clear-cache"
Write-Host ""
Write-Host "🔧 Comandos adicionales útiles:" -ForegroundColor Magenta
Write-Host "  - Verificar versión de Node: node --version"
Write-Host "  - Verificar versión de Yarn: yarn --version"
Write-Host "  - Limpiar caché de yarn: yarn cache clean"
Write-Host "  - Reinstalar dependencias: yarn install --force"