import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Image, CheckCircle, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onImageUploaded?: (imagePath: string) => void;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUploaded, className }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadedImagePath, setUploadedImagePath] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('idle');

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Enviar al servidor de desarrollo de Vite
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const imagePath = `/lovable-uploads/${result.filename}`;
        setUploadedImagePath(imagePath);
        setUploadStatus('success');
        
        // Notificar al componente padre
        if (onImageUploaded) {
          onImageUploaded(imagePath);
        }
        
        // Limpiar el formulario
        setSelectedFile(null);
        if (document.getElementById('file-input') as HTMLInputElement) {
          (document.getElementById('file-input') as HTMLInputElement).value = '';
        }
      } else {
        throw new Error('Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Subir Imagen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-input">Seleccionar imagen</Label>
          <Input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Image className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">{selectedFile.name}</span>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          {uploading ? 'Subiendo...' : 'Subir Imagen'}
        </Button>

        {uploadStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">¡Imagen subida exitosamente!</span>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Error al subir la imagen</span>
          </div>
        )}

        {uploadedImagePath && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">Ruta de la imagen:</p>
            <code className="text-xs bg-blue-100 p-2 rounded block break-all">
              {uploadedImagePath}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUpload; 