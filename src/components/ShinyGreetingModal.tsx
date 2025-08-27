import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type ShinyGreetingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin: () => void;
};

const ShinyGreetingModal: React.FC<ShinyGreetingModalProps> = ({ open, onOpenChange, onWin }) => {
  const [secret, setSecret] = useState<number>(Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState<string>('');
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState<string>('');

  const steebGreeting = useMemo(() => {
    // Modo "STEEB asustado": mensaje ansioso sobre adivinar el número
    return 'Qué ansiedad me daría que adivines el número que estoy pensando del 1 al 100 para desbloquear la versión Shiny.';
  }, [open]);

  useEffect(() => {
    if (open) {
      setSecret(Math.floor(Math.random() * 100) + 1);
      setGuess('');
      setAttempted(false);
      setMessage('');
    }
  }, [open]);

  const handleTry = () => {
    if (attempted) return;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl p-5 sm:p-6 pt-8 pr-8 sm:pt-8 sm:pr-8 w-[88vw] max-w-[340px] sm:max-w-md">
        <DialogHeader>
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
              <div className="rounded-xl border border-black/15 dark:border-white/20 bg-white dark:bg-black shadow-sm px-3 py-2">
                <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-0.5">
                  STEEB
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug" aria-live="polite">
                  {message ? message : steebGreeting}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>
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
          {/* El mensaje de resultado ahora se muestra dentro de la burbuja de STEEB */}
        </div>
        <DialogFooter className="mt-2 gap-2">
          {!attempted ? (
            <button
              onClick={handleTry}
              className="w-full h-11 rounded-2xl bg-black text-white font-semibold text-base"
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
      </DialogContent>
    </Dialog>
  );
};

export default ShinyGreetingModal;


