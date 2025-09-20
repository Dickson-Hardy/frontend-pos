# Middleware Token Detection and Redirect Loop Fixes

## Problem Summary

The application was experiencing redirect loops during authentication due to:

1. **Token Storage Inconsistency**: Middleware couldn't access localStorage tokens
2. **Redirect Loop**: Login page and middleware creating circular redirects
3. **Missing Token Sync**: No mechanism to sync tokens between localStorage and cookies
4. **Race Conditions**: Authentication state not properly synchronized

## Solution Implementation

### 1. Enhanced Middleware Token Detection

**File**: `frontend/middleware.ts`

**Changes**:
- Added multiple token detection methods (cookie, custom header, authorization header)
- Improved token validation with expiry checking
- Added proper redirect logic to prevent loops
- Enhanced route protection with role-based access

**Key Features**:
```typescript
// Multiple token sources
const cookieToken = request.cookies.get('auth_token')?.value
const clientToken = request.headers.get('x-auth-token')
const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
const token = cookieToken || clientToken || headerToken

// Prevent redirect loops on login page
if (token && pathname === '/login') {
  // Redirect authenticated users away from login
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

### 2. Token Synchronization Component

**File**: `frontend/components/auth/token-sync.tsx`

**Purpose**: Ensures localStorage tokens are always available to middleware via cookies

**Features**:
- Automatic token sync on component mount
- Cross-tab synchronization via storage events
- Custom event handling for same-tab updates
- Fetch interceptor for consistent token headers

### 3. Enhanced Authentication Context

**File**: `frontend/contexts/auth-context.tsx`

**Improvements**:
- Consistent cookie setting on login and token validation
- Proper token cleanup on logout
- Token update notifications for sync component
- Better error handling to prevent state corruption

### 4. Improved Login Flow

**Files**: 
- `frontend/app/login/page.tsx`
- `frontend/hooks/use-auth-actions.ts`

**Changes**:
- Use `router.replace()` instead of `router.push()` to prevent back button issues
- Better authentication state checking before redirects
- Increased delay after login to ensure token sync

## How It Works

### Token Storage Flow

1. **Login**: User authenticates
2. **Storage**: Token stored in localStorage AND cookie
3. **Sync**: TokenSync component ensures consistency
4. **Middleware**: Detects token from cookie/headers
5. **Validation**: Middleware validates token structure and expiry

### Role-Based Redirect Prevention

1. **Authenticated User on Login Page**: Middleware redirects to role-specific page (admin→/admin, cashier→/cashier, etc.)
2. **Unauthenticated User on Protected Route**: Middleware redirects to login
3. **Invalid/Expired Token**: Clear state and redirect to login
4. **Role Insufficient**: Redirect to user's appropriate role page
5. **Login Success**: Client-side redirects to role-specific page or requested page

### Token Detection Priority

1. **Cookie** (`auth_token`) - Primary method for middleware
2. **Custom Header** (`x-auth-token`) - Set by TokenSync component
3. **Authorization Header** (`Bearer token`) - Standard HTTP auth

## Testing the Fix

### Manual Testing Steps

1. **Role-Based Login Flow**:
   - Navigate to `/login`
   - Enter admin credentials and login
   - Should redirect to `/admin` without loops
   - Try with different roles (cashier→/cashier, manager→/manager)

2. **Protected Route Access**:
   - Try accessing `/dashboard` without login
   - Should redirect to login with return URL
   - After login, should return to requested page

3. **Authenticated User on Login**:
   - Login successfully as admin
   - Navigate to `/login` directly
   - Should redirect to `/admin` immediately (not dashboard)

4. **Role-Based Access Control**:
   - Login as cashier
   - Try accessing `/admin`
   - Should redirect to `/cashier` (their appropriate page)

5. **Token Expiry**:
   - Login and wait for token expiry (or manually expire)
   - Try accessing protected route
   - Should redirect to login

6. **Cross-Tab Sync**:
   - Login in one tab
   - Open new tab and navigate to protected route
   - Should work without re-authentication

### Debug Information

The middleware logs detailed information for debugging:

```typescript
console.log('Middleware check:', { 
  pathname, 
  hasToken: !!token, 
  cookieToken: !!cookieToken, 
  clientToken: !!clientToken,
  headerToken: !!headerToken 
})
```

## Requirements Addressed

- **6.1**: ✅ Middleware properly detects localStorage tokens via cookies
- **6.2**: ✅ Fixed redirect loop between login page and dashboard  
- **6.3**: ✅ Consistent token storage method (localStorage + cookie)
- **6.4**: ✅ Proper authentication state detection in middleware

## Files Modified

1. `frontend/middleware.ts` - Enhanced token detection and redirect logic
2. `frontend/contexts/auth-context.tsx` - Consistent token storage
3. `frontend/components/auth/token-sync.tsx` - New token sync component
4. `frontend/app/layout.tsx` - Added TokenSync component
5. `frontend/app/login/page.tsx` - Improved redirect handling
6. `frontend/hooks/use-auth-actions.ts` - Better navigation after login

## Security Considerations

- Tokens are stored in httpOnly-capable cookies when possible
- Token expiry is validated in middleware
- Invalid tokens trigger immediate cleanup
- Role-based access control maintained
- Secure flag set for HTTPS environments