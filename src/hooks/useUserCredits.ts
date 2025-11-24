import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { DARK_MODE_PLAN_ID, getPaymentPlan } from '@/config/paymentPlans';
import { getUserRole, consumeShinyRoll } from '@/services/paymentService';

interface UserCredits {
  hasDarkVersion: boolean;
  gamesPlayed: number;
  totalSpent: number;
  lastShinyAttemptDate: string | null;
  shinyRolls: number;
}

const STORAGE_KEY = 'stebe-user-credits';
const DARK_VERSION_PLAN = getPaymentPlan(DARK_MODE_PLAN_ID);
const DARK_VERSION_COST = DARK_VERSION_PLAN?.price ?? 0;
const GAME_COST = 1;

export const useUserCredits = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const defaultCredits = useMemo<UserCredits>(() => ({
    hasDarkVersion: false,
    gamesPlayed: 0,
    totalSpent: 0,
    lastShinyAttemptDate: null,
    shinyRolls: 0
  }), []);

  const storageKey = useMemo(() => {
    if (user?.id) {
      return `${STORAGE_KEY}-${user.id}`;
    }
    return STORAGE_KEY;
  }, [user?.id]);

  const initialStorageKey = user?.id ? `${STORAGE_KEY}-${user.id}` : STORAGE_KEY;

  const [userCredits, setUserCredits] = useState<UserCredits>(() => {
    if (typeof window === 'undefined') return {
      hasDarkVersion: false,
      gamesPlayed: 0,
      totalSpent: 0,
      lastShinyAttemptDate: null,
      shinyRolls: 0
    };
    try {
      const savedData = window.localStorage.getItem(initialStorageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        return {
          hasDarkVersion: !!parsed.hasDarkVersion,
          gamesPlayed: parsed.gamesPlayed ?? 0,
          totalSpent: parsed.totalSpent ?? 0,
          lastShinyAttemptDate: parsed.lastShinyAttemptDate ?? null,
          shinyRolls: parsed.shinyRolls ?? 0
        };
      }
      return {
        hasDarkVersion: false,
        gamesPlayed: 0,
        totalSpent: 0,
        lastShinyAttemptDate: null,
        shinyRolls: 0
      };
    } catch {
      return {
        hasDarkVersion: false,
        gamesPlayed: 0,
        totalSpent: 0,
        lastShinyAttemptDate: null,
        shinyRolls: 0
      };
    }
  });

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setUserCredits(parsed);
      } catch (error) {
        console.error('Error parsing user credits data:', error);
        setUserCredits(defaultCredits);
      }
    } else {
      setUserCredits(defaultCredits);
    }
  }, [storageKey, defaultCredits]);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(storageKey, JSON.stringify(userCredits));
  }, [userCredits, storageKey]);

  const syncWithBackend = useCallback(async () => {
    if (!user?.id && !user?.email) {
      setSyncError('Necesitas iniciar sesión para sincronizar tus compras.');
      return false;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const userRole = await getUserRole(user?.id);

      setUserCredits(prev => ({
        ...prev,
        hasDarkVersion: userRole.role === 'premium',
        shinyRolls: userRole.shinyRolls || 0
      }));

      return userRole.role === 'premium';
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : 'No se pudo sincronizar con Mercado Pago'
      );
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (user?.id || user?.email) {
      syncWithBackend();
    }
  }, [syncWithBackend, user?.id, user?.email]);



  const getTodayKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const canPlayGame = () => {
    if (!userCredits.hasDarkVersion) return false;
    
    // Si tiene tiradas disponibles, puede jugar
    if (userCredits.shinyRolls > 0) return true;

    // Si no tiene tiradas, verificar si ya jugó hoy (para el intento diario gratuito)
    const todayKey = getTodayKey();
    return userCredits.lastShinyAttemptDate !== todayKey;
  };

  const canBuyDarkVersion = () => !userCredits.hasDarkVersion;

  const playGame = async () => {
    if (!canPlayGame()) return false;

    const todayKey = getTodayKey();
    
    // Si tiene tiradas disponibles, consumir una del backend
    if (userCredits.shinyRolls > 0 && user?.id) {
      try {
        const result = await consumeShinyRoll(user.id);
        if (result.success) {
          setUserCredits(prev => ({
            ...prev,
            gamesPlayed: prev.gamesPlayed + 1,
            shinyRolls: result.remainingRolls
          }));
          return true;
        }
      } catch (error) {
        console.error('Error consumiendo tirada:', error);
        // Fallback a comportamiento local si falla el backend
      }
    }

    // Comportamiento local (intento diario gratuito o fallback)
    setUserCredits(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      totalSpent: prev.totalSpent + GAME_COST,
      lastShinyAttemptDate: todayKey,
      shinyRolls: Math.max(0, prev.shinyRolls - 1)
    }));
    
    return true;
  };

  const buyDarkVersion = () => {
    if (!canBuyDarkVersion()) return false;
    
    setUserCredits(prev => ({
      ...prev,
      hasDarkVersion: true,
      totalSpent: prev.totalSpent + DARK_VERSION_COST
    }));
    
    return true;
  };

  const resetUserData = () => {
    setUserCredits({
      hasDarkVersion: false,
      gamesPlayed: 0,
      totalSpent: 0,
      lastShinyAttemptDate: null,
      shinyRolls: 0
    });
  };

  return {
    userCredits,
    plan: DARK_VERSION_PLAN,
    planId: DARK_MODE_PLAN_ID,
    isSyncing,
    syncError,
    canPlayGame,
    canBuyDarkVersion,
    playGame,
    buyDarkVersion,
    resetUserData,
    syncWithBackend,
    DARK_VERSION_COST,
    GAME_COST
  };
};
