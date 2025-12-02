@echo off
chcp 65001
echo 🚀 Iniciando build de iOS con solución de PrivacyInfo.xcprivacy...

echo 🧹 Limpiando caché de Expo...
expo start --clear

echo 🗑️ Limpiando node_modules y reinstalando...
rmdir /s /q node_modules
rmdir /s /q "%USERPROFILE%\.npm\_npx"
rmdir /s /q "%USERPROFILE%\.cache\expo-cli"
rmdir /s /q "%USERPROFILE%\.expo"
npm install

echo 📄 Verificando archivo PrivacyInfo.xcprivacy...
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
        del "%%f"
    )
)

echo 🔧 Sincronizando Capacitor con iOS...
npx cap sync ios

echo ✅ Verificando configuración de EAS...
npx expo run:ios --config-only

echo 🚀 Realizando build de iOS...
echo Este proceso puede tardar varios minutos...
eas build --platform ios --profile production --verbose-logs --wait

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build de iOS completado exitosamente!
    echo 📁 Archivo .ipa generado y listo para subir a App Store Connect
    echo 📤 Para subir a App Store: eas submit --platform ios --profile production
) else (
    echo ❌ El build falló. Por favor revisa los logs detallados.
    echo 🔍 Puedes intentar:
    echo    1. Verificar los logs con --verbose-logs
    echo    2. Limpiar nuevamente con expo start --clear
    echo    3. Revisar la configuración del proyecto iOS
)

pause