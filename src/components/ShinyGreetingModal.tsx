import React, { useEffect, useState } from 'react';
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
          <div className="flex items-start gap-3">
            <img 
              src="/lovable-uploads/STEBETRISTE.png" 
              alt="Stebe Triste" 
              className="w-24 h-24"
            />
            <div className="flex-1">
              <DialogTitle className="text-2xl font-extrabold">¡GANÁ SHINY!</DialogTitle>
              <DialogDescription className="text-base text-black/80 dark:text-white/80">
                Hola, soy Stebe. Si adivinás el número que estoy pensando del 1 al 100,
                desbloqueás la versión Shiny. Tenés 1 intento por partida.
              </DialogDescription>
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


