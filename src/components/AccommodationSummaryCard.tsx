import { useState } from 'react';
import {
  Building,
  Calendar,
  MapPin,
  ExternalLink,
  Sparkles,
  Home,
  CheckCircle2,
  Navigation,
  Edit3,
  Sliders,
  AlertCircle,
  Search
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import { formatDateRange, calculateHotelNights } from '../utils/date';
import { getTripActivitiesCost } from '../utils/budget';
import { buildHotelGoogleSearchUrl } from '../services/hotelProviderService';
import { HotelComparisonModal } from './HotelComparisonModal';
import { HotelDiscoverySection } from './HotelDiscoverySection';
import type { Trip, HotelOption, TripAccommodation } from '../types';

interface AccommodationSummaryCardProps {
  trip: Trip;
  onUpdateAccommodation: (accommodation: TripAccommodation) => Promise<void>;
}

export function AccommodationSummaryCard({
  trip,
  onUpdateAccommodation
}: AccommodationSummaryCardProps) {
  // STRICT RULE: If destinationType === 'city', do NOT display accommodation section
  if (trip.destinationType === 'city') {
    return null;
  }

  const nights = calculateHotelNights(trip.startDate, trip.endDate);

  // If same-day return (0 nights), accommodation is not required
  if (nights <= 0) {
    return null;
  }

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const accommodation = trip.accommodation;
  const hotel = accommodation?.hotel;
  const isAlreadyArranged = accommodation?.status === 'already-arranged';
  const hasSelectedHotel = accommodation?.status === 'selected' && hotel;

  // Flatten planned items from days to evaluate centroid
  const plannedItems = (trip.days || []).flatMap((d) => d.items);

  const handleSelectHotel = async (selectedHotel: HotelOption) => {
    setUpdating(true);
    try {
      const newAcc: TripAccommodation = {
        required: true,
        status: 'selected',
        checkIn: trip.startDate,
        checkOut: trip.endDate,
        nights,
        rooms: Math.max(1, Math.ceil((trip.travelerCount || 1) / 2)),
        hotel: selectedHotel
      };
      await onUpdateAccommodation(newAcc);
      setIsDiscoveryModalOpen(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleSetAlreadyArranged = async (stayName?: string) => {
    setUpdating(true);
    try {
      const newAcc: TripAccommodation = {
        required: true,
        status: 'already-arranged',
        checkIn: trip.startDate,
        checkOut: trip.endDate,
        nights,
        rooms: Math.max(1, Math.ceil((trip.travelerCount || 1) / 2)),
        customStayDetails: {
          name: stayName || 'Self-arranged Stay'
        }
      };
      await onUpdateAccommodation(newAcc);
      setIsDiscoveryModalOpen(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleClear = async () => {
    setUpdating(true);
    try {
      const newAcc: TripAccommodation = {
        required: true,
        status: 'not-selected',
        checkIn: trip.startDate,
        checkOut: trip.endDate,
        nights,
        rooms: Math.max(1, Math.ceil((trip.travelerCount || 1) / 2))
      };
      await onUpdateAccommodation(newAcc);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E2D9] shadow-xs mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E2D9] mb-5">
          <div className="flex items-center space-x-2">
            <span className="font-mono-meta text-xs uppercase tracking-wider text-[#1D4E4F] font-semibold">
              Trip Accommodation
            </span>
            <span className="text-[#576574]">•</span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E7E2D9] text-[#1A202C] font-mono-meta text-[11px] font-semibold">
              {nights} {nights === 1 ? 'Night' : 'Nights'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDiscoveryModalOpen(true)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1D4E4F] hover:text-[#153B3C] cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{hasSelectedHotel || isAlreadyArranged ? 'Change Stay' : 'Find Hotels'}</span>
          </button>
        </div>

        {/* Case 1: Hotel is Selected */}
        {hasSelectedHotel && hotel && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#EBF2F1] text-[#1D4E4F] font-mono-meta text-xs font-semibold">
                    {hotel.stayType}
                  </span>
                  {hotel.userRating && (
                    <span className="font-mono-meta text-xs font-bold text-[#1A202C]">
                      ★ {hotel.userRating} ({hotel.reviewCount} reviews)
                    </span>
                  )}
                  {hotel.isBestForTrip && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1D4E4F] text-white font-mono-meta text-[10px] font-semibold flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Best for Your Trip</span>
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
                  {hotel.name}
                </h3>

                <p className="text-xs text-[#576574] mt-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1D4E4F] shrink-0" />
                  <span>{hotel.address}</span>
                </p>

                {hotel.distanceToItineraryKm !== undefined && (
                  <p className="text-xs font-medium text-[#1D4E4F] mt-1.5 flex items-center space-x-1">
                    <Navigation className="w-3.5 h-3.5 shrink-0" />
                    <span>~{hotel.distanceToItineraryKm} km (~{hotel.travelTimeToItineraryMinutes || 8} min) to planned activity cluster</span>
                  </p>
                )}
              </div>

              <div className="text-left md:text-right shrink-0 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E7E2D9]">
                <span className="text-[10px] uppercase font-mono-meta text-[#576574] block">
                  Estimated Total for Stay
                </span>
                <span className="font-serif text-2xl font-bold text-[#1D4E4F]">
                  {formatINR(hotel.estimatedTotal)}
                </span>
                <span className="block text-xs font-mono-meta text-[#576574]">
                  {formatINR(hotel.pricePerNight)} / night ({nights}N)
                </span>
                <span className="block text-[10px] text-[#576574] opacity-80 mt-1">
                  Reference rate • Not yet charged
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#1D4E4F] bg-[#EBF2F1] px-2 py-0.5 rounded-full mt-1.5 font-medium">
                  ✓ Included in Planned Spend
                </span>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="pt-4 border-t border-[#E7E2D9] flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[#576574] flex items-center space-x-2">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-[#1D4E4F]" />
                  <span>Check-in: {trip.startDate}</span>
                </span>
                <span>•</span>
                <span>Check-out: {trip.endDate}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={buildHotelGoogleSearchUrl(hotel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-[#E7E2D9] hover:border-[#1D4E4F] hover:bg-[#FAF8F5] text-xs font-semibold text-[#1A202C] transition-colors cursor-pointer"
                  title="Search hotel details, photos, and reviews on Google"
                >
                  <Search className="w-3.5 h-3.5 text-[#1D4E4F]" />
                  <span>Check on Google</span>
                  <ExternalLink className="w-3 h-3 text-[#576574]" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(true)}
                  className="px-4 py-2 rounded-xl border border-[#E7E2D9] hover:bg-[#FAF8F5] text-xs font-semibold text-[#1A202C] transition-colors cursor-pointer"
                >
                  Compare Provider Prices
                </button>

                <a
                  href={hotel.deepLinks.makeMyTrip}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Book on MakeMyTrip</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Case 2: Self-arranged Accommodation */}
        {isAlreadyArranged && (
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-[#1A202C] block">
                  Accommodation Arranged Independently
                </span>
                <span className="text-xs text-[#576574]">
                  {accommodation?.customStayDetails?.name || 'Self-arranged or staying with friends/family'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDiscoveryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white border border-[#E7E2D9] hover:border-[#1D4E4F] text-xs font-semibold text-[#1A202C] transition-colors cursor-pointer"
            >
              Browse Stays Instead
            </button>
          </div>
        )}

        {/* Case 3: No Stay Selected Yet */}
        {!hasSelectedHotel && !isAlreadyArranged && (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-1.5 text-xs text-[#1D4E4F] font-mono-meta font-semibold mb-1">
                <Building className="w-4 h-4" />
                <span>Accommodation Needed for {nights} {nights === 1 ? 'Night' : 'Nights'}</span>
              </div>
              <h4 className="font-serif text-lg font-bold text-[#1A202C]">
                No hotel selected for your {trip.destination.split(',')[0].trim()} journey yet
              </h4>
              <p className="text-xs text-[#576574] mt-0.5 max-w-xl">
                Discover stays recommended for your budget and located conveniently near your scheduled activities.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSetAlreadyArranged()}
                className="px-4 py-2.5 rounded-xl border border-[#E7E2D9] hover:bg-white text-xs font-semibold text-[#576574] transition-colors cursor-pointer"
              >
                I have a stay
              </button>

              <button
                type="button"
                onClick={() => setIsDiscoveryModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Discover Stays
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compare Modal */}
      {hotel && (
        <HotelComparisonModal
          hotel={hotel}
          nights={nights}
          rooms={accommodation?.rooms || 1}
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
        />
      )}

      {/* Discovery / Selection Full Modal */}
      {isDiscoveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-[#E7E2D9] shadow-2xl overflow-y-auto max-h-[90vh] my-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E2D9] mb-6">
              <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
                Explore Stays in {trip.destination.split(',')[0].trim()}
              </h3>
              <button
                type="button"
                onClick={() => setIsDiscoveryModalOpen(false)}
                className="text-sm font-bold text-[#576574] hover:text-[#1A202C] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <HotelDiscoverySection
              destination={trip.destination}
              startDate={trip.startDate}
              endDate={trip.endDate}
              nights={nights}
              travellers={trip.travelerCount}
              budgetAmount={trip.budgetAmount}
              plannedActivitySpend={getTripActivitiesCost(trip.days, trip.travelerCount)}
              itineraryItems={plannedItems}
              selectedAccommodation={accommodation}
              onSelectHotel={handleSelectHotel}
              onSetAlreadyArranged={handleSetAlreadyArranged}
              onClearAccommodation={handleClear}
            />
          </div>
        </div>
      )}
    </>
  );
}
