export type PlanKey = 'free' | 'silver' | 'gold' | 'platinum'

export const PLAN_LIMITS: Record<PlanKey, number> = {
  free: 2,
  silver: 10,
  gold: 30,
  platinum: 100,
}

export const PLAN_PRICES: Record<
  PlanKey,
  {
    monthly: number
    monthlyKrw: number
    label: string
    stripePriceId?: string
  }
> = {
  free: { monthly: 0, monthlyKrw: 0, label: 'Free' },
  silver: {
    monthly: 9.99,
    monthlyKrw: 13900,
    label: 'Silver',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SILVER,
  },
  gold: {
    monthly: 29.99,
    monthlyKrw: 39900,
    label: 'Gold',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GOLD,
  },
  platinum: {
    monthly: 79.99,
    monthlyKrw: 109900,
    label: 'Platinum',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLATINUM,
  },
}

export function getPlanLimit(plan: string): number {
  return PLAN_LIMITS[plan as PlanKey] ?? PLAN_LIMITS.free
}
