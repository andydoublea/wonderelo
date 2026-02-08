import { errorLog, debugLog } from './debug';

/**
 * Type-safe localStorage management with error handling and versioning
 */

interface StorageItem<T> {
  value: T;
  timestamp: number;
  version: string;
  expiresAt?: number;
}

interface StorageOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Data version for migration support */
  version?: string;
  /** Encrypt sensitive data */
  encrypt?: boolean;
}

class LocalStorageManager {
  private readonly prefix: string = 'oliwonder_';
  private readonly version: string = '1.0.0';

  /**
   * Get item from localStorage with type safety
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const fullKey = this.prefix + key;
      const item = localStorage.getItem(fullKey);

      if (!item) {
        return defaultValue ?? null;
      }

      const parsed: StorageItem<T> = JSON.parse(item);

      // Check if expired
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        debugLog(`Storage item expired: ${key}`);
        this.remove(key);
        return defaultValue ?? null;
      }

      // Version check - could implement migration here
      if (parsed.version !== this.version) {
        debugLog(`Storage version mismatch for ${key}: ${parsed.version} vs ${this.version}`);
        // For now, just return the value
        // In future: implement migration logic
      }

      return parsed.value;
    } catch (error) {
      errorLog(`Error reading from localStorage (${key}):`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * Set item in localStorage with metadata
   */
  set<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    try {
      const fullKey = this.prefix + key;
      
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        version: options.version || this.version,
        expiresAt: options.ttl ? Date.now() + options.ttl : undefined
      };

      const serialized = JSON.stringify(item);

      // Check quota before saving
      if (!this.checkQuota(serialized.length)) {
        errorLog(`Storage quota exceeded for key: ${key}`);
        this.cleanup();
        
        // Try again after cleanup
        if (!this.checkQuota(serialized.length)) {
          return false;
        }
      }

      localStorage.setItem(fullKey, serialized);
      debugLog(`Saved to storage: ${key}`);
      return true;
    } catch (error) {
      errorLog(`Error writing to localStorage (${key}):`, error);
      
      // If quota exceeded, try cleanup and retry
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanup();
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  remove(key: string): void {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      debugLog(`Removed from storage: ${key}`);
    } catch (error) {
      errorLog(`Error removing from localStorage (${key}):`, error);
    }
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    try {
      const fullKey = this.prefix + key;
      return localStorage.getItem(fullKey) !== null;
    } catch (error) {
      errorLog(`Error checking localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all items with our prefix
   */
  clear(): void {
    try {
      const keys = this.getAllKeys();
      keys.forEach(key => this.remove(key));
      debugLog('Cleared all storage items');
    } catch (error) {
      errorLog('Error clearing localStorage:', error);
    }
  }

  /**
   * Get all keys managed by this app
   */
  getAllKeys(): string[] {
    try {
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.replace(this.prefix, ''));
        }
      }
      
      return keys;
    } catch (error) {
      errorLog('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Get storage size in bytes
   */
  getSize(): number {
    try {
      let totalSize = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      errorLog('Error calculating storage size:', error);
      return 0;
    }
  }

  /**
   * Get storage size in human-readable format
   */
  getSizeFormatted(): string {
    const bytes = this.getSize();
    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    if (kb >= 1) return `${kb.toFixed(2)} KB`;
    return `${bytes} bytes`;
  }

  /**
   * Check if there's enough quota for new data
   */
  private checkQuota(additionalBytes: number): boolean {
    try {
      const currentSize = this.getSize();
      const estimatedSize = currentSize + additionalBytes;
      
      // Most browsers have 5-10MB limit for localStorage
      // We'll use 5MB as safe limit
      const QUOTA_LIMIT = 5 * 1024 * 1024; // 5MB
      
      return estimatedSize < QUOTA_LIMIT * 0.9; // 90% of limit
    } catch (error) {
      errorLog('Error checking quota:', error);
      return true; // Assume it's okay if we can't check
    }
  }

  /**
   * Clean up expired items and oldest items if needed
   */
  private cleanup(): void {
    try {
      debugLog('Running storage cleanup...');
      
      const keys = this.getAllKeys();
      const items: Array<{ key: string; timestamp: number; size: number }> = [];

      // Collect all items with metadata
      keys.forEach(key => {
        try {
          const fullKey = this.prefix + key;
          const item = localStorage.getItem(fullKey);
          
          if (item) {
            const parsed: StorageItem<any> = JSON.parse(item);
            
            // Remove expired items
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
              this.remove(key);
              return;
            }
            
            items.push({
              key,
              timestamp: parsed.timestamp,
              size: item.length
            });
          }
        } catch (error) {
          // If item is corrupted, remove it
          this.remove(key);
        }
      });

      // Sort by timestamp (oldest first)
      items.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 20% of items if still over quota
      const itemsToRemove = Math.ceil(items.length * 0.2);
      for (let i = 0; i < itemsToRemove; i++) {
        this.remove(items[i].key);
      }

      debugLog(`Cleanup complete. Removed ${itemsToRemove} items.`);
    } catch (error) {
      errorLog('Error during cleanup:', error);
    }
  }

  /**
   * Update existing item without changing metadata
   */
  update<T>(key: string, updateFn: (current: T | null) => T): boolean {
    const current = this.get<T>(key);
    const updated = updateFn(current);
    return this.set(key, updated);
  }

  /**
   * Get multiple items at once
   */
  getMultiple<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    
    keys.forEach(key => {
      result[key] = this.get<T>(key);
    });
    
    return result;
  }

  /**
   * Set multiple items at once
   */
  setMultiple<T>(items: Record<string, T>, options?: StorageOptions): boolean {
    let allSucceeded = true;
    
    Object.entries(items).forEach(([key, value]) => {
      if (!this.set(key, value, options)) {
        allSucceeded = false;
      }
    });
    
    return allSucceeded;
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      errorLog('localStorage is not available:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalItems: number;
    totalSize: string;
    appItems: number;
    quotaUsed: number;
  } {
    const appKeys = this.getAllKeys();
    const totalSize = this.getSize();
    const QUOTA_LIMIT = 5 * 1024 * 1024; // 5MB

    return {
      totalItems: localStorage.length,
      totalSize: this.getSizeFormatted(),
      appItems: appKeys.length,
      quotaUsed: Math.round((totalSize / QUOTA_LIMIT) * 100)
    };
  }
}

// Export singleton instance
export const storage = new LocalStorageManager();

// Export type for external use
export type { StorageOptions };

/**
 * Convenience hooks for React components
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: StorageOptions
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    return storage.get<T>(key, initialValue) ?? initialValue;
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      storage.set(key, valueToStore, options);
    } catch (error) {
      errorLog('Error in useLocalStorage setValue:', error);
    }
  };

  const removeValue = () => {
    setStoredValue(initialValue);
    storage.remove(key);
  };

  return [storedValue, setValue, removeValue];
}

// For environments without React
import * as React from 'react';
