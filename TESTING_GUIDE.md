# 🧪 Guía de Prueba - Simulación de Actualización a Black

## ✅ Servidor Iniciado

El servidor de desarrollo está corriendo en: **http://127.0.0.1:8084/**

## 🎯 Opciones de Prueba

### Opción 1: Usar la Página de Prueba (Recomendado)

1. **Abrí el navegador y andá a:**
   ```
   http://127.0.0.1:8084/payments/test
   ```

2. **Vas a ver una página con dos opciones:**
   - **Simular con Payment ID:** Simula la redirección de Mercado Pago con un payment_id
   - **Simular con Preference ID:** Simula usando un preferenceId

3. **Hacé clic en "Simular Pago Exitoso"**
   - Esto te va a redirigir a `/payments/success?payment_id=1234567890`
   - La página va a intentar verificar el pago automáticamente

4. **Observá el comportamiento:**
   - Si usás un payment_id de prueba, el backend va a fallar (porque no existe en Mercado Pago)
   - Pero podés ver cómo funciona el flujo de la UI

### Opción 2: Simular con un Payment ID Real

Si ya hiciste un pago real anteriormente:

1. **Buscá el payment_id en los logs del backend** o en la URL de redirección anterior

2. **Andá a:**
   ```
   http://127.0.0.1:8084/payments/test
   ```

3. **Ingresá el payment_id real** en el campo de texto

4. **Marcá el checkbox** "Usar un payment_id real"

5. **Hacé clic en "Simular Pago Exitoso"**

6. **El sistema va a:**
   - Llamar a `/api/payments/verify` con el payment_id real
   - Verificar el pago con Mercado Pago
   - Si está aprobado, actualizar tu usuario a Black en Firebase
   - Mostrar confirmación y redirigir

### Opción 3: Actualizar Usuario Directamente con Script

Si querés actualizar tu usuario directamente en Firebase sin pasar por Mercado Pago:

1. **Primero, listá los usuarios disponibles:**
   ```bash
   node test-payment-upgrade.js --list
   ```

2. **Copiá el UID del usuario que querés actualizar**

3. **Ejecutá el script de actualización:**
   ```bash
   node test-payment-upgrade.js TU_USER_ID_AQUI
   ```

4. **El script va a:**
   - Verificar que el usuario existe en Firebase Auth
   - Actualizar el documento en Firestore con:
     - `tipoUsuario: "Black"`
     - `hasDarkVersion: true`
     - `categoria: "premium"`
   - Mostrar el estado antes y después

5. **Recargá la app** para ver los cambios reflejados

### Opción 4: Simular Directamente en la URL

1. **Abrí el navegador y andá a:**
   ```
   http://127.0.0.1:8084/payments/success?payment_id=1234567890
   ```

2. **Vas a ver la página de verificación intentando procesar el pago**

3. **Abrí la consola del navegador (F12)** para ver los logs

## 🔍 Qué Observar

### En la Consola del Navegador (F12)

Deberías ver logs como:
```
🔍 PaymentSuccessPage - Parámetros recibidos: { paymentId: "1234567890", ... }
⏳ Verificando tu pago con Mercado Pago...
✅ Resultado de verificación: { status: "approved", ... }
🔄 Verificando actualización del usuario en Firebase...
👤 Rol del usuario después del pago: { isPremium: true, ... }
✅ Usuario actualizado correctamente a Premium
```

### En la Interfaz

- **Estado "Verificando":** Icono de loading azul
- **Estado "Aprobado":** ✅ Icono verde + mensaje de éxito
- **Estado "Error":** ❌ Icono rojo + mensaje de error
- **Redirección automática** después de 3 segundos si fue exitoso

## 📊 Verificar que Funcionó

### 1. Verificar en Firebase Console

1. Andá a [Firebase Console](https://console.firebase.google.com)
2. Seleccioná tu proyecto
3. Andá a Firestore Database
4. Buscá tu usuario en la colección `users`
5. Verificá que tenga:
   - `tipoUsuario: "Black"`
   - `hasDarkVersion: true`
   - `categoria: "premium"`

### 2. Verificar en la App

1. Recargá la página principal: `http://127.0.0.1:8084/`
2. Intentá cambiar el tema a Dark
3. Deberías poder acceder sin restricciones

### 3. Verificar con el Hook

En cualquier componente, el hook `useUnifiedUserAccess` debería retornar:
```javascript
{
  currentRole: "premium",
  hasDarkAccess: true,
  isPremium: true
}
```

## 🐛 Troubleshooting

### "No se encontró información del pago en la URL"
- Asegurate de que la URL tenga `?payment_id=XXX` o `?preference_id=XXX`

### "Error verificando pago"
- Si usaste un payment_id de prueba, esto es normal (no existe en Mercado Pago)
- Usá un payment_id real de un pago que hayas hecho

### "El usuario no se actualiza"
- Verificá que el backend esté corriendo y accesible
- Verificá que el backend tenga acceso a Firebase Admin SDK
- Usá el script `test-payment-upgrade.js` para actualizar directamente

### "Payment ID no válido"
- Asegurate de usar un payment_id que exista en Mercado Pago
- O usá el script de Node.js para actualizar directamente

## 📝 Comandos Útiles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Listar usuarios en Firebase
node test-payment-upgrade.js --list

# Actualizar usuario específico
node test-payment-upgrade.js <userId>

# Ver logs del backend (si lo tenés corriendo local)
npm start
```

## 🎯 Flujo Completo de Prueba Recomendado

1. **Iniciar servidor:** `npm run dev`
2. **Ir a página de prueba:** http://127.0.0.1:8084/payments/test
3. **Ver tu estado actual** (debería ser "free")
4. **Opción A - Con payment_id real:**
   - Ingresá un payment_id real
   - Hacé clic en "Simular Pago Exitoso"
   - Observá la verificación automática
   - Verificá que tu usuario se actualizó

5. **Opción B - Con script directo:**
   - Ejecutá `node test-payment-upgrade.js --list`
   - Copiá tu userId
   - Ejecutá `node test-payment-upgrade.js <tuUserId>`
   - Recargá la app
   - Verificá que ahora tenés acceso a Dark Mode

## ✅ Resultado Esperado

Después de una simulación exitosa:
- ✅ Usuario actualizado a `tipoUsuario: "Black"`
- ✅ `hasDarkVersion: true`
- ✅ Acceso al modo Dark sin restricciones
- ✅ Mensaje de confirmación en la UI
- ✅ Redirección automática a la página principal

---

**Última actualización:** 2025-11-23
