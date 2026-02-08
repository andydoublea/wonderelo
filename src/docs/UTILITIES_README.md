# Oliwonder Utilities Documentation

Comprehensive guide to all utility functions, hooks, and components in the Oliwonder application.

## 📚 Table of Contents

1. [Status Badge System](#status-badge-system)
2. [Validation Utilities](#validation-utilities)
3. [API Request Hooks](#api-request-hooks)
4. [API Error Handler](#api-error-handler)
5. [Toast Messages](#toast-messages)
6. [Loading Components](#loading-components)
7. [Debug Utilities](#debug-utilities)

---

## Status Badge System

**Location:** `/utils/statusBadge.tsx`

### Overview
Centralized system for displaying participant and organizer status badges with consistent styling and labels.

### Components

#### `ParticipantStatusBadge`
Renders a status badge for participants.

```tsx
<ParticipantStatusBadge status="confirmed" />
<ParticipantStatusBadge status="checked-in" />
<ParticipantStatusBadge status="no-show" />
```

#### `OrganizerStatusBadge`
Renders a status badge for organizers.

```tsx
<OrganizerStatusBadge status="registered" />
<OrganizerStatusBadge status="attended" />
```

### Functions

#### `getParticipantStatusConfig(status?: string)`
Returns configuration object for custom rendering.

```tsx
const config = getParticipantStatusConfig('confirmed');
// Returns: { label: 'Confirmed', variant: 'default', className: '...' }
```

#### `getStatusBadgeVariant(status: string)`
Returns just the variant for backward compatibility.

```tsx
const variant = getStatusBadgeVariant('confirmed');
// Returns: 'default' | 'secondary' | 'destructive' | 'outline'
```

### Supported Statuses

**Participant Statuses:**
- `verification_pending` - Orange outline
- `registered` - Secondary gray
- `waiting-for-attendance-confirmation` - Default
- `confirmed` - Green
- `unconfirmed` - Yellow outline
- `matched` - Default
- `checked-in` - Default
- `cancelled` - Red destructive
- `met` - Blue
- `missed` - Red destructive
- `no-show` - Red destructive
- `excluded` - Outline

**Organizer Statuses:**
- `registered` - Blue
- `checked-in` - Yellow
- `attended` - Green
- `missed` - Red

---

## Validation Utilities

**Location:** `/utils/validation.ts`

### Email Validation

```tsx
import { validateEmail, getEmailError } from '../utils/validation';

// Basic validation
if (validateEmail(email)) {
  // Email is valid
}

// Get error message
const error = getEmailError(email);
if (error) {
  setEmailError(error);
}
```

### Phone Validation

```tsx
import { validatePhone, getPhoneError } from '../utils/validation';

if (validatePhone(phone)) {
  // Phone is valid (supports international format)
}
```

### URL Slug Validation

```tsx
import { validateUrlSlug } from '../utils/validation';

if (validateUrlSlug(slug)) {
  // Slug is valid (3-50 chars, alphanumeric with hyphens)
}
```

### Password Validation

```tsx
import { validatePassword, validatePasswordMatch } from '../utils/validation';

const result = validatePassword(password);
if (!result.isValid) {
  console.error(result.error);
}

if (validatePasswordMatch(password, confirmPassword)) {
  // Passwords match
}
```

### General Validation

```tsx
import { 
  validateRequired,
  validateMinLength,
  validateMaxLength 
} from '../utils/validation';

validateRequired(value); // Checks if value is not empty
validateMinLength(value, 8); // Checks minimum length
validateMaxLength(value, 100); // Checks maximum length
```

### Utility Functions

```tsx
import { sanitizeString, formatPhoneNumber } from '../utils/validation';

const clean = sanitizeString('  Hello   World  '); // "Hello World"
const formatted = formatPhoneNumber('+421 901 234 567'); // "+421901234567"
```

---

## API Request Hooks

**Location:** `/hooks/useApiRequest.ts`

### `useApiRequest<T, P>`

Generic hook for API requests with automatic state management.

```tsx
import { useApiRequest } from '../hooks/useApiRequest';

const { data, error, isLoading, execute, reset } = useApiRequest(
  async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
  {
    onSuccess: (data) => {
      console.log('Success!', data);
      toast.success('User loaded');
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.message);
    },
    onFinally: () => {
      console.log('Request completed');
    }
  }
);

// Execute the request
await execute('user-123');

// Reset state
reset();
```

### `useLoadingState`

Simple loading state management without data tracking.

```tsx
import { useLoadingState } from '../hooks/useApiRequest';

const { isLoading, startLoading, stopLoading, withLoading } = useLoadingState();

// Manual control
startLoading();
await doSomething();
stopLoading();

// Automatic control
await withLoading(async () => {
  await doSomething();
  await doSomethingElse();
});
```

### `useMultipleLoadingStates`

Manage multiple loading states simultaneously.

```tsx
import { useMultipleLoadingStates } from '../hooks/useApiRequest';

const { loadingStates, setLoading, isAnyLoading } = useMultipleLoadingStates([
  'fetching',
  'saving',
  'deleting'
]);

setLoading('fetching', true);
// ... do work
setLoading('fetching', false);

if (isAnyLoading) {
  // At least one operation is loading
}

if (loadingStates.saving) {
  // Saving is in progress
}
```

---

## API Error Handler

**Location:** `/utils/apiErrorHandler.ts`

### Basic Error Handling

```tsx
import { handleApiError, showErrorToast, showSuccessToast } from '../utils/apiErrorHandler';

const response = await fetch('/api/data');
if (!response.ok) {
  const error = await handleApiError(response, 'loading data');
  showErrorToast(error);
  return;
}

showSuccessToast('Data loaded successfully');
```

### Generic API Request Handler

```tsx
import { handleApiRequest } from '../utils/apiErrorHandler';

const data = await handleApiRequest<User[]>(
  () => fetch('/api/users'),
  {
    successMessage: 'Users loaded',
    errorMessage: 'Failed to load users',
    context: 'loading users list',
    showSuccessToast: true,
    showErrorToast: true
  }
);

if (data) {
  // Use data
}
```

### Status Code Handlers

```tsx
import { StatusHandlers, handleResponseByStatus } from '../utils/apiErrorHandler';

// Direct usage
StatusHandlers.unauthorized(() => navigate('/login'));
StatusHandlers.notFound('Session');
StatusHandlers.forbidden();
StatusHandlers.serverError();

// With response handling
const success = await handleResponseByStatus(response, {
  404: () => {
    console.log('Not found - custom handler');
  },
  409: () => {
    toast.error('Conflict - try again');
  }
});
```

### Retry with Backoff

```tsx
import { retryRequest } from '../utils/apiErrorHandler';

const data = await retryRequest(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed');
    return response.json();
  },
  3, // Max retries
  1000 // Base delay in ms (1s, 2s, 4s)
);
```

---

## Toast Messages

**Location:** `/utils/toastMessages.ts`

### Authentication

```tsx
import { AuthToasts } from '../utils/toastMessages';

AuthToasts.signInSuccess();
AuthToasts.signInError();
AuthToasts.signOutSuccess();
AuthToasts.signUpSuccess();
AuthToasts.resetPasswordSuccess();
AuthToasts.sessionExpired();
```

### Data Operations

```tsx
import { LoadingToasts } from '../utils/toastMessages';

LoadingToasts.loadError('sessions');
LoadingToasts.saveSuccess('profile');
LoadingToasts.deleteSuccess('session');
LoadingToasts.updateSuccess('settings');
```

### Validation

```tsx
import { ValidationToasts } from '../utils/toastMessages';

ValidationToasts.invalidEmail();
ValidationToasts.invalidPhone();
ValidationToasts.requiredField('Email');
ValidationToasts.urlTaken();
ValidationToasts.urlAvailable();
```

### Sessions

```tsx
import { SessionToasts } from '../utils/toastMessages';

SessionToasts.created();
SessionToasts.updated();
SessionToasts.deleted();
SessionToasts.published();
```

### Registrations

```tsx
import { RegistrationToasts } from '../utils/toastMessages';

RegistrationToasts.success();
RegistrationToasts.confirmed();
RegistrationToasts.verificationSent();
RegistrationToasts.alreadyRegistered();
```

### Participants

```tsx
import { ParticipantToasts } from '../utils/toastMessages';

ParticipantToasts.profileUpdated();
ParticipantToasts.contactsSaved();
ParticipantToasts.checkInSuccess();
ParticipantToasts.attendanceConfirmed();
```

### File Uploads

```tsx
import { UploadToasts } from '../utils/toastMessages';

UploadToasts.success('Image');
UploadToasts.invalidType('PNG, JPG');
UploadToasts.tooLarge('10MB');
```

### Network

```tsx
import { NetworkToasts } from '../utils/toastMessages';

NetworkToasts.error();
NetworkToasts.offline();
NetworkToasts.reconnected();
```

### Clipboard

```tsx
import { ClipboardToasts } from '../utils/toastMessages';

ClipboardToasts.copied('Link');
ClipboardToasts.copyError();
```

---

## Loading Components

**Location:** `/components/ui/LoadingSpinner.tsx`

### LoadingSpinner

```tsx
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Basic spinner
<LoadingSpinner />

// With size
<LoadingSpinner size="sm" />  // sm, md, lg, xl
<LoadingSpinner size="lg" />

// With text
<LoadingSpinner text="Loading data..." />

// Centered
<LoadingSpinner centered />

// Full screen overlay
<LoadingSpinner fullScreen text="Processing..." />
```

### Specialized Loading Components

```tsx
import { 
  CardLoading,
  PageLoading,
  ButtonLoading 
} from '../components/ui/LoadingSpinner';

// Card loading state
<Card>
  {isLoading ? <CardLoading /> : <CardContent>...</CardContent>}
</Card>

// Page loading state
{isLoading && <PageLoading text="Loading page..." />}

// Button loading state
<Button disabled={isLoading}>
  {isLoading ? <ButtonLoading /> : 'Submit'}
</Button>
```

### Loading Skeletons

```tsx
import { 
  TextSkeleton,
  CardSkeleton,
  TableRowSkeleton 
} from '../components/ui/LoadingSpinner';

// Text skeleton
<TextSkeleton lines={3} />

// Card skeleton
<CardSkeleton />

// Table row skeleton
<table>
  <tbody>
    {isLoading && <TableRowSkeleton columns={4} />}
  </tbody>
</table>
```

---

## Debug Utilities

**Location:** `/utils/debug.ts`

### Conditional Logging

```tsx
import { debugLog, errorLog } from '../utils/debug';

// Only logs in development
debugLog('User data:', userData);
debugLog('Processing step 1');

// Always logs errors
errorLog('Failed to load data:', error);
```

### Usage in Components

```tsx
export function MyComponent() {
  useEffect(() => {
    debugLog('Component mounted');
    
    return () => {
      debugLog('Component unmounted');
    };
  }, []);

  const handleSubmit = async () => {
    try {
      debugLog('Submitting form...');
      await submitData();
      debugLog('Form submitted successfully');
    } catch (error) {
      errorLog('Form submission failed:', error);
    }
  };
}
```

---

## Best Practices

### 1. Always Use Centralized Utilities
```tsx
// ❌ Don't
if (!email || !email.includes('@')) { ... }

// ✅ Do
if (!validateEmail(email)) { ... }
```

### 2. Use Hooks for State Management
```tsx
// ❌ Don't
const [isLoading, setIsLoading] = useState(false);
try {
  setIsLoading(true);
  await doWork();
} finally {
  setIsLoading(false);
}

// ✅ Do
const { withLoading } = useLoadingState();
await withLoading(async () => await doWork());
```

### 3. Use Centralized Toast Messages
```tsx
// ❌ Don't
toast.success('Saved successfully');

// ✅ Do
LoadingToasts.saveSuccess('profile');
```

### 4. Use Loading Components
```tsx
// ❌ Don't
{isLoading && <Loader2 className="h-8 w-8 animate-spin" />}

// ✅ Do
{isLoading && <LoadingSpinner size="lg" />}
```

---

## Contributing

When adding new utilities:

1. **Check for duplicates** - Ensure utility doesn't already exist
2. **Add TypeScript types** - All utilities must be typed
3. **Add JSDoc comments** - Document parameters and return values
4. **Add to this guide** - Update documentation with examples
5. **Write tests** - Add unit tests for utility functions

---

## Support

For questions or issues with utilities:
1. Check this documentation first
2. Look at usage examples in existing components
3. Review the deduplication guide in `/docs/DEDUPLICATION_GUIDE.md`

---

Last updated: December 2024
Version: 1.0.0
