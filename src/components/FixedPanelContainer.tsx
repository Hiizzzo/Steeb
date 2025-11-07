import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface FixedPanelContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const FixedPanelContainer: React.FC<FixedPanelContainerProps> = ({
  isOpen,
  onClose,
  children
}) => {
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark';
  const [panelHeight, setPanelHeight] = useState(window.innerHeight * 0.5);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Altura predefinida: 60% de la pantalla para el panel, dejando 40% para el chat
  const DEFAULT_HEIGHT = window.innerHeight * 0.6;

  
  // Efectos para manejar el drag con mouse y touch
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newHeight = window.innerHeight - e.clientY;
      const steebHeaderHeight = 120; // Altura ajustada del header STEEB para que choque pero no lo traspase
      const maxHeight = window.innerHeight - steebHeaderHeight; // Choca con el div de STEEB
      const minHeight = window.innerHeight * 0.3; // Mínimo 30% de la pantalla para dejar más espacio al chat

      setPanelHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const newHeight = window.innerHeight - touch.clientY;
      const steebHeaderHeight = 120; // Altura ajustada del header STEEB para que choque pero no lo traspase
      const maxHeight = window.innerHeight - steebHeaderHeight; // Choca con el div de STEEB
      const minHeight = window.innerHeight * 0.3; // Mínimo 30% de la pantalla para dejar más espacio al chat

      setPanelHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
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
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Manejadores para el área completa del panel
  const handlePanelMouseDown = (e: React.MouseEvent) => {
    // Solo iniciar drag si se hace click en la parte superior (primeros 50px)
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    if (clickY <= 50) {
      handleMouseDown(e);
    }
  };

  const handlePanelTouchStart = (e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const touchY = touch.clientY - rect.top;
    if (touchY <= 50) {
      handleTouchStart(e);
    }
  };

  return (
    <>
      {/* Overlay - desaparece cuando el panel choca con el header STEEB */}
      {isOpen && panelHeight < (window.innerHeight - 120) && (
        <div
          className="fixed top-0 left-0 right-0 z-40"
          style={{
            height: `calc(100vh - ${panelHeight}px)`,
            backgroundColor: 'rgba(0, 0, 0, 0.05)'
          }}
          onClick={onClose}
        />
      )}

      {/* Panel con altura dinámica y movimiento fluido */}
      {isOpen && (
        <div
          className={`fixed left-0 right-0 ${
            isDragging ? 'transition-none' : 'transition-all duration-300 ease-out'
          } ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} ${
            isDragging ? 'cursor-ns-resize' : ''
          }`}
          style={{
            zIndex: 45,
            bottom: 0,
            height: `${panelHeight}px`,
            borderTop: isDragging ? '2px solid #3B82F6' : 'none'
          }}
          ref={containerRef}
          onMouseDown={handlePanelMouseDown}
          onTouchStart={handlePanelTouchStart}
        >
          {/* Indicador sutil en la parte superior */}
          {!isDragging && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
              <div className={`w-8 h-0.5 rounded-full opacity-30 ${
                isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
              }`}></div>
            </div>
          )}

          {/* Content con padding superior reducido para acercar el título arriba */}
          <div className="h-full overflow-hidden pt-2">
            {children}
          </div>

          </div>
      )}
    </>
  );
};

export default FixedPanelContainer;