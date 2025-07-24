import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, CheckCircle, Calendar, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

interface MonthlyCalendarProps {
  tasks?: Task[];
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ tasks = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  // Funciones para navegación del calendario
  const goToPreviousMonth = () => {
    setIsAnimating(true);
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToNextMonth = () => {
    setIsAnimating(true);
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Obtener información del mes actual
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthName = monthNames[month];

  // Generar días del calendario
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Ajustar para que lunes sea 0, domingo sea 6
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    // Días del mes anterior
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      
      days.push({
        day,
        isCurrentMonth: true,
        isToday,
        isSelected
      });
    }

    // Días del mes siguiente
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }

    return days;
  };

  // Calcular progreso de tareas para un día específico
  const getTaskProgress = (day: number) => {
    const dateString = new Date(year, month, day).toISOString().split('T')[0];
    const dayTasks = tasks.filter(task => task.date === dateString);
    
    if (dayTasks.length === 0) return 0;
    
    const completedTasks = dayTasks.filter(task => task.completed).length;
    return completedTasks / dayTasks.length;
  };

  // Obtener información detallada de tareas para tooltip
  const getTaskInfo = (day: number) => {
    const dateString = new Date(year, month, day).toISOString().split('T')[0];
    const dayTasks = tasks.filter(task => task.date === dateString);
    
    if (dayTasks.length === 0) return { total: 0, completed: 0 };
    
    const completedTasks = dayTasks.filter(task => task.completed).length;
    return { total: dayTasks.length, completed: completedTasks };
  };

  // Obtener clase de color para la barra de progreso
  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress <= 0.25) return 'bg-gray-300';
    if (progress <= 0.5) return 'bg-gray-400';
    if (progress <= 0.75) return 'bg-gray-600';
    return 'bg-gray-800';
  };

  // Función para manejar clic en día
  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    
    // Guardar la fecha seleccionada en localStorage para que la app principal la use
    const dateString = clickedDate.toISOString().split('T')[0];
    localStorage.setItem('stebe-selected-date', dateString);
    
    // Navegar a la página principal para usar el modal existente
    navigate('/');
  };

  // Estadísticas mock (en una implementación real vendrían de props o contexto)
  const stats = {
    streakDays: 0,
    completedTasks: 0,
    activeDays: 0,
    bestStreak: 0
  };

  const calendarDays = generateCalendarDays();
  const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto space-y-8">
        
        {/* Frase motivacional */}
        <motion.div 
          className="text-center pt-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-bold text-black leading-tight">
            Hoy es un gran día para tachar pendientes
          </h1>
        </motion.div>

        {/* Tarjetas de estadísticas */}
        <motion.div 
          className="grid grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <Flame className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <div className="text-lg font-semibold text-black">{stats.streakDays}</div>
            <div className="text-xs text-gray-500">días de racha</div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <div className="text-lg font-semibold text-black">{stats.completedTasks}</div>
            <div className="text-xs text-gray-500">tareas tachadas</div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <div className="text-lg font-semibold text-black">{stats.activeDays}</div>
            <div className="text-xs text-gray-500">Días activos</div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <Trophy className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <div className="text-lg font-semibold text-black">{stats.bestStreak}</div>
            <div className="text-xs text-gray-500">Mejor racha</div>
          </motion.div>
        </motion.div>

        {/* Calendario mensual */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          {/* Navegación del mes */}
          <motion.div 
            className="flex items-center justify-between mb-6"
            animate={{ scale: isAnimating ? 0.95 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </motion.button>
            
            <motion.div 
              className="text-center"
              key={`${monthName}-${year}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xl font-bold text-black">{monthName} {year}</div>
              <div className="text-sm text-gray-500 lowercase">
                {monthName.slice(0, 3)} {year}
              </div>
            </motion.div>
            
            <motion.button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-5 h-5 text-black" />
            </motion.button>
          </motion.div>

          {/* Días de la semana */}
          <motion.div 
            className="grid grid-cols-7 gap-1 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-black py-2">
                {day}
              </div>
            ))}
          </motion.div>

          {/* Cuadrícula del calendario */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${monthName}-${year}`}
              className="grid grid-cols-7 gap-1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {calendarDays.map((day, index) => {
                const progress = day.isCurrentMonth ? getTaskProgress(day.day) : 0;
                const progressColor = getProgressColor(progress);
                const taskInfo = getTaskInfo(day.day);
                const isToday = day.isToday;
                
                return (
                  <motion.div
                    key={`${monthName}-${year}-${index}`}
                    onClick={() => {
                      if (day.isCurrentMonth) {
                        handleDayClick(day.day);
                      }
                    }}
                    className={`
                      aspect-square p-1 cursor-pointer relative group
                      ${day.isCurrentMonth ? 'hover:bg-gray-50' : ''}
                      ${day.isSelected ? 'border-2 border-black rounded-lg' : ''}
                    `}
                    whileHover={{ scale: day.isCurrentMonth ? 1.05 : 1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={day.isSelected ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="h-full flex flex-col items-center justify-center">
                      <motion.div 
                        className={`
                          text-sm font-medium mb-1 relative
                          ${day.isCurrentMonth ? 'text-black' : 'text-gray-400'}
                          ${isToday ? 'animate-pulse' : ''}
                        `}
                        animate={isToday ? { 
                          boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 10px rgba(0,0,0,0.3)', '0 0 0 rgba(0,0,0,0)'] 
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {day.day}
                      </motion.div>
                      
                      {/* Barra de progreso */}
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${progressColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Tooltip */}
                    {day.isCurrentMonth && taskInfo.total > 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {taskInfo.completed} de {taskInfo.total} tareas completadas
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Leyenda de intensidad */}
        <motion.div 
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="flex justify-center items-center space-x-1"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            {[200, 300, 400, 600, 800].map((shade, index) => (
              <motion.div
                key={shade}
                className={`w-3 h-3 bg-gray-${shade} rounded-sm`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
              />
            ))}
          </motion.div>
          <div className="flex justify-between text-xs text-gray-500 px-4">
            <span>Menos</span>
            <span>Más</span>
          </div>
        </motion.div>

        {/* Fecha seleccionada */}
        <motion.div 
          className="text-center pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
        >
          <motion.div 
            className="text-sm text-gray-600"
            key={selectedDate.toDateString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            })}
          </motion.div>
        </motion.div>



      </div>
    </div>
  );
};

export default MonthlyCalendar; 