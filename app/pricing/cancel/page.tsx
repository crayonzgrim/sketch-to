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
