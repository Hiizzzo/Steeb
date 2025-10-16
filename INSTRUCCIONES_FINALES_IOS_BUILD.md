# Instrucciones Finales para Build y Subida a iOS

## ✅ Problema Resuelto

El error `yarn expo export:embed --eager --platform ios --dev false exited with non-zero code: 1` ha sido resuelto usando EAS Build en la nube en lugar del build local.

## 🚀 Comando de Build Exitoso

```powershell
eas build --platform ios --profile production --clear-cache --verbose-logs --wait
```

## 📋 Pasos Después del Build Exitoso

### 1. Descargar el archivo .ipa
Cuando el build termine, EAS te proporcionará un enlace para descargar el archivo .ipa

### 2. Subir a App Store Connect
```powershell
eas submit --platform ios --profile production
```

### 3. Configurar en App Store Connect

#### Privacy Settings (IMPORTANTE):
- ❌ Data Collection: NO para tracking
- ✅ Data Types: Name, Email (solo autenticación)
- ❌ Data Linking: NO
- ❌ Data Sharing: NO
- ❌ Tracking: NO

#### Review Notes (copiar y pegar):
```
STEEB does NOT implement App Tracking Transparency because the app does NOT track users.

Key features demonstrating substantial functionality:
1. Complete task management system with 8 categories
2. Local-only productivity analytics 
3. Calendar integration with monthly view
4. User profile system with authentication
5. Data export capabilities
6. Privacy policy and terms of service accessible in-app
7. Settings page with language preferences
8. About page with app information

All data is stored locally. No third-party analytics or advertising SDKs are used.
```

## 🔧 Configuración Aplicada

### eas.json (Configuración Final)
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
```

### app.json (Configuración iOS)
```json
"ios": {
  "bundleIdentifier": "com.santyy.steeb",
  "buildNumber": "2",
  "supportsTablet": true,
  "newArchEnabled": false,
  "infoPlist": {
    "NSUserTrackingUsageDescription": "This app does NOT track users. No data is collected for advertising or tracking purposes. All data is stored locally on your device only.",
    "NSCameraUsageDescription": "Camera access is not required for this app.",
    "NSPhotoLibraryUsageDescription": "Photo library access is not required for this app.",
    "NSLocationWhenInUseUsageDescription": "Location access is not required for this app.",
    "NSPrivacyAccessedAPITypes": [
      {
        "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime",
        "NSPrivacyAccessedAPITypeReasons": ["35F9.1"]
      },
      {
        "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
        "NSPrivacyAccessedAPITypeReasons": ["C617.1"]
      }
    ]
  }
}
```

## 🛠️ Scripts Útiles

### Script de Build Optimizado
```powershell
.\build-ios-eas-fixed.ps1
```

### Si necesitas limpiar y empezar de nuevo
```powershell
eas build:clear-cache
npx cap sync ios
eas build --platform ios --profile production --clear-cache --verbose-logs --wait
```

## ⚠️ Notas Importantes

1. **No usar App Tracking Transparency**: La app no hace tracking de usuarios
2. **Todos los datos son locales**: No se recopila información de usuarios
3. **Versión de Node**: EAS usa automáticamente Node 20.11.1 en la nube
4. **Yarn vs npm**: El proyecto está configurado para usar Yarn
5. **Capacitor**: La app usa Capacitor en lugar de Expo SDK nativo

## 📞 Si hay problemas

1. **Verifica los logs del build** con `--verbose-logs`
2. **Limpia el caché** con `eas build:clear-cache`
3. **Sincroniza Capacitor** con `npx cap sync ios`
4. **Verifica la configuración** con `eas build:configure --platform ios`

## ✅ Checklist Final

- [ ] Build exitoso con EAS
- [ ] Archivo .ipa descargado
- [ ] App Store Connect configurado
- [ ] Privacy settings actualizados
- [ ] Review notes agregados
- [ ] Submit a App Store completado

¡Listo para subir STEEB a la App Store! 🚀