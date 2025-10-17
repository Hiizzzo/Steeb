# 🚀 Guía de Backfill - ownerUid Migration

## ⚠️ ADVERTENCIA IMPORTANTE

Esta guía es para **USO TEMPORAL UNICAMENTE**. Después de ejecutar el backfill correctamente, debes **ELIMINAR** todos los archivos temporales mencionados aquí.

## 📋 Objetivo

Agregar el campo `ownerUid` a todos los documentos existentes en Firestore que no lo tengan, para cumplir con las nuevas reglas de seguridad del proyecto.

## 🗂️ Archivos Creados/Modificados

### ✅ Archivos Creados (Temporales - Eliminar después de usar)

1. `src/admin/backfillOwnerUid.ts` - Utilidad principal de backfill
2. `src/screens/admin/AdminBackfillScreen.tsx` - Interfaz temporal para ejecutar el backfill
3. `BACKFILL_GUIDE.md` - Esta guía (eliminar al final)

### ✅ Archivos Modificados

1. `src/App.tsx` - Agregada ruta temporal `/admin/backfill`

## 🛠️ Cómo Usar el Backfill

### Paso 1: Habilitar Modo Admin

Agrega esta variable de entorno a tu archivo `.env`:

```bash
# Habilitar modo admin para backfill (solo desarrollo)
VITE_ADMIN_MODE=true
```

### Paso 2: Iniciar la Aplicación

```bash
npm run dev
# o
yarn dev
```

### Paso 3: Iniciar Sesión

1. Abre la aplicación en tu navegador
2. Inicia sesión con tu cuenta de Firebase
3. Asegúrate de estar autenticado como el usuario que será el `ownerUid` para todos los documentos

### Paso 4: Navegar al Screen de Backfill

En tu navegador, navega a:

```
http://localhost:5173/admin/backfill
```

### Paso 5: Verificar Estado Actual

1. El screen mostrará el estado actual de todas las colecciones
2. Revisa cuántos documentos necesitan `ownerUid`
3. Si todo está en 0, el backfill no es necesario

### Paso 6: Ejecutar el Backfill

1. Si hay documentos que necesitan backfill, haz clic en "Correr Backfill"
2. Monitoriza el progreso en tiempo real
3. Espera a que complete todas las colecciones
4. Revisa los resultados

### Paso 7: Verificar Resultados

El backfill mostrará:
- ✅ Documentos actualizados exitosamente
- ⏭️ Documentos omitidos (ya tenían ownerUid)
- ❌ Errores si los hay

## 📊 Colecciones Procesadas

El backfill procesará las siguientes colecciones:

- `tasks` - Todas las tareas sin ownerUid
- `statsDaily` - Estadísticas diarias (si existe)
- `streaks` - Rachas de productividad (si existe)
- `habits` - Hábitos (si existe)

## 🔍 ¿Qué hace exactamente el backfill?

1. **Identifica** todos los documentos sin `ownerUid`
2. **Agrega** `ownerUid` con el UID del usuario autenticado actual
3. **Agrega** metadata de migración:
   - `migratedAt`: Timestamp de cuándo se ejecutó la migración
   - `migratedBy`: UID del usuario que ejecutó la migración
4. **Procesa** en lotes de 500 documentos para no sobrecargar Firestore
5. **Reporta** progreso y resultados detallados

## 🚨 Post-Ejecución: Limpieza

### Paso 1: Verificar que todo funcionó

1. Vuelve a cargar el screen de backfill
2. Confirma que todos los documentos ahora tienen ownerUid
3. Revisa que la aplicación funcione normalmente

### Paso 2: Eliminar Archivos Temporales

**¡MUY IMPORTANTE!** Elimina estos archivos y cambios:

```bash
# Eliminar archivos temporales
rm src/admin/backfillOwnerUid.ts
rm src/screens/admin/AdminBackfillScreen.tsx
rm BACKFILL_GUIDE.md

# Eliminar variable de entorno del .env
# Elimina la línea: VITE_ADMIN_MODE=true
```

### Paso 3: Revertir Cambios en App.tsx

Elimina estas secciones de `src/App.tsx`:

```typescript
// ELIMINAR: Import temporal de backfill
const AdminBackfillScreen = import.meta.env.DEV || import.meta.env.VITE_ADMIN_MODE === 'true'
  ? React.lazy(() => import('./screens/admin/AdminBackfillScreen'))
  : null;

// ELIMINAR: Ruta temporal de backfill
{AdminBackfillScreen && (
  <Route
    path="/admin/backfill"
    element={
      <React.Suspense fallback={<div>Cargando...</div>}>
        <AdminBackfillScreen />
      </React.Suspense>
    }
  />
)}
```

## 🔧 Solución de Problemas

### Error: "Acceso denegado"
- Asegúrate de tener `VITE_ADMIN_MODE=true` en tu .env
- Verifica que estás autenticado
- Reinicia el servidor de desarrollo

### Error: "No hay usuario autenticado"
- Inicia sesión en la aplicación antes de navegar a `/admin/backfill`

### Error de Firestore durante el backfill
- Revisa tu conexión a internet
- Verifica que tu usuario tenga los permisos necesarios
- Intenta ejecutar el backfill nuevamente

### El proceso tarda mucho
- Esto es normal si tienes muchos documentos
- El backfill procesa en lotes de 500 con pausas para no sobrecargar Firestore
- Paciencia, puede tomar varios minutos para colecciones grandes

## 📈 Monitoreo

Durante la ejecución, el backfill mostrará:

- **Progreso actual**: Qué colección se está procesando
- **Documentos procesados**: Cuántos van del total
- **Barra de progreso**: Visual del progreso actual
- **Logs en consola**: Información detallada para debugging

## ✅ Checklist Final

Antes de eliminar los archivos temporales:

- [ ] El backfill se ejecutó sin errores críticos
- [ ] Todos los documentos ahora tienen ownerUid
- [ ] La aplicación funciona normalmente
- [ ] No hay más documentos sin ownerUid
- [ ] Has hecho un backup reciente (opcional pero recomendado)

## 🎯 Resultado Esperado

Al finalizar:

1. ✅ Todos los documentos en Firestore tendrán el campo `ownerUid`
2. ✅ La aplicación cumplirá con las nuevas reglas de seguridad
3. ✅ No más errores "Missing or insufficient permissions"
4. ✅ Código limpio sin archivos temporales

---

**Recuerda: Este proceso es de una sola vez. Después de ejecutarlo exitosamente, elimina todos los archivos temporales.**