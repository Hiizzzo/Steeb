# Configuración de GitHub para Subida de Imágenes

Este proyecto incluye funcionalidad para subir imágenes directamente a GitHub usando la API de GitHub. Esto te permite almacenar imágenes de forma permanente y obtener URLs públicas para usar en tu aplicación.

## 🔧 Configuración Inicial

### 1. Configurar Variables de Entorno

Ya se ha creado un archivo `.env` con tu token de GitHub. **IMPORTANTE**: Actualiza los siguientes valores con tu información:

```env
# GitHub Token para permitir subida de imágenes
VITE_GITHUB_TOKEN=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

# Configuración de GitHub para imágenes (ACTUALIZAR ESTOS VALORES)
VITE_GITHUB_REPO_OWNER=your-username     # 👈 Cambia por tu usuario de GitHub
VITE_GITHUB_REPO_NAME=your-repo-name     # 👈 Cambia por el nombre de tu repositorio
VITE_GITHUB_BRANCH=main
```

### 2. Verificar Permisos del Token

Asegúrate de que tu token de GitHub tenga los siguientes permisos:
- ✅ **Contents** (lectura y escritura) - Para crear y modificar archivos
- ✅ **Metadata** (lectura) - Para leer información del repositorio

### 3. Estructura de Carpetas

Las imágenes se subirán automáticamente a una carpeta llamada `images/` en tu repositorio con nombres únicos generados automáticamente.

## 🚀 Uso

### Desde la Interfaz de Usuario

1. Ve a la página de "Subir Imágenes" usando el botón de upload en la barra de navegación flotante
2. Selecciona una imagen (JPG, PNG, GIF, WebP - máximo 5MB)
3. La imagen se subirá automáticamente y obtendrás una URL pública

### Desde el Código

```typescript
import { useImageUpload } from '@/utils/githubImageUpload';

const { uploadImage } = useImageUpload();

const handleFileUpload = async (file: File) => {
  const result = await uploadImage(file);
  
  if (result.success) {
    console.log('URL de la imagen:', result.url);
  } else {
    console.error('Error:', result.error);
  }
};
```

## 🛠️ Componentes Disponibles

### `ImageUploader`
Componente React completo con interfaz de usuario para subir imágenes.

```tsx
import { ImageUploader } from '@/components/ImageUploader';

<ImageUploader 
  onImageUploaded={(url) => console.log('Imagen subida:', url)}
  className="my-custom-class"
/>
```

### `useImageUpload` Hook
Hook personalizado para manejar la lógica de subida.

```tsx
import { useImageUpload } from '@/utils/githubImageUpload';

const { uploadImage } = useImageUpload();
```

## 🔐 Seguridad

- ✅ El archivo `.env` está incluido en `.gitignore` para mantener tu token seguro
- ✅ El token se prefija con `VITE_` para que esté disponible en el cliente
- ⚠️ **IMPORTANTE**: Este token será visible en el código del cliente. Asegúrate de que:
  - Solo tenga los permisos mínimos necesarios
  - Sea específico para el repositorio que vas a usar
  - Lo rotes regularmente por seguridad

## 📁 Archivos Creados

- `src/utils/githubImageUpload.ts` - Utilidades para subir imágenes
- `src/components/ImageUploader.tsx` - Componente de interfaz
- `src/pages/ImageUploadPage.tsx` - Página de ejemplo
- `.env` - Variables de entorno (configurar)
- `.gitignore` - Actualizado para excluir archivos de entorno

## 🎯 Próximos Pasos

1. **Actualiza el archivo `.env`** con tu información de GitHub
2. **Prueba la funcionalidad** en la página `/image-upload`
3. **Integra el componente** en otras partes de tu aplicación donde necesites subir imágenes

## 🆘 Solución de Problemas

### Error: "Configuración de GitHub incompleta"
- Verifica que todas las variables en `.env` estén configuradas correctamente

### Error: "403 Forbidden"
- Verifica que el token tenga los permisos correctos
- Asegúrate de que el repositorio existe y el usuario/nombre sean correctos

### Error: "404 Not Found"
- Verifica que el nombre del repositorio y usuario sean exactos
- Asegúrate de que el repositorio sea público o que el token tenga acceso

¡Ya tienes todo configurado para subir imágenes a GitHub usando Cursor! 🎉