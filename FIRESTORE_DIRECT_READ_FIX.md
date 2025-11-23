# 🔧 Fix: Lectura Directa de Firestore

## ❌ Problema Anterior

El hook `useUnifiedUserAccess` estaba leyendo el `tipoUsuario` a través del **backend** (`/api/users/role`), lo que causaba que:
- Los cambios manuales en Firebase no se reflejaran inmediatamente
- Dependía de que el backend estuviera funcionando correctamente
- No había actualizaciones en tiempo real

## ✅ Solución Implementada

Ahora el hook `useUnifiedUserAccess` lee **DIRECTAMENTE de Firestore** usando `onSnapshot`, lo que significa:
- ✅ **Actualizaciones en tiempo real**: Cualquier cambio en Firebase se refleja inmediatamente
- ✅ **Sin dependencia del backend**: Lee directamente de Firestore
- ✅ **Mapeo automático**: Convierte `tipoUsuario: "Black"` → `role: "premium"`

## 🔄 Cómo Funciona Ahora

### 1. Lectura en Tiempo Real

```typescript
// El hook escucha cambios en Firestore
onSnapshot(doc(db, 'users', userId), (docSnapshot) => {
  const userData = docSnapshot.data();
  const tipoUsuario = userData.tipoUsuario || 'White';
  
  // Mapear tipoUsuario a role
  const isPremium = ['Black', 'Premium'].includes(tipoUsuario);
  const role = isPremium ? 'premium' : 'free';
  
  // Actualizar estado inmediatamente
  setUserRole({ role, isPremium, permissions: [...] });
});
```

### 2. Mapeo de tipoUsuario

| tipoUsuario en Firebase | role en la app | isPremium | hasDarkAccess |
|------------------------|----------------|-----------|---------------|
| `"White"` | `"free"` | `false` | `false` |
| `"Black"` | `"premium"` | `true` | `true` |
| `"Premium"` | `"premium"` | `true` | `true` |

### 3. Permisos Automáticos

Si `tipoUsuario === "Black"` o `hasDarkVersion === true`:
- ✅ Se agrega permiso `"dark_mode"`
- ✅ `hasDarkAccess` se vuelve `true`
- ✅ El usuario puede usar el modo Dark sin restricciones

## 🧪 Cómo Probar

### Opción 1: Cambio Manual en Firebase Console

1. **Ir a Firebase Console:**
   - https://console.firebase.google.com
   - Seleccionar tu proyecto
   - Ir a Firestore Database

2. **Buscar tu usuario:**
   - Colección: `users`
   - Documento: `<tu-user-id>`

3. **Cambiar el campo `tipoUsuario`:**
   ```
   tipoUsuario: "Black"
   ```

4. **Observar la app:**
   - ¡El cambio debería reflejarse INMEDIATAMENTE!
   - No necesitás recargar la página
   - Deberías ver en la consola:
     ```
     🔄 Datos del usuario en Firestore: { tipoUsuario: "Black", ... }
     ✅ Rol actualizado desde Firestore: { role: "premium", isPremium: true, ... }
     ```

### Opción 2: Usar el Script de Node.js

```bash
# Listar usuarios
node test-payment-upgrade.js --list

# Actualizar usuario a Black
node test-payment-upgrade.js <tu-user-id>
```

El script actualiza:
- `tipoUsuario: "Black"`
- `hasDarkVersion: true`
- `categoria: "premium"`

Y la app se actualiza automáticamente gracias al listener de Firestore.

### Opción 3: Simular Pago

1. Ir a: `http://127.0.0.1:8084/payments/test`
2. Hacer clic en "Simular Pago Exitoso"
3. El backend actualizará el usuario en Firebase
4. El frontend detectará el cambio automáticamente

## 📊 Logs para Verificar

Abrí la consola del navegador (F12) y deberías ver:

```
👤 Usuario autenticado: abc123xyz
🔄 Datos del usuario en Firestore: {
  tipoUsuario: "Black",
  hasDarkVersion: true,
  email: "usuario@example.com",
  ...
}
✅ Rol actualizado desde Firestore: {
  role: "premium",
  isPremium: true,
  permissions: ["dark_mode"]
}
```

## 🎯 Verificar que Funciona

### 1. Verificar Estado del Usuario

En cualquier componente que use `useUnifiedUserAccess`:

```typescript
const { currentRole, hasDarkAccess, isPremium, userRole } = useUnifiedUserAccess();

console.log('Rol actual:', currentRole); // "premium"
console.log('Tiene Dark Access:', hasDarkAccess); // true
console.log('Es Premium:', userRole.isPremium); // true
```

### 2. Verificar Acceso al Modo Dark

- Intentá cambiar el tema a Dark
- Deberías poder hacerlo sin restricciones
- No debería aparecer el modal de pago

### 3. Verificar Actualización en Tiempo Real

1. Dejá la app abierta
2. Cambiá `tipoUsuario` en Firebase Console de `"Black"` a `"White"`
3. La app debería actualizar automáticamente
4. El modo Dark debería bloquearse
5. Cambiá de vuelta a `"Black"`
6. El modo Dark debería desbloquearse automáticamente

## 🔍 Troubleshooting

### "Los cambios no se reflejan"

**Posibles causas:**
1. **Firestore no está inicializado correctamente**
   - Verificá que `src/lib/firebase.ts` esté configurado
   - Verificá que las credenciales de Firebase sean correctas

2. **El usuario no existe en Firestore**
   - Creá el documento manualmente en Firebase Console
   - O usá el script `test-payment-upgrade.js`

3. **Error en el listener**
   - Revisá la consola del navegador
   - Buscá mensajes de error de Firestore

### "Aparece error de permisos de Firestore"

Verificá las reglas de Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### "El hook sigue usando el backend"

El hook ahora usa **ambos**:
1. **Firestore (principal)**: Lectura en tiempo real
2. **Backend (fallback)**: Si Firestore falla

Esto asegura máxima confiabilidad.

## ✅ Resumen de Cambios

| Antes | Ahora |
|-------|-------|
| Leía del backend | Lee directamente de Firestore |
| Sin actualizaciones en tiempo real | Actualizaciones en tiempo real con `onSnapshot` |
| Cambios manuales no se reflejaban | Cambios se reflejan inmediatamente |
| Dependía del backend | Funciona aunque el backend falle |

## 🚀 Próximos Pasos

1. **Probá cambiar manualmente el `tipoUsuario` en Firebase**
2. **Verificá que la app se actualiza automáticamente**
3. **Si funciona, desplegá a producción**

---

**Última actualización:** 2025-11-23 02:20
