// Server-only Supabase client using the service role key.
// NEVER import this into a client component or expose the key with NEXT_PUBLIC_.
// Used only for privileged operations: inviting users, admin-level auth management.

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}