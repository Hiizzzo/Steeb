import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { LogOut, User } from 'lucide-react';
import UserRoleBadge from './UserRoleBadge';
import UpgradeModal from './UpgradeModal';

interface StebeHeaderProps {
  pendingCount?: number;
}

const StebeHeader: React.FC<StebeHeaderProps> = ({ pendingCount }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark } = useTheme();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeType, setUpgradeType] = useState<'dark' | 'shiny' | 'shinyRoll'>('dark');

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
      <div
        className={`flex items-center justify-between py-2 px-4 ${isDark ? 'steeb-header-force-white' : ''}`}
        style={{
          backgroundColor: isDark ? '#ffffff' : '#000000',
          color: isDark ? '#000000' : '#ffffff'
        }}
      >
        <div className="flex items-center">
          <div className="h-5 w-1.5 rounded-r mr-2" style={{ backgroundColor: 'var(--accent-color)' }}></div>
          <h1
            className="text-xl font-light tracking-wide"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              color: isDark ? '#000000' : '#ffffff'
            }}
          >
            TAREAS
          </h1>
        </div>

        {/* Información del usuario y logout */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-3">
            <UserRoleBadge
              onUpgradeRequest={(type) => {
                setUpgradeType(type);
                setShowUpgradeModal(true);
              }}
            />

            <div className="flex items-center gap-2">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.nickname || 'Usuario'}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }}
                >
                  <User size={14} style={{ color: isDark ? '#000000' : '#ffffff' }} />
                </div>
              )}
              <span
                className="text-sm font-medium hidden sm:block"
                style={{ color: isDark ? '#000000' : '#ffffff' }}
              >
                {user.nickname || user.name || user.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1 rounded transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: isDark ? '#000000' : '#ffffff'
              }}
              title="Cerrar sesión"
            >
              <LogOut size={16} style={{ color: isDark ? '#000000' : '#ffffff' }} />
            </button>
          </div>
        )}

        {/* Modal de upgrades */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          upgradeType={upgradeType}
        />
      </div>
    </div>
  );
};
export default StebeHeader;