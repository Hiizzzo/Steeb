import React from "react";

type ShapeVariant =
  | "triangle"
  | "square"
  | "circle"
  | "diamond"
  | "hexagon"
  | "question"
  | "dollar"
  | "spade"
  | "club"
  | "heart";

interface ShapeIconProps {
  variant: ShapeVariant;
  className?: string;
  title?: string;
}

const ShapeIcon: React.FC<ShapeIconProps> = ({ variant, className, title }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className ?? "w-6 h-6 text-black"} shape-outline`}
      role="img"
      aria-label={title ?? variant}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="whiteGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {variant === "triangle" && (
        <>
          <path d="M12 3 L22 20 H2 Z" fill="currentColor" stroke="none" />
        </>
      )}
      {variant === "square" && (
        <>
          <path d="M4 4 H20 V20 H4 Z" fill="currentColor" stroke="none" />
        </>
      )}
      {variant === "circle" && (
        <>
          <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
        </>
      )}
      {variant === "diamond" && (
        <>
          <path d="M12 2 L20 12 L12 22 L4 12 Z" fill="currentColor" stroke="none" />
        </>
      )}
      {variant === "hexagon" && (
        <>
          <path d="M7 4 h10 l5 8 -5 8 H7 L2 12 Z" fill="currentColor" stroke="none" />
        </>
      )}
      {variant === "question" && (
        <>
          <text x="12" y="14" textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="700" fill="currentColor">?</text>
        </>
      )}
      {variant === "dollar" && (
        <>
          <text x="12" y="14" textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="700" fill="currentColor">$</text>
        </>
      )}
      {variant === "heart" && (
        <>
          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.936 0-3.597 1.126-4.312 2.733C11.285 4.876 9.624 3.75 7.688 3.75 5.099 3.75 3 5.765 3 8.25c0 7.063 9 11.25 9 11.25s9-4.187 9-11.25z" fill="currentColor" stroke="none" />
        </>
      )}
      {variant === "spade" && (
        <>
          <g fill="currentColor" stroke="none">
            <path d="M12 4 C10 7 6 8.7 6 11.2 C6 13.2 7.7 14.8 9.6 14.8 C10.9 14.8 11.7 14.1 12 13.0 C12.3 14.1 13.1 14.8 14.4 14.8 C16.3 14.8 18 13.2 18 11.2 C18 8.7 14 7 12 4 Z" />
            <rect x="10.6" y="15.1" width="2.8" height="4.2" rx="1.2" />
            <path d="M9.2 20.1 H14.8 L12 22 Z" />
          </g>
        </>
      )}
      {variant === "club" && (
        <>
          <g fill="currentColor" stroke="none">
            <circle cx="12" cy="8.2" r="3.3" />
            <circle cx="8.2" cy="12.6" r="3.3" />
            <circle cx="15.8" cy="12.6" r="3.3" />
            <rect x="10.7" y="12.6" width="2.6" height="5.2" rx="1.2" />
            <path d="M9.5 17.8 H14.5 L12 20 Z" />
          </g>
        </>
      )}
    </svg>
  );
};

export default ShapeIcon;


