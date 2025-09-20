/**
 * Currency utility functions for Sierra Leone Leones (SLL)
 * Provides consistent currency formatting across the pharmacy system
 */

/**
 * Format amount in Sierra Leone Leones
 * @param amount - The numeric amount to format
 * @param showSymbol - Whether to show the "Le" symbol (default: true)
 * @returns Formatted currency string
 */
export function formatSLL(amount: number, showSymbol: boolean = true): string {
  if (isNaN(amount)) return showSymbol ? 'Le 0' : '0'
  
  const formattedAmount = Math.abs(amount).toLocaleString('en-SL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  
  const sign = amount < 0 ? '-' : ''
  const symbol = showSymbol ? 'Le ' : ''
  
  return `${sign}${symbol}${formattedAmount}`
}

/**
 * Parse SLL currency string to number
 * @param currencyString - String like "Le 1,234,567" or "1,234,567"
 * @returns Numeric value
 */
export function parseSLL(currencyString: string): number {
  if (!currencyString) return 0
  
  // Remove "Le" symbol, spaces, and commas
  const cleanString = currencyString
    .replace(/Le\s*/gi, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
  
  const parsed = parseFloat(cleanString)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format SLL amount for display in tables/lists
 * @param amount - The numeric amount
 * @returns Shortened format (e.g., "Le 1.2M" for millions)
 */
export function formatSLLShort(amount: number): string {
  if (isNaN(amount)) return 'Le 0'
  
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  
  if (absAmount >= 1000000000) {
    return `${sign}Le ${(absAmount / 1000000000).toFixed(1)}B`
  } else if (absAmount >= 1000000) {
    return `${sign}Le ${(absAmount / 1000000).toFixed(1)}M`
  } else if (absAmount >= 1000) {
    return `${sign}Le ${(absAmount / 1000).toFixed(1)}K`
  } else {
    return `${sign}Le ${absAmount.toLocaleString('en-SL')}`
  }
}

/**
 * Format SLL amount for input fields
 * @param amount - The numeric amount
 * @returns String suitable for input fields (no symbol, with commas)
 */
export function formatSLLInput(amount: number): string {
  if (isNaN(amount) || amount === 0) return ''
  
  return amount.toLocaleString('en-SL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

/**
 * Sierra Leone Leones denominations for cash counting
 */
export const SLL_DENOMINATIONS = [
  { key: 'ten_thousand', label: 'Le 10,000 Notes', value: 10000, color: 'bg-green-100 text-green-800' },
  { key: 'five_thousand', label: 'Le 5,000 Notes', value: 5000, color: 'bg-blue-100 text-blue-800' },
  { key: 'two_thousand', label: 'Le 2,000 Notes', value: 2000, color: 'bg-purple-100 text-purple-800' },
  { key: 'one_thousand', label: 'Le 1,000 Notes', value: 1000, color: 'bg-orange-100 text-orange-800' },
  { key: 'five_hundred', label: 'Le 500 Notes', value: 500, color: 'bg-pink-100 text-pink-800' },
  { key: 'one_hundred', label: 'Le 100 Coins', value: 100, color: 'bg-gray-100 text-gray-800' },
  { key: 'fifty', label: 'Le 50 Coins', value: 50, color: 'bg-yellow-100 text-yellow-800' },
  { key: 'ten', label: 'Le 10 Coins', value: 10, color: 'bg-cyan-100 text-cyan-800' },
  { key: 'five', label: 'Le 5 Coins', value: 5, color: 'bg-indigo-100 text-indigo-800' },
  { key: 'one', label: 'Le 1 Coins', value: 1, color: 'bg-red-100 text-red-800' }
] as const

/**
 * Calculate total from SLL cash count
 * @param cashCount - Object with denomination counts
 * @returns Total value in SLL
 */
export function calculateSLLTotal(cashCount: Record<string, number>): number {
  return SLL_DENOMINATIONS.reduce((total, denom) => {
    const count = cashCount[denom.key] || 0
    return total + (count * denom.value)
  }, 0)
}

/**
 * Typical Sierra Leone pharmacy pricing
 */
export const SLL_TYPICAL_AMOUNTS = {
  // Starting cash for pharmacy drawer
  STARTING_CASH: 2000000, // Le 2,000,000
  
  // Variance thresholds
  MINOR_VARIANCE: 50000,      // Le 50,000
  SIGNIFICANT_VARIANCE: 200000, // Le 200,000
  CRITICAL_VARIANCE: 500000,   // Le 500,000
  
  // Common medication price ranges
  BASIC_MEDICATION: 2500,     // Le 2,500
  PRESCRIPTION_DRUG: 15000,   // Le 15,000
  SPECIALTY_MEDICINE: 75000,  // Le 75,000
  
  // Daily sales ranges
  DAILY_SALES_LOW: 5000000,   // Le 5,000,000
  DAILY_SALES_AVG: 15000000,  // Le 15,000,000
  DAILY_SALES_HIGH: 30000000, // Le 30,000,000
} as const

export default {
  formatSLL,
  parseSLL,
  formatSLLShort,
  formatSLLInput,
  calculateSLLTotal,
  SLL_DENOMINATIONS,
  SLL_TYPICAL_AMOUNTS
}