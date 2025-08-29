# iOS Setup (Firebase + Capacitor)

Este archivo te guía para preparar la app iOS usando tu `GoogleService-Info.plist` cuando tengas acceso a un Mac o un CI con macOS.

## 1) Guardar el `GoogleService-Info.plist` en Windows (ahora)
- Mantén el archivo fuera del repo o dentro de una carpeta local ignorada (ej: `ios-config/`).
- El `.gitignore` ya ignora `GoogleService-Info.plist` y `ios-config/`.
- No lo subas a repos públicos.

## 2) Requisitos en macOS
- Apple Developer Program (cuenta paga).
- Xcode instalado desde App Store y abierto al menos una vez.
- CocoaPods instalado:
  ```bash
  sudo gem install cocoapods
  ```

## 3) Preparar el proyecto iOS (en Mac)
```bash
npm i
npm run build
npx cap add ios
# Copia GoogleService-Info.plist a ios/App/App/
npx cap sync ios
```

## 4) URL Scheme de Google (Xcode)
- Abrir `ios/App/App.xcworkspace` en Xcode.
- Target "App" > Info > URL Types > botón "+".
- En "URL Schemes" pega el valor de `REVERSED_CLIENT_ID` que está dentro del `GoogleService-Info.plist`.

## 5) Firmas y ejecución
- Target "App" > Signing & Capabilities:
  - Selecciona tu Team.
  - Activa "Automatically manage signing".
- Conecta iPhone o usa simulador.
- Build & Run.

## 6) TestFlight / App Store
- Product > Archive.
- Distribute App > App Store Connect.
- Completa los datos en App Store Connect.

## 7) Alternativa sin Mac: CI macOS (opcional)
- Usa GitHub Actions, Codemagic, Bitrise o Ionic Appflow.
- Sube el `GoogleService-Info.plist` como secreto (base64) para reconstruirlo en el job.
- Pasos típicos del job:
  - setup-node
  - instalar cocoapods
  - `npm ci && npm run build`
  - `npx cap sync ios`
  - restaurar `GoogleService-Info.plist`
  - `xcodebuild archive` y exportar IPA

## Notas
- En `src/hooks/useAuth.ts` ya está el flujo de Google con redirect para móviles.
- Cada cambio nativo requiere `npx cap sync ios`.
