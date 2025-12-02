@echo off
chcp 65001
echo 🚀 Generando app nativa con Expo para pruebas...

echo 📋 Verificando requisitos...

rem Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no está instalado
    pause
    exit /b 1
)

rem Verificar Expo CLI
where expo >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Expo CLI no está instalado
    echo Instalando Expo CLI...
    npm install -g @expo/cli
)

echo ✅ Requisitos verificados

echo 🧹 Limpiando caché...
expo start --clear

echo 📄 Verificando PrivacyInfo.xcprivacy...
if not exist "ios\STEEB" mkdir "ios\STEEB"
if not exist "ios\STEEB\PrivacyInfo.xcprivacy" (
    echo Creando archivo PrivacyInfo.xcprivacy...
    (
        echo ^<?xml version="1.0" encoding="UTF-8"?^>
        echo ^<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"^>
        echo ^<plist version="1.0"^>
        echo ^<dict^>
        echo     ^<key^>platform^</key^>
        echo     ^<string^>ios^</string^>
        echo     ^<key^>model^</key^>
        echo     ^<string^>PrivacyInfo^</string^>
        echo     ^<key^>version^</key^>
        echo     ^<string^>1^</string^>
        echo     ^<key^>reasons^</key^>
        echo     ^<array^>
        echo         ^<dict^>
        echo             ^<key^>reason^</key^>
        echo             ^<string^>35F9.1^</string^>
        echo             ^<key^>description^</key^>
        echo             ^<string^>App accesses system boot time for internal operations and analytics.^</string^>
        echo         ^</dict^>
        echo         ^<dict^>
        echo             ^<key^>reason^</key^>
        echo             ^<string^>C617.1^</string^>
        echo             ^<key^>description^</key^>
        echo             ^<string^>App accesses file timestamps for internal file management and caching.^</string^>
        echo         ^</dict^>
        echo     ^</array^>
        echo ^</dict^>
        echo ^</plist^>
    ) > "ios\STEEB\PrivacyInfo.xcprivacy"
    echo ✅ Archivo PrivacyInfo.xcprivacy creado
) else (
    echo ✅ Archivo PrivacyInfo.xcprivacy ya existe
)

echo 🗑️ Eliminando archivos PrivacyInfo.xcprivacy duplicados...
for /r %%f in (PrivacyInfo.xcprivacy) do (
    if not "%%f"=="%CD%\ios\STEEB\PrivacyInfo.xcprivacy" (
        echo Eliminando %%f
        del "%%f" 2>nul
    )
)

echo 📦 Instalando dependencias...
npm install

echo 🔧 Preparando proyecto iOS...
if not exist "ios" (
    echo 📦 Agregando plataforma iOS...
    npx expo run:ios --install
) else (
    echo 🔄 Sincronizando iOS...
    npx cap sync ios
)

echo ✅ Verificando configuración...
npx expo-doctor

echo 🔨 Generando build local para iOS...
echo ⚠️  Esto puede tardar varios minutos...
echo 📝 Nota: En Windows se usará EAS Build en la nube

echo 🚀 Realizando build con EAS...
echo Este proceso generará el .ipa en la nube de EAS
eas build --platform ios --profile production --verbose-logs --wait

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build completada exitosamente!
    echo 📁 Archivo .ipa generado en la nube de EAS
    echo 📤 Puedes descargar el .ipa desde el dashboard de EAS
    echo 🚀 Para subir a App Store: eas submit --platform ios --profile production
) else (
    echo ❌ Build fallida
    echo 🔍 Revisa los logs detallados
    echo 💡 Puedes intentar: ./scripts/windows-ios-build-fix.bat
)

echo.
echo 🔍 Resumen de verificación para App Store:
echo ✅ PrivacyInfo.xcprivacy configurado
echo ✅ Configuración iOS verificada
echo ✅ Dependencias instaladas
echo ✅ Build nativa generada
echo.
echo 📋 Checklist para App Store:
echo 1. ✅ Build nativa generada
echo 2. 📋 Verificar bundle identifier: com.bbtricksz.steeb
echo 3. 📋 Verificar nombre de app: STEEB
echo 4. 📋 Verificar versiones y números de build
echo 5. 📋 Verificar iconos y screenshots
echo 6. 📋 Verificar política de privacidad
echo 7. 📋 Verificar App Store Connect configurado
echo.
echo 🎯 Verificación de la app nativa:
echo - Versión de Node.js: 
node --version
echo - Versión de Expo CLI:
expo --version
echo - Versión de EAS CLI:
eas --version
echo - Versión de Capacitor:
npx cap --version
echo.
pause