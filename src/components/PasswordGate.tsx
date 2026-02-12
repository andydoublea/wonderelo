import React, { useState, useEffect } from 'react';

const SITE_PASSWORD = 'rukuku';
const STORAGE_KEY = 'wonderelo_site_access';

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'granted') {
      setIsUnlocked(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'granted');
      setIsUnlocked(true);
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (isUnlocked) return <>{children}</>;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '380px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', color: '#1a1a1a' }}>
          Wonderelo
        </h1>
        <p style={{ color: '#888', margin: '0 0 28px 0', fontSize: '14px' }}>
          This site is currently in preview mode.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter password"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1.5px solid ${error ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '10px',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => e.target.style.borderColor = error ? '#ef4444' : '#1a1a1a'}
            onBlur={(e) => e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb'}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px', margin: '8px 0 0 0' }}>{error}</p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#1a1a1a',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '16px',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#333'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#1a1a1a'}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
