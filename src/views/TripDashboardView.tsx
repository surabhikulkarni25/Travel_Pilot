import { useState, useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import {
  Compass,
  ArrowLeft,
  Calendar,
  Users,
  Activity,
  MapPin,
  Clock,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Share2
} from 'lucide-react';
import { useTrip } from '../contexts/TripContext';
import { formatINR } from '../utils/currency';
import { calculateTripBudget } from '../utils/budget';
import { calculateCalendarDays, formatDateRange } from '../utils/date';
import { AccommodationSummaryCard } from '../components/AccommodationSummaryCard';
import { ShareTripModal } from '../components/ShareTripModal';
import type { Trip, TripAccommodation } from '../types';

export function TripDashboardView() {
  const [, params] = useRoute('/dashboard/:tripId');
  const [, setLocation] = useLocation();
  const tripId = params?.tripId;

  const { fetchTrip, activeTrip, deleteTrip, trips, updateTripAccommodation } = useTrip();
  const [trip, setTrip] = useState<Trip | null>(activeTrip?.id === tripId ? activeTrip : null);
  const [loading, setLoading] = useState<boolean>(!trip);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);

  const handleUpdateAccommodation = async (newAccommodation: TripAccommodation) => {
    if (!tripId) return;
    try {
      await updateTripAccommodation(tripId, newAccommodation);
      setTrip((prev) => (prev ? { ...prev, accommodation: newAccommodation } : null));
      setFeedbackMessage('Accommodation preferences updated successfully.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.error('Failed to update accommodation:', err);
    }
  };

  useEffect(() => {
    if (tripId && !isDeleted) {
      if (activeTrip?.id === tripId) {
        setTrip(activeTrip);
        setLoading(false);
      } else {
        setLoading(true);
        fetchTrip(tripId).then((loaded) => {
          if (!isDeleted) {
            setTrip(loaded);
            setLoading(false);
          }
        });
      }
    }
  }, [tripId, activeTrip, fetchTrip, isDeleted]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center mb-3 animate-pulse">
          <Compass className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-mono-meta text-xs uppercase text-[#576574]">Loading trip dashboard...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 border border-[#E7E2D9]">
          <h2 className="font-serif text-3xl font-bold text-[#1A202C] mb-2">Trip Not Found</h2>
          <p className="text-sm text-[#576574] mb-6">This itinerary does not exist or belongs to another account.</p>
          <Link
            href="/plan"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#1D4E4F] text-white text-xs font-semibold"
          >
            <span>Plan a Trip</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleConfirmDelete = async () => {
    if (!trip) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      setIsDeleted(true);
      const remainingTrips = await deleteTrip(trip.id);
      setShowDeleteModal(false);

      // Redirect immediately to remaining trip or home
      if (remainingTrips.length > 0) {
        setLocation(`/dashboard/${remainingTrips[0].id}`);
      } else {
        setLocation('/');
      }
    } catch (err) {
      console.error('Failed to delete trip:', err);
      setIsDeleted(false);
      setDeleteError(
        err instanceof Error ? err.message : 'Unable to delete trip. Please try again.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const totalDays = calculateCalendarDays(trip.startDate, trip.endDate);
  const dateRangeDisplay = formatDateRange(trip.startDate, trip.endDate);

  const totalActivities = trip.days?.reduce((acc, d) => acc + d.items.length, 0) || 0;
  const budget = calculateTripBudget(trip);
  const plannedSpend = budget.totalPlannedSpend;
  const remainingBudget = budget.remainingBudget;
  const isBudgetExceeded = budget.isBudgetExceeded;
  const isBudgetTight = budget.isBudgetTight;
  const dailyAverageSpend = budget.dailyAverageSpend;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Subtle feedback banner */}
      {feedbackMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-[#EBF2F1] border border-[#1D4E4F]/20 text-[#1D4E4F] text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E2D9] shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E7E2D9]">
          <div>
            <Link
              href={`/trip/${trip.id}`}
              className="inline-flex items-center space-x-1.5 text-xs font-mono-meta text-[#576574] hover:text-[#1D4E4F] transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Daily Itinerary</span>
            </Link>
            <div className="flex items-center space-x-2.5">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A202C]">
                {trip.destination}
              </h1>
              {trip.conceptTitle && (
                <span className="px-3 py-1 rounded-full text-xs font-mono-meta bg-[#EBF2F1] text-[#1D4E4F] font-semibold">
                  {trip.conceptTitle}
                </span>
              )}
            </div>
            <p className="text-xs font-mono-meta text-[#576574] mt-1.5 flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dateRangeDisplay} ({totalDays} {totalDays === 1 ? 'day' : 'days'})</span>
              <span>•</span>
              <span className="capitalize">{trip.travelerCount} {trip.groupType}</span>
              <span>•</span>
              <span className="capitalize">{trip.pace} Pace</span>
            </p>
          </div>

          {/* Action buttons: prominent primary, subtle secondary delete */}
          <div className="flex items-center space-x-3 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-[#EBF2F1] hover:bg-[#d9e8e6] border border-[#1D4E4F]/20 text-xs font-semibold text-[#1D4E4F] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#1D4E4F]" />
              <span>Share Trip</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#576574] hover:text-[#D96B43] hover:bg-[#F9EFEA] transition-colors border border-transparent hover:border-[#D96B43]/20 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete trip</span>
            </button>

            <Link
              href={`/trip/${trip.id}`}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Open Daily Itinerary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Primary Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          {/* Target Budget */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]">
            <span className="font-mono-meta text-[10px] uppercase text-[#576574] block mb-1">
              Target Budget
            </span>
            <div className="font-serif text-2xl font-bold text-[#1A202C]">
              {formatINR(trip.budgetAmount)}
            </div>
            <span className="text-[11px] font-mono-meta text-[#1D4E4F] uppercase font-semibold">
              {trip.budgetTier} Tier
            </span>
          </div>

          {/* Planned Spend */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]">
            <span className="font-mono-meta text-[10px] uppercase text-[#576574] block mb-1">
              Planned Spend
            </span>
            <div className="font-serif text-2xl font-bold text-[#1D4E4F]">
              {formatINR(plannedSpend)}
            </div>
            <span className="text-[11px] font-mono-meta text-[#576574]">
              ~{formatINR(dailyAverageSpend)} / day
            </span>
          </div>

          {/* Remaining Budget */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]">
            <span className="font-mono-meta text-[10px] uppercase text-[#576574] block mb-1">
              Remaining Budget
            </span>
            <div className={`font-serif text-2xl font-bold ${isBudgetExceeded ? 'text-[#D96B43]' : 'text-[#1A202C]'}`}>
              {formatINR(Math.max(0, remainingBudget))}
            </div>
            <span
              className={`text-[11px] font-mono-meta font-medium ${
                isBudgetExceeded
                  ? 'text-[#D96B43]'
                  : isBudgetTight
                  ? 'text-[#D96B43]'
                  : 'text-[#1D4E4F]'
              }`}
            >
              {isBudgetExceeded
                ? 'Exceeds target'
                : isBudgetTight
                ? 'Approaching limit'
                : 'Within budget'}
            </span>
          </div>

          {/* Total Stops */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]">
            <span className="font-mono-meta text-[10px] uppercase text-[#576574] block mb-1">
              Total Stops
            </span>
            <div className="font-serif text-2xl font-bold text-[#1A202C]">
              {totalActivities}
            </div>
            <span className="text-[11px] font-mono-meta text-[#576574]">
              Across {totalDays} {totalDays === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      </div>

      {/* Outstation Accommodation Section */}
      <div className="mb-8">
        <AccommodationSummaryCard
          trip={trip}
          onUpdateAccommodation={handleUpdateAccommodation}
        />
      </div>

      {/* Budget Breakdown and Logistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Estimated Budget Status Bar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E2D9] shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#E7E2D9]">
            <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
              Budget Utilization
            </h3>
            <span className="font-mono-meta text-xs text-[#1D4E4F] font-semibold">
              {Math.min(100, Math.round((plannedSpend / (trip.budgetAmount || 1)) * 100))}% Allocated
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs font-mono-meta text-[#576574] mb-2">
              <span>Planned: {formatINR(plannedSpend)}</span>
              <span>Target: {formatINR(trip.budgetAmount)}</span>
            </div>
            <div className="w-full bg-[#E7E2D9] h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isBudgetExceeded ? 'bg-[#D96B43]' : 'bg-[#1D4E4F]'
                }`}
                style={{
                  width: `${Math.min(100, (plannedSpend / (trip.budgetAmount || 1)) * 100)}%`
                }}
              />
            </div>
          </div>

          {/* Estimated Category Allocation */}
          <div className="mt-6 space-y-3.5">
            {budget.accommodationCost > 0 ? (
              <>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#1A202C] mb-1">
                    <span>Accommodation & Hotel Stay</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[#576574] text-[11px]">
                        {plannedSpend > 0 ? Math.round((budget.accommodationCost / plannedSpend) * 100) : 0}%
                      </span>
                      <span>{formatINR(budget.accommodationCost)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#E7E2D9] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1D4E4F] h-full transition-all"
                      style={{
                        width: `${plannedSpend > 0 ? Math.min(100, Math.round((budget.accommodationCost / plannedSpend) * 100)) : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#1A202C] mb-1">
                    <span>Sightseeing & Activities</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[#576574] text-[11px]">
                        {plannedSpend > 0 ? Math.round((budget.activitiesCost / plannedSpend) * 100) : 0}%
                      </span>
                      <span>{formatINR(budget.activitiesCost)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#E7E2D9] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2D6667] h-full transition-all"
                      style={{
                        width: `${plannedSpend > 0 ? Math.min(100, Math.round((budget.activitiesCost / plannedSpend) * 100)) : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#1A202C] mb-1">
                    <span>Estimated Dining & Local Transit</span>
                    <span>{formatINR(Math.max(0, trip.budgetAmount - plannedSpend))} buffer</span>
                  </div>
                  <div className="w-full bg-[#E7E2D9] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#576574] h-full w-[15%]" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#1A202C] mb-1">
                    <span>Sightseeing & Activities</span>
                    <span>{formatINR(budget.activitiesCost || Math.round(plannedSpend * 0.45))}</span>
                  </div>
                  <div className="w-full bg-[#E7E2D9] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#1D4E4F] h-full w-[45%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#1A202C] mb-1">
                    <span>Food & Authentic Dining</span>
                    <span>{formatINR(Math.round(plannedSpend * 0.35))}</span>
                  </div>
                  <div className="w-full bg-[#E7E2D9] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#2D6667] h-full w-[35%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#1A202C] mb-1">
                    <span>Local Transport & Taxis</span>
                    <span>{formatINR(Math.round(plannedSpend * 0.2))}</span>
                  </div>
                  <div className="w-full bg-[#E7E2D9] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#576574] h-full w-[20%]" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Selected Interests & Profile */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E2D9] shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#E7E2D9]">
            <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
              Trip Profile
            </h3>
            <span className="font-mono-meta text-xs uppercase px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E7E2D9] text-[#1D4E4F] font-medium">
              {trip.destinationType === 'outstation' ? 'Outside City' : 'Within City'}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <span className="font-mono-meta text-xs uppercase text-[#576574] block mb-2">
                Travel Themes
              </span>
              <div className="flex flex-wrap gap-2">
                {trip.interests && trip.interests.length > 0 ? (
                  trip.interests.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs bg-[#EBF2F1] text-[#1D4E4F] font-semibold"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#576574]">General cultural discovery</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E7E2D9]">
              <span className="font-mono-meta text-xs uppercase text-[#576574] block mb-1">
                Activity & Physical Pacing
              </span>
              <p className="text-xs text-[#1A202C]">
                Calibrated for <strong className="capitalize">{trip.activityLevel}</strong> walking intensity with {trip.pace} pacing.
              </p>
            </div>

            <div className="pt-3 border-t border-[#E7E2D9]">
              <span className="font-mono-meta text-xs uppercase text-[#576574] block mb-1">
                Navigation & Maps
              </span>
              <p className="text-xs text-[#576574]">
                All destination stops in your daily itinerary include direct Google Maps directions and location links.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* In-App Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E7E2D9] shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]">
              <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
                Delete this trip?
              </h3>
              <button
                onClick={() => {
                  if (!deleting) {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }
                }}
                disabled={deleting}
                className="text-[#576574] hover:text-[#1A202C] text-sm font-bold disabled:opacity-40 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#576574] mt-3 leading-relaxed">
              This will permanently remove your itinerary for{' '}
              <strong className="text-[#1A202C]">{trip.destination}</strong> from Cloud Firestore.
              This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mt-3 p-3 rounded-xl bg-[#F9EFEA] border border-[#D96B43]/20 text-[#D96B43] text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#576574] hover:bg-[#FAF8F5] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-[#D96B43] hover:bg-[#B85530] text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete Trip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Trip Modal */}
      {trip && (
        <ShareTripModal
          trip={trip}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          onTripUpdated={(updated) => setTrip(updated)}
        />
      )}
    </div>
  );
}
