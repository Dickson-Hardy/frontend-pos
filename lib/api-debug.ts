/**
 * API Authentication Test Utilities
 * 
 * Use these utilities to diagnose API authentication issues
 */

import apiClient from './api-unified'
import { logAuthDebugInfo, validateTokenStructure } from './auth-debug'

/**
 * Diagnose API authentication issues by testing multiple endpoints
 */
export async function diagnoseApiAuth() {
  console.group('🔍 API Authentication Diagnostics')
  
  // Log current auth state
  logAuthDebugInfo('api-test')
  
  // Check token in API client
  const clientToken = apiClient.getToken()
  console.log('Token in API client:', clientToken ? `${clientToken.substring(0, 15)}...` : 'None')
  
  // Check Authorization header in axios
  const authHeader = apiClient['axiosInstance'].defaults.headers.common['Authorization']
  console.log('Authorization header in axios:', authHeader || 'None')
  
  // Test API health check
  try {
    console.log('Testing API health check...')
    const health = await apiClient.health.check()
    console.log('✅ Health check successful:', health)
  } catch (error) {
    console.error('❌ Health check failed:', error)
  }
  
  // Test authentication status
  try {
    console.log('Testing authenticated profile endpoint...')
    const profile = await apiClient.auth.getProfile()
    console.log('✅ Profile check successful:', profile)
  } catch (error) {
    console.error('❌ Profile check failed:', error)
  }
  
  // Test other API endpoints
  const endpoints = [
    { name: 'Outlets', fn: () => apiClient.outlets.getAll() },
    { name: 'Users', fn: () => apiClient.users.getAll() },
    { name: 'Inventory Stats', fn: () => apiClient.inventory.getStats() },
    { name: 'Shift Stats', fn: () => apiClient.shifts.getStats() },
    { name: 'Daily Sales', fn: () => apiClient.sales.getDailySummary() }
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name} endpoint...`)
      const result = await endpoint.fn()
      console.log(`✅ ${endpoint.name} check successful:`, result)
    } catch (error) {
      console.error(`❌ ${endpoint.name} check failed:`, error)
    }
  }
  
  console.groupEnd()
  return 'API diagnostics complete. Check console for results.'
}

/**
 * Fix authentication state by refreshing from localStorage and updating Axios
 */
export function fixAuthState() {
  console.group('🔧 Fixing Auth State')
  
  // Get token from localStorage
  const token = localStorage.getItem('auth_token')
  if (!token) {
    console.error('❌ No token found in localStorage. Login required.')
    console.groupEnd()
    return false
  }
  
  // Validate token
  const validation = validateTokenStructure(token)
  if (!validation.isValid) {
    console.error('❌ Invalid token:', validation.issues)
    console.groupEnd()
    return false
  }
  
  if (validation.isExpired) {
    console.error('❌ Token is expired. Login required.')
    console.groupEnd()
    return false
  }
  
  // Update token in API client
  apiClient.setToken(token)
  
  // Verify Authorization header is set
  const authHeader = apiClient['axiosInstance'].defaults.headers.common['Authorization']
  console.log('Authorization header:', authHeader || 'None')
  
  console.log('✅ Auth state fixed. Token and headers updated.')
  console.groupEnd()
  return true
}

/**
 * Force a token refresh by calling the profile endpoint
 */
export async function refreshToken() {
  console.group('🔄 Refreshing Token')
  
  try {
    const profile = await apiClient.auth.getProfile()
    console.log('✅ Token refresh successful:', profile)
    console.groupEnd()
    return true
  } catch (error) {
    console.error('❌ Token refresh failed:', error)
    console.groupEnd()
    return false
  }
}

// Add to window object for easy debugging in console
if (typeof window !== 'undefined') {
  (window as any).apiDebug = {
    diagnose: diagnoseApiAuth,
    fix: fixAuthState,
    refresh: refreshToken,
    apiClient: apiClient
  }
  
  console.log('🔧 [API-DEBUG] API debug utilities loaded. Available commands:')
  console.log('- window.apiDebug.diagnose() - Test API authentication')
  console.log('- window.apiDebug.fix() - Fix auth state')
  console.log('- window.apiDebug.refresh() - Force token refresh')
}