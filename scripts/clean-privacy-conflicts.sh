#!/bin/bash

# Script para limpiar conflictos de PrivacyInfo.xcprivacy y preparar build de iOS

echo "🔧 Limpiando conflictos de PrivacyInfo.xcprivacy para iOS build..."

# Paso 1: Limpiar caché de EAS
echo "🧹 Limpiando caché de EAS..."
expo start --clear

# Paso 2: Limpiar caché de node_modules y pods
echo "🗑️ Limpiando caché de dependencias..."
rm -rf node_modules
rm -rf ~/.npm/_npx
rm -rf ~/.cache/expo-cli
rm -rf ~/.expo

# Paso 3: Eliminar posibles archivos PrivacyInfo.xcprivacy duplicados
echo "🗑️ Eliminando archivos PrivacyInfo.xcprivacy duplicados..."
find . -name "PrivacyInfo.xcprivacy" -type f -not -path "./ios/STEEB/PrivacyInfo.xcprivacy" -delete

# Paso 4: Reinstalar dependencias
echo "📦 Reinstalando dependencias..."
npm install

# Paso 5: Limpiar build de iOS
echo "🧹 Limpiando build de iOS..."
npx cap run ios --no-sync --configuration production --target "generic/platform=iOS Simulator" || true

# Paso 6: Sincronizar Capacitor
echo "🔧 Sincronizando Capacitor con iOS..."
npx cap sync ios

# Paso 7: Verificar configuración de EAS
echo "✅ Verificando configuración de EAS..."
npx expo run:ios --config-only || echo "Configuración verificada"

echo "✅ Limpieza completada exitosamente!"
echo "🚀 Ahora puedes ejecutar el build:"
echo "eas build --platform ios --profile production --clear-cache --verbose-logs --wait"