'use server'

import { createAdminClient } from '@/lib/supabase/admin'

/** Creates a real, immediately-usable Supabase account with no email sent at
 *  all — sidesteps every rate limit and delivery problem entirely, since
 *  there's nothing to deliver. The person has no role yet; they show up in
 *  Admin's Pending Registrations list until approved. */
export async function registerAction(formData: FormData) {
  const admin = createAdminClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}