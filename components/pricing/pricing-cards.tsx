'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PLAN_LIMITS, PLAN_PRICES, type PlanKey } from '@/lib/constants'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'

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

// Step indicator
function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div
        className={`flex items-center gap-2 text-sm font-medium ${current >= 1 ? 'text-primary' : 'text-muted-foreground'
          }`}
      >
        <span
          className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${current >= 1
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
            }`}
        >
          1
        </span>
        Select Plan
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <div
        className={`flex items-center gap-2 text-sm font-medium ${current >= 2 ? 'text-primary' : 'text-muted-foreground'
          }`}
      >
        <span
          className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${current >= 2
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
            }`}
        >
          2
        </span>
        Payment
      </div>
    </div>
  )
}

export function PricingCards({
  currentPlan,
  isLoggedIn,
}: {
  currentPlan?: string
  isLoggedIn: boolean
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null)
  const [loading, setLoading] = useState(false)

  function handleSelectPlan(plan: PlanKey) {
    setSelectedPlan(plan)
    setStep(2)
  }

  function handleBack() {
    setStep(1)
    setSelectedPlan(null)
  }

  async function handleStripeCheckout(plan: PlanKey) {
    setLoading(true)
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
      setLoading(false)
    }
  }

  // Step 2: Payment confirmation
  if (step === 2 && selectedPlan) {
    const planInfo = plans.find((p) => p.key === selectedPlan)!
    const { monthly, monthlyKrw, label } = PLAN_PRICES[selectedPlan]

    return (
      <div className="w-full max-w-lg mx-auto">
        <StepIndicator current={2} />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to plans
        </Button>

        {/* Selected plan summary */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{planInfo.icon}</span>
                <CardTitle className="text-xl">{label} Plan</CardTitle>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${monthly}</div>
                <div className="text-sm text-muted-foreground">
                  ₩{monthlyKrw.toLocaleString()}/월
                </div>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <ul className="grid grid-cols-2 gap-2">
              {planInfo.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Checkout button */}
        <Button
          className="w-full h-14 cursor-pointer text-base"
          disabled={loading}
          onClick={() => handleStripeCheckout(selectedPlan)}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <CreditCard className="h-5 w-5 mr-2" />
          )}
          Proceed to Checkout — ${monthly}/mo
        </Button>
      </div>
    )
  }

  // Plan selection (Step 2 checkout flow is preserved in code but disabled in UI)
  return (
    <div className="w-full max-w-6xl">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(({ key, icon, description, featured, features }) => {
          const { monthly, monthlyKrw, label } = PLAN_PRICES[key]
          const isCurrent = currentPlan === key

          return (
            <Card
              key={key}
              className={`relative flex flex-col transition-all duration-200 hover:shadow-md ${featured
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

              <CardFooter className="pt-2">
                {isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : key === 'free' ? (
                  <Button variant="ghost" className="w-full" disabled>
                    Default
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    Coming Soon
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
