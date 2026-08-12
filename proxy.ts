import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/auth/set-password', '/auth/change-password', '/auth/confirm']

const ROLE_HOME: Record<string, string> = {
  Admin: '/admin',
  Manager: '/manager',
  Member: '/member',
  Client: '/client',
}

function sectionFor(pathname: string): string | null {
  if (pathname.startsWith('/admin')) return 'Admin'
  if (pathname.startsWith('/manager')) return 'Manager'
  if (pathname.startsWith('/member')) return 'Member'
  if (pathname.startsWith('/client')) return 'Client'
  return null
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = request.cookies.get('pmt_role')?.value

    // Already signed in, revisiting /login — send them to their own portal instead.
    if (pathname === '/login' && role && ROLE_HOME[role]) {
      const url = request.nextUrl.clone()
      url.pathname = ROLE_HOME[role]
      return NextResponse.redirect(url)
    }

    // Signed in but the role cookie is missing (expired, or a raw Supabase session
    // with no PMT login step yet) — safest fallback is to re-run the login flow.
    if (!role && !isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Signed in with a role, but hitting a section that isn't theirs.
    const section = sectionFor(pathname)
    if (section && role && section !== role) {
      const url = request.nextUrl.clone()
      url.pathname = ROLE_HOME[role] ?? '/login'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}