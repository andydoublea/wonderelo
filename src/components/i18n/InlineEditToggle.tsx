import { useI18nStore } from '../../stores/i18nStore';
import { useAppStore } from '../../stores/appStore';
import { Languages } from 'lucide-react';

/**
 * Floating toggle button for admin inline edit mode.
 * Only visible to admin users.
 */
export function InlineEditToggle() {
  const user = useAppStore((s) => s.user);
  const isInlineEditMode = useI18nStore((s) => s.isInlineEditMode);
  const setInlineEditMode = useI18nStore((s) => s.setInlineEditMode);

  // Only show for admin users
  const adminEmails = ['jan.sramka+admin@gmail.com', 'jan.sramka@gmail.com', 'andy.double.a+org@gmail.com'];
  const isAdmin = user?.email && adminEmails.includes(user.email);

  if (!isAdmin) return null;

  return (
    <button
      onClick={() => setInlineEditMode(!isInlineEditMode)}
      title={isInlineEditMode ? 'Exit translate mode' : 'Enter translate mode'}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99998,
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: 'none',
        background: isInlineEditMode ? '#8b5cf6' : '#f3f4f6',
        color: isInlineEditMode ? 'white' : '#6b7280',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <Languages style={{ width: '20px', height: '20px' }} />
    </button>
  );
}
