# Solución Definitiva para Build de iOS con Capacitor y EAS

## Problema Identificado

El error `We did not find any schemes in the Xcode project` ocurre porque:
1. EAS Build no puede encontrar los schemes en proyectos de Capacitor
2. La configuración por defecto de EAS está diseñada para proyectos Expo SDK nativos
3. Los proyectos de Capacitor necesitan una configuración especial

## Solución Basada en Documentación de Context7

### Opción 1: Usar EAS Build con Prebuilt (Recomendado)

Según la documentación de Expo, para proyectos con Capacitor es mejor usar el flujo de prebuilt:

1. **Asegurarse de que el proyecto esté construido localmente**:
   ```bash
   npm run build
   npx cap sync ios
   ```

2. **Usar el comando de build con soporte para Capacitor**:
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```

### Opción 2: Modificar app.json para soporte de Capacitor

Agrega la configuración de plugins en app.json:

```json
{
  "expo": {
    "plugins": [
      "@capacitor/core"
    ]
  }
}
```

### Opción 3: Usar perfil de build para simulador (Para pruebas)

Crea un perfil específico para simulador en eas.json:

```json
{
  "build": {
    "production": {
      "ios": {
        "resourceClass": "m-medium",
        "node": "20.11.1"
      }
    },
    "simulator": {
      "ios": {
        "simulator": true,
        "resourceClass": "m-medium"
      }
    }
  }
}
```

### Opción 4: Build Local con Xcode (Alternativa)

Si EAS Build continúa fallando:

1. **Abrir el proyecto en Xcode**:
   ```bash
   open ios/App/App.xcworkspace
   ```

2. **Configurar el scheme como compartido**:
   - En Xcode, ir a Product → Scheme → Manage Schemes
   - Marcar el checkbox "Shared" para el scheme "App"

3. **Build localmente**:
   ```bash
   npx expo run:ios --configuration Release
   ```

## Pasos Ejecutados

1. ✅ Limpiamos caché de npm y EAS
2. ✅ Construimos el proyecto localmente
3. ✅ Sincronizamos Capacitor con iOS
4. ✅ Configuramos eas.json con las variables de entorno correctas
5. ✅ Deshabilitamos sincronización automática de capabilities

## Comandos Finales

Para ejecutar el build:

```bash
# 1. Limpiar y construir
npm run build
npx cap sync ios

# 2. Ejecutar build de EAS
eas build --platform ios --profile production --clear-cache --verbose-logs --wait
```

## Si el Build Falla

1. **Verificar que Xcode esté instalado** (en macOS)
2. **Verificar que CocoaPods esté instalado**:
   ```bash
   sudo gem install cocoapods
   ```
3. **Reinstalar dependencias de iOS**:
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```

## Variables de Entorno Configuradas

- `NODE_VERSION`: "20.11.1"
- `EXPO_USE_YARN`: "true"
- `YARN_ENABLE_IMMUTABLE_INSTALLS`: "false"
- `EXPO_NO_CAPABILITY_SYNC`: "1"

## Configuración Final de eas.json

```json
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
        "node": "20.11.1",
        "buildConfiguration": "Release"
      },
      "env": { 
        "NODE_VERSION": "20.11.1", 
        "EXPO_USE_YARN": "true",
        "YARN_ENABLE_IMMUTABLE_INSTALLS": "false",
        "EXPO_NO_CAPABILITY_SYNC": "1"
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
```

## Referencias

- Documentación de EAS CLI: https://docs.expo.dev/build/introduction/
- Guía de Capacitor con Expo: https://docs.expo.dev/guides/capacitor/
- Troubleshooting de builds de iOS: https://docs.expo.dev/build-reference/troubleshooting/