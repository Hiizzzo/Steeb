import React from 'react';
import { useSwipePanel } from '@/hooks/useSwipePanel';
import { useTheme } from '@/hooks/useTheme';

interface SwipePanelContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const SwipePanelContainer: React.FC<SwipePanelContainerProps> = ({
  isOpen,
  onClose,
  children
}) => {
  const { currentTheme } = useTheme();
  const {
    isDragging,
    currentY,
    panelRef,
    handleDragStart,
    closePanel,
    PANEL_HEIGHT,
    MIN_HEIGHT
  } = useSwipePanel({ onClose, initialOpen: isOpen });

  const isDarkMode = currentTheme === 'dark';

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          style={{ zIndex: 45 }}
          onClick={closePanel}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed left-0 right-0 transition-transform duration-200 ease-out ${
          isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
        }`}
        style={{
          bottom: 0,
          height: `${PANEL_HEIGHT}px`,
          transform: `translateY(${isOpen ? -currentY : -PANEL_HEIGHT}px)`, // Panel empieza desde abajo
          transition: isDragging ? 'none' : 'transform 200ms ease-out',
          zIndex: 50
        }}
      >
        {/* Drag Handle */}
        <div
          className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full cursor-pointer"
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#D1D5DB'
          }}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        />

        {/* Content */}
        <div
          className="h-full overflow-hidden"
          onMouseDown={(e) => {
            // Solo permitir drag si está en el borde superior
            if (e.clientY < 50) {
              handleDragStart(e.clientY);
            }
          }}
          onTouchStart={(e) => {
            // Solo permitir drag si está en el borde superior
            if (e.touches[0].clientY < 50) {
              handleDragStart(e.touches[0].clientY);
            }
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default SwipePanelContainer;