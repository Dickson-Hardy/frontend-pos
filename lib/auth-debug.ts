/**
 * Authentication Debugging Utilities
 * 
 * Provides comprehensive debugging tools for authentication issues
 * including session analysis, token validation, and error reporting.
 */

export interface AuthDebugInfo {
  timestamp: string
  sessionState: {
    hasUser: boolean
    hasToken: boolean
    userRole?: string
    userId?: string
    tokenLength?: number
    isAuthenticated: boolean
  }
  localStorageState: {
    hasAuthToken: boolean
    hasUserData: boolean
    tokenLength?: number
    userData?: any
  }
  cookieState: {
    hasAuthCookie: boolean
    cookieValue?: string
    allCookies: string[]
  }
  urlInfo: {
    currentPath: string
    searchParams: Record<string, string>
    hash: string
  }
  lastError?: any
}

/**
 * Capture comprehensive authentication debug information
 */
export function captureAuthDebugInfo(): AuthDebugInfo {
  const debugInfo: AuthDebugInfo = {
    timestamp: new Date().toISOString(),
    sessionState: {
      hasUser: false,
      hasToken: false,
      isAuthenticated: false
    },
    localStorageState: {
      hasAuthToken: false,
      hasUserData: false
    },
    cookieState: {
      hasAuthCookie: false,
      allCookies: []
    },
    urlInfo: {
      currentPath: '',
      searchParams: {},
      hash: ''
    }
  }

  // Capture session state from context if available
  if (typeof window !== 'undefined') {
    // Local storage state
    const authToken = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user')
    
    debugInfo.localStorageState = {
      hasAuthToken: !!authToken,
      hasUserData: !!userData,
      tokenLength: authToken?.length,
      userData: userData ? JSON.parse(userData) : undefined
    }

    // Cookie state
    const cookies = document.cookie.split(';').map(c => c.trim())
    const authCookie = cookies.find(c => c.startsWith('auth_token='))
    
    debugInfo.cookieState = {
      hasAuthCookie: !!authCookie,
      cookieValue: authCookie ? authCookie.substring(0, 30) + '...' : undefined,
      allCookies: cookies.map(c => c.split('=')[0])
    }

    // URL information
    const url = new URL(window.location.href)
    debugInfo.urlInfo = {
      currentPath: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
      hash: url.hash
    }

    // Last error if available
    const lastError = localStorage.getItem('last_auth_error')
    if (lastError) {
      try {
        debugInfo.lastError = JSON.parse(lastError)
      } catch (e) {
        debugInfo.lastError = { error: 'Could not parse last error' }
      }
    }
  }

  return debugInfo
}

/**
 * Log comprehensive authentication debug information
 */
export function logAuthDebugInfo(context: string = 'general'): void {
  console.group(`🔍 [AUTH-DEBUG:${context.toUpperCase()}] Full Authentication State`)
  
  const debugInfo = captureAuthDebugInfo()
  
  console.log('📊 [AUTH-DEBUG] Complete state capture', debugInfo)
  
  // Log individual sections for easier reading
  console.group('💾 [AUTH-DEBUG] Local Storage State')
  console.log('Auth Token:', debugInfo.localStorageState.hasAuthToken ? '✓ Present' : '❌ Missing')
  console.log('User Data:', debugInfo.localStorageState.hasUserData ? '✓ Present' : '❌ Missing')
  if (debugInfo.localStorageState.userData) {
    console.log('User Info:', {
      id: debugInfo.localStorageState.userData.id,
      role: debugInfo.localStorageState.userData.role,
      email: debugInfo.localStorageState.userData.email
    })
  }
  console.groupEnd()
  
  console.group('🍪 [AUTH-DEBUG] Cookie State')
  console.log('Auth Cookie:', debugInfo.cookieState.hasAuthCookie ? '✓ Present' : '❌ Missing')
  console.log('All Cookies:', debugInfo.cookieState.allCookies)
  console.groupEnd()
  
  console.group('🌐 [AUTH-DEBUG] URL Information')
  console.log('Current Path:', debugInfo.urlInfo.currentPath)
  console.log('Search Params:', debugInfo.urlInfo.searchParams)
  console.log('Hash:', debugInfo.urlInfo.hash || 'None')
  console.groupEnd()
  
  if (debugInfo.lastError) {
    console.group('❌ [AUTH-DEBUG] Last Error Information')
    console.log('Last Error:', debugInfo.lastError)
    console.groupEnd()
  }
  
  console.groupEnd()
}

/**
 * Validate token structure and content
 */
