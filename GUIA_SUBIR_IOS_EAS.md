# Guía Completa para Subir STEB a iOS con EAS Build

## 🚀 Requisitos Previos

1. **Cuenta de Apple Developer** - Necesaria para subir a App Store
2. **Proyecto configurado** - Ya tienes todo listo con eas.json
3. **Node.js y yarn instalados** - Ya configurados en tu sistema

## 📋 Pasos para Subir a iOS con EAS Build

### Paso 1: Verificar que yarn terminó de instalar

```bash
yarn --version
```

Si muestra la versión, está listo. Si no, espera a que termine la instalación.

### Paso 2: Iniciar sesión en EAS

```bash
npx eas login
```

Esto abrirá una ventana del navegador para que inicies sesión con tu cuenta de Expo.

### Paso 3: Verificar configuración del proyecto

```bash
npx eas project:info
```

Esto mostrará la información de tu proyecto, incluyendo el projectId.

### Paso 4: Configurar credenciales de iOS

```bash
npx eas credentials
```

Sigue las instrucciones para configurar:
- **Apple ID** - Tu cuenta de Apple Developer
- **Distribution Certificate** - Certificado de distribución
- **Provisioning Profile** - Profile de aprovisionamiento

### Paso 5: Build de la app para iOS

```bash
eas build --platform ios --profile production
```

Este comando:
- Sube tu código a los servidores de EAS
- Compila la app en macOS en la nube
- Genera el archivo .ipa

### Paso 6: Esperar el build

El proceso tomará entre 15-30 minutos. Recibirás:
- **Notificación en tu email** cuando termine
- **Enlace para descargar** el archivo .ipa
- **Código QR** para fácil descarga

### Paso 7: Descargar el archivo .ipa

1. **Revisa tu email** - Busca el mensaje de EAS Build
2. **Click en el enlace** - Te llevará a la página de descarga
3. **Descarga el .ipa** - Guárdalo en una carpeta accesible

### Paso 8: Subir a App Store Connect

#### Opción A: Automático con EAS (Recomendado)

```bash
eas submit --platform ios --profile production
```

EAS subirá automáticamente el .ipa a App Store Connect.

#### Opción B: Manual

1. **Ve a App Store Connect** - https://appstoreconnect.apple.com
2. **Inicia sesión** con tu cuenta de Apple Developer
3. **Ve a "TestFlight"** → "Internal Testing"**
4. **Click en "+"** → "New Build"**
5. **Sube el archivo .ipa** que descargaste
6. **Completa la información** del build

### Paso 9: Configurar para Review en App Store

1. **Ve a "App Store"** → "Prepare for Submission"**
2. **Selecciona el build** que subiste
3. **Completa la información requerida**:
   - Descripción de la app
   - Palabras clave
   - URL de soporte
   - URL de política de privacidad
   - Capturas de pantalla
   - Iconos requeridos

### Paso 10: Enviar a Review

1. **Revisa toda la información**
2. **Click en "Submit for Review"**
3. **Espera la aprobación** de Apple (usualmente 24-48 horas)

## 🔧 Comandos Útiles

### Verificar estado del build
```bash
eas build:list
```

### Verificar credenciales
```bash
eas credentials:list
```

### Limpiar caché si hay problemas
```bash
eas build:clear-cache
```

### Ver logs del build
```bash
eas build:view [BUILD_ID]
```

## ⚠️ Solución de Problemas Comunes

### Error: "No se encontraron schemes"
```bash
npx expo prebuild --clean
```

### Error: "Credenciales inválidas"
```bash
eas credentials:remove --platform ios
eas credentials
```

### Error: "Falla en el build"
```bash
eas build --platform ios --profile production --clear-cache
```

## 📱 Checklist Final Antes de Subir

- [ ] yarn install completado sin errores
- [ ] `yarn dev` funciona localmente
- [ ] EAS login completado
- [ ] Credenciales de iOS configuradas
- [ ] app.json con versión incrementada
- [ ] eas.json configurado para producción
- [ ] Todas las capturas de pantalla listas
- [ ] Descripción y metadata completas

## 🎯 Comandos de Referencia Rápida

```bash
# 1. Verificar instalación
yarn --version

# 2. Login en EAS
npx eas login

# 3. Configurar credenciales (solo primera vez)
npx eas credentials

# 4. Build para iOS
eas build --platform ios --profile production

# 5. Submit automático
eas submit --platform ios --profile production
```

## 💡 Tips Importantes

1. **No necesitas macOS** - EAS Build compila en la nube
2. **Guarda tus credenciales** - EAS las recordará para futuros builds
3. **Incrementa la versión** en app.json antes de cada build
4. **Usa TestFlight** para pruebas internas antes del review
5. **Revisa la política de privacidad** - Apple es estricto con esto

## 📞 Si Necesitas Ayuda

- **Documentación de EAS**: https://docs.expo.dev/build/introduction/
- **Soporte de Expo**: https://expo.dev/support
- **Foro de la comunidad**: https://forums.expo.dev/

---

**¡Listo! Con estos pasos puedes subir tu app STEB a iOS desde Windows usando EAS Build.**