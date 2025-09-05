import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Download, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import geminiService, { GeminiConfig } from '@/services/geminiService';
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
    const statusString = geminiService.getInitializationStatus();
    const isReady = geminiService.isReady();

    console.log('📊 StebeAI Status Check:', {
      status: statusString,
      isReady
    });

    setInitState(prev => ({
      ...prev,
      isInitialized: isReady,
      isInitializing: false,
      progress: isReady ? 100 : 0,
      status: isReady ? '✅ STEBE AI (Ollama) listo' : 'Stebe AI está listo para configurarse'
    }));
  };

  const handleInitialize = async () => {
    try {
      setInitState(prev => ({ ...prev, error: null, isInitializing: true, status: 'Conectando con Ollama...' }));

      const config: GeminiConfig = {
        temperature: 0.7,
        maxTokens: 1024,
        model: 'gemma2:2b',
        ollamaUrl: geminiService.getOllamaUrl()
      };

      const success = await geminiService.initialize(config, (progress, status) => {
        setInitState(prev => ({ ...prev, progress, status }));
      });

      if (success) {
        setInitState(prev => ({
          ...prev,
          isInitialized: true,
          isInitializing: false,
          progress: 100,
          status: '¡Stebe AI (Ollama) está listo para ayudarte!'
        }));

        // Generar mensaje de bienvenida
        setTimeout(() => generateWelcomeMessage(), 500);
      } else {
        throw new Error('No se pudo inicializar el modelo');
      }
    } catch (error: any) {
      console.error('Error inicializando Stebe AI:', error);
      setInitState(prev => ({
        ...prev,
        error: error?.message || 'Error de inicialización',
        isInitializing: false,
        progress: 0,
        status: 'Error de inicialización'
      }));
    }
  };

  const generateWelcomeMessage = async () => {
    if (!geminiService.isReady()) return;

    try {
      setIsGenerating(true);
      const welcomeMessage = await geminiService.getProductivitySuggestion();
      onMessageGenerated?.(welcomeMessage);
    } catch (error) {
      console.error('Error generando mensaje de bienvenida:', error);
      const fallbackMessage = "¡Hola! 👋 Soy Stebe, tu asistente de productividad offline. Contame qué querés lograr hoy y te ayudo a organizarlo en pasos claros.";
      onMessageGenerated?.(fallbackMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMotivationalMessage = async () => {
    if (!geminiService.isReady()) {
      toast({
        title: "Stebe AI no está disponible",
        description: "Primero debes inicializar el modelo",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      const suggestion = await geminiService.getResponse(
        'Dame un consejo motivacional breve y práctico para mejorar mi productividad hoy. Usa viñetas.'
      );
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

  // NUEVA FUNCIÓN: Generar tareas automáticamente
  const generateTasksFromRequest = async () => {
    if (!geminiService.isReady()) {
      toast({
        title: "Stebe AI no está disponible",
        description: "Primero debes inicializar el modelo",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      const userRequest = prompt(
        "💼 ¿Qué necesitas hacer hoy?\n\n" +
          "Describe tu objetivo y crearé tareas claras y priorizadas para ti (en viñetas).\n\n" +
          "Ejemplos:\n" +
          "• 'Preparar una presentación para el trabajo'\n" +
          "• 'Organizar mi casa para las vacaciones'\n" +
          "• 'Estudiar para mi examen de matemáticas'"
      );

      if (!userRequest || userRequest.trim() === '') return;

      const taskPrompt = `Quiero un plan de tareas en español, sólo sobre productividad.\n\n` +
        `Instrucciones:\n` +
        `- Desglosa en 3-6 tareas concretas con subtareas si corresponde\n` +
        `- Indica prioridad y tiempo estimado por tarea\n` +
        `- Termina con próximos pasos en 2-3 viñetas\n` +
        `- Formatea todo en viñetas o números\n\n` +
        `Objetivo del usuario: ${userRequest}`;

      const message = await geminiService.getResponse(taskPrompt);
      onMessageGenerated?.(message);

      toast({
        title: "🎉 ¡Tareas sugeridas!",
        description: `Plan generado a partir de tu objetivo`,
      });
    } catch (error) {
      console.error('Error generando tareas:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear las tareas automáticamente",
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
              <CardTitle className="text-lg">Stebe AI - Asistente Inteligente</CardTitle>
            </div>
            <Badge variant={getStatusColor()}>
              {initState.isInitialized ? 'Activo' : 
               initState.isInitializing ? 'Cargando' :
               initState.error ? 'Error' : 'Inactivo'}
            </Badge>
          </div>
          <CardDescription>
            Tu mentor personal de productividad que funciona completamente offline con Ollama
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
                      <span>Ollama local listo. Modelo por defecto: gemma2:2b</span>
                    </div>
                    {/* Configuración rápida */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      <div>
                        <label className="text-xs text-gray-500">URL de Ollama</label>
                        <input
                          type="text"
                          defaultValue={geminiService.getOllamaUrl()}
                          onBlur={(e) => geminiService.setOllamaUrl(e.target.value)}
                          className="mt-1 w-full border rounded px-3 py-2 text-sm"
                          placeholder="http://localhost:11434"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Modelo</label>
                        <select
                          defaultValue={geminiService.getCurrentModel()}
                          onChange={(e) => geminiService.setModel(e.target.value)}
                          className="mt-1 w-full border rounded px-3 py-2 text-sm"
                        >
                          {geminiService.getAvailableModels().map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Button 
                      onClick={handleInitialize}
                      className="w-full"
                      size="lg"
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Activar Stebe AI (Offline)
                    </Button>
                    <p className="text-xs text-gray-500">
                      Se descargará el modelo si no está instalado. Puedes cambiar el modelo y la URL antes de iniciar.
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
                  
                  <Button 
                    onClick={generateTasksFromRequest}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-blue-600 to-white hover:from-blue-700 hover:to-gray-100"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Creando tareas...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Crear tareas automáticamente
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      if (!geminiService.isReady()) return;
                      setIsGenerating(true);
                      try {
                        const today = new Date();
                        const req = `Genera un plan del día con 3-5 tareas priorizadas para hoy (${today.toLocaleDateString('es-AR')}). Usa viñetas y mantente en temas de productividad.`;
                        const plan = await geminiService.getResponse(req);
                        onMessageGenerated?.(plan);
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full"
                  >
                    {isGenerating ? 'Generando plan...' : 'Plan del día'}
                  </Button>
                  
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-600">
                      💡 Describe cualquier objetivo y Stebe creará un plan detallado con tareas específicas
                    </p>
                  </div>
                </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Modelo:</span>
                      <span>{geminiService.getCurrentModel()} via Ollama (local)</span>
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