export function validateTokenStructure(token: string): {
  isValid: boolean
  parts: string[]
  payload?: any
  isExpired?: boolean
  timeUntilExpiry?: number
  issues: string[]
} {
  const result = {
    isValid: true,
    parts: [],
    issues: [] as string[]
  }
  
  console.group('🔍 [TOKEN-VALIDATOR] Analyzing token structure')
  
  if (!token) {
    result.isValid = false
    result.issues.push('Token is empty or null')
    console.groupEnd()
    return result
  }
  
  // Split token into parts
  result.parts = token.split('.')
  console.log('📝 [TOKEN-VALIDATOR] Token parts', {
    totalParts: result.parts.length,
    expectedParts: 3
  })
  
  if (result.parts.length !== 3) {
    result.isValid = false
    result.issues.push(`Invalid JWT structure: expected 3 parts, got ${result.parts.length}`)
  }
  
  // Try to decode payload
  if (result.parts.length >= 2) {
    try {
      const payload = JSON.parse(atob(result.parts[1]))
      result.payload = payload
      
      console.log('✅ [TOKEN-VALIDATOR] Payload decoded successfully', {
        hasExp: !!payload.exp,
        hasRole: !!payload.role,
        hasUserId: !!(payload.sub || payload.id),
        role: payload.role,
        userId: payload.sub || payload.id
      })
      
      // Check expiration
      if (payload.exp) {
        const currentTime = Date.now() / 1000
        result.isExpired = payload.exp <= currentTime
        result.timeUntilExpiry = payload.exp - currentTime
        
        console.log('⏰ [TOKEN-VALIDATOR] Expiration check', {
          expiresAt: new Date(payload.exp * 1000).toISOString(),
          isExpired: result.isExpired,
          timeUntilExpiry: result.timeUntilExpiry
        })
        
        if (result.isExpired) {
          result.isValid = false
          result.issues.push('Token is expired')
        }
      } else {
        result.issues.push('Token has no expiration time')
      }
      
      // Check required fields
      if (!payload.role) {
        result.issues.push('Token missing role')
      }
      
      if (!payload.sub && !payload.id) {
        result.issues.push('Token missing user ID')
      }
      
    } catch (error) {
      result.isValid = false
      result.issues.push('Cannot decode token payload')
      console.error('❌ [TOKEN-VALIDATOR] Payload decode failed', error)
    }
  }
  
  console.log('🏁 [TOKEN-VALIDATOR] Validation complete', {
    isValid: result.isValid,
    issueCount: result.issues.length,
    issues: result.issues
  })
  
  console.groupEnd()
  return result
}

/**
 * Generate authentication troubleshooting report
 */
export function generateAuthTroubleshootingReport(): string {
  const debugInfo = captureAuthDebugInfo()
  const token = localStorage.getItem('auth_token')
  const tokenValidation = token ? validateTokenStructure(token) : null
  
  const report = `
=== AUTHENTICATION TROUBLESHOOTING REPORT ===
Generated: ${debugInfo.timestamp}

CURRENT STATE:
- Path: ${debugInfo.urlInfo.currentPath}
- Has Auth Token (localStorage): ${debugInfo.localStorageState.hasAuthToken ? 'YES' : 'NO'}
- Has User Data (localStorage): ${debugInfo.localStorageState.hasUserData ? 'YES' : 'NO'}
- Has Auth Cookie: ${debugInfo.cookieState.hasAuthCookie ? 'YES' : 'NO'}

${debugInfo.localStorageState.userData ? `USER INFORMATION:
- ID: ${debugInfo.localStorageState.userData.id}
- Role: ${debugInfo.localStorageState.userData.role}
- Email: ${debugInfo.localStorageState.userData.email}
- Active: ${debugInfo.localStorageState.userData.isActive}
` : ''}

${tokenValidation ? `TOKEN VALIDATION:
- Structure Valid: ${tokenValidation.isValid ? 'YES' : 'NO'}
- Is Expired: ${tokenValidation.isExpired ? 'YES' : 'NO'}
- Time Until Expiry: ${tokenValidation.timeUntilExpiry ? Math.round(tokenValidation.timeUntilExpiry) + ' seconds' : 'N/A'}
- Issues: ${tokenValidation.issues.length > 0 ? tokenValidation.issues.join(', ') : 'None'}
` : 'TOKEN VALIDATION: No token to validate'}

${debugInfo.lastError ? `LAST ERROR:
- Context: ${debugInfo.lastError.context || 'Unknown'}
- Category: ${debugInfo.lastError.category || 'Unknown'}
- Message: ${debugInfo.lastError.errorMessage || 'Unknown'}
- Time: ${debugInfo.lastError.timestamp || 'Unknown'}
` : 'LAST ERROR: None recorded'}

COOKIES:
${debugInfo.cookieState.allCookies.map(name => `- ${name}`).join('\n')}

URL PARAMETERS:
${Object.entries(debugInfo.urlInfo.searchParams).map(([key, value]) => `- ${key}: ${value}`).join('\n') || '- None'}

=== END REPORT ===
  `
  
  return report.trim()
}

/**
 * Console command to help developers debug auth issues
 */
export function debugAuth() {
  if (typeof window !== 'undefined') {
    (window as any).authDebug = {
      info: () => logAuthDebugInfo('manual'),
      report: () => {
        const report = generateAuthTroubleshootingReport()
        console.log(report)
        return report
      },
      validateToken: (token?: string) => {
        const tokenToValidate = token || localStorage.getItem('auth_token')
        if (!tokenToValidate) {
          console.log('❌ No token provided or found in localStorage')
          return null
        }
        return validateTokenStructure(tokenToValidate)
      },
      clearError: () => {
        localStorage.removeItem('last_auth_error')
        console.log('✅ Last auth error cleared')
      },
      export: () => {
        const report = generateAuthTroubleshootingReport()
        const blob = new Blob([report], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `auth-debug-${Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
        console.log('📁 Debug report exported')
      }
    }
    
    console.log('🔧 [AUTH-DEBUG] Debug utilities loaded. Available commands:')
    console.log('- window.authDebug.info() - Show current auth state')
    console.log('- window.authDebug.report() - Generate troubleshooting report')
    console.log('- window.authDebug.validateToken(token?) - Validate token structure')
    console.log('- window.authDebug.clearError() - Clear last error')
    console.log('- window.authDebug.export() - Export debug report to file')
  }
}