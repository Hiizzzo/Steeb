# Script simple para solucionar el problema de build de iOS con EAS

Write-Host "Iniciando solucion para build de iOS con EAS..." -ForegroundColor Green

# 1. Eliminar package-lock.json
Write-Host "Eliminando package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "package-lock.json eliminado" -ForegroundColor Green
}

# 2. Verificar yarn
try {
    $yarnVersion = yarn --version
    Write-Host "Yarn version $yarnVersion encontrado" -ForegroundColor Green
}
catch {
    Write-Host "Yarn no encontrado, instalando..." -ForegroundColor Red
    npm install -g yarn
}

# 3. Generar yarn.lock
Write-Host "Generando yarn.lock..." -ForegroundColor Yellow
try {
    yarn install --ignore-engines
    Write-Host "yarn install completado" -ForegroundColor Green
}
catch {
    Write-Host "Error durante yarn install, intentando sin --ignore-engines..." -ForegroundColor Yellow
    yarn install
}

# 4. Verificar yarn.lock
if (Test-Path "yarn.lock") {
    Write-Host "yarn.lock generado exitosamente" -ForegroundColor Green
}
else {
    Write-Host "Error: No se pudo generar yarn.lock" -ForegroundColor Red
    exit 1
}

# 5. Actualizar eas.json
Write-Host "Actualizando eas.json..." -ForegroundColor Yellow
$easJson = '{
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
}'
Set-Content -Path "eas.json" -Value $easJson
Write-Host "eas.json actualizado" -ForegroundColor Green

# 6. Actualizar .gitignore
Write-Host "Actualizando .gitignore..." -ForegroundColor Yellow
$gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue
if ($gitignoreContent -notcontains "package-lock.json") {
    Add-Content ".gitignore" "package-lock.json"
}
if ($gitignoreContent -notcontains "yarn-error.log") {
    Add-Content ".gitignore" "yarn-error.log"
}
Write-Host ".gitignore actualizado" -ForegroundColor Green

Write-Host ""
Write-Host "Solucion completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen de cambios:" -ForegroundColor Cyan
Write-Host "1. Eliminado package-lock.json"
Write-Host "2. Generado yarn.lock"
Write-Host "3. Actualizado eas.json"
Write-Host "4. Actualizado .gitignore"
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Yellow
Write-Host "eas build --platform ios --profile production"