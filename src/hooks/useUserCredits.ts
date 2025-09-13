import { useState, useEffect } from 'react';

interface UserCredits {
  hasDarkVersion: boolean;
  gamesPlayed: number;
  totalSpent: number;
}

const STORAGE_KEY = 'stebe-user-credits';
const DARK_VERSION_COST = 1000;
const GAME_COST = 100;

export const useUserCredits = () => {
  const [userCredits, setUserCredits] = useState<UserCredits>({
    hasDarkVersion: false,
    gamesPlayed: 0,
    totalSpent: 0
  });

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setUserCredits(parsed);
      } catch (error) {
        console.error('Error parsing user credits data:', error);
      }
    }
  }, []);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userCredits));
  }, [userCredits]);



  const canPlay = () => {
    return userCredits.hasDarkVersion;
  };

  const canBuyDarkVersion = () => {
    return !userCredits.hasDarkVersion;
  };

  const playGame = () => {
    if (!canPlay()) return false;
    
    setUserCredits(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1
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
      totalSpent: 0
    });
  };

  return {
    userCredits,
    canPlay,
    canBuyDarkVersion,
    playGame,
    buyDarkVersion,
    resetUserData
  };
};