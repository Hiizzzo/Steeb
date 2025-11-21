import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useUserRole } from "@/hooks/useUserRole";
import { useMercadoPago } from "@/hooks/useMercadoPago";
import { Switch } from "@/components/ui/switch";
import ShinyGreetingModal from "@/components/ShinyGreetingModal";
import { Crown } from "lucide-react";

const ThemeToggle = () => {
	const { currentTheme, toggleTheme, validateTheme } = useTheme();
	const { userCredits } = useUserCredits();
	const { userProfile, canUseMode } = useUserRole();
	const [mounted, setMounted] = useState(false);
	const [showGame, setShowGame] = useState(false);

	// Mercado Pago configuration - usando tus credenciales reales de TEST
	const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || 'APP_USR-040fe15b-62b7-4999-926c-08c2ae46c5bb';
	const { status: mpStatus, instance: mpInstance } = useMercadoPago(MP_PUBLIC_KEY);

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

	// Callback de cambio de tema mejorado con validación
	const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'shiny') => {
		console.log('🎯 ThemeToggle: handleThemeChange llamado con', newTheme);
		console.log('👤 UserProfile:', userProfile);
		console.log('🔒 canUseMode(newTheme):', canUseMode(newTheme));

		// Verificar si el usuario puede usar el modo solicitado
		if (!canUseMode(newTheme)) {
			console.log('❌ Usuario no puede usar el modo:', newTheme);
			// Si userProfile es null, asumimos que es usuario WHITE (default)
			const userRole = userProfile?.role || 'white';
			console.log('🎭 Rol asumido:', userRole);

			if (userRole === 'white') {
				console.log('👋 Es usuario WHITE, enviando mensaje directo con botón al chat');
				if (newTheme === 'dark') {
					// Enviar mensaje descriptivo completo con botón de compra
					const darkModeWithButtonMessage = {
						type: 'theme-info-with-button',
						content: `Bueno parece que queres el Dark Mode, el cual hace que tu app sea de color negro e incluye.

- Acceso al dark mode para siempre
- 1 intento gratis del Shiny Mode
- Lo mas importante no te vas a quedar ciego cada vez que entras a la app

todo esto a tan solo $3000`,
						timestamp: new Date(),
						showMercadoPagoButton: true
					};

					const event = new CustomEvent('steeb-message-with-button', {
						detail: darkModeWithButtonMessage
					});
					window.dispatchEvent(event);
				} else if (newTheme === 'shiny') {
					const shinyModeMessage = `¡Oye! Veo que querés el modo Shiny ✨

Pero para poder jugar conmigo y ganar este modo, primero necesitas cumplir un requisito obligatorio:

🔒 REQUISITO: Tenés que tener el modo Dark desbloqueado.

El modo Shiny es exclusivo - solo accesible mediante el juego de adivinanza (1% probabilidad de ganar) pero primero necesitás el Dark Mode.`;

					sendMessageToSteebChat(shinyModeMessage);
				}
				return;
			}
		}

		// Validar el cambio de tema
		toggleTheme(newTheme);

		// Validación post-cambio (para debugging)
		setTimeout(() => {
			const validation = validateTheme();
			if (!validation.consistent) {
				console.error('❌ ThemeToggle: Inconsistency detected after change', validation);
			}
		}, 50);
	}, [toggleTheme, validateTheme, canUseMode, userProfile]);

	useEffect(() => {
		setMounted(true);

		// Validación inicial al montar
		if (mounted) {
			const validation = validateTheme();
			if (!validation.consistent) {
				console.warn('⚠️ ThemeToggle: Initial inconsistency detected', validation);
			}
		}

		// Escuchar evento de compra desde el chat
		const handleBuyDarkMode = async (event: CustomEvent) => {
			console.log('💳 Evento de compra Dark Mode recibido desde:', event.detail.source);
			console.log('🔑 MP Status:', mpStatus);
			console.log('🔑 MP Instance:', mpInstance ? 'Listo' : 'No cargado');

			// Abrir checkout de Mercado Pago
			if (mpInstance && mpStatus === 'ready') {
				try {
					console.log('💳 Creando preferencia de pago para Dark Mode...');

					// Importar dinámicamente el servicio de pago
					const { createCheckoutPreference } = await import('@/services/paymentService');

					// Crear preferencia de pago para el Dark Mode
					const preferenceResponse = await createCheckoutPreference({
						planId: 'dark-mode-premium',
						quantity: 1,
						userId: userProfile?.id || 'anon',
						email: userProfile?.email,
						name: userProfile?.name || userProfile?.nickname
					});

					console.log('✅ Preferencia creada:', preferenceResponse.preferenceId);

					// 🚀 PRODUCCIÓN: Mercado Pago real
					try {
						console.log('🚀 Redirigiendo a Mercado Pago');

						const checkoutUrl = preferenceResponse.initPoint;
						const sandboxUrl = preferenceResponse.sandboxInitPoint;

						console.log('🛒 URLs disponibles:');
						console.log('- Init Point (producción):', checkoutUrl);
						console.log('- Sandbox Init Point (prueba):', sandboxUrl);

						// Para desarrollo, usar sandbox; para producción, usar initPoint
						const finalUrl = process.env.NODE_ENV === 'development' ? sandboxUrl : checkoutUrl;

						if (finalUrl) {
							console.log('🛒 Abriendo checkout de Mercado Pago:', finalUrl);
							console.log('🔧 Modo:', process.env.NODE_ENV === 'development' ? 'DESARROLLO (sandbox)' : 'PRODUCCIÓN');

							// Abrir en una nueva ventana para el checkout de Mercado Pago
							window.open(finalUrl, '_blank', 'noopener,noreferrer,width=800,height=600');
						} else {
							throw new Error('No hay URL de checkout disponible');
						}

					} catch (mpError) {
						console.error('❌ Error en proceso de pago:', mpError);
						alert('Error procesando el pago. Intenta de nuevo.');
					}

				} catch (error) {
					console.error('❌ Error en el proceso de pago:', error);

					// Mostrar error detallado al usuario
					alert('❌ Error en el proceso de pago: ' + (error.message || 'Error desconocido') + '\n\nPor favor, contacta a soporte o intenta más tarde.');
					return;
				}
			} else {
				console.log('⚠️ Mercado Pago no está listo:', mpStatus);

				// Mostrar error claro si el SDK no carga
				alert('⚠️ El sistema de pagos no está disponible\n\nPor favor, recarga la página e intenta nuevamente.\nSi el problema persiste, contacta a soporte.');
				return;
			}
		};

		window.addEventListener('buy-dark-mode', handleBuyDarkMode as EventListener);

		// Limpiar el event listener al desmontar
		return () => {
			window.removeEventListener('buy-dark-mode', handleBuyDarkMode as EventListener);
		};
	}, [mounted, validateTheme]);

	// Efecto de seguridad: Forzar White Mode si el usuario no tiene permisos
	useEffect(() => {
		if (!mounted || !currentTheme) return;

		// Si ya está en light mode, no hacer nada (siempre permitido como base)
		if (currentTheme === 'light') return;

		// Verificar si el usuario puede usar el tema actual (solo para dark/shiny)
		if (!canUseMode(currentTheme as 'dark' | 'shiny')) {
			console.log('🚨 Usuario sin permiso en tema:', currentTheme, '→ Forzando White Mode');
			// Forzar White Mode para usuarios sin permisos
			toggleTheme('light');
		}
	}, [mounted, currentTheme, canUseMode, toggleTheme]);

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
		<div className={`fixed top-8 right-4 z-[60] overflow-hidden rounded-full ${currentTheme === "shiny" ? 'bg-black shiny-allow-native' : ''}`}>
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
						className={`theme-toggle-dot theme-toggle-dot-middle ${currentTheme === "shiny" ? "w-3 h-3" : "w-2 h-2"} rounded-full ${currentTheme === "shiny" ? '' : currentTheme === "light" ? 'bg-gray-300' : 'bg-gray-400'
							} shadow-sm`}
						style={currentTheme === "shiny" ? { backgroundColor: '#FC0F88' } : undefined}
					/>
					<div
						className={`theme-toggle-dot theme-toggle-dot-right ${currentTheme === "dark" ? "w-3 h-3" : "w-2 h-2"} rounded-full ${currentTheme === "dark" ? 'bg-gray-100 border border-gray-300' : 'bg-gray-400'
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
					localStorage.setItem('stebe-shiny-unlocked', 'true');
					handleThemeChange('dark');
					setShowGame(false);
				}}
			/>

		</div>
	);
};

export default ThemeToggle;
