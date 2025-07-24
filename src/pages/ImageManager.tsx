import React, { useState, useEffect } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Trash2, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ImageInfo {
  filename: string;
  path: string;
  size: number;
}

const ImageManager: React.FC = () => {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPath, setCopiedPath] = useState<string>('');
  const { toast } = useToast();

  // Cargar lista de imágenes
  const loadImages = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/images');
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la lista de imágenes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // Manejar imagen subida
  const handleImageUploaded = (imagePath: string) => {
    toast({
      title: "¡Éxito!",
      description: "Imagen subida correctamente",
    });
    loadImages(); // Recargar lista
  };

  // Copiar ruta de imagen
  const copyImagePath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      toast({
        title: "Copiado",
        description: "Ruta de imagen copiada al portapapeles",
      });
      setTimeout(() => setCopiedPath(''), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar la ruta",
        variant: "destructive"
      });
    }
  };

  // Eliminar imagen
  const deleteImage = async (filename: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/images/${filename}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Eliminado",
          description: "Imagen eliminada correctamente",
        });
        loadImages(); // Recargar lista
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestor de Imágenes
          </h1>
          <p className="text-gray-600">
            Sube y gestiona las imágenes de tu aplicación
          </p>
        </div>

        {/* Upload Component */}
        <ImageUpload onImageUploaded={handleImageUploaded} />

        {/* Images List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Imágenes Disponibles ({images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando imágenes...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay imágenes subidas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <Card key={image.filename} className="overflow-hidden">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <img
                        src={`http://localhost:3001${image.path}`}
                        alt={image.filename}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {image.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(image.size)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyImagePath(image.path)}
                            className="flex-1"
                          >
                            {copiedPath === image.path ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteImage(image.filename)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Subir Imagen</h4>
              <p className="text-sm text-gray-600">
                Usa el componente de upload arriba para subir una nueva imagen.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">2. Copiar Ruta</h4>
              <p className="text-sm text-gray-600">
                Haz clic en el botón de copiar para obtener la ruta de la imagen.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">3. Usar en el Código</h4>
              <p className="text-sm text-gray-600">
                Usa la ruta copiada en tu código: <code className="bg-gray-100 px-1 rounded">src="RUTA_COPIADA"</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageManager; 