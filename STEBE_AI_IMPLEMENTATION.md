# Implementación de Stebe AI - Asistente Offline con Mistral 7B

## Descripción General

Este proyecto implementa un asistente virtual offline llamado "Stebe" que utiliza el modelo Mistral 7B en formato GGUF para funcionar completamente sin conexión a internet en dispositivos móviles. El asistente actúa como un mentor personal de productividad, ayudando a organizar tareas y motivar al usuario.

## Características Principales

- ✅ **100% Offline**: Funciona sin conexión a internet
- ✅ **Privacidad Total**: Todas las conversaciones permanecen en el dispositivo
- ✅ **Modelo Mistral 7B**: IA avanzada en formato GGUF optimizado
- ✅ **Interfaz Intuitiva**: Integración fluida con la app existente
- ✅ **Fallback Inteligente**: Respuestas predefinidas cuando la IA no está disponible
- ✅ **Streaming**: Respuestas generadas en tiempo real token por token
- ✅ **Personalización**: System prompt especializado para productividad

## Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: React + TypeScript + Tailwind CSS
- **Móvil**: Capacitor.js para apps nativas
- **IA**: llama.rn (binding de React Native para llama.cpp)
- **Modelo**: Mistral 7B Instruct v0.1 Q4_K_M (~4.3GB)
- **Sistema de Archivos**: Capacitor Filesystem API

### Componentes Principales

#### 1. `mistralService.ts`
Servicio principal que maneja:
- Descarga automática del modelo GGUF
- Inicialización de llama.cpp
- Gestión del contexto de conversación
- Generación de respuestas streaming
- Limpieza de recursos

#### 2. `StebeAI.tsx`
Componente UI para:
- Configuración e inicialización del modelo
- Indicadores de progreso de descarga
- Control de estado (activado/desactivado)
- Generación de mensajes motivacionales

#### 3. `ChatPage.tsx` (Mejorado)
Página de chat con:
- Integración con el modelo AI
- Modo AI/Fallback
- Indicadores visuales de estado
- Panel de configuración expandible

## System Prompt de Stebe

El asistente utiliza un prompt personalizado que lo configura como:

- **Rol**: Jefe personal/mentor de productividad
- **Personalidad**: Profesional pero cercano, motivador y exigente
- **Idioma**: Siempre en español
- **Especialización**: Gestión de tareas, organización personal, motivación
- **Limitaciones**: Solo temas de productividad personal

## Instrucciones de Instalación

### 1. Dependencias Requeridas

```bash
# Instalar dependencias específicas de IA
npm install llama.rn @capacitor/filesystem @capacitor/device

# Verificar que Capacitor esté configurado
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

### 2. Configuración de Capacitor

Asegúrate de que `capacitor.config.ts` incluya:

```typescript
plugins: {
  Filesystem: {
    ioTimeout: 60000 // Para descargas grandes
  }
}
```

### 3. Permisos de Android

En `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### 4. Configuración de iOS

En `ios/App/App/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## Uso del Sistema

### 1. Primera Configuración

1. Ir a la página de chat (`/chat`)
2. Hacer clic en el botón de configuración (⚙️)
3. Activar "Stebe AI" - iniciará descarga automática
4. Esperar completación (puede tomar 5-10 minutos según conexión)

### 2. Uso Normal

- **Modo AI Activado**: Respuestas generadas por Mistral 7B
- **Modo AI Desactivado**: Respuestas predefinidas inteligentes
- **Indicador Visual**: Icono de cerebro (🧠) cuando AI está activo
- **Fallback Automático**: Si AI falla, usa respuestas predefinidas

### 3. Comandos y Funciones

- **Consejos Motivacionales**: Botón "Pedirle consejo a Stebe"
- **Chat Libre**: Cualquier mensaje sobre productividad
- **Gestión de Tareas**: Preguntas sobre organización y metas
- **Motivación**: Apoyo y consejos personalizados

## Optimizaciones de Rendimiento

### 1. Modelo Optimizado
- **Formato Q4_K_M**: Balance entre calidad y tamaño
- **Contexto Limitado**: 2048 tokens para mayor velocidad
- **CPU-Only**: Compatible con todos los dispositivos

### 2. Gestión de Memoria
- **use_mlock**: Mantiene modelo en RAM
- **Limpieza Automática**: Libera recursos al cerrar
- **Context Pooling**: Reutiliza contexto entre conversaciones

### 3. UI Responsiva
- **Streaming UI**: Tokens aparecen en tiempo real
- **Progress Indicators**: Feedback visual durante descarga
- **Fallback Instantáneo**: Sin interrupciones en la experiencia

## Consideraciones de Producción

### 1. Almacenamiento
- **Espacio Requerido**: ~5GB libres recomendados
- **Cache Persistente**: Modelo se mantiene entre sesiones
- **Verificación de Espacio**: Implementar antes de descarga

### 2. Rendimiento
- **Dispositivos Mínimos**: 4GB RAM recomendados
- **Velocidad**: 1-3 tokens/segundo según dispositivo
- **Batería**: Uso intensivo durante generación

### 3. Experiencia de Usuario
- **Primera Descarga**: Advertir sobre tiempo y datos
- **Modo Offline**: Clarificar que funciona sin internet
- **Fallbacks**: Siempre mantener funcionalidad básica

## Troubleshooting

### Problemas Comunes

1. **Error de Descarga**
   - Verificar conexión a internet
   - Comprobar espacio disponible
   - Reintentar descarga

2. **Modelo No Carga**
   - Verificar permisos de filesystem
   - Comprobar que el archivo está completo
   - Limpiar cache y redownload

3. **Respuestas Lentas**
   - Normal en dispositivos antiguos
   - Considerar usar modelo más pequeño
   - Verificar otras apps no consuman CPU

4. **Memoria Insuficiente**
   - Cerrar otras aplicaciones
   - Reiniciar dispositivo
   - Reducir context_size

## Roadmap Futuro

### Mejoras Planificadas
- [ ] Modelos más pequeños para dispositivos básicos
- [ ] Fine-tuning específico para productividad
- [ ] Integración con calendario y tareas
- [ ] Recordatorios inteligentes basados en IA
- [ ] Análisis de patrones de productividad

### Optimizaciones Técnicas
- [ ] Quantización dinámica
- [ ] Model sharding para carga parcial
- [ ] Cache inteligente de respuestas
- [ ] Compresión de contexto
- [ ] GPU acceleration para iOS

## Licencias y Créditos

- **Mistral 7B**: Apache 2.0 License
- **llama.cpp**: MIT License
- **llama.rn**: MIT License
- **React Native**: MIT License

## Soporte

Para problemas técnicos o preguntas:
1. Revisar logs de consola
2. Verificar configuración de Capacitor
3. Comprobar permisos del dispositivo
4. Consultar documentación de llama.rn

---

**Nota**: Esta implementación está optimizada para funcionar en producción manteniendo un balance entre funcionalidad avanzada y compatibilidad con dispositivos móviles estándar.