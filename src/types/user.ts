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
  [USER_ROLES.WHITE]: {
    canUseWhiteMode: true,
    canUseDarkMode: false,
    canUseShinyMode: false,
    canBuyShinyRolls: false
  },
  [USER_ROLES.DARK]: {
    canUseWhiteMode: true,
    canUseDarkMode: true,
    canUseShinyMode: false,
    canBuyShinyRolls: true
  },
  [USER_ROLES.SHINY]: {
    canUseWhiteMode: true,
    canUseDarkMode: true,
    canUseShinyMode: true,
    canBuyShinyRolls: true
  }
};

export const ROLE_PRICES = {
  SHINY_ROLL: 500, // $500 pesos argentinos
  UPGRADE_TO_DARK: 1000, // $1000 para upgrade de white a dark
  UPGRADE_TO_SHINY: 2000  // $2000 para upgrade a shiny permanente
} as const;