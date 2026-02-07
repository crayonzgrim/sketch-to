export const PLAN_LIMITS: Record<string, number> = {
  free: 2,
  silver: 10,
  gold: 30,
  platinum: 100,
}

export const PLAN_PRICES: Record<string, { monthly: number; label: string }> = {
  free: { monthly: 0, label: 'Free' },
  silver: { monthly: 9.99, label: 'Silver' },
  gold: { monthly: 29.99, label: 'Gold' },
  platinum: { monthly: 79.99, label: 'Platinum' },
}

export function getPlanLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}
