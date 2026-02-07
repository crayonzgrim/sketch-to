'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { getPlanLimit, PLAN_PRICES } from '@/lib/constants'

export function UsageIndicator({ refreshKey }: { refreshKey?: number }) {
  const [usage, setUsage] = useState<{ used: number; limit: number; plan: string } | null>(null)

  useEffect(() => {
    const fetchUsage = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUsage(null)
        return
      }

      const today = new Date().toISOString().split('T')[0]

      const [profileResult, usageResult] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
        supabase.from('daily_usage').select('count').eq('user_id', user.id).eq('date', today).single(),
      ])

      const plan = profileResult.data?.plan ?? 'free'
      setUsage({
        used: usageResult.data?.count ?? 0,
        limit: getPlanLimit(plan),
        plan,
      })
    }

    fetchUsage()
  }, [refreshKey])

  if (!usage) return null

  const remaining = usage.limit - usage.used
  const isLow = remaining <= Math.ceil(usage.limit * 0.2)

  const planLabel = PLAN_PRICES[usage.plan]?.label ?? 'Free'

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        {planLabel}
      </Badge>
      <Badge variant={isLow ? 'destructive' : 'secondary'} className="text-xs">
        {remaining}/{usage.limit} remaining today
      </Badge>
    </div>
  )
}
