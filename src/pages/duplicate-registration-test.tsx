import { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Copy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function DuplicateRegistrationTest() {
  const [testEmail, setTestEmail] = useState('test-' + Date.now() + '@example.com');
  const [testData, setTestData] = useState<any>(null);

  const copyEmail = () => {
    navigator.clipboard.writeText(testEmail);
    toast.success('Email copied to clipboard');
  };

  const generateNewEmail = () => {
    setTestEmail('test-' + Date.now() + '@example.com');
    setTestData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧪</span>
            </div>
            <div>
              <h1 className="mb-1">Duplicate registration fix test</h1>
              <p className="text-gray-600">
                Test that participants can register for rounds with same name in different sessions
              </p>
            </div>
          </div>

          {/* Version Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Backend version deployed</span>
            </div>
            <div className="text-sm text-green-800">
              Version: <code className="bg-green-100 px-2 py-1 rounded">6.28.0-fix-participant-register-sessionid</code>
            </div>
            <div className="text-sm text-green-800 mt-1">
              Fix #2: Now checking <code className="bg-green-100 px-2 py-1 rounded">roundId + sessionId</code> in participant dashboard register endpoint
            </div>
          </div>
        </div>

        {/* CLEANUP NOTICE */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-yellow-900 mb-2">Important: Clean up before retesting!</h2>
              <p className="text-yellow-800 mb-3">
                If you previously registered with email <strong>andy.double.a+testik@gmail.com</strong>, 
                you need to clean up those registrations before testing the fix.
              </p>
              <p className="text-sm text-yellow-700 mb-3">
                The participant stayed logged in after the first registration, so the second registration 
                was blocked by frontend duplicate check (not backend). Backend fix only works if you're 
                starting fresh or already have token in localStorage.
              </p>
              <div className="bg-white border border-yellow-300 rounded p-3 mb-3">
                <p className="text-sm font-medium text-gray-900 mb-2">Cleanup options:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                  <li>Use a completely NEW email (recommended for clean test)</li>
                  <li>Or manually delete participant registrations in Admin panel</li>
                  <li>Or wait for backend deployment to clear localStorage and retry</li>
                </ol>
              </div>
              <button
                onClick={generateNewEmail}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Generate fresh test email
              </button>
            </div>
          </div>
        </div>

        {/* Test Email */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="mb-4">Test email address</h2>
          <p className="text-gray-600 mb-4">
            Use this unique email for testing. Copy it and use it in both registration steps below.
          </p>
          
          <div className="flex gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
              {testEmail}
            </div>
            <button
              onClick={copyEmail}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={generateNewEmail}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              New email
            </button>
          </div>
        </div>

        {/* Step-by-Step Guide */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="mb-2">Create two sessions with same round name</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <p className="font-medium mb-2">Session A:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Name: "Test Session A"</li>
                      <li>Add <strong>Round 1</strong> (or any round name)</li>
                      <li>Make sure it's <strong>published</strong></li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <p className="font-medium mb-2">Session B:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Name: "Test Session B"</li>
                      <li>Add <strong>Round 1</strong> (SAME round name as Session A)</li>
                      <li>Make sure it's <strong>published</strong></li>
                    </ul>
                  </div>
                </div>
                <a
                  href="/rounds"
                  target="_blank"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Go to rounds page
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="mb-2">Register participant in Session A - Round 1</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Go to your public event page</li>
                      <li>Find <strong>Session A</strong></li>
                      <li>Click "Register for Round 1"</li>
                      <li>Enter the test email: <code className="bg-gray-200 px-2 py-0.5 rounded">{testEmail}</code></li>
                      <li>Complete registration</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <a
                    href={`/${localStorage.getItem('oliwonder_event_slug') || 'your-slug'}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Go to public page
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={copyEmail}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy test email
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="mb-2">Register SAME participant in Session B - Round 1</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 mb-1">This is the critical test!</p>
                        <p className="text-yellow-800">
                          OLD BUG: Would reject registration saying "already registered"
                        </p>
                        <p className="text-yellow-800">
                          NEW FIX: Should allow registration (different session!)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Go to your public event page again</li>
                      <li>Find <strong>Session B</strong> (different session!)</li>
                      <li>Click "Register for Round 1" (same round name!)</li>
                      <li>Enter the SAME test email: <code className="bg-gray-200 px-2 py-0.5 rounded">{testEmail}</code></li>
                      <li>Complete registration</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <a
                    href={`/${localStorage.getItem('oliwonder_event_slug') || 'your-slug'}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Go to public page
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={copyEmail}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy test email
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 - Expected Result */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                ✓
              </div>
              <div className="flex-1">
                <h3 className="mb-2">Expected result</h3>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900 mb-2">✅ FIX WORKING:</p>
                        <ul className="list-disc list-inside space-y-1 text-green-800 ml-2">
                          <li>Second registration should <strong>succeed</strong></li>
                          <li>Participant should be registered in BOTH sessions</li>
                          <li>Participant should see both rounds in their dashboard</li>
                          <li>No "already registered" error</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900 mb-2">❌ FIX NOT WORKING (old bug):</p>
                        <ul className="list-disc list-inside space-y-1 text-red-800 ml-2">
                          <li>Second registration would be <strong>rejected</strong></li>
                          <li>Error message: "You are already registered for this round"</li>
                          <li>Participant only in Session A, not in Session B</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 - Verify */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                5
              </div>
              <div className="flex-1">
                <h3 className="mb-2">Verify in admin panel</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Go to Admin &gt; Participants</li>
                      <li>Search for the test email: <code className="bg-gray-200 px-2 py-0.5 rounded">{testEmail}</code></li>
                      <li>Check participant's registrations</li>
                      <li>Should see <strong>2 registrations</strong>: one for Session A Round 1, one for Session B Round 1</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <a
                    href="/admin/participants"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    Go to admin participants
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={copyEmail}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy test email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
          <h2 className="mb-4">Technical details</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="mb-2">What was fixed:</h3>
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                <p className="font-medium text-red-900 mb-1">❌ OLD CODE (buggy):</p>
                <pre className="text-xs font-mono text-red-800 overflow-x-auto">
{`const existingReg = existingRegistrations.find(
  (reg) => reg.roundId === round.id
  // Missing sessionId check!
);`}
                </pre>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="font-medium text-green-900 mb-1">✅ NEW CODE (fixed):</p>
                <pre className="text-xs font-mono text-green-800 overflow-x-auto">
{`const existingReg = existingRegistrations.find(
  (reg) => reg.roundId === round.id && 
           reg.sessionId === session.sessionId
);`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="mb-2">Why it matters:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>Participants often attend multiple sessions</li>
                <li>Different sessions can have rounds with same name (Round 1, Morning Session, etc.)</li>
                <li>Old bug prevented participants from registering for same round name in different sessions</li>
                <li>New fix properly checks BOTH roundId AND sessionId for duplicates</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2">File changed:</h3>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 font-mono text-xs">
                /supabase/functions/server/index.tsx
                <br />
                Line ~3024 (in register endpoint)
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <a
            href="/admin/tests"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to test panel
          </a>
        </div>
      </div>
    </div>
  );
}