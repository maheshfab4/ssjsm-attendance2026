import { Shield, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading data...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/30 mb-6 animate-pulse">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <div className="flex items-center justify-center gap-3 text-white">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-lg font-medium">{message}</span>
        </div>
        <p className="text-slate-400 text-sm mt-2">Connecting to Google Sheets...</p>
      </div>
    </div>
  );
}
