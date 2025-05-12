
import React, { useState } from 'react';
import { TaskProvider, useTaskContext } from '@/context/TaskContext';
import TaskHeader from '@/components/TaskHeader';
import TaskList from '@/components/TaskList';
import AddTaskForm from '@/components/AddTaskForm';
import TaskTimer from '@/components/TaskTimer';
import StatsPanel from '@/components/StatsPanel';
import ColorBlobs from '@/components/ColorBlobs';
import AddTaskButton from '@/components/AddTaskButton';
import InactivityReminder from '@/components/InactivityReminder';

const TasksContent = () => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const {
    tasks,
    activeTask,
    handleAddTask,
    handleCompleteTask,
    handleStartTimer,
    handleTimerComplete,
    handleCancelTimer
  } = useTaskContext();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Color blobs background */}
      <ColorBlobs />
      
      {/* Inactivity reminder logic */}
      <InactivityReminder activeTask={activeTask} tasks={tasks} />
      
      {/* Header */}
      <TaskHeader />
      
      {showAddTask && (
        <div className="px-6 mb-6 relative z-10">
          <AddTaskForm onAddTask={(taskData) => {
            handleAddTask(taskData);
            setShowAddTask(false);
          }} />
          <Button 
            className="w-full mt-3 bg-steve-white hover:bg-steve-gray-light steve-border"
            variant="outline"
            onClick={() => setShowAddTask(false)}
          >
            Cancelar
          </Button>
        </div>
      )}
      
      {showStats && (
        <div className="px-6 mb-6 relative z-10">
          <StatsPanel tasks={tasks} />
          <Button 
            className="w-full mt-3 bg-steve-black text-steve-white hover:bg-steve-gray-dark"
            onClick={() => setShowStats(false)}
          >
            Cerrar Estadísticas
          </Button>
        </div>
      )}
      
      {!showAddTask && !showStats && (
        <div className="px-6 pb-32 relative z-10">
          <TaskList
            tasks={tasks}
            onComplete={handleCompleteTask}
            onStartTimer={handleStartTimer}
          />
        </div>
      )}
      
      {/* Timer Activo */}
      {activeTask && (
        <TaskTimer
          task={activeTask}
          onComplete={handleTimerComplete}
          onCancel={handleCancelTimer}
        />
      )}
      
      {/* Botón flotante de añadir */}
      <AddTaskButton
        onClick={() => {
          setShowAddTask(true);
          setShowStats(false);
        }}
      />
    </div>
  );
};

// Faltó importar Button en el componente interno TasksContent
import { Button } from '@/components/ui/button';

// Componente principal
const Index = () => (
  <TaskProvider>
    <TasksContent />
  </TaskProvider>
);

export default Index;
