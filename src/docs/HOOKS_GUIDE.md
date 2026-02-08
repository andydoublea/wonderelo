# Custom Hooks Guide

Comprehensive guide to all custom React hooks in the Oliwonder application.

## 📚 Table of Contents

1. [Form Hooks](#form-hooks)
2. [Dialog Hooks](#dialog-hooks)
3. [Auth Hooks](#auth-hooks)
4. [Responsive Hooks](#responsive-hooks)
5. [Performance Hooks](#performance-hooks)
6. [API Hooks](#api-hooks)

---

## Form Hooks

### `useForm<T>`

**Location:** `/hooks/useForm.ts`

Advanced form state management with built-in validation.

#### Basic Usage

```tsx
import { useForm } from '../hooks/useForm';

const form = useForm({
  initialValues: {
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  },
  validationRules: {
    email: {
      required: true,
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email'
      }
    },
    password: {
      required: 'Password is required',
      minLength: {
        value: 8,
        message: 'Password must be at least 8 characters'
      }
    },
    firstName: {
      required: true,
      minLength: { value: 2, message: 'Too short' }
    }
  },
  onSubmit: async (values) => {
    await saveUser(values);
  }
});
```

#### Using with Components

```tsx
// Simple way - use getFieldProps
<Input {...form.getFieldProps('email')} />

// Manual way - more control
<Input
  value={form.values.email}
  onChange={form.handleChange('email')}
  onBlur={form.handleBlur('email')}
/>
{form.errors.email && form.touched.email && (
  <p className="text-destructive">{form.errors.email}</p>
)}
```

#### Form Submission

```tsx
<form onSubmit={form.handleSubmit}>
  <Input {...form.getFieldProps('email')} />
  
  <Button type="submit" disabled={form.isSubmitting || !form.isValid}>
    {form.isSubmitting ? 'Submitting...' : 'Submit'}
  </Button>
</form>
```

#### Advanced Features

```tsx
// Set field value programmatically
form.setFieldValue('email', 'user@example.com');

// Set multiple values
form.setValues({ email: 'user@example.com', firstName: 'John' });

// Set field error manually
form.setFieldError('email', 'Email already exists');

// Clear specific error
form.clearFieldError('email');

// Validate single field
const error = form.validateField('email');

// Validate entire form
const isValid = form.validateForm();

// Reset form to initial values
form.reset();
```

#### Custom Validation

```tsx
validationRules: {
  password: {
    validate: (value, formData) => {
      if (value.length < 8) return 'Too short';
      if (!/[A-Z]/.test(value)) return 'Must contain uppercase';
      if (!/[0-9]/.test(value)) return 'Must contain number';
      return undefined; // No error
    }
  },
  confirmPassword: {
    validate: (value, formData) => {
      if (value !== formData.password) {
        return 'Passwords must match';
      }
    }
  }
}
```

---

## Dialog Hooks

### `useDialog()`

**Location:** `/hooks/useDialog.ts`

Simple dialog state management.

```tsx
import { useDialog } from '../hooks/useDialog';

const dialog = useDialog();

return (
  <>
    <Button onClick={dialog.open}>Open</Button>
    
    <Dialog open={dialog.isOpen} onOpenChange={dialog.setIsOpen}>
      <DialogContent>
        <DialogTitle>My Dialog</DialogTitle>
        <Button onClick={dialog.close}>Close</Button>
      </DialogContent>
    </Dialog>
  </>
);
```

### `useMultipleDialogs<T>`

Manage multiple dialogs in one component.

```tsx
const dialogs = useMultipleDialogs(['create', 'edit', 'delete']);

return (
  <>
    <Button onClick={() => dialogs.open('create')}>Create</Button>
    <Button onClick={() => dialogs.open('edit')}>Edit</Button>
    
    <Dialog open={dialogs.isOpen('create')} 
            onOpenChange={(open) => dialogs.setOpen('create', open)}>
      {/* Create dialog content */}
    </Dialog>
    
    <Dialog open={dialogs.isOpen('edit')}
            onOpenChange={(open) => dialogs.setOpen('edit', open)}>
      {/* Edit dialog content */}
    </Dialog>
  </>
);
```

### `useDialogWithData<T>`

Dialog with associated data (useful for edit dialogs).

```tsx
interface User {
  id: string;
  name: string;
}

const dialog = useDialogWithData<User>();

const handleEdit = (user: User) => {
  dialog.openWith(user);
};

return (
  <>
    <Button onClick={() => handleEdit(user)}>Edit</Button>
    
    <Dialog open={dialog.isOpen} onOpenChange={dialog.setIsOpen}>
      <DialogContent>
        {dialog.data && (
          <UserForm 
            user={dialog.data} 
            onSave={() => dialog.closeAndClear()} 
          />
        )}
      </DialogContent>
    </Dialog>
  </>
);
```

### `useWizardDialog(steps)`

Multi-step dialog (wizard).

```tsx
const wizard = useWizardDialog(3);

return (
  <Dialog open={wizard.isOpen} onOpenChange={wizard.setIsOpen}>
    <DialogContent>
      <Progress value={wizard.progress} />
      
      {wizard.currentStep === 0 && <Step1 />}
      {wizard.currentStep === 1 && <Step2 />}
      {wizard.currentStep === 2 && <Step3 />}
      
      <DialogFooter>
        {wizard.canGoBack && (
          <Button onClick={wizard.goBack}>Back</Button>
        )}
        {wizard.canGoNext && (
          <Button onClick={wizard.goNext}>Next</Button>
        )}
        {wizard.isLastStep && (
          <Button onClick={wizard.close}>Finish</Button>
        )}
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
```

### `useConfirmDialog()`

**Location:** `/hooks/useConfirmDialog.tsx`

Confirmation dialogs with async support.

```tsx
import { useConfirmDialog } from '../hooks/useConfirmDialog';

const { confirm, ConfirmDialog } = useConfirmDialog();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete item',
    description: 'This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'destructive'
  });
  
  if (confirmed) {
    await deleteItem();
  }
};

return (
  <>
    <Button onClick={handleDelete}>Delete</Button>
    <ConfirmDialog />
  </>
);
```

### `useConfirmDialogWithPresets()`

Predefined confirmation dialogs.

```tsx
import { useConfirmDialogWithPresets } from '../hooks/useConfirmDialog';

const { confirmDelete, confirmLogout, ConfirmDialog } = useConfirmDialogWithPresets();

const handleDelete = async () => {
  if (await confirmDelete('session')) {
    await deleteSession();
  }
};

const handleLogout = async () => {
  if (await confirmLogout()) {
    await logout();
  }
};

return (
  <>
    <Button onClick={handleDelete}>Delete</Button>
    <Button onClick={handleLogout}>Logout</Button>
    <ConfirmDialog />
  </>
);
```

**Available Presets:**
- `confirmDelete(itemName)`
- `confirmCancel(actionName)`
- `confirmLeave()`
- `confirmRemove(itemName)`
- `confirmLogout()`
- `confirmReset()`
- `confirmPublish(itemName)`
- `confirmUnpublish(itemName)`

---

## Auth Hooks

**Location:** `/hooks/useAuth.ts`

### `useAuth()`

Complete authentication state management.

```tsx
import { useAuth } from '../hooks/useAuth';

function App() {
  const auth = useAuth();
  
  if (auth.isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!auth.isAuthenticated) {
    return <SignInPage />;
  }
  
  return (
    <div>
      <p>Welcome, {auth.user?.email}</p>
      <Button onClick={auth.signOut}>Sign Out</Button>
    </div>
  );
}
```

### `useRequireAuth()`

Protect routes that require authentication.

```tsx
import { useRequireAuth } from '../hooks/useAuth';

function ProtectedPage() {
  const { isAllowed, isLoading } = useRequireAuth('/signin');
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAllowed) return null; // Redirects automatically
  
  return <div>Protected content</div>;
}
```

### `usePermission()`

Check user permissions.

```tsx
import { usePermission } from '../hooks/useAuth';

function ActionButton() {
  const canDelete = usePermission('sessions:delete');
  
  return (
    <Button onClick={handleDelete} disabled={!canDelete}>
      Delete
    </Button>
  );
}
```

### `useSessionTimeout()`

Auto sign-out after inactivity.

```tsx
import { useSessionTimeout } from '../hooks/useAuth';

function App() {
  // Auto sign-out after 30 minutes of inactivity
  useSessionTimeout(30 * 60 * 1000);
  
  return <div>...</div>;
}
```

### `useAuthHeader()`

Get authorization header for API requests.

```tsx
import { useAuthHeader } from '../hooks/useAuth';

function MyComponent() {
  const authHeader = useAuthHeader();
  
  const fetchData = async () => {
    const response = await fetch('/api/data', {
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      }
    });
  };
}
```

---

## Responsive Hooks

**Location:** `/hooks/useResponsive.ts`

### `useMediaQuery(query)`

Check if media query matches.

```tsx
import { useMediaQuery } from '../hooks/useResponsive';

const isMobile = useMediaQuery('(max-width: 768px)');
const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
const isPrint = useMediaQuery('print');

return isMobile ? <MobileView /> : <DesktopView />;
```

### `useBreakpoint()`

Get current breakpoint.

```tsx
import { useBreakpoint } from '../hooks/useResponsive';

const breakpoint = useBreakpoint();
// Returns: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

return (
  <div>
    Current breakpoint: {breakpoint}
    {breakpoint === 'sm' && <MobileMenu />}
    {breakpoint === 'lg' && <DesktopMenu />}
  </div>
);
```

### `useIsMobile()` / `useIsTablet()` / `useIsDesktop()`

Quick device type checks.

```tsx
import { useIsMobile, useIsTablet, useIsDesktop } from '../hooks/useResponsive';

const isMobile = useIsMobile();
const isTablet = useIsTablet();
const isDesktop = useIsDesktop();

if (isMobile) return <MobileLayout />;
if (isTablet) return <TabletLayout />;
return <DesktopLayout />;
```

### `useViewportSize()`

Get current viewport dimensions.

```tsx
import { useViewportSize } from '../hooks/useResponsive';

const { width, height } = useViewportSize();

return <div>Viewport: {width}x{height}</div>;
```

### `useResponsiveValue<T>()`

Select value based on breakpoint.

```tsx
import { useResponsiveValue } from '../hooks/useResponsive';

const columns = useResponsiveValue({
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 6
});

return <Grid columns={columns}>...</Grid>;
```

### `useOrientation()`

Detect device orientation.

```tsx
import { useOrientation } from '../hooks/useResponsive';

const orientation = useOrientation();
// Returns: 'portrait' | 'landscape'

return orientation === 'portrait' ? <PortraitView /> : <LandscapeView />;
```

### `useIsTouchDevice()`

Detect touch-capable device.

```tsx
import { useIsTouchDevice } from '../hooks/useResponsive';

const isTouch = useIsTouchDevice();

return isTouch ? <TouchControls /> : <MouseControls />;
```

---

## Performance Hooks

**Location:** `/hooks/useDebounce.ts`

### `useDebounce<T>(value, delay)`

Debounce a value (for search inputs, etc).

```tsx
import { useDebounce } from '../hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  // Only runs 500ms after user stops typing
  fetchSearchResults(debouncedSearchTerm);
}, [debouncedSearchTerm]);

return (
  <Input 
    value={searchTerm} 
    onChange={(e) => setSearchTerm(e.target.value)} 
  />
);
```

### `useDebouncedCallback()`

Debounce a callback function.

```tsx
import { useDebouncedCallback } from '../hooks/useDebounce';

const handleSearch = useDebouncedCallback(
  (query: string) => {
    fetchSearchResults(query);
  },
  500
);

return (
  <Input onChange={(e) => handleSearch(e.target.value)} />
);
```

### `useThrottledCallback()`

Throttle a callback (limit execution rate).

```tsx
import { useThrottledCallback } from '../hooks/useDebounce';

const handleScroll = useThrottledCallback(
  () => {
    console.log('Scroll position:', window.scrollY);
  },
  200 // Max once per 200ms
);

useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [handleScroll]);
```

### `useAsyncDebounce()`

Debounce async operations.

```tsx
import { useAsyncDebounce } from '../hooks/useDebounce';

const debouncedFetch = useAsyncDebounce(
  async (query: string) => {
    const response = await fetch(`/api/search?q=${query}`);
    return response.json();
  },
  500
);

const handleSearch = async (query: string) => {
  const results = await debouncedFetch(query);
  if (results) {
    setResults(results);
  }
};
```

---

## API Hooks

**Location:** `/hooks/useApiRequest.ts`

See [UTILITIES_README.md](./UTILITIES_README.md#api-request-hooks) for complete documentation.

### Quick Reference

```tsx
// Generic API request with state management
const { data, error, isLoading, execute } = useApiRequest(
  async (id: string) => { /* ... */ },
  { onSuccess, onError }
);

// Simple loading state
const { isLoading, withLoading } = useLoadingState();

// Multiple loading states
const { loadingStates, setLoading } = useMultipleLoadingStates(['save', 'delete']);
```

---

## Best Practices

### 1. Form Management

```tsx
// ✅ Good - Use useForm for complex forms
const form = useForm({
  initialValues: formData,
  validationRules: rules,
  onSubmit: handleSubmit
});

// ❌ Avoid - Manual state for each field
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');
// ... repeated for each field
```

### 2. Dialogs

```tsx
// ✅ Good - Use hooks for dialog state
const dialog = useDialog();
const { confirm, ConfirmDialog } = useConfirmDialog();

// ❌ Avoid - Manual state management
const [isOpen, setIsOpen] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
```

### 3. Responsive Design

```tsx
// ✅ Good - Use responsive hooks
const isMobile = useIsMobile();
const columns = useResponsiveValue({ xs: 1, md: 2, lg: 3 });

// ❌ Avoid - Manual window.innerWidth checks
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
```

### 4. Performance

```tsx
// ✅ Good - Debounce search input
const debouncedSearch = useDebounce(searchTerm, 500);

// ❌ Avoid - Fetch on every keystroke
useEffect(() => {
  fetchResults(searchTerm); // Too many requests!
}, [searchTerm]);
```

---

## Migration Examples

### Before → After: Form Handling

**Before:**
```tsx
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');
const [password, setPassword] = useState('');
const [passwordError, setPasswordError] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!email.includes('@')) {
    setEmailError('Invalid email');
    return;
  }
  
  if (password.length < 8) {
    setPasswordError('Too short');
    return;
  }
  
  setIsSubmitting(true);
  try {
    await saveData({ email, password });
  } finally {
    setIsSubmitting(false);
  }
};
```

**After:**
```tsx
const form = useForm({
  initialValues: { email: '', password: '' },
  validationRules: {
    email: {
      required: true,
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
    },
    password: {
      required: true,
      minLength: { value: 8, message: 'Too short' }
    }
  },
  onSubmit: async (values) => {
    await saveData(values);
  }
});

return <form onSubmit={form.handleSubmit}>
  <Input {...form.getFieldProps('email')} />
  <Input {...form.getFieldProps('password')} />
  <Button type="submit" disabled={form.isSubmitting}>Submit</Button>
</form>;
```

---

Last updated: December 2024
Version: 1.0.0
