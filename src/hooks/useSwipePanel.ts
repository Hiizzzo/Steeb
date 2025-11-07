import { useState, useRef, useEffect } from 'react';

interface UseSwipePanelProps {
  onClose: () => void;
  initialOpen?: boolean;
}

export const useSwipePanel = ({ onClose, initialOpen = false }: UseSwipePanelProps) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const WINDOW_HEIGHT = window.innerHeight;
  const HEADER_HEIGHT = 120; // Altura del header de STEEB
  const PANEL_HEIGHT = WINDOW_HEIGHT - HEADER_HEIGHT; // Altura máxima del panel
  const MIN_HEIGHT = 80; // Altura mínima visible cuando está cerrado
  const SNAP_THRESHOLD = 100; // Umbral para hacer snap
  const MAX_Y = PANEL_HEIGHT - MIN_HEIGHT; // Máximo desplazamiento hacia arriba

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      const deltaY = dragStartY - e.clientY; // Invertimos para que arrastrar hacia arriba sea positivo
      const newY = Math.max(0, Math.min(deltaY, MAX_Y));
      setCurrentY(newY);
    };

    const handleMouseUp = () => {
      if (!isDragging) return;

      setIsDragging(false);

      // Determinar si debe cerrarse o abrirse completamente
      if (currentY < SNAP_THRESHOLD) {
        // Cerrar el panel
        setIsOpen(false);
        setCurrentY(0);
        onClose();
      } else {
        // Abrir completamente
        setIsOpen(true);
        setCurrentY(MAX_Y);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      const deltaY = dragStartY - e.touches[0].clientY; // Invertimos para que arrastrar hacia arriba sea positivo
      const newY = Math.max(0, Math.min(deltaY, MAX_Y));
      setCurrentY(newY);
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;

      setIsDragging(false);

      // Determinar si debe cerrarse o abrirse completamente
      if (currentY < SNAP_THRESHOLD) {
        // Cerrar el panel
        setIsOpen(false);
        setCurrentY(0);
        onClose();
      } else {
        // Abrir completamente
        setIsOpen(true);
        setCurrentY(MAX_Y);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStartY, currentY, onClose]);

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setDragStartY(clientY);
    if (!isOpen) {
      setCurrentY(0);
    } else {
      setCurrentY(MAX_Y);
    }
  };

  const openPanel = () => {
    setIsOpen(true);
    setCurrentY(MAX_Y);
  };

  const closePanel = () => {
    setIsOpen(false);
    setCurrentY(0);
    onClose();
  };

  const togglePanel = () => {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  };

  return {
    isOpen,
    isDragging,
    currentY,
    panelRef,
    handleDragStart,
    openPanel,
    closePanel,
    togglePanel,
    PANEL_HEIGHT
  };
};