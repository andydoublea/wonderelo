# Debug Mode Documentation

This project implements a conditional logging system that allows verbose debugging in development while keeping production logs clean.

## 🎯 Overview

All `console.log` statements have been replaced with `debugLog()` helper functions that only output when debug mode is enabled.

- **Production**: Silent debug logs, only errors are shown
- **Development**: Verbose logging for debugging

## 🔧 How to Use

### Frontend (Browser Console)

Enable debug mode in your browser console:

```javascript
// Enable debug logging
window.debug.enable()

// Disable debug logging
window.debug.disable()

// Toggle debug logging
window.debug.toggle()

// Check if debug mode is enabled
window.debug.isEnabled()
```

Or using localStorage directly:

```javascript
// Enable
localStorage.setItem('debugMode', 'true')

// Disable
localStorage.removeItem('debugMode')
```

### Backend (Deno Environment)

Set the `DEBUG_MODE` environment variable:

```bash
# Enable debug logging
DEBUG_MODE=true deno run --allow-all server.ts

# Disable (default)
DEBUG_MODE=false deno run --allow-all server.ts
```

## 📦 Implementation

### Frontend: `/utils/debug.ts`

```typescript
import { debugLog, errorLog, infoLog } from '../utils/debug';

// Debug logs (only shown when debug mode is enabled)
debugLog('This is a debug message', data);

// Error logs (always shown)
errorLog('This is an error', error);

// Info logs (always shown)
infoLog('This is important info');
```

### Backend: `/supabase/functions/server/debug.tsx`

```typescript
import { debugLog, errorLog, infoLog } from './debug.tsx';

// Debug logs (only shown when DEBUG_MODE=true)
debugLog('Backend debug message', data);

// Error logs (always shown)
errorLog('Backend error', error);

// Info logs (always shown)
infoLog('Important backend info');
```

## ✅ Components Updated

The following components have been updated to use conditional logging:

### Frontend
- ✅ `/components/UserPublicPage.tsx`
- ✅ `/components/SessionAdministration.tsx`
- ✅ `/components/AccountSettings.tsx` (to be updated)
- ⏳ Other components (as needed)

### Backend
- ⏳ `/supabase/functions/server/index.tsx` (to be updated)

## 🚀 Production Deployment

For production environments:

### Frontend
- Debug mode is **disabled by default**
- Users can manually enable it if needed for troubleshooting
- No sensitive data is logged

### Backend
- Set `DEBUG_MODE=false` or leave unset
- Only error logs and important info logs will appear
- HTTP request logger remains active (useful for monitoring)

## 💡 Best Practices

1. **Use `debugLog()` for development debugging**
   - API responses
   - State changes
   - Flow tracing

2. **Use `errorLog()` for actual errors**
   - Network failures
   - Validation errors
   - Unexpected states

3. **Use `infoLog()` for important production info**
   - User actions
   - Critical state changes
   - Important milestones

4. **Never log sensitive data**
   - Passwords
   - API keys
   - Personal information

## 🔍 Debugging Tips

When troubleshooting issues:

1. Enable debug mode
2. Reproduce the issue
3. Check console for detailed logs
4. Disable debug mode when done

This keeps production clean while making development easier!
