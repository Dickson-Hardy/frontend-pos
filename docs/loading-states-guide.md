# Loading States & UI Feedback Guide

This guide covers all the loading states, skeleton loaders, empty states, and feedback components available in the application.

## Overview

The application provides a comprehensive set of loading states and UI feedback components to ensure users always understand what's happening and receive appropriate feedback for their actions.

## Components

### 1. Loading Spinners (`/components/ui/loading-spinner.tsx`)

Various loading spinner variants for different use cases:

```tsx
import { LoadingSpinner, InlineLoader, LoadingOverlay, ProgressLoader } from '@/components/ui/loading-spinner'

// Basic spinner
<LoadingSpinner size="md" text="Loading..." />

// Different variants
<LoadingSpinner variant="dots" />
<LoadingSpinner variant="pulse" />
<LoadingSpinner variant="bars" />

// Inline loader for buttons
<Button disabled>
  <InlineLoader className="mr-2" />
  Processing...
</Button>

// Loading overlay for cards/sections
<LoadingOverlay loading={isLoading} text="Saving...">
  <Card>Content here</Card>
</LoadingOverlay>

// Progress loader with percentage
<ProgressLoader progress={75} text="Uploading files..." />
```

### 2. Skeleton Loaders (`/components/ui/skeleton-loaders.tsx`)

Skeleton components that match the shape of actual content:

```tsx
import { 
  ProductCardSkeleton, 
  TableSkeleton, 
  StatCardSkeleton,
  ChartSkeleton,
  SearchResultsSkeleton,
  FormSkeleton,
  DashboardSkeleton,
  CashierSkeleton
} from '@/components/ui/skeleton-loaders'

// For dashboard stats
<div className="grid grid-cols-4 gap-4">
  {Array.from({ length: 4 }).map((_, i) => (
    <StatCardSkeleton key={i} />
  ))}
</div>

// For tables
<TableSkeleton rows={5} columns={6} />

// For search results
<SearchResultsSkeleton count={3} />

// Complete page skeletons
<DashboardSkeleton />
<CashierSkeleton />
```

### 3. Empty States (`/components/ui/empty-states.tsx`)

Components for when there's no data to display:

```tsx
import { 
  EmptyState,
  NoProductsFound,
  NoSearchResults,
  EmptyCart,
  NoTransactions,
  DataUnavailable
} from '@/components/ui/empty-states'

// Generic empty state
<EmptyState
  icon={Package}
  title="No products found"
  description="Add your first product to get started"
  action={{
    label: "Add Product",
    onClick: () => handleAddProduct()
  }}
/>

// Specific empty states
<NoProductsFound onAddProduct={handleAddProduct} />
<NoSearchResults searchTerm="aspirin" />
<EmptyCart />
<DataUnavailable onRetry={handleRetry} />
```

### 4. Feedback System (`/components/ui/feedback-system.tsx`)

Status indicators and user feedback components:

```tsx
import { 
  StatusIndicator,
  ActionFeedback,
  NetworkStatus,
  SyncStatus,
  ValidationFeedback
} from '@/components/ui/feedback-system'

// Status indicators
<StatusIndicator status="success" message="Operation successful" />
<StatusIndicator status="error" message="Something went wrong" />
<StatusIndicator status="loading" message="Processing..." />

// Action feedback with retry
<ActionFeedback
  status="error"
  errorMessage="Failed to save data"
  onRetry={handleRetry}
  onDismiss={handleDismiss}
/>

// Network status
<NetworkStatus showWhenOnline />

// Sync status
<SyncStatus
  status="syncing"
  lastSyncTime={new Date()}
  onSync={handleSync}
/>

// Form validation feedback
<ValidationFeedback
  errors={{ name: "Name is required" }}
  touched={{ name: true }}
/>
```

### 5. Progress Indicators (`/components/ui/progress-indicator.tsx`)

Progress and step indicators for multi-step processes:

```tsx
import { 
  ProgressIndicator,
  LinearProgress,
  CircularProgress,
  FormProgress
} from '@/components/ui/progress-indicator'

// Step-by-step progress
const steps = [
  { id: '1', title: 'Validate', status: 'completed' },
  { id: '2', title: 'Process', status: 'current' },
  { id: '3', title: 'Complete', status: 'pending' },
]
<ProgressIndicator steps={steps} />

// Linear progress bar
<LinearProgress value={75} max={100} showPercentage />

// Circular progress
<CircularProgress value={60} showPercentage />

// Form progress
<FormProgress
  currentStep={2}
  totalSteps={4}
  stepTitles={['Info', 'Details', 'Review', 'Complete']}
/>
```

