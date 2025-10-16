import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useUserCredits } from '../hooks/useUserCredits';
import { useTheme } from '../hooks/useTheme';
import { PaymentModal } from './PaymentModal';
import { Coins, Crown, Lock } from 'lucide-react';

type ShinyGreetingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin: () => void;
};

// Función para generar número verdaderamente aleatorio
const generateSecureRandomNumber = (): number => {
  // Usar crypto.getRandomValues para mayor aleatoriedad
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const randomNumber = (array[0] % 100) + 1;
    console.log('🎲 Número secreto generado:', randomNumber);
    return randomNumber;
  }
  // Fallback a Math.random() con mejor distribución
  const randomNumber = Math.floor(Math.random() * 100) + 1;
  console.log('🎲 Número secreto generado (fallback):', randomNumber);
  return randomNumber;
};

const ShinyGreetingModal: React.FC<ShinyGreetingModalProps> = ({ open, onOpenChange, onWin }) => {
  const [secret, setSecret] = useState<number>(generateSecureRandomNumber());
  const [guess, setGuess] = useState<string>('');
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const { userCredits, canPlayGame, playGame, GAME_COST } = useUserCredits();
  const { theme } = useTheme();

  const steebGreeting = useMemo(() => {
    // Modo "STEEB asustado": mensaje ansioso sobre adivinar el número
    return 'Qué ansiedad me daría que adivines el número que estoy pensando del 1 al 100 para desbloquear la versión Shiny.';
  }, [open]);

  useEffect(() => {
    if (open) {
      const newSecret = generateSecureRandomNumber();
      setSecret(newSecret);
      setGuess('');
      setAttempted(false);
      setMessage('');
    }
  }, [open]);

  const handleTry = () => {
    if (attempted) return;
    
    // Verificar si tiene versión dark
    if (!userCredits.hasDarkVersion) {
      setShowPaymentModal(true);
      return;
    }
    
    const n = parseInt(guess, 10);
    if (Number.isNaN(n) || n < 1 || n > 100) {
      setMessage('Elegí un número del 1 al 100.');
      return;
    }
    
    setAttempted(true);
    if (n === secret) {
      setMessage('¡GANASTE SHINY! 🎉');
      onWin();
      onOpenChange(false);
    } else {
      setMessage(`La próxima será. Eh pensado el ${secret}.`);
    }
  };
  
  const handleBuyDarkVersion = () => {
    setShowPaymentModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-3xl p-5 sm:p-6 pt-8 pr-8 sm:pt-8 sm:pr-8 w-[88vw] max-w-[340px] sm:max-w-md">
          <DialogHeader>
            {/* Información de versión */}
            {userCredits.hasDarkVersion && (
              <div className="flex justify-center items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">VERSIÓN DARK DESBLOQUEADA</span>
              </div>
            )}
            
            {/* Avatar + Burbuja estilo calendario */}
            <div className="flex items-start gap-3">
              {/* Avatar STEEB */}
              <img
                src="/lovable-uploads/STEBETRISTE.png"
                alt="STEEB"
                className="w-24 h-24 sm:w-16 sm:h-16 rounded-lg mt-1.5"
              />
              {/* Burbuja de diálogo */}
              <div className="relative flex-1 mt-1">
                <div className="steeb-bubble rounded-xl px-3 py-2">
                  <div className="text-xs font-bold mb-0.5">STEEB</div>
                  <p className="text-sm leading-snug" aria-live="polite">
                    {!userCredits.hasDarkVersion ? (
                      <span>
                        ¡Necesitas la versión <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">DARK</span> para jugar conmigo! 🎮
                      </span>
                    ) : message ? (
                      message.includes('SHINY') ? (
                        <span>
                          ¡GANASTE <span className="bg-gradient-to-r from-pink-400 via-pink-500 via-rose-500 via-purple-400 via-pink-600 to-pink-500 bg-clip-text text-transparent font-bold animate-bounce text-lg tracking-wider" style={{animationDuration: '0.8s'}}>SHINY</span>! 🎉
                        </span>
                      ) : message
                    ) : (
                      <span>
                        Qué ansiedad me daría que adivines el número que estoy pensando del 1 al 100.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>
          {userCredits.hasDarkVersion ? (
            <>
              <div className="mt-3 space-y-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  disabled={attempted}
                  placeholder="Tu número (1-100)"
                  className="w-full h-11 rounded-2xl border border-black dark:border-white bg-white dark:bg-black text-center text-base"
                  aria-label="Ingresar número para ganar Shiny"
                />
              </div>
              <DialogFooter className="mt-2 gap-2">
                {!attempted ? (
                  <button
                    onClick={handleTry}
                    className="w-full h-11 rounded-2xl font-semibold text-base bg-black text-white hover:bg-gray-800"
                    aria-label="Probar suerte"
                  >
                    Probar suerte
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenChange(false)}
                    className="w-full h-11 rounded-xl border border-black dark:border-white font-semibold text-base"
                    aria-label="Cerrar"
                  >
                    Cerrar
                  </button>
                )}
              </DialogFooter>
            </>
          ) : (
            <DialogFooter className="mt-4 gap-2">
              <div className="w-full space-y-3">
                <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    El juego está bloqueado
                  </p>
                  <p className="text-xs text-gray-500">
                    Desbloquea la versión DARK para acceder
                  </p>
                </div>
                <button
                  onClick={handleBuyDarkVersion}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  🔓 Desbloquear versión DARK
                </button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </>
  );
};

export default ShinyGreetingModal;


