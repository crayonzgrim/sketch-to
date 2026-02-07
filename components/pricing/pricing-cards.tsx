'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Check, CreditCard, Loader2 } from 'lucide-react'
import { PLAN_LIMITS, PLAN_PRICES, type PlanKey } from '@/lib/constants'

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      payment: (opts: { customerKey: string }) => {
        requestBillingAuth: (
          method: string,
          opts: Record<string, unknown>
        ) => Promise<void>
      }
    }
  }
}

const plans: {
  key: PlanKey
  icon: string
  description: string
  featured: boolean
  features: string[]
}[] = [
  {
    key: 'free',
    icon: '🎨',
    description: 'Perfect for trying things out',
    featured: false,
    features: [
      `${PLAN_LIMITS.free} images per day`,
      'All styles available',
      'Standard quality',
    ],
  },
  {
    key: 'silver',
    icon: '🥈',
    description: 'For casual creators',
    featured: false,
    features: [
      `${PLAN_LIMITS.silver} images per day`,
      'All styles available',
      'High quality output',
      'Priority generation',
    ],
  },
  {
    key: 'gold',
    icon: '🥇',
    description: 'Best value for professionals',
    featured: true,
    features: [
      `${PLAN_LIMITS.gold} images per day`,
      'All styles available',
      'Highest quality output',
      'Priority generation',
      'Batch processing',
    ],
  },
  {
    key: 'platinum',
    icon: '💎',
    description: 'For teams and power users',
    featured: false,
    features: [
      `${PLAN_LIMITS.platinum} images per day`,
      'All styles available',
      'Highest quality output',
      'Priority generation',
      'Batch processing',
      'API access',
    ],
  },
]

export function PricingCards({
  currentPlan,
  isLoggedIn,
}: {
  currentPlan?: string
  isLoggedIn: boolean
}) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleStripeCheckout(plan: PlanKey) {
    setLoading(`stripe-${plan}`)
    try {
      const res = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Payment failed')
    } finally {
      setLoading(null)
    }
  }

  async function handleTossCheckout(plan: PlanKey) {
    setLoading(`toss-${plan}`)
    try {
      const res = await fetch('/api/payments/toss/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      const tossPayments = window.TossPayments?.(clientKey)
      if (!tossPayments) throw new Error('Toss SDK not loaded')

      const payment = tossPayments.payment({ customerKey: data.customerKey })
      await payment.requestBillingAuth('CARD', {
        amount: { currency: 'KRW', value: data.amount },
        orderId: data.orderId,
        orderName: data.orderName,
        successUrl: data.successUrl,
        failUrl: data.failUrl,
      })
    } catch (e) {
      if (e instanceof Error && e.message.includes('USER_CANCEL')) return
      alert(e instanceof Error ? e.message : 'Payment failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
      {plans.map(({ key, icon, description, featured, features }) => {
        const { monthly, monthlyKrw, label } = PLAN_PRICES[key]
        const isCurrent = currentPlan === key

        return (
          <Card
            key={key}
            className={`relative flex flex-col transition-all duration-200 hover:shadow-md ${
              featured
                ? 'border-primary shadow-lg ring-1 ring-primary/20 scale-[1.03]'
                : 'hover:-translate-y-1'
            } ${isCurrent ? 'ring-2 ring-primary/50' : ''}`}
          >
            {featured && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 shadow-sm">
                Most Popular
              </Badge>
            )}

            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{icon}</span>
                <CardTitle className="text-xl">{label}</CardTitle>
              </div>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>

              <div className="pt-3">
                {monthly === 0 ? (
                  <span className="text-4xl font-bold tracking-tight">
                    Free
                  </span>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight">
                        ${monthly}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /month
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ₩{monthlyKrw.toLocaleString()}/월
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            <Separator className="mx-6" />

            <CardContent className="flex-1 pt-6">
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col gap-2">
              {isCurrent ? (
                <Button variant="secondary" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : key === 'free' ? (
                <Button variant="ghost" className="w-full" disabled>
                  Default
                </Button>
              ) : !isLoggedIn ? (
                <Button
                  variant={featured ? 'default' : 'outline'}
                  className="w-full"
                  disabled
                >
                  Sign in to subscribe
                </Button>
              ) : (
                <>
                  <Button
                    variant={featured ? 'default' : 'outline'}
                    className="w-full cursor-pointer"
                    disabled={loading !== null}
                    onClick={() => handleStripeCheckout(key)}
                  >
                    {loading === `stripe-${key}` ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Pay with Card (International)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer"
                    disabled={loading !== null}
                    onClick={() => handleTossCheckout(key)}
                  >
                    {loading === `toss-${key}` ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <span className="mr-2 text-base">🇰🇷</span>
                    )}
                    국내 결제
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
