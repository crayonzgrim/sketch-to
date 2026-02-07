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
      const res = await fetch(
        `https://api.tosspayments.com/v1/billing/${sub.external_subscription_id}`,
        {
          method: 'POST',
          headers: {
            Authorization: TOSS_AUTH,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerKey: sub.external_customer_id,
            amount: priceInfo.monthlyKrw,
            orderId: `renewal_${Date.now()}_${sub.plan}`,
            orderName: `SketchTo ${priceInfo.label} Plan (Renewal)`,
          }),
        }
      )

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
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id)
      }
    } catch {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id)
    }
  }

  return NextResponse.json({ renewed, total: expiredSubs.length })
}
