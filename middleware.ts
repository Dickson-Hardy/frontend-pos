import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard': null, // Any authenticated user
  '/admin': 'admin',
  '/manager': 'manager',
  '/cashier': 'cashier',
  '/inventory': 'manager', // Managers handle inventory
  '/reports': 'manager', // Manager or higher
} as const

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/']

// New matcher for public assets that should be ignored by the middleware
const publicAssetMatcher = /^\/(manifest\.json|icons\/.*|.*\.png|.*\.svg|.*\.jpg|.*\.jpeg)$/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If the path matches a public asset, skip the middleware entirely
  if (publicAssetMatcher.test(pathname)) {
    return NextResponse.next()
  }

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Get token exclusively from cookie to avoid transient header-based tokens causing redirects
  const cookieToken = request.cookies.get('auth_token')?.value
  const userRoleCookie = request.cookies.get('user_role')?.value as
    | 'admin'
    | 'manager'
    | 'cashier'
    | undefined

  const token = cookieToken || null

  // Try to extract role from JWT payload if cookie token exists (best-effort, no signature verification)
  let roleFromToken: typeof userRoleCookie | undefined = undefined
  if (token) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        if (payload && typeof payload.role === 'string') {
          roleFromToken = payload.role as typeof userRoleCookie
        }
      }
    } catch (e) {
      // If parsing fails, silently ignore and fall back to user_role cookie
    }
  }

  // Enhanced logging for debugging
  // Minimal token detection without verbose logging

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(route)
  })
  if (isPublicRoute) {
    // If user has valid token and is trying to access login page, redirect to role-specific/default page
    if (token && pathname === '/login') {
      const roleRedirects = {
        admin: '/admin',
        manager: '/manager',
        cashier: '/cashier',
      } as const

      const effectiveRole = roleFromToken || userRoleCookie
      const redirectPath = (effectiveRole && roleRedirects[effectiveRole as keyof typeof roleRedirects]) || '/dashboard'
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  )
  
  const protectedRouteInfo = {
    isProtected: isProtectedRoute,
    matchedRoute: Object.keys(protectedRoutes).find(route => pathname.startsWith(route)),
    requiredRole: isProtectedRoute ? Object.entries(protectedRoutes).find(([route]) => 
      pathname.startsWith(route)
    )?.[1] : null
  }
  
  if (isProtectedRoute) {
    // If no token (cookie), redirect to login with return URL
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // Role-based protection (lightweight using user_role cookie if available)
    const requiredRole = protectedRouteInfo.requiredRole
    if (requiredRole) {
      // Determine effective role (prefer role encoded in token payload when available)
      const effectiveRole = roleFromToken || userRoleCookie
      if (effectiveRole) {
        const roleHierarchy = {
          admin: 4,
          manager: 3,
          cashier: 1,
        } as const

        const userRoleLevel = roleHierarchy[effectiveRole as keyof typeof roleHierarchy] || 0
        const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

        if (userRoleLevel < requiredRoleLevel) {
          const roleRedirects = {
            admin: '/admin',
            manager: '/manager',
            cashier: '/cashier',
          } as const

          const redirectPath = roleRedirects[effectiveRole as keyof typeof roleRedirects] || '/dashboard'
          if (pathname !== redirectPath) {
            return NextResponse.redirect(new URL(redirectPath, request.url))
          }
        }
      } else {
        // No effective role found; allow request and defer fine-grained enforcement to backend
      }
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}