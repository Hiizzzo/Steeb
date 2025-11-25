import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useUserRole } from "@/hooks/useUserRole";
import { useFirebaseRoleCheck } from "@/hooks/useFirebaseRoleCheck";

import { useAuth } from "@/hooks/useAuth";
import { mercadoPagoService } from "@/services/mercadoPagoService";

const ThemeToggle = () => {
	const { currentTheme, toggleTheme } = useTheme();
	const { userProfile } = useUserRole();
	const { user } = useAuth();
	const { tipoUsuario } = useFirebaseRoleCheck();
	const [mounted, setMounted] = useState(false);

	// Función para enviar mensaje al chat de Steeb
	const sendMessageToSteebChat = (message: string) => {
		// Crear un evento personalizado que el chat de Steeb puede escuchar
		const event = new CustomEvent('steeb-message', {
			detail: {
				type: 'theme-info',
				content: message,
				timestamp: new Date()
			}
		});
		window.dispatchEvent(event);
	};

	// Estados para el deslizamiento
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartX, setDragStartX] = useState(0);
	const [currentX, setCurrentX] = useState(0);
	const sliderRef = useRef(null);

	// Acceso directo según tipoUsuario de Firebase
	const canUseThemeMode = (theme: 'light' | 'dark' | 'shiny') => {
		console.log('🔍 canUseThemeMode - tipoUsuario:', tipoUsuario, 'theme:', theme);

		// Normalizar tipoUsuario a minúsculas para comparación
		const normalizedTipo = (tipoUsuario || 'white').toLowerCase();

		// WHITE: solo light
		if (normalizedTipo === 'white') return theme === 'light';

		// BLACK o DARK: light + dark
		if (normalizedTipo === 'black' || normalizedTipo === 'dark') {
			return theme === 'light' || theme === 'dark';
		}

		// SHINY: todo
		if (normalizedTipo === 'shiny') return true;

		// Default: solo light
		return theme === 'light';
	};


	// Callback simple de cambio de tema
	const handleThemeChange = (newTheme: 'light' | 'dark' | 'shiny') => {
		const normalizedTipo = (tipoUsuario || 'white').toLowerCase();

		if (!canUseThemeMode(newTheme)) {
			// Usuario WHITE sin acceso
			if (newTheme === 'dark') {
				const message = {
					type: 'theme-info-with-button',
					content: '¿Querés ser usuario **Black**?\n\n-Acceso al DARK mode.\n-Acceso al juego SHINY, ademas de una tirada gratis.\n-Lo mas imporante no se te va arruinar la vista cada vez que entres a la app.\n\nTodo esto a tan solo $3000',
					timestamp: new Date(),
					showMercadoPagoButton: true
				};
				window.dispatchEvent(new CustomEvent('steeb-message-with-button', { detail: message }));
			} else if (newTheme === 'shiny') {
				// Si es usuario WHITE, mostrar mensaje de que necesita ser BLACK
				if (normalizedTipo === 'white') {
					sendMessageToSteebChat('Para acceder al modo SHINY, primero necesitas ser usuario **Black**.');
				} else {
					// Si ya es BLACK o DARK pero no SHINY, mostrar opciones de tiradas
					const rolls = userProfile?.shinyRolls || 0;
					const message = {
						type: 'theme-info-with-options',
						content: `¿Vas a probar suerte para desbloquear el modo SHINY?\n\nTe quedan ${rolls} tiradas.\n\nElegí tu paquete de tiradas:`,
						timestamp: new Date(),
						paymentOptions: [
							{ id: '1-roll', label: '1 tirada', price: '$300', action: 'buy-shiny-rolls', planId: 'shiny-roll-1', className: 'text-black dark:text-white' },
							{ id: '15-rolls', label: '15 tiradas', price: '$4000', action: 'buy-shiny-rolls', planId: 'shiny-roll-15', className: 'text-black dark:text-white' },
							{ id: '30-rolls', label: '30 tiradas', price: '$8000', action: 'buy-shiny-rolls', planId: 'shiny-roll-30', className: 'text-black dark:text-white' }
						]
					};
					window.dispatchEvent(new CustomEvent('steeb-message-with-options', { detail: message }));
				}
			}
			return;
		}

		// Cambiar tema
		toggleTheme(newTheme);
	};

	useEffect(() => {
		setMounted(true);

		const resolveUserData = () => {
			const currentUserId = user?.id || userProfile?.uid;

			if (!currentUserId) {
				return null;
			}

			return {
				userId: currentUserId,
				email: user?.email || userProfile?.email || `user_${currentUserId}@steeb.app`,
				name: user?.name || userProfile?.name || userProfile?.nickname || 'Usuario STEEB',
				avatar: user?.avatar || userProfile?.avatar
			};
		};

		// Listener simple para compra de Dark Mode
		const handleBuyDarkMode = async () => {
			const userData = resolveUserData();

			if (!userData) {
				alert('Debes iniciar sesión para comprar el modo Dark.');
				return;
			}

			try {
				await mercadoPagoService.handlePayment(userData, 'black-user-plan', 1);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Error desconocido';
				alert('Error procesando el pago: ' + message);
			}
		};

		// Listener para compra de tiradas Shiny
		const handleBuyShinyRolls = async (event: CustomEvent<{ planId: string }>) => {
			const userData = resolveUserData();

			if (!userData) {
				alert('Debes iniciar sesión para comprar tiradas Shiny.');
				return;
			}

			const planId = event?.detail?.planId;

			if (!planId) {
				alert('No se pudo determinar el paquete de tiradas.');
				return;
			}

			try {
				await mercadoPagoService.handlePayment(userData, planId, 1);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Error desconocido';
				alert('Error procesando el pago: ' + message);
			}
		};

		window.addEventListener('buy-dark-mode', handleBuyDarkMode as EventListener);
		window.addEventListener('buy-shiny-rolls', handleBuyShinyRolls as EventListener);

		return () => {
			window.removeEventListener('buy-dark-mode', handleBuyDarkMode as EventListener);
			window.removeEventListener('buy-shiny-rolls', handleBuyShinyRolls as EventListener);
		};
	}, [user, userProfile]);

	// Efecto de seguridad: Forzar Light Mode si el usuario no tiene permisos
	useEffect(() => {
		if (!mounted || !currentTheme || currentTheme === 'light') return;

		if (!canUseThemeMode(currentTheme as 'dark' | 'shiny')) {
			toggleTheme('light');
		}
	}, [mounted, currentTheme, canUseThemeMode, toggleTheme]);

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
		console.log('🖱️ handleClick llamado');
		e.preventDefault();
		const newPosition = getPositionFromX(e.clientX);
		console.log('📍 Posición calculada:', newPosition);
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
		<div className={`fixed top-8 right-4 z-[60] overflow-hidden rounded-full ${currentTheme === "shiny" ? 'shiny-allow-native' : ''}`}>
			{/* Switch de 3 posiciones deslizable: left=white, middle=shiny, right=black */}
			<div
				ref={sliderRef}
				className={`relative w-16 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer select-none shiny-toggle shiny-allow-native ${currentTheme === "light"
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
						className={`theme-toggle-dot theme-toggle-dot-left ${currentTheme === "light" ? "w-3 h-3" : "w-2 h-2"} rounded-full ${currentTheme === "light" ? 'bg-black' : 'bg-gray-400'
							} shadow-sm`}
					/>
					<div
						className={`theme-toggle-dot theme-toggle-dot-middle ${currentTheme === "shiny" ? "w-3 h-3" : "w-2 h-2"} rounded-full ${currentTheme === "shiny" ? 'bg-black' : currentTheme === "light" ? 'bg-gray-300' : 'bg-gray-400'
							} shadow-sm`}
					/>
					<div
						className={`theme-toggle-dot theme-toggle-dot-right ${currentTheme === "dark" ? "w-3 h-3" : "w-2 h-2"} rounded-full ${currentTheme === "dark" ? 'bg-gray-100 border border-gray-300' : 'bg-gray-400'
							} shadow-md`}
					/>
				</div>
			</div>



		</div>
	);
};

export default ThemeToggle;
