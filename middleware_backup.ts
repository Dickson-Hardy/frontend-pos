import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard': null, // Any authenticated user
  '/admin': 'admin',
  '/manager': 'manager',
  '/cashier': 'cashier',
  '/inventory': 'inventory_manager',
  '/reports': 'manager', // Manager or higher
} as const

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/', '/api']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = Math.random().toString(36).substring(7)
  
  console.log(`🛡️ [MIDDLEWARE:${requestId}] Processing request - ${pathname}`)
  console.log(`🛡️ [MIDDLEWARE:${requestId}] Request details:`, {
    pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...',
    referer: request.headers.get('referer'),
    timestamp: new Date().toISOString()
  })
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    console.log(`🛡️ [MIDDLEWARE:${requestId}] Skipping middleware for excluded path`)
    return NextResponse.next()
  }

  // Get token from multiple sources - more resilient detection
  const cookieToken = request.cookies.get('auth_token')?.value
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const clientToken = request.headers.get('x-auth-token')
  
  // Try to get token from any available source
  const token = cookieToken || clientToken || headerToken

  // Enhanced logging for debugging
  const tokenInfo = {
    hasToken: !!token,
    tokenSource: cookieToken ? 'cookie' : clientToken ? 'header-x-auth' : headerToken ? 'header-auth' : 'none',
    tokenLength: token?.length,
    tokenPreview: token ? token.substring(0, 20) + '...' : null,
    cookiePresent: !!cookieToken,
    clientHeaderPresent: !!clientToken,
    authHeaderPresent: !!headerToken,
    allCookies: request.cookies.getAll().map(c => ({ 
      name: c.name, 
      hasValue: !!c.value,
      valueLength: c.value?.length
    }))
  }
  
  console.log(`🔍 [MIDDLEWARE:${requestId}] Token detection analysis`, tokenInfo)

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  console.log(`🔒 [MIDDLEWARE:${requestId}] Route classification`, {
    pathname,
    isPublic: isPublicRoute,
    matchedPublicRoute: publicRoutes.find(route => pathname === route || pathname.startsWith(route))
  })

  if (isPublicRoute) {
    // If user has valid token and is trying to access login page, redirect to role-specific page
    if (token && pathname === '/login') {
      console.log(`🔄 [MIDDLEWARE:${requestId}] Authenticated user accessing login page, analyzing token...`)
      
      try {
        // Basic JWT payload extraction to verify token structure
        console.log(`🔍 [MIDDLEWARE:${requestId}] Decoding JWT token...`)
        const payload = JSON.parse(atob(token.split('.')[1]))
        
        const tokenValidation = {
          hasPayload: !!payload,
          hasExp: !!payload?.exp,
          hasRole: !!payload?.role,
          expirationTime: payload?.exp,
          currentTime: Date.now() / 1000,
          isExpired: payload?.exp && payload.exp <= Date.now() / 1000,
          userRole: payload?.role,
          userId: payload?.sub || payload?.id
        }
        
        console.log(`📊 [MIDDLEWARE:${requestId}] Token validation details`, tokenValidation)
        
        if (payload && payload.exp && payload.exp > Date.now() / 1000) {
          const userRole = payload.role
          console.log(`✅ [MIDDLEWARE:${requestId}] Valid token found, redirecting based on role`, {
            userRole,
            timeUntilExpiry: payload.exp - Date.now() / 1000
          })
          
          // Redirect to role-specific page
          const roleRedirects = {
            admin: '/admin',
            manager: '/manager', 
            cashier: '/cashier',
            inventory_manager: '/inventory'
          } as const
          
          const redirectPath = roleRedirects[userRole as keyof typeof roleRedirects] || '/dashboard'
          console.log(`🚀 [MIDDLEWARE:${requestId}] Redirecting authenticated user:`, {
            from: pathname,
            to: redirectPath,
            reason: 'authenticated_user_on_login'
          })
          return NextResponse.redirect(new URL(redirectPath, request.url))
        } else {
          console.warn(`⚠️ [MIDDLEWARE:${requestId}] Token validation failed`, {
            reason: !payload ? 'no_payload' : !payload.exp ? 'no_expiry' : 'expired',
            allowing: 'access_to_login'
          })
        }
      } catch (error) {
        console.warn(`⚠️ [MIDDLEWARE:${requestId}] Token decoding failed`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          tokenValid: false,
          allowing: 'access_to_login'
        })
      }
    }
    
    console.log(`✅ [MIDDLEWARE:${requestId}] Public route access granted`)
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
  
  console.log(`🛡️ [MIDDLEWARE:${requestId}] Protected route analysis`, protectedRouteInfo)

  if (isProtectedRoute) {
    // If no token, redirect to login with return URL
    if (!token) {
      console.warn(`🚫 [MIDDLEWARE:${requestId}] No token found for protected route`, {
        redirecting: true,
        returnUrl: pathname
      })
      
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      console.groupEnd()
      return NextResponse.redirect(loginUrl)
    }

    // For role-based protection, decode and validate the JWT
    console.log(`🔍 [MIDDLEWARE:${requestId}] Validating token for protected route...`)
    
    try {
      // Basic JWT payload extraction (without verification for middleware)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userRole = payload.role
      const tokenExp = payload.exp
      const userId = payload.sub || payload.id

      const tokenDetails = {
        userId,
        userRole,
        tokenExp,
        currentTime: Date.now() / 1000,
        isExpired: tokenExp && tokenExp <= Date.now() / 1000,
        timeUntilExpiry: tokenExp ? tokenExp - Date.now() / 1000 : null
      }
      
      console.log(`📊 [MIDDLEWARE:${requestId}] Token payload details`, tokenDetails)

      // Check if token is expired
      if (tokenExp && tokenExp <= Date.now() / 1000) {
        console.warn(`⏰ [MIDDLEWARE:${requestId}] Token expired`, {
          expiredAt: new Date(tokenExp * 1000).toISOString(),
          currentTime: new Date().toISOString(),
          redirecting: true
        })
        
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Find the required role for this route
      const requiredRole = protectedRouteInfo.requiredRole

      if (requiredRole) {
        console.log(`🔐 [MIDDLEWARE:${requestId}] Checking role permissions`, {
          userRole,
          requiredRole,
          route: pathname
        })
        
        // Define role hierarchy
        const roleHierarchy = {
          admin: 4,
          manager: 3,
          inventory_manager: 2,
          cashier: 1,
        } as const

        const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
        const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

        const roleCheck = {
          userRoleLevel,
          requiredRoleLevel,
          hasPermission: userRoleLevel >= requiredRoleLevel,
          roleDifference: userRoleLevel - requiredRoleLevel
        }
        
        console.log(`📊 [MIDDLEWARE:${requestId}] Role hierarchy check`, roleCheck)

        if (userRoleLevel < requiredRoleLevel) {
          console.warn(`🚫 [MIDDLEWARE:${requestId}] Insufficient role permissions`, {
            userRole,
            requiredRole,
            redirecting: true
          })
          
          // Redirect to role-specific page instead of generic dashboard
          const roleRedirects = {
            admin: '/admin',
            manager: '/manager',
            cashier: '/cashier', 
            inventory_manager: '/inventory'
          } as const
          
          const redirectPath = roleRedirects[userRole as keyof typeof roleRedirects] || '/dashboard'
          
          // Don't redirect if already on the correct page
          if (pathname !== redirectPath) {
            console.log(`🚀 [MIDDLEWARE:${requestId}] Role-based redirect:`, {
              from: pathname,
              to: redirectPath,
              reason: 'insufficient_role'
            })
            return NextResponse.redirect(new URL(redirectPath, request.url))
          } else {
            console.log(`✅ [MIDDLEWARE:${requestId}] Already on correct role page`)
          }
        } else {
          console.log(`✅ [MIDDLEWARE:${requestId}] Role permissions granted`)
        }
      } else {
        console.log(`✅ [MIDDLEWARE:${requestId}] No specific role required, authenticated access granted`)
      }
    } catch (error) {
      // If token is invalid, redirect to login
      console.error(`💥 [MIDDLEWARE:${requestId}] Token validation failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenInvalid: true,
        redirecting: true
      })
      
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      console.groupEnd()
      return NextResponse.redirect(loginUrl)
    }
  }

  console.log(`✅ [MIDDLEWARE:${requestId}] Request approved, proceeding`)
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