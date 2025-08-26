import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ShinyGreetingModal from "./ShinyGreetingModal";

const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [isPremium, setIsPremium] = useState<boolean>(false);
	const [showGreeting, setShowGreeting] = useState(false);

	useEffect(() => {
		setMounted(true);
		// Verificar estado premium al montar
		setIsPremium(localStorage.getItem("stebe-premium") === "1");
		
		const onStorage = () => setIsPremium(localStorage.getItem("stebe-premium") === "1");
		const onPremiumUpdated = () => setIsPremium(localStorage.getItem("stebe-premium") === "1");
		window.addEventListener('storage', onStorage);
		window.addEventListener('premium-updated', onPremiumUpdated as any);
		return () => {
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('premium-updated', onPremiumUpdated as any);
		};
	}, []);

	if (!mounted) return null;

	const isDark = theme === "dark";

	return (
		<div className="fixed top-4 right-4 z-50">
			<Switch
				className="scale-125 origin-top-right"
				checked={isDark}
				onCheckedChange={(checked) => {
					// Verificar estado premium en tiempo real
					const currentPremiumStatus = localStorage.getItem("stebe-premium") === "1";
					
					if (currentPremiumStatus) {
						// Si está en premium, puede cambiar tema libremente
						setTheme(checked ? "dark" : "light");
					} else {
						// Si está en free y quiere modo oscuro, mostrar modal
						if (checked) {
							setShowGreeting(true);
							return;
						}
						// Si quiere modo claro, permitir el cambio
						setTheme("light");
					}
				}}
				aria-label="Toggle theme"
			/>
			<ShinyGreetingModal
				open={showGreeting}
				onOpenChange={setShowGreeting}
				onWin={() => {
					localStorage.setItem("stebe-premium", "1");
					window.dispatchEvent(new Event('premium-updated'));
					toast.success("¡Desbloqueaste la versión Shiny!");
					setTheme("dark");
				}}
			/>
		</div>
	);
};

export default ThemeToggle;