/**
 * Intelligent Replacement & Swap Service for TravelPilot
 *
 * When an itinerary stop is rejected (e.g. for being "too far away", "out of budget",
 * "crowded", or general mismatch), this engine provides context-aware replacement
 * candidates that:
 * 1. Minimize travel distance from preceding & following stops (especially when "too far away" is flagged)
 * 2. Prevent repetition with existing places in the itinerary
 * 3. Match the user's trip pace, budget, and concept vibe
 * 4. Allow user search or custom place specifications
 */

import { DESTINATION_CATALOGS, ActivityCandidate } from '../data/destinationCatalog';
import { calculateDistanceKm, getConceptMatchScore, findCityCoordinates } from './locationService';
import type { Trip, ItineraryItem, TripDay } from '../types';

export interface ReplacementCandidate {
  id: string;
  title: string;
  description: string;
  location: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  bestVisited: string;
  durationMinutes: number;
  estimatedCost: number;
  category?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  distanceSavedKm?: number;
  isCloser?: boolean;
  highlightNote?: string;
}

interface GetReplacementsOptions {
  trip: Trip;
  currentItem: ItineraryItem;
  dayIndex: number;
  customQuery?: string;
  categoryFilter?: string;
}

/**
 * Finds preceding stop coordinates for distance calculation
 */
function findAnchorCoordinates(
  days: TripDay[],
  dayIndex: number,
  currentItem: ItineraryItem,
  trip: Trip
): { latitude: number; longitude: number } | null {
  const currentDay = days.find((d) => d.dayIndex === dayIndex);
  if (currentDay && currentDay.items) {
    const currentIndex = currentDay.items.findIndex((i) => i.id === currentItem.id);

    // Look for previous item on same day with coordinates
    if (currentIndex > 0) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const prev = currentDay.items[i];
        if (prev.latitude !== undefined && prev.longitude !== undefined) {
          return { latitude: prev.latitude, longitude: prev.longitude };
        }
      }
    }

    // Otherwise look for next item on same day with coordinates
    if (currentIndex < currentDay.items.length - 1) {
      for (let i = currentIndex + 1; i < currentDay.items.length; i++) {
        const next = currentDay.items[i];
        if (next.latitude !== undefined && next.longitude !== undefined) {
          return { latitude: next.latitude, longitude: next.longitude };
        }
      }
    }
  }

  // Fallback to trip locationContext
  if (trip.locationContext?.latitude && trip.locationContext?.longitude) {
    return {
      latitude: trip.locationContext.latitude,
      longitude: trip.locationContext.longitude
    };
  }

  // Fallback to city coordinates
  const cityCoords = findCityCoordinates(trip.destination);
  if (cityCoords) return cityCoords;

  return null;
}

