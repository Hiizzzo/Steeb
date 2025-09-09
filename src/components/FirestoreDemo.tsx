import React, { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Check, Clock, AlertCircle } from 'lucide-react';
import { Task } from '@/types';
import { useToast } from '@/hooks/use-toast';

const FirestoreDemo: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    tasks, 
    isLoading, 
    error, 
    syncStatus, 
    lastSync,
    addTask, 
    updateTask, 
    deleteTask 
  } = useTaskStore();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    setIsCreating(true);
    try {
      await addTask({
        title: newTaskTitle.trim(),
        description: 'Tarea creada desde Firestore Demo',
        priority: 'medium',
        status: 'pending',
        completed: false,
        tags: ['demo', 'firestore'],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
      });
      setNewTaskTitle('');
    } catch (error) {
      console.error('Error creando tarea:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await updateTask(task.id, { 
        completed: !task.completed,
        status: !task.completed ? 'completed' : 'pending'
      });
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast({
        title: "Tu tarea se ha eliminado correctamente",
      });
    } catch (error) {
      console.error('Error eliminando tarea:', error);
    }
  };

  const getSyncStatusBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return <Badge variant="outline" className="text-green-600"><Check className="w-3 h-3 mr-1" />Sincronizado</Badge>;
      case 'syncing':
        return <Badge variant="outline" className="text-blue-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Sincronizando</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔥 Demo de Firestore</span>
          {getSyncStatusBadge()}
        </CardTitle>
        <CardDescription>
          Usuario: {user?.email || 'No autenticado'} | 
          Tareas: {tasks.length} | 
          Última sincronización: {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Nunca'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Formulario para crear nueva tarea */}
        <div className="flex gap-2">
          <Input
            placeholder="Título de la nueva tarea..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
            disabled={isCreating}
          />
          <Button 
            onClick={handleCreateTask} 
            disabled={!newTaskTitle.trim() || isCreating}
            size="sm"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* Lista de tareas */}
        <div className="space-y-2">
          {isLoading && tasks.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Cargando tareas desde Firestore...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay tareas. ¡Crea tu primera tarea!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-center justify-between p-3 border rounded-md transition-colors ${
                  task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleTask(task)}
                    className={task.completed ? 'text-green-600' : 'text-gray-400'}
                  >
                    <Check className={`w-4 h-4 ${task.completed ? 'opacity-100' : 'opacity-30'}`} />
                  </Button>
                  
                  <div>
                    <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-gray-600">{task.description}</p>
                    )}
                    <div className="flex gap-1 mt-1">
                      {task.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Información de desarrollo */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md text-sm">
          <h5 className="font-semibold mb-2">🔧 Información de desarrollo:</h5>
          <ul className="space-y-1 text-gray-600">
            <li>• Las tareas se guardan automáticamente en Firestore</li>
            <li>• Los cambios se sincronizan en tiempo real</li>
            <li>• Cada usuario tiene sus propias tareas</li>
            <li>• Los datos persisten entre sesiones</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FirestoreDemo;