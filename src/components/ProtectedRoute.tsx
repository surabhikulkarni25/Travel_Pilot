import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon } from './GoogleIcon';
import { Compass, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, signingIn, signInWithGoogle, authError } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center mb-4 animate-pulse">
          <Compass className="w-7 h-7 animate-spin text-[#1D4E4F]" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="font-serif text-2xl text-[#1A202C] font-semibold">TravelPilot</h2>
        <p className="font-mono-meta text-xs uppercase tracking-wider text-[#576574] mt-1">
          Verifying secure session...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E7E2D9] shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1D4E4F] text-white flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Compass className="w-6 h-6" />
          </div>

          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono-meta bg-[#EBF2F1] text-[#1D4E4F] uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authenticated Area</span>
          </span>

          <h2 className="font-serif text-3xl font-bold text-[#1A202C] mb-2">
            Sign in to continue
          </h2>

          <p className="text-sm text-[#576574] leading-relaxed mb-6">
            Travel itineraries, customized budgets, and places coordination are tied to your personal Google account in Cloud Firestore.
          </p>

          {authError && (
            <div className="mb-4 p-3 bg-[#F9EFEA] border border-[#D96B43]/30 rounded-xl text-xs text-[#D96B43] text-left">
              {authError}
            </div>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={signingIn}
            className="w-full flex items-center justify-center space-x-3 px-5 py-3.5 rounded-2xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white font-semibold text-sm transition-all shadow-sm disabled:opacity-70 cursor-pointer mb-3"
          >
            <div className="bg-white p-1 rounded-lg">
              <GoogleIcon className="w-4 h-4" />
            </div>
            <span>{signingIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#576574] hover:text-[#1A202C] transition-colors pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to overview</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
