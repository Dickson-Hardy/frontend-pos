# Comprehensive Error Handling System

This document describes the comprehensive error handling system implemented in the frontend application.

## Overview

The error handling system provides:
- **Error Boundaries** for component-level error catching
- **User-friendly error messages** with retry mechanisms
- **Network connectivity detection** and offline handling
- **Fallback UI components** for various error states
- **Centralized error reporting** and logging
- **Retry mechanisms** with exponential backoff
- **Form validation error handling**

## Components

### 1. Error Boundaries

#### Enhanced ErrorBoundary Component
```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary'

<ErrorBoundary 
  level="component" // 'page' | 'component' | 'global'
  showHomeButton={true}
  onError={(error, errorInfo) => console.log('Error caught:', error)}
>
  <YourComponent />
</ErrorBoundary>
```

Features:
- Automatic retry with limits
- Different UI based on error severity
- Development mode error details
- Chunk loading error detection
- Error ID generation for tracking

### 2. Network Status & Offline Handling

#### NetworkStatus Component
```tsx
import { NetworkStatus } from '@/components/ui/error-message'

// Automatically shows connection status
<NetworkStatus />
```

#### useOffline Hook
```tsx
import { useOffline } from '@/hooks/use-offline'

function MyComponent() {
  const { isOnline, isOffline, wasOffline } = useOffline({
    showToasts: true,
    onOnline: () => console.log('Back online!'),
    onOffline: () => console.log('Gone offline!'),
  })
  
  return (
    <div>
      Status: {isOnline ? 'Online' : 'Offline'}
    </div>
  )
}
```

### 3. Fallback UI Components

#### FallbackUI Component
```tsx
import { FallbackUI, ErrorFallback, LoadingFallback, EmptyFallback } from '@/components/ui/fallback-ui'

// Generic fallback
<FallbackUI 
  type="error" 
  title="Something went wrong"
  description="Please try again"
  action={<Button onClick={retry}>Retry</Button>}
/>

// Specialized fallbacks
<ErrorFallback error="Network error" onRetry={handleRetry} />
<LoadingFallback message="Loading data..." />
<EmptyFallback title="No data" description="Nothing to show" />
```

### 4. Error Handling Hooks

#### useErrorHandler Hook
```tsx
import { useErrorHandler } from '@/hooks/use-error-handler'

function MyComponent() {
  const { handleError, clearError, retryWithErrorHandling } = useErrorHandler({
    showToast: true,
    logError: true,
    onError: (error) => console.log('Custom error handling:', error)
  })
  
  const fetchData = async () => {
    try {
      const data = await api.getData()
      return data
    } catch (error) {
      handleError(error)
    }
  }
  
  const fetchWithRetry = () => {
    retryWithErrorHandling(
      () => api.getData(),
      { maxRetries: 3, retryDelay: 1000 }
    )
  }
}
```

#### useAsyncOperation Hook
```tsx
import { useAsyncOperation } from '@/hooks/use-error-handler'

function MyComponent() {
  const { execute, isLoading, error } = useAsyncOperation()
  
  const handleSubmit = () => {
    execute(
      () => api.submitForm(data),
      {
        onSuccess: (result) => console.log('Success:', result),
        onError: (error) => console.log('Error:', error),
        showSuccessToast: true,
        successMessage: 'Form submitted successfully!'
      }
    )
  }
}
```

### 5. Error Context Provider

#### ErrorProvider
```tsx
import { ErrorProvider } from '@/contexts/error-context'

<ErrorProvider 
  enableErrorReporting={true}
  errorReportingConfig={{
    endpoint: '/api/errors',
    apiKey: 'your-api-key',
    userId: user?.id
  }}
>
  <App />
</ErrorProvider>
```

#### useError Hook
```tsx
import { useError } from '@/contexts/error-context'

function MyComponent() {
  const { 
    handleError, 
    handleApiError, 
    handleComponentError,
    isOnline,
    retryWithErrorHandling 
  } = useError()
  
  // Handle different types of errors
  handleError(new Error('General error'), 'component-context')
  handleApiError(apiError, '/api/endpoint', 'POST')
  handleComponentError(error, 'MyComponent', 'button-click')
}
```

