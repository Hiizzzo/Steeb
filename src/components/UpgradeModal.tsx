import React, { useState } from 'react';
import { X, Crown, Sparkles, Lock, ShoppingCart, CreditCard } from 'lucide-react';
import { UserRole, ROLE_PRICES } from '@/types/user';
import { useUserRole } from '@/hooks/useUserRole';
import { useThemeWithPermissions } from '@/hooks/useThemeWithPermissions';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgradeType: 'dark' | 'shiny' | 'shinyRoll';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, upgradeType }) => {
  const { userProfile, buyShinyRoll, updateUserRole } = useUserRole();
  const { useShinyRoll } = useThemeWithPermissions();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const getUpgradeInfo = () => {
    switch (upgradeType) {
      case 'dark':
        return {
          title: 'Upgrade a Usuario Dark',
          description: 'Desbloquea el modo oscuro y acceso a compras de tiradas shiny',
          price: ROLE_PRICES.UPGRADE_TO_DARK,
          icon: <div className="w-8 h-8 bg-gray-800 rounded-full" />,
          benefits: [
            'Acceso a modo White y Dark',
            'Poder comprar tiradas Shiny',
            'Interfaz mejorada en modo oscuro'
          ]
        };
      case 'shiny':
        return {
          title: 'Upgrade a Usuario Shiny',
          description: 'Acceso completo a todos los modos y funciones premium',
          price: ROLE_PRICES.UPGRADE_TO_SHINY,
          icon: <Crown className="w-8 h-8 text-purple-500" />,
          benefits: [
            'Acceso a todos los modos (White, Dark, Shiny)',
            'Tiradas Shiny ilimitadas',
            'Funciones exclusivas futuras',
            'Badge de usuario premium'
          ]
        };
      case 'shinyRoll':
        return {
          title: 'Comprar Tirada Shiny',
          description: 'Activa el modo Shiny por tiempo limitado (1 hora)',
          price: ROLE_PRICES.SHINY_ROLL,
          icon: <Sparkles className="w-8 h-8 text-purple-500" />,
          benefits: [
            'Modo Shiny por 1 hora',
            'Todos los colores y efectos',
            'Experiencia premium temporal'
          ]
        };
      default:
        return null;
    }
  };

  const handlePurchase = async () => {
    setIsProcessing(true);

    try {
      // Aquí iría la integración real con Mercado Pago
      // Por ahora, simulamos el proceso

      if (upgradeType === 'shinyRoll') {
        await buyShinyRoll();
        await useShinyRoll();
        onClose();
      } else if (upgradeType === 'dark' && userProfile?.role === 'white') {
        await updateUserRole('dark');
        onClose();
      } else if (upgradeType === 'shiny') {
        await updateUserRole('shiny');
        onClose();
      }

      // Mostrar mensaje de éxito
      alert(`¡${upgradeType === 'shinyRoll' ? 'Tirada Shiny comprada' : 'Upgrade realizado'} con éxito!`);
    } catch (error) {
      console.error('Error en la compra:', error);
      alert('Error al procesar la compra. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const upgradeInfo = getUpgradeInfo();
  if (!upgradeInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {upgradeInfo.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icono principal */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
              {upgradeInfo.icon}
            </div>
          </div>

          {/* Descripción */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {upgradeInfo.description}
          </p>

          {/* Beneficios */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Beneficios incluidos:
            </h3>
            <ul className="space-y-2">
              {upgradeInfo.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Precio */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Precio:
              </span>
              <span className="text-2xl font-bold text-green-600">
                ${upgradeInfo.price}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Pagá seguro con Mercado Pago
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Métodos de pago:
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Tarjeta</span>
              </div>
              <div className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <ShoppingCart className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Mercado Pago</span>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </span>
              ) : (
                'Comprar ahora'
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>

          {/* Información de seguridad */}
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            <Lock className="w-3 h-3 inline mr-1" />
            Compra segura con encriptación SSL
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;