import React, { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Compass,
  Check,
  Share2,
  Navigation,
  Building,
  Car,
  FileText,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import {
  getSharedTripByToken,
  formatTripSummaryText,
  type SharedTripFetchResult
} from '../services/shareService';
import {
  resolveLocalOrigin,
  buildUberLink,
  buildGoogleMapsDirectionsLink
} from '../services/transportService';
import { formatINR } from '../utils/currency';
import { calculateTripBudget } from '../utils/budget';
import {
  formatDateRange,
  calculateCalendarDays,
  formatDayDisplayDate
} from '../utils/date';
import type { Trip, ItineraryItem, TripDay } from '../types';

/**
 * Compact, lightweight transport link for a schedule stop
 */
function QuickTransportButton({
  trip,
  currentDay,
  item
}: {
  trip: Trip;
  currentDay: TripDay;
  item: ItineraryItem;
}) {
  const origin = resolveLocalOrigin(trip, currentDay, item);
  if (!origin || !item.title) return null;
  const destination = { lat: item.latitude, lng: item.longitude, name: item.title };

  return (
    <div className="flex items-center gap-2 text-xs">
      <a
        href={buildGoogleMapsDirectionsLink(origin, destination)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-[#E7E2D9] hover:border-[#1D4E4F] text-[#1A202C] text-[11px] font-semibold transition-colors"
      >
        <Navigation className="w-3 h-3 text-[#1D4E4F]" />
        <span>Directions</span>
      </a>
      <a
        href={buildUberLink(origin, destination)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-[#E7E2D9] hover:border-[#1D4E4F] text-[#1A202C] text-[11px] font-semibold transition-colors"
      >
        <Car className="w-3 h-3 text-[#1D4E4F]" />
        <span>Uber</span>
      </a>
      <span className="text-[10px] text-[#576574] hidden sm:inline truncate max-w-[180px]">
        from {origin.name}
      </span>
    </div>
  );
}

export function SharedTripView() {
  const [, params] = useRoute<{ shareToken: string }>('/shared-trip/:shareToken');
  const shareToken = params?.shareToken;

  const [loading, setLoading] = useState(true);
  const [fetchResult, setFetchResult] = useState<SharedTripFetchResult | null>(null);
  const [selectedDayTab, setSelectedDayTab] = useState<number | 'all'>('all');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadTrip() {
      if (!shareToken) {
        setFetchResult({ status: 'not_found' });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await getSharedTripByToken(shareToken);
        if (isMounted) {
          setFetchResult(result);
        }
      } catch (err) {
        console.error('Failed to load shared trip:', err);
        if (isMounted) {
          setFetchResult({ status: 'not_found' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTrip();
    return () => {
      isMounted = false;
    };
  }, [shareToken]);

  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      console.error('Could not copy link:', err);
    }
  };

  const handleCopySummary = async (trip: Trip) => {
    try {
      const summary = formatTripSummaryText(trip, window.location.href);
      await navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (err) {
      console.error('Could not copy summary:', err);
    }
  };

  const handleNativeShare = async (trip: Trip) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      const summary = formatTripSummaryText(trip, window.location.href);
      try {
        await navigator.share({
          title: `${trip.destination} Itinerary Summary`,
          text: summary,
          url: window.location.href
        });
      } catch {
        // Dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex p-4 rounded-3xl bg-[#FAF8F5] border border-[#E7E2D9] mb-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#1D4E4F] border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-mono-meta text-[#576574]">
          Loading itinerary summary...
        </p>
      </div>
    );
  }

  if (!fetchResult || fetchResult.status === 'disabled') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 border border-[#E7E2D9] shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#D96B43] flex items-center justify-center mx-auto mb-4 border border-[#E7E2D9]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A202C] mb-2">
            Trip Sharing Turned Off
          </h2>
          <p className="text-xs text-[#576574] mb-6 leading-relaxed">
            The owner of this trip has turned off sharing or the link has been revoked.
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Plan Your Own Trip</span>
          </Link>
        </div>
      </div>
    );
  }

  if (fetchResult.status === 'not_found' || !fetchResult.trip) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 border border-[#E7E2D9] shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#576574] flex items-center justify-center mx-auto mb-4 border border-[#E7E2D9]">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A202C] mb-2">
            Itinerary Not Found
          </h2>
          <p className="text-xs text-[#576574] mb-6 leading-relaxed">
            This shared itinerary link does not exist or may have been deleted.
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Start Planning</span>
          </Link>
        </div>
      </div>
    );
  }

  const trip = fetchResult.trip;
  const totalDays = calculateCalendarDays(trip.startDate, trip.endDate);
  const dateRangeDisplay = formatDateRange(trip.startDate, trip.endDate);

  // Financial summary (centralized single source of truth)
  const tripBudget = calculateTripBudget(trip);
  const activitiesTotal = tripBudget.activitiesCost;
  const stayTotal = tripBudget.accommodationCost;
  const commuteTotal = totalDays * 450;
  const estimatedTotal = tripBudget.totalPlannedSpend > 0 ? tripBudget.totalPlannedSpend + commuteTotal : trip.budgetAmount;

  const getSlotBadgeStyle = (slot: string) => {
    switch (slot) {
      case 'morning':
        return 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]';
      case 'afternoon':
        return 'bg-[#EBF2F1] text-[#1D4E4F] border border-[#1D4E4F]/20';
      case 'evening':
        return 'bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getMapsUrl = (title: string, location?: string, lat?: number, lng?: number) => {
    if (lat && lng) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    const query = encodeURIComponent(`${title}, ${location || ''}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const displayedDays =
    selectedDayTab === 'all'
      ? trip.days || []
      : (trip.days || []).filter((d) => d.dayIndex === selectedDayTab);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Banner: Read-Only Notice + Share actions */}
      <div className="mb-6 p-3.5 rounded-2xl bg-[#EBF2F1] border border-[#1D4E4F]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-[#1D4E4F]">
          <span className="w-2 h-2 rounded-full bg-[#1D4E4F] shrink-0" />
          <span className="font-semibold">Itinerary Summary</span>
          <span className="text-[#576574]">•</span>
          <span className="text-[#576574] truncate">Read-only companion view</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => handleCopySummary(trip)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E7E2D9] hover:border-[#1D4E4F] text-xs font-semibold text-[#1A202C] transition-colors cursor-pointer"
            title="Copy text summary for WhatsApp / chat"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-[#1D4E4F]" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNativeShare(trip)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E7E2D9] hover:border-[#1D4E4F] text-xs font-semibold text-[#1A202C] transition-colors cursor-pointer"
            title="Share via WhatsApp or Apps"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#1D4E4F]" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container: Complete Itinerary Summary */}
      <div className="space-y-6">
        {/* 1. Trip Header Summary */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E2D9] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-meta text-xs uppercase tracking-wider text-[#1D4E4F] font-semibold">
              Trip Itinerary
            </span>
            {trip.pace && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E7E2D9] text-[11px] font-mono-meta capitalize text-[#576574]">
                {trip.pace} pace
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A202C] tracking-tight mb-4">
            {trip.destination}
          </h1>

          {/* Key Facts Pills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E7E2D9]/70">
            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]/60">
              <span className="text-[10px] font-mono-meta uppercase text-[#576574] block">Dates</span>
              <span className="text-xs font-semibold text-[#1A202C] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#1D4E4F] shrink-0" />
                <span className="truncate">{dateRangeDisplay}</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]/60">
              <span className="text-[10px] font-mono-meta uppercase text-[#576574] block">Duration</span>
              <span className="text-xs font-semibold text-[#1A202C] flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#1D4E4F] shrink-0" />
                <span>{totalDays} {totalDays === 1 ? 'day' : 'days'}</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]/60">
              <span className="text-[10px] font-mono-meta uppercase text-[#576574] block">Travellers</span>
              <span className="text-xs font-semibold text-[#1A202C] flex items-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-[#1D4E4F] shrink-0" />
                <span className="capitalize">{trip.travelerCount} {trip.groupType}</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]/60">
              <span className="text-[10px] font-mono-meta uppercase text-[#576574] block">Est. Budget</span>
              <span className="text-xs font-serif font-bold text-[#1D4E4F] block mt-0.5">
                {formatINR(estimatedTotal)}
              </span>
            </div>
          </div>

          {/* Stay Snapshot (if hotel selected) */}
          {trip.accommodation?.hotel && (
            <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center shrink-0 mt-0.5">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-meta uppercase font-bold text-[#1D4E4F]">
                      Stay / Hotel
                    </span>
                    <span className="text-[10px] text-[#576574]">
                      {trip.accommodation.nights} {trip.accommodation.nights === 1 ? 'night' : 'nights'}
                    </span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-[#1A202C]">
                    {trip.accommodation.hotel.name}
                  </h4>
                  <p className="text-[11px] text-[#576574] line-clamp-1">
                    {trip.accommodation.hotel.address || trip.accommodation.hotel.city || trip.destination}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    trip.accommodation.hotel.name + ', ' + (trip.accommodation.hotel.address || trip.destination)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-[#E7E2D9] hover:border-[#1D4E4F] bg-white text-[11px] font-semibold text-[#1A202C] transition-colors"
                >
                  <Navigation className="w-3 h-3 text-[#1D4E4F]" />
                  <span>Map</span>
                </a>
                {trip.accommodation.hotel.deepLinks?.bookingCom && (
                  <a
                    href={trip.accommodation.hotel.deepLinks.bookingCom}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-[#E7E2D9] hover:border-[#1D4E4F] bg-white text-[11px] font-semibold text-[#1A202C] transition-colors"
                  >
                    <span>Booking</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#576574]" />
                  </a>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 2. Day-by-Day Schedule Summary */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E2D9] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E7E2D9] mb-5">
            <div>
              <span className="font-mono-meta text-xs uppercase tracking-wider text-[#1D4E4F] font-semibold block">
                Daily Schedule
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A202C]">
                Day-by-Day Summary
              </h2>
            </div>

            {/* Quick Day Filter Tabs */}
            {(trip.days?.length || 0) > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDayTab('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    selectedDayTab === 'all'
                      ? 'bg-[#1D4E4F] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#576574] hover:text-[#1A202C] border border-[#E7E2D9]'
                  }`}
                >
                  All Days
                </button>
                {trip.days?.map((d) => (
                  <button
                    key={d.dayIndex}
                    type="button"
                    onClick={() => setSelectedDayTab(d.dayIndex)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      selectedDayTab === d.dayIndex
                        ? 'bg-[#1D4E4F] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#576574] hover:text-[#1A202C] border border-[#E7E2D9]'
                    }`}
                  >
                    Day {d.dayIndex}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Days */}
          <div className="space-y-6">
            {displayedDays.map((day) => {
              const activeItems = (day.items || []).filter((i) => !i.isRejected);
              const formattedDate = formatDayDisplayDate(day.date);

              return (
                <div
                  key={day.dayIndex}
                  className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] space-y-4"
                >
                  {/* Day Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]/70">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 rounded-xl bg-[#1D4E4F] text-white font-serif font-bold text-xs flex items-center justify-center shadow-xs">
                        {day.dayIndex}
                      </span>
                      <div>
                        <h3 className="font-serif text-base font-bold text-[#1A202C]">
                          {day.title || `Day ${day.dayIndex}`}
                        </h3>
                        {formattedDate && (
                          <p className="text-[11px] font-mono-meta text-[#576574]">
                            {formattedDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {day.theme && (
                      <span className="text-xs font-mono-meta text-[#576574] font-medium hidden sm:inline-block">
                        {day.theme}
                      </span>
                    )}
                  </div>

                  {/* Day Stops */}
                  {activeItems.length === 0 ? (
                    <p className="text-xs text-[#576574] italic py-1">
                      Free time or leisure scheduled for this day.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeItems.map((item) => {
                        const mapsUrl = getMapsUrl(
                          item.title,
                          item.location,
                          item.latitude,
                          item.longitude
                        );

                        const isVisited = Boolean(item.isVisited || item.status === 'completed' || item.status === 'visited');
                        const isSkipped = Boolean(item.isSkipped || item.status === 'skipped');

                        return (
                          <div
                            key={item.id}
                            className={`p-3 sm:p-3.5 rounded-xl border space-y-2 transition-colors ${
                              isSkipped
                                ? 'bg-[#FAF8F5]/80 border-dashed border-[#D5CEC5] opacity-65'
                                : isVisited
                                ? 'bg-[#FCFDFD] border-emerald-300/80'
                                : 'bg-white border-[#E7E2D9] hover:border-[#1D4E4F]/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-mono-meta text-[10px] font-bold uppercase ${getSlotBadgeStyle(
                                      item.timeSlot
                                    )}`}
                                  >
                                    {item.timeSlot}
                                  </span>
                                  {isVisited && (
                                    <span className="px-1.5 py-0.5 rounded-md font-mono-meta text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300">
                                      Visited
                                    </span>
                                  )}
                                  {isSkipped && (
                                    <span className="px-1.5 py-0.5 rounded-md font-mono-meta text-[10px] font-bold text-[#576574] bg-stone-100 border border-stone-200">
                                      Skipped
                                    </span>
                                  )}
                                  {item.category && (
                                    <span className="text-[10px] font-mono-meta text-[#576574]">
                                      • {item.category}
                                    </span>
                                  )}
                                </div>
                                <h4
                                  className={`font-serif text-sm sm:text-base font-bold ${
                                    isSkipped ? 'line-through text-[#8A96A0]' : 'text-[#1A202C]'
                                  }`}
                                >
                                  {item.title}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {item.estimatedCost && item.estimatedCost > 0 ? (
                                  <span className="text-xs font-mono-meta font-bold text-[#1D4E4F]">
                                    {formatINR(item.estimatedCost)}
                                  </span>
                                ) : null}
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View on Google Maps"
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-[#E7E2D9] hover:border-[#1D4E4F] bg-[#FAF8F5] text-xs font-semibold text-[#1A202C] transition-colors"
                                >
                                  <Navigation className="w-3 h-3 text-[#1D4E4F]" />
                                  <span>Map</span>
                                </a>
                              </div>
                            </div>

                            {item.description && (
                              <p className="text-xs text-[#576574] leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            )}

                            {/* Location & Quick Navigation */}
                            <div className="pt-2 border-t border-[#E7E2D9]/60 flex flex-wrap items-center justify-between gap-2">
                              {item.location ? (
                                <span className="flex items-center gap-1 text-[11px] font-mono-meta text-[#576574] truncate max-w-[240px]">
                                  <MapPin className="w-3 h-3 text-[#1D4E4F] shrink-0" />
                                  <span className="truncate">{item.location}</span>
                                </span>
                              ) : (
                                <span />
                              )}

                              <QuickTransportButton
                                trip={trip}
                                currentDay={day}
                                item={item}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Budget & Commute Quick Summary */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E2D9] shadow-xs">
          <span className="font-mono-meta text-xs uppercase tracking-wider text-[#1D4E4F] font-semibold block mb-1">
            Trip Essentials
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A202C] mb-4">
            Budget & Commute Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Financial Breakdown */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] space-y-2.5">
              <span className="text-[11px] font-mono-meta uppercase font-semibold text-[#1D4E4F] block">
                Estimated Breakdown
              </span>
              {stayTotal > 0 && (
                <div className="flex items-center justify-between text-xs text-[#576574]">
                  <span>Stay / Accommodation</span>
                  <strong className="font-mono-meta text-[#1A202C]">{formatINR(stayTotal)}</strong>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-[#576574]">
                <span>Sights & Activities</span>
                <strong className="font-mono-meta text-[#1A202C]">{formatINR(activitiesTotal)}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-[#576574]">
                <span>Local Cabs / Transit</span>
                <strong className="font-mono-meta text-[#1A202C]">{formatINR(commuteTotal)}</strong>
              </div>
              {trip.budgetAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-[#576574]">
                  <span>Target Budget</span>
                  <strong className="font-mono-meta text-[#1A202C]">{formatINR(trip.budgetAmount)}</strong>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-[#E7E2D9] text-xs font-bold text-[#1A202C]">
                <span>Total Estimated</span>
                <span className="font-serif text-sm text-[#1D4E4F]">{formatINR(estimatedTotal)}</span>
              </div>
            </div>

            {/* Commute Tip */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] space-y-2">
              <span className="text-[11px] font-mono-meta uppercase font-semibold text-[#1D4E4F] block">
                Local Commute in {trip.destination}
              </span>
              <p className="text-xs text-[#576574] leading-relaxed">
                Uber, Ola, and local autos operate across key stops in {trip.destination}. Use the "Directions" or "Uber" button on any stop to get one-tap transit estimates and routes from your previous location.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E7E2D9] text-center">
          <div className="w-8 h-8 rounded-xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center mx-auto mb-2">
            <Compass className="w-4 h-4" />
          </div>
          <p className="font-serif text-sm font-bold text-[#1A202C] mb-1">
            Created with TravelPilot
          </p>
          <p className="text-xs text-[#576574] max-w-sm mx-auto mb-3">
            Real-time, verified itinerary planning designed for travellers across India.
          </p>
          <Link
            href="/plan"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plan Your Own Trip</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
