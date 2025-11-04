import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useUserCredits } from "@/hooks/useUserCredits";
import { Switch } from "@/components/ui/switch";
import ShinyGreetingModal from "@/components/ShinyGreetingModal";
import { PaymentModal } from "@/components/PaymentModal";
import { Coins, Crown } from "lucide-react";

const ThemeToggle = () => {
	const { currentTheme, toggleTheme } = useTheme();
	const { userCredits } = useUserCredits();
	const [mounted, setMounted] = useState(false);
	const [showGame, setShowGame] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [shinyUnlocked, setShinyUnlocked] = useState(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('stebe-shiny-unlocked') === 'true';
		}
		return false;
	});

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	const isDark = currentTheme === "dark";
	const isShiny = currentTheme === "shiny";

	return (
		<div className="fixed top-6 right-4 z-[60] flex gap-2">
			{/* Switch normal para light/dark - al costado de STEEB */}
			<Switch
				className={`scale-125 origin-top-right [&>span]:bg-black [&>span[data-state="checked"]]:bg-black border-2 border-white [&>span[data-state="checked"]]:border-white bg-white [&>span]:border-white data-[state="checked"]:bg-white`}
				checked={isDark}
			onCheckedChange={(checked) => {
				// Cambiar directamente entre light y dark
				toggleTheme(checked ? "dark" : "light");
			}}
				aria-label="Toggle theme"
			/>

			{/* Indicador de versión DARK */}
			{userCredits.hasDarkVersion && (
				<div className="flex items-center gap-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
					<Crown className="w-4 h-4 text-purple-500" />
					<span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">DARK</span>
				</div>
			)}

			{/* Botón para tema Shiny (solo visible si está desbloqueado) */}
			{shinyUnlocked && (
				<button
					onClick={() => toggleTheme('shiny')}
					className={`w-12 h-6 rounded-full border-2 transition-all duration-200 ${
						isShiny
							? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 border-white shadow-lg'
							: 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-purple-400'
					}`}
					aria-label="Activar tema Shiny"
					title="Tema Shiny desbloqueado ✨"
				>
					<div className={`w-4 h-4 rounded-full transition-transform duration-200 ${
						isShiny
							? 'bg-white transform translate-x-6 shadow-md'
							: 'bg-white transform translate-x-0'
					}`} />
				</button>
			)}
			
			{/* Modal del juego de adivinanza */}
			<ShinyGreetingModal
				open={showGame}
				onOpenChange={setShowGame}
				onWin={() => {
					// Al ganar, desbloquear Shiny y cambiar al tema dark
					setShinyUnlocked(true);
					localStorage.setItem('stebe-shiny-unlocked', 'true');
					toggleTheme('dark');
					setShowGame(false);
				}}
			/>

			{/* Modal de pago para versión dark */}
			<PaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
			/>
		</div>
	);
};

export default ThemeToggle;