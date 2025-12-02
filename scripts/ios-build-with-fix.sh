#!/bin/bash

# Script completo para build de iOS con solución de PrivacyInfo.xcprivacy

echo "🚀 Iniciando build de iOS con solución de PrivacyInfo.xcprivacy..."

# Paso 1: Limpiar todo el caché
echo "🧹 Limpiando todo el caché..."
expo start --clear

# Paso 2: Limpiar node_modules y reinstalar
echo "🗑️ Limpiando node_modules y reinstalando..."
rm -rf node_modules
rm -rf ~/.npm/_npx
rm -rf ~/.cache/expo-cli
rm -rf ~/.expo
npm install

# Paso 3: Asegurar que el archivo PrivacyInfo.xcprivacy exista
echo "📄 Verificando archivo PrivacyInfo.xcprivacy..."
mkdir -p ios/STEEB
if [ ! -f "ios/STEEB/PrivacyInfo.xcprivacy" ]; then
    cat > ios/STEEB/PrivacyInfo.xcprivacy << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>platform</key>
	<string>ios</string>
	<key>model</key>
	<string>PrivacyInfo</string>
	<key>version</key>
	<string>1</string>
	<key>reasons</key>
	<array>
		<dict>
			<key>reason</key>
			<string>35F9.1</string>
			<key>description</key>
			<string>App accesses system boot time for internal operations and analytics.</string>
		</dict>
		<dict>
			<key>reason</key>
			<string>C617.1</string>
			<key>description</key>
			<string>App accesses file timestamps for internal file management and caching.</string>
		</dict>
	</array>
</dict>
</plist>
EOF
    echo "✅ Archivo PrivacyInfo.xcprivacy creado"
else
    echo "✅ Archivo PrivacyInfo.xcprivacy ya existe"
fi

# Paso 4: Eliminar cualquier otro archivo PrivacyInfo.xcprivacy que pueda causar conflicto
echo "🗑️ Eliminando archivos PrivacyInfo.xcprivacy duplicados..."
find . -name "PrivacyInfo.xcprivacy" -type f -not -path "./ios/STEEB/PrivacyInfo.xcprivacy" -delete 2>/dev/null || true

# Paso 5: Sincronizar Capacitor
echo "🔧 Sincronizando Capacitor con iOS..."
npx cap sync ios 2>/dev/null || npx cap add ios && npx cap sync ios

# Paso 6: Verificar configuración de EAS
echo "✅ Verificando configuración de EAS..."
eas build:configure --platform ios

# Paso 7: Realizar el build con configuración específica
echo "🚀 Realizando build de iOS..."
echo "Este proceso puede tardar varios minutos..."

eas build --platform ios --profile production --verbose-logs --wait

# Paso 8: Verificación final
if [ $? -eq 0 ]; then
    echo "✅ Build de iOS completado exitosamente!"
    echo "📁 Archivo .ipa generado y listo para subir a App Store Connect"
    echo "📤 Para subir a App Store: eas submit --platform ios --profile production"
else
    echo "❌ El build falló. Por favor revisa los logs detallados."
    echo "🔍 Puedes intentar:"
    echo "   1. Verificar los logs con --verbose-logs"
    echo "   2. Limpiar nuevamente con eas build:clear-cache"
    echo "   3. Revisar la configuración del proyecto iOS"
fi