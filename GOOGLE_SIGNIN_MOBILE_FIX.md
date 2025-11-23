# 🔧 Fix: Google Sign-In en App Móvil

## ❌ Problema

El inicio de sesión con Google no funciona en la app móvil porque el plugin nativo de Google Sign-In no está instalado o configurado correctamente.

## ✅ Soluciones

### Solución 1: Usar Email/Contraseña (Inmediato)

**Mientras tanto, podés:**
1. Crear una cuenta con email y contraseña
2. O vincular tu cuenta de Google existente con una contraseña

### Solución 2: Instalar Plugin de Google Sign-In (Permanente)

#### Paso 1: Instalar el Plugin

```bash
npm install @codetrix-studio/capacitor-google-auth
npx cap sync
```

#### Paso 2: Configurar para Android

**Archivo:** `android/app/src/main/res/values/strings.xml`

```xml
<resources>
    <string name="server_client_id">TU_WEB_CLIENT_ID_DE_GOOGLE</string>
</resources>
```

**Archivo:** `android/app/build.gradle`

Agregar en `dependencies`:
```gradle
implementation 'com.google.android.gms:play-services-auth:20.7.0'
```

#### Paso 3: Configurar para iOS

**Archivo:** `ios/App/App/Info.plist`

Agregar:
```xml
<key>GIDClientID</key>
<string>TU_IOS_CLIENT_ID_DE_GOOGLE</string>
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>TU_REVERSED_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

#### Paso 4: Inicializar el Plugin

**Archivo:** `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ... otras configuraciones
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'TU_WEB_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
```

#### Paso 5: Obtener Credenciales de Google

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Seleccionar tu proyecto (o crear uno nuevo)
3. Ir a **APIs & Services** > **Credentials**
4. Crear credenciales OAuth 2.0:
   - **Web Client ID** (para el servidor)
   - **Android Client ID** (para Android)
   - **iOS Client ID** (para iOS)

#### Paso 6: Rebuild la App

```bash
npm run build
npx cap sync
npx cap open android  # o ios
```

## 🔄 Solución Temporal en el Código

Mientras tanto, podés modificar el código para que use `signInWithRedirect` como fallback en lugar de mostrar error:

**Archivo:** `src/hooks/useAuth.ts` (líneas 265-268)

**Cambiar de:**
```typescript
if (Capacitor.getPlatform() === 'ios') {
  throw new Error('Para usar Google Sign-In en iOS, instala el plugin...');
}
```

**A:**
```typescript
if (Capacitor.getPlatform() === 'ios') {
  console.warn('⚠️ Plugin nativo no disponible, usando redirect');
  await signInWithRedirect(auth, googleProvider);
  return;
}
```

## 📱 Alternativa: Usar Autenticación Web

Si no querés instalar el plugin nativo, podés hacer que la app abra el navegador para autenticarse:

**Modificar `loginWithGoogle` para siempre usar redirect en móvil:**

```typescript
const loginWithGoogle = async (forceAccountPicker: boolean = false) => {
  ensureConfigured();
  
  // En móvil, siempre usar redirect (abre el navegador)
  if (Capacitor.isNativePlatform()) {
    console.log('📱 Móvil: Usando signInWithRedirect');
    await signInWithRedirect(auth, googleProvider);
    return;
  }
  
  // En web, usar popup
  const provider = forceAccountPicker ? new GoogleAuthProvider() : googleProvider;
  if (forceAccountPicker) {
    provider.setCustomParameters({ prompt: 'select_account' });
  }
  await signInWithPopup(auth, provider);
};
```

## ✅ Verificar que Funciona

Después de aplicar cualquiera de las soluciones:

1. Rebuild la app
2. Instalar en el dispositivo
3. Intentar iniciar sesión con Google
4. Debería abrir el navegador o el diálogo nativo de Google

## 🐛 Troubleshooting

### "No se obtuvo idToken de Google"
- Verificá que las credenciales OAuth estén correctamente configuradas
- Asegurate de usar el `serverClientId` correcto

### "Plugin de Google no disponible"
- El plugin no está instalado: ejecutá `npm install @codetrix-studio/capacitor-google-auth`
- Ejecutá `npx cap sync` después de instalar

### "Error en autenticación nativa"
- Verificá los logs de la consola para más detalles
- Asegurate de que el `Info.plist` (iOS) o `strings.xml` (Android) estén correctamente configurados

---

**Recomendación:** Por ahora, usá email/contraseña para iniciar sesión. Después podés configurar el plugin nativo para una mejor experiencia.
