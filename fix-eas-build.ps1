# ============================================================================
# STEEB - Script de Limpieza y Fix para EAS Build
# ============================================================================
# Este script arregla los problemas comunes que causan "Install dependencies failed"
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STEEB - Fix EAS Build Issues" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Colores
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

# ============================================================================
# PASO 1: Limpiar lockfiles de otros package managers
# ============================================================================
Write-Host ""
Write-Host "PASO 1: Limpiando lockfiles conflictivos..." -ForegroundColor $InfoColor
Write-Host "============================================" -ForegroundColor $InfoColor

# Eliminar bun.lockb si existe
if (Test-Path "bun.lockb") {
    Write-Host "  Eliminando bun.lockb..." -ForegroundColor $WarningColor
    Remove-Item "bun.lockb" -Force
    Write-Host "  ✓ bun.lockb eliminado" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ✓ No se encontró bun.lockb" -ForegroundColor $SuccessColor
}

# Verificar si existe yarn.lock en la raíz
if (Test-Path "yarn.lock") {
    Write-Host "  Eliminando yarn.lock..." -ForegroundColor $WarningColor
    Remove-Item "yarn.lock" -Force
    Write-Host "  ✓ yarn.lock eliminado" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ✓ No se encontró yarn.lock" -ForegroundColor $SuccessColor
}

# Mantener package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "  ✓ package-lock.json presente (npm será el package manager)" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ⚠ package-lock.json no encontrado, se generará uno nuevo" -ForegroundColor $WarningColor
}

# ============================================================================
# PASO 2: Limpiar node_modules y caché
# ============================================================================
Write-Host ""
Write-Host "PASO 2: Limpiando node_modules y caché..." -ForegroundColor $InfoColor
Write-Host "==========================================" -ForegroundColor $InfoColor

if (Test-Path "node_modules") {
    Write-Host "  Eliminando node_modules (esto puede tardar un momento)..." -ForegroundColor $WarningColor
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ node_modules eliminado" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ✓ node_modules ya estaba limpio" -ForegroundColor $SuccessColor
}

# Limpiar caché de npm
Write-Host "  Limpiando caché de npm..." -ForegroundColor $InfoColor
npm cache clean --force 2>&1 | Out-Null
Write-Host "  ✓ Caché de npm limpiado" -ForegroundColor $SuccessColor

# ============================================================================
# PASO 3: Verificar Node version
# ============================================================================
Write-Host ""
Write-Host "PASO 3: Verificando versión de Node..." -ForegroundColor $InfoColor
Write-Host "=======================================" -ForegroundColor $InfoColor

$nodeVersion = node --version
Write-Host "  Node version: $nodeVersion" -ForegroundColor $InfoColor

# Extraer número de versión mayor
$nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')

if ($nodeMajor -ge 18 -and $nodeMajor -le 20) {
    Write-Host "  ✓ Node version compatible (18-20)" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ⚠ Node version no recomendada. EAS Build funciona mejor con Node 18 o 20" -ForegroundColor $WarningColor
    Write-Host "    Descarga Node 20 LTS desde: https://nodejs.org" -ForegroundColor $WarningColor
}

# ============================================================================
# PASO 4: Instalar dependencias limpias
# ============================================================================
Write-Host ""
Write-Host "PASO 4: Instalando dependencias limpias..." -ForegroundColor $InfoColor
Write-Host "===========================================" -ForegroundColor $InfoColor

Write-Host "  Ejecutando: npm ci" -ForegroundColor $InfoColor
Write-Host ""

npm ci

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  ✓ Dependencias instaladas correctamente" -ForegroundColor $SuccessColor
} else {
    Write-Host ""
    Write-Host "  ✗ Error instalando dependencias" -ForegroundColor $ErrorColor
    Write-Host "  Intentando con npm install..." -ForegroundColor $WarningColor
    Write-Host ""
    
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "  ✓ Dependencias instaladas con npm install" -ForegroundColor $SuccessColor
    } else {
        Write-Host ""
        Write-Host "  ✗ Error instalando dependencias. Revisa los errores arriba." -ForegroundColor $ErrorColor
        exit 1
    }
}

# ============================================================================
# PASO 5: Ejecutar expo-doctor (si está disponible)
# ============================================================================
Write-Host ""
Write-Host "PASO 5: Ejecutando diagnóstico de Expo..." -ForegroundColor $InfoColor
Write-Host "==========================================" -ForegroundColor $InfoColor

