import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Image, CheckCircle, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onImageUploaded?: (imagePath: string, originalUrl?: string) => void;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUploaded, className }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadedImagePath, setUploadedImagePath] = useState<string>('');
  const [uploadedOriginalUrl, setUploadedOriginalUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [dataUrl, setDataUrl] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  useEffect(() => {
    if (!selectedFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleUpload = async () => {
    if (!selectedFile && !imageUrl && !dataUrl) return;

    setUploading(true);
    setUploadStatus('idle');

    try {
      let result: any = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Error al subir la imagen');
        result = await response.json();
      } else if (imageUrl) {
        const response = await fetch('/api/upload-image-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        });
        if (!response.ok) throw new Error('Error al importar la imagen por URL');
        result = await response.json();
      } else if (dataUrl) {
        const response = await fetch('/api/upload-image-base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl }),
        });
        if (!response.ok) throw new Error('Error al importar la imagen por base64');
        result = await response.json();
      }

      const imagePath = result.path || `/lovable-uploads/${result.filename}`;
      const originalUrl = result.original_url;

      setUploadedImagePath(imagePath);
      setUploadedOriginalUrl(originalUrl);
      setUploadStatus('success');

      if (onImageUploaded) {
        onImageUploaded(imagePath, originalUrl);
      }

      // Limpiar inputs
      setSelectedFile(null);
      setImageUrl('');
      setDataUrl('');
      if (document.getElementById('file-input') as HTMLInputElement) {
        (document.getElementById('file-input') as HTMLInputElement).value = '';
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

        {previewUrl && (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <img src={previewUrl} alt="Vista previa" className="max-w-full max-h-full object-contain" />
          </div>
        )}

        {selectedFile && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Image className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">{selectedFile.name}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="url-input">O pegar URL de imagen</Label>
          <Input
            id="url-input"
            type="url"
            placeholder="https://... .png/.jpg/.webp"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={uploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataurl-input">O pegar Data URL (base64)</Label>
          <textarea
            id="dataurl-input"
            placeholder="data:image/png;base64,iVBORw0KGgo..."
            value={dataUrl}
            onChange={(e) => setDataUrl(e.target.value)}
            className="w-full h-24 border rounded p-2 text-sm"
            disabled={uploading}
          />
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!(selectedFile || imageUrl || dataUrl) || uploading}
          className="w-full"
        >
          {uploading ? 'Subiendo...' : 'Subir / Importar Imagen'}
        </Button>

        {uploadStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">¡Imagen subida exitosamente sin modificaciones!</span>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Error al subir la imagen</span>
          </div>
        )}

        {uploadedImagePath && (
          <div className="p-3 bg-blue-50 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-blue-700 mb-1">Ruta de la imagen:</p>
              <code className="text-xs bg-blue-100 p-2 rounded block break-all">
                {uploadedImagePath}
              </code>
            </div>
            {uploadedOriginalUrl && (
              <div>
                <p className="text-sm text-blue-700 mb-1">URL original:</p>
                <code className="text-xs bg-blue-100 p-2 rounded block break-all">
                  {uploadedOriginalUrl}
                </code>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUpload; 