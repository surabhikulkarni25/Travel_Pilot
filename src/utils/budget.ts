import type { Trip, TripDay, TripAccommodation } from '../types';

/**
 * Computes the total accommodation cost for a trip.
 * Supports selected hotel with estimatedTotal, nightly rate * nights * rooms,
 * and custom self-arranged accommodation estimates.
 */
export function getTripAccommodationCost(accommodation?: TripAccommodation | null): number {
  if (!accommodation) return 0;

  if (accommodation.status === 'already-arranged') {
    return accommodation.customStayDetails?.estimatedCost || 0;
  }

  if (accommodation.hotel) {
    if (typeof accommodation.hotel.estimatedTotal === 'number' && accommodation.hotel.estimatedTotal > 0) {
      return accommodation.hotel.estimatedTotal;
    }
    const pricePerNight = accommodation.hotel.pricePerNight || 0;
    const nights = Math.max(1, accommodation.nights || 1);
    const rooms = Math.max(1, accommodation.rooms || 1);
    return pricePerNight * nights * rooms;
  }

  return 0;
}

/**
 * Computes the total activities cost across all trip days,
 * accounting for traveller count and ignoring rejected or unavailable items.
 */
export function getTripActivitiesCost(days?: TripDay[] | null, travelerCount: number = 1): number {
  if (!days || days.length === 0) return 0;
  const travellers = Math.max(1, travelerCount);

  return days.reduce((acc, d) => {
    return (
      acc +
      (d.items || []).reduce((sum, item) => {
        if (item.isRejected || item.status === 'unavailable' || item.isSkipped || item.status === 'skipped') return sum;
        return sum + (item.estimatedCost || 0) * travellers;
      }, 0)
    );
  }, 0);
}

export interface TripBudgetBreakdown {
  targetBudget: number;
  activitiesCost: number;
  accommodationCost: number;
  totalPlannedSpend: number;
  remainingBudget: number;
  isBudgetExceeded: boolean;
  isBudgetTight: boolean;
  utilizationPercentage: number;
  dailyAverageSpend: number;
}

/**
 * Returns a comprehensive, single-source-of-truth budget breakdown for a trip.
 */
export function calculateTripBudget(trip: Trip): TripBudgetBreakdown {
  const targetBudget = Number(trip.budgetAmount) || 0;
  const travelerCount = Math.max(1, trip.travelerCount || 1);
  const activitiesCost = getTripActivitiesCost(trip.days, travelerCount);
  const accommodationCost = getTripAccommodationCost(trip.accommodation);
  const totalPlannedSpend = activitiesCost + accommodationCost;
  const remainingBudget = targetBudget - totalPlannedSpend;
  const isBudgetExceeded = remainingBudget < 0;
  const isBudgetTight = !isBudgetExceeded && remainingBudget < targetBudget * 0.15;
  const utilizationPercentage = targetBudget > 0 ? Math.round((totalPlannedSpend / targetBudget) * 100) : 0;

  const totalDays = trip.days?.length || 1;
  const dailyAverageSpend = totalDays > 0 ? Math.round(totalPlannedSpend / totalDays) : totalPlannedSpend;

  return {
    targetBudget,
    activitiesCost,
    accommodationCost,
    totalPlannedSpend,
    remainingBudget,
    isBudgetExceeded,
    isBudgetTight,
    utilizationPercentage,
    dailyAverageSpend
  };
}
