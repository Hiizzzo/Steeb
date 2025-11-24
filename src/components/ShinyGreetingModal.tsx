import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUserCredits } from "../hooks/useUserCredits";
import { useAuth } from "../hooks/useAuth";
import { PaymentModal } from "./PaymentModal";
import { ShinyRollsPaymentModal } from "./ShinyRollsPaymentModal";
import { Crown } from "lucide-react";
import { playShinyGame } from "../services/steebApi";
import { toast } from "sonner";

type ShinyGreetingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWin: () => void;
};

const ShinyGreetingModal: React.FC<ShinyGreetingModalProps> = ({
  open,
  onOpenChange,
  onWin,
}) => {
  const [guess, setGuess] = useState<string>("");
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRollsPaymentModal, setShowRollsPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { userCredits } = useUserCredits();
  const { user } = useAuth();

  const steebGreeting = useMemo(() => {
    return "Qué ansiedad me daría que adivines el número que estoy pensando del 1 al 100 para desbloquear la versión Shiny.";
  }, [open]);

  useEffect(() => {
    if (open) {
      setGuess("");
      setAttempted(false);
      setMessage("");
      setIsLoading(false);
    }
  }, [open]);

  const handleTry = async () => {
    if (attempted || isLoading) return;

    // Necesita tener la versión DARK
    if (!userCredits.hasDarkVersion) {
      setShowPaymentModal(true);
      return;
    }

    const n = parseInt(guess, 10);
    if (Number.isNaN(n) || n < 1 || n > 100) {
      setMessage("Elegí un número del 1 al 100.");
      return;
    }

    setIsLoading(true);
    setMessage("Consultando a los astros...");

    try {
      const result = await playShinyGame(n, user?.id);

      if (result.success) {
        setAttempted(true);
        if (result.won) {
          setMessage(result.message);
          toast.success("¡HAS DESBLOQUEADO EL MODO SHINY!");
          setTimeout(() => {
            onWin();
            onOpenChange(false);
          }, 2000);
        } else {
          setMessage(`${result.message} El número era ${result.secret}.`);
        }
      } else {
        // Caso de error controlado (ej: límite diario)
        setMessage(result.message);
        if (result.nextAttemptIn) {
           // Podríamos formatear el tiempo aquí si quisiéramos
        }
        // Si el error es por límite diario, sugerir comprar rolls
        if (result.message.includes('límite diario') || result.message.includes('intento diario')) {
           // Opcional: Mostrar botón para comprar rolls aquí mismo en el mensaje o habilitar un botón extra
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "Hubo un error al conectar con STEEB.");
    } finally {
      setIsLoading(false);
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
            {userCredits.hasDarkVersion && (
              <div className="flex justify-center items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  VERSIÓN DARK DESBLOQUEADA
                </span>
              </div>
            )}

            <div className="flex items-start gap-3">
              <img
                src="/lovable-uploads/STEBETRISTE.png"
                alt="STEEB"
                className="w-24 h-24 sm:w-16 sm:h-16 rounded-lg mt-1.5"
              />
              <div className="relative flex-1 mt-1">
                <div className="steeb-bubble rounded-xl px-3 py-2">
                  <div className="text-xs font-bold mb-0.5">STEEB</div>
                  <p className="text-sm leading-snug" aria-live="polite">
                    {message ? (
                      message
                    ) : (
                      <span>{steebGreeting}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

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
                <p className="text-xs text-gray-500 text-center">
                  Precio por intento: $1 (máximo 1 intento por día).
                </p>
                {/* Botón para comprar más intentos si ya usó el diario */}
                <button
                  onClick={() => setShowRollsPaymentModal(true)}
                  className="text-xs text-purple-500 font-semibold hover:underline w-full text-center mt-1"
                >
                  ¿Querés más intentos? Comprá tiradas extra
                </button>
              </div>
              <DialogFooter className="mt-2 gap-2">
                {!attempted ? (
                  <button
                    onClick={handleTry}
                    disabled={isLoading}
                    className="w-full h-11 rounded-2xl font-semibold text-base bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Probar suerte"
                  >
                    {isLoading ? "Verificando..." : "Probar suerte"}
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
        </DialogContent>
      </Dialog>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
      <ShinyRollsPaymentModal
        isOpen={showRollsPaymentModal}
        onClose={() => setShowRollsPaymentModal(false)}
      />
    </>
  );
};

export default ShinyGreetingModal;

