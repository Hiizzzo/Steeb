import React from "react";

type ShapeVariant = "triangle" | "square" | "circle" | "diamond" | "hexagon";

interface ShapeIconProps {
  variant: ShapeVariant;
  className?: string;
  title?: string;
}

const ShapeIcon: React.FC<ShapeIconProps> = ({ variant, className, title }) => {
  console.log("[ShapeIcon] render", { variant, className });
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "w-6 h-6"}
      role="img"
      aria-label={title ?? variant}
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === "triangle" && <path d="M12 3 L22 20 H2 Z" fill="currentColor" />}
      {variant === "square" && <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" />}
      {variant === "circle" && <circle cx="12" cy="12" r="9" fill="currentColor" />}
      {variant === "diamond" && <path d="M12 3 L21 12 L12 21 L3 12 Z" fill="currentColor" />}
      {variant === "hexagon" && <path d="M7 4 h10 l5 8 -5 8 H7 L2 12 Z" fill="currentColor" />}
    </svg>
  );
};

export default ShapeIcon;