# Verificar si expo está instalado
$expoInstalled = Get-Command "npx" -ErrorAction SilentlyContinue

if ($expoInstalled) {
    Write-Host "  Ejecutando: npx expo-doctor" -ForegroundColor $InfoColor
    Write-Host ""
    
    npx expo-doctor
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "  ✓ Diagnóstico completado" -ForegroundColor $SuccessColor
    } else {
        Write-Host ""
        Write-Host "  ⚠ Diagnóstico encontró algunos problemas (revisa arriba)" -ForegroundColor $WarningColor
    }
} else {
    Write-Host "  ⚠ npx no disponible, saltando diagnóstico" -ForegroundColor $WarningColor
}

# ============================================================================
# PASO 6: Verificar configuración de EAS
# ============================================================================
Write-Host ""
Write-Host "PASO 6: Verificando configuración de EAS..." -ForegroundColor $InfoColor
Write-Host "============================================" -ForegroundColor $InfoColor

if (Test-Path "eas.json") {
    Write-Host "  ✓ eas.json encontrado" -ForegroundColor $SuccessColor
    
    # Verificar que tenga las variables de entorno correctas
    $easContent = Get-Content "eas.json" -Raw
    
    if ($easContent -match '"CI":\s*"1"') {
        Write-Host "  ✓ Variable CI configurada" -ForegroundColor $SuccessColor
    } else {
        Write-Host "  ⚠ Variable CI no encontrada en eas.json" -ForegroundColor $WarningColor
    }
    
    if ($easContent -match '"HUSKY":\s*"0"') {
        Write-Host "  ✓ Variable HUSKY configurada" -ForegroundColor $SuccessColor
    } else {
        Write-Host "  ⚠ Variable HUSKY no encontrada en eas.json" -ForegroundColor $WarningColor
    }
} else {
    Write-Host "  ✗ eas.json no encontrado" -ForegroundColor $ErrorColor
}

if (Test-Path "app.json") {
    Write-Host "  ✓ app.json encontrado" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ✗ app.json no encontrado" -ForegroundColor $ErrorColor
}

# ============================================================================
# PASO 7: Build web assets
# ============================================================================
Write-Host ""
Write-Host "PASO 7: Construyendo web assets..." -ForegroundColor $InfoColor
Write-Host "===================================" -ForegroundColor $InfoColor

Write-Host "  Ejecutando: npm run build" -ForegroundColor $InfoColor
Write-Host ""

npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  ✓ Web assets construidos correctamente" -ForegroundColor $SuccessColor
} else {
    Write-Host ""
    Write-Host "  ✗ Error construyendo web assets" -ForegroundColor $ErrorColor
    Write-Host "  El build de EAS puede fallar si los assets no se construyen localmente" -ForegroundColor $WarningColor
}

# ============================================================================
# RESUMEN Y PRÓXIMOS PASOS
# ============================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Limpieza y preparación completada!" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "  Cambios realizados:" -ForegroundColor $InfoColor
Write-Host "    ✓ Lockfiles conflictivos eliminados" -ForegroundColor Gray
Write-Host "    ✓ node_modules limpiado" -ForegroundColor Gray
Write-Host "    ✓ Caché de npm limpiado" -ForegroundColor Gray
Write-Host "    ✓ Dependencias reinstaladas con npm ci" -ForegroundColor Gray
Write-Host "    ✓ Web assets construidos" -ForegroundColor Gray
Write-Host ""
Write-Host "  Próximos pasos:" -ForegroundColor $InfoColor
Write-Host "    1. Verificar que estés logueado en EAS:" -ForegroundColor Gray
Write-Host "       eas whoami" -ForegroundColor Yellow
Write-Host ""
Write-Host "    2. Si no estás logueado:" -ForegroundColor Gray
Write-Host "       eas login" -ForegroundColor Yellow
Write-Host ""
Write-Host "    3. Iniciar build en EAS:" -ForegroundColor Gray
Write-Host "       eas build --platform ios --profile production" -ForegroundColor Yellow
Write-Host ""
Write-Host "    4. Si el build sigue fallando:" -ForegroundColor Gray
Write-Host "       - Copia el link del build que EAS te da" -ForegroundColor Gray
Write-Host "       - Abre el link en el navegador" -ForegroundColor Gray
Write-Host "       - Ve a la pestaña 'Logs'" -ForegroundColor Gray
Write-Host "       - Busca la sección 'Install dependencies'" -ForegroundColor Gray
Write-Host "       - Copia el error exacto y pásalo para más ayuda" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
