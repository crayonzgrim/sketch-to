# Pricing Payment Integration (Stripe + Toss Payments)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the /pricing page with real payment integration supporting international (Stripe) and domestic Korean (Toss Payments) subscriptions.

**Architecture:** Hosted Checkout approach for both providers. Stripe handles subscriptions natively (auto-renewal). Toss uses billing key issuance + server-side recurring charges via Vercel Cron. Both providers send webhook events to update `subscriptions` table, which triggers `profiles.plan` sync.

**Tech Stack:** Next.js 16 (App Router), Stripe (`stripe` npm), Toss Payments SDK (script tag + REST API), Supabase (PostgreSQL + RLS), Vercel Cron

---

## Task 1: Install Dependencies & Configure Environment

**Files:**
- Modify: `package.json`
- Modify: `.env.local`

**Step 1: Install Stripe package**

Run:
```bash
cd /Volumes/SSD/crayonzgrim-dev/project/sketch-to && npm install stripe
```

**Step 2: Add environment variables to `.env.local`**

Append to `.env.local`:
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_PLACEHOLDER
STRIPE_WEBHOOK_SECRET=whsec_PLACEHOLDER
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_PLACEHOLDER

# Toss Payments
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_PLACEHOLDER
TOSS_SECRET_KEY=test_sk_PLACEHOLDER
```

> Note: User must replace PLACEHOLDER values with real keys from Stripe Dashboard and Toss Payments Developer Center.

**Step 3: Commit**

```bash
git add package.json package-lock.json .env.local
git commit -m "chore: add stripe dependency and payment env vars"
```

---

## Task 2: Database Migration — subscriptions table + trigger

**Files:**
- Create: `supabase/migrations/002_subscriptions.sql`

**Step 1: Write the migration file**

```sql
-- ENUM types
CREATE TYPE subscription_plan AS ENUM ('silver', 'gold', 'platinum');
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'past_due', 'cancelled', 'expired');
CREATE TYPE payment_provider AS ENUM ('stripe', 'toss');

-- subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  provider payment_provider NOT NULL,
  status subscription_status NOT NULL DEFAULT 'pending',
  external_customer_id TEXT NOT NULL,
  external_subscription_id TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only 1 active subscription per user
CREATE UNIQUE INDEX uniq_active_subscription
  ON subscriptions (user_id)
  WHERE status IN ('pending', 'active', 'past_due');

-- RLS: SELECT only own subscription
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies → only Service Role Key can write

-- Trigger: sync profiles.plan from subscriptions
CREATE OR REPLACE FUNCTION sync_profile_plan()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE profiles SET plan = NEW.plan::text, updated_at = now()
    WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('cancelled', 'expired') THEN
    UPDATE profiles SET plan = 'free', updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_profile_plan();
```

**Step 2: Run this migration in Supabase SQL Editor or via CLI**

Copy the SQL above and execute it in the Supabase Dashboard > SQL Editor.

**Step 3: Commit**

```bash
git add supabase/migrations/002_subscriptions.sql
git commit -m "feat: add subscriptions table with ENUM types, RLS, and plan sync trigger"
```

---

## Task 3: Update constants — KRW prices + Stripe Price IDs

**Files:**
- Modify: `lib/constants.ts`

**Step 1: Update constants with KRW prices and Stripe price IDs**

Replace `lib/constants.ts` with:

```typescript
export type PlanKey = 'free' | 'silver' | 'gold' | 'platinum'

export const PLAN_LIMITS: Record<PlanKey, number> = {
  free: 2,
  silver: 10,
  gold: 30,
  platinum: 100,
}

export const PLAN_PRICES: Record<PlanKey, {
  monthly: number
  monthlyKrw: number
  label: string
  stripePriceId?: string
}> = {
  free: { monthly: 0, monthlyKrw: 0, label: 'Free' },
  silver: {
    monthly: 9.99,
    monthlyKrw: 9900,
    label: 'Silver',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SILVER,
  },
  gold: {
    monthly: 29.99,
    monthlyKrw: 29900,
    label: 'Gold',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GOLD,
  },
  platinum: {
    monthly: 79.99,
    monthlyKrw: 79900,
    label: 'Platinum',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLATINUM,
  },
}

