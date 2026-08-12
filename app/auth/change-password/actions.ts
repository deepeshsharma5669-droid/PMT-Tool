'use server'

import { createClient } from '@/lib/supabase/server'

/** Clears must_change_password after a successful password update. Call this
 *  AFTER the client has already called supabase.auth.updateUser({ password }). */
export async function clearMustChangePassword(email: string) {
  const supabase = await createClient()
  await supabase.from('managers').update({ must_change_password: false }).eq('email', email)
}