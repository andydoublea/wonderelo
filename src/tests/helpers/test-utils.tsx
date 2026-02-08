/**
 * Test Utilities
 * Custom render functions and test helpers
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create test query client
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * All providers wrapper
 */
interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient || createTestQueryClient();
  
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render with all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, initialRoute = '/', ...renderOptions } = options || {};
  
  // Set initial route
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }
  
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  );
  
  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient || createTestQueryClient(),
  };
}

/**
 * Render with router only
 */
export function renderWithRouter(
  ui: ReactElement,
  { initialRoute = '/', ...renderOptions }: { initialRoute?: string } & RenderOptions = {}
) {
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }
  
  return render(ui, {
    wrapper: BrowserRouter,
    ...renderOptions,
  });
}

/**
 * Wait for element to be removed (with timeout)
 */
export async function waitForLoadingToFinish() {
  const { waitForElementToBeRemoved } = await import('@testing-library/react');
  return waitForElementToBeRemoved(
    () => document.querySelector('[data-testid="loading"]'),
    { timeout: 3000 }
  ).catch(() => {
    // Loading element might not exist, that's okay
  });
}

/**
 * Mock API response
 */
export function mockApiResponse<T>(data: T, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  } as Response;
}

/**
 * Mock fetch for tests
 */
export function mockFetch(data: any, status = 200) {
  global.fetch = vi.fn().mockResolvedValue(mockApiResponse(data, status));
}

/**
 * Mock fetch error
 */
export function mockFetchError(message = 'Network error') {
  global.fetch = vi.fn().mockRejectedValue(new Error(message));
}

/**
 * Mock fetch once
 */
export function mockFetchOnce(data: any, status = 200) {
  global.fetch = vi.fn().mockResolvedValueOnce(mockApiResponse(data, status));
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get store() {
      return store;
    },
  };
}

/**
 * Create mock user
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'organizer' as const,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock session
 */
export function createMockSession(overrides = {}) {
  return {
    id: 'session-123',
    userId: 'user-123',
    slug: 'test-session',
    title: 'Test Networking Session',
    description: 'A test session',
    date: '2024-12-15',
    startTime: '10:00',
    endTime: '12:00',
    maxParticipants: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock round
 */
export function createMockRound(overrides = {}) {
  return {
    id: 'round-123',
    sessionId: 'session-123',
    roundNumber: 1,
    title: 'Round 1',
    startTime: '10:00',
    endTime: '10:30',
    tableCount: 10,
    participantsPerTable: 5,
    status: 'upcoming' as const,
    ...overrides,
  };
}

/**
 * Create mock participant
 */
export function createMockParticipant(overrides = {}) {
  return {
    id: 'participant-123',
    email: 'participant@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    company: 'Test Company',
    position: 'Developer',
    participantToken: 'token-123',
    registeredAt: new Date().toISOString(),
    status: 'confirmed' as const,
    ...overrides,
  };
}

/**
 * Simulate user interaction delay
 */
export async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Trigger window resize
 */
export function triggerResize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
}

/**
 * Trigger network online/offline
 */
export function triggerNetworkChange(online: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: online,
  });
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

/**
 * Wait for next tick
 */
export async function waitForNextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Find by text content (case-insensitive)
 */
export function byTextContent(text: string) {
  return (_: string, element: Element | null) => {
    return element?.textContent?.toLowerCase().includes(text.toLowerCase()) ?? false;
  };
}

/**
 * Check if element has class
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * Get computed style
 */
export function getStyle(element: HTMLElement, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { vi } from 'vitest';
