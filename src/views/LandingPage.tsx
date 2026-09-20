import {
  Compass,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon } from '../components/GoogleIcon';

export function LandingPage() {
  const { signInWithGoogle, signingIn, authError } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Clean Marketing Hero */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EBF2F1] text-[#1D4E4F] border border-[#1D4E4F]/15 mb-6">
            <Compass className="w-3.5 h-3.5" />
            <span className="font-mono-meta text-xs uppercase tracking-wider font-semibold">
              TravelPilot • India
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-[#1A202C] tracking-tight leading-[1.08] mb-5">
            Your trip, <br />
            <span className="italic font-normal text-[#1D4E4F]">intelligently</span> planned.
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl font-serif text-[#1A202C] mb-3">
            Plan smarter. Explore India better.
          </p>
          <p className="text-sm sm:text-base text-[#576574] leading-relaxed max-w-xl mx-auto mb-8">
            TravelPilot builds flexible, budget-aware itineraries across India that adapt gracefully when your plans change.
          </p>

          {/* Error banner if any */}
          {authError && (
            <div className="mb-6 p-4 bg-[#F9EFEA] border border-[#D96B43]/30 rounded-2xl text-xs text-[#D96B43] max-w-md mx-auto flex items-center space-x-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              onClick={signInWithGoogle}
              disabled={signingIn}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-7 py-3.5 rounded-2xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white font-semibold text-sm transition-all shadow-sm disabled:opacity-75 cursor-pointer"
            >
              <div className="bg-white p-1 rounded-md">
                <GoogleIcon className="w-3.5 h-3.5" />
              </div>
              <span>{signingIn ? 'Connecting...' : 'Plan a Trip'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={signInWithGoogle}
              disabled={signingIn}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FAF8F5] text-[#1A202C] border border-[#E7E2D9] font-semibold text-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D96B43]" />
              <span>Surprise Me</span>
            </button>
          </div>

          <p className="mt-4 text-xs font-mono-meta text-[#576574]">
            Sign in with Google to save your plans • India-first destinations • Calibrated in INR (₹)
          </p>
        </div>
      </section>

      {/* How TravelPilot Helps - 4 Key Principles */}
      <section className="py-16 bg-[#F5F2EC] border-y border-[#E7E2D9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="font-mono-meta text-xs uppercase tracking-widest text-[#1D4E4F] font-semibold">
              Core Principles
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#1A202C] mt-1.5">
              How TravelPilot helps you travel better
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Personalized */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E2D9] shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center mb-3">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1A202C] mb-1">
                Personalized
              </h3>
              <p className="text-xs text-[#576574] leading-relaxed">
                Plans shaped directly around your pace, travel party size, and cultural interests.
              </p>
            </div>

            {/* Budget-aware */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E2D9] shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9] text-[#1D4E4F] flex items-center justify-center mb-3 font-serif font-bold text-sm">
                ₹
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1A202C] mb-1">
                Budget-Aware
              </h3>
              <p className="text-xs text-[#576574] leading-relaxed">
                Treats your spending limit as a hard constraint with transparent rupee estimates.
              </p>
            </div>

            {/* Flexible */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E2D9] shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9] text-[#1D4E4F] flex items-center justify-center mb-3">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1A202C] mb-1">
                Flexible
              </h3>
              <p className="text-xs text-[#576574] leading-relaxed">
                Morning, afternoon, and evening recommendations with durations, not rigid minute-by-minute timetables.
              </p>
            </div>

            {/* Disruption-ready */}
            <div className="bg-white rounded-2xl p-5 border border-[#E7E2D9] shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-[#F9EFEA] text-[#D96B43] flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1A202C] mb-1">
                Disruption-Ready
              </h3>
              <p className="text-xs text-[#576574] leading-relaxed">
                Swap places or adapt effortlessly when crowds, weather, or plans shift on the ground.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Itinerary Preview (No rigid timestamps) */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="font-mono-meta text-xs uppercase tracking-widest text-[#576574]">
              Sample Preview
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A202C] mt-1">
              What an itinerary looks like
            </h3>
            <p className="text-xs text-[#576574] mt-1">
              Balanced flow, duration estimates, and Google Maps location details.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E7E2D9] shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-[#E7E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#1D4E4F] font-semibold">
                  Day 1 • Jaipur, Rajasthan
                </span>
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#1A202C] mt-0.5">
                  Arrival & Amer Ridge Fortresses
                </h4>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono-meta">
                <span className="bg-white px-2.5 py-1 rounded-lg border border-[#E7E2D9] text-[#1A202C]">
                  3 Stops
                </span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-[#E7E2D9] text-[#1D4E4F] font-semibold">
                  Est. ₹900
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {/* Morning */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono-meta text-[11px] uppercase tracking-wider font-semibold text-[#1D4E4F]">
                    Morning
                  </span>
                  <span className="text-[11px] font-mono-meta text-[#576574]">
                    Recommended: ~2.5 hours
                  </span>
                </div>
                <h5 className="font-serif text-lg font-bold text-[#1A202C]">
                  Amber Palace & Fortress
                </h5>
                <p className="text-xs text-[#576574] mt-1">
                  Hilltop citadel featuring red sandstone, Maota Lake views, and the mirror-inlaid Sheesh Mahal.
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono-meta text-[#576574]">
                  <span>Best visited: Morning • Opening: 08:00 - 17:30</span>
                  <span className="text-[#1D4E4F] font-semibold">Est. ₹500</span>
                </div>
              </div>

              {/* Afternoon */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono-meta text-[11px] uppercase tracking-wider font-semibold text-[#1D4E4F]">
                    Afternoon
                  </span>
                  <span className="text-[11px] font-mono-meta text-[#576574]">
                    Recommended: ~1 hour
                  </span>
                </div>
                <h5 className="font-serif text-lg font-bold text-[#1A202C]">
                  Panna Meena Ka Kund Stepwell
                </h5>
                <p className="text-xs text-[#576574] mt-1">
                  Geometric 16th-century stepwell renowned for its symmetrical criss-cross stair patterns.
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono-meta text-[#576574]">
                  <span>Best visited: Afternoon</span>
                  <span className="text-[#1D4E4F] font-semibold">Est. ₹150</span>
                </div>
              </div>

              {/* Evening */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono-meta text-[11px] uppercase tracking-wider font-semibold text-[#1D4E4F]">
                    Evening
                  </span>
                  <span className="text-[11px] font-mono-meta text-[#576574]">
                    Recommended: ~2 hours
                  </span>
                </div>
                <h5 className="font-serif text-lg font-bold text-[#1A202C]">
                  Nahargarh Fort Sunset Ridge
                </h5>
                <p className="text-xs text-[#576574] mt-1">
                  Perched on the Aravalli hills, offering sweeping golden-hour vistas over the entire Pink City.
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono-meta text-[#576574]">
                  <span>Best visited: Evening</span>
                  <span className="text-[#1D4E4F] font-semibold">Est. ₹250</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#FAF8F5] border-t border-[#E7E2D9] text-center">
              <button
                onClick={signInWithGoogle}
                disabled={signingIn}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Sign in with Google to create your itinerary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

