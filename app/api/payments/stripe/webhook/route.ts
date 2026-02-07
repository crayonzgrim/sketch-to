import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getPeriodDates() {
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)
  return {
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan
      if (!userId || !plan) break

      const period = getPeriodDates()

      await supabaseAdmin.from('subscriptions').insert({
        user_id: userId,
        plan,
        provider: 'stripe',
        status: 'active',
        external_customer_id: session.customer as string,
        external_subscription_id: session.subscription as string,
        ...period,
      })
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId =
        invoice.parent?.subscription_details?.subscription as string | undefined
      if (!subscriptionId) break

      const period = getPeriodDates()

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          ...period,
          updated_at: new Date().toISOString(),
        })
        .eq('external_subscription_id', subscriptionId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId =
        invoice.parent?.subscription_details?.subscription as string | undefined
      if (!subscriptionId) break
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('external_subscription_id', subscriptionId)
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
