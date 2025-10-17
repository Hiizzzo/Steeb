import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';

interface StebeHeaderProps {
  pendingCount?: number;
}

const StebeHeader: React.FC<StebeHeaderProps> = ({ pendingCount }) => {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Obtener fecha actual en español
  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[today.getDay()];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="bg-transparent mb-2 mt-16">
      <div className="flex items-center justify-between py-2 bg-black text-white px-4">
        <div className="flex items-center">
          <div className="h-5 w-1.5 rounded-r mr-2" style={{ backgroundColor: 'var(--accent-color)' }}></div>
          <h1 className="text-white text-xl font-light tracking-wide" style={{
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>TAREAS</h1>
        </div>
        
        {/* Información del usuario y logout */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.nickname || 'Usuario'}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
              )}
              <span className="text-white text-sm font-medium hidden sm:block">
                {user.nickname || user.name || user.email}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default StebeHeader;