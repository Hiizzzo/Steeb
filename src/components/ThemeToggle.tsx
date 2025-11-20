import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useUserCredits } from "@/hooks/useUserCredits";
import { Switch } from "@/components/ui/switch";
import ShinyGreetingModal from "@/components/ShinyGreetingModal";
import { PaymentModal } from "@/components/PaymentModal";
import { Coins, Crown } from "lucide-react";

const ThemeToggle = () => {
	const { currentTheme, toggleTheme, validateTheme } = useTheme();
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

	// Estados para el deslizamiento
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartX, setDragStartX] = useState(0);
	const [currentX, setCurrentX] = useState(0);
	const sliderRef = useRef(null);

	// Callback de cambio de tema mejorado con validación
	const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'shiny') => {
	
		// Validar el cambio de tema
		toggleTheme(newTheme);

		// Validación post-cambio (para debugging)
		setTimeout(() => {
			const validation = validateTheme();
			if (!validation.consistent) {
				console.error('❌ ThemeToggle: Inconsistency detected after change', validation);
			} else {
				}
		}, 50);
	}, [toggleTheme, validateTheme]);

	useEffect(() => {
		setMounted(true);

		// Validación inicial al montar
		if (mounted) {
			const validation = validateTheme();
			if (!validation.consistent) {
				console.warn('⚠️ ThemeToggle: Initial inconsistency detected', validation);
			}
		}
	}, [mounted, validateTheme]);

	// Función para determinar posición basada en coordenada X
	const getPositionFromX = (x) => {
		if (!sliderRef.current) return currentTheme;

		const rect = sliderRef.current.getBoundingClientRect();
		const relativeX = x - rect.left;
		const percentage = Math.max(0, Math.min(1, relativeX / rect.width));

	
		if (percentage < 0.33) return "light";
		if (percentage < 0.66) return "shiny";
		return "dark";
	};

	// Función para obtener coordenada X de posición
	const getXFromPosition = (position) => {
		if (!sliderRef.current) return 0;

		const rect = sliderRef.current.getBoundingClientRect();

		switch (position) {
			case "light": return rect.width * 0.166;
			case "shiny": return rect.width * 0.5;
			case "dark": return rect.width * 0.833;
			default: return rect.width * 0.166;
		}
	};

	// Click directo para cambiar de tema
	const handleClick = (e) => {
		e.preventDefault();
		const newPosition = getPositionFromX(e.clientX);
		handleThemeChange(newPosition);
	};

	// Mouse event handlers
	const handleMouseDown = (e) => {
		e.preventDefault();
		e.stopPropagation(); // Evitar que se dispare el handleClick
		
		setIsDragging(true);
		setDragStartX(e.clientX);
		setCurrentX(e.clientX);

		const handleMouseMove = (moveEvent) => {
			setCurrentX(moveEvent.clientX);
		};

		const handleMouseUp = (moveEvent) => {
				if (isDragging) {
				const newPosition = getPositionFromX(moveEvent.clientX);
						handleThemeChange(newPosition);
			}
			setIsDragging(false);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	};

	// Touch event handlers
	const handleTouchStart = (e) => {
		e.preventDefault();
		const touch = e.touches[0];
		setIsDragging(true);
		setDragStartX(touch.clientX);
		setCurrentX(touch.clientX);

		const handleTouchMove = (moveEvent) => {
			const touch = moveEvent.touches[0];
			setCurrentX(touch.clientX);
		};

		const handleTouchEnd = () => {
			if (isDragging) {
				const newPosition = getPositionFromX(currentX);
				handleThemeChange(newPosition);
			}
			setIsDragging(false);
		};

		const element = sliderRef.current;
		if (element) {
			element.addEventListener('touchmove', handleTouchMove);
			element.addEventListener('touchend', handleTouchEnd);
		}
	};

	if (!mounted) return null;

	const isDark = currentTheme === "dark";
	const isShiny = currentTheme === "shiny";

	return (
		<div className={`fixed top-8 right-4 z-[60] overflow-hidden rounded-full ${currentTheme === "shiny" ? 'bg-black shiny-allow-native' : ''}`}>
			{/* Switch de 3 posiciones deslizable: left=white, middle=shiny, right=black */}
			<div
				ref={sliderRef}
				className={`relative w-16 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer select-none shiny-toggle shiny-allow-native ${
					currentTheme === "light"
						? 'bg-white border-black'
						: currentTheme === "shiny"
							? 'bg-white border-black'
							: 'bg-black border-black'
				}`}
				onClick={handleClick}
				onMouseDown={handleMouseDown}
				onTouchStart={handleTouchStart}
				aria-label="Toggle theme"
			>
				
				{/* Marcadores de posición */}
				<div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none z-20">
					<div
						className={`theme-toggle-dot theme-toggle-dot-left ${currentTheme === "light" ? "w-3 h-3" : "w-2 h-2"} rounded-full ${
							currentTheme === "light" ? 'bg-black' : 'bg-gray-400'
						} shadow-sm`}
					/>
					<div
						className={`theme-toggle-dot theme-toggle-dot-middle ${currentTheme === "shiny" ? "w-3 h-3" : "w-2 h-2"} rounded-full ${
							currentTheme === "shiny" ? '' : currentTheme === "light" ? 'bg-gray-300' : 'bg-gray-400'
						} shadow-sm`}
						style={currentTheme === "shiny" ? { backgroundColor: '#FC0F88' } : undefined}
					/>
					<div
						className={`theme-toggle-dot theme-toggle-dot-right ${currentTheme === "dark" ? "w-3 h-3" : "w-2 h-2"} rounded-full ${
							currentTheme === "dark" ? 'bg-gray-100 border border-gray-300' : 'bg-gray-400'
						} shadow-md`}
					/>
				</div>
			</div>

			{/* Indicador de versión DARK */}
			{userCredits.hasDarkVersion && (
				<div className="flex items-center gap-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
					<Crown className="w-4 h-4 text-purple-500" />
					<span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">DARK</span>
				</div>
			)}

			{/* Modal del juego de adivinanza */}
			<ShinyGreetingModal
				open={showGame}
				onOpenChange={setShowGame}
				onWin={() => {
					setShinyUnlocked(true);
					localStorage.setItem('stebe-shiny-unlocked', 'true');
					handleThemeChange('dark');
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
