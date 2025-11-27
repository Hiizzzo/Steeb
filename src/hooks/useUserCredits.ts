import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { DARK_MODE_PLAN_ID, getPaymentPlan } from '@/config/paymentPlans';
import { getUserRole, consumeShinyRoll, UserRoleResponse } from '@/services/paymentService';

interface UserCredits {
  hasDarkVersion: boolean;
  gamesPlayed: number;
  totalSpent: number;
  shinyRolls: number;
}

const STORAGE_KEY = 'stebe-user-credits';
const DARK_VERSION_PLAN = getPaymentPlan(DARK_MODE_PLAN_ID);
const DARK_VERSION_COST = DARK_VERSION_PLAN?.price ?? 0;

export const useUserCredits = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [userRoleDetails, setUserRoleDetails] = useState<UserRoleResponse | null>(null);

  const defaultCredits = useMemo<UserCredits>(() => ({
    hasDarkVersion: false,
    gamesPlayed: 0,
    totalSpent: 0,
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
          shinyRolls: parsed.shinyRolls ?? 0
        };
      }
      return {
        hasDarkVersion: false,
        gamesPlayed: 0,
        totalSpent: 0,
        shinyRolls: 0
      };
    } catch {
      return {
        hasDarkVersion: false,
        gamesPlayed: 0,
        totalSpent: 0,
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
      setUserRoleDetails(userRole);

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



  const canPlayGame = () => userCredits.hasDarkVersion;

  const canBuyDarkVersion = () => !userCredits.hasDarkVersion;

  const playGame = async () => {
    if (!canPlayGame()) return false;

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
        }
      } catch (error) {
        console.error('Error consumiendo tirada:', error);
        return false;
      }
    }

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
      shinyRolls: 0
    });
    setUserRoleDetails(null);
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
    userRoleDetails
  };
};
