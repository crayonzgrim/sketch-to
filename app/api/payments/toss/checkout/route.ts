import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_PRICES, type PlanKey } from '@/lib/constants'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
