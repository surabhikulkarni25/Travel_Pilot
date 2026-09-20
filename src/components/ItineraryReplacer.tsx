import { useState, useMemo } from 'react';
import {
  RotateCcw,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Landmark,
  Utensils,
  Trees,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import {
  getSmartReplacements,
  buildCustomReplacement,
  ReplacementCandidate
} from '../services/replacementService';
import type { Trip, ItineraryItem } from '../types';

interface ItineraryReplacerProps {
  trip: Trip;
  dayIndex: number;
  currentItem: ItineraryItem;
  onSwap: (newItemData: Partial<ItineraryItem>) => Promise<void>;
  onCancel?: () => void;
  compact?: boolean;
}

export function ItineraryReplacer({
  trip,
  dayIndex,
  currentItem,
  onSwap,
  onCancel,
  compact = false
}: ItineraryReplacerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [customCost, setCustomCost] = useState<number>(100);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic candidates computed based on trip context, previous stops, and feedback
  const candidates = useMemo(() => {
    return getSmartReplacements({
      trip,
      currentItem,
      dayIndex,
      customQuery: searchQuery,
      categoryFilter: selectedCategory
    });
  }, [trip, currentItem, dayIndex, searchQuery, selectedCategory]);

  const handleSelectCandidate = async (candidate: ReplacementCandidate) => {
    setSwappingId(candidate.id);
    setErrorMessage(null);
    try {
      await onSwap({
        title: candidate.title,
        description: candidate.description,
        location: candidate.location,
        estimatedCost: candidate.estimatedCost,
        category: candidate.category || currentItem.category,
        durationMinutes: candidate.durationMinutes,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        distanceKm: candidate.distanceKm,
        isRejected: false,
        rejectionReason: undefined,
        isOverBudget: false,
        alternativeSuggestion: undefined
      });
    } catch (err) {
      console.error('Failed to swap candidate:', err);
      setErrorMessage('Failed to replace stop. Please try again.');
    } finally {
      setSwappingId(null);
    }
  };

  const handleApplyCustomPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      setErrorMessage('Please enter a place name.');
      return;
    }

    setSwappingId('custom-place');
    setErrorMessage(null);
    try {
      const customData = buildCustomReplacement(
        currentItem,
        {
          title: customTitle,
          location: customLocation.trim() || trip.destination,
          estimatedCost: customCost,
          category: 'Personal Choice'
        },
        trip.destination
      );

      await onSwap(customData);
    } catch (err) {
      console.error('Failed to apply custom place:', err);
      setErrorMessage('Failed to add custom place. Please try again.');
    } finally {
      setSwappingId(null);
    }
  };

  const isTooFar =
    currentItem.rejectionReason?.toLowerCase().includes('far') ||
    currentItem.rejectionReason?.toLowerCase().includes('distance');

  return (
    <div
      id={`replacer-${currentItem.id}`}
      className="mt-4 p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#1D4E4F]/25 shadow-xs text-left"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E7E2D9]">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center shrink-0 mt-0.5">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono-meta text-[11px] uppercase tracking-wider font-semibold text-[#1D4E4F]">
                Replacement Engine
              </span>
              {isTooFar && (
                <span className="px-2 py-0.5 rounded-full bg-[#EBF2F1] text-[#1D4E4F] text-[10px] font-mono-meta font-bold">
                  Proximity Prioritized
                </span>
              )}
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A202C]">
              Replace {currentItem.timeSlot.charAt(0).toUpperCase() + currentItem.timeSlot.slice(1)} Stop
            </h3>
            <p className="text-xs text-[#576574] mt-0.5">
              {isTooFar
                ? `Showing closer spots in ${trip.destination.split(',')[0]} to reduce transit and eliminate backtracking.`
                : `Choose a curated alternative matching your preferences, or provide a specific place you want.`}
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-[#576574] hover:text-[#1A202C] font-semibold self-end sm:self-auto cursor-pointer"
          >
            Dismiss
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-[#F9EFEA] border border-[#D96B43]/30 text-xs text-[#D96B43]">
          {errorMessage}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#576574] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search places or vibes in ${trip.destination.split(',')[0]}...`}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#1D4E4F] bg-[#FAF8F5] text-[#1A202C]"
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { label: 'All Places', value: '' },
            { label: 'Heritage', value: 'heritage' },
            { label: 'Cafes & Food', value: 'food' },
            { label: 'Nature', value: 'nature' }
          ].map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-[#1D4E4F] text-white border-[#1D4E4F]'
                  : 'bg-[#FAF8F5] text-[#576574] border-[#E7E2D9] hover:border-[#1D4E4F]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Candidates List */}
      <div className="mt-4 space-y-3">
        {candidates.length > 0 ? (
          candidates.map((candidate) => {
            const isSelected = swappingId === candidate.id;
            return (
              <div
                key={candidate.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  candidate.isCloser
                    ? 'bg-[#FAF8F5] border-[#1D4E4F]/30 hover:border-[#1D4E4F]'
                    : 'bg-white border-[#E7E2D9] hover:border-[#1D4E4F]'
                }`}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {candidate.category && (
                      <span className="px-2 py-0.5 rounded-md bg-[#EBF2F1] text-[#1D4E4F] font-mono-meta text-[10px] font-semibold">
                        {candidate.category}
                      </span>
                    )}

                    {candidate.isCloser && candidate.distanceSavedKm && candidate.distanceSavedKm > 0.5 && (
                      <span className="px-2 py-0.5 rounded-md bg-[#EBF2F1] text-[#1D4E4F] font-mono-meta text-[10px] font-bold">
                        ⚡ ~{candidate.distanceSavedKm} km closer
                      </span>
                    )}

                    {candidate.distanceKm !== undefined && (
                      <span className="text-[11px] font-mono-meta text-[#576574]">
                        ~{candidate.distanceKm} km away
                      </span>
                    )}

                    <span className="text-[11px] font-mono-meta font-semibold text-[#1D4E4F]">
                      {candidate.estimatedCost > 0 ? formatINR(candidate.estimatedCost) : 'Free / Included'}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-[#1A202C]">
                    {candidate.title}
                  </h4>

                  <p className="text-xs text-[#576574] mt-1 line-clamp-2 leading-relaxed">
                    {candidate.description}
                  </p>

                  <div className="flex items-center space-x-1.5 text-[11px] text-[#576574] mt-2">
                    <MapPin className="w-3.5 h-3.5 text-[#D96B43] shrink-0" />
                    <span className="truncate">{candidate.location}</span>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center w-full sm:w-auto mt-2 sm:mt-0">
                  <button
                    type="button"
                    onClick={() => handleSelectCandidate(candidate)}
                    disabled={Boolean(swappingId)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <span>{isSelected ? 'Applying...' : 'Select & Replace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] text-center">
            <p className="text-xs text-[#576574]">
              No direct catalog match found for "{searchQuery}". You can enter any custom place below!
            </p>
          </div>
        )}
      </div>

      {/* Accordion: Provide a specific place which the user wants */}
      <div className="mt-5 pt-4 border-t border-[#E7E2D9]">
        <button
          type="button"
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className="w-full flex items-center justify-between text-xs font-semibold text-[#1D4E4F] hover:underline cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Have a specific place in mind? Enter your preferred spot</span>
          </div>
          {isCustomOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isCustomOpen && (
          <form onSubmit={handleApplyCustomPlace} className="mt-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono-meta text-[#576574] mb-1 font-semibold">
                  Place or Activity Name *
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. German Bakery Koregaon Park or Osho Garden"
                  required
                  className="w-full p-2 text-xs rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#1D4E4F] bg-white text-[#1A202C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-meta text-[#576574] mb-1 font-semibold">
                  Specific Location / Area (Optional)
                </label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder={`e.g. Koregaon Park, ${trip.destination.split(',')[0]}`}
                  className="w-full p-2 text-xs rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#1D4E4F] bg-white text-[#1A202C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono-meta text-[#576574] mb-1 font-semibold">
                  Estimated Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={customCost}
                  onChange={(e) => setCustomCost(Number(e.target.value))}
                  className="w-full p-2 text-xs rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#1D4E4F] bg-white text-[#1A202C]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={swappingId === 'custom-place' || !customTitle.trim()}
                  className="w-full py-2 px-4 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{swappingId === 'custom-place' ? 'Adding to Trip...' : 'Use This Custom Place'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
