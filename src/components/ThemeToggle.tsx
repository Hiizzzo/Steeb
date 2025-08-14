import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	const isDark = theme === "dark";

	return (
		<div className="fixed top-2 right-2 z-50 flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-3 py-2 shadow-md">
			<Sun className="h-4 w-4" />
			<Switch
				checked={isDark}
				onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
				aria-label="Toggle theme"
			/>
			<Moon className="h-4 w-4" />
		</div>
	);
};

export default ThemeToggle;