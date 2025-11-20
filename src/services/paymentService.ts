import type { PaymentPlan } from '@/config/paymentPlans';

const sanitizeBaseUrl = (url?: string | null): string | null => {
  if (!url) return null;
  return url.replace(/\/+$/, '');
};

const apiBaseUrl = sanitizeBaseUrl(import.meta.env.VITE_API_URL);
const BASE_PATH = apiBaseUrl ? `${apiBaseUrl}/payments` : '/api/payments';
const buildUrl = (path: string) => `${BASE_PATH}${path}`;

export interface CreatePreferenceInput {
  planId: string;
  quantity?: number;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
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
  const response = await fetch(buildUrl('/create-preference'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleResponse<CreatePreferenceResponse>(response);
};

export const verifyPayment = async (
  payload: VerifyPaymentInput
): Promise<PaymentRecord & { message?: string }> => {
  const response = await fetch(buildUrl('/verify'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleResponse(response);
};

export const getPaymentStatus = async (params: {
  planId: string;
  userId?: string | null;
  email?: string | null;
}): Promise<PaymentStatusResponse> => {
  const searchParams = new URLSearchParams({ planId: params.planId });
  if (params.userId) {
    searchParams.append('userId', params.userId);
  }
  if (params.email) {
    searchParams.append('email', params.email);
  }

  const response = await fetch(buildUrl(`/status?${searchParams.toString()}`));
  return handleResponse(response);
};
