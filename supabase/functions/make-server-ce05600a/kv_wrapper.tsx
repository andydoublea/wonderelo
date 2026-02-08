/**
 * Wrapper around kv_store with retry logic and better error handling
 */
import * as kvStore from './kv_store.tsx';
import { errorLog, debugLog } from './debug.tsx';
import { getGlobalSupabaseClient } from './global-supabase.tsx';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

// Get client - uses singleton
function getClient() {
  return getGlobalSupabaseClient();
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  retries = MAX_RETRIES
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Check if it's a retryable error:
      // - Cloudflare 500 errors (HTML response)
      // - Connection errors (connection reset, timeout, etc.)
      // - Network errors
      const isCloudflareError = errorMsg.includes('<html>') || errorMsg.includes('500 Internal Server Error');
      const isConnectionError = errorMsg.toLowerCase().includes('connection reset') || 
                                errorMsg.toLowerCase().includes('connection error') ||
                                errorMsg.toLowerCase().includes('sendrequest') ||
                                errorMsg.toLowerCase().includes('error sending request') ||
                                errorMsg.toLowerCase().includes('network') ||
                                errorMsg.toLowerCase().includes('timeout') ||
                                errorMsg.toLowerCase().includes('peer');
      
      const isRetryableError = isCloudflareError || isConnectionError;
      
      if (attempt < retries && isRetryableError) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
        debugLog(`[KV Retry] ${operationName} failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`);
        debugLog(`[KV Retry] Error: ${errorMsg.substring(0, 200)}`);
        await sleep(delay);
        continue;
      }
      
      // Last attempt or non-retryable error
      errorLog(`[KV Error] ${operationName} failed after ${attempt} attempts:`, errorMsg);
      throw error;
    }
  }
  
  throw new Error(`${operationName} failed after ${retries} retries`);
}

export const get = async (key: string): Promise<any> => {
  try {
    return await retryOperation(
      () => kvStore.get(key),
      `get(${key})`
    );
  } catch (error) {
    // Return null instead of throwing to prevent crashes
    errorLog(`Failed to get key "${key}":`, error);
    return null;
  }
};

export const set = async (key: string, value: any): Promise<void> => {
  return retryOperation(
    () => kvStore.set(key, value),
    `set(${key})`
  );
};

export const del = async (key: string): Promise<void> => {
  return retryOperation(
    () => kvStore.del(key),
    `del(${key})`
  );
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  return retryOperation(
    () => kvStore.mset(keys, values),
    `mset([${keys.length} keys])`
  );
};

export const mget = async (keys: string[]): Promise<any[]> => {
  return retryOperation(
    () => kvStore.mget(keys),
    `mget([${keys.length} keys])`
  );
};

export const mdel = async (keys: string[]): Promise<void> => {
  return retryOperation(
    () => kvStore.mdel(keys),
    `mdel([${keys.length} keys])`
  );
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  return retryOperation(
    () => kvStore.getByPrefix(prefix),
    `getByPrefix(${prefix})`
  );
};

/**
 * Get key-value pairs by prefix, returning an object with keys mapped to values
 * Returns: { [key: string]: any }
 */
export const getByPrefixAsObject = async (prefix: string): Promise<Record<string, any>> => {
  return retryOperation(
    async () => {
      const supabase = getClient();
      const { data, error } = await supabase
        .from("kv_store_ce05600a")
        .select("key, value")
        .like("key", prefix + "%");
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Convert array to object
      const result: Record<string, any> = {};
      for (const item of data ?? []) {
        result[item.key] = item.value;
      }
      return result;
    },
    `getByPrefixAsObject(${prefix})`
  );
};

/**
 * Get key-value pairs by prefix, returning objects with both key and value
 * Returns: Array<{ key: string, value: any }>
 */
export const getByPrefixWithKeys = async (prefix: string): Promise<Array<{ key: string, value: any }>> => {
  return retryOperation(
    async () => {
      const supabase = getClient();
      const { data, error } = await supabase
        .from("kv_store_ce05600a")
        .select("key, value")
        .like("key", prefix + "%");
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data ?? [];
    },
    `getByPrefixWithKeys(${prefix})`
  );
};