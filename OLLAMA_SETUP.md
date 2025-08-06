# Configuración de Ollama para STEBE AI

Esta guía te ayudará a configurar Ollama localmente para usar modelos de IA con STEBE AI.

## 🚀 Instalación de Ollama

### Windows
1. Descarga el instalador desde [ollama.ai](https://ollama.ai/download)
2. Ejecuta el instalador y sigue las instrucciones
3. Ollama se instalará como servicio y estará disponible en `http://localhost:11434`

### macOS
```bash
# Usando Homebrew
brew install ollama

# O descarga desde ollama.ai
curl -fsSL https://ollama.ai/install.sh | sh
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## 📦 Modelos Recomendados

### Modelos Ligeros (Recomendados para empezar)
```bash
# Gemma 2B - Muy rápido, ideal para respuestas básicas
ollama pull gemma2:2b

# Llama 3.2 1B - Extremadamente ligero
ollama pull llama3.2:1b

# Phi3 Mini - Optimizado para tareas específicas
ollama pull phi3:mini
```

### Modelos Medianos (Mejor calidad)
```bash
# Llama 3.2 3B - Buen balance entre velocidad y calidad
ollama pull llama3.2:3b

# Gemma 9B - Excelente para español
ollama pull gemma2:9b

# Qwen 3B - Muy bueno para productividad
ollama pull qwen2.5:3b
```

### Modelos Avanzados (Requieren más recursos)
```bash
# Mistral 7B - Excelente calidad general
ollama pull mistral:7b

# Llama 3.1 8B - Muy completo
ollama pull llama3.1:8b
```

## ⚙️ Configuración en STEBE AI

### 1. Verificar que Ollama está ejecutándose
```bash
# Verificar estado
ollama list

# Si no está ejecutándose, iniciarlo
ollama serve
```

### 2. Configurar modelo en la aplicación
El servicio Gemini está configurado para usar `gemma2:2b` por defecto. Puedes cambiarlo:

```typescript
// En el componente StebeAI
const config: GeminiConfig = {
  temperature: 0.7,
  maxTokens: 1024,
  model: 'gemma2:2b' // Cambia aquí el modelo
};
```

### 3. Modelos disponibles desde la UI
La aplicación detectará automáticamente los modelos instalados y permitirá cambiar entre ellos.

## 🔧 Configuración Avanzada

### Cambiar puerto de Ollama
```bash
# Cambiar puerto por defecto
export OLLAMA_HOST=0.0.0.0:11435
ollama serve
```

Luego actualizar en la aplicación:
```typescript
const config: GeminiConfig = {
  ollamaUrl: 'http://localhost:11435',
  model: 'gemma2:2b'
};
```

### Optimización de rendimiento
```bash
# Variables de entorno para mejor rendimiento
export OLLAMA_NUM_PARALLEL=2
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_FLASH_ATTENTION=1
```

## 📊 Requisitos del Sistema

### Mínimos (Modelos 1B-2B)
- **RAM**: 4GB libres
- **CPU**: Cualquier procesador moderno
- **Espacio**: 2-4GB por modelo

### Recomendados (Modelos 3B-7B)
- **RAM**: 8GB libres
- **CPU**: 4+ núcleos
- **Espacio**: 5-15GB por modelo

### Óptimos (Modelos 8B+)
- **RAM**: 16GB+ libres
- **CPU**: 8+ núcleos o GPU
- **Espacio**: 15-30GB por modelo

## 🚦 Verificación de Funcionamiento

### 1. Test básico de Ollama
```bash
# Verificar que Ollama responde
curl http://localhost:11434/api/tags

# Test rápido de chat
curl http://localhost:11434/api/generate -d '{
  "model": "gemma2:2b",
  "prompt": "Hola, ¿cómo estás?",
  "stream": false
}'
```

### 2. Test desde STEBE AI
1. Abrir la aplicación
2. Ir a la sección de STEBE AI
3. Hacer clic en "Inicializar"
4. Debería mostrar "Gemini con Ollama listo!"

## ❗ Solución de Problemas

### Ollama no se conecta
```bash
# Verificar que está ejecutándose
ps aux | grep ollama

# Reiniciar servicio
pkill ollama
ollama serve

# Verificar puerto
netstat -tlnp | grep 11434
```

### Modelo no encontrado
```bash
# Listar modelos instalados
ollama list

# Instalar modelo faltante
ollama pull gemma2:2b
```

### Respuestas lentas
1. Usar modelos más pequeños (1B-2B)
2. Reducir `maxTokens` en la configuración
3. Cerrar otras aplicaciones que usen mucha RAM

### Error de memoria
```bash
# Verificar memoria disponible
free -h

# Usar modelo más pequeño o aumentar RAM virtual
ollama pull llama3.2:1b
```

## 🎯 Configuración Óptima para STEBE AI

Para la mejor experiencia con STEBE AI, recomendamos:

```bash
# Instalar modelo optimizado para español
ollama pull gemma2:2b

# Configuración recomendada
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_MAX_LOADED_MODELS=1
```

### Configuración en la aplicación:
```typescript
const config: GeminiConfig = {
  temperature: 0.7,      // Creatividad balanceada
  maxTokens: 512,        // Respuestas concisas
  model: 'gemma2:2b'     // Modelo optimizado
};
```

## 📝 Comandos Útiles

```bash
# Ver modelos disponibles online
ollama search gemma

# Eliminar modelo no usado
ollama rm llama3.1:8b

# Ver uso de recursos
ollama ps

# Actualizar Ollama
curl -fsSL https://ollama.ai/install.sh | sh
```

## 🔗 Enlaces Útiles

- [Ollama Official Website](https://ollama.ai)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [Lista completa de modelos](https://ollama.ai/library)
- [Documentación API](https://github.com/ollama/ollama/blob/main/docs/api.md)

---

Con esta configuración, STEBE AI funcionará completamente offline usando modelos locales de IA, proporcionando respuestas rápidas y personalizadas para gestión de productividad.