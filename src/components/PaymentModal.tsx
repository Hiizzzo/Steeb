import React from 'react';
import { X, Coins, Crown, Sparkles } from 'lucide-react';
import { useUserCredits } from '../hooks/useUserCredits';
import { useTheme } from '../hooks/useTheme';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { userCredits, buyDarkVersion, canBuyDarkVersion, DARK_VERSION_COST } = useUserCredits();
  const { theme } = useTheme();

  if (!isOpen) return null;

  const handlePurchase = () => {
    if (buyDarkVersion()) {
      onClose();
    }
  };



  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-md rounded-2xl p-6 ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } shadow-2xl`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={20} />
        </button>


        <div className="text-center">
            <div className="flex justify-center mb-4">
              <Crown className="w-12 h-12 text-black dark:text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              Versión <span className="font-bold text-black dark:text-white">DARK</span>
              <Sparkles className="w-6 h-6 text-black dark:text-white" />
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Desbloquea el juego exclusivo de adivinanza con STEEB
            </p>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-6 border border-gray-300 dark:border-gray-600">
              <h3 className="font-bold mb-2">¿Qué incluye?</h3>
              <ul className="text-sm space-y-1 text-left">
                <li>• Acceso al juego de adivinanza con STEEB</li>
                <li>• Tema dark exclusivo</li>
                <li>• 1 intento gratis incluido</li>
                <li>• Experiencia premium</li>
              </ul>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-black dark:text-white mb-2">{DARK_VERSION_COST} créditos</div>
              <div className="text-sm text-gray-500">
                Créditos disponibles: <span className="font-bold">{userCredits.credits}</span>
              </div>
            </div>

            <button
              onClick={handlePurchase}
              disabled={!canBuyDarkVersion()}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                canBuyDarkVersion()
                  ? 'bg-black dark:bg-white text-white dark:text-black hover:scale-105 shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canBuyDarkVersion() ? 'Desbloquear Versión DARK' : 'Créditos insuficientes'}
            </button>

            {!canBuyDarkVersion() && (
              <p className="text-sm text-red-500 mt-2">
                Necesitas {DARK_VERSION_COST - userCredits.credits} créditos más
              </p>
            )}
        </div>
      </div>
    </div>
  );
};