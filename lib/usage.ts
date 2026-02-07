import type { SupabaseClient } from '@supabase/supabase-js'
import { getPlanLimit } from './constants'

export async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  return data?.plan ?? 'free'
}

export async function getTodayUsage(supabase: SupabaseClient, userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('daily_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  return data?.count ?? 0
}

export async function incrementUsage(supabase: SupabaseClient, userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_usage')
    .select('id, count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (existing) {
    await supabase
      .from('daily_usage')
      .update({ count: existing.count + 1 })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('daily_usage')
      .insert({ user_id: userId, date: today, count: 1 })
  }
}

export async function checkUsageAllowed(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; used: number; limit: number; plan: string }> {
  const plan = await getUserPlan(supabase, userId)
  const used = await getTodayUsage(supabase, userId)
  const limit = getPlanLimit(plan)

  return {
    allowed: used < limit,
    used,
    limit,
    plan,
  }
}
