import { useState } from 'react';
import { Lock, X, Eye, EyeOff } from 'lucide-react';

interface PinModalProps {
  groupName: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  error?: string;
}

export default function PinModal({ groupName, onSubmit, onCancel, error }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length === 0) return;
    onSubmit(pin.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center relative">
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Enter PIN</h2>
          <p className="text-white/70 text-sm mt-1">Authenticate as {groupName} leader</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your PIN"
              className="w-full px-4 py-4 text-center text-2xl tracking-[0.3em] font-mono border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center font-medium bg-red-50 py-2.5 px-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pin.trim().length === 0}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Unlock
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            View as Read-Only Instead
          </button>
        </form>
      </div>
    </div>
  );
}
