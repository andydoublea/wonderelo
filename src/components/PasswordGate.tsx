import React, { useState, useEffect } from 'react';
import { apiBaseUrl } from '../utils/supabase/info';

const STORAGE_KEY = 'wonderelo_site_access';
const PERSON_KEY = 'wonderelo_access_person';

function identifyHotjar(personName: string) {
  if (typeof window !== 'undefined' && (window as any).hj) {
    (window as any).hj('identify', personName, { name: personName });
  }
}

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Skip password gate on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setIsUnlocked(true);
      return;
    }
    if (localStorage.getItem(STORAGE_KEY) === 'granted') {
      setIsUnlocked(true);
      // Re-identify with Hotjar on page reload
      const personName = localStorage.getItem(PERSON_KEY);
      if (personName) {
        identifyHotjar(personName);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/validate-access-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await response.json();

      if (data.valid) {
        localStorage.setItem(STORAGE_KEY, 'granted');
        localStorage.setItem(PERSON_KEY, data.personName);
        identifyHotjar(data.personName);
        setIsUnlocked(true);
      } else {
        setError('Incorrect password');
        setPassword('');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1.5px solid ${error ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '10px',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
              opacity: isLoading ? 0.6 : 1,
            }}
            onFocus={(e) => e.target.style.borderColor = error ? '#ef4444' : '#1a1a1a'}
            onBlur={(e) => e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb'}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px', margin: '8px 0 0 0' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: isLoading ? '#666' : '#1a1a1a',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '16px',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => !isLoading && ((e.target as HTMLButtonElement).style.background = '#333')}
            onMouseOut={(e) => !isLoading && ((e.target as HTMLButtonElement).style.background = '#1a1a1a')}
          >
            {isLoading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
