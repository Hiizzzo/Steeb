# 🚀 Instrucciones Rápidas - Build iOS desde Windows

## ⚡ Opción 1: Script Automático (MÁS FÁCIL)

Ejecuta este comando en PowerShell:

```powershell
.\build-ios-windows.ps1
```

El script hará TODO automáticamente:
- ✅ Verificar prerequisitos
- ✅ Instalar EAS CLI si no está
- ✅ Login en Expo
- ✅ Construir web assets
- ✅ Sincronizar Capacitor
- ✅ Iniciar build en la nube
- ✅ Subir a App Store Connect

**Tiempo total**: 15-25 minutos

---

## ⚡ Opción 2: Comandos Manuales

Si prefieres hacerlo paso a paso:

### 1. Instalar EAS CLI (solo primera vez)
```bash
npm install -g eas-cli
```

### 2. Login en Expo
```bash
eas login
```
(Crea cuenta en https://expo.dev si no tienes)

### 3. Construir web assets
```bash
npm run build
```

### 4. Sincronizar Capacitor
```bash
npx cap sync
```

### 5. Iniciar build en la nube
```bash
eas build --platform ios --profile production
```

**Espera 10-20 minutos** mientras EAS compila tu app en sus servidores.

### 6. Subir a App Store Connect
```bash
eas submit --platform ios --latest
```

Te pedirá:
- **Apple ID**: tu-email@icloud.com
- **App-Specific Password**: (generar en appleid.apple.com)

---

## 📋 Antes de Empezar

### Necesitas:
1. ✅ **Cuenta de Apple Developer** ($99/año) - https://developer.apple.com
2. ✅ **App creada en App Store Connect** - https://appstoreconnect.apple.com
3. ✅ **Bundle ID configurado**: `com.santyy.steeb`

### Generar App-Specific Password:
1. Ve a https://appleid.apple.com
2. Sign In
3. Security → App-Specific Passwords
4. Generate new password
5. Copia y guarda el password

---

## 🔧 Si Algo Sale Mal

### Error: "EAS CLI not found"
```bash
npm install -g eas-cli
```

### Error: "Not logged in"
```bash
eas login
```

### Error: "Build failed"
```bash
# Limpiar y reintentar
npm run build
npx cap sync
eas build --platform ios --profile production
```

### Error: "Invalid credentials"
```bash
# Regenerar credentials
eas credentials
```

---

## 📱 Después del Build

1. **Descargar .ipa**: EAS te dará un link
2. **Ir a App Store Connect**: https://appstoreconnect.apple.com
3. **Actualizar privacidad**:
   - ❌ NO tracking
   - ✅ Solo datos locales
4. **Subir screenshots** (mínimo 3)
5. **Adjuntar documento**: `APP_STORE_REVIEW_RESPONSE.md`
6. **Submit for Review**

---

## 💡 Consejos

- **Primera vez**: El build puede tardar más (20-30 min)
- **Builds siguientes**: Más rápido (10-15 min)
- **Plan gratuito**: 30 builds/mes
- **Plan paid**: $29/mes para builds ilimitados

---

## 📞 Ayuda

- **Documentación completa**: `WINDOWS_BUILD_GUIDE.md`
- **Respuesta para Apple**: `APP_STORE_REVIEW_RESPONSE.md`
- **Resumen de correcciones**: `RESUMEN_CORRECCIONES_APP_STORE.md`
- **Docs de EAS**: https://docs.expo.dev/build/introduction/

---

## ✅ Checklist Rápido

Antes de ejecutar el build:

- [ ] Cuenta de Apple Developer activa
- [ ] App creada en App Store Connect
- [ ] Bundle ID: `com.santyy.steeb`
- [ ] EAS CLI instalado: `npm install -g eas-cli`
- [ ] Login en Expo: `eas login`
- [ ] App-Specific Password generado
- [ ] Verificación pasada: `node verify-app-review-ready.js`

---

## 🎯 Comando Único (Todo en Uno)

Si quieres hacerlo todo de una vez:

```bash
npm run build && npx cap sync && eas build --platform ios --profile production && eas submit --platform ios --latest
```

Este comando:
1. Construye web assets
2. Sincroniza Capacitor
3. Inicia build en EAS
4. Sube a App Store Connect

**Tiempo total**: 15-25 minutos

---

**¡Listo! Ahora puedes compilar para iOS desde Windows sin necesidad de Mac.** 🎉
