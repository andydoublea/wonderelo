/**
 * Centralized validation utilities
 * Prevents duplication across components
 */

/**
 * Email validation regex
 * Follows standard email format: local@domain.extension
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone number validation regex
 * Supports international format with optional + prefix
 * Format: +[country code][number] (e.g., +421901234567)
 */
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Validate email address
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate phone number
 * Supports international format with optional + prefix
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Validate URL slug
 * Allows alphanumeric characters, hyphens, and underscores
 * Must be between 3 and 50 characters
 * @param slug - URL slug to validate
 * @returns true if valid, false otherwise
 */
export function validateUrlSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  const trimmed = slug.trim();
  
  // Length check
  if (trimmed.length < 3 || trimmed.length > 50) {
    return false;
  }
  
  // Only alphanumeric, hyphens, and underscores
  const slugRegex = /^[a-zA-Z0-9-_]+$/;
  return slugRegex.test(trimmed);
}

/**
 * Validate required field
 * @param value - Value to validate
 * @returns true if not empty, false otherwise
 */
export function validateRequired(value: string): boolean {
  return Boolean(value && value.trim().length > 0);
}

/**
 * Validate minimum length
 * @param value - Value to validate
 * @param minLength - Minimum length required
 * @returns true if meets minimum length, false otherwise
 */
export function validateMinLength(value: string, minLength: number): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return value.trim().length >= minLength;
}

/**
 * Validate maximum length
 * @param value - Value to validate
 * @param maxLength - Maximum length allowed
 * @returns true if within maximum length, false otherwise
 */
export function validateMaxLength(value: string, maxLength: number): boolean {
  if (!value || typeof value !== 'string') {
    return true; // Empty is valid for max length
  }
  return value.trim().length <= maxLength;
}

/**
 * Validate password strength
 * Must be at least 8 characters long
 * @param password - Password to validate
 * @returns Object with isValid boolean and error message
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  return { isValid: true };
}

/**
 * Validate that two passwords match
 * @param password - First password
 * @param confirmPassword - Second password to compare
 * @returns true if passwords match, false otherwise
 */
export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

/**
 * Sanitize string for display
 * Removes extra whitespace and trims
 * @param value - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Format phone number for display
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) {
    return '';
  }
  
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  return cleaned;
}

/**
 * Get validation error message for email
 * @param email - Email to validate
 * @returns Error message or empty string if valid
 */
export function getEmailError(email: string): string {
  if (!email || !email.trim()) {
    return 'Please fill in this field';
  }
  
  if (!validateEmail(email)) {
    return 'Please enter a valid email address';
  }
  
  return '';
}

/**
 * Get validation error message for phone
 * @param phone - Phone number to validate
 * @returns Error message or empty string if valid
 */
export function getPhoneError(phone: string): string {
  if (!phone || !phone.trim()) {
    return 'Please fill in this field';
  }
  
  if (!validatePhone(phone)) {
    return 'Please enter a valid phone number';
  }
  
  return '';
}

/**
 * Get validation error message for required field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message or empty string if valid
 */
export function getRequiredError(value: string, fieldName: string = 'This field'): string {
  if (!validateRequired(value)) {
    return `${fieldName} is required`;
  }
  
  return '';
}
