export type UserRole = 'white' | 'dark' | 'shiny';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  nickname: string;
  role: UserRole;
  avatar?: string;
  shinyRolls?: number;
  createdAt: Date;
  lastLoginAt: Date;
  // Tracking para límite diario de intentos Shiny
  lastShinyAttemptAt?: Date;
  shinyAttemptsToday?: number;
}

export interface UserAccess {
  canUseWhiteMode: boolean;
  canUseDarkMode: boolean;
  canUseShinyMode: boolean;
  canBuyShinyRolls: boolean;
}

export interface ShinyRoll {
  id: string;
  userId: string;
  purchasedAt: Date;
  used: boolean;
  usedAt?: Date;
  price: number; // en pesos argentinos o la moneda que definas
}

export const USER_ROLES = {
  WHITE: 'white' as UserRole,
  DARK: 'dark' as UserRole,
  SHINY: 'shiny' as UserRole
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, UserAccess> = {
  white: {
    canUseWhiteMode: true,
    canUseDarkMode: false,
    canUseShinyMode: false,
    canBuyShinyRolls: false
  },
  dark: {
    canUseWhiteMode: true,
    canUseDarkMode: true,
    canUseShinyMode: false,
    canBuyShinyRolls: true
  },
  shiny: {
    canUseWhiteMode: true,
    canUseDarkMode: true,
    canUseShinyMode: true,
    canBuyShinyRolls: true
  }
};

export const ROLE_PRICES = {
  SHINY_ROLL: 300, // $300 pesos argentinos por intento para adivinar el número
  UPGRADE_TO_DARK: 3000, // $3000 para upgrade de white a dark (incluye 1 intento gratis)
  UPGRADE_TO_SHINY: 300   // $300 por intento para adivinar número del 1 al 100
} as const;