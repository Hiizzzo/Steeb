import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	const isDark = theme === "dark";

	return (
		<div className="fixed top-4 right-4 z-50">
			<Switch
				className={`scale-125 origin-top-right`}
				checked={isDark}
				onCheckedChange={(checked) => {
					setTheme(checked ? "dark" : "light");
				}}
				aria-label="Toggle theme"
			/>
		</div>
	);
};

export default ThemeToggle;