export function getPlanLimit(plan: string): number {
  return PLAN_LIMITS[plan as PlanKey] ?? PLAN_LIMITS.free
}
```

> Note: Stripe Price IDs must be created in Stripe Dashboard > Products > Add Product > Add Price (Recurring/Monthly). Then add the IDs to `.env.local`:
> ```
> NEXT_PUBLIC_STRIPE_PRICE_SILVER=price_xxx
> NEXT_PUBLIC_STRIPE_PRICE_GOLD=price_xxx
> NEXT_PUBLIC_STRIPE_PRICE_PLATINUM=price_xxx
> ```

**Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add KRW prices and Stripe price IDs to plan constants"
```

---

## Task 4: Stripe Checkout API Route

**Files:**
- Create: `app/api/payments/stripe/checkout/route.ts`

**Step 1: Write the Stripe checkout session creation endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { PLAN_PRICES, type PlanKey } from '@/lib/constants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = (await req.json()) as { plan: PlanKey }

  const priceInfo = PLAN_PRICES[plan]
  if (!priceInfo || !priceInfo.stripePriceId || plan === 'free') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceInfo.stripePriceId, quantity: 1 }],
    success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing/cancel`,
    customer_email: user.email,
    metadata: {
      supabase_user_id: user.id,
      plan,
    },
  })

  return NextResponse.json({ url: session.url })
}
```

**Step 2: Commit**

```bash
git add app/api/payments/stripe/checkout/route.ts
git commit -m "feat: add Stripe checkout session API route"
```

---

## Task 5: Stripe Webhook Handler

**Files:**
- Create: `app/api/payments/stripe/webhook/route.ts`

