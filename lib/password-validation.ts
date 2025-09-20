/**
 * Password validation utilities
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'fair' | 'good' | 'strong'
  score: number
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = []
  let score = 0
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else if (password.length >= 8) {
    score += 1
  }
  
  if (password.length >= 12) {
    score += 1
  }
  
  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }
  
  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }
  
  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 1
  }
  
  // Special character check
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)')
  } else {
    score += 1
  }
  
  // Common password patterns check
  const commonPatterns = [
    /^123456/,
    /^password/i,
    /^admin/i,
    /^qwerty/i,
    /(.)\1{3,}/ // Repeated characters
  ]
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns and is not secure')
      score = Math.max(0, score - 2)
      break
    }
  }
  
  // Dictionary words check (basic)
  const commonWords = ['password', 'admin', 'user', 'test', 'pharmacy', 'medicine']
  const lowerPassword = password.toLowerCase()
  for (const word of commonWords) {
    if (lowerPassword.includes(word)) {
      errors.push('Password should not contain common words')
      score = Math.max(0, score - 1)
      break
    }
  }
  
  // Determine strength based on score
  let strength: 'weak' | 'fair' | 'good' | 'strong'
  if (score <= 2) {
    strength = 'weak'
  } else if (score <= 4) {
    strength = 'fair'
  } else if (score <= 5) {
    strength = 'good'
  } else {
    strength = 'strong'
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  }
}

export const getPasswordStrengthColor = (strength: string): string => {
  switch (strength) {
    case 'weak':
      return 'text-red-500'
    case 'fair':
      return 'text-orange-500'
    case 'good':
      return 'text-yellow-500'
    case 'strong':
      return 'text-green-500'
    default:
      return 'text-gray-500'
  }
}

export const getPasswordStrengthBg = (strength: string): string => {
  switch (strength) {
    case 'weak':
      return 'bg-red-500'
    case 'fair':
      return 'bg-orange-500'
    case 'good':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-green-500'
    default:
      return 'bg-gray-300'
  }
}

export const generateSecurePassword = (length: number = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '@$!%*?&'
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}