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
  // Altura fija para los paneles (aprox 50% de la pantalla o minHeight)
  const fixedHeight = Math.max(minHeight, window.innerHeight * 0.5);
  
  // Notificar al componente padre cuando cambia la altura del panel
  useEffect(() => {
    if (onHeightChange && isOpen) {
      onHeightChange(fixedHeight);
    }
  }, [isOpen, onHeightChange, fixedHeight]);

  return (
    <>
      {isOpen && (
        <div
          className={`fixed left-0 right-0 transition-all duration-300 ease-out ${isDarkOrShiny ? 'bg-black text-white' : 'bg-white text-black'}`}
          style={{
            zIndex: 30,
            bottom: 0,
            height: `${fixedHeight}px`,
            borderTop: '1px solid rgba(128, 128, 128, 0.2)',
            pointerEvents: 'auto',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
          }}
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

          {/* Indicador visual simple (sin función de arrastre) */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <div
              className={`w-8 h-1 rounded-full opacity-20 ${
                isDarkOrShiny ? 'bg-gray-500' : 'bg-gray-400'
              }`}
            ></div>
          </div>

          <div className="h-full overflow-hidden pt-1">{children}</div>
        </div>
      )}
    </>
  );
};

export default FixedPanelContainer;
