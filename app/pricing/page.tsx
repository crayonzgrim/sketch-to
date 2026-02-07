import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { PricingCards } from '@/components/pricing/pricing-cards'
import { createClient } from '@/lib/supabase/server'
import { Sparkles } from 'lucide-react'

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
        <PricingCards currentPlan={currentPlan} />
        <p className="text-sm text-muted-foreground text-center max-w-md">
          All plans include access to every style. <br />
          Usage resets daily at midnight UTC.
        </p>
      </main>
      <Footer />
    </div>
  )
}
