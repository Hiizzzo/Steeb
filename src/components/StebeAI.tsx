import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Download, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import groqService, { GroqConfig } from '@/services/groqService';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StebeAIProps {
  onMessageGenerated?: (message: string) => void;
  className?: string;
}

interface InitializationState {
  isInitialized: boolean;
  isInitializing: boolean;
  progress: number;
  status: string;
  error: string | null;
}

const StebeAI: React.FC<StebeAIProps> = ({ onMessageGenerated, className = '' }) => {
  const { toast } = useToast();
  const [initState, setInitState] = useState<InitializationState>({
    isInitialized: false,
    isInitializing: false,
    progress: 0,
    status: '',
    error: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const initAttempted = useRef(false);

  useEffect(() => {
    // Auto-inicializar solo una vez
    if (!initAttempted.current) {
      initAttempted.current = true;
      checkInitializationStatus();
    }
  }, []);

  const checkInitializationStatus = () => {
    const statusString = groqService.getInitializationStatus();
    const isReady = groqService.isReady();
    
    console.log('📊 StebeAI Status Check:', { 
      status: statusString, 
      isReady
    });
    
    // Determinar el estado basado en el string de estado
    const isInitialized = statusString.includes('listo') || statusString.includes('Groq');
    const isInitializing = false; // Groq no tiene proceso de descarga
    
    setInitState(prev => ({
      ...prev,
      isInitialized,
      isInitializing,
      progress: isInitialized ? 100 : 0
    }));

    if (!isInitialized) {
      setInitState(prev => ({
        ...prev,
        status: 'Stebe AI está listo para configurarse'
      }));
    } else {
      setInitState(prev => ({
        ...prev,
        status: '✅ STEBE AI Listo para usar'
      }));
    }
  };

  const handleInitialize = async () => {
    try {
      setInitState(prev => ({ ...prev, error: null, isInitializing: true }));
      
      const config: GroqConfig = {
        temperature: 0.7,
        maxTokens: 1024,
        model: 'llama-3.1-70b-versatile'
      };

      const success = await groqService.initialize(config);

      if (success) {
        setInitState(prev => ({
          ...prev,
          isInitialized: true,
          isInitializing: false,
          progress: 100,
          status: '¡Stebe AI está listo para ayudarte!'
        }));

        // Generar mensaje de bienvenida
        setTimeout(() => generateWelcomeMessage(), 1000);
      } else {
        throw new Error('No se pudo inicializar el modelo');
      }
    } catch (error) {
      console.error('Error inicializando Stebe AI:', error);
      setInitState(prev => ({
        ...prev,
        error: error.message,
        isInitializing: false,
        progress: 0,
        status: 'Error de inicialización'
      }));
    }
  };

  const generateWelcomeMessage = async () => {
    if (!groqService.isReady()) return;

    try {
      setIsGenerating(true);
      const welcomeMessage = await groqService.getProductivitySuggestion();
      onMessageGenerated?.(welcomeMessage);
    } catch (error) {
      console.error('Error generando mensaje de bienvenida:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMotivationalMessage = async () => {
    if (!groqService.isReady()) {
      toast({
        title: "Stebe AI no está disponible",
        description: "Primero debes inicializar el modelo",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      const suggestion = await groqService.getProductivitySuggestion();
      onMessageGenerated?.(suggestion);

      toast({
        title: "💪 Nuevo consejo de Stebe",
        description: "Tu mentor personal tiene algo que decirte",
      });
    } catch (error) {
      console.error('Error generando mensaje motivacional:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el mensaje",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = () => {
    if (initState.error) return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (initState.isInitialized) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (initState.isInitializing) return <Download className="h-5 w-5 text-blue-500 animate-pulse" />;
    return <Brain className="h-5 w-5 text-gray-500" />;
  };

  const getStatusColor = () => {
    if (initState.error) return 'destructive';
    if (initState.isInitialized) return 'default';
    if (initState.isInitializing) return 'secondary';
    return 'outline';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <CardTitle className="text-lg">Stebe AI - Asistente Offline</CardTitle>
            </div>
            <Badge variant={getStatusColor()}>
              {initState.isInitialized ? 'Activo' : 
               initState.isInitializing ? 'Cargando' :
               initState.error ? 'Error' : 'Inactivo'}
            </Badge>
          </div>
          <CardDescription>
            Tu mentor personal de productividad que funciona completamente offline
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Estado de inicialización */}
          <AnimatePresence mode="wait">
            {!initState.isInitialized && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {!initState.isInitializing && !initState.error && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-gray-600">
                      <Cpu className="h-6 w-6" />
                      <span>Modelo Llama 3.1 70B con Groq listo para usar</span>
                    </div>
                    <Button 
                      onClick={handleInitialize}
                      className="w-full"
                      size="lg"
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Activar Stebe AI (Gratis)
                    </Button>
                    <p className="text-xs text-gray-500">
                      Requiere una API key gratuita de Groq - Te guiaremos en el proceso
                    </p>
                  </div>
                )}

                {initState.isInitializing && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{initState.status}</span>
                      <span className="text-sm text-gray-500">{initState.progress}%</span>
                    </div>
                    <Progress value={initState.progress} className="w-full" />
                    <p className="text-xs text-gray-500 text-center">
                      Configurando tu asistente personal...
                    </p>
                  </div>
                )}

                {initState.error && (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-red-800 text-sm">{initState.error}</p>
                    </div>
                    <Button 
                      onClick={handleInitialize}
                      variant="outline"
                      className="w-full"
                    >
                      Reintentar inicialización
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {initState.isInitialized && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Stebe AI está activo y listo</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    onClick={generateMotivationalMessage}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600 mr-2" />
                        Generando consejo...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Pedirle consejo a Stebe
                      </>
                    )}
                  </Button>
                </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Modelo:</span>
                      <span>Llama 3.1 70B via Groq</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <span className="text-green-600">Conectado y privado</span>
                    </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default StebeAI;