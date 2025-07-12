import React, { useState, useEffect } from 'react';
import { Medal, Sparkles } from 'lucide-react';
import FloatingButtons from '../components/FloatingButtons';
import ModalAddTask from '../components/ModalAddTask';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'meditation';
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
}

const StatsNew = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTasks, setShowTasks] = useState(false);

  // Cargar tareas desde localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('stebe-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Calcular estadísticas según el período seleccionado
  const getPeriodStats = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    if (selectedPeriod === 'week') {
      // Inicio de la semana (lunes)
      startDate.setDate(now.getDate() - now.getDay() + 1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (selectedPeriod === 'month') {
      // Inicio del mes
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      // Fin del mes
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (selectedPeriod === 'year') {
      // Inicio del año
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      
      // Fin del año
      endDate = new Date(now.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
    }

    const periodTasks = tasks.filter(task => {
      if (!task.completedDate) return false;
      const completedDate = new Date(task.completedDate);
      return completedDate >= startDate && completedDate <= endDate;
    });

    const totalPeriodTasks = tasks.filter(task => {
      if (!task.scheduledDate) return false;
      const scheduledDate = new Date(task.scheduledDate);
      return scheduledDate >= startDate && scheduledDate <= endDate;
    });

    const completedCount = periodTasks.length;
    const totalCount = Math.max(totalPeriodTasks.length, completedCount);
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      completed: completedCount,
      total: totalCount,
      percentage
    };
  };

  // Calcular tareas por período
  const getPeriodDistribution = () => {
    const now = new Date();
    
    if (selectedPeriod === 'week') {
      // Tareas por día de la semana
      const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      
      return days.map((day, index) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + index);
        
        const dayTasks = tasks.filter(task => {
          if (!task.completedDate) return false;
          const completedDate = new Date(task.completedDate);
          return completedDate.toDateString() === dayDate.toDateString();
        });
        
        return {
          label: day,
          count: dayTasks.length,
          isToday: dayDate.toDateString() === now.toDateString()
        };
      });
    } else if (selectedPeriod === 'month') {
      // Tareas por semana del mes
      const weeks = [];
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      let weekStart = new Date(startOfMonth);
      let weekNumber = 1;
      
      while (weekStart <= endOfMonth) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekTasks = tasks.filter(task => {
          if (!task.completedDate) return false;
          const completedDate = new Date(task.completedDate);
          return completedDate >= weekStart && completedDate <= weekEnd;
        });
        
        weeks.push({
          label: `S${weekNumber}`,
          count: weekTasks.length,
          isToday: now >= weekStart && now <= weekEnd
        });
        
        weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() + 1);
        weekNumber++;
      }
      
      return weeks;
    } else {
      // Tareas por mes del año
      const months = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      
      return months.map((month, index) => {
        const monthTasks = tasks.filter(task => {
          if (!task.completedDate) return false;
          const completedDate = new Date(task.completedDate);
          return completedDate.getFullYear() === now.getFullYear() && 
                 completedDate.getMonth() === index;
        });
        
        return {
          label: month,
          count: monthTasks.length,
          isToday: now.getMonth() === index
        };
      });
    }
  };

  const periodStats = getPeriodStats();
  const distributionStats = getPeriodDistribution();
  const maxDistributionCount = Math.max(...distributionStats.map(d => d.count), 1);

  // Gráfico circular (donut chart)
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 45;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

    return (
      <div className="relative w-24 h-24">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Círculo de fondo */}
          <circle
            stroke="#f3f4f6"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Círculo de progreso */}
          <circle
            stroke="#16a34a"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-black">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Botones de período */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => setSelectedPeriod('week')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            selectedPeriod === 'week'
              ? 'bg-black text-white'
              : 'bg-white text-black border-2 border-black'
          }`}
        >
          Semana
        </button>
        <button
          onClick={() => setSelectedPeriod('month')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            selectedPeriod === 'month'
              ? 'bg-black text-white'
              : 'bg-white text-black border-2 border-black'
          }`}
        >
          Mes
        </button>
        <button
          onClick={() => setSelectedPeriod('year')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            selectedPeriod === 'year'
              ? 'bg-black text-white'
              : 'bg-white text-black border-2 border-black'
          }`}
        >
          Año
        </button>
      </div>

      {/* Tarjeta principal */}
      <div className="bg-white rounded-3xl shadow-sm mx-auto max-w-md mb-8 relative overflow-hidden">
        {/* Líneas de cuaderno sutiles */}
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="border-b border-gray-300" style={{ marginTop: `${i * 30}px` }}></div>
          ))}
        </div>
        
        <div className="relative p-6">
          {/* Encabezado con medalla y avatar */}
          <div className="flex items-start mb-6">
            <div className="relative mr-4">
              {/* Medalla */}
              <div className="w-16 h-16 rounded-full border-4 border-black bg-white flex items-center justify-center">
                <Medal className="w-8 h-8 text-black" strokeWidth={1.5} />
              </div>
              {/* Avatar dentro de la medalla */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <img 
                  src="/lovable-uploads/f3695274-590c-4838-b4b4-f6e21b194eef.png" 
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-black leading-tight">
                Tu progreso<br />
                {selectedPeriod === 'week' ? 'esta semana' : 
                 selectedPeriod === 'month' ? 'este mes' : 
                 'este año'}
              </h1>
            </div>
          </div>

          {/* Bloque de progreso semanal */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-4xl font-bold text-black mb-1">
                {periodStats.completed}
              </div>
              <div className="text-sm text-black">
                tareas completadas<br />
                {selectedPeriod === 'week' ? 'esta semana' : 
                 selectedPeriod === 'month' ? 'este mes' : 
                 'este año'}
              </div>
            </div>
            <div className="ml-4">
              <CircularProgress percentage={periodStats.percentage} />
            </div>
          </div>

          {/* Tareas por período */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black mb-4">
              Tareas por {selectedPeriod === 'week' ? 'día' : 
                          selectedPeriod === 'month' ? 'semana' : 
                          'mes'}
            </h3>
            <div className="flex items-end justify-between space-x-2">
              {distributionStats.map((stat, index) => {
                const height = Math.max((stat.count / maxDistributionCount) * 60, 12);
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className={`w-8 border-2 border-black mb-2 ${
                        stat.isToday ? 'bg-green-500' : 'bg-white'
                      }`}
                      style={{ height: `${height}px` }}
                    ></div>
                    <span className="text-sm font-medium text-black">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progreso general */}
          <div className="relative">
            <h3 className="text-lg font-semibold text-black mb-4">
              Progreso {selectedPeriod === 'week' ? 'semanal' : 
                       selectedPeriod === 'month' ? 'mensual' : 
                       'anual'}
            </h3>
            
            {/* Gráfico de línea ascendente */}
            <div className="relative h-16 mb-4">
              <svg width="100%" height="100%" className="overflow-visible">
                {/* Puntos y líneas del gráfico */}
                <circle cx="20" cy="50" r="3" fill="black" />
                <circle cx="60" cy="40" r="3" fill="black" />
                <circle cx="100" cy="35" r="3" fill="black" />
                <circle cx="140" cy="30" r="3" fill="black" />
                <circle cx="180" cy="20" r="3" fill="black" />
                
                {/* Líneas conectoras */}
                <line x1="20" y1="50" x2="60" y2="40" stroke="black" strokeWidth="2" />
                <line x1="60" y1="40" x2="100" y2="35" stroke="black" strokeWidth="2" />
                <line x1="100" y1="35" x2="140" y2="30" stroke="black" strokeWidth="2" />
                <line x1="140" y1="30" x2="180" y2="20" stroke="black" strokeWidth="2" />
              </svg>
            </div>

            {/* Destellos decorativos */}
            <div className="absolute bottom-0 right-4 flex space-x-1">
              <Sparkles className="w-4 h-4 text-black" />
              <Sparkles className="w-3 h-3 text-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Botones flotantes */}
      <FloatingButtons
        onAddTask={() => setShowAddModal(true)}
        onShowTasks={() => setShowTasks(!showTasks)}
        onToggleView={() => {}}
        viewMode="tasks"
      />

      {/* Modal para agregar tarea */}
      {showAddModal && (
        <ModalAddTask
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddTask={() => {
            // Recargar tareas desde localStorage
            const savedTasks = localStorage.getItem('stebe-tasks');
            if (savedTasks) {
              setTasks(JSON.parse(savedTasks));
            }
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

export default StatsNew;