export function getSmartReplacements({
  trip,
  currentItem,
  dayIndex,
  customQuery = '',
  categoryFilter = ''
}: GetReplacementsOptions): ReplacementCandidate[] {
  const days = trip.days || [];

  // 1. Identify destination city catalog key
  const destLower = trip.destination.toLowerCase();
  let cityKey = Object.keys(DESTINATION_CATALOGS).find((key) =>
    destLower.includes(key) || destLower.includes(DESTINATION_CATALOGS[key].city.toLowerCase())
  );

  // Default fallback if catalog not matched
  const catalog = cityKey ? DESTINATION_CATALOGS[cityKey] : null;

  // 2. Collect all place titles and IDs already in the trip to avoid repetition
  const usedPlaceIds = new Set<string>();
  const usedTitles = new Set<string>();

  // Add all excludedPlaceIds from the trip
  (trip.excludedPlaceIds || []).forEach((id) => usedPlaceIds.add(id));

  // Also respect trip category constraints
  const excludedCategories = new Set(
    (trip.constraints || [])
      .filter((c) => c.type === 'category')
      .map((c) => (c.category || '').toLowerCase())
      .filter(Boolean)
  );

  days.forEach((d) => {
    d.items.forEach((item) => {
      if (item.id !== currentItem.id) {
        usedPlaceIds.add(item.id);
        if (item.placeId) usedPlaceIds.add(item.placeId);
        usedTitles.add(item.title.toLowerCase());
      }
    });
  });

  // Current item's rejection reason characteristics
  const reasonText = (currentItem.rejectionReason || '').toLowerCase();
  const isDistanceConcern =
    reasonText.includes('far') ||
    reasonText.includes('distance') ||
    reasonText.includes('transit') ||
    reasonText.includes('travel time');
  const isBudgetConcern =
    reasonText.includes('expensive') ||
    reasonText.includes('budget') ||
    reasonText.includes('cost');

  // Anchor coordinates for proximity calculation
  const anchor = findAnchorCoordinates(days, dayIndex, currentItem, trip);
  const currentItemDistance = currentItem.distanceKm ?? 10;

  // 3. Pool candidates
  let rawPool: ActivityCandidate[] = [];

  if (catalog) {
    rawPool = [...catalog.places, ...catalog.freeAlternatives];
  } else {
    // Procedural fallback places for the destination
    const dest = trip.destination;
    const cityCoords = findCityCoordinates(dest);
    const fallbackBestVisited: 'Morning' | 'Afternoon' | 'Evening' =
      currentItem.timeSlot === 'morning'
        ? 'Morning'
        : currentItem.timeSlot === 'evening'
        ? 'Evening'
        : 'Afternoon';
    const bestVisitedVal =
      (currentItem.bestVisited as 'Morning' | 'Afternoon' | 'Evening') || fallbackBestVisited;

    rawPool = [
      {
        id: `proc-rep-1`,
        title: `Central Heritage Promenade & Landmark Walk`,
        description: `Explore historic avenues, civic architecture, and lively public squares in the heart of ${dest}.`,
        location: `Central District, ${dest}`,
        timeSlot: currentItem.timeSlot,
        bestVisited: bestVisitedVal,
        durationMinutes: 90,
        estimatedCost: 100,
        category: 'Heritage Walk',
        ...(cityCoords ? { latitude: cityCoords.latitude + 0.005, longitude: cityCoords.longitude + 0.005 } : {})
      },
      {
        id: `proc-rep-2`,
        title: `Artisanal Coffeehouse & Local Street Eats`,
        description: `Relax with specialty regional brews, artisan pastries, and vibrant community atmosphere.`,
        location: `Old Quarter, ${dest}`,
        timeSlot: currentItem.timeSlot,
        bestVisited: bestVisitedVal,
        durationMinutes: 75,
        estimatedCost: 200,
        category: 'Food & Cafes',
        ...(cityCoords ? { latitude: cityCoords.latitude - 0.004, longitude: cityCoords.longitude + 0.003 } : {})
      },
      {
        id: `proc-rep-3`,
        title: `Public Botanical Sanctuary & Shaded Walkway`,
        description: `Unwind amid manicured flowerbeds, heritage canopy trees, and quiet pedestrian pathways.`,
        location: `City Greenbelt, ${dest}`,
        timeSlot: currentItem.timeSlot,
        bestVisited: bestVisitedVal,
        durationMinutes: 60,
        estimatedCost: 50,
        category: 'Gardens & Nature',
        ...(cityCoords ? { latitude: cityCoords.latitude + 0.008, longitude: cityCoords.longitude - 0.004 } : {})
      },
      {
        id: `proc-rep-4`,
        title: `Traditional Crafts Bazaar & Spice Lane`,
        description: `Stroll through vibrant artisan stalls showcasing indigenous textiles, terracotta, and regional aromas.`,
        location: `Market Square, ${dest}`,
        timeSlot: currentItem.timeSlot,
        bestVisited: bestVisitedVal,
        durationMinutes: 90,
        estimatedCost: 150,
        category: 'Bazaars & Crafts',
        ...(cityCoords ? { latitude: cityCoords.latitude - 0.006, longitude: cityCoords.longitude - 0.005 } : {})
      }
    ];
  }

  // Filter out places already used elsewhere in trip, or identical to currentItem
  let available = rawPool.filter(
    (p) =>
      p.id !== currentItem.id &&
      !usedPlaceIds.has(p.id) &&
      !usedTitles.has(p.title.toLowerCase()) &&
      p.title.toLowerCase() !== currentItem.title.toLowerCase()
  );

  // Filter by query if user searched
  if (customQuery.trim()) {
    const q = customQuery.toLowerCase();
    available = available.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  // Filter by category if selected
  if (categoryFilter) {
    available = available.filter(
      (p) =>
        (p.category && p.category.toLowerCase().includes(categoryFilter.toLowerCase())) ||
        (p.tags && p.tags.includes(categoryFilter.toLowerCase()))
    );
  }

  // 4. Score and enrich candidates
  const scored = available.map((candidate) => {
    let distanceKm: number | undefined = undefined;
    let distanceSavedKm: number | undefined = undefined;
    let isCloser = false;
    let proximityScore = 0;

    if (anchor && candidate.latitude !== undefined && candidate.longitude !== undefined) {
      distanceKm = calculateDistanceKm(
        anchor.latitude,
        anchor.longitude,
        candidate.latitude,
        candidate.longitude
      );
      distanceKm = Math.round(distanceKm * 10) / 10;

      if (distanceKm < currentItemDistance) {
        isCloser = true;
        distanceSavedKm = Math.round((currentItemDistance - distanceKm) * 10) / 10;
      }

      // Stronger proximity score if user rejected for being too far
      const distanceMultiplier = isDistanceConcern ? 4.0 : 2.0;
      proximityScore = Math.max(0, 60 - distanceKm * distanceMultiplier);
    }

    // Time slot match bonus
    const slotBonus = candidate.timeSlot === currentItem.timeSlot ? 25 : 5;

    // Concept and interests match
    const conceptScore = getConceptMatchScore(candidate, trip.conceptTitle, trip.interests);

    // Budget match bonus
    let budgetScore = 15;
    if (isBudgetConcern) {
      if (candidate.estimatedCost === 0) budgetScore = 40;
      else if (candidate.estimatedCost < currentItem.estimatedCost) budgetScore = 30;
    }

    let highlightNote = '';
    if (isCloser && distanceSavedKm && distanceSavedKm >= 1) {
      highlightNote = `~${distanceSavedKm} km closer than ${currentItem.title.split(' ')[0]}`;
    } else if (candidate.estimatedCost === 0) {
      highlightNote = 'Free cultural alternative';
    } else if (candidate.category) {
      highlightNote = candidate.category;
    }

    const totalScore =
      conceptScore * 1.5 +
      proximityScore +
      slotBonus +
      budgetScore +
      (isCloser ? 35 : 0);

    const result: ReplacementCandidate = {
      id: candidate.id,
      title: candidate.title,
      description: candidate.description,
      location: candidate.location,
      timeSlot: candidate.timeSlot || currentItem.timeSlot,
      bestVisited: candidate.bestVisited || currentItem.bestVisited,
      durationMinutes: candidate.durationMinutes || currentItem.durationMinutes || 75,
      estimatedCost: candidate.estimatedCost,
      category: candidate.category,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      distanceKm,
      distanceSavedKm,
      isCloser,
      highlightNote
    };

    return { candidate: result, totalScore };
  });

  // Sort descending by total score
  scored.sort((a, b) => b.totalScore - a.totalScore);

  return scored.slice(0, 6).map((s) => s.candidate);
}

/**
 * Creates a partial ItineraryItem from a custom user-defined place
 */
export function buildCustomReplacement(
  currentItem: ItineraryItem,
  custom: {
    title: string;
    location: string;
    estimatedCost: number;
    description?: string;
    category?: string;
  },
  destinationCity: string
): Partial<ItineraryItem> {
  const cityCoords = findCityCoordinates(destinationCity);

  return {
    title: custom.title.trim(),
    description:
      custom.description?.trim() ||
      `Custom selected stop in ${destinationCity} tailored to your spontaneous preferences.`,
    location: custom.location.trim() || `${destinationCity}`,
    estimatedCost: Math.max(0, Number(custom.estimatedCost) || 0),
    category: custom.category?.trim() || 'Custom Stop',
    durationMinutes: currentItem.durationMinutes || 75,
    timeSlot: currentItem.timeSlot,
    bestVisited: currentItem.bestVisited,
    isRejected: false,
    rejectionReason: undefined,
    isOverBudget: false,
    alternativeSuggestion: undefined,
    ...(cityCoords ? { latitude: cityCoords.latitude, longitude: cityCoords.longitude } : {})
  };
}
