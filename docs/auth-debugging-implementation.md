# Authentication State Debugging and Logging Implementation

## Overview
Implemented comprehensive authentication state debugging and logging system to help identify and resolve authentication issues in the pharmacy POS system.

## Implemented Features

### 1. Enhanced Authentication State Change Logging

**File: `frontend/contexts/auth-context.tsx`**
- **Login Process**: Added detailed logging for login attempts, API responses, state updates, and cookie setting
- **Logout Process**: Enhanced logout logging with user state before logout and cleanup steps
- **Token Refresh**: Comprehensive logging for token refresh attempts and profile updates
- **State Clearing**: Detailed logging when authentication state is cleared with reasons and timing
- **Initialization**: Enhanced logging for auth initialization with retry mechanisms and validation steps

**Key Features:**
- Grouped console logs for better organization
- State snapshots before and after operations
- Token validation and cookie verification logging
- Retry attempt tracking and error context
- Performance timing for operations

### 2. Comprehensive Error Message System

**File: `frontend/lib/auth-error-messages.ts`**

**Error Categories:**
- **Network Errors**: Connection failures, timeouts
- **Authentication Errors**: Expired tokens, invalid credentials
- **Authorization Errors**: Permission denied, access forbidden
- **Validation Errors**: Bad requests, input validation failures
- **Server Errors**: 5xx status codes, service unavailable
- **Token Errors**: Malformed, expired, or missing tokens

**Features:**
- User-friendly error messages with actionable instructions
- Technical error details for debugging
- Error severity levels (low, medium, high, critical)
- Automatic determination of whether to clear auth state
- Retryable error classification
- Consistent error logging with appropriate console methods

### 3. Advanced Token Validation Debugging

**File: `frontend/middleware.ts`**
- **Request Tracking**: Unique request IDs for tracing
- **Token Detection**: Multi-source token detection with detailed logging
- **Token Validation**: JWT payload analysis with expiration checking
- **Role Authorization**: Detailed role hierarchy checking
- **Route Protection**: Enhanced logging for public vs protected routes
- **Redirect Logic**: Comprehensive logging for authentication redirects

**Features:**
- Grouped console logs with request IDs
- Token source identification (cookie, header, custom header)
- JWT payload decoding and validation
- Role permission analysis
- Performance and timing information

### 4. Token Synchronization Debugging

**File: `frontend/components/auth/token-sync.tsx`**
- **Token Validation**: JWT structure validation before setting cookies
- **Cookie Management**: Detailed cookie setting and verification
- **Fetch Interceptor**: Enhanced logging for API request token injection
- **Event Handling**: Comprehensive logging for cross-tab and same-tab sync events
- **Error Handling**: Robust error handling with detailed logging

**Features:**
- Token structure validation with payload analysis
- Cookie verification after setting
- Cross-tab synchronization logging
- Window focus and visibility change handling
- Fetch interceptor installation tracking

### 5. Authentication Debug Utilities

**File: `frontend/lib/auth-debug.ts`**

**Debug Information Capture:**
- Session state (user, token, authentication status)
- Local storage state (tokens, user data)
- Cookie state (all cookies, auth-specific cookies)
- URL information (path, parameters, hash)
- Last error information

**Debug Tools:**
- `window.authDebug.info()` - Display current auth state
- `window.authDebug.report()` - Generate troubleshooting report
- `window.authDebug.validateToken()` - Validate token structure
- `window.authDebug.clearError()` - Clear last error
- `window.authDebug.export()` - Export debug report to file

**Features:**
- Comprehensive state capture
- Token structure validation
- Troubleshooting report generation
- Developer console utilities
- Debug report export functionality

## Error Message Examples

### Network Errors
- **Message**: "Unable to connect to the server. Please check your internet connection and try again."
- **Action**: Check connection and retry
- **Auth State**: Preserved

### Authentication Errors
- **Message**: "Your session has expired. Please log in again."
- **Action**: Redirect to login
- **Auth State**: Cleared

### Authorization Errors
- **Message**: "Access denied. You don't have permission to perform this action."
- **Action**: Contact administrator
- **Auth State**: Cleared

### Server Errors
- **Message**: "Server error. Please try again later."
- **Action**: Wait and retry
- **Auth State**: Preserved

## Debug Console Commands

After logging in during development, the following debug commands are available:

```javascript
// Show comprehensive auth state
window.authDebug.info()

// Generate troubleshooting report
window.authDebug.report()

// Validate current token
window.authDebug.validateToken()

// Clear last error
window.authDebug.clearError()

// Export debug report
window.authDebug.export()
```

## Logging Format

All authentication logs follow a consistent format:
- **Prefix**: Emoji + [AUTH] or [AUTH-ERROR] + context
- **Grouping**: Related logs are grouped for better readability
- **Timing**: All logs include timestamps
- **Context**: Each log includes relevant context and state information
- **Severity**: Errors use appropriate console methods (log, warn, error)

## Benefits

1. **Faster Debugging**: Detailed logs help identify issues quickly
2. **Better Error Messages**: User-friendly messages with clear actions
3. **Comprehensive Monitoring**: All authentication state changes are tracked
4. **Development Tools**: Built-in debug utilities for developers
5. **Error Categorization**: Systematic error handling and classification
6. **Performance Insights**: Timing information for authentication operations

## Usage

The debugging system is automatically enabled in development mode. In production, only essential error logging is performed to avoid console noise while maintaining error tracking capabilities.

All authentication errors are stored in localStorage as `last_auth_error` for debugging purposes and can be accessed through the debug utilities.