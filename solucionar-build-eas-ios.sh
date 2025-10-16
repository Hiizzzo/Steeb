#!/bin/bash

# Script para solucionar el problema de build de iOS con EAS
# Problema: EAS Build intenta usar npm ci pero el proyecto está configurado para usar yarn

echo "🔧 Solucionando problema de build de iOS con EAS..."

# 1. Eliminar package-lock.json para evitar conflictos
echo "📦 Eliminando package-lock.json para evitar conflictos..."
rm -f package-lock.json

# 2. Generar yarn.lock con la versión correcta de Node
echo "📋 Generando yarn.lock con dependencias..."
yarn install --ignore-engines

# 3. Verificar que yarn.lock se haya creado
if [ -f "yarn.lock" ]; then
    echo "✅ yarn.lock generado exitosamente"
else
    echo "❌ Error: No se pudo generar yarn.lock"
    exit 1
fi

# 4. Actualizar eas.json para asegurar configuración correcta
echo "⚙️ Verificando configuración de eas.json..."
cat > eas.json << 'EOF'
{
  "cli": { 
    "version": ">= 11.0.0", 
    "appVersionSource": "local" 
  },
  "build": {
    "production": {
      "developmentClient": false,
      "distribution": "store",
      "autoIncrement": true,
      "ios": { 
        "resourceClass": "m-medium",
        "node": "20.11.1"
      },
      "env": { 
        "NODE_VERSION": "20.11.1", 
        "EXPO_USE_YARN": "true",
        "YARN_ENABLE_IMMUTABLE_INSTALLS": "false"
      }
    }
  },
  "submit": { 
    "production": { 
      "ios": { 
        "ascAppId": "6752629210" 
      } 
    } 
  }
}
EOF

echo "✅ eas.json actualizado"

# 5. Asegurar que .gitignore incluya los archivos correctos
echo "📝 Verificando .gitignore..."
if ! grep -q "package-lock.json" .gitignore; then
    echo "package-lock.json" >> .gitignore
fi

if ! grep -q "yarn-error.log" .gitignore; then
    echo "yarn-error.log" >> .gitignore
fi

echo "✅ .gitignore actualizado"

# 6. Crear un script de prebuild si no existe
if [ ! -f "scripts/prebuild.sh" ]; then
    mkdir -p scripts
    cat > scripts/prebuild.sh << 'EOF'
#!/bin/bash
# Prebuild script para EAS Build
echo "🚀 Ejecutando prebuild..."

# Asegurar que yarn esté disponible
if ! command -v yarn &> /dev/null; then
    echo "❌ yarn no encontrado, instalando..."
    npm install -g yarn
fi

# Instalar dependencias con yarn
echo "📦 Instalando dependencias con yarn..."
yarn install --immutable || yarn install --ignore-engines

echo "✅ Prebuild completado"
EOF
    chmod +x scripts/prebuild.sh
    echo "✅ Script prebuild.sh creado"
fi

echo ""
echo "🎉 Solución completada!"
echo ""
echo "📋 Resumen de los cambios realizados:"
echo "  1. ✅ Eliminado package-lock.json"
echo "  2. ✅ Generado yarn.lock con yarn install --ignore-engines"
echo "  3. ✅ Actualizado eas.json con configuración correcta"
echo "  4. ✅ Verificado .gitignore"
echo "  5. ✅ Creado script prebuild.sh"
echo ""
echo "🚀 Ahora puedes ejecutar:"
echo "  eas build --platform ios --profile production"
echo ""
echo "📝 Nota: Si aún tienes problemas, asegúrate de:"
echo "  - Tener la versión correcta de Node (20.11.1)"
echo "  - Usar yarn localmente para todas las instalaciones"
echo "  - Limpiar la caché de EAS si es necesario: eas build:clear-cache"