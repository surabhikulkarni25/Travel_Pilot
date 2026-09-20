import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Compass,
  Calendar,
  Sparkles,
  MapPin,
  LogOut,
  ChevronDown,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { GoogleIcon } from './GoogleIcon';

export function Navbar() {
  const [location] = useLocation();
  const { user, userProfile, signInWithGoogle, signOutUser, signingIn } = useAuth();
  const { trips, activeTrip } = useTrip();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTripId = activeTrip?.id || (trips.length > 0 ? trips[0].id : null);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E7E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#1D4E4F] flex items-center justify-center text-[#FAF8F5] shadow-xs group-hover:bg-[#153B3C] transition-colors">
                <Compass className="w-5 h-5 transition-transform group-hover:rotate-45" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#1A202C] leading-none">
                  TravelPilot
                </span>
                <span className="font-mono-meta text-[9px] uppercase tracking-wider text-[#576574] mt-0.5">
                  Planning Assistant
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links - shown to authenticated users */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1 pl-4">
                <Link
                  href="/plan"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    location === '/plan'
                      ? 'bg-[#1D4E4F] text-[#FAF8F5]'
                      : 'text-[#1A202C] hover:bg-[#EBF2F1] hover:text-[#1D4E4F]'
                  }`}
                >
                  Plan a Trip
                </Link>

                <Link
                  href="/surprise"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    location === '/surprise'
                      ? 'bg-[#1D4E4F] text-[#FAF8F5]'
                      : 'text-[#1A202C] hover:bg-[#EBF2F1] hover:text-[#1D4E4F]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D96B43]" />
                  <span>Surprise Me</span>
                </Link>

                {/* Show "My Trip" only to authenticated users who have trips */}
                {currentTripId && (
                  <div className="flex items-center space-x-1 pl-1">
                    <Link
                      href={`/trip/${currentTripId}`}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                        location.startsWith('/trip')
                          ? 'bg-[#1D4E4F] text-[#FAF8F5]'
                          : 'text-[#1A202C] hover:bg-[#EBF2F1] hover:text-[#1D4E4F]'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Itinerary</span>
                    </Link>
                    <Link
                      href={`/dashboard/${currentTripId}`}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        location.startsWith('/dashboard')
                          ? 'bg-[#1D4E4F] text-[#FAF8F5]'
                          : 'text-[#1A202C] hover:bg-[#EBF2F1] hover:text-[#1D4E4F]'
                      }`}
                    >
                      Dashboard
                    </Link>
                  </div>
                )}
              </nav>
            )}
          </div>

          {/* Right Area: Auth Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pl-2.5 rounded-full border border-[#E7E2D9] hover:border-[#1D4E4F] bg-white transition-all text-left focus:outline-none"
                  aria-expanded={dropdownOpen}
                >
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-[#1A202C] leading-tight max-w-[130px] truncate">
                      {userProfile?.displayName || user.displayName || 'Traveler'}
                    </span>
                    <span className="font-mono-meta text-[10px] text-[#576574]">
                      {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
                    </span>
                  </div>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-8 h-8 rounded-full object-cover border border-[#E7E2D9]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1D4E4F] text-white flex items-center justify-center font-semibold text-xs">
                      {(user.displayName || user.email || 'T')[0].toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-[#576574]" />
                </button>

                {/* Profile Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-lg border border-[#E7E2D9] py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-3 border-b border-[#E7E2D9]">
                      <p className="text-xs font-mono-meta uppercase tracking-wider text-[#576574]">
                        Authenticated via Google
                      </p>
                      <p className="text-sm font-semibold text-[#1A202C] truncate mt-0.5">
                        {user.displayName || 'Traveler'}
                      </p>
                      <p className="text-xs text-[#576574] truncate">{user.email}</p>
                      <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-[#1D4E4F] bg-[#EBF2F1] px-2 py-0.5 rounded-md font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Cloud Firestore Secured</span>
                      </div>
                    </div>

                    {/* Quick Trip Switcher */}
                    {trips.length > 0 && (
                      <div className="px-4 py-2 border-b border-[#E7E2D9]">
                        <p className="font-mono-meta text-[10px] uppercase text-[#576574] mb-1.5">
                          Saved Trips ({trips.length})
                        </p>
                        <div className="max-h-36 overflow-y-auto space-y-1">
                          {trips.map((t) => (
                            <Link
                              key={t.id}
                              href={`/trip/${t.id}`}
                              onClick={() => setDropdownOpen(false)}
                              className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
                                t.id === currentTripId
                                  ? 'bg-[#EBF2F1] text-[#1D4E4F] font-semibold'
                                  : 'text-[#1A202C] hover:bg-[#F5F2EC]'
                              }`}
                            >
                              <span className="truncate flex items-center space-x-1.5">
                                <MapPin className="w-3 h-3 text-[#D96B43]" />
                                <span>{t.destination}</span>
                              </span>
                              <span className="font-mono-meta text-[10px] text-[#576574]">
                                {t.budgetTier}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-1">
                      <Link
                        href="/plan"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-[#1A202C] hover:bg-[#F5F2EC] rounded-xl transition-colors"
                      >
                        <Compass className="w-4 h-4 text-[#1D4E4F]" />
                        <span>Plan New Trip</span>
                      </Link>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOutUser();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-[#D96B43] hover:bg-[#F9EFEA] rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                disabled={signingIn}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-[#E7E2D9] hover:border-[#1D4E4F] hover:bg-[#FAF8F5] text-sm font-semibold text-[#1A202C] transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>{signingIn ? 'Connecting...' : 'Sign in'}</span>
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center space-x-2">
            {!user && (
              <button
                onClick={signInWithGoogle}
                disabled={signingIn}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E7E2D9] text-xs font-semibold text-[#1A202C]"
              >
                <GoogleIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#1A202C] hover:bg-[#EBF2F1]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E7E2D9] bg-[#FAF8F5] px-4 pt-2 pb-4 space-y-2">
          {user && (
            <div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-[#E7E2D9] mb-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1D4E4F] text-white flex items-center justify-center font-bold">
                  {(user.displayName || 'T')[0].toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-[#1A202C] truncate">{user.displayName || 'Traveler'}</p>
                <p className="text-xs text-[#576574] truncate">{user.email}</p>
              </div>
            </div>
          )}

          <Link
            href="/plan"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-[#1A202C] hover:bg-[#EBF2F1]"
          >
            Plan a Trip
          </Link>
          <Link
            href="/surprise"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-[#1A202C] hover:bg-[#EBF2F1]"
          >
            Surprise Me
          </Link>

          {user && currentTripId && (
            <>
              <Link
                href={`/trip/${currentTripId}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-[#1A202C] hover:bg-[#EBF2F1]"
              >
                Current Itinerary
              </Link>
              <Link
                href={`/dashboard/${currentTripId}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-[#1A202C] hover:bg-[#EBF2F1]"
              >
                Trip Dashboard
              </Link>
            </>
          )}

          {user ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signOutUser();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#D96B43] hover:bg-[#F9EFEA] flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signInWithGoogle();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#1D4E4F] text-white font-semibold text-sm"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Continue with Google</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
