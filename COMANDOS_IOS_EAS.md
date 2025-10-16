# Comandos para Subir STEB a iOS con EAS

## ✅ Estado Actual
- **✅ npm install** - Completado
- **✅ npx expo config** - Funcionando
- **✅ npx eas project:info** - Funcionando
- **✅ Proyecto listo para EAS Build**

## 🚀 Comandos para Subir a iOS

### 1. Iniciar sesión en EAS (si no lo has hecho)
```bash
npx eas login
```

### 2. Build de iOS en la nube
```bash
eas build --platform ios --profile production
```

Este comando:
- Sube tu código a los servidores de EAS
- Compila la app en macOS en la nube
- Genera el archivo .ipa
- Te envía un email con el enlace de descarga

### 3. Submit automático a App Store (opcional)
```bash
eas submit --platform ios --profile production
```

Este comando:
- Descarga automáticamente el .ipa
- Lo sube a App Store Connect
- Lo prepara para review

## 📱 Pasos Detallados

### Paso 1: Verificar que todo funciona
```bash
# Verificar configuración de Expo
npx expo config --type public

# Verificar proyecto de EAS
npx eas project:info
```

### Paso 2: Iniciar el build
```bash
eas build --platform ios --profile production
```

Espera el resultado (15-30 minutos). Recibirás un email con:
- Enlace para descargar el .ipa
- Código QR para fácil descarga
- Información del build

### Paso 3: Descargar el .ipa
1. **Revisa tu email** - Busca el mensaje de EAS Build
2. **Click en el enlace** - Te llevará a la página de descarga
3. **Descarga el archivo .ipa** - Guárdalo en una carpeta accesible

### Paso 4: Subir a App Store Connect

#### Opción A: Automático con EAS (Recomendado)
```bash
eas submit --platform ios --profile production
```

#### Opción B: Manual
1. **Ve a App Store Connect** - https://appstoreconnect.apple.com
2. **Inicia sesión** con tu cuenta de Apple Developer
3. **Ve a "TestFlight" → "Internal Testing"**
4. **Click en "+" → "New Build"**
5. **Sube el archivo .ipa** que descargaste

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

## ⚠️ Notas Importantes

1. **No necesitas macOS** - EAS Build compila en la nube
2. **Primera vez** - Necesitarás configurar credenciales de Apple Developer
3. **Tiempo de espera** - El build toma 15-30 minutos
4. **Email** - Recibirás notificaciones cuando termine
5. **Costo** - EAS Build tiene un costo mensual pero incluye builds gratuitos

## 🎯 Checklist Final

- [ ] npm install completado
- [ ] npx expo config funciona
- [ ] npx eas project:info funciona
- [ ] Sesión iniciada en EAS
- [ ] Credenciales de Apple Developer configuradas
- [ ] app.json con versión correcta
- [ ] eas.json configurado para producción

## ✨ ¡Listo!

Con estos comandos puedes subir tu app STEB a iOS directamente desde Windows usando EAS Build.

El proceso completo:
1. **Ejecutar el build** - `eas build --platform ios --profile production`
2. **Esperar 15-30 minutos**
3. **Recibir el .ipa por email**
4. **Submit automático o manual** a App Store Connect

¡Tu app estará en la App Store en poco tiempo!