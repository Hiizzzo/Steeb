# ============================================================================
# STEEB - Script de Build para iOS desde Windows
# ============================================================================
# Este script automatiza el proceso de compilación para iOS usando EAS Build
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STEEB - iOS Build desde Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Colores
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

# Función para verificar si un comando existe
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Función para ejecutar comando y verificar resultado
function Invoke-Step {
    param(
        [string]$Description,
        [string]$Command
    )
    
    Write-Host ""
    Write-Host "► $Description..." -ForegroundColor $InfoColor
    Write-Host "  Ejecutando: $Command" -ForegroundColor Gray
    
    Invoke-Expression $Command
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Completado" -ForegroundColor $SuccessColor
        return $true
    } else {
        Write-Host "  ✗ Error (código: $LASTEXITCODE)" -ForegroundColor $ErrorColor
        return $false
    }
}

# ============================================================================
# PASO 1: Verificar Prerequisitos
# ============================================================================
Write-Host ""
Write-Host "PASO 1: Verificando prerequisitos..." -ForegroundColor $InfoColor
Write-Host "======================================" -ForegroundColor $InfoColor

# Verificar Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js instalado: $nodeVersion" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ✗ Node.js no encontrado. Instala desde https://nodejs.org" -ForegroundColor $ErrorColor
    exit 1
}

# Verificar npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "  ✓ npm instalado: $npmVersion" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ✗ npm no encontrado" -ForegroundColor $ErrorColor
    exit 1
}

# Verificar si node_modules existe
if (Test-Path "node_modules") {
    Write-Host "  ✓ Dependencias instaladas" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ⚠ node_modules no encontrado. Instalando dependencias..." -ForegroundColor $WarningColor
    npm install
}

# ============================================================================
# PASO 2: Verificar EAS CLI
# ============================================================================
Write-Host ""
Write-Host "PASO 2: Verificando EAS CLI..." -ForegroundColor $InfoColor
Write-Host "===============================" -ForegroundColor $InfoColor

if (Test-Command "eas") {
    $easVersion = eas --version
    Write-Host "  ✓ EAS CLI instalado: $easVersion" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ⚠ EAS CLI no encontrado. Instalando..." -ForegroundColor $WarningColor
    npm install -g eas-cli
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ EAS CLI instalado correctamente" -ForegroundColor $SuccessColor
    } else {
        Write-Host "  ✗ Error instalando EAS CLI" -ForegroundColor $ErrorColor
        exit 1
    }
}

# ============================================================================
# PASO 3: Login en Expo
# ============================================================================
Write-Host ""
Write-Host "PASO 3: Verificando login en Expo..." -ForegroundColor $InfoColor
Write-Host "=====================================" -ForegroundColor $InfoColor

# Verificar si ya está logueado
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Ya estás logueado como: $whoami" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ⚠ No estás logueado. Iniciando login..." -ForegroundColor $WarningColor
    eas login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Login exitoso" -ForegroundColor $SuccessColor
    } else {
        Write-Host "  ✗ Error en login. Ejecuta 'eas login' manualmente" -ForegroundColor $ErrorColor
        exit 1
    }
}

# ============================================================================
# PASO 4: Verificar Configuración
# ============================================================================
Write-Host ""
Write-Host "PASO 4: Verificando configuración..." -ForegroundColor $InfoColor
Write-Host "=====================================" -ForegroundColor $InfoColor

# Verificar app.json
if (Test-Path "app.json") {
    Write-Host "  ✓ app.json encontrado" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ✗ app.json no encontrado" -ForegroundColor $ErrorColor
    exit 1
}

# Verificar eas.json
if (Test-Path "eas.json") {
    Write-Host "  ✓ eas.json encontrado" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ⚠ eas.json no encontrado. Creando..." -ForegroundColor $WarningColor
    eas build:configure
}

# Verificar capacitor.config.ts
if (Test-Path "capacitor.config.ts") {
    Write-Host "  ✓ capacitor.config.ts encontrado" -ForegroundColor $SuccessColor
} else {
    Write-Host "  ✗ capacitor.config.ts no encontrado" -ForegroundColor $ErrorColor
    exit 1
}

# ============================================================================
# PASO 5: Ejecutar Verificación de App Review
# ============================================================================
Write-Host ""
Write-Host "PASO 5: Ejecutando verificación de App Review..." -ForegroundColor $InfoColor
Write-Host "=================================================" -ForegroundColor $InfoColor

if (Test-Path "verify-app-review-ready.js") {
    node verify-app-review-ready.js
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  ⚠ Algunas verificaciones fallaron. ¿Continuar de todos modos? (S/N)" -ForegroundColor $WarningColor
        $continue = Read-Host
        if ($continue -ne "S" -and $continue -ne "s") {
            Write-Host "  Abortando build..." -ForegroundColor $ErrorColor
            exit 1
        }
    }
} else {
    Write-Host "  ⚠ Script de verificación no encontrado. Continuando..." -ForegroundColor $WarningColor
}

