import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { PricingCards } from '@/components/pricing/pricing-cards'
import { createClient } from '@/lib/supabase/server'
import { MessageCircle, Sparkles } from 'lucide-react'

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
        {/* Interest banner */}
        <div className="w-full max-w-2xl rounded-lg border border-primary/20 bg-primary/5 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">Interested in premium plans?</span>
          </div>
          <p className="text-sm text-muted-foreground">
            If you find this useful and want more generations, let us know! <br />
            When enough people are interested, we&apos;ll open up paid plans.
            <br />Reach out at{' '}
            <a
              href="mailto:crayonzgrim@gmail.com"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              crayonzgrim@gmail.com
            </a>
          </p>
        </div>

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
            Start for free. <br /> Upgrade when you need more generations. <br />No hidden
            fees, cancel anytime.
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
