# 🪟 Guía de Build para iOS desde Windows - STEEB

## ⚠️ Importante
**Xcode solo funciona en macOS**, pero puedes compilar para iOS desde Windows usando **EAS Build** (Expo Application Services).

---

## 🎯 Opción 1: EAS Build (RECOMENDADO) ⭐

EAS Build compila tu app en servidores en la nube de Expo. **Funciona desde Windows**.

### Paso 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Paso 2: Login en Expo

```bash
eas login
```

Si no tienes cuenta:
```bash
eas register
```

### Paso 3: Configurar EAS

```bash
eas build:configure
```

Esto creará un archivo `eas.json` (ya existe en tu proyecto).

### Paso 4: Actualizar eas.json

Verifica que `eas.json` tenga esta configuración:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "simulator": false,
        "bundleIdentifier": "com.santyy.steeb"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Paso 5: Construir Web Assets

```bash
npm run build
```

### Paso 6: Sincronizar Capacitor

```bash
npx cap sync
```

### Paso 7: Crear Build para iOS (en la nube)

```bash
eas build --platform ios --profile production
```

**Esto hará**:
- ✅ Compilar tu app en servidores de Expo (macOS en la nube)
- ✅ Generar un archivo `.ipa` (instalador de iOS)
- ✅ Subir automáticamente a App Store Connect (si configuras)

**Tiempo estimado**: 10-20 minutos

### Paso 8: Descargar el .ipa

Cuando termine, EAS te dará un link para descargar el `.ipa`:
```
✔ Build finished
https://expo.dev/accounts/[tu-cuenta]/projects/steeb/builds/[build-id]
```

### Paso 9: Subir a App Store Connect

**Opción A: Automático con EAS Submit**
```bash
eas submit --platform ios --latest
```

Te pedirá:
- Apple ID
- App-specific password (generar en appleid.apple.com)
- Bundle ID: `com.santyy.steeb`

