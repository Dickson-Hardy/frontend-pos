'use client'

import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-unified'

interface Product {
  id: string
  name: string
  barcode?: string
  price: number
  stock: number
  category?: string
  description?: string
}

interface ScanResult {
  success: boolean
  product?: Product
  error?: string
  barcode: string
}

export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const lookupProduct = useCallback(async (barcode: string): Promise<ScanResult> => {
    setIsLoading(true)
    
    try {
      // First, try to find product by barcode
      const product = await apiClient.products.getByBarcode(barcode)
      
      if (product) {
        const result: ScanResult = {
          success: true,
          product: product,
          barcode
        }
        setLastScanResult(result)
        return result
      } else {
        // Product not found
        const result: ScanResult = {
          success: false,
          error: 'Product not found',
          barcode
        }
        setLastScanResult(result)
        return result
      }
    } catch (error) {
      console.error('Error looking up product:', error)
      const result: ScanResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Product not found',
        barcode
      }
      setLastScanResult(result)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleScan = useCallback(async (barcode: string) => {
    // Validate barcode format
    if (!isValidBarcode(barcode)) {
      const result: ScanResult = {
        success: false,
        error: 'Invalid barcode format',
        barcode
      }
      setLastScanResult(result)
      return result
    }

    // Lookup the product
    return await lookupProduct(barcode)
  }, [lookupProduct])

  const startScanning = useCallback(() => {
    setIsScanning(true)
    setLastScanResult(null)
  }, [])

  const stopScanning = useCallback(() => {
    setIsScanning(false)
  }, [])

  const clearLastResult = useCallback(() => {
    setLastScanResult(null)
  }, [])

  return {
    isScanning,
    isLoading,
    lastScanResult,
    startScanning,
    stopScanning,
    handleScan,
    lookupProduct,
    clearLastResult
  }
}

// Utility function to validate barcode formats
function isValidBarcode(barcode: string): boolean {
  // Remove any whitespace
  const cleanBarcode = barcode.trim()
  
  // Check for common barcode formats
  const formats = [
    /^\d{12}$/, // UPC-A (12 digits)
    /^\d{13}$/, // EAN-13 (13 digits)
    /^\d{8}$/, // EAN-8 (8 digits)
    /^[0-9A-Z\-\.\ \$\/\+\%]{1,43}$/, // Code 128 (variable length)
    /^\d{14}$/, // ITF-14 (14 digits)
  ]
  
  return formats.some(format => format.test(cleanBarcode))
}

// Utility function to format barcode for display
export function formatBarcode(barcode: string): string {
  const clean = barcode.trim()
  
  // Format UPC-A: 123456789012 -> 1-23456-78901-2
  if (/^\d{12}$/.test(clean)) {
    return `${clean[0]}-${clean.slice(1, 6)}-${clean.slice(6, 11)}-${clean[11]}`
  }
  
  // Format EAN-13: 1234567890123 -> 1-234567-890123
  if (/^\d{13}$/.test(clean)) {
    return `${clean[0]}-${clean.slice(1, 7)}-${clean.slice(7)}`
  }
  
  // Format EAN-8: 12345678 -> 1234-5678
  if (/^\d{8}$/.test(clean)) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`
  }
  
  return clean
}