### 6. Error Reporting

#### Automatic Error Reporting
```tsx
import { errorReporting, reportError, reportApiError } from '@/lib/error-reporting'

// Manual error reporting
reportError(error, 'context', { metadata: { userId: '123' } })
reportApiError(apiError, '/api/users', 'GET')

// Configure error reporting
errorReporting.updateConfig({
  enabled: true,
  endpoint: '/api/error-reports',
  apiKey: 'your-key'
})
```

## Usage Patterns

### 1. Component Error Handling

```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { withErrorHandling } from '@/contexts/error-context'

// Option 1: Wrap with ErrorBoundary
function MyComponent() {
  return (
    <ErrorBoundary level="component">
      <ComponentThatMightError />
    </ErrorBoundary>
  )
}

// Option 2: Use HOC
const SafeComponent = withErrorHandling(ComponentThatMightError, 'MyComponent')
```

### 2. API Error Handling

```tsx
import { useError } from '@/contexts/error-context'
import { apiClient } from '@/lib/api-unified'

function useApiData() {
  const { handleApiError } = useError()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await apiClient.getData()
      setData(result)
    } catch (error) {
      handleApiError(error, '/api/data', 'GET')
    } finally {
      setLoading(false)
    }
  }
  
  return { data, loading, fetchData }
}
```

### 3. Form Error Handling

```tsx
import { useFormErrorHandling } from '@/contexts/error-context'

function MyForm() {
  const { fieldErrors, handleFormError, clearFieldError } = useFormErrorHandling()
  
  const handleSubmit = async (formData) => {
    try {
      await api.submitForm(formData)
    } catch (error) {
      handleFormError(error) // Automatically handles validation errors
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        onChange={() => clearFieldError('email')}
      />
      {fieldErrors.email && (
        <span className="error">{fieldErrors.email}</span>
      )}
    </form>
  )
}
```

### 4. Offline-Capable Operations

```tsx
import { useOfflineCapable } from '@/hooks/use-offline'

function MyComponent() {
  const { executeWhenOnline, queuedOperationsCount } = useOfflineCapable()
  
  const handleAction = () => {
    executeWhenOnline(
      () => api.performAction(),
      {
        onSuccess: (result) => console.log('Action completed:', result),
        onError: (error) => console.log('Action failed:', error)
      }
    )
  }
  
  return (
    <div>
      <button onClick={handleAction}>Perform Action</button>
      {queuedOperationsCount > 0 && (
        <p>{queuedOperationsCount} operations queued for when online</p>
      )}
    </div>
  )
}
```

## Configuration

### Environment Variables

```env
# Error reporting
NEXT_PUBLIC_ERROR_REPORTING_ENABLED=true
NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT=/api/errors
NEXT_PUBLIC_ERROR_REPORTING_API_KEY=your-api-key

# Network monitoring
NEXT_PUBLIC_NETWORK_PING_URL=/api/health
NEXT_PUBLIC_NETWORK_PING_INTERVAL=30000
```

### Global Configuration

```tsx
// In your root layout or app component
import { ErrorProvider } from '@/contexts/error-context'

export default function RootLayout({ children }) {
  return (
    <ErrorProvider
      enableErrorReporting={process.env.NODE_ENV === 'production'}
      errorReportingConfig={{
        endpoint: process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT,
        apiKey: process.env.NEXT_PUBLIC_ERROR_REPORTING_API_KEY,
      }}
    >
      {children}
    </ErrorProvider>
  )
}
```

## Best Practices

1. **Use Error Boundaries** at appropriate levels (page, component, global)
2. **Handle API errors** consistently using the error context
3. **Provide meaningful error messages** to users
4. **Implement retry mechanisms** for transient errors
5. **Test error scenarios** during development
6. **Monitor error reports** in production
7. **Handle offline scenarios** gracefully
8. **Use fallback UIs** for better user experience

## Testing Error Handling

```tsx
// Use the demo component for testing
import { ErrorHandlingDemo } from '@/components/ui/error-handling-demo'

// In your development environment
<ErrorHandlingDemo />
```

This will provide buttons to simulate various error scenarios and test the error handling system.