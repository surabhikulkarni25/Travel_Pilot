/**
 * Intelligent Itinerary Generation Engine for TravelPilot
 *
 * This service forwards directly to the Central Itinerary Intelligence Engine
 * in `src/services/itineraryEngine.ts`, ensuring a single source of truth across
 * Plan a Trip, Surprise Me, Reject/Swap, and Assistant interactions.
 */

import {
  generatePlan,
  generatePlanSync,
  validateItinerary,
  repairItinerary,
  getAvailableCandidates,
  generateSmartBackups,
  answerTripAssistantQuestion
} from './itineraryEngine';
import { calculateCalendarDays } from '../utils/date';
import type { TripDay, TripFormData, GeneratePlanParams } from '../types';

export {
  generatePlan,
  generatePlanSync,
  validateItinerary,
  repairItinerary,
  getAvailableCandidates,
  generateSmartBackups,
  answerTripAssistantQuestion
};

/**
 * Backwards-compatible synchronous generator wrapper
 */
export function generateStructuredItinerary(formData: TripFormData): TripDay[] {
  const duration = Math.max(1, calculateCalendarDays(formData.startDate, formData.endDate));
  const planParams: GeneratePlanParams = {
    destination: formData.destination,
    destinationType: formData.destinationType,
    startDate: formData.startDate,
    endDate: formData.endDate,
    duration,
    budget: formData.budgetAmount,
    travellers: formData.travelerCount,
    groupType: formData.groupType,
    pace: formData.pace,
    activityLevel: formData.activityLevel,
    interests: formData.interests,
    conceptTitle: formData.conceptTitle,
    locationContext: formData.locationContext,
    constraints: formData.constraints,
    excludedPlaceIds: formData.excludedPlaceIds,
    scope: 'full-trip'
  };

  return generatePlanSync(planParams);
}
