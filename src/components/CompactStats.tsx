import React from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle, Calendar, Trophy } from 'lucide-react';

interface CompactStatsProps {
  stats: {
    streakDays: number;
    completedTasks: number;
    activeDays: number;
    bestStreak: number;
  };
  className?: string;
}

const CompactStats: React.FC<CompactStatsProps> = ({ stats, className = "" }) => {
  return (
    <motion.div 
      className={`grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 px-1 sm:px-2 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
    >
      <motion.div 
        className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2 sm:p-4 text-center cursor-pointer min-h-[60px] sm:min-h-[80px] flex flex-col justify-center"
        whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
        transition={{ duration: 0.2 }}
      >
        <Flame className="w-3 h-3 sm:w-5 sm:h-5 mx-auto mb-1 text-orange-500" />
        <div className="text-sm sm:text-lg font-semibold text-black">{stats.streakDays}</div>
        <div className="text-xs text-gray-500 leading-tight">racha</div>
      </motion.div>
      
      <motion.div 
        className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2 sm:p-4 text-center cursor-pointer min-h-[60px] sm:min-h-[80px] flex flex-col justify-center"
        whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
        transition={{ duration: 0.2 }}
      >
        <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 mx-auto mb-1 text-green-500" />
        <div className="text-sm sm:text-lg font-semibold text-black">{stats.completedTasks}</div>
        <div className="text-xs text-gray-500 leading-tight">hechas</div>
      </motion.div>
      
      <motion.div 
        className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2 sm:p-4 text-center cursor-pointer min-h-[60px] sm:min-h-[80px] flex flex-col justify-center"
        whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
        transition={{ duration: 0.2 }}
      >
        <Calendar className="w-3 h-3 sm:w-5 sm:h-5 mx-auto mb-1 text-blue-500" />
        <div className="text-sm sm:text-lg font-semibold text-black">{stats.activeDays}</div>
        <div className="text-xs text-gray-500 leading-tight">activos</div>
      </motion.div>
      
      <motion.div 
        className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2 sm:p-4 text-center cursor-pointer min-h-[60px] sm:min-h-[80px] flex flex-col justify-center"
        whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
        transition={{ duration: 0.2 }}
      >
        <Trophy className="w-3 h-3 sm:w-5 sm:h-5 mx-auto mb-1 text-yellow-500" />
        <div className="text-sm sm:text-lg font-semibold text-black">{stats.bestStreak}</div>
        <div className="text-xs text-gray-500 leading-tight">mejor</div>
      </motion.div>
    </motion.div>
  );
};

export default CompactStats;