### 6. Toast Notifications (`/lib/toast-utils.ts`)

Enhanced toast utilities with consistent styling:

```tsx
import { 
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
  toastPromise
} from '@/lib/toast-utils'

// Basic toasts
showSuccessToast('Operation completed successfully')
showErrorToast('Something went wrong')
showWarningToast('This action requires attention')
showInfoToast('Here is some information')

// Loading toast with update
const loadingToast = showLoadingToast('Processing...')
// Later...
loadingToast.success('Completed!')
// or
loadingToast.error('Failed!')

// Promise-based toast
toastPromise(
  apiCall(),
  {
    loading: 'Saving...',
    success: 'Saved successfully!',
    error: 'Failed to save'
  }
)

// Business-specific toasts
showSaleSuccessToast('POS-001', 45.99)
showInventoryUpdateToast('Aspirin', 150)
showLowStockWarning('Ibuprofen', 5)
```

## Hooks

### 1. Enhanced Loading Hook (`/hooks/use-enhanced-loading.ts`)

Comprehensive loading state management:

```tsx
import { useEnhancedLoading } from '@/hooks/use-enhanced-loading'

function MyComponent() {
  const {
    loading,
    error,
    success,
    data,
    executeAsync,
    fetchData,
    submitForm,
    saveData,
    reset
  } = useEnhancedLoading()

  const handleFetch = () => {
    fetchData(
      () => apiClient.products.getAll(),
      {
        showToast: true,
        successMessage: 'Products loaded successfully'
      }
    )
  }

  const handleSubmit = () => {
    submitForm(
      () => apiClient.products.create(formData),
      {
        showGlobalLoading: true,
        successMessage: 'Product created successfully'
      }
    )
  }

  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">Success!</div>}
      {data && <div>Data: {JSON.stringify(data)}</div>}
    </div>
  )
}
```

### 2. Loading States Hook (`/hooks/use-loading-states.ts`)

Manage multiple loading states:

```tsx
import { useLoadingStates } from '@/hooks/use-loading-states'

function MyComponent() {
  const {
    isLoading,
    hasError,
    getError,
    setLoading,
    setError,
    setSuccess,
    executeAsync
  } = useLoadingStates(['products', 'users', 'orders'])

  const loadProducts = () => {
    executeAsync('products', () => apiClient.products.getAll())
  }

  return (
    <div>
      {isLoading('products') && <LoadingSpinner />}
      {hasError('products') && <div>{getError('products')}</div>}
    </div>
  )
}
```

### 3. Form Loading Hook (`/hooks/use-loading-states.ts`)

Specialized hook for form submissions:

```tsx
import { useFormLoadingState } from '@/hooks/use-loading-states'

function MyForm() {
  const {
    isSubmitting,
    submitError,
    isSubmitSuccess,
    submitForm,
    resetSubmit
  } = useFormLoadingState()

  const handleSubmit = () => {
    submitForm(
      () => apiClient.products.create(formData),
      {
        onSuccess: (result) => {
          console.log('Product created:', result)
          resetForm()
        },
        onError: (error) => {
          console.error('Failed to create product:', error)
        }
      }
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <InlineLoader className="mr-2" /> : null}
        {isSubmitting ? 'Creating...' : 'Create Product'}
      </Button>
      {submitError && <div className="text-red-500">{submitError}</div>}
      {isSubmitSuccess && <div className="text-green-500">Product created!</div>}
    </form>
  )
}
```

## Context Providers

### Loading Context (`/contexts/loading-context.tsx`)

Global loading state management:

```tsx
import { useLoading } from '@/contexts/loading-context'

function MyComponent() {
  const { showGlobalLoading, hideGlobalLoading, withGlobalLoading } = useLoading()

  const handleLongOperation = async () => {
    await withGlobalLoading(
      async () => {
        // Long running operation
        await new Promise(resolve => setTimeout(resolve, 3000))
      },
      'Processing your request...'
    )
  }

  return (
    <Button onClick={handleLongOperation}>
      Start Long Operation
    </Button>
  )
}
```

