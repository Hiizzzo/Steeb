import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Download, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import mistralService, { ChatMessage, MistralConfig } from '@/services/mistralService';
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
    const status = mistralService.getInitializationStatus();
    const isReady = mistralService.isReady();
    
    console.log('📊 StebeAI Status Check:', { 
      ...status, 
      isReady
    });
    
    setInitState(prev => ({
      ...prev,
      isInitialized: status.isInitialized,
      isInitializing: status.isInitializing,
      progress: status.progress
    }));

    if (!status.isInitialized && !status.isInitializing) {
      // El modelo no está inicializado, mostrar opciones al usuario
      setInitState(prev => ({
        ...prev,
        status: 'Stebe AI está listo para configurarse'
      }));
    } else if (status.isInitialized) {
      setInitState(prev => ({
        ...prev,
        status: '✅ STEBE AI Listo para usar'
      }));
    }
  };

  const handleInitialize = async () => {
    try {
      setInitState(prev => ({ ...prev, error: null, isInitializing: true }));
      
      const config: MistralConfig = {
        temperature: 0.7,
        maxTokens: 1024,
        contextSize: 2048
      };

      const success = await mistralService.initialize(config, (progress, status) => {
        setInitState(prev => ({
          ...prev,
          progress,
          status,
          isInitializing: true
        }));
      });

      if (success) {
        setInitState(prev => ({
          ...prev,
          isInitialized: true,
          isInitializing: false,
          progress: 100,
          status: '¡Stebe AI está listo para ayudarte!'
        }));

        toast({
          title: "🧠 Stebe AI Activado",
          description: "Tu asistente personal offline está listo para organizar tu día",
        });

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

      toast({
        title: "Error",
        description: "No se pudo inicializar Stebe AI: " + error.message,
        variant: "destructive"
      });
    }
  };

  const generateWelcomeMessage = async () => {
    if (!mistralService.isReady()) return;

    try {
      setIsGenerating(true);
      const welcomeMessage = await mistralService.getProductivitySuggestion();
      onMessageGenerated?.(welcomeMessage);
    } catch (error) {
      console.error('Error generando mensaje de bienvenida:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMotivationalMessage = async () => {
    if (!mistralService.isReady()) {
      toast({
        title: "Stebe AI no está disponible",
        description: "Primero debes inicializar el modelo",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      const suggestion = await mistralService.getProductivitySuggestion();
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
                      <span>Modelo Mistral 7B listo para descargar</span>
                    </div>
                    <Button 
                      onClick={handleInitialize}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Activar Stebe AI (~ 4.3GB)
                    </Button>
                    <p className="text-xs text-gray-500">
                      La primera descarga puede tomar varios minutos dependiendo de tu conexión
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
                    <span>Mistral 7B Instruct</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado:</span>
                    <span className="text-green-600">Offline y privado</span>
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