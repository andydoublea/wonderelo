import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useI18nStore } from '../../stores/i18nStore';
import { useAccessToken } from '../../stores';
import { apiBaseUrl } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface InlineEditPopoverProps {
  translationKey: string;
  currentText: string;
  defaultText: string;
  anchorEl: HTMLElement;
  onClose: () => void;
}

export function InlineEditPopover({
  translationKey,
  currentText,
  defaultText,
  anchorEl,
  onClose,
}: InlineEditPopoverProps) {
  const [text, setText] = useState(currentText);
  const [saving, setSaving] = useState(false);
  const currentLanguage = useI18nStore((s) => s.currentLanguage);
  const updateTranslation = useI18nStore((s) => s.updateTranslation);
  const accessToken = useAccessToken();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position the popover
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const rect = anchorEl.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 8,
      left: Math.max(8, Math.min(rect.left + window.scrollX, window.innerWidth - 340)),
    });
  }, [anchorEl]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    // Delay to avoid closing immediately on the click that opened it
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose, anchorEl]);

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      // First find the key_id by fetching translations for current language
      const res = await fetch(
        `${apiBaseUrl}/admin/i18n/translations/${currentLanguage}`,
        { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      if (!res.ok) throw new Error('Failed to fetch translations');

      const translations = await res.json();
      const keyData = translations.find((t: any) => t.key === translationKey);

      if (!keyData) {
        toast.error(`Key "${translationKey}" not found`);
        return;
      }

      // Save the translation
      const saveRes = await fetch(`${apiBaseUrl}/admin/i18n/translations`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key_id: keyData.key_id,
          language_code: currentLanguage,
          translated_text: text,
          status: 'reviewed',
        }),
      });

      if (!saveRes.ok) throw new Error('Failed to save');

      // Update local store instantly
      updateTranslation(translationKey, text);
      toast.success('Translation saved');
      onClose();
    } catch (err) {
      toast.error('Failed to save translation');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 99999,
        width: '320px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        padding: '12px',
      }}
    >
      {/* Key name */}
      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px', fontFamily: 'monospace' }}>
        {translationKey}
      </div>

      {/* Source text (English default) */}
      {defaultText && currentLanguage !== 'en' && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', padding: '6px 8px', background: '#f9fafb', borderRadius: '4px' }}>
          EN: {defaultText}
        </div>
      )}

      {/* Editable text */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.max(2, Math.ceil(text.length / 40))}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '13px',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; }}
        onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
        autoFocus
      />

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || text === currentText}
          style={{ background: '#8b5cf6', color: 'white' }}
        >
          {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
          Save
        </Button>
      </div>
    </div>,
    document.body
  );
}
