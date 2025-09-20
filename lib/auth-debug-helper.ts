// Debug helper for authentication issues
export function debugAuthState() {
  if (typeof window === 'undefined') return

  const token = localStorage.getItem('auth_token')
  const user = localStorage.getItem('user')
  const sessionStart = localStorage.getItem('session_start')

  console.group('🔐 Auth Debug State')
  console.log('Token present:', !!token)
  console.log('Token length:', token?.length || 0)
  console.log('User data present:', !!user)
  console.log('Session start:', sessionStart)
  
  if (token) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        const now = Math.floor(Date.now() / 1000)
        const isExpired = payload.exp && payload.exp < now
        
        console.log('Token payload:', {
          exp: payload.exp,
          iat: payload.iat,
          sub: payload.sub,
          isExpired,
          expiresIn: payload.exp ? `${Math.floor((payload.exp - now) / 60)} minutes` : 'unknown'
        })
      }
    } catch (e) {
      console.log('Token parse error:', e)
    }
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user)
      console.log('User data:', {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        isActive: userData.isActive
      })
    } catch (e) {
      console.log('User data parse error:', e)
    }
  }
  
  console.groupEnd()
}

// Check if authentication is properly set up
export function checkAuthSetup() {
  if (typeof window === 'undefined') return false

  const token = localStorage.getItem('auth_token')
  const user = localStorage.getItem('user')
  
  if (!token || !user) {
    console.warn('❌ Authentication not properly set up - missing token or user data')
    return false
  }
  
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.warn('❌ Invalid token format')
      return false
    }
    
    const payload = JSON.parse(atob(parts[1]))
    const now = Math.floor(Date.now() / 1000)
    
    if (payload.exp && payload.exp < now) {
      console.warn('❌ Token is expired')
      return false
    }
    
    JSON.parse(user) // Validate user data is valid JSON
    
    console.log('✅ Authentication setup looks good')
    return true
  } catch (e) {
    console.warn('❌ Authentication data is corrupted:', e)
    return false
  }
}

// Add to window for easy debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuthState;
  (window as any).checkAuth = checkAuthSetup;
}