# GitHub Actions: Secrets para iOS (Capacitor)

Este documento lista los secretos necesarios para los workflows:
- `.github/workflows/ios-simulator-build.yml` (no firmado)
- `.github/workflows/ios-release.yml` (firmado + opcional TestFlight)

IMPORTANTE: No pegues tokens o claves en chats o archivos. Cárgalos como **Secrets** del repositorio en GitHub: Settings → Secrets and variables → Actions → New repository secret.

## A) Simulator (no requiere firma)
- `FIREBASE_PLIST_BASE64` (opcional pero recomendado)
  - Contenido base64 de `GoogleService-Info.plist`.
  - Windows (PowerShell):
    ```powershell
    [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\\ruta\\GoogleService-Info.plist")) | Set-Clipboard
    ```

## B) Release firmado (IPA + App Store/TestFlight)
Se requiere cuenta del Apple Developer Program.

- `TEAM_ID`:
  - Tu Team ID de Apple (se ve en developer.apple.com → Membership).
- `PROVISIONING_PROFILE_NAME`:
  - Nombre descriptivo de tu perfil de aprovisionamiento que usarás para la app (por ejemplo `SteebApp_Provisioning_Prod`). Debe coincidir con el perfil que subas.
- `MOBILEPROVISION_BASE64`:
  - El `.mobileprovision` (App Store) en base64.
  - Una vez descargado desde Apple Developer → Profiles, conviértelo a base64:
    - macOS/Linux:
      ```bash
      base64 -i MiPerfil.mobileprovision | pbcopy
      ```
    - Windows (PowerShell):
      ```powershell
      [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\\ruta\\MiPerfil.mobileprovision")) | Set-Clipboard
      ```
- `CERT_P12_BASE64`:
  - Certificado de distribución/exportado desde Keychain como `.p12` en base64.
  - macOS:
    ```bash
    base64 -i signing_cert.p12 | pbcopy
    ```
  - Windows (PowerShell):
    ```powershell
    [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\\ruta\\signing_cert.p12")) | Set-Clipboard
    ```
- `P12_PASSWORD`:
  - Contraseña que usaste al exportar el `.p12`.

### (Opcional) Subir automáticamente a TestFlight
Para activar `upload_to_testflight: true` en el workflow `ios-release.yml` agrega también:
- `ASC_KEY_ID` → App Store Connect API Key ID.
- `ASC_ISSUER_ID` → App Store Connect Issuer ID.
- `ASC_KEY_BASE64` → Contenido base64 del archivo `AuthKey_XXXX.p8`.
  - macOS/Linux:
    ```bash
    base64 -i AuthKey_XXXX.p8 | pbcopy
    ```
  - Windows (PowerShell):
    ```powershell
    [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\\ruta\\AuthKey_XXXX.p8")) | Set-Clipboard
    ```

## C) Cómo ejecutar los workflows
- Simulator: push a `main` o ejecútalo manual desde Actions → `iOS Simulator Build (Capacitor)`.
- Release: crea una **tag** `ios-vX.Y.Z` o ejecútalo manual desde Actions → `iOS Release Build (Capacitor)`.
  - Para TestFlight: ejecuta manual con input `upload_to_testflight = true` y asegúrate de haber cargado los secretos `ASC_*`.

## D) Notas
- `BUNDLE_ID` está fijado a `com.steeb.app` en el workflow. Debe coincidir con tu app en Apple y con el perfil.
- Guarda `GoogleService-Info.plist` fuera del repo o como secreto `FIREBASE_PLIST_BASE64`.
- Los artefactos `.ipa` se suben como artifacts de la ejecución.
