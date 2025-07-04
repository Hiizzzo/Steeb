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
  subtasks?: Task[];
}

const Stats = () => {
  const navigate = useNavigate();
  
  // Obtener tareas del localStorage
  const getTasks = (): Task[] => {
    const savedTasks = localStorage.getItem('stebe-tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  };

  const tasks = getTasks();
  
  // Función para obtener todas las tareas (incluyendo subtareas) completadas
  const getAllCompletedTasks = (taskList: Task[]): Task[] => {
    let allCompleted: Task[] = [];
    taskList.forEach(task => {
      if (task.completed) {
        allCompleted.push(task);
      }
      if (task.subtasks) {
        allCompleted = allCompleted.concat(getAllCompletedTasks(task.subtasks));
      }
    });
    return allCompleted;
  };

  const allCompletedTasks = getAllCompletedTasks(tasks);
  
  // Calcular estadísticas semanales reales
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Lunes de esta semana
  
  const tasksThisWeek = allCompletedTasks.filter(task => {
    if (!task.completedDate) return false;
    const taskDate = new Date(task.completedDate);
    return taskDate >= weekStart && taskDate <= today;
  }).length;

  const weeklyProgress = Math.min((tasksThisWeek / Math.max(tasks.length, 1)) * 100, 100);
  
  // Datos reales para el gráfico de barras semanal (L M X J V S D)
  const getTasksForDay = (dayOffset: number) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayOffset);
    return allCompletedTasks.filter(task => {
      if (!task.completedDate) return false;
      const taskDate = new Date(task.completedDate);
      return taskDate.toDateString() === day.toDateString();
    }).length;
  };

  const weeklyData = [
    { day: 'L', tasks: getTasksForDay(0), dayIndex: 0 },
    { day: 'M', tasks: getTasksForDay(1), dayIndex: 1 },
    { day: 'X', tasks: getTasksForDay(2), dayIndex: 2 },
    { day: 'J', tasks: getTasksForDay(3), dayIndex: 3 },
    { day: 'V', tasks: getTasksForDay(4), dayIndex: 4 },
    { day: 'S', tasks: getTasksForDay(5), dayIndex: 5 },
    { day: 'D', tasks: getTasksForDay(6), dayIndex: 6 }
  ];

  const maxWeeklyTasks = Math.max(...weeklyData.map(d => d.tasks), 1);
  const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convertir domingo=0 a sábado=6
  
  // Datos para progreso mensual (últimos 7 puntos del mes)
  const monthlyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i * 4); // Cada 4 días
    const tasksUntilDate = allCompletedTasks.filter(task => {
      if (!task.completedDate) return false;
      return new Date(task.completedDate) <= date;
    }).length;
    monthlyData.push(tasksUntilDate);
  }

  // Componente del círculo de progreso exacto como la imagen
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative w-24 h-24 mx-auto">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#22c55e"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xl font-bold text-black">
            {Math.round(percentage)}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="bg-white px-4 py-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="p-2"
          >
            <ArrowLeft size={20} className="text-black" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Tarjeta principal idéntica a la imagen */}
        <Card className="border-4 border-green-800 rounded-3xl p-8 bg-white max-w-sm mx-auto">
          {/* Header con medalla */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-green-800 rounded-full flex items-center justify-center">
              <Medal size={24} className="text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-green-800 text-center mb-8">
            Tu progreso<br />esta semana
          </h1>
          
          {/* Número de tareas */}
          <div className="text-center mb-2">
            <div className="text-4xl font-bold text-green-800">
              {tasksThisWeek} tareas
            </div>
            <div className="text-lg text-green-800 mb-6">
              completadas<br />esta semana
            </div>
          </div>
          
          {/* Círculo de progreso */}
          <div className="flex items-center justify-center mb-8">
            <CircularProgress percentage={weeklyProgress} />
          </div>
          
          {/* Tareas por día */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-green-800 mb-4">Tareas por día</h2>
            
            <div className="flex items-end justify-between space-x-1 h-20 mb-3">
              {weeklyData.map((data, index) => (
                <div key={data.day} className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-full rounded ${
                      data.dayIndex === todayDayIndex ? 'bg-green-600' : 'bg-gray-300'
                    } border-2 border-green-800`}
                    style={{ 
                      height: `${Math.max((data.tasks / Math.max(maxWeeklyTasks, 1)) * 100, 10)}%`,
                      minHeight: '10px'
                    }}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-between text-green-800 font-medium">
              {weeklyData.map((data) => (
                <div key={data.day} className="text-center flex-1">
                  {data.day}
                </div>
              ))}
            </div>
          </div>
          
          {/* Progreso mensual */}
          <div>
            <h2 className="text-xl font-bold text-green-800 mb-4">Progreso mensual</h2>
            
            <div className="relative h-16 mb-4">
              <svg className="w-full h-full" viewBox="0 0 280 60">
                {/* Línea de progreso con datos reales */}
                <polyline
                  fill="none"
                  stroke="#166534"
                  strokeWidth="3"
                  points={monthlyData.map((tasks, index) => {
                    const x = 20 + (index * 40);
                    const y = 50 - Math.min((tasks / Math.max(...monthlyData, 1)) * 30, 30);
                    return `${x},${y}`;
                  }).join(' ')}
                />
                {/* Puntos */}
                {monthlyData.map((tasks, index) => {
                  const x = 20 + (index * 40);
                  const y = 50 - Math.min((tasks / Math.max(...monthlyData, 1)) * 30, 30);
                  return <circle key={index} cx={x} cy={y} r="3" fill="#166534" />;
                })}
              </svg>
              
              {/* Estrellas decorativas */}
              <div className="absolute top-0 right-4">
                <div className="text-yellow-400 text-2xl">✨</div>
              </div>
              <div className="absolute bottom-2 right-8">
                <div className="text-yellow-400 text-lg">✨</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Stats;