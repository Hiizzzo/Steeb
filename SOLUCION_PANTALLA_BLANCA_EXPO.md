# Solución para Pantalla en Blanco en Expo

## 🚨 Problema Identificado

El build se completa correctamente pero la app se muestra en blanco cuando la simulas. Esto ocurre cuando:
1. El código fuente no está correctamente migrado a Expo
2. Las rutas no están configuradas correctamente
3. Los componentes no son compatibles con Expo

## 🔍 Diagnóstico del Problema

### Paso 1: Verificar estructura del proyecto
```bash
# Desde steeb-temp
dir
dir app
dir src
```

### Paso 2: Verificar archivos clave
```bash
# Verificar si existe app/_layout.tsx
type app\_layout.tsx

# Verificar si existe app/index.tsx
type app\index.tsx

# Verificar app.json
type app.json
```

## ✅ Soluciones

### Solución 1: Migrar Correctamente a Expo

Si tienes una carpeta `src/` con tu código original:

1. **Crear app/_layout.tsx**
```tsx
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
```

2. **Crear app/index.tsx**
```tsx
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>STEEB - Task Manager</Text>
      <Text style={styles.subtitle}>App funcionando correctamente</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
```

3. **Migrar componentes de src/ a app/**

Para cada componente en `src/`:
- Convertir CSS a StyleSheet
- Reemplazar etiquetas HTML por componentes React Native
- Ajustar importaciones

### Solución 2: Usar WebView (Más Rápido)

Si quieres mantener tu código web actual:

1. **Instalar dependencias**
```bash
npx expo install react-native-webview
```

2. **Crear app/index.tsx con WebView**
```tsx
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'http://localhost:3000' }}
        style={styles.webview}
        onLoad={() => console.log('WebView loaded')}
        onError={(error) => console.log('WebView error:', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
```

### Solución 3: Depuración con Logs

1. **Agregar logs para depurar**
```tsx
import { useEffect } from 'react';
import { View } from 'react-native';

export default function Index() {
  useEffect(() => {
    console.log('App mounted');
    console.log('Environment:', process.env);
  }, []);

  return (
    <View>
      {/* Tu componente */}
    </View>
  );
}
```

2. **Ver logs en Expo Go**
- Abre Expo Go
- Shake el dispositivo
- Ve a "Debug" → "Remote JS Debugger"
- Revisa la consola del navegador

## 🛠️ Herramientas de Depuración

### Verificar bundle
```bash
# Desde steeb-temp
npx expo start --dev-client
```

### Limpiar caché
```bash
npx expo start -c
```

### Verificar configuración
```bash
npx expo config --type internal
```

## 📱 Pasos para Solucionar

### Paso 1: Verificar que tengas los archivos básicos
```
steeb-temp/
├── app/
│   ├── _layout.tsx
│   └── index.tsx
├── package.json
├── app.json
└── eas.json
```

### Paso 2: Probar con un componente simple
Reemplaza el contenido de `app/index.tsx` con:
```tsx
import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>¡Hola Mundo!</Text>
    </View>
  );
}
```

Si esto funciona, el problema está en tus componentes.

### Paso 3: Migrar gradualmente
1. Comienza con componentes simples
2. Migra uno por uno
3. Prueba cada componente individualmente

## 🔧 Comandos Útiles

```bash
# Iniciar con depuración
npx expo start --dev-client

# Limpiar caché
npx expo start -c

# Verificar configuración
npx expo doctor

# Prebuild para generar nativos
npx expo prebuild --clean
```

## 💡 Tips Importantes

1. **React Native ≠ React Web** - Los componentes son diferentes
2. **CSS no funciona directamente** - Usa StyleSheet
3. **Las rutas son diferentes** - Usa expo-router
4. **Los imports deben ser específicos** - No imports relativos profundos

## 🎯 Si nada funciona

Crea un proyecto nuevo desde cero:
```bash
npx create-expo-app@latest steeb-fixed --template blank-typescript
cd steeb-fixed
# Copia tu código fuente gradualmente
```

---

## 🚀 Checklist Final

- [ ] app/_layout.tsx existe y funciona
- [ ] app/index.tsx muestra contenido
- [ ] Las dependencias están instaladas
- [ ] No hay errores en la consola
- [ ] El bundle se carga correctamente

Si sigues estos pasos, tu app debería funcionar correctamente sin pantalla en blanco.