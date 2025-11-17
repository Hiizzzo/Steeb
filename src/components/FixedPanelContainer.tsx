import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface FixedPanelContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  onHeightChange?: (height: number) => void;
  minHeight?: number;
}

const FixedPanelContainer: React.FC<FixedPanelContainerProps> = ({
  isOpen,
  onClose,
  children,
  onHeightChange,
  minHeight = 500
}) => {
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark';
  const [panelHeight, setPanelHeight] = useState(500);
  const [isDragging, setIsDragging] = useState(false);
  const [isMultiTaskMode, setIsMultiTaskMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Altura fija: 500px para el panel calendario - piso mínimo
  const DEFAULT_HEIGHT = 500;

  // Notificar al componente padre cuando cambia la altura del panel
  useEffect(() => {
    if (onHeightChange && isOpen) {
      onHeightChange(panelHeight);
    }
  }, [panelHeight, isOpen, onHeightChange]);

  
  // Efectos para manejar el drag con mouse y touch
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newHeight = window.innerHeight - e.clientY;
      const steebHeaderHeight = 120; // Altura ajustada del header STEEB para que choque pero no lo traspase
      const maxHeight = window.innerHeight - steebHeaderHeight; // Choca con el div de STEEB
      const calculatedMinHeight = minHeight; // Usar el minHeight pasado como prop

      const finalHeight = Math.max(calculatedMinHeight, Math.min(maxHeight, newHeight));
      setPanelHeight(finalHeight);

      // Detectar si el panel toca el techo para activar modo multitarea
      if (finalHeight >= maxHeight - 5) { // 5px de tolerancia
        setIsMultiTaskMode(true);
      } else {
        setIsMultiTaskMode(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const newHeight = window.innerHeight - touch.clientY;
      const steebHeaderHeight = 120; // Altura ajustada del header STEEB para que choque pero no lo traspase
      const maxHeight = window.innerHeight - steebHeaderHeight; // Choca con el div de STEEB
      const calculatedMinHeight = minHeight; // Usar el minHeight pasado como prop

      const finalHeight = Math.max(calculatedMinHeight, Math.min(maxHeight, newHeight));
      setPanelHeight(finalHeight);

      // Detectar si el panel toca el techo para activar modo multitarea
      if (finalHeight >= maxHeight - 5) { // 5px de tolerancia
        setIsMultiTaskMode(true);
      } else {
        setIsMultiTaskMode(false);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd, { passive: false });
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    // Si está en modo multitarea, restablecer altura normal al empezar a arrastrar
    if (isMultiTaskMode) {
      setPanelHeight(window.innerHeight * 0.6); // Empezar desde 60%
      setIsMultiTaskMode(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // No usar preventDefault() aquí para evitar el error de passive event listener
    e.stopPropagation();
    setIsDragging(true);
    // Si está en modo multitarea, restablecer altura normal al empezar a arrastrar
    if (isMultiTaskMode) {
      setPanelHeight(window.innerHeight * 0.6); // Empezar desde 60%
      setIsMultiTaskMode(false);
    }
  };

  // Manejadores para el área completa del panel
  const handlePanelMouseDown = (e: React.MouseEvent) => {
    // Solo iniciar drag si se hace click en la parte superior (primeros 80px)
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    if (clickY <= 80) {
      handleMouseDown(e);
    }
  };

  const handlePanelTouchStart = (e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const touchY = touch.clientY - rect.top;
    if (touchY <= 80) {
      // No usar preventDefault() aquí para evitar el error de passive event listener
      e.stopPropagation();
      setIsDragging(true);
    }
  };

  return (
    <>
      {/* Overlay eliminado para permitir chat mientras los paneles están abiertos */}

      {/* Panel con altura dinámica y movimiento fluido */}
      {isOpen && (
        <div
          className={`fixed left-0 right-0 ${
            isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'
          } ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} ${
            isDragging ? 'cursor-ns-resize' : ''
          }`}
          style={{
            zIndex: 30, // Z-index bajo para que el chat siempre quede por encima
            bottom: 0,
            height: isMultiTaskMode ? `${window.innerHeight * 0.6}px` : `${panelHeight}px`, // 60% fijo en modo multitarea
            borderTop: isDragging ? '2px solid #6B7280' : isMultiTaskMode ? '2px solid #6B7280' : 'none',
            touchAction: isDragging ? 'none' : 'pan-y',
            pointerEvents: isMultiTaskMode ? 'auto' : 'auto' // Siempre interactuable
          }}
          ref={containerRef}
          onMouseDown={handlePanelMouseDown}
          onTouchStart={handlePanelTouchStart}
        >
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className={`absolute top-3 left-3 z-50 p-1 transition-colors border-0 outline-none focus:outline-none focus:border-none focus:ring-0 ring-0 ${
              isDarkMode
                ? 'text-white'
                : 'text-black'
            }`}
            style={{
              border: 'none !important',
              outline: 'none !important',
              boxShadow: 'none !important',
              background: 'transparent',
              borderWidth: '0px',
              borderColor: 'transparent'
            }}
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Indicador sutil en la parte superior */}
          {!isDragging && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
              {isMultiTaskMode ? (
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500 text-white text-xs">
                  <span>Modo multitarea</span>
                </div>
              ) : (
                <div className={`w-8 h-0.5 rounded-full opacity-30 ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
                }`}></div>
              )}
            </div>
          )}

          {/* Content con padding mínimo para maximizar espacio vertical */}
          <div className="h-full overflow-hidden pt-1">
            {children}
          </div>

          </div>
      )}
    </>
  );
};

export default FixedPanelContainer;