import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require a logged-in user
const protectedRoutes = ['/dashboard', '/interview', '/result']

// Routes only for guests (logged-in users get redirected away)
const guestRoutes = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Read token from cookie (we set this on login)
  const token = request.cookies.get('prepai_token')?.value

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isGuestOnly = guestRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Not logged in trying to access protected page → redirect to login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Already logged in trying to access login/signup → redirect to dashboard
  if (isGuestOnly && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/interview/:path*', '/result/:path*', '/login', '/signup'],
}