import React, { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useThemeWithPermissions } from '@/hooks/useThemeWithPermissions';
import { UserRole, ROLE_PRICES } from '@/types/user';
import { Crown, Sparkles, Lock, ShoppingCart, ChevronDown } from 'lucide-react';

interface UserRoleBadgeProps {
  onUpgradeRequest?: (type: 'dark' | 'shiny' | 'shinyRoll') => void;
}

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ onUpgradeRequest }) => {
  const { userProfile, getRoleInfo } = useUserRole();
  const { currentTheme, useShinyRoll, getAccessInfo } = useThemeWithPermissions();
  const [showUpgradeMenu, setShowUpgradeMenu] = useState(false);

  const accessInfo = getAccessInfo();
  const roleInfo = getRoleInfo();

  if (!userProfile || !accessInfo) {
    return null;
  }

  const getRoleIcon = () => {
    switch (userProfile.role) {
      case 'white':
        return '⚪';
      case 'dark':
        return '⚫';
      case 'shiny':
        return '✨';
      default:
        return '⚪';
    }
  };

  const getRoleColor = () => {
    switch (userProfile.role) {
      case 'white':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'dark':
        return 'bg-gray-800 text-white border-gray-600';
      case 'shiny':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRoleName = () => {
    switch (userProfile.role) {
      case 'white':
        return 'Usuario White';
      case 'dark':
        return 'Usuario Dark';
      case 'shiny':
        return 'Usuario Shiny';
      default:
        return 'Usuario White';
    }
  };

  return (
    <div className="relative">
      {/* Badge principal */}
      <button
        onClick={() => setShowUpgradeMenu(!showUpgradeMenu)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all hover:shadow-md ${getRoleColor()}`}
      >
        <span className="text-lg">{getRoleIcon()}</span>
        <span>{getRoleName()}</span>
        {(accessInfo.shinyRollsAvailable > 0 || accessInfo.canUpgradeToDark || accessInfo.canUpgradeToShiny) && (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Menú de upgrades */}
      {showUpgradeMenu && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Opciones de cuenta
            </h4>

            {/* Tiradas Shiny disponibles */}
            {accessInfo.shinyRollsAvailable > 0 && (
              <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      {accessInfo.shinyRollsAvailable} tiradas shiny
                    </span>
                  </div>
                </div>
                {accessInfo.isShinyActive && accessInfo.isShinyTemporary && (
                  <div className="text-xs text-yellow-700 dark:text-yellow-300">
                    Activo por: {Math.floor(accessInfo.shinyTimeRemaining / 60000)} min
                  </div>
                )}
              </div>
            )}

            {/* Opción de Dark Mode */}
            {!accessInfo.permissions.canUseDarkMode && (
              <button
                onClick={() => {
                  onUpgradeRequest?.('dark');
                  setShowUpgradeMenu(false);
                }}
                className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-800 rounded-full" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Modo Dark
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Acceso a modo oscuro
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      ${ROLE_PRICES.UPGRADE_TO_DARK}
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Comprar tiradas Shiny */}
            {accessInfo.permissions.canBuyShinyRolls && (
              <button
                onClick={() => {
                  onUpgradeRequest?.('shinyRoll');
                  setShowUpgradeMenu(false);
                }}
                className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Tirada Shiny
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Modo shiny por 1 hora
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-purple-600">
                      ${ROLE_PRICES.SHINY_ROLL}
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Upgrade a Shiny permanente */}
            {!accessInfo.permissions.canUseShinyMode && (
              <button
                onClick={() => {
                  onUpgradeRequest?.('shiny');
                  setShowUpgradeMenu(false);
                }}
                className="w-full text-left p-3 rounded-lg border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-purple-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Usuario Shiny
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Acceso a todos los modos
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-purple-600">
                      ${ROLE_PRICES.UPGRADE_TO_SHINY}
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Info de modo actual */}
            {accessInfo.isShinyActive && (
              <div className="mt-3 p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span className="text-purple-700 dark:text-purple-300">
                    Modo Shiny {accessInfo.isShinyTemporary ? 'temporal' : 'permanente'} activo
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleBadge;