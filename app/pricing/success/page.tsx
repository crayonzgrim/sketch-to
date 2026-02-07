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
          Your subscription is now active. Enjoy your upgraded plan with more
          daily generations.
        </p>
        <Button asChild>
          <Link href="/">Start Creating</Link>
        </Button>
      </main>
      <Footer />
    </div>
  )
}