## Best Practices

### 1. Choose the Right Loading State

- **Skeleton loaders**: For initial page loads and known content structure
- **Spinners**: For quick operations and unknown content structure
- **Progress indicators**: For multi-step processes or file uploads
- **Empty states**: When there's no data to display

### 2. Provide Meaningful Feedback

```tsx
// Good: Specific loading message
<LoadingSpinner text="Loading products..." />

// Better: Context-aware message
<LoadingSpinner text="Searching for 'aspirin'..." />

// Good: Specific error message
showErrorToast('Failed to save product. Please check your internet connection.')

// Better: Actionable error message
showErrorToast('Failed to save product. Please check your internet connection.', {
  action: {
    label: 'Retry',
    onClick: () => handleRetry()
  }
})
```

### 3. Handle Edge Cases

```tsx
function ProductList() {
  const { products, loading, error } = useProducts()

  if (loading) {
    return <TableSkeleton rows={5} columns={6} />
  }

  if (error) {
    return <DataUnavailable onRetry={refetch} />
  }

  if (!products || products.length === 0) {
    return <NoProductsFound onAddProduct={handleAddProduct} />
  }

  return (
    <Table>
      {/* render products */}
    </Table>
  )
}
```

### 4. Consistent Timing

```tsx
// Use consistent auto-hide timing for success messages
showSuccessToast('Product saved', { duration: 3000 })

// Longer duration for error messages (users need time to read)
showErrorToast('Failed to save product', { duration: 6000 })

// No auto-hide for critical errors
showErrorToast('Network connection lost', { duration: 0 })
```

### 5. Accessibility

All loading states and feedback components include proper ARIA labels and keyboard navigation support:

```tsx
// Loading spinners include aria-label
<LoadingSpinner text="Loading products" /> // Includes aria-label="Loading products"

// Empty states include proper heading structure
<EmptyState title="No products found" /> // Uses proper heading tags

// Toast notifications are announced to screen readers
showSuccessToast('Product saved') // Announced as "Success: Product saved"
```

## Testing

### Testing Loading States

```tsx
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

test('shows loading spinner with text', () => {
  render(<LoadingSpinner text="Loading..." />)
  expect(screen.getByLabelText('Loading...')).toBeInTheDocument()
})
```

### Testing Empty States

```tsx
test('shows empty state when no data', () => {
  render(<NoProductsFound onAddProduct={mockAddProduct} />)
  expect(screen.getByText('No products found')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Add Product' })).toBeInTheDocument()
})
```

### Testing Toast Notifications

```tsx
import { showSuccessToast } from '@/lib/toast-utils'

test('shows success toast', async () => {
  showSuccessToast('Operation successful')
  expect(await screen.findByText('Operation successful')).toBeInTheDocument()
})
```

## Demo Component

A comprehensive demo component is available at `/components/ui/loading-feedback-demo.tsx` that showcases all loading states and feedback components. This can be used for:

- Testing different loading states
- Design review and approval
- Developer reference
- User training

To use the demo:

```tsx
import { LoadingFeedbackDemo } from '@/components/ui/loading-feedback-demo'

// Add to a route or page
<LoadingFeedbackDemo />
```

## Migration Guide

When updating existing components to use the new loading states:

1. **Replace basic loading states**:
   ```tsx
   // Before
   {loading && <div>Loading...</div>}
   
   // After
   {loading && <LoadingSpinner text="Loading products..." />}
   ```

2. **Replace empty divs with skeleton loaders**:
   ```tsx
   // Before
   {loading && <div className="animate-pulse bg-gray-200 h-4 w-20" />}
   
   // After
   {loading && <ProductCardSkeleton />}
   ```

3. **Add empty states**:
   ```tsx
   // Before
   {products.length === 0 && <div>No products</div>}
   
   // After
   {products.length === 0 && <NoProductsFound onAddProduct={handleAdd} />}
   ```

4. **Replace alert() with toast notifications**:
   ```tsx
   // Before
   alert('Product saved successfully')
   
   // After
   showSuccessToast('Product saved successfully')
   ```

This comprehensive loading states and feedback system ensures a consistent, professional user experience throughout the application.