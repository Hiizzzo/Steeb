
import React, { useState, lazy, Suspense } from 'react';

// Lazy loading para componentes pesados
const TaskCard = lazy(() => import('@/components/TaskCard'));
const ModalAddTask = lazy(() => import('@/components/ModalAddTask'));
const CalendarView = lazy(() => import('@/components/CalendarView'));

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'tasks' | 'calendar'>('tasks');

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleAddTask = (newTask: Omit<Task, 'id'>) => {
    setTasks(prev => [...prev, { ...newTask, id: Date.now().toString() }]);
    setShowModal(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold">STEBE</h1>
        <p className="text-gray-600">Simple Task Manager</p>
      </header>

      <div className="max-w-md mx-auto">
        {viewMode === 'tasks' ? (
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-center text-gray-500">No tasks yet</p>
            ) : (
              <Suspense fallback={<div>Loading...</div>}>
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    type={task.type}
                    completed={task.completed}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </Suspense>
            )}
          </div>
        ) : (
          <Suspense fallback={<div>Loading...</div>}>
            <CalendarView 
              tasks={tasks} 
              onToggleTask={handleToggleTask}
            />
          </Suspense>
        )}

        <div className="fixed bottom-6 right-6 flex space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white w-12 h-12 rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center text-xl"
          >
            +
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'tasks' ? 'calendar' : 'tasks')}
            className="bg-gray-500 text-white w-12 h-12 rounded-full shadow-lg hover:bg-gray-600 flex items-center justify-center"
          >
            📅
          </button>
        </div>

        {showModal && (
          <Suspense fallback={<div>Loading...</div>}>
            <ModalAddTask
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              onAddTask={handleAddTask}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default Index;
