import type { PaymentPlan } from '@/config/paymentPlans';

// Usar la URL correcta del backend sin doble /api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://v0-steeb-api-backend-production.up.railway.app/api';
const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

export interface CreatePreferenceInput {
  planId: string;
  quantity?: number;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
}

export interface CreatePreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
  externalReference: string;
  plan: PaymentPlan;
}

export interface VerifyPaymentInput {
  paymentId?: string | null;
  preferenceId?: string | null;
  externalReference?: string | null;
}

export interface PaymentRecord {
  paymentId: string;
  status: string;
  statusDetail?: string;
  planId: string;
  userId?: string | null;
  email?: string | null;
  externalReference?: string | null;
  preferenceId?: string | null;
  amount?: number;
  currency?: string;
  installments?: number;
  paymentMethod?: string | null;
  paymentType?: string | null;
  processedAt?: string;
  approvedAt?: string | null;
}

export interface PaymentStatusResponse {
  active: boolean;
  records: PaymentRecord[];
  lastRecord: PaymentRecord | null;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = (data as any)?.error || response.statusText || 'Error en la solicitud';
    throw new Error(typeof errorMessage === 'string' ? errorMessage : 'Error en la solicitud');
  }
  return data as T;
};

export const createCheckoutPreference = async (
  payload: CreatePreferenceInput
): Promise<CreatePreferenceResponse> => {
  if (!payload.userId || payload.userId === 'anon') {
    throw new Error('User ID is required for payment');
  }

  const response = await fetch(buildUrl('/payments/create-preference'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  return handleResponse<CreatePreferenceResponse>(response);
};

export const verifyPayment = async (
  payload: VerifyPaymentInput
): Promise<PaymentRecord & { message?: string }> => {
  const response = await fetch(buildUrl('/payments/verify'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
};

// Nuevo método para verificar rol del usuario (reemplaza a getPaymentStatus)
export interface UserRoleResponse {
  role: 'free' | 'premium';
  permissions: string[];
  shinyRolls?: number;
  tipoUsuario?: string;
  darkClubNumber?: number | null;
  darkModeUnlockedAt?: string | null;
  darkModeEnabled?: boolean;
  darkWelcomeMessageVersion?: number | null;
}

const mapTipoUsuarioToRole = (tipoUsuario?: string): 'free' | 'premium' => {
  if (!tipoUsuario) return 'free';
  const normalized = tipoUsuario.toLowerCase();
  const premiumTypes = ['black', 'dark', 'shiny', 'premium'];
  return premiumTypes.includes(normalized) ? 'premium' : 'free';
};

export const getUserRole = async (userId: string): Promise<UserRoleResponse> => {
  const response = await fetch(buildUrl(`/users/role?userId=${userId}`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });

  const data = await handleResponse<any>(response);
  const tipoUsuario = data.data?.tipoUsuario;

  return {
    role: mapTipoUsuarioToRole(tipoUsuario),
    permissions: data.data?.permissions || [],
    shinyRolls: data.data?.shinyRolls || 0,
    tipoUsuario,
    darkClubNumber: data.data?.darkClubNumber ?? null,
    darkModeUnlockedAt: data.data?.darkModeUnlockedAt ?? null,
    darkModeEnabled: data.data?.darkModeEnabled ?? false,
    darkWelcomeMessageVersion: data.data?.darkWelcomeMessageVersion ?? null
  };
};

// Método para consumir una tirada Shiny
export const consumeShinyRoll = async (userId: string): Promise<{ success: boolean; remainingRolls: number }> => {
  const response = await fetch(buildUrl('/users/consume-shiny-roll'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ userId })
  });

  const data = await handleResponse<any>(response);
  return {
    success: data.success,
    remainingRolls: data.data?.remainingRolls || 0
  };
};
