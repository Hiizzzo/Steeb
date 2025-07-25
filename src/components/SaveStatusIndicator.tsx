import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface SaveStatusIndicatorProps {
  lastSaved: Date | null;
  isLoading?: boolean;
  hasError?: boolean;
  className?: string;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  lastSaved,
  isLoading = false,
  hasError = false,
  className = ""
}) => {
  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Sin guardar';
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Guardado ahora';
    if (diffInMinutes < 60) return `Guardado hace ${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Guardado hace ${diffInHours}h`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = () => {
    if (hasError) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        text: 'Error al guardar',
        pulse: true
      };
    }
    
    if (isLoading) {
      return {
        icon: Clock,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        text: 'Guardando...',
        pulse: true
      };
    }
    
    if (lastSaved) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        text: formatLastSaved(lastSaved),
        pulse: false
      };
    }
    
    return {
      icon: WifiOff,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      text: 'No conectado',
      pulse: false
    };
  };

  const { icon: Icon, color, bgColor, borderColor, text, pulse } = getStatusConfig();

  return (
    <AnimatePresence>
      <motion.div
        className={`
          inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium
          ${bgColor} ${borderColor} ${color} ${className}
        `}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          ...(pulse && {
            scale: [1, 1.05, 1],
            transition: { 
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.2 },
              y: { duration: 0.2 }
            }
          })
        }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          animate={pulse ? { rotate: 360 } : {}}
          transition={pulse ? { 
            duration: 2, 
            repeat: Infinity, 
            ease: "linear" 
          } : {}}
        >
          <Icon className="w-3 h-3" />
        </motion.div>
        <span>{text}</span>
        
        {/* Indicador de conectividad */}
        <motion.div
          className="flex space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {navigator.onLine ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SaveStatusIndicator;