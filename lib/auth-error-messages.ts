/**
 * Authentication Error Message System
 * 
 * Provides consistent, user-friendly error messages for different authentication failure types
 * and includes debugging information for development.
 */

export interface AuthErrorDetails {
  code: string
  category: AuthErrorCategory
  message: string
  userAction: AuthUserAction
  technical?: string
  shouldClearAuth: boolean
  retryable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export type AuthErrorCategory = 
  | 'network'
  | 'timeout'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'server'
  | 'rate_limit'
  | 'service'
  | 'token'
  | 'unknown'

export type AuthUserAction = 
  | 'retry'
  | 'login'
  | 'check_connection'
  | 'contact_admin'
  | 'wait_retry'
  | 'fix_input'
  | 'refresh_page'
  | 'clear_cache'

/**
 * Comprehensive error message mapping for authentication failures
 */
export const AUTH_ERROR_MESSAGES: Record<string, AuthErrorDetails> = {
  // Network Errors
  'NETWORK_ERROR': {
    code: 'NETWORK_ERROR',
    category: 'network',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    userAction: 'check_connection',
    technical: 'Network request failed - check internet connection or server availability',
    shouldClearAuth: false,
    retryable: true,
    severity: 'medium'
  },
  
  'ECONNABORTED': {
    code: 'ECONNABORTED',
    category: 'timeout',
    message: 'The request timed out. Please try again.',
    userAction: 'retry',
    technical: 'Request was aborted due to timeout',
    shouldClearAuth: false,
    retryable: true,
    severity: 'medium'
  },

  'TIMEOUT': {
    code: 'TIMEOUT',
    category: 'timeout',
    message: 'Request timed out. Please check your connection and try again.',
    userAction: 'retry',
    technical: 'Request exceeded maximum allowed time',
    shouldClearAuth: false,
    retryable: true,
    severity: 'medium'
  },

  // Authentication Errors (4xx)
  '400': {
    code: '400',
    category: 'validation',
    message: 'Invalid request. Please check your input and try again.',
    userAction: 'fix_input',
    technical: 'Bad Request - validation failed',
    shouldClearAuth: false,
    retryable: false,
    severity: 'low'
  },

  '401': {
    code: '401',
    category: 'authentication',
    message: 'Your session has expired. Please log in again.',
    userAction: 'login',
    technical: 'Unauthorized - token is invalid or expired',
    shouldClearAuth: true,
    retryable: false,
    severity: 'high'
  },

  '403': {
    code: '403',
    category: 'authorization',
    message: 'Access denied. You don\'t have permission to perform this action.',
    userAction: 'contact_admin',
    technical: 'Forbidden - user lacks required permissions',
    shouldClearAuth: true,
    retryable: false,
    severity: 'high'
  },

  '404': {
    code: '404',
    category: 'service',
    message: 'The requested service is temporarily unavailable.',
    userAction: 'wait_retry',
    technical: 'Not Found - authentication service endpoint not available',
    shouldClearAuth: false,
    retryable: true,
    severity: 'medium'
  },

  '429': {
    code: '429',
    category: 'rate_limit',
    message: 'Too many requests. Please wait a moment and try again.',
    userAction: 'wait_retry',
    technical: 'Rate limiting active - too many requests from client',
    shouldClearAuth: false,
    retryable: true,
    severity: 'low'
  },

  // Server Errors (5xx)
  '500': {
    code: '500',
    category: 'server',
    message: 'Internal server error. Please try again later.',
    userAction: 'wait_retry',
    technical: 'Internal Server Error - server-side issue',
    shouldClearAuth: false,
    retryable: true,
    severity: 'high'
  },

  '502': {
    code: '502',
    category: 'server',
    message: 'Server gateway error. Please try again later.',
    userAction: 'wait_retry',
    technical: 'Bad Gateway - upstream server error',
    shouldClearAuth: false,
    retryable: true,
    severity: 'high'
  },

  '503': {
    code: '503',
    category: 'server',
    message: 'Service temporarily unavailable. Please try again later.',
    userAction: 'wait_retry',
    technical: 'Service Unavailable - server overloaded or maintenance',
    shouldClearAuth: false,
    retryable: true,
    severity: 'high'
  },

  '504': {
    code: '504',
    category: 'server',
    message: 'Gateway timeout. Please try again later.',
    userAction: 'wait_retry',
    technical: 'Gateway Timeout - upstream server too slow',
    shouldClearAuth: false,
    retryable: true,
    severity: 'high'
  },

  // Token-specific errors
  'TOKEN_EXPIRED': {
    code: 'TOKEN_EXPIRED',
    category: 'token',
    message: 'Your session has expired. Please log in again.',
    userAction: 'login',
    technical: 'JWT token has passed its expiration time',
    shouldClearAuth: true,
    retryable: false,
    severity: 'high'
  },

  'TOKEN_INVALID': {
    code: 'TOKEN_INVALID',
    category: 'token',
    message: 'Invalid authentication token. Please log in again.',
    userAction: 'login',
    technical: 'JWT token is malformed or signature invalid',
    shouldClearAuth: true,
    retryable: false,
    severity: 'critical'
  },

  'TOKEN_MISSING': {
    code: 'TOKEN_MISSING',
    category: 'token',
    message: 'Authentication required. Please log in to continue.',
    userAction: 'login',
    technical: 'No authentication token provided',
    shouldClearAuth: true,
    retryable: false,
    severity: 'high'
  },

  // Default fallback
  'UNKNOWN': {
    code: 'UNKNOWN',
    category: 'unknown',
    message: 'An unexpected error occurred. Please try again or contact support.',
    userAction: 'retry',
    technical: 'Unhandled error type',
    shouldClearAuth: false,
    retryable: true,
    severity: 'medium'
  }
}

/**
 * User action instruction messages
 */
export const USER_ACTION_INSTRUCTIONS: Record<AuthUserAction, string> = {
  retry: 'Please try your request again.',
  login: 'Please log in again to continue.',
  check_connection: 'Please check your internet connection and try again.',
  contact_admin: 'Please contact your system administrator for assistance.',
  wait_retry: 'Please wait a moment and try again.',
  fix_input: 'Please check your input and try again.',
  refresh_page: 'Please refresh the page and try again.',
  clear_cache: 'Please clear your browser cache and try again.'
}

/**
 * Get appropriate error details for an authentication error
 */
export function getAuthErrorDetails(error: any): AuthErrorDetails {
  console.group('🔍 [AUTH-ERROR] Analyzing error for user message')
  
  let errorCode = 'UNKNOWN'
  
  // Extract error code from various error formats
  if (error?.code) {
    errorCode = error.code
  } else if (error?.statusCode) {
    errorCode = error.statusCode.toString()
  } else if (error?.response?.status) {
    errorCode = error.response.status.toString()
  } else if (error?.status) {
    errorCode = error.status.toString()
  } else if (error?.message) {
    // Try to extract code from message
    if (error.message.includes('Network Error')) {
      errorCode = 'NETWORK_ERROR'
    } else if (error.message.includes('timeout')) {
      errorCode = 'TIMEOUT'
    } else if (error.message.includes('token')) {
      if (error.message.includes('expired')) {
        errorCode = 'TOKEN_EXPIRED'
      } else if (error.message.includes('invalid')) {
        errorCode = 'TOKEN_INVALID'
      } else {
        errorCode = 'TOKEN_MISSING'
      }
    }
  }

  console.log('🔍 [AUTH-ERROR] Error code detection', {
    originalError: {
      code: error?.code,
      statusCode: error?.statusCode,
      status: error?.response?.status || error?.status,
      message: error?.message
    },
    detectedCode: errorCode
  })

  // Get error details or fallback to unknown
  const errorDetails = AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES['UNKNOWN']
  
  // If we used a fallback but have a custom message, update it
  if (errorCode === 'UNKNOWN' && error?.message) {
    errorDetails.message = error.message
    errorDetails.technical = `Custom error: ${error.message}`
  }

  console.log('📋 [AUTH-ERROR] Final error details', {
    code: errorDetails.code,
    category: errorDetails.category,
    message: errorDetails.message,
    userAction: errorDetails.userAction,
    shouldClearAuth: errorDetails.shouldClearAuth,
    retryable: errorDetails.retryable,
    severity: errorDetails.severity
  })

  console.groupEnd()
  return errorDetails
}

/**
 * Get user-friendly error message with action instructions
 */
export function getAuthErrorMessage(error: any, includeAction: boolean = true): string {
  const details = getAuthErrorDetails(error)
  
  if (!includeAction) {
    return details.message
  }

  const actionInstruction = USER_ACTION_INSTRUCTIONS[details.userAction]
  return `${details.message} ${actionInstruction}`
}

/**
 * Check if an error should clear authentication state
 */
export function shouldClearAuthOnError(error: any): boolean {
  const details = getAuthErrorDetails(error)
  return details.shouldClearAuth
}

/**
 * Check if an error is retryable
 */
export function isErrorRetryable(error: any): boolean {
  const details = getAuthErrorDetails(error)
  return details.retryable
}

/**
 * Get error severity level
 */
export function getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
  const details = getAuthErrorDetails(error)
  return details.severity
}

/**
 * Log error with appropriate console method based on severity
 */
export function logAuthError(error: any, context: string): void {
  const details = getAuthErrorDetails(error)
  const logData = {
    context,
    error: details,
    timestamp: new Date().toISOString(),
    originalError: error
  }

  switch (details.severity) {
    case 'critical':
      console.error(`🚨 [AUTH-ERROR:${context.toUpperCase()}] CRITICAL:`, logData)
      break
    case 'high':
      console.error(`❌ [AUTH-ERROR:${context.toUpperCase()}] HIGH:`, logData)
      break
    case 'medium':
      console.warn(`⚠️ [AUTH-ERROR:${context.toUpperCase()}] MEDIUM:`, logData)
      break
    case 'low':
      console.log(`ℹ️ [AUTH-ERROR:${context.toUpperCase()}] LOW:`, logData)
      break
  }
}