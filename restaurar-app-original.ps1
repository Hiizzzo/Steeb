# Script para restaurar la aplicación original de STEB

Write-Host "🔄 Restaurando aplicación original de STEB..." -ForegroundColor Green

# Paso 1: Eliminar archivos de Expo creados
Write-Host "🗑️ Eliminando archivos de Expo..." -ForegroundColor Yellow

if (Test-Path "app") {
    Remove-Item -Recurse -Force "app"
    Write-Host "Eliminada carpeta app" -ForegroundColor Green
}

if (Test-Path "assets") {
    Remove-Item -Recurse -Force "assets"
    Write-Host "Eliminada carpeta assets" -ForegroundColor Green
}

# Paso 2: Restaurar package.json original
Write-Host "📄 Restaurando package.json original..." -ForegroundColor Blue

$originalPackageJson = '{
  "name": "steeb_ai_gemini_ollama",
  "private": true,
  "version": "8.5.0",
  "type": "module",
  "packageManager": "yarn@1.22.22",
  "engines": {
    "node": ">=18.18.0 <=20.x",
    "npm": ">=9.0.0"
  },
  "scripts": {
    "dev": "vite",
    "server": "node server.js",
    "dev:full": "concurrently \"npm run server\" \"npm run dev\"",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@capacitor/android": "^6.1.2",
    "@capacitor/ios": "^6.1.2",
    "@capacitor/cli": "^6.1.2",
    "@capacitor/core": "^6.1.2",
    "@capacitor/device": "^6.0.1",
    "@capacitor/filesystem": "^6.0.1",
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-context-menu": "^2.2.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-hover-card": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.1",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.4",
    "@tanstack/react-query": "^5.56.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "concurrently": "^8.2.2",
    "cors": "^2.8.5",
    "date-fns": "^3.6.0",
    "dotenv": "^16.4.5",
    "embla-carousel-react": "^8.3.0",
    "express": "^4.21.2",
    "firebase": "^12.1.0",
    "framer-motion": "^12.23.6",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.462.0",
    "multer": "^1.4.5-lts.1",
    "next-themes": "^0.3.0",
    "ollama": "^0.5.16",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-resizable-panels": "^2.1.3",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.12.7",
    "sharp": "^0.34.3",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.3",
    "zod": "^3.23.8",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.0",
    "@tailwindcss/typography": "^0.5.15",
    "@types/node": "^22.5.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.9.0",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.9",
    "globals": "^15.9.0",
    "lovable-tagger": "^1.1.7",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.11",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.0.1",
    "vite": "^5.4.19"
  }
}'

Set-Content -Path "package.json" -Value $originalPackageJson
Write-Host "✅ package.json restaurado" -ForegroundColor Green

# Paso 3: Restaurar app.json original
Write-Host "📄 Restaurando app.json original..." -ForegroundColor Blue

$originalAppJson = '{
  "expo": {
    "name": "STEEB - Task Manager",
    "slug": "steeb_ai_gemini_ollama",
    "version": "1.0.1",
    "orientation": "portrait",
    "icon": "./public/icon-512.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./public/icon-512.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.santyy.steeb",
      "buildNumber": "2",
      "supportsTablet": true,
      "newArchEnabled": false,
      "infoPlist": {
        "NSUserTrackingUsageDescription": "This app does NOT track users. No data is collected for advertising or tracking purposes. All data is stored locally on your device only.",
        "NSCameraUsageDescription": "Camera access is not required for this app.",
        "NSPhotoLibraryUsageDescription": "Photo library access is not required for this app.",
        "NSLocationWhenInUseUsageDescription": "Location access is not required for this app.",
        "NSPrivacyAccessedAPITypes": [
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime",
            "NSPrivacyAccessedAPITypeReasons": ["35F9.1"]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
            "NSPrivacyAccessedAPITypeReasons": ["C617.1"]
          }
        ]
      }
    },
    "android": {
      "package": "com.santyy.steeb",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./public/icon-512.png",
        "backgroundColor": "#ffffff"
      }
    },
    "extra": {
      "eas": {
        "projectId": "0778eccc-a4f5-41ce-9797-858da711b88c"
      }
    },
    "plugins": []
  }
}'

Set-Content -Path "app.json" -Value $originalAppJson
Write-Host "✅ app.json restaurado" -ForegroundColor Green

# Paso 4: Restaurar eas.json original
Write-Host "📄 Restaurando eas.json original..." -ForegroundColor Blue

$originalEasJson = '{
  "cli": { 
    "version": ">= 11.0.0", 
    "appVersionSource": "local" 
  },
  "build": {
    "production": {
      "developmentClient": false,
      "distribution": "store",
      "autoIncrement": true,
      "ios": { 
        "resourceClass": "m-medium",
        "node": "20.11.1"
      },
      "env": { 
        "NODE_VERSION": "20.11.1", 
        "EXPO_USE_YARN": "true",
        "YARN_ENABLE_IMMUTABLE_INSTALLS": "false"
      }
    }
  },
  "submit": { 
    "production": { 
      "ios": { 
        "ascAppId": "6752629210" 
      } 
    } 
  }
}'

Set-Content -Path "eas.json" -Value $originalEasJson
Write-Host "✅ eas.json restaurado" -ForegroundColor Green

# Paso 5: Crear capacitor.config.ts si no existe
Write-Host "📄 Creando capacitor.config.ts..." -ForegroundColor Blue

$capacitorConfig = '

import { CapacitorConfig } from ''@capacitor/cli'';

const config: CapacitorConfig = {
  appId: ''com.santyy.steeb'',
  appName: ''steve-the-taskmaster'',
  webDir: ''dist'',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      showSpinner: true,
      spinnerColor: "#000000",
    },
    Filesystem: {
      ioTimeout: 60000 // Timeout largo para descargas de modelos grandes
    }
  }
};

export default config;
'

Set-Content -Path "capacitor.config.ts" -Value $capacitorConfig
Write-Host "✅ capacitor.config.ts creado" -ForegroundColor Green

# Paso 6: Limpiar node_modules y reinstalar
Write-Host "🧹 Limpiando e instalando dependencias..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "Eliminado node_modules" -ForegroundColor Green
}

if (Test-Path "yarn.lock") {
    Remove-Item "yarn.lock" -Force
    Write-Host "Eliminado yarn.lock" -ForegroundColor Green
}

# Paso 7: Instalar dependencias con yarn
Write-Host "📦 Instalando dependencias con yarn..." -ForegroundColor Blue

try {
    yarn install --ignore-engines
    Write-Host "✅ Dependencias instaladas con yarn" -ForegroundColor Green
} catch {
    Write-Host "❌ Error instalando con yarn, intentando con npm" -ForegroundColor Red
    npm install
}

# Paso 8: Verificar que todo esté funcionando
Write-Host "✅ Verificando instalación..." -ForegroundColor Green

try {
    yarn --version
    Write-Host "✅ Yarn funcionando" -ForegroundColor Green
} catch {
    Write-Host "❌ Yarn no funciona" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ ¡Aplicación original restaurada!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes ejecutar:" -ForegroundColor Cyan
Write-Host "yarn dev"
Write-Host "o"
Write-Host "npm run dev"
Write-Host ""
Write-Host "Para build de iOS, usa:" -ForegroundColor Yellow
Write-Host "eas build --platform ios --profile production"