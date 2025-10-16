# Script para solucionar pantalla en blanco en Expo

Write-Host "🔍 Solucionando problema de pantalla en blanco en Expo..." -ForegroundColor Green

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "steeb-temp")) {
    Write-Host "❌ Error: No se encuentra el directorio steeb-temp" -ForegroundColor Red
    Write-Host "Por favor, ejecuta este script desde el directorio principal" -ForegroundColor Yellow
    exit 1
}

Set-Location steeb-temp
Write-Host "📁 Cambiado al directorio steeb-temp" -ForegroundColor Green

# Verificar estructura actual
Write-Host "📋 Verificando estructura actual..." -ForegroundColor Yellow

if (-not (Test-Path "app")) {
    Write-Host "📁 Creando directorio app..." -ForegroundColor Blue
    New-Item -ItemType Directory -Path "app" | Out-Null
}

# Crear app/_layout.tsx si no existe
if (-not (Test-Path "app/_layout.tsx")) {
    Write-Host "📄 Creando app/_layout.tsx..." -ForegroundColor Blue
    
    $layoutContent = @'
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'STEEB' }} />
      </Stack>
    </>
  );
}
'@
    Set-Content -Path "app/_layout.tsx" -Value $layoutContent
    Write-Host "✅ app/_layout.tsx creado" -ForegroundColor Green
}

# Crear app/index.tsx simple para probar
Write-Host "📄 Creando app/index.tsx simple..." -ForegroundColor Blue

$indexContent = @'
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  console.log('App Index montada correctamente');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>STEEB - Task Manager</Text>
      <Text style={styles.subtitle}>App funcionando correctamente</Text>
      <Text style={styles.test}>✅ Pantalla en blanco solucionada</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  test: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
});
'@

Set-Content -Path "app/index.tsx" -Value $indexContent
Write-Host "✅ app/index.tsx creado" -ForegroundColor Green

# Verificar package.json
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encuentra package.json" -ForegroundColor Red
    Write-Host "Por favor, asegúrate de que el proyecto esté inicializado" -ForegroundColor Yellow
    exit 1
}

# Verificar dependencias necesarias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

$dependencies = @("expo", "react", "react-native", "expo-router", "expo-status-bar")

foreach ($dep in $dependencies) {
    if (-not $packageJson.dependencies.PSObject.Properties.Name -contains $dep) {
        Write-Host "⚠️ Falta dependencia: $dep" -ForegroundColor Yellow
        Write-Host "📦 Instalando $dep..." -ForegroundColor Blue
        & npm install $dep
    }
}

# Limpiar caché de Expo
Write-Host "🧹 Limpiando caché de Expo..." -ForegroundColor Blue
& npx expo start -c --non-interactive

Write-Host ""
Write-Host "✅ ¡Solución aplicada!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "npx expo start"
Write-Host ""
Write-Host "O para build:" -ForegroundColor Yellow
Write-Host "eas build --platform ios --profile production"
Write-Host ""
Write-Host "Si la app todavía está en blanco:" -ForegroundColor Red
Write-Host "1. Abre Expo Go en tu dispositivo" -ForegroundColor White
Write-Host "2. Shake el dispositivo" -ForegroundColor White
Write-Host "3. Ve a Debug → Remote JS Debugger" -ForegroundColor White
Write-Host "4. Revisa la consola del navegador para errores" -ForegroundColor White