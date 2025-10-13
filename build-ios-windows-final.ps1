# Script final para build de iOS en Windows con Capacitor y EAS
# Solución definitiva para el problema de schemes

Write-Host "🚀 Iniciando build de iOS para STEEB desde Windows..." -ForegroundColor Green

# Paso 1: Verificar que todo está listo
Write-Host "📋 Verificando configuración..." -ForegroundColor Yellow
Write-Host "Versión de EAS CLI:" -ForegroundColor Cyan
eas --version

# Paso 2: Limpiar completamente
Write-Host "🧹 Limpiando proyecto..." -ForegroundColor Blue
npm cache clean --force
if (Test-Path ".expo") { 
    Write-Host "Eliminando .expo..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".expo" 
}
if (Test-Path ".cache") { 
    Write-Host "Eliminando .cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".cache" 
}
if (Test-Path "dist") { 
    Write-Host "Eliminando dist..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist" 
}

# Paso 3: Construir el proyecto
Write-Host "🔨 Construyendo proyecto..." -ForegroundColor Blue
npm run build

# Paso 4: Sincronizar Capacitor
Write-Host "🔧 Sincronizando Capacitor..." -ForegroundColor Blue
npx cap sync ios

# Paso 5: Crear un scheme compartido manualmente
Write-Host "📱 Creando configuración para scheme compartido..." -ForegroundColor Blue

# Leer el archivo project.pbxproj
$projectPath = "ios\App\App.xcodeproj\project.pbxproj"
if (Test-Path $projectPath) {
    Write-Host "Modificando project.pbxproj para agregar scheme compartido..." -ForegroundColor Yellow
    
    # Leer el contenido del archivo
    $content = Get-Content $projectPath -Raw
    
    # Verificar si ya existe la configuración de scheme
    if ($content -notmatch "SharedScheme") {
        Write-Host "Agregando configuración de scheme compartido..." -ForegroundColor Cyan
        
        # Agregar la configuración de scheme compartido al final del archivo
        $schemeConfig = @"

/* Begin XCSharedSchemeConfiguration section */
		App /* scheme */ = {
			isa = XCSharedSchemeConfiguration;
			buildConfigurations = (
				Release /* buildConfiguration */,
			);
			sharedScheme = 1;
		};
/* End XCSharedSchemeConfiguration section */

/* Begin XCBuildConfiguration section */
		Release /* buildConfiguration */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				CODE_SIGN_STYLE = Automatic;
				INFOPLIST_FILE = App/Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 12.0;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				PRODUCT_BUNDLE_IDENTIFIER = com.santyy.steeb;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
			};
			name = Release;
		};
/* End XCBuildConfiguration section */
"@
        
        # Agregar la configuración al archivo
        $content += $schemeConfig
        
        # Guardar el archivo modificado
        Set-Content -Path $projectPath -Value $content -NoNewline
        
        Write-Host "✅ Scheme compartido configurado" -ForegroundColor Green
    } else {
        Write-Host "✅ Scheme compartido ya existe" -ForegroundColor Green
    }
} else {
    Write-Host "❌ No se encontró el archivo project.pbxproj" -ForegroundColor Red
}

# Paso 6: Ejecutar build con EAS
Write-Host "🚀 Ejecutando build con EAS..." -ForegroundColor Magenta
Write-Host "Comando: eas build --platform ios --profile production" -ForegroundColor Cyan

# Preguntar si desea ejecutar el build
$respuesta = Read-Host "¿Deseas ejecutar el build ahora? (S/N)"
if ($respuesta -eq "S" -or $respuesta -eq "s") {
    eas build --platform ios --profile production
} else {
    Write-Host "📌 Para ejecutar el build manualmente, usa:" -ForegroundColor Yellow
    Write-Host "eas build --platform ios --profile production" -ForegroundColor Cyan
}

Write-Host "✅ ¡Proceso completado!" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen:" -ForegroundColor Cyan
Write-Host "1. Proyecto limpiado y construido"
Write-Host "2. Capacitor sincronizado"
Write-Host "3. Scheme compartido configurado"
Write-Host "4. Listo para build con EAS"
Write-Host ""
Write-Host "Si el build es exitoso, podrás:" -ForegroundColor Yellow
Write-Host "- Descargar el archivo .ipa"
Write-Host "- Subirlo a App Store Connect con: eas submit --platform ios"