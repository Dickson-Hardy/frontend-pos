'use client'

import { toast } from 'sonner'

// Enhanced toast utilities with consistent styling and behavior

export interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  dismissible?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

// Success toast
export function showSuccessToast(message: string, options?: ToastOptions) {
  return toast.success(message, {
    duration: options?.duration || 4000,
    position: options?.position,
    dismissible: options?.dismissible !== false,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  })
}

// Error toast
export function showErrorToast(message: string, options?: ToastOptions) {
  return toast.error(message, {
    duration: options?.duration || 6000,
    position: options?.position,
    dismissible: options?.dismissible !== false,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  })
}

// Warning toast
export function showWarningToast(message: string, options?: ToastOptions) {
  return toast.warning(message, {
    duration: options?.duration || 5000,
    position: options?.position,
    dismissible: options?.dismissible !== false,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  })
}

// Info toast
export function showInfoToast(message: string, options?: ToastOptions) {
  return toast.info(message, {
    duration: options?.duration || 4000,
    position: options?.position,
    dismissible: options?.dismissible !== false,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  })
}

// Loading toast (returns a function to update/dismiss)
export function showLoadingToast(message: string, options?: Omit<ToastOptions, 'duration'>) {
  const toastId = toast.loading(message, {
    position: options?.position,
    dismissible: options?.dismissible !== false,
  })

  return {
    success: (successMessage: string) => {
      toast.success(successMessage, {
        id: toastId,
      })
    },
    error: (errorMessage: string) => {
      toast.error(errorMessage, {
        id: toastId,
      })
    },
    dismiss: () => {
      toast.dismiss(toastId)
    },
  }
}

// Specific business logic toasts

export function showSaleSuccessToast(saleNumber: string, total: number) {
  return showSuccessToast(
    `Sale #${saleNumber} completed successfully. Total: $${total.toFixed(2)}`,
    {
      duration: 5000,
      action: {
        label: 'Print Receipt',
        onClick: () => {
          // Handle print receipt
          console.log('Print receipt for sale:', saleNumber)
        }
      }
    }
  )
}

export function showInventoryUpdateToast(productName: string, newStock: number) {
  return showSuccessToast(
    `${productName} stock updated to ${newStock} units`,
    { duration: 3000 }
  )
}

export function showLowStockWarning(productName: string, currentStock: number) {
  return showWarningToast(
    `Low stock alert: ${productName} has only ${currentStock} units remaining`,
    {
      duration: 8000,
      action: {
        label: 'Reorder',
        onClick: () => {
          // Navigate to reorder page
          console.log('Navigate to reorder for:', productName)
        }
      }
    }
  )
}

export function showNetworkErrorToast() {
  return showErrorToast(
    'Network connection lost. Some features may not work properly.',
    {
      duration: 10000,
      action: {
        label: 'Retry',
        onClick: () => {
          window.location.reload()
        }
      }
    }
  )
}

export function showAuthErrorToast() {
  return showErrorToast(
    'Your session has expired. Please log in again.',
    {
      duration: 8000,
      action: {
        label: 'Login',
        onClick: () => {
          window.location.href = '/login'
        }
      }
    }
  )
}

export function showDataSavedToast(itemType: string = 'Data') {
  return showSuccessToast(`${itemType} saved successfully`, { duration: 3000 })
}

export function showDataDeletedToast(itemType: string = 'Item') {
  return showSuccessToast(`${itemType} deleted successfully`, { duration: 3000 })
}

export function showValidationErrorToast(message: string = 'Please check your input and try again') {
  return showErrorToast(`Validation error: ${message}`, { duration: 5000 })
}

export function showPermissionErrorToast() {
  return showErrorToast(
    'You do not have permission to perform this action.',
    { duration: 5000 }
  )
}

// Batch operations
export function showBatchOperationToast(
  operation: string,
  successCount: number,
  totalCount: number,
  errors?: string[]
) {
  if (successCount === totalCount) {
    return showSuccessToast(
      `${operation} completed successfully for all ${totalCount} items`,
      { duration: 4000 }
    )
  } else if (successCount > 0) {
    return showWarningToast(
      `${operation} completed for ${successCount} of ${totalCount} items. ${totalCount - successCount} failed.`,
      {
        duration: 6000,
        action: errors ? {
          label: 'View Errors',
          onClick: () => {
            console.log('Batch operation errors:', errors)
          }
        } : undefined
      }
    )
  } else {
    return showErrorToast(
      `${operation} failed for all ${totalCount} items`,
      { duration: 6000 }
    )
  }
}

// Utility to dismiss all toasts
export function dismissAllToasts() {
  toast.dismiss()
}

// Promise-based toast for async operations
export async function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }
): Promise<T> {
  toast.promise(promise, {
    loading: messages.loading,
    success: (data) => {
      return typeof messages.success === 'function' 
        ? messages.success(data) 
        : messages.success
    },
    error: (error) => {
      return typeof messages.error === 'function' 
        ? messages.error(error) 
        : messages.error
    },
  })
  
  return promise
}