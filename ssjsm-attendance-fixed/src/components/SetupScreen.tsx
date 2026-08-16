import { useState } from 'react';
import { setApiUrl, initializeGroupsApi } from '../api';
import {
  Link2,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SetupScreenProps {
  onConnected: () => void;
}

export default function SetupScreen({ onConnected }: SetupScreenProps) {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [initializingGroups, setInitializingGroups] = useState(false);

  const handleConnect = async () => {
    if (!url.trim()) {
      setError('Please enter the API URL');
      return;
    }

    // Basic URL validation
    if (!url.startsWith('https://script.google.com/')) {
      setError('URL should start with https://script.google.com/');
      return;
    }

    setTesting(true);
    setError('');

    try {
      // Save URL first
      setApiUrl(url.trim());

      // Test connection by fetching data directly
      const { fetchAllData } = await import('../api');
      const groups = await fetchAllData();

      if (groups && Array.isArray(groups)) {
        onConnected();
      } else {
        setError('Connected but received unexpected data. Check your Google Sheet has the correct tabs.');
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(
        err.message ||
          'Connection failed. Make sure the Apps Script is deployed as a Web App with "Anyone" access.'
      );
    } finally {
      setTesting(false);
    }
  };

  const handleInitializeGroups = async () => {
    setInitializingGroups(true);
    try {
      const defaultGroups = [];
      for (let i = 1; i <= 12; i++) {
        defaultGroups.push({
          id: `group_${i}`,
          name: `Group ${i}`,
          leaderName: `Leader ${i}`,
          pin: String(1000 + i),
        });
      }
      await initializeGroupsApi(defaultGroups);
      alert('✓ 12 default groups have been created in your Google Sheet!');
    } catch (err: any) {
      alert('Failed to initialize groups: ' + err.message);
    } finally {
      setInitializingGroups(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/30 mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Organisation Attendance Tracker</h1>
          <p className="text-slate-400 mt-2">Connect to your Google Sheets database</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Connect to Google Sheets</h2>
            </div>

            <p className="text-sm text-slate-600 mb-5">
              Enter your Google Apps Script Web App URL. This connects the app to your Google Sheet where all data will be stored.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Google Apps Script URL
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={testing || !url.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Connect
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instructions Toggle */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full px-6 py-4 flex items-center justify-between text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <span className="font-medium">📋 Setup Instructions</span>
              {showInstructions ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {showInstructions && (
              <div className="px-6 pb-6 space-y-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Step 1: Create Google Sheet</h3>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Create a new Google Sheet</li>
                    <li>Add 4 sheets (tabs): <code className="bg-slate-200 px-1 rounded">Groups</code>, <code className="bg-slate-200 px-1 rounded">Members</code>, <code className="bg-slate-200 px-1 rounded">Duties</code>, <code className="bg-slate-200 px-1 rounded">Attendance</code></li>
                    <li>Add headers to each sheet (see documentation)</li>
                  </ol>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Step 2: Add Apps Script</h3>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>In the sheet: Extensions → Apps Script</li>
                    <li>Copy the script code from <code className="bg-slate-200 px-1 rounded">google-apps-script.js</code></li>
                    <li>Save the script</li>
                  </ol>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Step 3: Deploy Web App</h3>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Click Deploy → New deployment</li>
                    <li>Select "Web app"</li>
                    <li>Set "Who has access" to "Anyone"</li>
                    <li>Click Deploy and authorize</li>
                    <li>Copy the web app URL</li>
                  </ol>
                </div>

                <a
                  href="https://docs.google.com/spreadsheets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Google Sheets
                </a>

                {/* Initialize Groups Button */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <p className="text-slate-600 mb-3">
                    After connecting, if your Groups sheet is empty, click below to create the 12 default groups:
                  </p>
                  <button
                    onClick={handleInitializeGroups}
                    disabled={!url.trim() || initializingGroups}
                    className="w-full py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-medium hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {initializingGroups ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Groups...
                      </>
                    ) : (
                      'Initialize 12 Default Groups'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          All data will be stored securely in your Google Drive
        </p>
      </div>
    </div>
  );
}
