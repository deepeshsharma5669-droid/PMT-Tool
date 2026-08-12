import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Verifies the token_hash from a Supabase email link server-side, establishing
// a real session via cookies before redirecting — avoids all the implicit vs
// PKCE ambiguity that client-side hash/code parsing runs into.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/login'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      const redirectUrl = new URL(next, request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  const errorUrl = new URL('/login', request.url)
  errorUrl.searchParams.set('error', 'This link has expired or was already used.')
  return NextResponse.redirect(errorUrl)
}