# 🔥 Guía de Configuración de Firebase para STEBE

## Problema Actual
La aplicación muestra el error: **"Firebase: Error (auth/api-key-not-valid, please-pass-a-valid-api-key)"**

Esto indica que las credenciales de Firebase en el archivo `.env` no son válidas o el proyecto Firebase no existe.

## Solución: Configurar Firebase Correctamente

### Paso 1: Acceder a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Inicia sesión con tu cuenta de Google

### Paso 2: Crear o Seleccionar Proyecto

#### Opción A: Crear Nuevo Proyecto
1. Haz clic en **"Agregar proyecto"**
2. Ingresa el nombre del proyecto (ej: "stebe-calendar")
3. Acepta los términos y condiciones
4. Configura Google Analytics (opcional)
5. Haz clic en **"Crear proyecto"**

#### Opción B: Usar Proyecto Existente
1. Selecciona el proyecto existente de la lista

### Paso 3: Configurar Aplicación Web
1. En el dashboard del proyecto, haz clic en el ícono **"</>"** (Web)
2. Registra tu aplicación:
   - **Nombre de la app**: "STEBE Calendar"
   - **Marca la casilla**: "También configurar Firebase Hosting"
3. Haz clic en **"Registrar app"**

### Paso 4: Obtener Credenciales
1. Después del registro, verás el código de configuración:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

2. **COPIA ESTOS VALORES** - los necesitarás para el siguiente paso

### Paso 5: Actualizar Archivo .env
1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza los valores de ejemplo con tus credenciales reales:

```env
# Firebase Config - TUS CREDENCIALES REALES
VITE_FIREBASE_API_KEY=AIzaSy... # Tu apiKey aquí
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Paso 6: Configurar Servicios de Firebase

#### Habilitar Authentication
1. En Firebase Console, ve a **"Authentication"**
2. Haz clic en **"Comenzar"**
3. Ve a la pestaña **"Sign-in method"**
4. Habilita **"Correo electrónico/contraseña"**
5. Habilita **"Google"** (opcional)

#### Habilitar Firestore Database
1. Ve a **"Firestore Database"**
2. Haz clic en **"Crear base de datos"**
3. Selecciona **"Comenzar en modo de prueba"**
4. Elige una ubicación (ej: "us-central")
5. Haz clic en **"Listo"**

### Paso 7: Configurar Reglas de Seguridad

#### Reglas de Firestore (Temporal - Solo para desarrollo)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Paso 8: Reiniciar Servidor de Desarrollo
1. Detén el servidor actual (Ctrl+C)
2. Ejecuta: `npm run dev`
3. Abre la aplicación en el navegador

## Verificación
Si todo está configurado correctamente:
- ✅ No deberías ver errores de Firebase en la consola
- ✅ Podrás crear una cuenta nueva
- ✅ Podrás iniciar sesión
- ✅ Las tareas se guardarán en Firestore

## Problemas Comunes

### Error: "Project not found"
- Verifica que el `projectId` sea correcto
- Asegúrate de que el proyecto existe en Firebase Console

### Error: "API key not valid"
- Regenera las credenciales desde Firebase Console
- Verifica que no haya espacios extra en el archivo `.env`

### Error: "Permission denied"
- Revisa las reglas de Firestore
- Asegúrate de que Authentication esté habilitado

## Contacto
Si sigues teniendo problemas, comparte:
1. El contenido de tu archivo `.env` (sin las credenciales reales)
2. Los errores específicos de la consola del navegador
3. Capturas de pantalla de tu configuración en Firebase Console

---
**Nota**: Nunca compartas tus credenciales reales de Firebase públicamente. Mantenlas seguras en tu archivo `.env` local.