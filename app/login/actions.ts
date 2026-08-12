'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type ResolvedRole =
  | { role: 'Admin' | 'Manager' | 'Member' | 'Client'; redirectPath: string; clientName?: string }
  | { role: null; redirectPath: null }

const ROLE_HOME: Record<string, string> = {
  Admin: '/admin',
  Manager: '/manager',
  Member: '/member',
}

export async function resolveRoleAndRedirect(email: string): Promise<ResolvedRole> {
  const supabase = await createClient()

  const { data: managerRow } = await supabase
    .from('managers')
    .select('role, must_change_password')
    .eq('email', email)
    .maybeSingle()

  if (managerRow && managerRow.role in ROLE_HOME) {
    await setRoleCookie(managerRow.role)
    const home = ROLE_HOME[managerRow.role]

    if (managerRow.must_change_password) {
      return {
        role: managerRow.role as 'Admin' | 'Manager' | 'Member',
        redirectPath: `/auth/change-password?forced=1&returnTo=${encodeURIComponent(home)}`,
      }
    }

    return { role: managerRow.role as 'Admin' | 'Manager' | 'Member', redirectPath: home }
  }

  const { data: clientRow } = await supabase
    .from('clients')
    .select('name')
    .eq('email', email)
    .maybeSingle()

  if (clientRow) {
    await setRoleCookie('Client')
    return { role: 'Client', redirectPath: '/client', clientName: clientRow.name }
  }

  return { role: null, redirectPath: null }
}

async function setRoleCookie(role: string) {
  const cookieStore = await cookies()
  cookieStore.set('pmt_role', role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}