**Step 1: Write the Stripe webhook handler**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use service role for writing to subscriptions (RLS bypass)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan
      if (!userId || !plan) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

      await supabaseAdmin.from('subscriptions').insert({
        user_id: userId,
        plan,
        provider: 'stripe',
        status: 'active',
        external_customer_id: session.customer as string,
        external_subscription_id: session.subscription as string,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string
      if (!subscriptionId) break

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('external_subscription_id', subscriptionId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('external_subscription_id', invoice.subscription as string)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('external_subscription_id', subscription.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

**Step 2: Commit**

```bash
git add app/api/payments/stripe/webhook/route.ts
git commit -m "feat: add Stripe webhook handler for subscription lifecycle"
```

---

## Task 6: Toss Payments Checkout API Route (Billing Key)

**Files:**
- Create: `app/api/payments/toss/checkout/route.ts`

**Step 1: Write the Toss billing auth preparation endpoint**

For Toss subscriptions, we use the billing key approach:
1. Frontend calls `payment.requestBillingAuth()` to open auth window
2. User authenticates → redirected to callback with `authKey`
3. Server issues billing key → makes first charge → stores subscription

This API route returns the data needed for the frontend to call `requestBillingAuth`.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_PRICES, type PlanKey } from '@/lib/constants'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = (await req.json()) as { plan: PlanKey }

  const priceInfo = PLAN_PRICES[plan]
  if (!priceInfo || plan === 'free') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const origin = req.headers.get('origin') ?? 'http://localhost:3000'
  const customerKey = `cust_${user.id.replace(/-/g, '').slice(0, 20)}`
  const orderId = `order_${randomUUID().replace(/-/g, '').slice(0, 20)}`

  return NextResponse.json({
    customerKey,
    orderId,
    orderName: `SketchTo ${priceInfo.label} Plan`,
    amount: priceInfo.monthlyKrw,
    plan,
    successUrl: `${origin}/api/payments/toss/callback?plan=${plan}`,
    failUrl: `${origin}/pricing/cancel`,
  })
}
```

**Step 2: Commit**

```bash
git add app/api/payments/toss/checkout/route.ts
git commit -m "feat: add Toss billing auth preparation API route"
```

---

## Task 7: Toss Payments Callback — Billing Key Issuance + First Charge

**Files:**
- Create: `app/api/payments/toss/callback/route.ts`

**Step 1: Write the Toss callback that issues billing key and charges**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { PLAN_PRICES, type PlanKey } from '@/lib/constants'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TOSS_SECRET = process.env.TOSS_SECRET_KEY!
const TOSS_AUTH = `Basic ${Buffer.from(TOSS_SECRET + ':').toString('base64')}`

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const authKey = searchParams.get('authKey')
  const customerKey = searchParams.get('customerKey')
  const plan = searchParams.get('plan') as PlanKey

  if (!authKey || !customerKey || !plan) {
    return NextResponse.redirect(new URL('/pricing/cancel', req.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/pricing/cancel', req.url))
  }

  const priceInfo = PLAN_PRICES[plan]
  if (!priceInfo || plan === 'free') {
    return NextResponse.redirect(new URL('/pricing/cancel', req.url))
  }

  try {
    // 1. Issue billing key
    const billingRes = await fetch(`https://api.tosspayments.com/v1/billing/authorizations/${authKey}`, {
      method: 'POST',
      headers: { Authorization: TOSS_AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerKey }),
    })

    if (!billingRes.ok) throw new Error('Billing key issuance failed')
    const billingData = await billingRes.json()
    const billingKey = billingData.billingKey

    // 2. First charge
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const chargeRes = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
      method: 'POST',
      headers: { Authorization: TOSS_AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerKey,
        amount: priceInfo.monthlyKrw,
        orderId: `sub_${Date.now()}_${plan}`,
        orderName: `SketchTo ${priceInfo.label} Plan (Monthly)`,
      }),
    })

    if (!chargeRes.ok) throw new Error('First charge failed')

    // 3. Store subscription
    await supabaseAdmin.from('subscriptions').insert({
      user_id: user.id,
      plan,
      provider: 'toss',
      status: 'active',
      external_customer_id: customerKey,
      external_subscription_id: billingKey,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })

    return NextResponse.redirect(new URL('/pricing/success', req.url))
  } catch {
    return NextResponse.redirect(new URL('/pricing/cancel', req.url))
  }
}
```

**Step 2: Commit**

```bash
git add app/api/payments/toss/callback/route.ts
git commit -m "feat: add Toss billing key issuance and first charge callback"
```

---

## Task 8: Subscription Cancel API Route

**Files:**
- Create: `app/api/subscriptions/cancel/route.ts`

**Step 1: Write the subscription cancellation endpoint**

```typescript
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'past_due'])
    .single()

  if (!sub) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
  }

  if (sub.provider === 'stripe') {
    await stripe.subscriptions.cancel(sub.external_subscription_id)
    // Stripe webhook will update the status
  } else {
    // Toss: no auto-cancel API, just mark as cancelled
    // The cron job will skip cancelled subscriptions
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id)
  }

  return NextResponse.json({ success: true })
}
```

**Step 2: Commit**

```bash
git add app/api/subscriptions/cancel/route.ts
git commit -m "feat: add subscription cancel API route for Stripe and Toss"
```

---

## Task 9: Toss Recurring Billing Cron (Vercel Cron)

**Files:**
- Create: `app/api/cron/toss-billing/route.ts`
- Modify: `vercel.json` (create if not exists)

**Step 1: Write the Toss monthly billing cron handler**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PLAN_PRICES, type PlanKey } from '@/lib/constants'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TOSS_SECRET = process.env.TOSS_SECRET_KEY!
const TOSS_AUTH = `Basic ${Buffer.from(TOSS_SECRET + ':').toString('base64')}`

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find Toss subscriptions that need renewal (period ended)
  const now = new Date().toISOString()
  const { data: expiredSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('provider', 'toss')
    .in('status', ['active'])
    .lte('current_period_end', now)

  if (!expiredSubs?.length) {
    return NextResponse.json({ renewed: 0 })
  }

  let renewed = 0
  for (const sub of expiredSubs) {
    const priceInfo = PLAN_PRICES[sub.plan as PlanKey]
    if (!priceInfo) continue

    try {
      const res = await fetch(`https://api.tosspayments.com/v1/billing/${sub.external_subscription_id}`, {
        method: 'POST',
        headers: { Authorization: TOSS_AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerKey: sub.external_customer_id,
          amount: priceInfo.monthlyKrw,
          orderId: `renewal_${Date.now()}_${sub.plan}`,
          orderName: `SketchTo ${priceInfo.label} Plan (Renewal)`,
        }),
      })

      const periodStart = new Date()
      const periodEnd = new Date()
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      if (res.ok) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id)
        renewed++
      } else {
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('id', sub.id)
      }
    } catch {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('id', sub.id)
    }
  }

  return NextResponse.json({ renewed, total: expiredSubs.length })
}
```

**Step 2: Create `vercel.json` for cron schedule**

```json
{
  "crons": [
    {
      "path": "/api/cron/toss-billing",
      "schedule": "0 0 * * *"
    }
  ]
}
```

> Runs daily at midnight UTC. Vercel Hobby plan allows 1 cron job for free.
> Add `CRON_SECRET` to `.env.local` and Vercel environment variables.

**Step 3: Commit**

```bash
git add app/api/cron/toss-billing/route.ts vercel.json
git commit -m "feat: add Toss monthly billing renewal cron job"
```

---

## Task 10: Update Pricing Cards UI with Payment Buttons

**Files:**
- Modify: `components/pricing/pricing-cards.tsx`

**Step 1: Rewrite pricing cards with Stripe and Toss checkout buttons**

```tsx
'use client'

