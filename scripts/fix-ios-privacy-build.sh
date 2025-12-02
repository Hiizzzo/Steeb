#!/bin/bash

# Script para solucionar el error de PrivacyInfo.xcprivacy en iOS build
# Este script se debe ejecutar antes de hacer el build de iOS

echo "🔧 Solucionando error de PrivacyInfo.xcprivacy para iOS build..."

# Paso 1: Verificar que el archivo PrivacyInfo.xcprivacy exista
if [ ! -f "ios/STEEB/PrivacyInfo.xcprivacy" ]; then
    echo "❌ Error: El archivo PrivacyInfo.xcprivacy no existe en ios/STEEB/"
    echo "✅ Creando archivo PrivacyInfo.xcprivacy..."
    
    # Crear directorio si no existe
    mkdir -p ios/STEEB
    
    # Crear el archivo PrivacyInfo.xcprivacy con contenido básico
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
    
    echo "✅ Archivo PrivacyInfo.xcprivacy creado exitosamente"
else
    echo "✅ El archivo PrivacyInfo.xcprivacy ya existe"
fi

# Paso 2: Limpiar caché de EAS
echo "🧹 Limpiando caché de EAS..."
eas build:clear-cache

# Paso 3: Sincronizar Capacitor
echo "🔧 Sincronizando Capacitor con iOS..."
npx cap sync ios

# Paso 4: Verificar configuración de EAS
echo "✅ Verificando configuración de EAS..."
eas build:configure --platform ios

echo "✅ Solución aplicada exitosamente!"
echo "🚀 Ahora puedes ejecutar: eas build --platform ios --profile production --clear-cache --verbose-logs --wait"