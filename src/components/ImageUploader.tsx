import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/utils/githubImageUpload';
import { Upload, Image, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  onImageUploaded?: (url: string) => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageUploaded, 
  className = '' 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadImage } = useImageUpload();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño de archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. El tamaño máximo es 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const result = await uploadImage(file);
      
      if (result.success && result.url) {
        setUploadedImageUrl(result.url);
        onImageUploaded?.(result.url);
        
        toast({
          title: "¡Éxito!",
          description: "La imagen se subió correctamente a GitHub.",
        });
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: `Error al subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Limpiar el input para permitir subir el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Subir Imagen a GitHub
        </CardTitle>
        <CardDescription>
          Sube una imagen que se almacenará en tu repositorio de GitHub
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <Button
          onClick={handleFileSelect}
          disabled={uploading}
          className="w-full"
          variant="outline"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar Imagen
            </>
          )}
        </Button>

        {uploadedImageUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Imagen subida:</p>
            <div className="border rounded-md p-2">
              <img
                src={uploadedImageUrl}
                alt="Imagen subida"
                className="max-w-full h-auto max-h-64 mx-auto rounded"
              />
            </div>
            <div className="text-xs text-muted-foreground break-all">
              <strong>URL:</strong> {uploadedImageUrl}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Formatos soportados: JPG, PNG, GIF, WebP</p>
          <p>• Tamaño máximo: 5MB</p>
          <p>• Las imágenes se almacenan en la carpeta 'images' de tu repositorio</p>
        </div>
      </CardContent>
    </Card>
  );
};