import { useState } from 'react'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
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
        requestBillingAuth: (method: string, opts: Record<string, unknown>) => Promise<void>
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
              <CardDescription className="text-sm">{description}</CardDescription>

              <div className="pt-3">
                {monthly === 0 ? (
                  <span className="text-4xl font-bold tracking-tight">Free</span>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight">
                        ${monthly}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
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
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
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
                <Button variant={featured ? 'default' : 'outline'} className="w-full" disabled>
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
                    토스 결제
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
```

**Step 2: Commit**

```bash
git add components/pricing/pricing-cards.tsx
git commit -m "feat: update pricing cards with Stripe and Toss checkout buttons"
```

---

## Task 11: Update Pricing Page — Pass `isLoggedIn` + Toss SDK Script

**Files:**
- Modify: `app/pricing/page.tsx`

**Step 1: Update pricing page to pass isLoggedIn and load Toss SDK**

```tsx
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { PricingCards } from '@/components/pricing/pricing-cards'
import { createClient } from '@/lib/supabase/server'
import { Sparkles } from 'lucide-react'
import Script from 'next/script'

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentPlan: string | undefined
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    currentPlan = profile?.plan
  }

  return (
    <div className="min-h-screen bg-background">
      <Script src="https://js.tosspayments.com/v2/standard" strategy="beforeInteractive" />
      <Header />
      <main className="flex flex-col items-center gap-12 py-20 px-4">
        <div className="text-center space-y-4 max-w-2xl">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Pricing
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            Start for free. Upgrade when you need more generations.
            No hidden fees, cancel anytime.
          </p>
        </div>
        <PricingCards currentPlan={currentPlan} isLoggedIn={!!user} />
        <p className="text-sm text-muted-foreground text-center max-w-md">
          All plans include access to every style. <br />
          Usage resets daily at midnight UTC.
        </p>
      </main>
      <Footer />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/pricing/page.tsx
git commit -m "feat: load Toss SDK and pass isLoggedIn to pricing cards"
```

---

## Task 12: Success and Cancel Pages

**Files:**
- Create: `app/pricing/success/page.tsx`
- Create: `app/pricing/cancel/page.tsx`

**Step 1: Write success page**

```tsx
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex flex-col items-center justify-center gap-6 py-32 px-4 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h1 className="text-3xl font-bold">Payment Successful!</h1>
        <p className="text-muted-foreground max-w-md">
          Your subscription is now active. Enjoy your upgraded plan with more daily generations.
        </p>
        <Button asChild>
          <Link href="/">Start Creating</Link>
        </Button>
      </main>
      <Footer />
    </div>
  )
}
```

**Step 2: Write cancel page**

```tsx
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex flex-col items-center justify-center gap-6 py-32 px-4 text-center">
        <XCircle className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-3xl font-bold">Payment Cancelled</h1>
        <p className="text-muted-foreground max-w-md">
          Your payment was not completed. You can try again anytime.
        </p>
        <Button variant="outline" asChild>
          <Link href="/pricing">Back to Pricing</Link>
        </Button>
      </main>
      <Footer />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/pricing/success/page.tsx app/pricing/cancel/page.tsx
