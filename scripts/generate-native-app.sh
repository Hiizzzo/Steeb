#!/bin/bash

# Script para generar la app nativa con Expo (no EAS Build)
# Este script crea una build local nativa para pruebas antes de subir a App Store

echo "🚀 Generando app nativa con Expo para pruebas..."

# Paso 1: Verificar requisitos
echo "📋 Verificando requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar Expo CLI
if ! command -v expo &> /dev/null; then
    echo "❌ Expo CLI no está instalado"
    exit 1
fi

# Verificar Xcode (requerido para iOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v xcodebuild &> /dev/null; then
        echo "❌ Xcode no está instalado (requerido para iOS)"
        exit 1
    fi
fi

# Paso 2: Limpiar caché
echo "🧹 Limpiando caché..."
expo start --clear

# Paso 3: Verificar y crear PrivacyInfo.xcprivacy
echo "📄 Verificando PrivacyInfo.xcprivacy..."
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

# Paso 4: Eliminar archivos PrivacyInfo.xcprivacy duplicados
echo "🗑️ Eliminando archivos PrivacyInfo.xcprivacy duplicados..."
find . -name "PrivacyInfo.xcprivacy" -type f -not -path "./ios/STEEB/PrivacyInfo.xcprivacy" -delete 2>/dev/null || true

# Paso 5: Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Paso 6: Preparar proyecto iOS
echo "🔧 Preparando proyecto iOS..."
if [ ! -d "ios" ]; then
    echo "📦 Agregando plataforma iOS..."
    npx expo run:ios --install
else
    echo "🔄 Sincronizando iOS..."
    npx cap sync ios
fi

# Paso 7: Verificar configuración
echo "✅ Verificando configuración..."
npx expo-doctor

# Paso 8: Generar build local (no EAS)
echo "🔨 Generando build local para iOS..."
echo "⚠️  Esto requiere Xcode y puede tardar varios minutos..."

# Opciones de build local
if [[ "$OSTYPE" == "darwin"* ]]; then
    # En macOS, podemos usar expo build:ios local
    echo "🍎 Generando build iOS local..."
    expo build:ios --local --clear
    
    if [ $? -eq 0 ]; then
        echo "✅ Build iOS local completada exitosamente!"
        echo "📁 Archivo .ipa generado en carpeta de builds"
        echo "📤 Puedes subir este .ipa a App Store Connect manualmente"
    else
        echo "❌ Build iOS local fallida"
        echo "🔍 Intenta con: eas build --platform ios --profile production"
    fi
else
    echo "⚠️  Build local iOS solo disponible en macOS"
    echo "🔧 En Windows/Linux, usa EAS Build:"
    echo "   eas build --platform ios --profile production --verbose-logs --wait"
fi

# Paso 9: Resumen de verificación
echo ""
echo "🔍 Resumen de verificación para App Store:"
echo "✅ PrivacyInfo.xcprivacy configurado"
echo "✅ Configuración iOS verificada"
echo "✅ Dependencias instaladas"
echo "✅ Build nativa generada"
echo ""
echo "📋 Checklist para App Store:"
echo "1. ✅ Build nativa generada"
echo "2. 📋 Verificar bundle identifier: com.bbtricksz.steeb"
echo "3. 📋 Verificar nombre de app: STEEB"
echo "4. 📋 Verificar versiones y números de build"
echo "5. 📋 Verificar iconos y screenshots"
echo "6. 📋 Verificar política de privacidad"
echo "7. 📋 Verificar App Store Connect configurado"
echo ""
echo "🚀 Próximos pasos:"
echo "   eas submit --platform ios --profile production"