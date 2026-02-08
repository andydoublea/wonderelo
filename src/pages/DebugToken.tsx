import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function DebugToken() {
  const [token, setToken] = useState('5e78ca2d-dddc-452e-80a1-18734595e759');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkToken = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/verification-token/${token}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to fetch', details: String(error) });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-8">Debug verification token</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block mb-2">
            Verification Token:
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          />
          
          <button
            onClick={checkToken}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Token'}
          </button>
        </div>
        
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="mb-4">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
