'use client'

import { Sparkles, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export function Header() {
  const { data: session } = useSession()
  const [usage, setUsage] = useState<number>(0)

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/usage')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUsage(data.usage)
          }
        })
        .catch(console.error)
    }
  }, [session?.user?.id])

  return (
    <header className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={'/'} className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">SketchTo</span>
          <p className="ml-2 hidden text-sm text-muted-foreground sm:block">
            Sketch to Professional Image
          </p>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {usage}/3 today
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => signIn('github')}
              size="sm"
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}