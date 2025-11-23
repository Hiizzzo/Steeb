import rawPlans from '../../config/paymentPlans.json';

export interface PaymentPlan {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  trialDays?: number;
  mostPopular?: boolean;
}

const PAYMENT_PLANS = rawPlans as PaymentPlan[];
const PAYMENT_PLAN_MAP = PAYMENT_PLANS.reduce<Record<string, PaymentPlan>>((acc, plan) => {
  acc[plan.id] = plan;
  return acc;
}, {});

export const DARK_MODE_PLAN_ID = 'black-user-plan';

export const getPaymentPlan = (planId: string): PaymentPlan | undefined => {
  return PAYMENT_PLAN_MAP[planId];
};

export const getAllPaymentPlans = (): PaymentPlan[] => PAYMENT_PLANS;

export const formatPlanPrice = (
  plan: PaymentPlan,
  locale = 'es-AR'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: plan.currency || 'ARS'
    }).format(plan.price);
  } catch {
    return `${plan.price} ${plan.currency || 'ARS'}`;
  }
};

export const DARK_MODE_PLAN = getPaymentPlan(DARK_MODE_PLAN_ID);
