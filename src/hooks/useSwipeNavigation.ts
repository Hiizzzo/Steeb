import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeNavigationConfig {
  threshold?: number;
  duration?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  onSwipe?: () => void;
  enableMouse?: boolean; // Nueva opción para habilitar/deshabilitar mouse events
}

export const useSwipeNavigation = (config: SwipeNavigationConfig = {}) => {
  const {
    threshold = 50, // Reducido para hacerlo más sensible
    duration = 800, // Aumentado para dar más tiempo
    direction = 'left',
    onSwipe,
    enableMouse = true // Habilitado por defecto para PC
  } = config;

  const navigate = useNavigate();
  const startTimeRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const isMouseDragRef = useRef<boolean>(false); // Para diferenciar mouse drag de touch

  const handleSwipe = useCallback(() => {
    // Navegar a la pantalla de inicio por defecto
    navigate('/');
    // Ejecutar callback personalizado si existe
    if (onSwipe) {
      onSwipe();
    }
  }, [navigate, onSwipe]);

  const handleTouchStart = useCallback((e: TouchEvent | MouseEvent) => {
    const isTouchEvent = 'touches' in e;

    if (!isTouchEvent) {
      // Mouse event - verificar que sea un clic izquierdo
      const mouseEvent = e as MouseEvent;
      if (mouseEvent.button !== 0) return; // Solo clic izquierdo

      isMouseDragRef.current = true;

      // Prevenir selección de texto durante el drag
      mouseEvent.preventDefault();
    } else {
      isMouseDragRef.current = false;
    }

    const clientX = isTouchEvent ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : (e as MouseEvent).clientY;

    startXRef.current = clientX;
    startYRef.current = clientY;
    startTimeRef.current = Date.now();
    setIsSwiping(true);
    setSwipeProgress(0);

    // Debug: Log del inicio del gesto
    console.log('🔥 STEEB Swipe: Gesto iniciado en', { clientX, clientY, direction, threshold, isMouse: !isTouchEvent });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isSwiping) return;

    const isTouchEvent = 'touches' in e;
    const clientX = isTouchEvent ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;

    // Si es mouse, prevenir comportamiento default del navegador
    if (!isTouchEvent && isMouseDragRef.current) {
      e.preventDefault();
    }

    let progress = 0;

    switch (direction) {
      case 'left':
        progress = Math.max(0, Math.min(1, -deltaX / threshold));
        break;
      case 'right':
        progress = Math.max(0, Math.min(1, deltaX / threshold));
        break;
      case 'up':
        progress = Math.max(0, Math.min(1, -deltaY / threshold));
        break;
      case 'down':
        progress = Math.max(0, Math.min(1, deltaY / threshold));
        break;
    }

    setSwipeProgress(progress);
  }, [isSwiping, threshold, direction]);

  const handleTouchEnd = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isSwiping) return;

    const isTouchEvent = 'changedTouches' in e;
    const clientX = isTouchEvent ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
    const clientY = isTouchEvent ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;

    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;
    const endTime = Date.now();
    const gestureDuration = endTime - startTimeRef.current;

    setIsSwiping(false);
    setSwipeProgress(0);

    // Resetear el estado de mouse drag
    isMouseDragRef.current = false;

    // Verificar si el gesto cumple con los criterios
    let isValidSwipe = false;

    switch (direction) {
      case 'left':
        isValidSwipe = -deltaX > threshold && gestureDuration <= duration;
        break;
      case 'right':
        isValidSwipe = deltaX > threshold && gestureDuration <= duration;
        break;
      case 'up':
        isValidSwipe = -deltaY > threshold && gestureDuration <= duration;
        break;
      case 'down':
        isValidSwipe = deltaY > threshold && gestureDuration <= duration;
        break;
    }

    // Debug: Log completo del análisis del gesto
    console.log('🔥 STEEB Swipe: Análisis del gesto', {
      deltaX,
      deltaY,
      threshold,
      gestureDuration,
      maxDuration: duration,
      direction,
      isValidSwipe,
      isMouse: !isTouchEvent
    });

    if (isValidSwipe) {
      console.log('🚀 STEEB Swipe: ¡Swipe válido! Navegando a inicio...');
      handleSwipe();
    } else {
      console.log('❌ STEEB Swipe: Swipe no válido', {
        motivo: !(-deltaX > threshold) ? 'distancia insuficiente' :
               !(gestureDuration <= duration) ? 'demasiado lento' : 'dirección incorrecta'
      });
    }
  }, [isSwiping, threshold, duration, direction, handleSwipe]);

  const SwipeHandler = useCallback(({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
      const element = document.documentElement; // Usar document.documentElement para capturar eventos en toda la página

      const touchStartHandler = (e: TouchEvent) => handleTouchStart(e);
      const touchMoveHandler = (e: TouchEvent) => handleTouchMove(e);
      const touchEndHandler = (e: TouchEvent) => handleTouchEnd(e);

      // Eventos táctiles para móviles
      element.addEventListener('touchstart', touchStartHandler, { passive: false });
      element.addEventListener('touchmove', touchMoveHandler, { passive: false });
      element.addEventListener('touchend', touchEndHandler, { passive: false });

      // Eventos de mouse para desktop (drag) - solo si está habilitado
      let mouseDownHandler: ((e: MouseEvent) => void) | null = null;
      let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
      let mouseUpHandler: ((e: MouseEvent) => void) | null = null;
      let mouseLeaveHandler: (() => void) | null = null;
      let contextMenuHandler: ((e: MouseEvent) => void) | null = null;
      let selectStartHandler: (() => void) | null = null;

      if (enableMouse) {
        // Guardar estilo original para restaurarlo después
        const originalUserSelect = document.body.style.userSelect;
        const originalCursor = document.body.style.cursor;

        mouseDownHandler = (e: MouseEvent) => handleTouchStart(e);
        mouseMoveHandler = (e: MouseEvent) => handleTouchMove(e);
        mouseUpHandler = (e: MouseEvent) => handleTouchEnd(e);

        // Prevenir menú contextual durante el swipe
        contextMenuHandler = (e: MouseEvent) => {
          if (isSwiping && isMouseDragRef.current) {
            e.preventDefault();
          }
        };

        // Prevenir selección de texto durante el swipe
        selectStartHandler = () => {
          if (isSwiping && isMouseDragRef.current) {
            return false;
          }
        };

        mouseLeaveHandler = () => {
          if (isSwiping) {
            setIsSwiping(false);
            setSwipeProgress(0);
            isMouseDragRef.current = false;
            // Restaurar estilos
            document.body.style.userSelect = originalUserSelect;
            document.body.style.cursor = originalCursor;
          }
        };

        // Agregar mouse events con mejor manejo de conflictos
        element.addEventListener('mousedown', mouseDownHandler, { passive: false });
        element.addEventListener('mousemove', mouseMoveHandler, { passive: false });
        element.addEventListener('mouseup', mouseUpHandler, { passive: false });
        element.addEventListener('mouseleave', mouseLeaveHandler);
        element.addEventListener('contextmenu', contextMenuHandler);
        document.addEventListener('selectstart', selectStartHandler);
      }

      return () => {
        element.removeEventListener('touchstart', touchStartHandler);
        element.removeEventListener('touchmove', touchMoveHandler);
        element.removeEventListener('touchend', touchEndHandler);

        if (enableMouse) {
          if (mouseDownHandler) element.removeEventListener('mousedown', mouseDownHandler);
          if (mouseMoveHandler) element.removeEventListener('mousemove', mouseMoveHandler);
          if (mouseUpHandler) element.removeEventListener('mouseup', mouseUpHandler);
          if (mouseLeaveHandler) element.removeEventListener('mouseleave', mouseLeaveHandler);
          if (contextMenuHandler) element.removeEventListener('contextmenu', contextMenuHandler);
          if (selectStartHandler) document.removeEventListener('selectstart', selectStartHandler);
        }
      };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd, enableMouse, isSwiping]);

    return <>{children}</>;
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enableMouse, isSwiping]);

  return {
    SwipeHandler,
    isSwiping,
    swipeProgress,
  };
};