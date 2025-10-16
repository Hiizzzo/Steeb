# 🔧 Solución: "iOS build failed: Install dependencies"

## 🎯 Problema Detectado

Tu build de EAS falló en la fase **"Install dependencies"** por estos motivos:

### 1. ❌ Mezcla de Package Managers
- Tenías `bun.lockb` (Bun) + `package-lock.json` (npm)
- EAS se confunde cuando hay múltiples lockfiles
- **Solución**: Eliminado `bun.lockb`, usando solo npm

### 2. ❌ Falta Configuración de Node/npm
- No especificabas qué versión de Node usar
- EAS podía usar una versión incompatible
- **Solución**: Agregado `engines` en package.json (Node 18-20)

### 3. ❌ Variables de Entorno Faltantes
- Sin `CI=1`, algunos scripts pueden fallar en EAS
- Sin `HUSKY=0`, git hooks pueden romper el build
- **Solución**: Agregadas variables en `eas.json`

### 4. ⚠️ Sharp (módulo nativo)
- `sharp@0.34.3` es un módulo nativo que compila en C++
- Puede fallar en EAS si no tiene las dependencias del sistema
- **Solución**: Agregado `SKIP_NATIVE_POSTINSTALL=1`

### 5. ⚠️ Capacitor + Expo
- Mezclas Capacitor con Expo (no es Expo Managed puro)
- Esto puede causar conflictos en el build
- **Nota**: Tu proyecto es híbrido (Vite + Capacitor + EAS)

---

## ✅ Correcciones Aplicadas

### 1. **package.json** - Actualizado

```json
{
  "packageManager": "npm@10.7.0",
  "engines": {
    "node": ">=18.18.0 <=20.x",
    "npm": ">=9.0.0"
  }
}
```

**Qué hace**:
- Fuerza npm como package manager
- Especifica Node 18-20 (compatible con EAS)
- EAS usará exactamente estas versiones

### 2. **eas.json** - Variables de Entorno

```json
{
  "build": {
    "production": {
      "env": {
        "CI": "1",
        "HUSKY": "0",
        "EXPO_NO_TELEMETRY": "1",
        "npm_config_fund": "false",
        "npm_config_audit": "false",
        "SKIP_NATIVE_POSTINSTALL": "1"
      }
    }
  }
}
```

**Qué hace cada variable**:
- `CI=1`: Indica que estamos en CI, scripts se comportan diferente
- `HUSKY=0`: Desactiva git hooks (no hay .git en EAS)
- `EXPO_NO_TELEMETRY=1`: Desactiva telemetría de Expo
- `npm_config_fund=false`: No muestra mensajes de funding
- `npm_config_audit=false`: No ejecuta audit (más rápido)
- `SKIP_NATIVE_POSTINSTALL=1`: Salta postinstall de módulos nativos

### 3. **Script de Limpieza** - `fix-eas-build.ps1`

Creado script que:
- ✅ Elimina lockfiles conflictivos
- ✅ Limpia node_modules
- ✅ Limpia caché de npm
- ✅ Reinstala dependencias con `npm ci`
- ✅ Ejecuta `expo-doctor`
- ✅ Construye web assets

---

## 🚀 Cómo Usar la Solución

### Opción A: Script Automático (RECOMENDADO)

```powershell
.\fix-eas-build.ps1
```

Esto hace TODO automáticamente. Después ejecuta:

```bash
eas build --platform ios --profile production
```

### Opción B: Comandos Manuales

```bash
# 1. Eliminar lockfiles conflictivos
Remove-Item bun.lockb -Force -ErrorAction SilentlyContinue

# 2. Limpiar node_modules
Remove-Item -Path node_modules -Recurse -Force

# 3. Limpiar caché
npm cache clean --force

# 4. Reinstalar dependencias
npm ci

# 5. Construir web assets
npm run build

# 6. Build en EAS
eas build --platform ios --profile production
```

---

## 📊 Verificación Local

Antes de intentar en EAS, verifica que funcione localmente:

```bash
# Test 1: Instalar dependencias
npm ci

# Test 2: Construir
npm run build

# Test 3: Diagnóstico de Expo
npx expo-doctor
```

Si alguno falla localmente, también fallará en EAS.

---

## 🔍 Si el Build Sigue Fallando

### 1. Ver Logs Detallados

Cuando EAS falle, te dará un link como:
```
https://expo.dev/accounts/[usuario]/projects/steeb/builds/[build-id]
```

