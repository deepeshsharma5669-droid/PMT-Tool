'use server'

import { createClient } from '@/lib/supabase/server'

/** Clears must_change_password after a successful password update. Call this
 *  AFTER the client has already called supabase.auth.updateUser({ password }).
 *  The email is always read from the caller's session — never accept it as
 *  an argument, or any signed-in user could clear anyone's flag. */
export async function clearMustChangePassword() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return
  await supabase.from('managers').update({ must_change_password: false }).eq('email', user.email)
}
