import React, { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Download, 
  FileText, 
  HardDrive, 
  Trash2, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

const LocalStoragePanel: React.FC = () => {
  const { 
    tasks,
    loadTasksFromLocal, 
    exportTasksAsText, 
    getTasksAsText, 
    clearLocalStorage 
  } = useTaskStore();
  
  const [showTextContent, setShowTextContent] = useState(false);
  const [textContent, setTextContent] = useState('');

  const handleLoadFromLocal = () => {
    try {
      loadTasksFromLocal();
      toast.success('Tareas cargadas desde almacenamiento local');
    } catch (error) {
      toast.error('Error al cargar tareas locales');
    }
  };

  const handleExportTasks = () => {
    try {
      exportTasksAsText();
      toast.success('Tareas exportadas como archivo de texto');
    } catch (error) {
      toast.error('Error al exportar tareas');
    }
  };

  const handleShowText = () => {
    if (!showTextContent) {
      const content = getTasksAsText();
      setTextContent(content);
    }
    setShowTextContent(!showTextContent);
  };

  const handleClearLocal = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar el almacenamiento local? Esta acción no se puede deshacer.')) {
      try {
        clearLocalStorage();
        setTextContent('');
        setShowTextContent(false);
        toast.success('Almacenamiento local limpiado');
      } catch (error) {
        toast.error('Error al limpiar almacenamiento local');
      }
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Almacenamiento Local
        </CardTitle>
        <CardDescription>
          Gestiona tus tareas de forma local e instantánea. Las tareas se guardan automáticamente en texto plano.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
            <div className="text-sm text-blue-800">Total de Tareas</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="text-sm text-green-800">Completadas</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{pendingTasks}</div>
            <div className="text-sm text-orange-800">Pendientes</div>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button 
            onClick={handleLoadFromLocal}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Cargar Local
          </Button>
          
          <Button 
            onClick={handleExportTasks}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar TXT
          </Button>
          
          <Button 
            onClick={handleShowText}
            variant="outline"
            className="flex items-center gap-2"
          >
            {showTextContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showTextContent ? 'Ocultar' : 'Ver Texto'}
          </Button>
          
          <Button 
            onClick={handleClearLocal}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar
          </Button>
        </div>

        {/* Información */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Creación Instantánea
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            Almacenamiento Local
          </Badge>
          <Badge variant="outline">
            Sin Dependencia de Internet
          </Badge>
        </div>

        {/* Contenido de texto */}
        {showTextContent && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contenido en Texto Plano
            </h3>
            <Textarea 
              value={textContent}
              readOnly
              className="min-h-[300px] font-mono text-sm"
              placeholder="No hay contenido de tareas disponible"
            />
            <p className="text-xs text-muted-foreground">
              Este es el contenido que se guarda localmente en formato de texto plano.
            </p>
          </div>
        )}

        {/* Descripción del funcionamiento */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">🚀 Funcionamiento Optimizado:</h4>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• <strong>Creación Instantánea:</strong> Las tareas aparecen inmediatamente en la UI</li>
            <li>• <strong>Guardado Local:</strong> Se almacenan automáticamente en texto plano</li>
            <li>• <strong>Sincronización en Segundo Plano:</strong> Firebase se actualiza sin bloquear la UI</li>
            <li>• <strong>Respaldo Automático:</strong> Siempre tienes una copia local de tus tareas</li>
            <li>• <strong>Exportación:</strong> Puedes descargar tus tareas como archivo .txt</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocalStoragePanel;