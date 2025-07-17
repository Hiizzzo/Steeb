# Barra de Navegación Inferior - React Native

Este proyecto contiene componentes para crear una barra de navegación inferior con botones circulares negros y iconos blancos, siguiendo el diseño mostrado en las imágenes de referencia.

## Archivos Incluidos

- `BottomTabNavigation.js` - Componente principal usando Expo Vector Icons
- `BottomTabNavigationSimple.js` - Versión alternativa sin dependencias externas
- `ExampleUsage.js` - Ejemplo de implementación
- `README.md` - Documentación

## Instalación

### Opción 1: Con Expo Vector Icons (Recomendado)

Si usas Expo:
```bash
npx expo install @expo/vector-icons
```

Si usas React Native CLI:
```bash
npm install react-native-vector-icons
# Seguir las instrucciones de configuración específicas para iOS/Android
```

### Opción 2: Sin dependencias externas

Usa el archivo `BottomTabNavigationSimple.js` que no requiere instalaciones adicionales.

## Uso

### Implementación Básica

```javascript
import React from 'react';
import { View } from 'react-native';
import BottomTabNavigation from './BottomTabNavigation';
// o import BottomTabNavigationSimple from './BottomTabNavigationSimple';

const App = () => {
  const handleTasksPress = () => {
    console.log('Navegando a TAREAS');
    // Implementar navegación a pantalla de tareas
  };

  const handleAddPress = () => {
    console.log('Navegando a AGREGAR');
    // Implementar navegación o modal para agregar
  };

  const handleProgressPress = () => {
    console.log('Navegando a PROGRESO');
    // Implementar navegación a pantalla de progreso
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tu contenido aquí */}
      
      <BottomTabNavigation
        onTasksPress={handleTasksPress}
        onAddPress={handleAddPress}
        onProgressPress={handleProgressPress}
      />
    </View>
  );
};

export default App;
```

## Características

### Diseño
- ✅ Botones circulares negros con iconos blancos
- ✅ Botón central (AGREGAR) ligeramente más grande
- ✅ Sombras y elevación para efecto visual
- ✅ Posicionamiento absoluto en la parte inferior
- ✅ Responsive al ancho de pantalla

### Funcionalidad
- ✅ Tres botones: TAREAS (✓), AGREGAR (+), PROGRESO (📊)
- ✅ Props para manejar eventos de cada botón
- ✅ Efectos de toque con `activeOpacity`
- ✅ Compatible con navegación React Navigation

### Iconos Incluidos
- **TAREAS**: Ícono de check/marca de verificación
- **AGREGAR**: Ícono de plus/suma
- **PROGRESO**: Ícono de barras de gráfico/estadísticas

## Personalización

### Cambiar colores
```javascript
// En los estilos del componente
tabButton: {
  backgroundColor: '#000000', // Cambiar color de fondo
  // ...otros estilos
},

// Para los iconos (en versión Expo)
<Ionicons name="checkmark" size={24} color="#FFFFFF" />
```

### Cambiar tamaños
```javascript
tabButton: {
  width: 60,      // Cambiar ancho
  height: 60,     // Cambiar alto
  borderRadius: 30, // Mantener la mitad del width/height para círculo perfecto
},
```

### Cambiar posición
```javascript
container: {
  bottom: 30, // Cambiar distancia desde la parte inferior
  // ...otros estilos
},
```

## Integración con React Navigation

```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const handleTasksPress = () => {
  navigation.navigate('TasksScreen');
};

const handleAddPress = () => {
  navigation.navigate('AddScreen');
};

const handleProgressPress = () => {
  navigation.navigate('ProgressScreen');
};
```

## Compatibilidad

- ✅ React Native 0.60+
- ✅ Expo SDK 40+
- ✅ iOS y Android
- ✅ TypeScript (con tipados apropiados)

## Soporte

Para dudas o problemas, revisa la documentación de React Native o Expo según corresponda.

## Sistema de tareas con notificaciones push

### 1. Configura Firebase Cloud Messaging (FCM)
- Ve a https://console.firebase.google.com/
- Crea un proyecto y habilita Cloud Messaging.
- Copia tu **Server Key** y pégala en `backend/.env` como `FCM_SERVER_KEY`.
- Copia los datos de tu app web (apiKey, authDomain, projectId, messagingSenderId, appId) y reemplázalos en:
  - `public/firebase-messaging-sw.js`
  - `src/lib/firebase.js`
- Copia tu **VAPID Key** y reemplázala en `src/pages/TaskForm.tsx`.

### 2. Corre el backend
```bash
cd backend
node server.js
```

### 3. Corre el frontend
```bash
npm run dev
```

### 4. Abre la web app en tu celular, acepta notificaciones y crea una tarea con fecha/hora.

¡Listo! Recibirás la notificación en tu celular en la fecha/hora programada.
