import { useState } from 'react';
import {
  Building,
  MapPin,
  Sparkles,
  Check,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Navigation
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import { HotelComparisonModal } from './HotelComparisonModal';
import type { HotelOption } from '../types';

interface HotelCardProps {
  hotel: HotelOption;
  nights: number;
  rooms: number;
  remainingAccommodationBudget?: number;
  isSelected?: boolean;
  onSelect?: (hotel: HotelOption) => void;
}

export function HotelCard({
  hotel,
  nights,
  rooms,
  remainingAccommodationBudget,
  isSelected = false,
  onSelect
}: HotelCardProps) {
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const isOverBudget =
    remainingAccommodationBudget !== undefined && hotel.estimatedTotal > remainingAccommodationBudget;
  const budgetDifference =
    remainingAccommodationBudget !== undefined ? hotel.estimatedTotal - remainingAccommodationBudget : 0;

  const handleOpenDirectProvider = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(hotel.deepLinks.makeMyTrip, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div
        className={`bg-white rounded-3xl p-6 border transition-all ${
          isSelected
            ? 'border-[#1D4E4F] ring-2 ring-[#1D4E4F]/20 shadow-md'
            : 'border-[#E7E2D9] hover:border-[#1D4E4F]/50 shadow-xs'
        }`}
      >
        {/* Top Header: Badge, Tags, Ratings */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            {hotel.isBestForTrip && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#1D4E4F] text-white font-mono-meta text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-[#EBF2F1]" />
                <span>Best for Your Trip</span>
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#1A202C] border border-[#E7E2D9] font-mono-meta text-xs font-semibold">
              {hotel.stayType}
            </span>
            {hotel.starRating && (
              <span className="font-mono-meta text-xs text-[#576574]">
                {hotel.starRating}-Star
              </span>
            )}
          </div>

          {hotel.userRating && (
            <div className="flex items-center space-x-1.5 text-xs font-mono-meta">
              <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E7E2D9] font-bold text-[#1A202C]">
                ★ {hotel.userRating}
              </span>
              <span className="text-[#576574]">({hotel.reviewCount} reviews)</span>
            </div>
          )}
        </div>

        {/* Hotel Title & Location */}
        <div className="mb-4">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1A202C] leading-snug">
            {hotel.name}
          </h3>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#576574] mt-1.5">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[#1D4E4F] shrink-0" />
              <span>{hotel.address}</span>
            </span>
            {hotel.distanceToItineraryKm !== undefined && (
              <span className="flex items-center space-x-1 text-[#1D4E4F] font-medium">
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span>~{hotel.distanceToItineraryKm} km (~{hotel.travelTimeToItineraryMinutes || 8} min) to planned activity cluster</span>
              </span>
            )}
          </div>
        </div>

        {/* Match Reasons Checklist */}
        {hotel.matchReasons && hotel.matchReasons.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] mb-4 space-y-1.5">
            <span className="font-mono-meta text-[10px] uppercase text-[#576574] block font-semibold mb-1">
              Why this fits your trip
            </span>
            {hotel.matchReasons.map((reason, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-[#1A202C]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1D4E4F] shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* Over-budget Warning */}
        {isOverBudget && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#F9EFEA] border border-[#D96B43]/30 text-xs text-[#D96B43] flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Stay exceeds estimated headroom by {formatINR(budgetDifference)}.</strong>
              <p className="mt-0.5 text-[#576574]">
                Selecting this stay will push your overall estimated trip cost above your target budget.
              </p>
            </div>
          </div>
        )}

        {/* Pricing Breakdown & Action Row */}
        <div className="pt-4 border-t border-[#E7E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="font-serif text-2xl font-bold text-[#1A202C]">
                {formatINR(hotel.pricePerNight)}
              </span>
              <span className="text-xs text-[#576574] font-mono-meta">/ night</span>
            </div>
            <div className="text-xs font-mono-meta text-[#576574] mt-0.5">
              <span>{formatINR(hotel.estimatedTotal)} estimated total ({nights} {nights === 1 ? 'night' : 'nights'}, {rooms} {rooms === 1 ? 'room' : 'rooms'})</span>
              <span className="block text-[10px] text-[#576574] opacity-80 mt-0.5">• Reference rate on MakeMyTrip / Booking.com</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-[#E7E2D9] hover:bg-[#FAF8F5] text-xs font-semibold text-[#1A202C] transition-colors cursor-pointer"
            >
              Compare Prices
            </button>

            <button
              type="button"
              onClick={handleOpenDirectProvider}
              title="Open MakeMyTrip search"
              className="p-2.5 rounded-xl border border-[#E7E2D9] hover:bg-[#FAF8F5] text-[#576574] hover:text-[#1D4E4F] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {onSelect && (
              <button
                type="button"
                onClick={() => onSelect(hotel)}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#EBF2F1] text-[#1D4E4F] border border-[#1D4E4F]'
                    : 'bg-[#1D4E4F] hover:bg-[#153B3C] text-white'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Selected</span>
                  </>
                ) : (
                  <span>Select Stay</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Provider Comparison Modal */}
      <HotelComparisonModal
        hotel={hotel}
        nights={nights}
        rooms={rooms}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onSelectStay={onSelect}
        isSelected={isSelected}
      />
    </>
  );
}
