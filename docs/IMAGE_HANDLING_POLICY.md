# Política de Manejo de Imágenes - Stebe

## Principios Fundamentales

1. **Preservación del Original**: Las imágenes subidas por el usuario NUNCA se modifican, filtran o reemplazan automáticamente.

2. **Almacenamiento Directo**: El archivo original se guarda exactamente como fue enviado.

3. **URLs Directas**: La aplicación siempre usa `original_url` para mostrar la imagen principal.

## Estructura de Respuesta

Cuando se sube una imagen, el servidor devuelve:

```json
{
  "success": true,
  "filename": "image-123456789.jpg",
  "path": "/lovable-uploads/image-123456789.jpg",
  "original_url": "http://localhost:3001/lovable-uploads/image-123456789.jpg",
  "thumbnail_url": null,  // Solo se genera si se solicita explícitamente
  "analysis": null,       // Solo se genera si se solicita explícitamente
  "message": "Imagen subida exitosamente sin modificaciones"
}
```

## Funcionalidades Opcionales

### 1. Generación de Thumbnails
- Endpoint: `POST /api/generate-thumbnail`
- Solo se ejecuta cuando el usuario lo solicita explícitamente
- No modifica ni reemplaza la imagen original

### 2. Análisis de Imagen
- Endpoint: `POST /api/analyze-image`
- Extrae metadata sin modificar la imagen
- Puede expandirse con OCR, detección de objetos, etc.

### 3. Edición/Generación
- Solo cuando el usuario pide explícitamente "editar" o "generar"
- Se crea una copia nueva
- El original permanece intacto

## Implementación en Frontend

- `ImageUpload` component recibe tanto `imagePath` como `originalUrl`
- Se prefiere `original_url` sobre `path` para mostrar imágenes
- LocalStorage almacena la URL completa para acceso directo