import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useI18nStore } from '../../stores/i18nStore';
import { useAppStore } from '../../stores/appStore';
import { InlineEditPopover } from './InlineEditPopover';

interface TProps {
  /** Translation key, e.g. 'nav.signUp' */
  k: string;
  /** Default English text (used as fallback) */
  children?: ReactNode;
  /** Parameter replacements: { year: 2024 } replaces {year} */
  params?: Record<string, string | number>;
  /** Render as specific HTML element (default: span) */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'li' | 'label';
  /** Pass-through className */
  className?: string;
  /** Pass-through style */
  style?: React.CSSProperties;
}

/**
 * Translatable text component.
 *
 * Usage:
 *   <T k="nav.signUp">Sign up</T>
 *   <T k="footer.copyright" params={{ year: 2024 }}>© {year} Wonderelo</T>
 *   <T k="homepage.hero.title" as="h1" className="text-4xl">Add value...</T>
 *
 * In inline edit mode (admin only), renders with edit capability.
 */
export function T({ k, children, params, as: Tag = 'span', className, style }: TProps) {
  const translations = useI18nStore((s) => s.translations);
  const isInlineEditMode = useI18nStore((s) => s.isInlineEditMode);
  const user = useAppStore((s) => s.user);
  const [showEditor, setShowEditor] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Get translated text
  const defaultText = typeof children === 'string' ? children : '';
  let text = translations[k] || defaultText || k;

  // Replace params
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      text = text.replace(`{${key}}`, String(value));
    }
  }

  const isAdmin = user?.role === 'admin';
  const canEdit = isInlineEditMode && isAdmin;

  // Close popover on outside click
  useEffect(() => {
    if (!showEditor) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // Don't close if clicking inside popover (handled by portal)
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEditor]);

  if (!canEdit) {
    return <Tag className={className} style={style}>{text}</Tag>;
  }

  return (
    <>
      <Tag
        ref={ref as any}
        className={className}
        style={{
          ...style,
          outline: showEditor ? '2px solid #8b5cf6' : undefined,
          outlineOffset: '2px',
          cursor: 'pointer',
          borderRadius: '2px',
          position: 'relative' as const,
        }}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setShowEditor(true);
        }}
        onMouseEnter={(e: React.MouseEvent) => {
          if (!showEditor) {
            (e.currentTarget as HTMLElement).style.outline = '1px dashed #8b5cf6';
            (e.currentTarget as HTMLElement).style.outlineOffset = '2px';
          }
        }}
        onMouseLeave={(e: React.MouseEvent) => {
          if (!showEditor) {
            (e.currentTarget as HTMLElement).style.outline = '';
            (e.currentTarget as HTMLElement).style.outlineOffset = '';
          }
        }}
      >
        {text}
      </Tag>
      {showEditor && ref.current && (
        <InlineEditPopover
          translationKey={k}
          currentText={text}
          defaultText={defaultText}
          anchorEl={ref.current}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
