import { useState } from 'react';
import { ImageUploader } from '@/components/ImageUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ImageUploadPage = () => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUploaded = (url: string) => {
    setUploadedImages(prev => [url, ...prev]);
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
      
      toast({
        title: "¡Copiado!",
        description: "La URL se copió al portapapeles.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar la URL al portapapeles.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Subir Imágenes a GitHub
          </h1>
          <p className="text-gray-600">
            Sube imágenes directamente a tu repositorio de GitHub usando Cursor
          </p>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Token configurado ✓
          </Badge>
        </div>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Actual</CardTitle>
            <CardDescription>
              Verifica que la configuración de GitHub esté correcta en tu archivo .env
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Token:</strong> {import.meta.env.VITE_GITHUB_TOKEN ? '✓ Configurado' : '✗ No configurado'}
              </div>
              <div>
                <strong>Propietario:</strong> {import.meta.env.VITE_GITHUB_REPO_OWNER || 'No configurado'}
              </div>
              <div>
                <strong>Repositorio:</strong> {import.meta.env.VITE_GITHUB_REPO_NAME || 'No configurado'}
              </div>
              <div>
                <strong>Rama:</strong> {import.meta.env.VITE_GITHUB_BRANCH || 'main'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Component */}
        <ImageUploader onImageUploaded={handleImageUploaded} />

        {/* Lista de imágenes subidas */}
        {uploadedImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Imágenes Subidas ({uploadedImages.length})</CardTitle>
              <CardDescription>
                Historial de imágenes subidas en esta sesión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <img
                      src={url}
                      alt={`Imagen ${index + 1}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Imagen #{uploadedImages.length - index}</p>
                      <p className="text-xs text-gray-500 break-all">{url}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => copyToClipboard(url)}
                      >
                        {copiedUrl === url ? (
                          <>
                            <Check className="mr-2 h-3 w-3" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-3 w-3" />
                            Copiar URL
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle>Instrucciones de Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">1. Actualiza el archivo .env</h4>
              <p className="text-sm text-gray-600 mt-1">
                Cambia los valores en el archivo .env con tu información de GitHub:
              </p>
              <pre className="bg-gray-100 p-3 rounded text-xs mt-2 overflow-x-auto">
{`VITE_GITHUB_REPO_OWNER=tu-usuario-github
VITE_GITHUB_REPO_NAME=tu-repositorio
VITE_GITHUB_BRANCH=main`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold">2. Permisos del Token</h4>
              <p className="text-sm text-gray-600 mt-1">
                Asegúrate de que tu token de GitHub tenga los siguientes permisos:
              </p>
              <ul className="text-xs text-gray-600 mt-2 list-disc list-inside">
                <li>Contents (lectura y escritura)</li>
                <li>Metadata (lectura)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">3. Uso con Cursor</h4>
              <p className="text-sm text-gray-600 mt-1">
                Ahora puedes usar Cursor para añadir imágenes a tu aplicación. 
                Las imágenes se subirán automáticamente a GitHub y obtendrás URLs permanentes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageUploadPage;