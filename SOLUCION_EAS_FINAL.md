# Solución Definitiva para EAS Build iOS

## 🚨 Problema Actual

El error `Failed to resolve plugin for module "expo-router"` ocurre porque:
1. Hay archivos residuales de Expo Router en el sistema
2. La configuración de Expo está tratando de cargar plugins que no existen

## ✅ Solución Paso a Paso

### Paso 1: Limpiar completamente
```bash
# Detener todos los procesos de Node
taskkill /F /IM node.exe

# Eliminar node_modules
rmdir /s /q node_modules

# Eliminar yarn.lock si existe
del yarn.lock

# Eliminar package-lock.json si existe
del package-lock.json
```

### Paso 2: Instalar con npm (no yarn)
```bash
npm install
```

### Paso 3: Verificar configuración
```bash
npx expo config --type public
```

Si funciona, continúa. Si no, hay que corregir la configuración.

### Paso 4: Iniciar sesión en EAS
```bash
npx eas login
```

### Paso 5: Build de iOS
```bash
eas build --platform ios --profile production
```

## 🔧 Si el problema persiste

### Opción A: Usar solo Expo (sin Capacitor)
```bash
# Instalar Expo CLI globalmente
npm install -g @expo/cli

# Iniciar proyecto con Expo
npx create-expo-app@latest steeb-temp --template blank-typescript

# Copiar src/ de tu proyecto actual a steeb-temp/
# Copiar public/ de tu proyecto actual a steeb-temp/
# Configurar app.json y eas.json en steeb-temp/

# Build desde el nuevo proyecto
cd steeb-temp
eas build --platform ios --profile production
```

### Opción B: Usar Vite + Capacitor directamente
```bash
# Build para producción
npm run build

# Sincronizar con Capacitor
npx cap sync ios

# Subir manualmente a App Store Connect
# (Necesita Xcode en macOS)
```

## 📱 Comandos Finales

```bash
# 1. Verificar instalación
npm install

# 2. Probar local
npm run dev

# 3. Configurar EAS
npx eas login

# 4. Build iOS
eas build --platform ios --profile production

# 5. Submit a App Store
eas submit --platform ios --profile production
```

## 💡 Recomendación

Si EAS sigue dando problemas, considera:
1. **Crear un nuevo proyecto Expo puro**
2. **Migrar solo el código fuente**
3. **Mantener la configuración simple**

## 🎯 Estado Actual

- ✅ Node.js funcionando
- ✅ npm instalando dependencias
- ⏳ Esperando instalación completa

Cuando npm termine, ejecuta `npx expo config` para verificar que todo funcione.