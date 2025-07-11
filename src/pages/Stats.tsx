import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Medal, BarChart3, TrendingUp, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  completedDate?: string;
}

const Stats = () => {
  const navigate = useNavigate();
  
  // Obtener tareas del localStorage
  const getTasks = (): Task[] => {
    const savedTasks = localStorage.getItem('stebe-tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  };

  const tasks = getTasks();
  const completedTasks = tasks.filter(task => task.completed);
  
  // Calcular datos reales
  const totalTasks = tasks.length;
  const completedTasksCount = completedTasks.length;
  const weeklyProgress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
  const tasksThisWeek = completedTasksCount;
  
  // Datos para el gráfico de barras semanal - datos reales
  const getDailyTasksData = () => {
    const today = new Date();
    const currentWeek = [];
    
    // Obtener los 7 días de la semana actual (lunes a domingo)
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      currentWeek.push(day);
    }
    
    const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    
    return currentWeek.map((date, index) => {
      const dayTasks = completedTasks.filter(task => {
        if (!task.completedDate) return false;
        const taskDate = new Date(task.completedDate);
        return taskDate.toDateString() === date.toDateString();
      });
      
      return {
        day: dayNames[index],
        tasks: dayTasks.length,
        isToday: date.toDateString() === today.toDateString()
      };
    });
  };

  const weeklyData = getDailyTasksData();
  const maxWeeklyTasks = Math.max(8, ...weeklyData.map(d => d.tasks)); // Mínimo 8 para la escala

  // Componente del círculo de progreso
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const circumference = 2 * Math.PI * 50;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="transparent"
            className="opacity-20"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="#22c55e"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-black">
              {Math.round(percentage)}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="h-screen bg-white overflow-hidden relative"
      style={{ 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 24px, #e5e7eb 24px, #e5e7eb 25px)',
        backgroundSize: '100% 25px'
      }}
    >
      {/* Header minimalista */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-black px-4 py-2 relative z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="text-black" />
          </Button>
          <h1 className="text-xl font-bold text-black">Estadísticas</h1>
        </div>
      </div>

      <div className="p-6 flex flex-col h-full relative z-10 pb-32">
        {/* Progreso Semanal - estilo hoja de cuaderno */}
        <div className="border-2 border-black rounded-2xl p-6 bg-white mb-6 shadow-lg relative">
          {/* Medalla con Steve y título */}
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mr-4 relative">
              <img 
                src="/lovable-uploads/8a167d1f-765d-4da3-b4a7-419491023750.png" 
                alt="Steve Medal" 
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                <Medal size={12} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-black">Tu progreso esta semana</h2>
          </div>
          
          {/* Layout principal con texto grande y círculo */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-5xl font-bold text-black mb-2">
                {tasksThisWeek} tareas
              </div>
              <div className="text-xl text-black">
                completadas esta semana
              </div>
            </div>
            
            {/* Círculo de progreso en blanco y negro */}
            <div className="flex-shrink-0 ml-8">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    stroke="#000000"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={2 * Math.PI * 45 - (weeklyProgress / 100) * 2 * Math.PI * 45}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black">
                      {Math.round(weeklyProgress)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progreso mensual - gráfico de barras */}
        <div className="border-2 border-black rounded-2xl p-6 bg-white mb-6 shadow-lg">
          <h3 className="text-2xl font-bold text-black mb-4">Progreso mensual</h3>
          
          <div className="flex items-end justify-between space-x-4 h-32 mb-4">
            {weeklyData.map((data, index) => (
              <div key={data.day} className="flex flex-col items-center flex-1">
                <div 
                  className={`w-full transition-all duration-500 ${
                    data.isToday 
                      ? 'bg-black' 
                      : data.tasks >= 8 
                        ? 'bg-green-600' 
                        : 'border-2 border-black bg-white'
                  }`}
                  style={{ 
                    height: `${Math.max((data.tasks / maxWeeklyTasks) * 100, 8)}%`,
                    minHeight: '16px'
                  }}
                />
                <div className="text-xs mt-1 font-bold text-black">
                  {data.tasks}/8
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-lg font-bold text-black">
            {weeklyData.map((data) => (
              <div key={data.day} className="text-center flex-1">
                {data.day}
              </div>
            ))}
          </div>
        </div>

        {/* Línea de progreso mensual */}
        <div className="border-2 border-black rounded-2xl p-6 bg-white shadow-lg relative">
          <div className="relative h-20">
            <svg className="w-full h-full" viewBox="0 0 300 60">
              {/* Línea de progreso */}
              <polyline
                fill="none"
                stroke="#000000"
                strokeWidth="4"
                points="30,45 70,37 110,33 150,30 190,22 230,18 270,25"
                className="drop-shadow-sm"
              />
              {/* Puntos */}
              <circle cx="30" cy="45" r="4" fill="#000000" />
              <circle cx="70" cy="37" r="4" fill="#000000" />
              <circle cx="110" cy="33" r="4" fill="#000000" />
              <circle cx="150" cy="30" r="4" fill="#000000" />
              <circle cx="190" cy="22" r="4" fill="#000000" />
              <circle cx="230" cy="18" r="4" fill="#000000" />
              <circle cx="270" cy="25" r="4" fill="#000000" />
            </svg>
          </div>
          
          {/* Brillitos en la esquina inferior derecha */}
          <div className="absolute bottom-4 right-6 flex space-x-2">
            <span className="text-2xl">✨</span>
            <span className="text-xl">✨</span>
          </div>
        </div>
      </div>

      {/* Floating Buttons - duplicados de la pantalla principal */}
      <div className="fixed bottom-8 left-0 right-0 z-50">
        <div className="flex items-end justify-center relative">
          
          {/* Botón de Ver Tareas (izquierda) */}
          <button
            onClick={() => navigate('/')}
            className="absolute bottom-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 transform bg-black shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1"
            style={{ left: 'calc(50% - 120px)' }}
          >
            <Check size={20} className="text-white" strokeWidth={3} />
          </button>

          {/* Botón Principal de Crear Tarea (centro) */}
          <button
            onClick={() => navigate('/')}
            className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 hover:-translate-y-2 -translate-y-2"
          >
            <Plus size={32} className="text-white sm:w-10 sm:h-10" strokeWidth={3} />
          </button>

          {/* Botón de Estadísticas (derecha) - activo */}
          <button
            className="absolute bottom-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 transform bg-black shadow-2xl scale-110"
            style={{ right: 'calc(50% - 120px)' }}
          >
            <BarChart3 size={18} className="text-white" strokeWidth={2.5} />
          </button>

        </div>
      </div>
    </div>
  );
};

export default Stats;