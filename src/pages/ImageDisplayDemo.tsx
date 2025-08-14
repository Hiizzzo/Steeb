import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LovableImageDisplay from '@/components/LovableImageDisplay';
import ChatImageDisplay from '@/components/ChatImageDisplay';
import { Gallery, MessageCircle, Sparkles } from 'lucide-react';

const ImageDisplayDemo: React.FC = () => {
  const [selectedImages, setSelectedImages] = useState<any[]>([]);

  const handleImageSelect = (image: any) => {
    console.log('Imagen seleccionada:', image);
    setSelectedImages(prev => [...prev, image]);
  };

  const handleImageSent = (image: any, message: string) => {
    console.log('Imagen enviada en chat:', image, message);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Sistema de Imágenes Estilo Lovable</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Un sistema completo para subir, mostrar y manejar imágenes exactamente como en Lovable. 
          Las imágenes se muestran tal como las envías, con drag & drop y preview en tiempo real.
        </p>
      </div>

      {/* Tabs para diferentes vistas */}
      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Gallery className="w-4 h-4" />
            Galería de Imágenes
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Chat con Imágenes
          </TabsTrigger>
        </TabsList>

        {/* Vista de Galería */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gallery className="w-5 h-5" />
                Galería Estilo Lovable
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Arrastra y suelta imágenes, o haz clic para seleccionar. Las imágenes se muestran 
                en una cuadrícula responsive con preview completo y opciones de descarga/eliminación.
              </p>
            </CardHeader>
            <CardContent>
              <LovableImageDisplay 
                className="min-h-96"
                maxImages={16}
                showUploadButton={true}
                onImageSelect={handleImageSelect}
              />
            </CardContent>
          </Card>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Características</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Drag & Drop desde el explorador</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Preview en pantalla completa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Descarga directa de imágenes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Eliminación con confirmación</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Animaciones suaves</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Imágenes Seleccionadas</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedImages.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Haz clic en una imagen en la galería para ver su información aquí
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedImages.slice(-5).map((image, index) => (
                      <div key={index} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <p className="font-medium truncate">{image.filename}</p>
                        <p className="text-gray-500">{image.path}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vista de Chat */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat principal */}
            <div className="lg:col-span-2">
              <Card className="h-[600px]">
                <ChatImageDisplay 
                  className="h-full"
                  onImageSent={handleImageSent}
                />
              </Card>
            </div>

            {/* Panel de información */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cómo Usar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <h4 className="font-medium mb-1">Enviar Imágenes:</h4>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Arrastra imagen al chat</li>
                      <li>• Usa el botón 📎</li>
                      <li>• Escribe mensaje opcional</li>
                    </ul>
                  </div>
                  
                  <div className="text-sm">
                    <h4 className="font-medium mb-1">Características:</h4>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Preview inmediato</li>
                      <li>• Scroll automático</li>
                      <li>• Formato de chat real</li>
                      <li>• Timestamps</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Formatos Soportados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {['JPG', 'PNG', 'GIF', 'WEBP', 'JPEG'].map((format) => (
                      <span 
                        key={format}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tamaño máximo: 5MB por imagen
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estado del Servidor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Servidor activo</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Puerto 3001 - API de uploads funcionando
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer con instrucciones */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">¡Listo para usar!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              El sistema está configurado y funcionando. Las imágenes se guardan en{" "}
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                /public/lovable-uploads/
              </code>{" "}
              y se sirven directamente como en Lovable.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span>✅ Drag & Drop</span>
              <span>✅ Preview en vivo</span>
              <span>✅ Responsive</span>
              <span>✅ Animaciones</span>
              <span>✅ API completa</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageDisplayDemo;