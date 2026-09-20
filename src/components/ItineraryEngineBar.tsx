import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Coins,
  CheckCircle2,
  XCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { validateItinerary } from '../services/itineraryEngine';
import { formatINR } from '../utils/currency';
import { getTripAccommodationCost } from '../utils/budget';
import type { Trip, ValidationResult, ItineraryConflict } from '../types';

interface ItineraryEngineBarProps {
  trip: Trip;
  onAutoRepair: () => Promise<void>;
  isRepairing?: boolean;
}

export function ItineraryEngineBar({
  trip,
  onAutoRepair,
  isRepairing = false
}: ItineraryEngineBarProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [repairNotice, setRepairNotice] = useState<string | null>(null);

  const accommodationCost = getTripAccommodationCost(trip.accommodation);

  // Compute live validation metrics using the central engine
  const validation: ValidationResult = useMemo(() => {
    return validateItinerary(trip.days || [], {
      budgetAmount: trip.budgetAmount,
      travelerCount: trip.travelerCount || 1,
      excludedPlaceIds: trip.excludedPlaceIds || [],
      constraints: trip.constraints || [],
      accommodationCost
    });
  }, [trip.days, trip.budgetAmount, trip.travelerCount, trip.excludedPlaceIds, trip.constraints, accommodationCost]);

  const conflicts = validation.conflicts || [];
  const constraints = trip.constraints || [];
  const excludedPlaces = trip.excludedPlaceIds || [];

  const handleRepairClick = async () => {
    try {
      setRepairNotice(null);
      await onAutoRepair();
      setRepairNotice('Itinerary successfully repaired and synchronized with all constraints.');
      setTimeout(() => setRepairNotice(null), 5000);
    } catch (err) {
      console.error('Repair failed:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E7E2D9] shadow-xs p-5 sm:p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Status */}
        <div className="flex items-start space-x-3.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              validation.valid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {validation.valid ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono-meta text-[11px] uppercase tracking-wider font-semibold text-[#1D4E4F]">
                Engine Health & Constraints
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-mono-meta text-[10px] font-bold ${
                  validation.valid
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {validation.valid ? 'Validated & Compliant' : `${conflicts.length} Constraint Conflict(s)`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#576574] mt-1">
              <span>
                Spend: <strong className="text-[#1A202C]">{formatINR(validation.totalCost)}</strong> of{' '}
                {formatINR(trip.budgetAmount)}
              </span>
              <span>•</span>
              <span>
                Remaining Headroom:{' '}
                <strong
                  className={
                    validation.budgetRemaining >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }
                >
                  {formatINR(validation.budgetRemaining)}
                </strong>
              </span>
              {constraints.length > 0 && (
                <>
                  <span>•</span>
                  <span>{constraints.length} Active Constraint(s)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Action */}
        <div className="flex items-center space-x-2.5 self-end md:self-center">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF2F1] text-xs font-semibold text-[#1A202C] border border-[#E7E2D9] transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#576574]" />
            <span>{showDetails ? 'Hide Details' : 'View Constraints'}</span>
            {showDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {!validation.valid && (
            <button
              type="button"
              onClick={handleRepairClick}
              disabled={isRepairing}
              className="px-4 py-2 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
              <span>{isRepairing ? 'Repairing...' : 'Auto-Repair Conflicts'}</span>
            </button>
          )}
        </div>
      </div>

      {repairNotice && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{repairNotice}</span>
        </div>
      )}

      {/* Accordion Details */}
      {showDetails && (
        <div className="mt-5 pt-4 border-t border-[#E7E2D9] space-y-4 text-xs">
          {/* Active Conflicts */}
          {conflicts.length > 0 && (
            <div>
              <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#D96B43] font-bold block mb-2">
                Active Conflicts Requiring Attention:
              </span>
              <div className="space-y-2">
                {conflicts.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#F9EFEA] border border-[#D96B43]/30 text-[#1A202C] flex items-start space-x-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#D96B43] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{c.message}</span>
                      <p className="text-[#576574] text-[11px] mt-0.5">
                        Type: <code className="font-mono">{c.type}</code>
                        {c.dayIndex ? ` • Day ${c.dayIndex}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Constraints & Exclusions */}
          {constraints.length > 0 ? (
            <div>
              <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#576574] font-semibold block mb-2">
                Stored Constraints & Exclusions:
              </span>
              <div className="flex flex-wrap gap-2">
                {constraints.map((c) => (
                  <div
                    key={c.id}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9] text-[#1A202C] text-[11px] flex items-center space-x-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D4E4F]" />
                    <span>
                      <strong>{c.type.toUpperCase()}:</strong> {c.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[#576574] text-xs">
              No manual exclusions stored yet. When you reject any activity, the engine automatically records the reason as a persistent constraint so it is never re-recommended.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