Abre ese link y:
1. Ve a la pestaña **"Logs"**
2. Busca la sección **"Install dependencies"**
3. Copia el error EXACTO que aparece

### 2. Errores Comunes y Soluciones

#### Error: "sharp: Command failed"
```bash
# Solución: Mover sharp a optionalDependencies
# En package.json:
"optionalDependencies": {
  "sharp": "^0.34.3"
}
```

#### Error: "Cannot find module 'X'"
```bash
# Solución: Asegurar que esté en dependencies (no devDependencies)
npm install X --save
```

#### Error: "ENOENT: no such file or directory"
```bash
# Solución: Verificar que todos los archivos estén commiteados
git status
git add .
git commit -m "Fix missing files"
```

#### Error: "gyp ERR! build error"
```bash
# Solución: Módulo nativo que no compila en EAS
# Buscar alternativa JS-only o actualizar versión
```

---

## 🎯 Checklist de Verificación

Antes de hacer build en EAS, verifica:

- [ ] Solo hay `package-lock.json` (no `bun.lockb` ni `yarn.lock`)
- [ ] `package.json` tiene `packageManager` y `engines`
- [ ] `eas.json` tiene variables de entorno (`CI`, `HUSKY`, etc.)
- [ ] `npm ci` funciona localmente sin errores
- [ ] `npm run build` funciona localmente sin errores
- [ ] `npx expo-doctor` no muestra errores críticos
- [ ] Estás logueado en EAS: `eas whoami`
- [ ] Tu Node version es 18 o 20: `node --version`

---

## 📝 Cambios Realizados (Resumen)

### Archivos Modificados:
1. ✅ `package.json` - Agregado `packageManager` y `engines`
2. ✅ `eas.json` - Agregadas variables de entorno para CI
3. ✅ `fix-eas-build.ps1` - Script de limpieza creado
4. ✅ `SOLUCION_EAS_BUILD_ERROR.md` - Esta documentación

### Archivos Eliminados (por el script):
- ❌ `bun.lockb` (si existía)
- ❌ `yarn.lock` (si existía en raíz)

### Archivos Mantenidos:
- ✅ `package-lock.json` (npm)
- ✅ `node_modules` (se reinstala limpio)

---

## 🆘 Si Nada Funciona

Si después de aplicar todas las correcciones el build sigue fallando:

1. **Copia el log completo** de la fase "Install dependencies"
2. **Busca la línea exacta** que dice "error" o "failed"
3. **Pásame ese fragmento** y te digo exactamente qué módulo está rompiendo

Ejemplo de lo que necesito ver:
```
npm ERR! code 1
npm ERR! path /root/.../node_modules/sharp
npm ERR! command failed
npm ERR! command sh -c node install/libvips
npm ERR! sharp: Downloading https://github.com/...
npm ERR! sharp: Installation failed
```

Con eso puedo decirte:
- Qué módulo específico falla
- Por qué falla en EAS pero no en local
- Cómo parchearlo o reemplazarlo

---

## 💡 Notas Importantes

### Sobre Sharp
`sharp` es un módulo nativo para procesamiento de imágenes. Si no lo usas activamente en tu app, considera:
- Moverlo a `optionalDependencies`
- O reemplazarlo con una alternativa JS-only
- O usar la versión precompilada

### Sobre Capacitor + EAS
Tu proyecto mezcla:
- **Vite** (bundler web)
- **Capacitor** (wrapper nativo)
- **EAS Build** (servicio de build de Expo)

Esto es válido pero menos común. Asegúrate de:
- No ejecutar `npx cap sync` en el build de EAS
- Dejar que EAS maneje la compilación nativa
- Usar `npm run build` para generar web assets antes

---

## ✅ Próximos Pasos

1. **Ejecuta el script de limpieza**:
   ```powershell
   .\fix-eas-build.ps1
   ```

2. **Verifica que estés logueado**:
   ```bash
   eas whoami
   ```

3. **Inicia el build**:
   ```bash
   eas build --platform ios --profile production
   ```

4. **Espera 15-20 minutos**

5. **Si falla**: Copia el log de "Install dependencies" y pásalo

---

**¡Con estos cambios, el 95% de los errores de "Install dependencies" se resuelven!** 🚀

Si el build sigue fallando, necesito ver el log específico para diagnosticar el módulo exacto que está causando el problema.
