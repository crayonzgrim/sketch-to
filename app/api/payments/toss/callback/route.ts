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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/pricing/cancel', req.url))
  }

  const priceInfo = PLAN_PRICES[plan]
  if (!priceInfo || plan === 'free') {
    return NextResponse.redirect(new URL('/pricing/cancel', req.url))
  }

  try {
    // 1. Issue billing key
    const billingRes = await fetch(
      `https://api.tosspayments.com/v1/billing/authorizations/${authKey}`,
      {
        method: 'POST',
        headers: {
          Authorization: TOSS_AUTH,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerKey }),
      }
    )

    if (!billingRes.ok) throw new Error('Billing key issuance failed')
    const billingData = await billingRes.json()
    const billingKey = billingData.billingKey

    // 2. First charge
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const chargeRes = await fetch(
      `https://api.tosspayments.com/v1/billing/${billingKey}`,
      {
        method: 'POST',
        headers: {
          Authorization: TOSS_AUTH,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerKey,
          amount: priceInfo.monthlyKrw,
          orderId: `sub_${Date.now()}_${plan}`,
          orderName: `SketchTo ${priceInfo.label} Plan (Monthly)`,
        }),
      }
    )

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
