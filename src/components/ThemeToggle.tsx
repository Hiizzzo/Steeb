import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ShinyGreetingModal from "./ShinyGreetingModal";

const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [isPremium, setIsPremium] = useState<boolean>(() => {
		return typeof window !== 'undefined' && localStorage.getItem("stebe-premium") === "1";
	});
	const [showGreeting, setShowGreeting] = useState(false);

	useEffect(() => {
		setMounted(true);
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
					if (!isPremium && checked) {
						setShowGreeting(true);
						return;
					}
					setTheme(checked ? "dark" : "light");
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