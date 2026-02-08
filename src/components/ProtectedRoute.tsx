import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Lock, ArrowLeft } from 'lucide-react';
import { debugLog } from '../utils/debug';

/**
 * Protected Route Component
 * Handles authentication and authorization checks
 */

export interface ProtectedRouteProps {
  children: ReactNode;
  /** Require user to be authenticated */
  requireAuth?: boolean;
  /** Required permissions (all must be satisfied) */
  requiredPermissions?: string[];
  /** Required roles (at least one must match) */
  requiredRoles?: string[];
  /** Redirect path if not authenticated */
  redirectTo?: string;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Show loading spinner while checking auth */
  showLoading?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermissions = [],
  requiredRoles = [],
  redirectTo = '/signin',
  fallback,
  showLoading = true
}: ProtectedRouteProps) {
  const location = useLocation();
  
  // Get auth state from localStorage (or your auth context)
  const accessToken = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Check authentication
  if (requireAuth && !accessToken) {
    debugLog('ProtectedRoute: User not authenticated, redirecting to', redirectTo);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check roles
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => user.role === role);
    
    if (!hasRequiredRole) {
      debugLog('ProtectedRoute: User does not have required role');
      return fallback || <AccessDenied />;
    }
  }

  // Check permissions
  if (requiredPermissions.length > 0 && user) {
    const userPermissions = user.permissions || [];
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      debugLog('ProtectedRoute: User does not have required permissions');
      return fallback || <AccessDenied />;
    }
  }

  // All checks passed
  return <>{children}</>;
}

/**
 * Access Denied fallback component
 */
function AccessDenied() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            If you believe this is an error, please contact your administrator.
          </p>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook for checking if user has permission
 */
export function useHasPermission(permission: string): boolean {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!user || !user.permissions) return false;
  
  return user.permissions.includes(permission);
}

/**
 * Hook for checking if user has role
 */
export function useHasRole(role: string): boolean {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!user) return false;
  
  return user.role === role;
}

/**
 * Hook for checking if user has any of the roles
 */
export function useHasAnyRole(roles: string[]): boolean {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!user) return false;
  
  return roles.includes(user.role);
}

/**
 * Component for conditionally rendering based on permissions
 */
export function RequirePermission({ 
  permission, 
  children, 
  fallback 
}: { 
  permission: string; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const hasPermission = useHasPermission(permission);
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Component for conditionally rendering based on roles
 */
export function RequireRole({ 
  role, 
  children, 
  fallback 
}: { 
  role: string | string[]; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const roles = Array.isArray(role) ? role : [role];
  const hasRole = useHasAnyRole(roles);
  
  if (!hasRole) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Import useNavigate
import { useNavigate } from 'react-router';
