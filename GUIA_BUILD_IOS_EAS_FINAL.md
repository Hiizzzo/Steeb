
# 🚀 GUÍA COMPLETA - BUILD iOS CON EAS PARA STEEB

## 📋 Requisitos Previos ✅

1. **Cuenta de EAS configurada** ✓
2. **App Store Connect configurado** (ASC App ID: 6752629210) ✓
3. **Variables de entorno configuradas** ✓
4. **Autenticación Firebase implementada** ✓

## 🔧 Configuración Implementada

### 1. Autenticación Google + Firebase
- ✅ Servicio de autenticación (`src/services/authService.ts`)
- ✅ Hook de autenticación actualizado (`src/hooks/useAuth.ts`)
- ✅ Persistencia local configurada (`browserLocalPersistence`)
- ✅ Compatibilidad iOS nativo con fallbacks

### 2. Configuración EAS
- ✅ `eas.json` configurado para producción iOS
- ✅ `app.json` actualizado con runtime y updates
- ✅ `capacitor.config.ts` creado para iOS

### 3. UI de Autenticación
- ✅ Header muestra usuario logueado
- ✅ Botón de logout implementado
- ✅ Protección de creación de tareas
- ✅ Mensajes específicos para iOS

## 🏗️ Comandos para Build

### Opción 1: Script Automático (Recomendado)
```powershell
.\build-ios-eas-ready.ps1
```

### Opción 2: Manual
```bash
# 1. Limpiar build anterior
rm -rf dist

# 2. Instalar dependencias
npm install --legacy-peer-deps

# 3. Verificar configuración
npx eas build:list

# 4. Previsualizar build (opcional)
npx eas build --platform ios --profile production --non-interactive --dry-run

# 5. Ejecutar build
npx eas build --platform ios --profile production --non-interactive
```

## 📱 Compatibilidad iOS

### Autenticación Google en iOS
- **Opción Preferida**: Plugin nativo de Google Sign-In
- **Fallback**: Email/Contraseña (siempre disponible)
- **Web**: Google Sign-In automático

### Mensajes para Usuario iOS
- Si el plugin de Google no está disponible, se muestra mensaje claro
- Se sugiere usar Email/Contraseña como alternativa
- La app funciona completamente sin Google Sign-In

## 🔍 Verificación Post-Build

### 1. Descargar .ipa
- Ve al panel de EAS: https://expo.dev/accounts/santyy/projects/steeb-ai-gemini-ollama/builds
- Descarga el archivo .ipa cuando esté listo

### 2. Test en TestFlight/App Store
- Sube a TestFlight para pruebas
- Verifica:
  - ✅ Login con Email/Contraseña funciona
  - ✅ Creación de tareas requiere autenticación
  - ✅ Header muestra usuario logueado
  - ✅ Logout funciona correctamente

## 🚨 Posibles Errores y Soluciones

### Error: "Google Sign-In no disponible en iOS"
**Solución**: Usa Email/Contraseña o instala el plugin nativo

### Error: "Build fallido por dependencias"
**Solución**: Ejecuta `npm install --legacy-peer-deps`

### Error: "Firebase no configurado"
**Solución**: Verifica variables de entorno en `.env`

## 📞 Soporte

Si encuentras errores durante el build:
1. Revisa el log de build en EAS
