#!/bin/bash

echo "🤖 Configurando Stebe AI - Asistente Offline"
echo "============================================"

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Este script debe ejecutarse desde la raíz del proyecto"
    exit 1
fi

echo "📦 Instalando dependencias..."
npm install --legacy-peer-deps

echo "🏗️ Construyendo proyecto..."
npm run build

echo "📱 Configurando Capacitor para móviles..."

# Verificar si Capacitor ya está inicializado
if [ ! -f "capacitor.config.ts" ]; then
    echo "⚙️ Inicializando Capacitor..."
    npx cap init "Stebe Taskmaster" "com.stebe.taskmaster"
fi

# Agregar plataformas si no existen
if [ ! -d "android" ]; then
    echo "🤖 Agregando plataforma Android..."
    npx cap add android
fi

if [ ! -d "ios" ]; then
    echo "🍎 Agregando plataforma iOS..."
    npx cap add ios
fi

echo "🔄 Sincronizando con plataformas nativas..."
npx cap sync

echo "✅ Configuración completa!"
echo ""
echo "📝 Próximos pasos:"
echo "1. Para desarrollo web: npm run dev"
echo "2. Para Android: npx cap open android"
echo "3. Para iOS: npx cap open ios"
echo ""
echo "🧠 Funcionalidades de Stebe AI:"
echo "- Ve a /chat y haz clic en ⚙️ para configurar"
echo "- Activa el modo AI con el botón 🧠"
echo "- Funciona completamente offline"
echo "- Respuestas inteligentes sobre productividad"
echo ""
echo "📚 Para más detalles, revisa STEBE_AI_IMPLEMENTATION.md"