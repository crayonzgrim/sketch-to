'use client'

import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
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
        </div>
      </div>
    </header>
  )
}