/**
 * Storage Utility Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../../utils/storage';

describe('Storage Utility', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });
  
  describe('set and get', () => {
    it('should store and retrieve string values', () => {
      storage.set('testKey', 'testValue');
      expect(storage.get('testKey')).toBe('testValue');
    });
    
    it('should store and retrieve number values', () => {
      storage.set('number', 42);
      expect(storage.get('number')).toBe(42);
    });
    
    it('should store and retrieve boolean values', () => {
      storage.set('bool', true);
      expect(storage.get('bool')).toBe(true);
    });
    
    it('should store and retrieve object values', () => {
      const obj = { name: 'Test', age: 30 };
      storage.set('user', obj);
      expect(storage.get('user')).toEqual(obj);
    });
    
    it('should store and retrieve array values', () => {
      const arr = [1, 2, 3, 4, 5];
      storage.set('numbers', arr);
      expect(storage.get('numbers')).toEqual(arr);
    });
    
    it('should return null for non-existent keys', () => {
      expect(storage.get('nonExistent')).toBeNull();
    });
    
    it('should return default value for non-existent keys', () => {
      expect(storage.get('nonExistent', 'default')).toBe('default');
    });
  });
  
  describe('remove', () => {
    it('should remove stored values', () => {
      storage.set('testKey', 'testValue');
      expect(storage.get('testKey')).toBe('testValue');
      
      storage.remove('testKey');
      expect(storage.get('testKey')).toBeNull();
    });
    
    it('should not throw when removing non-existent key', () => {
      expect(() => storage.remove('nonExistent')).not.toThrow();
    });
  });
  
  describe('clear', () => {
    it('should clear all storage', () => {
      storage.set('key1', 'value1');
      storage.set('key2', 'value2');
      storage.set('key3', 'value3');
      
      storage.clear();
      
      expect(storage.get('key1')).toBeNull();
      expect(storage.get('key2')).toBeNull();
      expect(storage.get('key3')).toBeNull();
    });
  });
  
  describe('has', () => {
    it('should return true for existing keys', () => {
      storage.set('testKey', 'value');
      expect(storage.has('testKey')).toBe(true);
    });
    
    it('should return false for non-existent keys', () => {
      expect(storage.has('nonExistent')).toBe(false);
    });
  });
  
  describe('keys', () => {
    it('should return all keys', () => {
      storage.set('key1', 'value1');
      storage.set('key2', 'value2');
      storage.set('key3', 'value3');
      
      const keys = storage.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
    
    it('should return empty array when storage is empty', () => {
      expect(storage.keys()).toEqual([]);
    });
  });
  
  describe('getStats', () => {
    it('should return storage statistics', () => {
      storage.set('key1', 'value1');
      storage.set('key2', { name: 'Test' });
      
      const stats = storage.getStats();
      
      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('quotaUsed');
      expect(stats.totalItems).toBe(2);
      expect(typeof stats.totalSize).toBe('string');
      expect(typeof stats.quotaUsed).toBe('number');
    });
  });
  
  describe('getSize', () => {
    it('should return size of stored item', () => {
      const value = 'test value';
      storage.set('testKey', value);
      
      const size = storage.getSize('testKey');
      expect(size).toBeGreaterThan(0);
    });
    
    it('should return 0 for non-existent keys', () => {
      expect(storage.getSize('nonExistent')).toBe(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      // Manually set invalid JSON
      localStorage.setItem('invalidJSON', '{invalid json}');
      
      expect(() => storage.get('invalidJSON')).not.toThrow();
      expect(storage.get('invalidJSON')).toBeNull();
    });
    
    it('should handle quota exceeded errors', () => {
      // Mock setItem to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      console.error = vi.fn(); // Suppress error logs
      
      expect(() => storage.set('key', 'value')).not.toThrow();
      
      // Restore
      localStorage.setItem = originalSetItem;
    });
  });
  
  describe('Type Safety', () => {
    it('should preserve types with generic get', () => {
      interface User {
        name: string;
        age: number;
      }
      
      const user: User = { name: 'Test', age: 30 };
      storage.set('user', user);
      
      const retrieved = storage.get<User>('user');
      expect(retrieved).toEqual(user);
      
      // TypeScript should ensure type safety
      if (retrieved) {
        expect(retrieved.name).toBe('Test');
        expect(retrieved.age).toBe(30);
      }
    });
  });
  
  describe('Namespace Support', () => {
    it('should support prefixed keys', () => {
      storage.set('app:user', { name: 'Test' });
      storage.set('app:session', { id: '123' });
      
      expect(storage.has('app:user')).toBe(true);
      expect(storage.has('app:session')).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle null values', () => {
      storage.set('nullValue', null);
      expect(storage.get('nullValue')).toBeNull();
    });
    
    it('should handle undefined values', () => {
      storage.set('undefinedValue', undefined);
      // Undefined becomes null in JSON
      expect(storage.get('undefinedValue')).toBeNull();
    });
    
    it('should handle empty string', () => {
      storage.set('emptyString', '');
      expect(storage.get('emptyString')).toBe('');
    });
    
    it('should handle zero', () => {
      storage.set('zero', 0);
      expect(storage.get('zero')).toBe(0);
    });
    
    it('should handle false', () => {
      storage.set('false', false);
      expect(storage.get('false')).toBe(false);
    });
    
    it('should handle large objects', () => {
      const largeObj = {
        data: Array(1000).fill({ id: 1, name: 'Test', value: 123 })
      };
      
      storage.set('large', largeObj);
      expect(storage.get('large')).toEqual(largeObj);
    });
    
    it('should handle special characters in keys', () => {
      storage.set('key:with:colons', 'value');
      storage.set('key-with-dashes', 'value');
      storage.set('key_with_underscores', 'value');
      
      expect(storage.get('key:with:colons')).toBe('value');
      expect(storage.get('key-with-dashes')).toBe('value');
      expect(storage.get('key_with_underscores')).toBe('value');
    });
  });
  
  describe('Performance', () => {
    it('should handle multiple rapid set/get operations', () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        storage.set(`key${i}`, `value${i}`);
      }
      
      for (let i = 0; i < iterations; i++) {
        expect(storage.get(`key${i}`)).toBe(`value${i}`);
      }
    });
  });
});
