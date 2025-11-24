import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  minHeight = 400
}) => {
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark';
  const isShinyMode = currentTheme === 'shiny';
  const isDarkOrShiny = isDarkMode || isShinyMode;
  const [panelHeight, setPanelHeight] = useState(500);
  const [isDragging, setIsDragging] = useState(false);
  const [isMultiTaskMode, setIsMultiTaskMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Notificar al componente padre cuando cambia la altura del panel
  useEffect(() => {
    if (onHeightChange && isOpen) {
      onHeightChange(panelHeight);
    }
  }, [panelHeight, isOpen, onHeightChange]);

  const setHeightImmediate = useCallback((height: number) => {
    setPanelHeight(height);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newHeight = window.innerHeight - e.clientY;
      const steebHeaderHeight = 120;
      const maxHeight = window.innerHeight - steebHeaderHeight;
      const calculatedMinHeight = minHeight;

      const finalHeight = Math.max(calculatedMinHeight, Math.min(maxHeight, newHeight));
      setPanelHeight(finalHeight);

      setIsMultiTaskMode(finalHeight >= maxHeight - 5);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const newHeight = window.innerHeight - touch.clientY;
      const steebHeaderHeight = 120;
      const maxHeight = window.innerHeight - steebHeaderHeight;
      const calculatedMinHeight = minHeight;

      const finalHeight = Math.max(calculatedMinHeight, Math.min(maxHeight, newHeight));
      setPanelHeight(finalHeight);

      setIsMultiTaskMode(finalHeight >= maxHeight - 5);
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
      (document.body as HTMLElement).style.webkitUserSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      (document.body as HTMLElement).style.webkitUserSelect = '';
    };
  }, [isDragging, minHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    if (isMultiTaskMode) {
      setHeightImmediate(window.innerHeight * 0.6);
      setIsMultiTaskMode(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    if (isMultiTaskMode) {
      setHeightImmediate(window.innerHeight * 0.6);
      setIsMultiTaskMode(false);
    }
  };

  const handlePanelMouseDown = (e: React.MouseEvent) => {
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
      e.stopPropagation();
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setHeightImmediate(minHeight);
      setIsMultiTaskMode(false);
    }
  }, [isOpen, minHeight, setHeightImmediate]);

  return (
    <>
      {isOpen && (
        <div
          className={`fixed left-0 right-0 ${
            isDragging ? 'transition-none' : 'transition-all duration-200 ease-out'
          } ${isDarkOrShiny ? 'bg-black text-white' : 'bg-white text-black'} ${
            isDragging ? 'cursor-ns-resize' : ''
          }`}
          style={{
            zIndex: 30,
            bottom: 0,
            height: isMultiTaskMode ? `${window.innerHeight * 0.6}px` : `${panelHeight}px`,
            borderTop: isDragging ? '2px solid #6B7280' : isMultiTaskMode ? '2px solid #6B7280' : 'none',
            touchAction: isDragging ? 'none' : 'pan-y',
            pointerEvents: 'auto'
          }}
          ref={containerRef}
          onMouseDown={handlePanelMouseDown}
          onTouchStart={handlePanelTouchStart}
        >
          <button
            data-custom-color="true"
            onClick={onClose}
            className={`fixed-panel-close-btn absolute top-3 left-3 z-50 p-1 transition-colors border-0 outline-none focus:outline-none focus:border-none focus:ring-0 ring-0 ${
              isDarkOrShiny ? 'text-white' : 'text-black'
            }`}
            style={{
              border: isDarkMode ? '1px solid #000000' : 'none',
              outline: 'none !important',
              boxShadow: 'none !important',
              background: isDarkMode ? '#000000' : 'transparent',
              borderWidth: isDarkMode ? '1px' : '0px',
              borderColor: isDarkMode ? '#000000' : 'transparent'
            }}
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>

          {!isDragging && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
              {isMultiTaskMode ? (
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500 text-white text-xs">
                  <span>Modo multitarea</span>
                </div>
              ) : (
                <div
                  className={`w-8 h-0.5 rounded-full opacity-30 ${
                    isDarkOrShiny ? 'bg-gray-600' : 'bg-gray-400'
                  }`}
                ></div>
              )}
            </div>
          )}

          <div className="h-full overflow-hidden pt-1">{children}</div>
        </div>
      )}
    </>
  );
};

export default FixedPanelContainer;
