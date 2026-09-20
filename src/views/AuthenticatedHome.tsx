import { Link } from 'wouter';
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  ArrowRight,
  Plus,
  Clock,
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { formatINR } from '../utils/currency';
import { calculateCalendarDays, formatDateRange } from '../utils/date';
import { calculateTripBudget } from '../utils/budget';

export function AuthenticatedHome() {
  const { user, userProfile } = useAuth();
  const { trips, activeTrip } = useTrip();

  const displayName = userProfile?.displayName || user?.displayName || 'Traveler';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Welcome Header */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#E7E2D9]">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EBF2F1] text-[#1D4E4F] text-xs font-mono-meta uppercase tracking-wider mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>TravelPilot Planning Hub</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1A202C] tracking-tight">
            Where in India are you going?
          </h1>
          <p className="text-base text-[#576574] mt-2">
            Welcome back, <span className="font-semibold text-[#1A202C]">{displayName}</span>. Create a new tailored itinerary, get inspired with spontaneous journeys, or manage your saved trips.
          </p>
        </div>

        <Link
          href="/plan"
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white font-semibold text-sm transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Plan a New Trip</span>
        </Link>
      </div>

      {/* Main 3 Action Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Action 1: Plan a Trip */}
        <Link
          href="/plan"
          className="bg-white rounded-3xl p-7 border border-[#E7E2D9] hover:border-[#1D4E4F] shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#1D4E4F] font-semibold">
              Action 1
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#1A202C] mt-1 mb-2">
              Plan a Trip
            </h2>
            <p className="text-sm text-[#576574] leading-relaxed">
              Create a personalized day-by-day trip across India from scratch with custom dates, party size, and target rupee budget.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E7E2D9] flex items-center justify-between text-xs font-semibold text-[#1D4E4F]">
            <span>Start custom plan</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Action 2: Surprise Me */}
        <Link
          href="/surprise"
          className="bg-white rounded-3xl p-7 border border-[#E7E2D9] hover:border-[#1D4E4F] shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#F9EFEA] text-[#D96B43] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#D96B43] font-semibold">
              Action 2
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#1A202C] mt-1 mb-2">
              Surprise Me
            </h2>
            <p className="text-sm text-[#576574] leading-relaxed">
              Explore 8 distinct travel concepts — from Royal Rajasthan to Coastal Escapes — tailored within your budget and duration constraints.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E7E2D9] flex items-center justify-between text-xs font-semibold text-[#D96B43]">
            <span>Discover ideas</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Action 3: My Trips */}
        <div className="bg-white rounded-3xl p-7 border border-[#E7E2D9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] text-[#1A202C] flex items-center justify-center mb-5">
              <Calendar className="w-6 h-6 text-[#1D4E4F]" />
            </div>
            <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#576574] font-semibold">
              Action 3
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#1A202C] mt-1 mb-2">
              My Trips
            </h2>
            <p className="text-sm text-[#576574] leading-relaxed">
              {trips.length > 0
                ? `You have ${trips.length} saved itinerary plan${trips.length === 1 ? '' : 's'} stored securely in Cloud Firestore.`
                : 'Access previously created, saved, or active travel itineraries at any time.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E7E2D9]">
            {trips.length > 0 ? (
              <Link
                href={`/trip/${trips[0].id}`}
                className="w-full flex items-center justify-between text-xs font-semibold text-[#1D4E4F] hover:underline"
              >
                <span>View latest: {trips[0].destination}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="text-xs text-[#576574] font-mono-meta">
                No trips yet — start by planning above!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Saved / Active Trips Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E2D9] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E2D9] mb-6">
          <div className="flex items-center space-x-2.5">
            <Calendar className="w-5 h-5 text-[#1D4E4F]" />
            <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
              Your Saved Trips
            </h3>
          </div>
          <span className="font-mono-meta text-xs uppercase tracking-wider text-[#576574]">
            {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'} recorded
          </span>
        </div>

        {trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map((trip) => {
              const tripDuration = calculateCalendarDays(trip.startDate, trip.endDate);
              const dateRange = formatDateRange(trip.startDate, trip.endDate);
              const stopCount = trip.days?.reduce((acc, d) => acc + d.items.length, 0) || 0;
              const tripBudget = calculateTripBudget(trip);
              const plannedCost = tripBudget.totalPlannedSpend;

              return (
                <div
                  key={trip.id}
                  className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] hover:border-[#1D4E4F] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-[#D96B43] shrink-0" />
                        <h4 className="font-serif text-xl font-bold text-[#1A202C]">
                          {trip.destination}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {trip.conceptTitle && (
                          <span className="font-mono-meta text-[10px] uppercase px-2 py-0.5 rounded bg-[#EBF2F1] text-[#1D4E4F] font-semibold">
                            {trip.conceptTitle}
                          </span>
                        )}
                        <span className="font-mono-meta text-[10px] uppercase px-2 py-0.5 rounded bg-white border border-[#E7E2D9] text-[#1D4E4F]">
                          {trip.budgetTier}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#576574] font-mono-meta mb-3">
                      {dateRange} • {tripDuration} {tripDuration === 1 ? 'day' : 'days'} • {trip.travelerCount} {trip.groupType}
                    </p>

                    <div className="flex items-center space-x-3 text-xs font-mono-meta text-[#1A202C]">
                      <span>Planned: <strong className="text-[#1D4E4F]">{formatINR(plannedCost)}</strong> / {formatINR(trip.budgetAmount)}</span>
                      <span>•</span>
                      <span>{stopCount} stops</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E7E2D9] flex items-center justify-between">
                    <Link
                      href={`/dashboard/${trip.id}`}
                      className="text-xs font-medium text-[#576574] hover:text-[#1A202C]"
                    >
                      Trip Dashboard
                    </Link>

                    <Link
                      href={`/trip/${trip.id}`}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold transition-colors"
                    >
                      <span>Open Itinerary</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center mx-auto mb-3">
              <Compass className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-xl font-bold text-[#1A202C] mb-1">
              No itineraries planned yet
            </h4>
            <p className="text-sm text-[#576574] max-w-md mx-auto mb-6">
              Pick a destination like Mumbai, Goa, Jaipur, or Bengaluru and TravelPilot will formulate a cohesive day-by-day plan.
            </p>
            <Link
              href="/plan"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-[#1D4E4F] text-white font-semibold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Trip</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
