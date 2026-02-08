import { toast } from 'sonner@2.0.3';
import { errorLog } from './debug';

/**
 * Centralized API error handling utilities
 * Prevents duplication of error handling patterns across components
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

/**
 * Extract error message from various error formats
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return typeof error.error === 'string' ? error.error : error.error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Handle API response errors
 * @param response - Fetch response object
 * @param context - Context for logging (e.g., "loading sessions")
 * @returns Error object with details
 */
export async function handleApiError(
  response: Response,
  context?: string
): Promise<ApiError> {
  let errorText = '';
  let errorData: any = null;

  try {
    errorText = await response.text();
    
    // Try to parse as JSON
    try {
      errorData = JSON.parse(errorText);
    } catch {
      // Not JSON, use text as-is
    }
  } catch {
    errorText = 'Failed to read error response';
  }

  const error: ApiError = {
    message: errorData?.error || errorData?.message || errorText || response.statusText,
    status: response.status,
    code: errorData?.code,
    details: errorData?.details
  };

  // Log error with context
  const logMessage = context 
    ? `API Error (${context}): ${error.message}` 
    : `API Error: ${error.message}`;
  
  errorLog(logMessage, {
    status: error.status,
    code: error.code,
    details: error.details
  });

  return error;
}

/**
 * Show toast notification for API errors
 * @param error - Error object or message
 * @param defaultMessage - Default message if error is empty
 */
export function showErrorToast(error: any, defaultMessage: string = 'An error occurred') {
  const message = getErrorMessage(error) || defaultMessage;
  toast.error(message);
}

/**
 * Show toast notification for success
 * @param message - Success message
 * @param description - Optional description
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined);
}

/**
 * Generic API request handler with automatic error handling
 * @param request - Function that returns a Promise
 * @param options - Options for error handling
 * @returns Data or null on error
 */
export async function handleApiRequest<T>(
  request: () => Promise<Response>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    context?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
  }
): Promise<T | null> {
  try {
    const response = await request();

    if (!response.ok) {
      const error = await handleApiError(response, options?.context);
      
      if (options?.showErrorToast !== false) {
        showErrorToast(error, options?.errorMessage);
      }
      
      return null;
    }

    const data = await response.json();

    if (options?.showSuccessToast && options?.successMessage) {
      showSuccessToast(options.successMessage);
    }

    return data as T;
  } catch (error) {
    errorLog('Network error:', error);
    
    if (options?.showErrorToast !== false) {
      showErrorToast('Network error. Please check your connection.');
    }
    
    return null;
  }
}

/**
 * Common HTTP status code handlers
 */
export const StatusHandlers = {
  /**
   * Handle 401 Unauthorized
   */
  unauthorized: (onUnauthorized?: () => void) => {
    toast.error('Your session has expired. Please sign in again.');
    onUnauthorized?.();
  },

  /**
   * Handle 403 Forbidden
   */
  forbidden: () => {
    toast.error('You do not have permission to perform this action.');
  },

  /**
   * Handle 404 Not Found
   */
  notFound: (resource: string = 'Resource') => {
    toast.error(`${resource} not found.`);
  },

  /**
   * Handle 409 Conflict
   */
  conflict: (message?: string) => {
    toast.error(message || 'A conflict occurred. Please try again.');
  },

  /**
   * Handle 429 Too Many Requests
   */
  tooManyRequests: () => {
    toast.error('Too many requests. Please wait a moment and try again.');
  },

  /**
   * Handle 500 Internal Server Error
   */
  serverError: () => {
    toast.error('Server error. Please try again later.');
  }
};

/**
 * Handle response by status code
 * @param response - Fetch response
 * @param handlers - Custom handlers for specific status codes
 */
export async function handleResponseByStatus(
  response: Response,
  handlers?: {
    [status: number]: (response: Response) => void | Promise<void>;
  }
): Promise<boolean> {
  if (response.ok) {
    return true;
  }

  // Check for custom handler
  if (handlers && handlers[response.status]) {
    await handlers[response.status](response);
    return false;
  }

  // Use default handlers
  switch (response.status) {
    case 401:
      StatusHandlers.unauthorized();
      break;
    case 403:
      StatusHandlers.forbidden();
      break;
    case 404:
      StatusHandlers.notFound();
      break;
    case 409:
      StatusHandlers.conflict();
      break;
    case 429:
      StatusHandlers.tooManyRequests();
      break;
    case 500:
    case 502:
    case 503:
      StatusHandlers.serverError();
      break;
    default:
      const error = await handleApiError(response);
      showErrorToast(error);
  }

  return false;
}

/**
 * Retry failed requests with exponential backoff
 * @param request - Function that returns a Promise
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelay - Base delay in ms (default: 1000)
 */
export async function retryRequest<T>(
  request: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      lastError = error;

      if (i < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
