/**
 * Validation Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidURL,
  isValidSlug,
  validateEmail,
  validatePhoneNumber,
  validateURL,
  validateSlug,
} from '../../utils/validation';

describe('Email Validation', () => {
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com',
      ];
      
      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });
    
    it('should return false for invalid emails', () => {
      const invalidEmails = [
        '',
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@.com',
        'invalid@domain',
        'invalid @domain.com',
        'invalid@domain .com',
      ];
      
      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });
  
  describe('validateEmail', () => {
    it('should return null for valid emails', () => {
      expect(validateEmail('test@example.com')).toBeNull();
    });
    
    it('should return error message for invalid emails', () => {
      expect(validateEmail('')).toBe('Email is required');
      expect(validateEmail('invalid')).toBe('Invalid email format');
    });
    
    it('should handle custom error messages', () => {
      const customMessage = 'Please enter a valid email address';
      expect(validateEmail('invalid', customMessage)).toBe(customMessage);
    });
  });
});

describe('Phone Number Validation', () => {
  describe('isValidPhoneNumber', () => {
    it('should return true for valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+421123456789',
        '+44 20 1234 5678',
        '+1-555-123-4567',
        '+421 (2) 1234 5678',
      ];
      
      validPhones.forEach(phone => {
        expect(isValidPhoneNumber(phone)).toBe(true);
      });
    });
    
    it('should return false for invalid phone numbers', () => {
      const invalidPhones = [
        '',
        '123',
        'abc',
        '+1',
        '1234567890', // Missing +
        '+123', // Too short
      ];
      
      invalidPhones.forEach(phone => {
        expect(isValidPhoneNumber(phone)).toBe(false);
      });
    });
  });
  
  describe('validatePhoneNumber', () => {
    it('should return null for valid phone numbers', () => {
      expect(validatePhoneNumber('+1234567890')).toBeNull();
    });
    
    it('should return error message for invalid phone numbers', () => {
      expect(validatePhoneNumber('')).toBe('Phone number is required');
      expect(validatePhoneNumber('123')).toBe('Invalid phone number format');
    });
  });
});

describe('URL Validation', () => {
  describe('isValidURL', () => {
    it('should return true for valid URLs', () => {
      const validURLs = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path',
        'https://example.com/path?query=value',
        'https://example.com:8080',
        'https://sub.domain.example.com',
      ];
      
      validURLs.forEach(url => {
        expect(isValidURL(url)).toBe(true);
      });
    });
    
    it('should return false for invalid URLs', () => {
      const invalidURLs = [
        '',
        'invalid',
        'ftp://example.com', // Wrong protocol
        'example.com', // Missing protocol
        'https://',
        'https://example',
      ];
      
      invalidURLs.forEach(url => {
        expect(isValidURL(url)).toBe(false);
      });
    });
  });
  
  describe('validateURL', () => {
    it('should return null for valid URLs', () => {
      expect(validateURL('https://example.com')).toBeNull();
    });
    
    it('should return error message for invalid URLs', () => {
      expect(validateURL('invalid')).toBe('Invalid URL format');
    });
  });
});

describe('Slug Validation', () => {
  describe('isValidSlug', () => {
    it('should return true for valid slugs', () => {
      const validSlugs = [
        'test-session',
        'my-event-2024',
        'networking-session',
        'test123',
      ];
      
      validSlugs.forEach(slug => {
        expect(isValidSlug(slug)).toBe(true);
      });
    });
    
    it('should return false for invalid slugs', () => {
      const invalidSlugs = [
        '',
        'ab', // Too short
        'test session', // Spaces
        'TEST', // Uppercase
        'test_session', // Underscore
        'test@session', // Special chars
        '-test', // Starts with dash
        'test-', // Ends with dash
      ];
      
      invalidSlugs.forEach(slug => {
        expect(isValidSlug(slug)).toBe(false);
      });
    });
  });
  
  describe('validateSlug', () => {
    it('should return null for valid slugs', () => {
      expect(validateSlug('test-session')).toBeNull();
    });
    
    it('should return error message for invalid slugs', () => {
      expect(validateSlug('')).toBe('Slug is required');
      expect(validateSlug('ab')).toBe('Slug must be at least 3 characters');
      expect(validateSlug('TEST')).toBe('Slug must contain only lowercase letters, numbers, and hyphens');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle null and undefined', () => {
    expect(isValidEmail(null as any)).toBe(false);
    expect(isValidEmail(undefined as any)).toBe(false);
    expect(isValidPhoneNumber(null as any)).toBe(false);
    expect(isValidURL(null as any)).toBe(false);
  });
  
  it('should handle whitespace', () => {
    expect(isValidEmail('  test@example.com  ')).toBe(true);
    expect(isValidPhoneNumber('  +1234567890  ')).toBe(true);
  });
  
  it('should handle very long inputs', () => {
    const longEmail = 'a'.repeat(100) + '@example.com';
    const longPhone = '+' + '1'.repeat(20);
    const longSlug = 'a'.repeat(100);
    
    expect(isValidEmail(longEmail)).toBe(false);
    expect(isValidPhoneNumber(longPhone)).toBe(false);
    expect(isValidSlug(longSlug)).toBe(false);
  });
});