**Opción B: Manual con Transporter**
1. Descarga [Apple Transporter](https://apps.apple.com/us/app/transporter/id1450874784) (requiere macOS)
2. O usa la web de App Store Connect para subir el `.ipa`

---

## 🎯 Opción 2: Usar un Mac en la Nube

Si EAS Build no funciona, puedes rentar un Mac en la nube:

### Servicios Recomendados:
1. **MacStadium** - https://www.macstadium.com (desde $79/mes)
2. **MacinCloud** - https://www.macincloud.com (desde $30/mes)
3. **AWS EC2 Mac Instances** - https://aws.amazon.com/ec2/instance-types/mac/

### Pasos:
1. Rentar Mac en la nube
2. Conectarte por VNC/Remote Desktop
3. Seguir los pasos de `IOS_BUILD_INSTRUCTIONS.md`

---

## 🎯 Opción 3: Pedir Ayuda a Alguien con Mac

Si conoces a alguien con Mac:
1. Comparte tu proyecto (GitHub/ZIP)
2. Que siga `IOS_BUILD_INSTRUCTIONS.md`
3. Te envía el archivo `.ipa` generado

---

## 📋 Configuración Necesaria (Antes de Build)

### 1. Cuenta de Apple Developer

Necesitas:
- ✅ Apple Developer Account ($99/año)
- ✅ Registrado en https://developer.apple.com
- ✅ App creada en App Store Connect

### 2. Certificados y Provisioning Profiles

**Con EAS Build** (automático):
```bash
eas credentials
```

EAS te ayudará a crear:
- Distribution Certificate
- Provisioning Profile
- Push Notification Keys (si usas notificaciones)

**Manual** (si usas Xcode):
1. Ir a https://developer.apple.com/account/resources/certificates
2. Crear "iOS Distribution Certificate"
3. Crear "App Store Provisioning Profile"

### 3. App-Specific Password

Para subir a App Store:
1. Ir a https://appleid.apple.com
2. Sign In
3. Security → App-Specific Passwords
4. Generate new password
5. Guardar para usar con `eas submit`

---

## 🚀 Comandos Completos desde Windows

### Build Completo con EAS:

```bash
# 1. Instalar EAS CLI (una vez)
npm install -g eas-cli

# 2. Login
eas login

# 3. Construir web assets
npm run build

# 4. Sincronizar Capacitor
npx cap sync

# 5. Build para iOS (en la nube)
eas build --platform ios --profile production

# 6. Esperar (10-20 min)
# EAS te mostrará el progreso en tiempo real

# 7. Subir a App Store Connect
eas submit --platform ios --latest
```

---

## 🔧 Solución de Problemas

### Error: "No Apple Developer account found"
**Solución**:
```bash
eas credentials
```
Selecciona "Set up credentials" y sigue las instrucciones.

### Error: "Bundle identifier mismatch"
**Solución**:
Verifica que en `app.json` y `capacitor.config.ts` tengas:
```json
"bundleIdentifier": "com.santyy.steeb"
```

### Error: "Build failed - missing dependencies"
**Solución**:
```bash
npm install
npm run build
npx cap sync
```

### Error: "Invalid provisioning profile"
**Solución**:
```bash
eas credentials
```
Regenera los credentials.

---

## 📊 Verificar que Todo Esté Listo

Ejecuta el script de verificación:
```bash
node verify-app-review-ready.js
```

Debe mostrar:
```
✅ Passed: 36
❌ Failed: 0
```

---

## 💰 Costos

### EAS Build (Opción 1):
- **Gratis**: 30 builds/mes en plan gratuito
- **Paid**: $29/mes para builds ilimitados
- **Enterprise**: $99/mes

### Mac en la Nube (Opción 2):
- **MacinCloud**: $30-80/mes
- **MacStadium**: $79-199/mes

### Alguien con Mac (Opción 3):
- **Gratis** (si tienes un amigo con Mac 😄)

---

## 📝 Checklist Antes de Build

- ✅ Cuenta de Apple Developer activa ($99/año)
- ✅ App creada en App Store Connect
- ✅ Bundle ID: `com.santyy.steeb`
- ✅ `npm run build` ejecutado sin errores
- ✅ `npx cap sync` ejecutado sin errores
- ✅ EAS CLI instalado: `npm install -g eas-cli`
- ✅ Login en Expo: `eas login`
- ✅ Verificación pasada: `node verify-app-review-ready.js`

---

## 🎯 Resumen: Qué Hacer AHORA desde Windows

### Paso a Paso Completo:

1. **Instalar EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login en Expo**:
   ```bash
   eas login
   ```
   (Crea cuenta si no tienes)

3. **Construir web assets**:
   ```bash
   npm run build
   ```

4. **Sincronizar Capacitor**:
   ```bash
   npx cap sync
   ```

5. **Iniciar build en la nube**:
   ```bash
   eas build --platform ios --profile production
   ```

6. **Esperar 10-20 minutos** (EAS compila en sus servidores)

7. **Descargar .ipa** del link que te da EAS

8. **Subir a App Store Connect**:
   ```bash
   eas submit --platform ios --latest
   ```
   (Te pedirá Apple ID y App-Specific Password)

9. **En App Store Connect**:
   - Actualizar privacidad (NO tracking)
   - Subir screenshots
   - Adjuntar `APP_STORE_REVIEW_RESPONSE.md`
   - Submit for Review

---

## 📞 Ayuda

Si tienes problemas:
- Documentación EAS: https://docs.expo.dev/build/introduction/
- Foro Expo: https://forums.expo.dev/
- Discord Expo: https://chat.expo.dev/

---

## ✅ Ventajas de EAS Build

- ✅ Funciona desde Windows
- ✅ No necesitas Mac
- ✅ No necesitas Xcode
- ✅ Maneja certificados automáticamente
- ✅ Puede subir directo a App Store
- ✅ Builds reproducibles
- ✅ Logs detallados

---

**¡Listo! Ahora puedes compilar para iOS desde Windows usando EAS Build.** 🚀
