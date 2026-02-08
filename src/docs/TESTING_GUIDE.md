# Testing Guide

Complete guide to testing in Oliwonder.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Writing Tests](#writing-tests)
4. [Test Utilities](#test-utilities)
5. [Best Practices](#best-practices)
6. [Running Tests](#running-tests)
7. [Coverage](#coverage)
8. [CI/CD Integration](#cicd-integration)

---

## Overview

Our testing infrastructure uses:

- **Vitest** - Fast unit test framework
- **React Testing Library** - Component testing
- **Jest DOM** - DOM matchers
- **User Event** - User interaction simulation
- **MSW** (planned) - API mocking

### Test Types

```
Unit Tests (60%)        Component Tests (30%)      E2E Tests (10%)
├── Utils               ├── UI Components          └── Critical Flows
├── Hooks               ├── Forms                      ├── Sign in
├── Stores              ├── Dialogs                    ├── Create session
└── Validation          └── Error boundaries           └── Registration
```

### Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| **Statements** | 80% | TBD |
| **Branches** | 75% | TBD |
| **Functions** | 80% | TBD |
| **Lines** | 80% | TBD |

---

## Setup

### 1. Configuration

`vitest.config.ts` - Main configuration:

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
});
```

### 2. Test Setup

`tests/setup.ts` - Global test setup:

- Jest DOM matchers
- Mock window APIs (matchMedia, IntersectionObserver)
- Mock localStorage/sessionStorage
- Mock fetch
- Cleanup after each test

### 3. Dependencies

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@vitest/ui": "^1.0.0",
    "jsdom": "^23.0.0"
  }
}
```

---

## Writing Tests

### Unit Tests (Utils, Hooks)

#### Testing Utilities

```typescript
// tests/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { isValidEmail } from '../../utils/validation';

describe('Email Validation', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });
  
  it('should return false for invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
  });
});
```

#### Testing Hooks

```typescript
// tests/hooks/useForm.test.ts
import { renderHook, act } from '@testing-library/react';
import { useForm } from '../../hooks/useForm';

describe('useForm Hook', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '' },
      })
    );
    
    expect(result.current.values.email).toBe('');
  });
  
  it('should update field value', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '' },
      })
    );
    
    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
    });
    
    expect(result.current.values.email).toBe('test@example.com');
  });
});
```

### Component Tests

#### Basic Component Test

```typescript
// tests/components/Button.test.tsx
import { render, screen } from '../helpers/test-utils';
import { Button } from '../../components/ui/Button';

describe('Button Component', () => {
  it('should render button text', () => {
    render(<Button>Click Me</Button>);
    
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });
  
  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    
    await userEvent.click(screen.getByText('Click Me'));
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  
  it('should be disabled', () => {
    render(<Button disabled>Click Me</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### Form Component Test

```typescript
// tests/components/LoginForm.test.tsx
import { render, screen, waitFor } from '../helpers/test-utils';
import { LoginForm } from '../../components/LoginForm';

describe('LoginForm', () => {
  it('should validate email', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await userEvent.type(emailInput, 'invalid');
    await userEvent.click(submitButton);
    
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });
  
  it('should submit valid form', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

#### Component with API

```typescript
// tests/components/SessionList.test.tsx
import { renderWithProviders, mockFetch } from '../helpers/test-utils';
import { SessionList } from '../../components/SessionList';

describe('SessionList', () => {
  it('should load and display sessions', async () => {
    const sessions = [
      { id: '1', title: 'Session 1' },
      { id: '2', title: 'Session 2' },
    ];
    
    mockFetch(sessions);
    
    renderWithProviders(<SessionList />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    expect(await screen.findByText('Session 1')).toBeInTheDocument();
    expect(await screen.findByText('Session 2')).toBeInTheDocument();
  });
  
  it('should handle error', async () => {
    mockFetchError('Failed to load sessions');
    
    renderWithProviders(<SessionList />);
    
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });
});
```

### Store Tests (Zustand)

```typescript
// tests/stores/appStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useAppStore } from '../../stores/appStore';

describe('App Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  });
  
  it('should sign in user', () => {
    const { result } = renderHook(() => useAppStore());
    
    const user = { id: '1', email: 'test@example.com', name: 'Test' };
    const token = 'token123';
    
    act(() => {
      result.current.signIn(user, token);
    });
    
    expect(result.current.user).toEqual(user);
    expect(result.current.accessToken).toBe(token);
    expect(result.current.isAuthenticated).toBe(true);
  });
  
  it('should sign out user', () => {
    const { result } = renderHook(() => useAppStore());
    
    // First sign in
    act(() => {
      result.current.signIn(
        { id: '1', email: 'test@example.com', name: 'Test' },
        'token123'
      );
    });
    
    // Then sign out
    act(() => {
      result.current.signOut();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

---

## Test Utilities

### Custom Render Functions

#### renderWithProviders

Render with all providers (Router, React Query):

```typescript
import { renderWithProviders } from '../helpers/test-utils';

renderWithProviders(<MyComponent />, {
  initialRoute: '/sessions',
  queryClient: customQueryClient,
});
```

#### renderWithRouter

Render with Router only:

```typescript
import { renderWithRouter } from '../helpers/test-utils';

renderWithRouter(<MyComponent />, {
  initialRoute: '/about',
});
```

### Mock Data Factories

Create consistent test data:

```typescript
import { 
  createMockUser,
  createMockSession,
  createMockParticipant 
} from '../helpers/test-utils';

const user = createMockUser({ name: 'Custom Name' });
const session = createMockSession({ title: 'Custom Title' });
const participant = createMockParticipant({ email: 'custom@example.com' });
```

### API Mocking

```typescript
import { mockFetch, mockFetchError, mockFetchOnce } from '../helpers/test-utils';

// Mock successful response
mockFetch({ data: 'response' });

// Mock error
mockFetchError('Network error');

// Mock single response
mockFetchOnce({ data: 'first response' });
```

### Helper Functions

```typescript
import { 
  delay,
  triggerResize,
  triggerNetworkChange,
  waitForNextTick 
} from '../helpers/test-utils';

// Wait for delay
await delay(100);

// Trigger window resize
triggerResize(375, 667); // Mobile

// Trigger offline/online
triggerNetworkChange(false); // Go offline

// Wait for next event loop
await waitForNextTick();
```

---

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad - Testing implementation
it('should call setState with value', () => {
  const setState = vi.fn();
  render(<Input setState={setState} />);
  // Testing internal state management
});

// ✅ Good - Testing user behavior
it('should update input value when user types', async () => {
  render(<Input />);
  await userEvent.type(screen.getByRole('textbox'), 'Hello');
  expect(screen.getByRole('textbox')).toHaveValue('Hello');
});
```

### 2. Use Accessible Queries

```typescript
// Preferred query order:
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByPlaceholderText(/enter email/i)
screen.getByText(/welcome/i)
screen.getByDisplayValue('Current Value')
screen.getByAltText('Profile Picture')
screen.getByTitle('Close')

// Avoid:
screen.getByTestId('submit-button') // Only as last resort
```

### 3. Wait for Async Operations

```typescript
// ✅ Use findBy for async elements
expect(await screen.findByText('Success')).toBeInTheDocument();

// ✅ Use waitFor for complex conditions
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
});

// ❌ Don't use act() directly (testing-library handles it)
```

### 4. Clean Tests

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
    localStorage.clear();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks();
  });
  
  it('should do something', () => {
    // Test
  });
});
```

### 5. Test Error Cases

```typescript
it('should handle error gracefully', async () => {
  mockFetchError('Server error');
  
  render(<MyComponent />);
  
  expect(await screen.findByText(/error occurred/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
});
```

### 6. Test Accessibility

```typescript
it('should be accessible', () => {
  const { container } = render(<MyComponent />);
  
  // Check ARIA attributes
  expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Submit');
  
  // Check focus management
  const button = screen.getByRole('button');
  button.focus();
  expect(button).toHaveFocus();
  
  // Check keyboard navigation
  await userEvent.keyboard('{Enter}');
});
```

### 7. Snapshot Testing (Use Sparingly)

```typescript
it('should match snapshot', () => {
  const { container } = render(<MyComponent />);
  expect(container).toMatchSnapshot();
});
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test validation.test.ts

# Run tests matching pattern
npm test -- --grep "validation"

# Run UI mode
npm test -- --ui

# Run with specific reporter
npm test -- --reporter=verbose
```

### Watch Mode

```bash
# Watch mode commands:
a - Run all tests
f - Run only failed tests
p - Filter by filename pattern
t - Filter by test name pattern
q - Quit
```

### UI Mode

```bash
npm test -- --ui

# Opens browser UI at http://localhost:51204
# Interactive test runner with:
# - File tree
# - Test results
# - Coverage visualization
# - Console output
```

---

## Coverage

### Viewing Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML report
open coverage/index.html
```

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  lines: 80,      // 80% line coverage
  functions: 80,  // 80% function coverage
  branches: 75,   // 75% branch coverage
  statements: 80, // 80% statement coverage
}
```

### Exclude from Coverage

```typescript
coverage: {
  exclude: [
    'node_modules/',
    'tests/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/mockData',
  ],
}
```

### Coverage Report

```
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |   85.23 |    78.45 |   82.15 |   85.67 |
 utils/
  validation.ts       |     100 |      100 |     100 |     100 |
  storage.ts          |   92.45 |    85.71 |   91.67 |   92.45 | 45-47
 hooks/
  useForm.ts          |   88.24 |    76.92 |   85.71 |   88.89 | 123-125,156
 components/
  ErrorBoundary.tsx   |   75.00 |    66.67 |   71.43 |   76.47 | 78-82,95-98
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test -- --coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
npm test -- --run --changed
```

### CI Commands

```bash
# CI mode (no watch, exit on finish)
npm test -- --run

# CI with coverage
npm test -- --run --coverage

# Only changed files
npm test -- --run --changed

# Fail on low coverage
npm test -- --run --coverage --coverage.thresholdAutoUpdate=false
```

---

## Advanced Patterns

### Testing Custom Hooks with Dependencies

```typescript
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

const { result } = renderHook(() => useMyHook(), { wrapper });
```

### Testing Timers

```typescript
import { vi } from 'vitest';

it('should debounce calls', async () => {
  vi.useFakeTimers();
  
  const callback = vi.fn();
  const { result } = renderHook(() => useDebounce(callback, 500));
  
  act(() => {
    result.current('test');
    vi.advanceTimersByTime(250);
    result.current('test2');
    vi.advanceTimersByTime(500);
  });
  
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith('test2');
  
  vi.useRealTimers();
});
```

### Testing Portal Components

```typescript
it('should render in portal', () => {
  render(<Modal open>Content</Modal>);
  
  // Portal renders to document.body by default
  expect(document.body).toHaveTextContent('Content');
});
```

### Testing Lazy Components

```typescript
it('should load lazy component', async () => {
  render(<LazyComponent />);
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  expect(await screen.findByText('Loaded Content')).toBeInTheDocument();
});
```

---

## Troubleshooting

### Common Issues

#### 1. "act() warning"

```typescript
// ❌ Causes warning
fireEvent.click(button);

// ✅ Use userEvent
await userEvent.click(button);
```

#### 2. "Unable to find element"

```typescript
// ❌ Element not loaded yet
expect(screen.getByText('Async Content')).toBeInTheDocument();

// ✅ Wait for element
expect(await screen.findByText('Async Content')).toBeInTheDocument();
```

#### 3. "Test timeout"

```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // test
}, 15000); // 15 second timeout
```

#### 4. "Cannot read property of undefined"

```typescript
// Check if element exists before accessing
const element = screen.queryByText('Maybe exists');
if (element) {
  expect(element).toBeVisible();
}
```

---

## Testing Checklist

- [ ] Unit tests for utilities
- [ ] Hook tests with renderHook
- [ ] Component render tests
- [ ] User interaction tests
- [ ] Form validation tests
- [ ] API call tests (mock)
- [ ] Error handling tests
- [ ] Loading state tests
- [ ] Accessibility tests
- [ ] Edge case tests
- [ ] Coverage > 80%

---

Last updated: December 2024  
Version: 1.0.0
