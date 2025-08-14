import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Download, 
  Eye, 
  Trash2,
  Plus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageData {
  filename: string;
  path: string;
  size: number;
  uploadedAt?: string;
}

interface LovableImageDisplayProps {
  className?: string;
  maxImages?: number;
  showUploadButton?: boolean;
  onImageSelect?: (image: ImageData) => void;
}

const LovableImageDisplay: React.FC<LovableImageDisplayProps> = ({ 
  className = '', 
  maxImages = 20,
  showUploadButton = true,
  onImageSelect 
}) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Cargar imágenes al montar el componente
  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/images');
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Manejar subida de archivos
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadImages(); // Recargar la lista de imágenes
      } else {
        throw new Error('Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  // Manejar drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Eliminar imagen
  const handleDeleteImage = async (filename: string) => {
    try {
      const response = await fetch(`/api/images/${filename}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadImages();
        if (selectedImage?.filename === filename) {
          setSelectedImage(null);
          setShowFullscreen(false);
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Área de subida con drag and drop */}
      {showUploadButton && (
        <motion.div
          className={`border-2 border-dashed rounded-lg p-6 mb-6 transition-all duration-200 ${
            dragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="text-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Subiendo imagen...</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Arrastra tu imagen aquí</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  o haz clic para seleccionar
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={uploading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Seleccionar imagen
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Grid de imágenes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <motion.div
                key={`skeleton-${index}`}
                className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              />
            ))
          ) : (
            images.slice(0, maxImages).map((image, index) => (
              <motion.div
                key={image.filename}
                className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedImage(image);
                  setShowFullscreen(true);
                  onImageSelect?.(image);
                }}
              >
                <img
                  src={image.path}
                  alt={image.filename}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay con acciones */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(image);
                      setShowFullscreen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = image.path;
                      link.download = image.filename;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-red-500/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
                        handleDeleteImage(image.filename);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Info de la imagen */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs truncate">{image.filename}</p>
                  <p className="text-white/70 text-xs">{formatFileSize(image.size)}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Estado vacío */}
      {!loading && images.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No hay imágenes</h3>
          <p className="text-gray-400">Sube tu primera imagen para comenzar</p>
        </motion.div>
      )}

      {/* Modal de imagen completa */}
      <AnimatePresence>
        {showFullscreen && selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullscreen(false)}
          >
            <motion.div
              className="relative max-w-full max-h-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.path}
                alt={selectedImage.filename}
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Botón de cerrar */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setShowFullscreen(false)}
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Info de la imagen */}
              <Card className="absolute bottom-4 left-4 right-4 bg-black/70 border-gray-600">
                <CardContent className="p-4">
                  <h3 className="text-white font-medium truncate">{selectedImage.filename}</h3>
                  <p className="text-gray-300 text-sm">{formatFileSize(selectedImage.size)}</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LovableImageDisplay;