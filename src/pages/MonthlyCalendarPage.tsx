import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MonthlyCalendar from '@/components/MonthlyCalendar';

const MonthlyCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks] = useState([
    { id: '1', title: 'Design homepage', completed: true, date: '2025-07-22' },
    { id: '2', title: 'Meeting with team', completed: true, date: '2025-07-22' },
    { id: '3', title: 'Grocery shopping', completed: false, date: '2025-07-22' },
    { id: '4', title: 'Exercise', completed: true, date: '2025-07-21' },
    { id: '5', title: 'Meditation', completed: true, date: '2025-07-21' },
    { id: '6', title: 'Read book', completed: false, date: '2025-07-20' },
    { id: '7', title: 'Call mom', completed: true, date: '2025-07-19' },
    { id: '8', title: 'Review code', completed: true, date: '2025-07-18' },
    { id: '9', title: 'Plan weekend', completed: true, date: '2025-07-18' },
  ]);

  return (
    <div className="relative">
      {/* Botón de regreso */}
      <motion.button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-30 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5 text-black" />
      </motion.button>
      
      <MonthlyCalendar tasks={tasks} />
    </div>
  );
};

export default MonthlyCalendarPage; 