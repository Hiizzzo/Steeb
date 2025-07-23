/**
 * Utilidades para subir imágenes a GitHub usando la API de GitHub
 */

interface GitHubUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

/**
 * Obtiene la configuración de GitHub desde las variables de entorno
 */
function getGitHubConfig(): GitHubConfig {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const owner = import.meta.env.VITE_GITHUB_REPO_OWNER;
  const repo = import.meta.env.VITE_GITHUB_REPO_NAME;
  const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main';

  if (!token || !owner || !repo) {
    throw new Error('Configuración de GitHub incompleta. Verifica las variables de entorno.');
  }

  return { token, owner, repo, branch };
}

/**
 * Convierte un archivo a base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remover el prefijo "data:image/...;base64,"
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Genera un nombre único para el archivo
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `image_${timestamp}_${randomString}.${extension}`;
}

/**
 * Sube una imagen a GitHub usando la API
 */
export async function uploadImageToGitHub(file: File): Promise<GitHubUploadResponse> {
  try {
    const config = getGitHubConfig();
    const base64Content = await fileToBase64(file);
    const fileName = generateUniqueFileName(file.name);
    const path = `images/${fileName}`;

    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add image: ${fileName}`,
        content: base64Content,
        branch: config.branch,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al subir imagen: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      url: data.content.download_url,
    };
  } catch (error) {
    console.error('Error uploading image to GitHub:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Hook personalizado para subir imágenes
 */
export function useImageUpload() {
  const uploadImage = async (file: File): Promise<GitHubUploadResponse> => {
    return uploadImageToGitHub(file);
  };

  return { uploadImage };
}