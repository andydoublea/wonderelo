/**
 * ErrorBoundary Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../helpers/test-utils';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Success</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Component Level', () => {
    it('should render children when no error', () => {
      render(
        <ErrorBoundary level="component">
          <div>Test Content</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
    
    it('should render error message when error occurs', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
    
    it('should display retry button', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      );
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });
    
    it('should reset error on retry', async () => {
      let shouldThrow = true;
      
      const { rerender } = render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      
      // Fix the error
      shouldThrow = false;
      
      // Click retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await userEvent.click(retryButton);
      
      rerender(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
  
  describe('Section Level', () => {
    it('should render section-level error UI', () => {
      render(
        <ErrorBoundary level="section">
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
  
  describe('Page Level', () => {
    it('should render page-level error UI', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Oops!/i)).toBeInTheDocument();
      expect(screen.getByText(/Go home/i)).toBeInTheDocument();
    });
  });
  
  describe('Custom Fallback', () => {
    it('should render custom fallback', () => {
      const CustomFallback = () => <div>Custom Error UI</div>;
      
      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });
    
    it('should render fallback function with error', () => {
      const fallbackFn = ({ error }: { error: Error }) => (
        <div>Error: {error.message}</div>
      );
      
      render(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });
  });
  
  describe('Error Logging', () => {
    it('should call onError callback', () => {
      const onError = vi.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onError.mock.calls[0][0].message).toBe('Test error');
    });
  });
  
  describe('Error Details', () => {
    it('should show error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      );
      
      // Should show error message
      expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('Multiple Boundaries', () => {
    it('should isolate errors to nearest boundary', () => {
      render(
        <ErrorBoundary level="page">
          <div>
            <h1>Page Title</h1>
            <ErrorBoundary level="component">
              <ThrowError />
            </ErrorBoundary>
            <div>Other content</div>
          </div>
        </ErrorBoundary>
      );
      
      // Component-level error should not affect page
      expect(screen.getByText('Page Title')).toBeInTheDocument();
      expect(screen.getByText('Other content')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });
  
  describe('Reset on Props Change', () => {
    it('should reset error when resetKeys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      
      // Change reset key
      rerender(
        <ErrorBoundary resetKeys={['key2']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
