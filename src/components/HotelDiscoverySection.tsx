import { useState, useMemo } from 'react';
import {
  Building,
  Calendar,
  Filter,
  Check,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Home,
  CheckCircle2
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import { formatDateRange } from '../utils/date';
import { HotelCard } from './HotelCard';
import { searchHotelProviders } from '../services/hotelProviderService';
import type { HotelOption, TripAccommodation } from '../types';

interface HotelDiscoverySectionProps {
  destination: string;
  startDate: string;
  endDate: string;
  nights: number;
  travellers: number;
  rooms?: number;
  budgetAmount: number;
  plannedActivitySpend?: number;
  itineraryItems?: Array<{ latitude?: number; longitude?: number; title?: string }>;
  selectedAccommodation?: TripAccommodation;
  onSelectHotel: (hotel: HotelOption) => void;
  onSetAlreadyArranged: (stayName?: string) => void;
  onClearAccommodation?: () => void;
}

export function HotelDiscoverySection({
  destination,
  startDate,
  endDate,
  nights,
  travellers,
  rooms = Math.max(1, Math.ceil(travellers / 2)),
  budgetAmount,
  plannedActivitySpend = 0,
  itineraryItems = [],
  selectedAccommodation,
  onSelectHotel,
  onSetAlreadyArranged,
  onClearAccommodation
}: HotelDiscoverySectionProps) {
  // Filter States
  const [stayTypeFilter, setStayTypeFilter] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<'under_1500' | '1500_3000' | '3000_5000' | 'above_5000' | 'all'>('all');

  // Custom Arranged Stay State
  const isAlreadyArranged = selectedAccommodation?.status === 'already-arranged';
  const [customStayName, setCustomStayName] = useState<string>(
    selectedAccommodation?.customStayDetails?.name || ''
  );

  // Remaining Accommodation headroom calculation
  const estimatedNonHotelSpend = plannedActivitySpend > 0
    ? plannedActivitySpend + Math.round(budgetAmount * 0.25)
    : Math.round(budgetAmount * 0.55);

  const remainingAccommodationBudget = Math.max(
    1500 * nights,
    budgetAmount - estimatedNonHotelSpend
  );
  const targetPerNight = Math.round(remainingAccommodationBudget / (nights * rooms));

  // Search Results
  const hotelResults = useMemo(() => {
    return searchHotelProviders({
      destination,
      checkIn: startDate,
      checkOut: endDate,
      nights,
      travellers,
      rooms,
      budgetAmount,
      plannedActivitySpend,
      itineraryItems,
      stayTypeFilter,
      budgetFilter
    });
  }, [
    destination,
    startDate,
    endDate,
    nights,
    travellers,
    rooms,
    budgetAmount,
    plannedActivitySpend,
    itineraryItems,
    stayTypeFilter,
    budgetFilter
  ]);

  const selectedHotelId = selectedAccommodation?.hotel?.id;

  return (
    <div className="space-y-6">
      {/* Top Banner: Context and Budget Headroom */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF8F5] border border-[#E7E2D9]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D9]">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-[#EBF2F1] text-[#1D4E4F] font-mono-meta text-xs font-semibold">
                Outstation Stay Recommendation
              </span>
              <span className="text-[#576574]">•</span>
              <span className="text-xs font-mono-meta text-[#576574]">
                {nights} {nights === 1 ? 'Night' : 'Nights'} ({formatDateRange(startDate, endDate)})
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#1A202C]">
              Find a Stay in {destination.split(',')[0].trim()}
            </h3>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="font-mono-meta text-[10px] text-[#576574] uppercase block">
              Estimated Stay Headroom
            </span>
            <span className="font-serif text-2xl font-bold text-[#1D4E4F]">
              {formatINR(remainingAccommodationBudget)}
            </span>
            <span className="block text-[11px] font-mono-meta text-[#576574]">
              (~{formatINR(targetPerNight)} / night target)
            </span>
          </div>
        </div>

        {/* Alternative: "I already have accommodation" toggle */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => {
                if (isAlreadyArranged) {
                  onClearAccommodation?.();
                } else {
                  onSetAlreadyArranged(customStayName || 'Self-arranged Stay');
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                isAlreadyArranged
                  ? 'bg-[#1D4E4F] text-white shadow-xs'
                  : 'bg-white border border-[#E7E2D9] text-[#1A202C] hover:border-[#1D4E4F]'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>
                {isAlreadyArranged ? '✓ I already have accommodation' : 'I already have accommodation'}
              </span>
            </button>

            {isAlreadyArranged && (
              <span className="text-xs font-mono-meta text-[#1D4E4F]">
                (Excluded from hotel recommendation requirement)
              </span>
            )}
          </div>

          <div className="text-xs text-[#576574] flex items-center space-x-1 font-mono-meta">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1D4E4F]" />
            <span>Bookings finalized on MakeMyTrip / external portals</span>
          </div>
        </div>

        {/* Input when "I already have accommodation" is active */}
        {isAlreadyArranged && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-[#1D4E4F]/30 animate-in fade-in duration-150">
            <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C] mb-1.5">
              Where are you staying? (Optional)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="e.g. Staying with friends, Airbnb in Old City, or booked separately"
                value={customStayName}
                onChange={(e) => setCustomStayName(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#E7E2D9] text-xs focus:outline-none focus:border-[#1D4E4F] bg-[#FAF8F5]"
              />
              <button
                type="button"
                onClick={() => onSetAlreadyArranged(customStayName || 'Self-arranged Stay')}
                className="px-4 py-2 rounded-xl bg-[#1D4E4F] text-white text-xs font-semibold hover:bg-[#153B3C] cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* If user hasn't chosen "I already have accommodation", show filters and recommendation list */}
      {!isAlreadyArranged && (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E7E2D9]">
            {/* Stay Type Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono-meta text-[#576574] mr-1 uppercase">Type:</span>
              {[
                { id: 'all', label: 'All Stays' },
                { id: 'hotel', label: 'Hotel' },
                { id: 'heritage haveli', label: 'Haveli' },
                { id: 'resort', label: 'Resort' },
                { id: 'homestay', label: 'Homestay' },
                { id: 'hostel', label: 'Hostel' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStayTypeFilter(st.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    stayTypeFilter === st.id
                      ? 'bg-[#1D4E4F] text-white'
                      : 'bg-[#FAF8F5] text-[#576574] hover:text-[#1A202C] border border-[#E7E2D9]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Budget Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono-meta text-[#576574] mr-1 uppercase">Budget:</span>
              {[
                { id: 'all', label: 'Any Price' },
                { id: 'under_1500', label: '< ₹1.5k' },
                { id: '1500_3000', label: '₹1.5k - ₹3k' },
                { id: '3000_5000', label: '₹3k - ₹5k' },
                { id: 'above_5000', label: '₹5k+' }
              ].map((bf) => (
                <button
                  key={bf.id}
                  type="button"
                  onClick={() => setBudgetFilter(bf.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    budgetFilter === bf.id
                      ? 'bg-[#1D4E4F] text-white'
                      : 'bg-[#FAF8F5] text-[#576574] hover:text-[#1A202C] border border-[#E7E2D9]'
                  }`}
                >
                  {bf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Selection Banner if a hotel is already selected */}
          {selectedAccommodation?.hotel && (
            <div className="p-4 rounded-2xl bg-[#EBF2F1] border border-[#1D4E4F]/30 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[#1D4E4F] shrink-0" />
                <div>
                  <span className="font-mono-meta text-[10px] text-[#1D4E4F] uppercase font-semibold block">
                    Currently Selected Stay
                  </span>
                  <span className="font-serif text-base font-bold text-[#1A202C]">
                    {selectedAccommodation.hotel.name}
                  </span>
                  <span className="text-xs text-[#576574] block">
                    {formatINR(selectedAccommodation.hotel.estimatedTotal)} estimated total ({nights} nights)
                  </span>
                </div>
              </div>

              {onClearAccommodation && (
                <button
                  type="button"
                  onClick={onClearAccommodation}
                  className="text-xs font-semibold text-[#576574] hover:text-[#D96B43] transition-colors cursor-pointer underline"
                >
                  Deselect
                </button>
              )}
            </div>
          )}

          {/* Hotel Cards List */}
          <div className="space-y-4">
            {hotelResults.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                nights={nights}
                rooms={rooms}
                remainingAccommodationBudget={remainingAccommodationBudget}
                isSelected={selectedHotelId === hotel.id}
                onSelect={onSelectHotel}
              />
            ))}
          </div>

          {/* Fallback External Direct Search */}
          <div className="p-6 rounded-3xl bg-white border border-[#E7E2D9] text-center space-y-3">
            <p className="text-xs text-[#576574]">
              Looking for more specific properties in {destination.split(',')[0].trim()}?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://www.makemytrip.com/hotels/hotel-listing/?searchText=${encodeURIComponent(destination.split(',')[0].trim())}&checkin=${startDate}&checkout=${endDate}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9] hover:border-[#1D4E4F] text-xs font-semibold text-[#1A202C]"
              >
                <span>Search all on MakeMyTrip</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination.split(',')[0].trim())}&checkin=${startDate}&checkout=${endDate}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9] hover:border-[#1D4E4F] text-xs font-semibold text-[#1A202C]"
              >
                <span>Search on Booking.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
