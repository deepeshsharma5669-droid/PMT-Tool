'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type ResolvedRole =
  | { role: 'Admin'; redirectPath: '/admin' }
  | { role: 'Manager'; redirectPath: '/manager' }
  | { role: 'Member'; redirectPath: '/member' }
  | { role: 'Client'; redirectPath: '/client'; clientName: string }
  | { role: null; redirectPath: null }

export async function resolveRoleAndRedirect(email: string): Promise<ResolvedRole> {
  const supabase = await createClient()

  const { data: managerRow } = await supabase
    .from('managers')
    .select('role')
    .eq('email', email)
    .maybeSingle()

  if (managerRow?.role === 'Admin') {
    await setRoleCookie('Admin')
    return { role: 'Admin', redirectPath: '/admin' }
  }
  if (managerRow?.role === 'Manager') {
    await setRoleCookie('Manager')
    return { role: 'Manager', redirectPath: '/manager' }
  }
  if (managerRow?.role === 'Member') {
    await setRoleCookie('Member')
    return { role: 'Member', redirectPath: '/member' }
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