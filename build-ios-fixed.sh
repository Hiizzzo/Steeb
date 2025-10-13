#!/bin/bash

# Script de construcción para iOS con manejo de errores
echo "🚀 Iniciando construcción de STEEB para iOS..."

# Verificar Node.js
NODE_VERSION=$(node --version)
echo "📌 Versión de Node.js: $NODE_VERSION"

# Limpiar caché de npm
echo "🧹 Limpiando caché de npm..."
npm cache clean --force

# Instalar dependencias sin verificar engines
echo "📦 Instalando dependencias..."
npm install --no-optional --ignore-engines

# Verificar instalación
echo "✅ Verificando instalación..."
npm list --depth=0

# Construir para producción
echo "🔨 Construyendo para producción..."
npm run build

# Sincronizar con Capacitor
echo "📱 Sincronizando con Capacitor..."
npx cap sync ios

echo "✅ ¡Construcción completada!"
echo "📌 Ahora abre Xcode con: npx cap open ios"