# 🛠️ Guía para Solucionar Error de PrivacyInfo.xcprivacy en iOS Build

## 📋 Problema Identificado

El error que estás experimentando es:
```
❌ error: Multiple commands produce '/Users/expo/workingdir/build/ios/build/Build/Products/Release-iphonesimulator/STEEB.app/PrivacyInfo.xcprivacy'
```

Este error ocurre porque múltiples pods y dependencias están tratando de crear el mismo archivo `PrivacyInfo.xcprivacy`, lo que genera un conflicto durante el build de iOS.

## ✅ Solución Aplicada

### 1. Archivos Modificados

#### 🔧 `eas.json` - Configuración de Build
- Añadida configuración específica para iOS con `resourceClass: "m-medium"` y `node: "20.11.1"`
- Configuración de variables de entorno para Node y Yarn

#### 🔧 `app.json` - Configuración de Expo
- Añadidos permisos de privacidad en `infoPlist`
- Configuración de `expo-build-properties` con `privacyInfo.aggregated: true`
- Ruta específica para el archivo de privacidad

### 2. Archivos Creados

#### 📄 `ios/STEEB/PrivacyInfo.xcprivacy`
- Archivo de manifiesto de privacidad requerido por Apple
- Contiene las razones de acceso a APIs del sistema

#### 📄 `scripts/fix-ios-privacy-build.sh`
- Script automatizado para solucionar el problema
- Realiza limpieza de caché y sincronización

## 🚀 Pasos para el Build

### Opción 1: Usar el Script Automatizado
```bash
# Dar permisos de ejecución al script
chmod +x scripts/fix-ios-privacy-build.sh

# Ejecutar el script de solución
./scripts/fix-ios-privacy-build.sh

# Realizar el build
eas build --platform ios --profile production --clear-cache --verbose-logs --wait
```

### Opción 2: Pasos Manuales
```bash
# 1. Asegurarse de que el archivo PrivacyInfo.xcprivacy exista
# (Ya creado en ios/STEEB/PrivacyInfo.xcprivacy)

# 2. Limpiar caché de EAS
eas build:clear-cache

# 3. Sincronizar Capacitor
npx cap sync ios

# 4. Verificar configuración de EAS
eas build:configure --platform ios

# 5. Realizar el build con configuración optimizada
eas build --platform ios --profile production --clear-cache --verbose-logs --wait
```

## 🔍 Configuración Clave

### Privacy Manifest Aggregation
La configuración clave que soluciona el problema es:
```json
{
  "expo-build-properties": {
    "ios": {
      "privacyInfo": {
        "aggregated": true,
        "path": "./ios/STEEB/PrivacyInfo.xcprivacy"
      }
    }
  }
}
```

Esto permite que Expo aggregate todos los PrivacyInfo.xcprivacy de las dependencias en uno solo.

## ⚠️ Notas Importantes

1. **Versión de Node**: El build usa Node 20.11.1 en la nube de EAS
2. **Yarn**: El proyecto está configurado para usar Yarn
3. **Capacitor**: La app usa Capacitor, por eso es importante el sync
4. **Privacidad**: La app declara específicamente que NO hace tracking de usuarios

## 📞 Si el Problema Persiste

1. **Verifica los logs completos**:
   ```bash
   eas build --platform ios --profile production --verbose-logs --wait
   ```

2. **Revisa la configuración del proyecto iOS**:
   ```bash
   eas build:configure --platform ios
   ```

3. **Limpieza profunda**:
   ```bash
   eas build:clear-cache
   rm -rf node_modules
   rm -rf ios/Pods
   rm -rf ios/.symlink
   npm install
   npx cap sync ios
   ```

## ✅ Resultado Esperado

Después de aplicar esta solución, el build de iOS debería completarse exitosamente sin el error de PrivacyInfo.xcprivacy múltiple.

El archivo generado será un `.ipa` listo para ser subido a App Store Connect mediante:
```bash
eas submit --platform ios --profile production
```

## 🎯 Checklist de Verificación

- [ ] Archivo `ios/STEEB/PrivacyInfo.xcprivacy` creado
- [ ] Configuración de `eas.json` actualizada
- [ ] Configuración de `app.json` actualizada con privacyInfo.aggregated
- [ ] Script de solución creado
- [ ] Build de iOS exitoso
- [ ] Archivo .ipa generado
- [ ] Submit a App Store Connect exitoso

¡Listo para resolver el problema de PrivacyInfo.xcprivacy! 🚀