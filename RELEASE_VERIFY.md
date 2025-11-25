# ✅ Verificación de build antes de subir a Android/iOS

Usá este checklist antes de empaquetar la app para las tiendas. El script ejecuta todas las validaciones críticas del frontend (web + Capacitor/Expo) y evita sorpresas durante el `submit`.

## 1. Ejecutar verificación completa

```bash
npm install
npm run verify:release
```

Este comando:

1. `npm run typecheck` – asegura que no haya errores de TypeScript.
2. `npm run lint` – obliga a que el código cumpla las reglas de ESLint.
3. `npm run build` – genera el bundle de producción con Vite (`/dist`).
4. `npx expo-doctor --fix` – valida dependencias nativas para Android e iOS, aplicando fixes menores automáticamente.

> Si alguno de los pasos falla, corrige el error indicado antes de continuar. No ignores warnings de Expo Doctor: podrían impedir el build nativo.

## 2. Preparar binarios nativos

Una vez que `npm run verify:release` pasa:

- **Android:** `npm run android` (o usa Android Studio para generar el bundle `.aab`).
- **iOS:** `npm run ios` (o abre el workspace en Xcode y genera el archive para App Store).

## 3. Checklist final

- ✔️ `verify:release` completado sin errores.
- ✔️ En Android/iOS la app abre Mercado Pago y vuelve a STEEB sin pedir permisos extra.
- ✔️ Iconos, splash, versión y número de build actualizados en `app.json`/`app.config`.
- ✔️ Variables `.env.production` y `capacitor.config.ts` apuntan a la API de producción.

Con esto, la versión web queda validada y los binarios móviles listos para enviar. Cualquier duda, corré otra vez `npm run verify:release` antes de subir la build definitiva.