git commit -m "feat: add payment success and cancel pages"
```

---

## Task 13: Add Subscription Management to Header

**Files:**
- Modify: `components/header.tsx`

**Step 1: Add "Manage Subscription" menu item and cancel functionality**

In the Header component's DropdownMenuContent, add a "Manage Subscription" item between "Pricing" and "Sign out":

```tsx
// After the existing Pricing menu item, add:
<DropdownMenuItem
  onClick={async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will be downgraded to the Free plan.')) return
    const res = await fetch('/api/subscriptions/cancel', { method: 'POST' })
    if (res.ok) {
      alert('Subscription cancelled successfully.')
      router.refresh()
    } else {
      alert('Failed to cancel subscription.')
    }
  }}
>
  Cancel Subscription
</DropdownMenuItem>
```

> This is a minimal approach. A full subscription management page can be added later.

**Step 2: Commit**

```bash
git add components/header.tsx
git commit -m "feat: add cancel subscription option to header dropdown"
```

---

## Task 14: Build Verification

**Step 1: Run build to verify no TypeScript errors**

```bash
cd /Volumes/SSD/crayonzgrim-dev/project/sketch-to && npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Fix any build errors if they arise**

**Step 3: Final commit if fixes were needed**

```bash
git add -A && git commit -m "fix: resolve build errors"
```

---

## Summary of Files Created/Modified

| Action | File |
|--------|------|
| Create | `supabase/migrations/002_subscriptions.sql` |
| Create | `app/api/payments/stripe/checkout/route.ts` |
| Create | `app/api/payments/stripe/webhook/route.ts` |
| Create | `app/api/payments/toss/checkout/route.ts` |
| Create | `app/api/payments/toss/callback/route.ts` |
| Create | `app/api/subscriptions/cancel/route.ts` |
| Create | `app/api/cron/toss-billing/route.ts` |
| Create | `app/pricing/success/page.tsx` |
| Create | `app/pricing/cancel/page.tsx` |
| Create | `vercel.json` |
| Modify | `lib/constants.ts` |
| Modify | `components/pricing/pricing-cards.tsx` |
| Modify | `app/pricing/page.tsx` |
| Modify | `components/header.tsx` |
| Modify | `package.json` (npm install stripe) |
| Modify | `.env.local` (add payment env vars) |

## Post-Implementation Checklist

- [ ] Create Stripe products/prices in Stripe Dashboard (test mode)
- [ ] Add real Stripe keys to `.env.local`
- [ ] Set up Stripe webhook endpoint in Dashboard pointing to `/api/payments/stripe/webhook`
- [ ] Create Toss Payments test account and get client/secret keys
- [ ] Run SQL migration in Supabase Dashboard
- [ ] Add `CRON_SECRET` to Vercel environment variables
- [ ] Test Stripe checkout flow end-to-end
- [ ] Test Toss checkout flow end-to-end
- [ ] Test subscription cancellation
