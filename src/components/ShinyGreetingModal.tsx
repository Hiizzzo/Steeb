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
    const now = new Date();
    const weekday = now.toLocaleDateString('es-ES', { weekday: 'long' });
    const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const prompts = [
      `${cap}. Día perfecto para arrancar una tarea corta y ganar momentum.`,
      `${cap}. Hagamos una cosita rápida y marcamos check.`,
      `${cap}. Elegí algo simple, 5-10 min, y avanzamos juntos.`,
      `${cap}. Empezá pequeño: una mini-tarea y después vemos la siguiente.`,
    ];
    const pick = prompts[Math.floor(Math.random() * prompts.length)];
    return `${pick} —mi panita STEEB`;
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
      <DialogContent className="max-w-md p-6 rounded-3xl">
        <DialogHeader>
          {/* Avatar + Burbuja estilo calendario */}
          <div className="flex items-start gap-3">
            {/* Avatar STEEB */}
            <img
              src="/lovable-uploads/STEBETRISTE.png"
              alt="STEEB"
              className="w-16 h-16 rounded-lg"
            />
            {/* Burbuja de diálogo */}
            <div className="relative flex-1">
              <div className="rounded-xl border border-black/15 dark:border-white/20 bg-white dark:bg-black shadow-sm px-3 py-2">
                <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-0.5">
                  STEEB
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">
                  {steebGreeting}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <input
            type="number"
            min={1}
            max={100}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={attempted}
            placeholder="Tu número (1-100)"
            className="w-full h-12 rounded-2xl border border-black dark:border-white bg-white dark:bg-black text-center text-lg"
            aria-label="Ingresar número para ganar Shiny"
          />
          {message && (
            <p className="text-center text-sm text-black/70 dark:text-white/70" aria-live="polite">{message}</p>
          )}
        </div>
        <DialogFooter className="mt-4 gap-3">
          {!attempted ? (
            <button
              onClick={handleTry}
              className="w-full h-12 rounded-2xl bg-black text-white font-semibold"
              aria-label="Probar suerte"
            >
              Probar suerte
            </button>
          ) : (
            <button
              onClick={() => onOpenChange(false)}
              className="w-full h-12 rounded-xl border border-black dark:border-white font-semibold"
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


