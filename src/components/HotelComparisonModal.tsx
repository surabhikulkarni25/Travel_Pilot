import { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  Users,
  MapPin,
  Check,
  Search
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import { buildHotelGoogleSearchUrl } from '../services/hotelProviderService';
import type { HotelOption, ProviderOffer } from '../types';

interface HotelComparisonModalProps {
  hotel: HotelOption;
  nights: number;
  rooms: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectStay?: (hotel: HotelOption) => void;
  isSelected?: boolean;
}

export function HotelComparisonModal({
  hotel,
  nights,
  rooms,
  isOpen,
  onClose,
  onSelectStay,
  isSelected = false
}: HotelComparisonModalProps) {
  const [redirectNoticeProvider, setRedirectNoticeProvider] = useState<string | null>(null);

  if (!isOpen) return null;

  const googleSearchUrl = buildHotelGoogleSearchUrl(hotel);

  const handleOpenProvider = (offer: ProviderOffer) => {
    setRedirectNoticeProvider(offer.provider);
    window.open(offer.bookingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E7E2D9] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-[#E7E2D9] flex items-start justify-between gap-4 bg-[#FAF8F5]">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-[#EBF2F1] text-[#1D4E4F] font-mono-meta text-xs font-semibold">
                {hotel.stayType}
              </span>
              {hotel.userRating && (
                <span className="font-mono-meta text-xs font-semibold text-[#1A202C]">
                  ★ {hotel.userRating} ({hotel.reviewCount} reviews)
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A202C]">
              {hotel.name}
            </h2>
            <p className="text-xs text-[#576574] mt-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[#1D4E4F] shrink-0" />
              <span>{hotel.address}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#576574] hover:text-[#1A202C] hover:bg-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info & Redirection Disclaimer Banner */}
        <div className="p-6 sm:p-7 space-y-6">
          <div className="p-4 rounded-2xl bg-[#EBF2F1] border border-[#1D4E4F]/20 text-[#1D4E4F] text-xs leading-relaxed flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#1D4E4F]" />
            <div>
              <strong className="block font-semibold mb-0.5 text-[#1D4E4F]">
                External Booking Redirection • TravelPilot is Not an OTA
              </strong>
              <span>
                TravelPilot discovers and compares rates to keep your trip within budget. When you click to book, you will be redirected to the provider's official portal (e.g. MakeMyTrip, Booking.com) to complete your transaction securely. We do not store credit card details or collect booking fees.
              </span>
            </div>
          </div>

          {/* Stay Specs Summary */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] text-xs font-mono-meta">
            <div>
              <span className="text-[#576574] text-[10px] uppercase block">Stay Duration</span>
              <strong className="text-[#1A202C] font-semibold">{nights} {nights === 1 ? 'Night' : 'Nights'}</strong>
            </div>
            <div>
              <span className="text-[#576574] text-[10px] uppercase block">Accommodations</span>
              <strong className="text-[#1A202C] font-semibold">{rooms} {rooms === 1 ? 'Room' : 'Rooms'}</strong>
            </div>
            <div>
              <span className="text-[#576574] text-[10px] uppercase block">Itinerary Proximity</span>
              <strong className="text-[#1D4E4F] font-semibold">~{hotel.distanceToItineraryKm || 2.5} km</strong>
            </div>
          </div>

          {/* Provider Comparison Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A202C]">
                  Compare Provider Rates
                </h3>
                <span className="font-mono-meta text-[10px] text-[#576574] uppercase">
                  Estimated Reference Rates (INR)
                </span>
              </div>

              <a
                href={googleSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#E7E2D9] hover:border-[#1D4E4F] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#1A202C] transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                title="Search hotel details, photos, and reviews on Google"
              >
                <Search className="w-3.5 h-3.5 text-[#1D4E4F]" />
                <span>Check on Google</span>
                <ExternalLink className="w-3 h-3 text-[#576574]" />
              </a>
            </div>

            <div className="space-y-3">
              {hotel.providerOffers.map((offer) => (
                <div
                  key={offer.provider}
                  className="p-4 rounded-2xl border border-[#E7E2D9] hover:border-[#1D4E4F] bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#1A202C]">
                        {offer.provider}
                      </span>
                      {offer.availability && (
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E7E2D9] text-[10px] font-mono-meta text-[#576574]">
                          {offer.availability}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#576574]">
                      {offer.roomType || hotel.roomType || 'Standard Room'}
                    </p>

                    {offer.cancellationPolicy && (
                      <p className="text-[11px] text-[#1D4E4F] flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-[#1D4E4F] shrink-0" />
                        <span>{offer.cancellationPolicy}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E7E2D9]">
                    <div className="text-right">
                      <div className="font-serif text-lg font-bold text-[#1A202C]">
                        {formatINR(offer.pricePerNight)}
                        <span className="text-xs font-normal text-[#576574] font-mono-meta"> / night</span>
                      </div>
                      <div className="text-[11px] font-mono-meta text-[#576574]">
                        {formatINR(offer.estimatedTotal)} total ({nights}N)
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenProvider(offer)}
                      className="px-4 py-2 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <span>View on {offer.provider.split('.')[0]}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {redirectNoticeProvider && (
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9] text-xs text-[#576574] flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#1D4E4F] shrink-0" />
              <span>
                Redirected to <strong>{redirectNoticeProvider}</strong> in a new browser tab. Remember to complete your booking there!
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-[#E7E2D9] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#E7E2D9] text-xs font-semibold text-[#576574] hover:bg-white transition-colors cursor-pointer"
            >
              Close
            </button>

            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-[#E7E2D9] hover:border-[#1D4E4F] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#1A202C] transition-colors cursor-pointer"
              title="Search hotel details, photos, and reviews on Google"
            >
              <Search className="w-3.5 h-3.5 text-[#1D4E4F]" />
              <span>Check on Google</span>
              <ExternalLink className="w-3 h-3 text-[#576574]" />
            </a>
          </div>

          {onSelectStay && (
            <button
              type="button"
              onClick={() => {
                onSelectStay(hotel);
                onClose();
              }}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#EBF2F1] text-[#1D4E4F] border border-[#1D4E4F]'
                  : 'bg-[#1D4E4F] text-white hover:bg-[#153B3C]'
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Selected for Itinerary</span>
                </>
              ) : (
                <>
                  <Building className="w-4 h-4" />
                  <span>Select This Stay for Trip</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
