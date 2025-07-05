import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Medal, BarChart3, TrendingUp } from 'lucide-react';
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
  
  // Datos simulados para la demostración
  const weeklyProgress = 75;
  const tasksThisWeek = 45;
  
  // Datos para el gráfico de barras semanal (L M X J V S D)
  const weeklyData = [
    { day: 'L', tasks: 3 },
    { day: 'M', tasks: 5 },
    { day: 'X', tasks: 7 },
    { day: 'J', tasks: 8 },
    { day: 'V', tasks: 12 },
    { day: 'S', tasks: 6 },
    { day: 'D', tasks: 4 }
  ];

  const maxWeeklyTasks = Math.max(...weeklyData.map(d => d.tasks));

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
    <div className="h-screen bg-white overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="p-2"
          >
            <ArrowLeft size={20} className="text-black" />
          </Button>
          <h1 className="text-xl font-bold text-black">Estadísticas</h1>
        </div>
      </div>

      <div className="p-3 h-full overflow-hidden">
        {/* Progreso Semanal */}
        <Card className="border border-gray-300 rounded-xl p-4 bg-white mb-3">
          {/* Espacio para el icono de Steve */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <Medal size={24} className="text-white" />
            </div>
          </div>
          
          {/* Título principal más grande */}
          <div className="text-center mb-3">
            <h2 className="text-xl font-bold text-black mb-2">Tu progreso esta semana</h2>
          </div>
          
          {/* Layout con progreso al costado */}
          <div className="flex items-center justify-between">
            {/* Texto de tareas más grande */}
            <div className="flex-1">
              <div className="text-2xl font-bold text-black mb-1">
                {tasksThisWeek} tareas
              </div>
              <div className="text-sm text-gray-600">
                completadas esta semana
              </div>
            </div>
            
            {/* Círculo de progreso al costado - más pequeño */}
            <div className="flex-shrink-0 ml-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 120 120">
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
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 - (weeklyProgress / 100) * 2 * Math.PI * 50}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-black">
                      {Math.round(weeklyProgress)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Grid con las otras dos secciones */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Tareas por Día */}
          <Card className="border border-gray-300 rounded-xl p-3 bg-white">
            <div className="flex items-center space-x-1 mb-2">
              <BarChart3 size={16} className="text-black" />
              <h2 className="text-sm font-bold text-black">Tareas por día</h2>
            </div>
            
            <div className="flex items-end justify-between space-x-1 h-16 mb-1">
              {weeklyData.map((data, index) => (
                <div key={data.day} className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-full rounded-t ${
                      index === 4 ? 'bg-green-500' : 'bg-gray-300'
                    } transition-all duration-500`}
                    style={{ 
                      height: `${(data.tasks / maxWeeklyTasks) * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
              {weeklyData.map((data) => (
                <div key={data.day} className="text-center flex-1">
                  {data.day}
                </div>
              ))}
            </div>
          </Card>

          {/* Progreso Mensual */}
          <Card className="border border-gray-300 rounded-xl p-3 bg-white">
            <div className="flex items-center space-x-1 mb-2">
              <TrendingUp size={16} className="text-black" />
              <h2 className="text-sm font-bold text-black">Progreso mensual</h2>
            </div>
            
            <div className="relative h-12 mb-2">
              <svg className="w-full h-full" viewBox="0 0 300 40">
                {/* Línea de progreso */}
                <polyline
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2"
                  points="20,30 60,25 100,22 140,20 180,15 220,12 260,17"
                  className="drop-shadow-sm"
                />
                {/* Puntos */}
                <circle cx="20" cy="30" r="2" fill="#000000" />
                <circle cx="60" cy="25" r="2" fill="#000000" />
                <circle cx="100" cy="22" r="2" fill="#000000" />
                <circle cx="140" cy="20" r="2" fill="#000000" />
                <circle cx="180" cy="15" r="2" fill="#000000" />
                <circle cx="220" cy="12" r="2" fill="#000000" />
                <circle cx="260" cy="17" r="2" fill="#000000" />
              </svg>
              
              {/* Estrellas decorativas */}
              <div className="absolute top-0 right-4">
                <div className="text-yellow-400 text-xs">✨</div>
              </div>
              <div className="absolute bottom-1 right-2">
                <div className="text-yellow-400 text-xs">✨</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Resumen */}
        <Card className="border border-gray-300 rounded-xl p-3 bg-white">
          <h2 className="text-sm font-bold text-black mb-2">Resumen</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-xs text-gray-600">Total completadas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{tasks.length}</div>
              <div className="text-xs text-gray-600">Total de tareas</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Stats;