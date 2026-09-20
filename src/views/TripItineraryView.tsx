import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import {
  Calendar,
  Clock,
  MapPin,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Compass,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  ExternalLink,
  CheckCircle2,
  Check,
  SkipForward,
  RefreshCw,
  AlertCircle,
  Navigation,
  Building,
  Globe,
  Share2
} from 'lucide-react';
import { useTrip } from '../contexts/TripContext';
import { formatINR } from '../utils/currency';
import { calculateTripBudget } from '../utils/budget';
import { calculateCalendarDays, formatDateRange, formatDayDisplayDate } from '../utils/date';
import { ItineraryReplacer } from '../components/ItineraryReplacer';
import { ItineraryEngineBar } from '../components/ItineraryEngineBar';
import { TripAssistantPanel } from '../components/TripAssistantPanel';
import { AccommodationSummaryCard } from '../components/AccommodationSummaryCard';
import { ShareTripModal } from '../components/ShareTripModal';
import {
  resolveLocalOrigin,
  buildUberLink,
  buildOlaLink,
  buildRapidoLink,
  buildGoogleMapsDirectionsLink
} from '../services/transportService';
import type { Trip, ItineraryItem, TripAccommodation } from '../types';

function GettingThereRow({
  trip,
  currentDay,
  item
}: {
  trip: Trip;
  currentDay: { dayIndex: number; items: ItineraryItem[] };
  item: ItineraryItem;
}) {
  const origin = resolveLocalOrigin(trip, currentDay as any, item);
  if (!origin || !item.title) return null;
  const destination = { lat: item.latitude, lng: item.longitude, name: item.title };

  return (
    <div className="mt-3 pt-2.5 border-t border-[#E7E2D9]/60">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-[#576574] mr-1">Getting there</span>
        <a
          href={buildUberLink(origin, destination)}
          target="_blank"
          rel="noopener noreferrer"
          title={`Ride with Uber from ${origin.name} to ${destination.name}`}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-[#E7E2D9] hover:border-[#1D4E4F] hover:bg-[#FAF8F5] text-[#1A202C] transition-colors"
        >
          Uber
        </a>
        <a
          href={buildOlaLink()}
          target="_blank"
          rel="noopener noreferrer"
          title="Open Ola Cabs"
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-[#E7E2D9] hover:border-[#1D4E4F] hover:bg-[#FAF8F5] text-[#1A202C] transition-colors"
        >
          Ola
        </a>
        <a
          href={buildRapidoLink()}
          target="_blank"
          rel="noopener noreferrer"
          title="Open Rapido"
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-[#E7E2D9] hover:border-[#1D4E4F] hover:bg-[#FAF8F5] text-[#1A202C] transition-colors"
        >
          Rapido
        </a>
        <a
          href={buildGoogleMapsDirectionsLink(origin, destination)}
          target="_blank"
          rel="noopener noreferrer"
          title={`Directions from ${origin.name} to ${destination.name}`}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-[#E7E2D9] hover:border-[#1D4E4F] hover:bg-[#FAF8F5] text-[#1A202C] transition-colors"
        >
          Maps
        </a>
        <span className="text-[10px] text-[#576574] ml-1">
          from <strong className="font-medium text-[#1A202C]">{origin.name}</strong>
        </span>
      </div>
    </div>
  );
}

export function TripItineraryView() {
  const [, params] = useRoute('/trip/:tripId');
  const tripId = params?.tripId;

  const {
    fetchTrip,
    activeTrip,
    rejectItineraryItem,
    swapItineraryItem,
    toggleItemVisited,
    toggleItemSkipped,
    autoRepairTrip,
    markItemUnavailable,
    updateTripAccommodation
  } = useTrip();
  const [trip, setTrip] = useState<Trip | null>(activeTrip?.id === tripId ? activeTrip : null);
  const [loading, setLoading] = useState<boolean>(!trip);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1);
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);

  const handleUpdateAccommodation = async (newAccommodation: TripAccommodation) => {
    if (!tripId) return;
    try {
      await updateTripAccommodation(tripId, newAccommodation);
      setTrip((prev) => (prev ? { ...prev, accommodation: newAccommodation } : null));
    } catch (err) {
      console.error('Failed to update accommodation:', err);
    }
  };

  // Reject / Swap Modal State
  const [rejectingItem, setRejectingItem] = useState<ItineraryItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Too far away / excessive transit distance');
  const [customReason, setCustomReason] = useState<string>('');
  const [savingRejection, setSavingRejection] = useState<boolean>(false);
  const [activeReplacerItemId, setActiveReplacerItemId] = useState<string | null>(null);

  const handleTriggerAutoRepair = async () => {
    if (!tripId) return;
    setIsRepairing(true);
    try {
      await autoRepairTrip(tripId);
      const reloaded = await fetchTrip(tripId);
      if (reloaded) setTrip(reloaded);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleSimulateClosure = async (item: ItineraryItem) => {
    if (!tripId) return;
    try {
      await markItemUnavailable(tripId, item.id);
      const reloaded = await fetchTrip(tripId);
      if (reloaded) {
        setTrip(reloaded);
      }
      setActiveReplacerItemId(item.id);
    } catch (err) {
      console.error('Error simulating closure:', err);
    }
  };

  useEffect(() => {
    if (tripId) {
      if (activeTrip?.id === tripId) {
        setTrip(activeTrip);
        setLoading(false);
      } else {
        setLoading(true);
        fetchTrip(tripId).then((loaded) => {
          setTrip(loaded);
          setLoading(false);
        });
      }
    }
  }, [tripId, activeTrip, fetchTrip]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center mb-3 animate-pulse">
          <Compass className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-mono-meta text-xs uppercase text-[#576574]">Loading trip itinerary...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 border border-[#E7E2D9]">
          <h2 className="font-serif text-3xl font-bold text-[#1A202C] mb-2">Trip Not Found</h2>
          <p className="text-sm text-[#576574] mb-6">This itinerary does not exist or belongs to another user account.</p>
          <Link
            href="/plan"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#1D4E4F] text-white text-xs font-semibold"
          >
            <span>Plan a New Trip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const days = trip.days || [];
  const currentDay = days.find((d) => d.dayIndex === selectedDayIndex) || days[0];

  const totalDays = calculateCalendarDays(trip.startDate, trip.endDate);
  const dateRangeDisplay = formatDateRange(trip.startDate, trip.endDate);

  // Budget calculations (centralized single source of truth)
  const tripBudget = calculateTripBudget(trip);
  const plannedSpend = tripBudget.totalPlannedSpend;
  const remainingBudget = tripBudget.remainingBudget;
  const isBudgetExceeded = tripBudget.isBudgetExceeded;
  const isBudgetTight = tripBudget.isBudgetTight;

  const handleConfirmReject = async () => {
    if (!rejectingItem || !tripId) return;
    setSavingRejection(true);
    const finalReason = customReason.trim() ? `${rejectReason}: ${customReason}` : rejectReason;
    try {
      await rejectItineraryItem(tripId, rejectingItem.id, finalReason);
      setTrip((prev) => {
        if (!prev || !prev.days) return prev;
        return {
          ...prev,
          days: prev.days.map((day) => ({
            ...day,
            items: day.items.map((item) =>
              item.id === rejectingItem.id
                ? { ...item, isRejected: true, rejectionReason: finalReason }
                : item
            )
          }))
        };
      });
      const rejectedId = rejectingItem.id;
      setRejectingItem(null);
      setCustomReason('');
      setActiveReplacerItemId(rejectedId);
    } catch (err) {
      console.error('Error rejecting item:', err);
    } finally {
      setSavingRejection(false);
    }
  };

  const handleSwapItem = async (itemId: string, newItemData: Partial<ItineraryItem>) => {
    if (!tripId) return;
    try {
      await swapItineraryItem(tripId, itemId, newItemData);
      setTrip((prev) => {
        if (!prev || !prev.days) return prev;
        return {
          ...prev,
          days: prev.days.map((day) => ({
            ...day,
            items: day.items.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    ...newItemData,
                    status: 'active',
                    isVisited: false,
                    isSkipped: false,
                    isRejected: false,
                    rejectionReason: undefined,
                    isOverBudget: false,
                    alternativeSuggestion: undefined
                  }
                : i
            )
          }))
        };
      });
      setActiveReplacerItemId(null);
    } catch (err) {
      console.error('Error performing swap:', err);
      throw err;
    }
  };

  const handleToggleVisited = async (item: ItineraryItem) => {
    if (!tripId) return;
    const nextVisited = !item.isVisited;
    try {
      setTrip((prev) => {
        if (!prev || !prev.days) return prev;
        return {
          ...prev,
          days: prev.days.map((day) => ({
            ...day,
            items: day.items.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    isVisited: nextVisited,
                    isSkipped: nextVisited ? false : i.isSkipped,
                    status: nextVisited ? ('completed' as const) : ('active' as const)
                  }
                : i
            )
          }))
        };
      });
      await toggleItemVisited(tripId, item.id, nextVisited);
    } catch (err) {
      console.error('Failed to toggle visited state:', err);
    }
  };

  const handleToggleSkipped = async (item: ItineraryItem) => {
    if (!tripId) return;
    const nextSkipped = !item.isSkipped;
    try {
      setTrip((prev) => {
        if (!prev || !prev.days) return prev;
        return {
          ...prev,
          days: prev.days.map((day) => ({
            ...day,
            items: day.items.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    isSkipped: nextSkipped,
                    isVisited: nextSkipped ? false : i.isVisited,
                    status: nextSkipped ? ('skipped' as const) : ('active' as const)
                  }
                : i
            )
          }))
        };
      });
      await toggleItemSkipped(tripId, item.id, nextSkipped);
    } catch (err) {
      console.error('Failed to toggle skipped state:', err);
    }
  };

  const handleDirectSwap = async (item: ItineraryItem) => {
    if (!item.alternativeSuggestion) return;
    const alt = item.alternativeSuggestion;
    await handleSwapItem(item.id, {
      title: alt.title,
      description: alt.description,
      location: alt.location,
      estimatedCost: alt.estimatedCost,
      category: alt.category || item.category
    });
  };

  const formatDurationText = (minutes: number) => {
    if (minutes >= 60) {
      const hrs = (minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1);
      return `~${hrs} hours`;
    }
    return `~${minutes} min`;
  };

  const getMapsUrl = (title: string, location: string, lat?: number, lng?: number) => {
    if (lat !== undefined && lng !== undefined) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title}, ${location}`)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E2D9] shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-[#E7E2D9]">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-mono-meta text-xs uppercase tracking-wider text-[#1D4E4F] font-semibold">
                Personalized Itinerary
              </span>
              {trip.conceptTitle && (
                <>
                  <span className="text-[#576574]">•</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#EBF2F1] text-[#1D4E4F] font-mono-meta text-xs font-semibold">
                    {trip.conceptTitle}
                  </span>
                </>
              )}
              {trip.scope === 'near-me' && (
                <>
                  <span className="text-[#576574]">•</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#EBF2F1] text-[#1D4E4F] font-mono-meta text-xs font-semibold inline-flex items-center space-x-1">
                    <Navigation className="w-3 h-3" />
                    <span>Near You</span>
                  </span>
                </>
              )}
              {trip.scope === 'my-city' && (
                <>
                  <span className="text-[#576574]">•</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#1A202C] border border-[#E7E2D9] font-mono-meta text-xs font-semibold inline-flex items-center space-x-1">
                    <Building className="w-3 h-3" />
                    <span>City Discovery</span>
                  </span>
                </>
              )}
              {trip.scope === 'india' && (
                <>
                  <span className="text-[#576574]">•</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#D96B43] border border-[#D96B43]/20 font-mono-meta text-xs font-semibold inline-flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>Anywhere in India</span>
                  </span>
                </>
              )}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1A202C] tracking-tight">
              {trip.destination}
            </h1>
            <p className="text-xs font-mono-meta text-[#576574] mt-1.5 flex flex-wrap items-center gap-2">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{dateRangeDisplay} ({totalDays} {totalDays === 1 ? 'day' : 'days'})</span>
              </span>
              <span>•</span>
              <span className="capitalize">{trip.travelerCount} {trip.groupType} travelers</span>
              <span>•</span>
              <span className="capitalize">{trip.pace} Pace</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#EBF2F1] hover:bg-[#d9e8e6] border border-[#1D4E4F]/20 text-xs font-semibold text-[#1D4E4F] transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#1D4E4F]" />
              <span>Share Trip</span>
            </button>
            <Link
              href={`/dashboard/${trip.id}`}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-[#E7E2D9] hover:bg-[#FAF8F5] text-xs font-semibold text-[#1A202C] transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#1D4E4F]" />
              <span>Trip Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Budget Status Overview Banner */}
        <div className="pt-5 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-6 text-xs font-mono-meta">
            <div>
              <span className="text-[#576574] uppercase text-[10px] block">Target Budget</span>
              <strong className="text-sm font-serif font-bold text-[#1A202C]">{formatINR(trip.budgetAmount)}</strong>
            </div>
            <div className="h-6 w-px bg-[#E7E2D9]" />
            <div>
              <span className="text-[#576574] uppercase text-[10px] block">Planned Spend</span>
              <div className="flex items-baseline space-x-1.5">
                <strong className="text-sm font-serif font-bold text-[#1D4E4F]">{formatINR(plannedSpend)}</strong>
                {tripBudget.accommodationCost > 0 && (
                  <span className="text-[10px] text-[#576574] hidden sm:inline">
                    (incl. {formatINR(tripBudget.accommodationCost)} stay)
                  </span>
                )}
              </div>
            </div>
            <div className="h-6 w-px bg-[#E7E2D9]" />
            <div>
              <span className="text-[#576574] uppercase text-[10px] block">Remaining</span>
              <strong className={`text-sm font-serif font-bold ${isBudgetExceeded ? 'text-[#D96B43]' : 'text-[#1A202C]'}`}>
                {formatINR(Math.max(0, remainingBudget))}
              </strong>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono-meta font-semibold ${
                isBudgetExceeded
                  ? 'bg-[#F9EFEA] text-[#D96B43]'
                  : isBudgetTight
                  ? 'bg-[#F9EFEA] text-[#D96B43]'
                  : 'bg-[#EBF2F1] text-[#1D4E4F]'
              }`}
            >
              {isBudgetExceeded
                ? 'Budget Exceeded'
                : isBudgetTight
                ? 'Approaching Limit'
                : 'Within Budget'}
            </span>
          </div>
        </div>

        {/* Day Selector Ribbon */}
        {days.length > 0 && (
          <div className="pt-6 border-t border-[#E7E2D9] mt-5 flex items-center space-x-2 overflow-x-auto pb-1">
            {days.map((day) => (
              <button
                key={day.dayIndex}
                onClick={() => setSelectedDayIndex(day.dayIndex)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
                  selectedDayIndex === day.dayIndex
                    ? 'bg-[#1D4E4F] text-white shadow-xs'
                    : 'bg-[#FAF8F5] border border-[#E7E2D9] text-[#1A202C] hover:border-[#1D4E4F]'
                }`}
              >
                <span>Day {day.dayIndex}</span>
                <span className="font-mono-meta text-[10px] opacity-80">
                  {formatDayDisplayDate(day.date)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Outstation Trip Accommodation Section */}
      <div className="mb-8">
        <AccommodationSummaryCard
          trip={trip}
          onUpdateAccommodation={handleUpdateAccommodation}
        />
      </div>

      {/* Engine Health & Constraint Diagnostics Bar */}
      <ItineraryEngineBar
        trip={trip}
        onAutoRepair={handleTriggerAutoRepair}
        isRepairing={isRepairing}
      />

      {/* AI Grounded Assistant Panel */}
      <TripAssistantPanel
        trip={trip}
        onAutoRepair={handleTriggerAutoRepair}
        onTriggerReplacer={(id) => setActiveReplacerItemId(id)}
      />

      {/* Selected Day Content */}
      {currentDay ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono-meta text-xs uppercase tracking-wider text-[#1D4E4F] font-semibold">
                Day {currentDay.dayIndex} • {formatDayDisplayDate(currentDay.date)}
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1A202C]">
                {currentDay.title}
              </h2>
            </div>
            {currentDay.theme && (
              <span className="px-3.5 py-1 bg-[#EBF2F1] text-[#1D4E4F] text-xs font-mono-meta rounded-full font-semibold self-start sm:self-center">
                Focus: {currentDay.theme}
              </span>
            )}
          </div>

          {/* Day Items List */}
          <div className="space-y-4">
            {currentDay.items.map((item) => {
              const isItemVisited = Boolean(item.isVisited || item.status === 'completed' || item.status === 'visited');
              const isItemSkipped = Boolean(item.isSkipped || item.status === 'skipped');
              const bestVisitedText = item.bestVisited || (
                item.timeSlot === 'morning' ? 'Morning' : item.timeSlot === 'afternoon' ? 'Afternoon' : 'Evening'
              );

              return (
                <div
                  key={item.id}
                  className={`rounded-3xl p-5 sm:p-6 border transition-all ${
                    isItemSkipped
                      ? 'bg-[#FAF8F5]/80 border-dashed border-[#D5CEC5] opacity-65'
                      : isItemVisited
                      ? 'bg-[#FCFDFD] border-emerald-300/80 shadow-2xs'
                      : item.isRejected
                      ? 'bg-[#FAF8F5] border-[#D96B43]/40 opacity-75'
                      : item.isOverBudget
                      ? 'bg-white border-[#D96B43]/40 shadow-xs'
                      : 'bg-white border-[#E7E2D9] shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Time slot, Status, and Category Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono-meta text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E7E2D9] text-[#1D4E4F] font-semibold">
                          {item.timeSlot}
                        </span>

                        {isItemVisited && (
                          <span className="inline-flex items-center space-x-1 font-mono-meta text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-md font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Visited</span>
                          </span>
                        )}

                        {isItemSkipped && (
                          <span className="inline-flex items-center space-x-1 font-mono-meta text-[11px] text-[#576574] bg-[#F2EFE9] border border-[#E7E2D9] px-2.5 py-0.5 rounded-md font-semibold">
                            <SkipForward className="w-3 h-3 text-[#576574]" />
                            <span>Skipped from plan</span>
                          </span>
                        )}

                        {item.category && (
                          <span className="font-mono-meta text-[11px] text-[#576574]">
                            {item.category}
                          </span>
                        )}

                        {item.isOverBudget && !isItemSkipped && (
                          <span className="inline-flex items-center space-x-1 font-mono-meta text-[11px] text-[#D96B43] bg-[#F9EFEA] px-2 py-0.5 rounded-md font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Over budget</span>
                          </span>
                        )}

                        {item.status === 'unavailable' && !isItemSkipped && (
                          <span className="inline-flex items-center space-x-1 font-mono-meta text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Venue Closed / Disruption</span>
                          </span>
                        )}

                        {item.backupOptions && item.backupOptions.length > 0 && !isItemSkipped && !isItemVisited && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReplacerItemId(
                                activeReplacerItemId === item.id ? null : item.id
                              )
                            }
                            className="inline-flex items-center space-x-1 font-mono-meta text-[11px] text-[#1D4E4F] bg-[#EBF2F1] hover:bg-[#1D4E4F] hover:text-white px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{item.backupOptions.length} AI Backups Ready</span>
                          </button>
                        )}
                      </div>

                      {/* Prominent Place Name (Strongest element) */}
                      <h3
                        className={`font-serif text-2xl sm:text-3xl font-bold tracking-tight ${
                          isItemSkipped
                            ? 'line-through text-[#8A96A0]'
                            : item.isRejected
                            ? 'line-through text-[#576574]'
                            : 'text-[#1A202C]'
                        }`}
                      >
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-[#576574] mt-1.5 leading-relaxed max-w-2xl">
                        {item.description}
                      </p>

                      {/* Supporting Logistics Line: Duration, Best Visited, Hours, Estimated Cost */}
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono-meta text-[#576574]">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-[#1D4E4F]" />
                          <span>Recommended duration: {formatDurationText(item.durationMinutes)}</span>
                        </span>

                        <span>•</span>

                        <span>Best visited: {bestVisitedText}</span>

                        {item.openingHours && (
                          <>
                            <span>•</span>
                            <span>Hours: {item.openingHours}</span>
                          </>
                        )}

                        <span>•</span>

                        <span className="text-[#1D4E4F] font-semibold">
                          Estimated: {item.estimatedCost > 0 ? formatINR(item.estimatedCost) : 'Free / Included'}
                        </span>
                      </div>

                      {/* Clickable Location with Google Maps icon & distance */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          href={getMapsUrl(item.title, item.location, item.latitude, item.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 text-xs text-[#576574] hover:text-[#1D4E4F] font-medium transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#D96B43]" />
                          <span>{item.location}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                        </a>

                        {item.distanceKm !== undefined && (
                          <span className="inline-flex items-center text-[10px] font-mono-meta text-[#1D4E4F] bg-[#EBF2F1] px-2 py-0.5 rounded-full font-semibold">
                            ~{item.distanceKm} km away
                          </span>
                        )}
                      </div>

                      {/* Getting There: local ride options */}
                      {!item.isRejected && !isItemSkipped && (
                        <GettingThereRow
                          trip={trip}
                          currentDay={currentDay}
                          item={item}
                        />
                      )}

                      {/* Over budget note and alternative suggestion */}
                      {item.isOverBudget && item.alternativeSuggestion && !isItemSkipped && (
                        <div className="mt-4 p-4 rounded-2xl bg-[#F9EFEA] border border-[#D96B43]/30">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="font-mono-meta text-[11px] uppercase tracking-wider font-semibold text-[#D96B43] block mb-0.5">
                                Try this instead
                              </span>
                              <h4 className="font-serif text-base font-bold text-[#1A202C]">
                                {item.alternativeSuggestion.title}
                              </h4>
                              <p className="text-xs text-[#576574] mt-1">
                                {item.alternativeSuggestion.description}
                              </p>
                              <div className="mt-2 text-xs font-mono-meta text-[#1D4E4F] font-semibold">
                                Estimated: {item.alternativeSuggestion.estimatedCost > 0 ? formatINR(item.alternativeSuggestion.estimatedCost) : 'Free / Low cost'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDirectSwap(item)}
                              className="px-3 py-1.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
                            >
                              Swap to this
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Over budget but no replacement available */}
                      {item.noReplacementAvailable && !isItemSkipped && (
                        <div className="mt-4 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] text-xs text-[#576574] flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-[#D96B43] shrink-0" />
                          <span>No suitable replacement is available within your remaining budget.</span>
                        </div>
                      )}

                      {/* Rejection Note */}
                      {item.isRejected && item.rejectionReason && (
                        <div className="mt-3 p-2.5 bg-[#F9EFEA] rounded-xl text-xs text-[#D96B43] border border-[#D96B43]/20">
                          <span className="font-semibold">Rejection note:</span> {item.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Intuitive, Clean & Compact Card Actions: Visited | Skip | Swap | Maps */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 shrink-0 self-start sm:self-center">
                      {/* Mark as Visited action */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisited(item)}
                        title={isItemVisited ? 'Click to unmark as visited' : 'Mark place as visited'}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isItemVisited
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-[#FAF8F5] border border-[#E7E2D9] text-[#576574] hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        {isItemVisited ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Visited</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mark Visited</span>
                          </>
                        )}
                      </button>

                      {/* Skip action */}
                      <button
                        type="button"
                        onClick={() => handleToggleSkipped(item)}
                        title={isItemSkipped ? 'Restore to active plan' : 'Skip this place'}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isItemSkipped
                            ? 'bg-stone-200 border border-stone-300 text-[#1A202C] hover:bg-stone-300/80'
                            : 'bg-[#FAF8F5] border border-[#E7E2D9] text-[#576574] hover:text-[#1A202C] hover:bg-[#F2EFE9]'
                        }`}
                      >
                        {isItemSkipped ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 text-[#576574]" />
                            <span>Restore</span>
                          </>
                        ) : (
                          <>
                            <SkipForward className="w-3.5 h-3.5 text-[#576574]" />
                            <span>Skip</span>
                          </>
                        )}
                      </button>

                      {/* Swap action */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReplacerItemId(
                            activeReplacerItemId === item.id ? null : item.id
                          )
                        }
                        title="Swap with an alternative place"
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                          activeReplacerItemId === item.id
                            ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                            : 'bg-[#1D4E4F] hover:bg-[#153B3C] text-white border border-[#1D4E4F]'
                        }`}
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            activeReplacerItemId === item.id ? 'rotate-180 transition-transform' : ''
                          }`}
                        />
                        <span>{activeReplacerItemId === item.id ? 'Cancel' : 'Swap'}</span>
                      </button>

                      {/* Google Maps link */}
                      <a
                        href={getMapsUrl(item.title, item.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open location in Google Maps"
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF2F1] text-[#1D4E4F] border border-[#E7E2D9] text-xs font-semibold transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#D96B43]" />
                        <span className="hidden md:inline">Map</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                      </a>
                    </div>
                  </div>

                  {/* Inline Replacement Engine for Active Replacer */}
                  {activeReplacerItemId === item.id && (
                    <div className="mt-4 pt-4 border-t border-[#E7E2D9]">
                      <ItineraryReplacer
                        trip={trip}
                        dayIndex={currentDay.dayIndex}
                        currentItem={item}
                        onSwap={(newItemData) => handleSwapItem(item.id, newItemData)}
                        onCancel={() => setActiveReplacerItemId(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-[#E7E2D9] text-center">
          <p className="text-sm text-[#576574]">No day items configured yet.</p>
        </div>
      )}

      {/* Reject / Swap Item Feedback Dialog */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E7E2D9] shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]">
              <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
                Reject Itinerary Stop
              </h3>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-[#576574] hover:text-[#1A202C] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#576574] mt-3 leading-relaxed">
              Why would you like to replace <strong className="text-[#1A202C]">{rejectingItem.title}</strong>?
              TravelPilot logs this feedback to refine your journey recommendations.
            </p>

            <div className="mt-4 space-y-2">
              {[
                'Too far away / excessive transit distance',
                'Crowded / Prefer quieter alternative',
                'Too expensive / Out of budget',
                'Already visited previously',
                'Physical accessibility concern',
                'Dietary or preference mismatch'
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRejectReason(r)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    rejectReason === r
                      ? 'border-[#1D4E4F] bg-[#EBF2F1] text-[#1D4E4F]'
                      : 'border-[#E7E2D9] hover:bg-[#FAF8F5] text-[#1A202C]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="block text-[11px] font-mono-meta text-[#576574] mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="e.g. prefer outdoor cafe or scenic gardens"
                className="w-full p-2.5 rounded-xl border border-[#E7E2D9] text-xs text-[#1A202C] focus:outline-none focus:border-[#1D4E4F] bg-[#FAF8F5]"
                rows={2}
              />
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#576574] hover:bg-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={savingRejection}
                className="px-5 py-2 rounded-xl bg-[#D96B43] hover:bg-[#B85530] text-white text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {savingRejection ? 'Logging...' : 'Reject & Choose Replacement'}
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