# ============================================================================
# PASO 6: Build Web Assets
# ============================================================================
Write-Host ""
Write-Host "PASO 6: Construyendo web assets..." -ForegroundColor $InfoColor
Write-Host "===================================" -ForegroundColor $InfoColor

if (-not (Invoke-Step "Construyendo web assets" "npm run build")) {
    Write-Host ""
    Write-Host "  ✗ Error construyendo web assets. Verifica los errores arriba." -ForegroundColor $ErrorColor
    exit 1
}

# ============================================================================
# PASO 7: Sincronizar Capacitor
# ============================================================================
Write-Host ""
Write-Host "PASO 7: Sincronizando Capacitor..." -ForegroundColor $InfoColor
Write-Host "===================================" -ForegroundColor $InfoColor

if (-not (Invoke-Step "Sincronizando Capacitor" "npx cap sync")) {
    Write-Host ""
    Write-Host "  ⚠ Error sincronizando Capacitor. Continuando de todos modos..." -ForegroundColor $WarningColor
}

# ============================================================================
# PASO 8: Iniciar Build en EAS
# ============================================================================
Write-Host ""
Write-Host "PASO 8: Iniciando build en EAS..." -ForegroundColor $InfoColor
Write-Host "===================================" -ForegroundColor $InfoColor
Write-Host ""
Write-Host "  Este proceso tomará 10-20 minutos." -ForegroundColor $WarningColor
Write-Host "  EAS compilará tu app en servidores en la nube." -ForegroundColor $WarningColor
Write-Host ""

# Preguntar perfil de build
Write-Host "  ¿Qué perfil de build quieres usar?" -ForegroundColor $InfoColor
Write-Host "    1) production (para App Store)" -ForegroundColor Gray
Write-Host "    2) preview (para testing interno)" -ForegroundColor Gray
Write-Host "    3) development (para desarrollo)" -ForegroundColor Gray
Write-Host ""
$buildProfile = Read-Host "  Selecciona (1/2/3)"

switch ($buildProfile) {
    "1" { $profile = "production" }
    "2" { $profile = "preview" }
    "3" { $profile = "development" }
    default { $profile = "production" }
}

Write-Host ""
Write-Host "  Iniciando build con perfil: $profile" -ForegroundColor $InfoColor
Write-Host ""

eas build --platform ios --profile $profile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  ✓ Build completado exitosamente!" -ForegroundColor $SuccessColor
    Write-Host ""
    Write-Host "  El archivo .ipa está disponible en el link que EAS te proporcionó." -ForegroundColor $InfoColor
    Write-Host ""
    
    # Preguntar si quiere subir a App Store
    Write-Host "  ¿Quieres subir el build a App Store Connect ahora? (S/N)" -ForegroundColor $InfoColor
    $submit = Read-Host
    
    if ($submit -eq "S" -or $submit -eq "s") {
        Write-Host ""
        Write-Host "  Subiendo a App Store Connect..." -ForegroundColor $InfoColor
        Write-Host "  (Necesitarás tu Apple ID y App-Specific Password)" -ForegroundColor $WarningColor
        Write-Host ""
        
        eas submit --platform ios --latest
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "  ✓ Subido exitosamente a App Store Connect!" -ForegroundColor $SuccessColor
        } else {
            Write-Host ""
            Write-Host "  ✗ Error subiendo. Puedes intentar manualmente con:" -ForegroundColor $ErrorColor
            Write-Host "    eas submit --platform ios --latest" -ForegroundColor Gray
        }
    }
} else {
    Write-Host ""
    Write-Host "  ✗ Error en el build. Revisa los logs arriba." -ForegroundColor $ErrorColor
    Write-Host ""
    Write-Host "  Puedes intentar manualmente con:" -ForegroundColor $InfoColor
    Write-Host "    eas build --platform ios --profile $profile" -ForegroundColor Gray
    exit 1
}

# ============================================================================
# RESUMEN FINAL
# ============================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✓ Build completado" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "  Próximos pasos:" -ForegroundColor $InfoColor
Write-Host "    1. Descarga el .ipa del link de EAS" -ForegroundColor Gray
Write-Host "    2. Ve a App Store Connect" -ForegroundColor Gray
Write-Host "    3. Actualiza la declaración de privacidad (NO tracking)" -ForegroundColor Gray
Write-Host "    4. Sube screenshots" -ForegroundColor Gray
Write-Host "    5. Adjunta APP_STORE_REVIEW_RESPONSE.md en notas" -ForegroundColor Gray
Write-Host "    6. Submit for Review" -ForegroundColor Gray
Write-Host ""
Write-Host "  Documentos importantes:" -ForegroundColor $InfoColor
Write-Host "    - APP_STORE_REVIEW_RESPONSE.md" -ForegroundColor Gray
Write-Host "    - WINDOWS_BUILD_GUIDE.md" -ForegroundColor Gray
Write-Host "    - RESUMEN_CORRECCIONES_APP_STORE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
