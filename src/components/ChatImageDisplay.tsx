import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  User,
  Bot,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageImage {
  filename: string;
  path: string;
  size: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  image?: MessageImage;
  timestamp: Date;
}

interface ChatImageDisplayProps {
  className?: string;
  onImageSent?: (image: MessageImage, message: string) => void;
}

const ChatImageDisplay: React.FC<ChatImageDisplayProps> = ({ 
  className = '',
  onImageSent 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enviar mensaje de texto
  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');

    // Simular respuesta del asistente
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'He recibido tu mensaje. ¿En qué más puedo ayudarte?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  // Subir y enviar imagen
  const handleImageUpload = async (file: File, messageText: string = '') => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const imageData: MessageImage = {
          filename: result.filename,
          path: `/lovable-uploads/${result.filename}`,
          size: file.size
        };

        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'user',
          content: messageText || 'Imagen enviada',
          image: imageData,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        onImageSent?.(imageData, messageText);

        // Simular respuesta del asistente
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: '¡Perfecta imagen! La puedo ver claramente. Está guardada tal como la enviaste, igual que en Lovable. ¿Qué te gustaría hacer con ella?',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        }, 1500);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  // Manejar archivos seleccionados
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen');
      return;
    }

    handleImageUpload(file, currentMessage);
    setCurrentMessage('');
  };

  // Drag and drop
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
    handleFileSelect(e.dataTransfer.files);
  };

  // Formatear tiempo
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Chat con Imágenes - Estilo Lovable</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Envía imágenes y las verás exactamente como las mandas
        </p>
      </div>

      {/* Área de mensajes */}
      <div 
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          dragOver ? 'bg-blue-50 dark:bg-blue-950/20' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Mensaje */}
                <Card className={`${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <CardContent className="p-3">
                    {/* Imagen si existe */}
                    {message.image && (
                      <div className="mb-3">
                        <div className="relative rounded-lg overflow-hidden bg-black/10">
                          <img
                            src={message.image.path}
                            alt={message.image.filename}
                            className="w-full max-w-sm h-auto object-contain rounded-lg"
                            style={{ maxHeight: '300px' }}
                          />
                          
                          {/* Info de la imagen */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                            <p className="text-white text-xs truncate">
                              {message.image.filename}
                            </p>
                            <p className="text-white/70 text-xs">
                              {formatFileSize(message.image.size)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Texto del mensaje */}
                    <p className="text-sm">{message.content}</p>
                    
                    {/* Timestamp */}
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' 
                        ? 'text-blue-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {uploading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <div className="flex gap-3 max-w-[80%] flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <Card className="bg-blue-500 text-white border-blue-500">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Subiendo imagen...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Indicador de arrastrar */}
      {dragOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-4 border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-950/50 rounded-lg flex items-center justify-center z-10"
        >
          <div className="text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 text-blue-500" />
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              Suelta tu imagen aquí
            </p>
          </div>
        </motion.div>
      )}

      {/* Área de input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Escribe un mensaje o arrastra una imagen..."
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={uploading}
            className="flex-1"
          />

          <Button 
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || uploading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatImageDisplay;