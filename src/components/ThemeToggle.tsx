import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/ui/switch";

const ThemeToggle = () => {
	const { currentTheme, toggleTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	const isDark = currentTheme === "dark";
	const isShiny = currentTheme === "shiny";

	return (
		<div className="fixed top-4 right-4 z-50">
			<Switch
				className={`scale-125 origin-top-right ${
					isShiny 
						? 'data-[state=checked]:bg-white data-[state=unchecked]:bg-white [&>span]:bg-black data-[state=checked]:[&>span]:bg-black data-[state=unchecked]:[&>span]:bg-black' 
						: ''
				}`}
				checked={isDark}
				onCheckedChange={(checked) => {
					toggleTheme(checked ? "dark" : "light");
				}}
				aria-label="Toggle theme"
			/>
		</div>
	);
};

export default ThemeToggle;