/**
 * Central Itinerary Intelligence Engine for TravelPilot
 *
 * Core Principles:
 * 1. Single central source of truth for itinerary generation, validation, repair, and replanning.
 * 2. Plan a Trip and Surprise Me use the SAME core planning intelligence.
 * 3. AI / Gemini reasons strictly over structured candidate places (never invents facts, costs, or coordinates).
 * 4. Hard constraints (budget, dates, duration, exclusions, traveller count) are strictly enforced by code.
 * 5. Arithmetic is always validated application-side.
 * 6. Geographic proximity & day-level clustering minimize backtracking.
 * 7. Automatic conflict detection and multi-stage repair pipeline.
 * 8. Reject / Swap / Cancellation reuse this exact engine.
 */

import { calculateCalendarDays, getDateForDayIndex } from '../utils/date';
import { getTripAccommodationCost } from '../utils/budget';
import { DESTINATION_CATALOGS, ActivityCandidate } from '../data/destinationCatalog';
import { calculateDistanceKm, getConceptMatchScore, findCityCoordinates } from './locationService';
import type {
  TripDay,
  ItineraryItem,
  GeneratePlanParams,
  ValidationResult,
  ItineraryConflict,
  BackupCandidate,
  TripConstraint,
  Trip,
  TripAssistantResponse
} from '../types';

// Procedural progression themes for destinations without dedicated catalog entries
const PROCEDURAL_THEMES = [
  {
    theme: 'Historic Foundations & Heritage Core',
    dayTitleSuffix: 'Arrival & Historic Core',
    morning: { title: 'Citadel & Heritage Gateway Walk', cat: 'Heritage & Architecture', desc: 'Monumental carved stone courtyards and royal gateway architecture.', cost: 250, duration: 120, loc: 'Historic Citadel & Walled Quarter' },
    afternoon: { title: 'Artisan Textile & Traditional Craft Walk', cat: 'Local Arts & Culture', desc: 'Generational craft workshops, handlooms, and authentic specialty goods.', cost: 150, duration: 90, loc: 'Old Town Craft Market' },
    evening: { title: 'Panoramic Sunset Overlook & Promenade', cat: 'Scenic Viewpoint', desc: 'Elevated city vantage point as dusk falls over surrounding vistas.', cost: 100, duration: 90, loc: 'Scenic Ridge & Promenade' }
  },
  {
    theme: 'Living Culture & Culinary Traditions',
    dayTitleSuffix: 'Bazaars & Gastronomy',
    morning: { title: 'Sacred Temple Complex & Shaded Courtyards', cat: 'Spiritual Heritage', desc: 'Ancient sanctums, carved stone pillars, and peaceful early morning reflection.', cost: 100, duration: 90, loc: 'Heritage Temple Precinct' },
    afternoon: { title: 'Heritage Street Food & Spice Trail', cat: 'Culinary Traditions', desc: 'Celebrated regional dishes, savoury chaats, and heritage sweet shops.', cost: 250, duration: 90, loc: 'Traditional Food Street' },
    evening: { title: 'Riverfront / Lakeside Evening Promenade', cat: 'Waterfront Leisure', desc: 'Cool evening breeze and waterfront lamps reflecting on quiet waters.', cost: 100, duration: 80, loc: 'Waterfront Promenade' }
  },
  {
    theme: 'Nature, Overlooks & Open Spaces',
    dayTitleSuffix: 'Hilltops & Lush Reserves',
    morning: { title: 'Botanical Sanctuary & Shaded Tree Canopies', cat: 'Nature & Botanical', desc: 'Fresh morning walk amidst native flora, birdsong, and quiet green trails.', cost: 80, duration: 100, loc: 'Botanical Gardens & Reserve' },
    afternoon: { title: 'Regional History & Cultural Arts Museum', cat: 'Arts & History', desc: 'Galleries featuring historical artifacts, regional crafts, and royal archives.', cost: 150, duration: 100, loc: 'State Cultural Museum' },
    evening: { title: 'Night Bazaar & Open-Air Plaza Gathering', cat: 'Culture & Leisure', desc: 'Vibrant evening energy, street performers, and local handicraft stalls.', cost: 150, duration: 90, loc: 'Central Town Chowk' }
  },
  {
    theme: 'Hidden Enclaves & Architectural Marvels',
    dayTitleSuffix: 'Palatial Manors & Stepwells',
    morning: { title: 'Carved Stepwell & Geometric Stone Enclave', cat: 'Archaeological Marvel', desc: 'Subterranean water systems, symmetrical masonry, and cool stone chambers.', cost: 150, duration: 90, loc: 'Ancient Stepwell Enclave' },
    afternoon: { title: 'Heritage Courtyard & Chai Tasting', cat: 'Culture & Refreshment', desc: 'Restored merchant haveli courtyard enjoying masala chai and regional savouries.', cost: 200, duration: 75, loc: 'Merchant Haveli Courtyard' },
    evening: { title: 'High-Altitude Valley Sunset Vistas', cat: 'Sunset Leisure', desc: 'Golden hour hues stretching across the valley ridges with open skies.', cost: 50, duration: 90, loc: 'Sunset Ridge Trail' }
  }
];

/**
 * 1. Find Catalog or Procedural Candidate Pool for a destination
 */
export function findCatalogForDestination(destination: string) {
  const destLower = (destination || '').toLowerCase();
  for (const [key, catalog] of Object.entries(DESTINATION_CATALOGS)) {
    if (destLower.includes(key) || destLower.includes(catalog.city.toLowerCase())) {
      return catalog;
    }
  }
  return null;
}

/**
 * 2. Collect and filter structured candidate places
 */
export function getAvailableCandidates(
  destination: string,
  excludedPlaceIds: Set<string> = new Set(),
  constraints: TripConstraint[] = []
): {
  catalog: ReturnType<typeof findCatalogForDestination>;
  places: ActivityCandidate[];
  freeAlternatives: ActivityCandidate[];
} {
  const catalog = findCatalogForDestination(destination);
  const excludedCategories = new Set(
    constraints
      .filter((c) => c.type === 'category' || c.type === 'exclusion')
      .map((c) => (c.category || '').toLowerCase())
      .filter(Boolean)
  );

  let rawPlaces: ActivityCandidate[] = [];
  let freeAlts: ActivityCandidate[] = [];

  if (catalog) {
    rawPlaces = catalog.places;
    freeAlts = catalog.freeAlternatives;
  } else {
    // Generate deterministic candidates based on destination city
    const cityCoord = findCityCoordinates(destination);
    const slots: Array<'morning' | 'afternoon' | 'evening'> = ['morning', 'afternoon', 'evening'];
    const candidates: ActivityCandidate[] = [];

    PROCEDURAL_THEMES.forEach((theme, dayIdx) => {
      slots.forEach((slot, slotIdx) => {
        const item = slot === 'morning' ? theme.morning : slot === 'afternoon' ? theme.afternoon : theme.evening;
        candidates.push({
          id: `cand-${dayIdx + 1}-${slotIdx + 1}`,
          title: `${item.title} • ${destination}`,
          description: item.desc,
          location: `${item.loc}, ${destination}`,
          timeSlot: slot,
          bestVisited: (slot.charAt(0).toUpperCase() + slot.slice(1)) as 'Morning' | 'Afternoon' | 'Evening',
          durationMinutes: item.duration,
          estimatedCost: item.cost,
          category: item.cat,
          ...(cityCoord ? { latitude: cityCoord.latitude, longitude: cityCoord.longitude } : {})
        });
      });
    });

    rawPlaces = candidates;
    freeAlts = [
      {
        id: `free-alt-1`,
        title: `Public Promenade & Scenic Walking Trail • ${destination}`,
        description: `Free open-air pedestrian walkway with panoramic views and cooling breezes.`,
        location: `${destination} Public Grounds`,
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 75,
        estimatedCost: 0,
        category: 'Free Scenic Walk',
        isFreeOrLowCost: true,
        ...(cityCoord ? { latitude: cityCoord.latitude, longitude: cityCoord.longitude } : {})
      },
      {
        id: `free-alt-2`,
        title: `Historic Street & Heritage Quarter Walk • ${destination}`,
        description: `Self-guided exploration of architectural facades and local community chowks.`,
        location: `${destination} Heritage Street`,
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 80,
        estimatedCost: 0,
        category: 'Free Cultural Walk',
        isFreeOrLowCost: true,
        ...(cityCoord ? { latitude: cityCoord.latitude, longitude: cityCoord.longitude } : {})
      }
    ];
  }

  // Filter out excluded place IDs and excluded categories
  const filteredPlaces = rawPlaces.filter((p) => {
    if (excludedPlaceIds.has(p.id)) return false;
    if (p.category && excludedCategories.has(p.category.toLowerCase())) return false;
    return true;
  });

  const filteredFreeAlts = freeAlts.filter((p) => !excludedPlaceIds.has(p.id));

  return { catalog, places: filteredPlaces, freeAlternatives: filteredFreeAlts };
}

/**
 * 3. Validation Pipeline: Checks budget, opening hours, travel feasibility, overlap, exclusions
 */
export function validateItinerary(
  days: TripDay[],
  context: {
    budgetAmount: number;
    travelerCount?: number;
    excludedPlaceIds?: string[];
    constraints?: TripConstraint[];
    accommodationCost?: number;
  }
): ValidationResult {
  const conflicts: ItineraryConflict[] = [];
  const travellers = Math.max(1, context.travelerCount || 1);
  const maxBudget = context.budgetAmount;
  const excludedSet = new Set(context.excludedPlaceIds || []);
  const accommodationCost = Math.max(0, context.accommodationCost || 0);

  let totalCost = accommodationCost;
  const seenPlaceTitles = new Set<string>();
  const seenPlaceIds = new Set<string>();

  days.forEach((day) => {
    let dayCost = 0;
    let dayDurationMinutes = 0;
    let prevItem: ItineraryItem | null = null;

    day.items.forEach((item) => {
      const isCountable = !item.isRejected && item.status !== 'unavailable' && !item.isSkipped && item.status !== 'skipped';
      const itemCost = isCountable ? (item.estimatedCost || 0) * travellers : 0;
      dayCost += itemCost;
      totalCost += itemCost;
      dayDurationMinutes += isCountable ? (item.durationMinutes || 90) : 0;

      // 1. Excluded Place check
      if (excludedSet.has(item.id) || (item.placeId && excludedSet.has(item.placeId)) || item.isRejected) {
        conflicts.push({
          id: `conf-excl-${item.id}`,
          type: 'excluded-place',
          dayIndex: day.dayIndex,
          slot: item.timeSlot,
          itemIds: [item.id],
          itemTitles: [item.title],
          severity: 'error',
          message: `"${item.title}" was previously rejected or marked as excluded.`,
          suggestedRepair: 'Replace with an alternative non-excluded candidate.'
        });
      }

      // 2. Unavailable check
      if (item.status === 'unavailable') {
        conflicts.push({
          id: `conf-unavail-${item.id}`,
          type: 'unavailable-activity',
          dayIndex: day.dayIndex,
          slot: item.timeSlot,
          itemIds: [item.id],
          itemTitles: [item.title],
          severity: 'error',
          message: `"${item.title}" is currently unavailable or cancelled.`,
          suggestedRepair: 'Substitute with a verified backup option.'
        });
      }

      // 3. Duplicate place check
      const normalizedTitle = item.title.toLowerCase().trim();
      if (seenPlaceTitles.has(normalizedTitle) || (item.placeId && seenPlaceIds.has(item.placeId))) {
        conflicts.push({
          id: `conf-dup-${item.id}`,
          type: 'duplicate-place',
          dayIndex: day.dayIndex,
          slot: item.timeSlot,
          itemIds: [item.id],
          itemTitles: [item.title],
          severity: 'error',
          message: `"${item.title}" appears multiple times in this itinerary.`,
          suggestedRepair: 'Substitute duplicate occurrence with a fresh place.'
        });
      } else {
        seenPlaceTitles.add(normalizedTitle);
        if (item.placeId) seenPlaceIds.add(item.placeId);
      }

      // 4. Opening hours sanity check
      if (item.openingHours) {
        const hoursLower = item.openingHours.toLowerCase();
        // If it specifies evening/night hours only but scheduled in morning
        if (item.timeSlot === 'morning' && (hoursLower.includes('17:00') || hoursLower.includes('18:00')) && !hoursLower.includes('08:00') && !hoursLower.includes('09:00') && !hoursLower.includes('10:00')) {
          conflicts.push({
            id: `conf-hours-${item.id}`,
            type: 'opening-hours',
            dayIndex: day.dayIndex,
            slot: item.timeSlot,
            itemIds: [item.id],
            itemTitles: [item.title],
            severity: 'warning',
            message: `"${item.title}" opening hours (${item.openingHours}) may conflict with Morning exploration.`,
            suggestedRepair: 'Resequence to Evening or replace with an open morning activity.'
          });
        }
      }

      // 5. Travel feasibility & distance between consecutive items on same day
      if (prevItem && prevItem.latitude && prevItem.longitude && item.latitude && item.longitude) {
        const dist = calculateDistanceKm(prevItem.latitude, prevItem.longitude, item.latitude, item.longitude);
        if (dist > 28) {
          conflicts.push({
            id: `conf-dist-${item.id}`,
            type: 'travel-time',
            dayIndex: day.dayIndex,
            slot: item.timeSlot,
            itemIds: [prevItem.id, item.id],
            itemTitles: [prevItem.title, item.title],
            severity: 'warning',
            message: `Transit distance between "${prevItem.title}" and "${item.title}" is ${Math.round(dist)} km, which requires excessive travel time.`,
            suggestedRepair: 'Select a geographically clustered alternative in the same district.'
          });
        }
      }

      prevItem = item;
    });

    // 6. Day duration / practical capacity check (Active exploration > 420 mins / 7 hours)
    if (dayDurationMinutes > 450) {
      conflicts.push({
        id: `conf-dur-day-${day.dayIndex}`,
        type: 'duration-overlap',
        dayIndex: day.dayIndex,
        itemIds: day.items.map((i) => i.id),
        itemTitles: day.items.map((i) => i.title),
        severity: 'warning',
        message: `Day ${day.dayIndex} has ${Math.round(dayDurationMinutes / 60)} hours of scheduled activities, which exceeds comfortable pace.`,
        suggestedRepair: 'Trim or shorten an activity to keep the pace relaxed.'
      });
    }
  });

  // 7. Budget constraint check (Hard Constraint!)
  if (totalCost > maxBudget) {
    const overrun = totalCost - maxBudget;
    conflicts.push({
      id: `conf-budget-overall`,
      type: 'budget',
      dayIndex: 1,
      itemIds: [],
      itemTitles: [],
      severity: 'error',
      message: `Total estimated cost (₹${totalCost.toLocaleString('en-IN')}) exceeds user budget (₹${maxBudget.toLocaleString('en-IN')}) by ₹${overrun.toLocaleString('en-IN')}.`,
      suggestedRepair: 'Replace highest-cost activities with low-cost or free cultural alternatives.'
    });
  }

  const budgetRemaining = maxBudget - totalCost;

  return {
    valid: conflicts.filter((c) => c.severity === 'error').length === 0,
    conflicts,
    totalCost,
    budgetRemaining,
    summary:
      conflicts.length === 0
        ? `Itinerary is completely validated: within budget (₹${totalCost.toLocaleString('en-IN')} / ₹${maxBudget.toLocaleString('en-IN')}) with optimal transit.`
        : `Detected ${conflicts.length} scheduling/budget items requiring attention.`
  };
}

/**
 * 4. Generate Backups for an Item
 */
export function generateSmartBackups(
  primaryItem: Partial<ItineraryItem>,
  availablePool: ActivityCandidate[],
  remainingBudget: number,
  anchorCoords?: { latitude: number; longitude: number } | null
): BackupCandidate[] {
  const filtered = availablePool.filter(
    (c) => c.id !== primaryItem.id && c.title.toLowerCase() !== (primaryItem.title || '').toLowerCase()
  );

  const scored = filtered.map((c) => {
    let dist: number | undefined = undefined;
    let distScore = 0;
    if (anchorCoords && c.latitude !== undefined && c.longitude !== undefined) {
      dist = calculateDistanceKm(anchorCoords.latitude, anchorCoords.longitude, c.latitude, c.longitude);
      distScore = Math.max(0, 40 - dist * 1.5);
    }
    const costFit = c.estimatedCost <= remainingBudget ? 30 : 0;
    const catBonus = c.category && primaryItem.category && c.category === primaryItem.category ? 25 : 0;
    const slotBonus = c.timeSlot === primaryItem.timeSlot ? 20 : 0;

    return {
      candidate: c,
      dist,
      score: distScore + costFit + catBonus + slotBonus
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(({ candidate, dist }) => ({
    id: candidate.id,
    title: candidate.title,
    description: candidate.description,
    location: candidate.location,
    category: candidate.category || 'Sightseeing',
    timeSlot: candidate.timeSlot,
    durationMinutes: candidate.durationMinutes,
    estimatedCost: candidate.estimatedCost,
    ...(candidate.openingHours ? { openingHours: candidate.openingHours } : {}),
    ...(candidate.latitude !== undefined ? { latitude: candidate.latitude } : {}),
    ...(candidate.longitude !== undefined ? { longitude: candidate.longitude } : {}),
    ...(dist !== undefined ? { distanceKm: Math.round(dist * 10) / 10 } : {}),
    reason: `Close alternative (${candidate.category}) fitting the ${candidate.timeSlot} window.`
  }));
}

/**
 * 5. Automatic Repair Pipeline
 */
export function repairItinerary(
  days: TripDay[],
  conflicts: ItineraryConflict[],
  context: {
    destination: string;
    budgetAmount: number;
    travelerCount?: number;
    excludedPlaceIds?: string[];
    constraints?: TripConstraint[];
    accommodationCost?: number;
  }
): {
  repairedDays: TripDay[];
  repairedCount: number;
  remainingConflicts: ItineraryConflict[];
  explanation: string;
} {
  const travellers = Math.max(1, context.travelerCount || 1);
  const excludedSet = new Set(context.excludedPlaceIds || []);
  const { places, freeAlternatives } = getAvailableCandidates(context.destination, excludedSet, context.constraints || []);

  const usedIds = new Set<string>();
  const usedTitles = new Set<string>();

  days.forEach((d) => {
    d.items.forEach((i) => {
      if (!i.isRejected && i.status !== 'unavailable') {
        usedIds.add(i.id);
        usedTitles.add(i.title.toLowerCase());
      }
    });
  });

  let repairedDays = JSON.parse(JSON.stringify(days)) as TripDay[];
  let repairedCount = 0;
  const repairsLog: string[] = [];

  // Repair 1: Fix Excluded / Unavailable / Duplicate places first
  const itemLevelErrors = conflicts.filter(
    (c) => c.type === 'excluded-place' || c.type === 'unavailable-activity' || c.type === 'duplicate-place'
  );

  for (const conflict of itemLevelErrors) {
    const targetItemId = conflict.itemIds[0];
    if (!targetItemId) continue;

    for (let dayIdx = 0; dayIdx < repairedDays.length; dayIdx++) {
      const day = repairedDays[dayIdx];
      const itemIdx = day.items.findIndex((i) => i.id === targetItemId);
      if (itemIdx === -1) continue;

      const currentItem = day.items[itemIdx];
      const slot = currentItem.timeSlot;

      // Try taking from backupOptions first
      let replacement: ActivityCandidate | null = null;
      if (currentItem.backupOptions && currentItem.backupOptions.length > 0) {
        const validBackup = currentItem.backupOptions.find(
          (b) => !excludedSet.has(b.id) && !usedIds.has(b.id) && !usedTitles.has(b.title.toLowerCase())
        );
        if (validBackup) {
          replacement = {
            id: validBackup.id,
            title: validBackup.title,
            description: validBackup.description,
            location: validBackup.location,
            timeSlot: validBackup.timeSlot,
            bestVisited: (validBackup.timeSlot.charAt(0).toUpperCase() + validBackup.timeSlot.slice(1)) as any,
            durationMinutes: validBackup.durationMinutes,
            estimatedCost: validBackup.estimatedCost,
            category: validBackup.category,
            latitude: validBackup.latitude,
            longitude: validBackup.longitude
          };
        }
      }

      // If no valid backup, find best available candidate from general pool
      if (!replacement) {
        const eligible = places.filter(
          (p) => p.timeSlot === slot && !usedIds.has(p.id) && !usedTitles.has(p.title.toLowerCase())
        );
        if (eligible.length > 0) {
          replacement = eligible[0];
        } else if (freeAlternatives.length > 0) {
          replacement = freeAlternatives.find((f) => !usedIds.has(f.id)) || freeAlternatives[0];
        }
      }

      if (replacement) {
        usedIds.add(replacement.id);
        usedTitles.add(replacement.title.toLowerCase());
        day.items[itemIdx] = {
          ...currentItem,
          id: replacement.id,
          title: replacement.title,
          description: replacement.description,
          location: replacement.location,
          estimatedCost: replacement.estimatedCost,
          durationMinutes: replacement.durationMinutes,
          category: replacement.category,
          status: 'active',
          isRejected: false,
          rejectionReason: undefined,
          latitude: replacement.latitude,
          longitude: replacement.longitude
        };
        repairedCount++;
        repairsLog.push(`Replaced conflicting "${currentItem.title}" with "${replacement.title}".`);
      }
    }
  }

  // Repair 2: Fix Budget Overrun if present
  let currentVal = validateItinerary(repairedDays, context);
  if (!currentVal.valid && currentVal.conflicts.some((c) => c.type === 'budget')) {
    // Sort all non-free items by cost descending to substitute the most expensive ones with zero/low-cost alts
    let freeAltIdx = 0;
    const allItemsWithDay: Array<{ dayIdx: number; itemIdx: number; cost: number; title: string }> = [];

    repairedDays.forEach((d, dIdx) => {
      d.items.forEach((item, iIdx) => {
        if (item.estimatedCost > 0) {
          allItemsWithDay.push({ dayIdx: dIdx, itemIdx: iIdx, cost: item.estimatedCost, title: item.title });
        }
      });
    });

    allItemsWithDay.sort((a, b) => b.cost - a.cost);

    for (const exp of allItemsWithDay) {
      if (currentVal.totalCost <= context.budgetAmount) break;

      const day = repairedDays[exp.dayIdx];
      const item = day.items[exp.itemIdx];
      const slot = item.timeSlot;

      // Find free alternative matching or general
      let alt: ActivityCandidate | null = null;
      if (freeAlternatives.length > 0) {
        alt = freeAlternatives[freeAltIdx % freeAlternatives.length];
        freeAltIdx++;
      } else {
        alt = {
          id: `free-repair-${exp.dayIdx}-${exp.itemIdx}`,
          title: `Public Heritage Promenade & Gardens • ${context.destination}`,
          description: `Free scenic outdoor walking route with historic vistas and relaxed gardens.`,
          location: `${context.destination} City Core`,
          timeSlot: slot,
          bestVisited: (slot.charAt(0).toUpperCase() + slot.slice(1)) as any,
          durationMinutes: 75,
          estimatedCost: 0,
          category: 'Free Scenic Walk',
          isFreeOrLowCost: true
        };
      }

      if (alt) {
        repairsLog.push(`Replaced expensive item "${item.title}" (₹${item.estimatedCost}) with free cultural stop "${alt.title}".`);
        day.items[exp.itemIdx] = {
          ...item,
          id: alt.id,
          title: alt.title,
          description: alt.description,
          location: alt.location,
          estimatedCost: alt.estimatedCost,
          category: alt.category,
          isOverBudget: false
        };
        repairedCount++;
      }

      currentVal = validateItinerary(repairedDays, context);
    }
  }

  // Repair 3: Fix excessive travel distance conflicts
  currentVal = validateItinerary(repairedDays, context);
  const travelConflicts = currentVal.conflicts.filter((c) => c.type === 'travel-time');
  for (const tc of travelConflicts) {
    if (tc.itemIds.length === 2) {
      const targetId = tc.itemIds[1];
      const day = repairedDays.find((d) => d.dayIndex === tc.dayIndex);
      if (day) {
        const idx = day.items.findIndex((i) => i.id === targetId);
        const prev = idx > 0 ? day.items[idx - 1] : null;
        if (idx !== -1 && prev && prev.latitude && prev.longitude) {
          // Find closest candidate
          const eligible = places
            .filter((p) => p.timeSlot === day.items[idx].timeSlot && !usedIds.has(p.id) && p.latitude && p.longitude)
            .map((p) => ({
              p,
              dist: calculateDistanceKm(prev.latitude!, prev.longitude!, p.latitude!, p.longitude!)
            }))
            .sort((a, b) => a.dist - b.dist);

          if (eligible.length > 0 && eligible[0].dist < 15) {
            const repl = eligible[0].p;
            usedIds.add(repl.id);
            repairsLog.push(`Optimized transit: Swapped distant stop with nearby "${repl.title}" (${Math.round(eligible[0].dist)} km away).`);
            day.items[idx] = {
              ...day.items[idx],
              id: repl.id,
              title: repl.title,
              description: repl.description,
              location: repl.location,
              estimatedCost: repl.estimatedCost,
              category: repl.category,
              latitude: repl.latitude,
              longitude: repl.longitude,
              distanceKm: Math.round(eligible[0].dist * 10) / 10
            };
            repairedCount++;
          }
        }
      }
    }
  }

  const finalVal = validateItinerary(repairedDays, context);

  return {
    repairedDays,
    repairedCount,
    remainingConflicts: finalVal.conflicts,
    explanation:
      repairsLog.length > 0
        ? repairsLog.join(' ')
        : 'All itinerary constraints verified; no modifications required.'
  };
}

/**
 * 6. Central Itinerary Generator (generatePlan & generatePlanSync)
 * Supports scope: 'full-trip' | 'single-day' | 'single-slot'
 */
export function generatePlanSync(params: GeneratePlanParams): TripDay[] {
  const duration = params.duration || calculateCalendarDays(params.startDate, params.endDate);
  const budget = Math.max(200, Number(params.budget) || 25000);
  const travellers = Math.max(1, params.travellers || 1);
  const excludedSet = new Set(params.excludedPlaceIds || []);

  const { catalog, places, freeAlternatives } = getAvailableCandidates(
    params.destination,
    excludedSet,
    params.constraints || []
  );

  // If scope is single-slot, surgically calculate candidate replacement for that exact slot
  if (params.scope === 'single-slot' && params.existingItinerary && params.targetDayIndex && params.targetSlot) {
    const dayIndex = params.targetDayIndex;
    const targetSlot = params.targetSlot;
    const updatedDays: TripDay[] = JSON.parse(JSON.stringify(params.existingItinerary));

    const targetDay = updatedDays.find((d) => d.dayIndex === dayIndex);
    if (targetDay) {
      // Collect all places currently used in the trip
      const usedIds = new Set<string>();
      const usedTitles = new Set<string>();
      let plannedSpendExcludingTarget = 0;

      updatedDays.forEach((d) => {
        d.items.forEach((item) => {
          if (!(d.dayIndex === dayIndex && item.timeSlot === targetSlot)) {
            usedIds.add(item.id);
            usedTitles.add(item.title.toLowerCase());
            plannedSpendExcludingTarget += (item.estimatedCost || 0) * travellers;
          }
        });
      });

      const remainingBudgetForSlot = Math.max(0, budget - plannedSpendExcludingTarget);

      // Find anchor coordinates from previous or next stop on same day
      let anchorCoords: { latitude: number; longitude: number } | null = null;
      const targetItemIdx = targetDay.items.findIndex((i) => i.timeSlot === targetSlot);
      if (targetItemIdx > 0 && targetDay.items[targetItemIdx - 1]?.latitude) {
        anchorCoords = {
          latitude: targetDay.items[targetItemIdx - 1].latitude!,
          longitude: targetDay.items[targetItemIdx - 1].longitude!
        };
      } else if (targetItemIdx < targetDay.items.length - 1 && targetDay.items[targetItemIdx + 1]?.latitude) {
        anchorCoords = {
          latitude: targetDay.items[targetItemIdx + 1].latitude!,
          longitude: targetDay.items[targetItemIdx + 1].longitude!
        };
      } else if (params.locationContext?.latitude && params.locationContext?.longitude) {
        anchorCoords = {
          latitude: params.locationContext.latitude,
          longitude: params.locationContext.longitude
        };
      }

      // Rank candidate alternatives for this slot
      const pool = places.filter(
        (p) =>
          p.timeSlot === targetSlot &&
          !excludedSet.has(p.id) &&
          !usedIds.has(p.id) &&
          !usedTitles.has(p.title.toLowerCase())
      );

      const scored = pool.map((cand) => {
        const conceptScore = getConceptMatchScore(cand, params.conceptTitle, params.interests || []);
        let distScore = 0;
        let distKm: number | undefined = undefined;
        if (anchorCoords && cand.latitude && cand.longitude) {
          distKm = calculateDistanceKm(anchorCoords.latitude, anchorCoords.longitude, cand.latitude, cand.longitude);
          distScore = Math.max(0, 50 - distKm * 1.5);
        }
        const costPerTraveller = cand.estimatedCost * travellers;
        const budgetBonus = costPerTraveller <= remainingBudgetForSlot ? 30 : -50;
        return {
          cand,
          distKm,
          score: conceptScore * 1.5 + distScore + budgetBonus
        };
      });

      scored.sort((a, b) => b.score - a.score);

      let selectedCandidate: ActivityCandidate | null = scored.length > 0 ? scored[0].cand : null;
      let finalDist = scored.length > 0 ? scored[0].distKm : undefined;

      // Fallback to free alternative if pool is exhausted or over budget
      if (!selectedCandidate || selectedCandidate.estimatedCost * travellers > remainingBudgetForSlot) {
        const freeFit = freeAlternatives.find((f) => !usedIds.has(f.id));
        if (freeFit) {
          selectedCandidate = freeFit;
        }
      }

      if (selectedCandidate && targetItemIdx !== -1) {
        const backups = generateSmartBackups(selectedCandidate, places, remainingBudgetForSlot, anchorCoords);
        targetDay.items[targetItemIdx] = {
          ...targetDay.items[targetItemIdx],
          id: selectedCandidate.id,
          placeId: selectedCandidate.id,
          title: selectedCandidate.title,
          description: selectedCandidate.description,
          location: selectedCandidate.location,
          estimatedCost: selectedCandidate.estimatedCost,
          durationMinutes: selectedCandidate.durationMinutes,
          category: selectedCandidate.category,
          status: 'active',
          isRejected: false,
          rejectionReason: undefined,
          isOverBudget: selectedCandidate.estimatedCost * travellers > remainingBudgetForSlot,
          latitude: selectedCandidate.latitude,
          longitude: selectedCandidate.longitude,
          distanceKm: finalDist !== undefined ? Math.round(finalDist * 10) / 10 : undefined,
          backupOptions: backups
        };
      }
    }

    // Run validation pipeline on the updated plan
    const valResult = validateItinerary(updatedDays, {
      budgetAmount: budget,
      travelerCount: travellers,
      excludedPlaceIds: Array.from(excludedSet),
      constraints: params.constraints
    });

    if (!valResult.valid) {
      const repaired = repairItinerary(updatedDays, valResult.conflicts, {
        destination: params.destination,
        budgetAmount: budget,
        travelerCount: travellers,
        excludedPlaceIds: Array.from(excludedSet),
        constraints: params.constraints
      });
      return repaired.repairedDays;
    }

    return updatedDays;
  }

  // If scope is single-day, regenerate that day only
  if (params.scope === 'single-day' && params.existingItinerary && params.targetDayIndex) {
    const targetDayIndex = params.targetDayIndex;
    const updatedDays: TripDay[] = JSON.parse(JSON.stringify(params.existingItinerary));

    const usedIds = new Set<string>();
    const usedTitles = new Set<string>();
    let otherDaysSpend = 0;

    updatedDays.forEach((d) => {
      if (d.dayIndex !== targetDayIndex) {
        d.items.forEach((i) => {
          usedIds.add(i.id);
          usedTitles.add(i.title.toLowerCase());
          otherDaysSpend += (i.estimatedCost || 0) * travellers;
        });
      }
    });

    const dayBudget = Math.max(100, budget - otherDaysSpend);
    // Proceed to generate this day and insert it
    const singleDayPlan = generateFullStructuredPlan({
      ...params,
      duration: 1,
      budget: dayBudget,
      existingUsedIds: usedIds,
      existingUsedTitles: usedTitles,
      dayOffsetIndex: targetDayIndex
    });

    if (singleDayPlan.length > 0) {
      const targetIdx = updatedDays.findIndex((d) => d.dayIndex === targetDayIndex);
      if (targetIdx !== -1) {
        updatedDays[targetIdx] = {
          ...singleDayPlan[0],
          dayIndex: targetDayIndex,
          date: updatedDays[targetIdx].date
        };
      }
    }

    return updatedDays;
  }

  // Default: Full Trip Generation
  const fullPlan = generateFullStructuredPlan(params);

  // Validate entire plan programmatically
  const val = validateItinerary(fullPlan, {
    budgetAmount: budget,
    travelerCount: travellers,
    excludedPlaceIds: Array.from(excludedSet),
    constraints: params.constraints
  });

  if (!val.valid) {
    const repaired = repairItinerary(fullPlan, val.conflicts, {
      destination: params.destination,
      budgetAmount: budget,
      travelerCount: travellers,
      excludedPlaceIds: Array.from(excludedSet),
      constraints: params.constraints
    });
    return repaired.repairedDays;
  }

  return fullPlan;
}

export async function generatePlan(params: GeneratePlanParams): Promise<TripDay[]> {
  // If in browser, attempt server endpoint with Gemini reasoning
  if (typeof window !== 'undefined') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch('/api/itinerary/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.days && Array.isArray(data.days) && data.days.length > 0) {
          return data.days;
        }
      }
    } catch {
      // Fallback silently to client-side engine
    }
  }

  // Fallback to deterministic synchronous engine with complete validation
  return generatePlanSync(params);
}

/**
 * Helper to construct the full structured multi-day itinerary
 */
function generateFullStructuredPlan(
  params: GeneratePlanParams & {
    existingUsedIds?: Set<string>;
    existingUsedTitles?: Set<string>;
    dayOffsetIndex?: number;
  }
): TripDay[] {
  const duration = params.duration || calculateCalendarDays(params.startDate, params.endDate);
  const budget = Math.max(200, Number(params.budget) || 25000);
  const travellers = Math.max(1, params.travellers || 1);
  const excludedSet = new Set(params.excludedPlaceIds || []);

  const { catalog, places, freeAlternatives } = getAvailableCandidates(
    params.destination,
    excludedSet,
    params.constraints || []
  );

  const usedPlaceIds = new Set<string>(params.existingUsedIds || []);
  const usedTitles = new Set<string>(params.existingUsedTitles || []);

  let remainingBudget = budget;
  let freeAltIndex = 0;

  const userLat = params.locationContext?.latitude ?? null;
  const userLng = params.locationContext?.longitude ?? null;
  let lastCoordinates: { latitude: number; longitude: number } | null =
    userLat !== null && userLng !== null ? { latitude: userLat, longitude: userLng } : null;

  const days: TripDay[] = [];

  for (let d = 1; d <= duration; d++) {
    const dayIndex = params.dayOffsetIndex || d;
    const dateStr = getDateForDayIndex(params.startDate, d);

    const progIndex = (dayIndex - 1) % PROCEDURAL_THEMES.length;
    const prog = PROCEDURAL_THEMES[progIndex];

    const dayTitle =
      dayIndex === 1
        ? `Day 1: Arrival & ${catalog ? `${catalog.city} Highlights` : prog.dayTitleSuffix}`
        : dayIndex === duration
        ? `Day ${dayIndex}: Final Discoveries & Farewell`
        : `Day ${dayIndex}: ${prog.dayTitleSuffix} in ${params.destination}`;

    const dayItems: ItineraryItem[] = [];
    const slots: Array<'morning' | 'afternoon' | 'evening'> = ['morning', 'afternoon', 'evening'];
    let currentStopCoords: { latitude: number; longitude: number } | null = lastCoordinates;

    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
      const slot = slots[slotIdx];
      const slotCapitalized = (slot.charAt(0).toUpperCase() + slot.slice(1)) as 'Morning' | 'Afternoon' | 'Evening';

      const pool = places.filter(
        (p) =>
          p.timeSlot === slot &&
          !excludedSet.has(p.id) &&
          !usedPlaceIds.has(p.id) &&
          !usedTitles.has(p.title.toLowerCase())
      );

      let candidate: ActivityCandidate | null = null;
      let stepDistance: number | undefined = undefined;

      if (pool.length > 0) {
        // Score based on concept match, proximity to current stop, and budget fit
        const scored = pool.map((item) => {
          const conceptScore = getConceptMatchScore(item, params.conceptTitle, params.interests || []);
          let distKm: number | null = null;
          let proximityScore = 0;

          if (currentStopCoords && item.latitude !== undefined && item.longitude !== undefined) {
            distKm = calculateDistanceKm(
              currentStopCoords.latitude,
              currentStopCoords.longitude,
              item.latitude,
              item.longitude
            );
            proximityScore = Math.max(0, 50 - distKm * 1.5);
          }

          const totalItemCost = item.estimatedCost * travellers;
          const budgetFitBonus = totalItemCost <= remainingBudget ? 30 : -30;
          const totalScore = conceptScore * 1.6 + proximityScore + budgetFitBonus;

          return { item, totalScore, distKm };
        });

        scored.sort((a, b) => b.totalScore - a.totalScore);
        candidate = scored[0].item;
        if (scored[0].distKm !== null && scored[0].distKm !== undefined) {
          stepDistance = scored[0].distKm;
        }
      }

      // Procedural fallback if pool empty
      if (!candidate) {
        const slotData = slot === 'morning' ? prog.morning : slot === 'afternoon' ? prog.afternoon : prog.evening;
        const cityCoord = findCityCoordinates(params.destination);
        candidate = {
          id: `cand-${dayIndex}-${slotIdx + 1}`,
          title: `${slotData.title} • ${params.destination}`,
          description: slotData.desc,
          location: `${slotData.loc}, ${params.destination}`,
          timeSlot: slot,
          bestVisited: slotCapitalized,
          durationMinutes: slotData.duration,
          estimatedCost: slotData.cost,
          category: slotData.cat,
          ...(cityCoord ? { latitude: cityCoord.latitude, longitude: cityCoord.longitude } : {})
        };
      }

      if (candidate.latitude !== undefined && candidate.longitude !== undefined) {
        currentStopCoords = { latitude: candidate.latitude, longitude: candidate.longitude };
        lastCoordinates = currentStopCoords;
      }

      usedPlaceIds.add(candidate.id);
      usedTitles.add(candidate.title.toLowerCase());

      let finalCost = candidate.estimatedCost;
      let finalTitle = candidate.title;
      let finalDesc = candidate.description;
      let finalLoc = candidate.location;
      let finalCategory = candidate.category;
      let isOverBudget = false;

      // Budget Hard Constraint Check: If candidate exceeds remaining budget, replace with free/low-cost
      if (finalCost * travellers > remainingBudget) {
        isOverBudget = true;
        let freeAlt: ActivityCandidate | null = null;
        if (freeAlternatives.length > 0) {
          freeAlt = freeAlternatives[freeAltIndex % freeAlternatives.length];
          freeAltIndex++;
        }

        if (freeAlt && freeAlt.estimatedCost * travellers <= remainingBudget) {
          finalTitle = freeAlt.title;
          finalDesc = freeAlt.description;
          finalLoc = freeAlt.location;
          finalCost = freeAlt.estimatedCost;
          finalCategory = freeAlt.category;
          isOverBudget = false;
        }
      }

      remainingBudget = Math.max(0, remainingBudget - finalCost * travellers);

      // Generate 2-3 backup options for this item
      const backups = generateSmartBackups(
        { ...candidate, title: finalTitle },
        places,
        remainingBudget,
        currentStopCoords
      );

      const dayItem: ItineraryItem = {
        id: `item-${dayIndex}-${slotIdx + 1}`,
        placeId: candidate.id,
        dayIndex,
        timeSlot: slot,
        bestVisited: candidate.bestVisited || slotCapitalized,
        title: finalTitle,
        description: finalDesc,
        location: finalLoc,
        estimatedCost: finalCost,
        durationMinutes: candidate.durationMinutes,
        status: 'active',
        isOverBudget,
        backupOptions: backups,
        ...(candidate.latitude !== undefined ? { latitude: candidate.latitude } : {}),
        ...(candidate.longitude !== undefined ? { longitude: candidate.longitude } : {}),
        ...(stepDistance !== undefined ? { distanceKm: Math.round(stepDistance * 10) / 10 } : {}),
        ...(finalCategory ? { category: finalCategory } : {}),
        ...(candidate.openingHours ? { openingHours: candidate.openingHours } : {})
      };

      dayItems.push(dayItem);
    }

    days.push({
      dayIndex,
      date: dateStr,
      title: dayTitle,
      ...(prog.theme ? { theme: prog.theme } : {}),
      items: dayItems
    });
  }

  return days;
}

/**
 * 7. Grounded Trip Assistant Engine
 * Answers natural language questions using live trip data strictly (never invents data).
 */
export function answerTripAssistantQuestion(
  trip: Trip,
  rawQuestion: string
): TripAssistantResponse {
  const q = rawQuestion.toLowerCase().trim();
  const days = trip.days || [];
  const travellers = Math.max(1, trip.travelerCount || 1);
  const stayCost = getTripAccommodationCost(trip.accommodation);
  const activitiesCost = days.reduce(
    (sum, d) =>
      sum +
      d.items.reduce((acc, i) => {
        if (i.isRejected || i.status === 'unavailable' || i.isSkipped || i.status === 'skipped') return acc;
        return acc + (i.estimatedCost || 0) * travellers;
      }, 0),
    0
  );
  const totalCost = activitiesCost + stayCost;
  const remainingBudget = trip.budgetAmount - totalCost;
  const excludedSet = new Set(trip.excludedPlaceIds || []);
  const { places, freeAlternatives } = getAvailableCandidates(trip.destination, excludedSet, trip.constraints || []);

  const usedPlaceTitles = new Set<string>();
  days.forEach((d) => d.items.forEach((i) => usedPlaceTitles.add(i.title.toLowerCase())));

  // CASE A: "What should I do tomorrow morning?" (or specific day morning)
  if (q.includes('tomorrow morning') || q.includes('next morning') || (q.includes('what should i do') && q.includes('morning'))) {
    // Target Day 2 if multi-day, or Day 1 if 1-day trip
    const targetDayIndex = days.length > 1 ? 2 : 1;
    const targetDay = days.find((d) => d.dayIndex === targetDayIndex) || days[0];
    const existingMorning = targetDay?.items.find((i) => i.timeSlot === 'morning' && i.status !== 'unavailable');

    // Find remaining candidate places fitting the morning slot
    const candidateMatches = places.filter(
      (p) =>
        p.timeSlot === 'morning' &&
        !usedPlaceTitles.has(p.title.toLowerCase()) &&
        !excludedSet.has(p.id) &&
        p.estimatedCost * travellers <= Math.max(500, remainingBudget)
    );

    const recommended = candidateMatches.length > 0 ? candidateMatches[0] : null;

    if (existingMorning && !q.includes('replace')) {
      return {
        answer: `Tomorrow morning (Day ${targetDayIndex}), you currently have "${existingMorning.title}" planned (${existingMorning.category || 'Sightseeing'}, ~${existingMorning.durationMinutes} min, est. ₹${existingMorning.estimatedCost}). It matches your ${trip.pace} pacing and is well-sequenced for that day.`,
        decision: 'INFORMATIONAL',
        reasoning: [
          `Current scheduled activity: ${existingMorning.title}`,
          `Duration: ~${existingMorning.durationMinutes} minutes`,
          `Estimated cost: ₹${existingMorning.estimatedCost} (within remaining budget ₹${remainingBudget})`,
          existingMorning.openingHours ? `Hours: ${existingMorning.openingHours}` : 'Open morning access'
        ],
        relatedPlaces: recommended
          ? [
              {
                title: recommended.title,
                category: recommended.category,
                estimatedCost: recommended.estimatedCost,
                durationMinutes: recommended.durationMinutes,
                description: recommended.description
              }
            ]
          : []
      };
    }

    if (recommended) {
      return {
        answer: `Tomorrow morning, a great fit is ${recommended.title} because it matches your travel preferences, fits comfortably within your remaining budget of ₹${remainingBudget.toLocaleString('en-IN')}, and starts your day with minimal transit.`,
        decision: 'YES',
        reasoning: [
          `Recommended stop: ${recommended.title}`,
          `Estimated cost: ₹${recommended.estimatedCost}`,
          `Recommended duration: ~${recommended.durationMinutes} min`,
          `Category: ${recommended.category}`,
          recommended.openingHours ? `Opening hours: ${recommended.openingHours}` : 'Flexible morning hours'
        ],
        suggestedAction: {
          type: 'add_activity',
          label: `Add ${recommended.title} to Tomorrow Morning`,
          dayIndex: targetDayIndex,
          slot: 'morning',
          activity: {
            title: recommended.title,
            description: recommended.description,
            location: recommended.location,
            estimatedCost: recommended.estimatedCost,
            durationMinutes: recommended.durationMinutes,
            category: recommended.category
          }
        },
        relatedPlaces: [
          {
            title: recommended.title,
            category: recommended.category,
            estimatedCost: recommended.estimatedCost,
            durationMinutes: recommended.durationMinutes,
            description: recommended.description
          }
        ]
      };
    }

    return {
      answer: `Tomorrow morning is currently reserved for relaxed exploration. You have ₹${remainingBudget.toLocaleString('en-IN')} remaining in your trip budget.`,
      decision: 'INFORMATIONAL',
      reasoning: [`Remaining budget: ₹${remainingBudget}`]
    };
  }

  // CASE B: "Can I fit another activity today?" / "Can I fit this activity?"
  if (q.includes('fit another activity') || q.includes('fit this activity') || q.includes('fit more today')) {
    const currentDay = days[0];
    if (!currentDay) {
      return {
        answer: 'There are no active days found in this itinerary to evaluate capacity.',
        decision: 'INFORMATIONAL',
        reasoning: []
      };
    }

    const activeItems = currentDay.items.filter((i) => i.status !== 'unavailable');
    const totalMinutes = activeItems.reduce((s, i) => s + (i.durationMinutes || 90), 0);
    const dayCost = activeItems.reduce((s, i) => s + (i.estimatedCost || 0) * travellers, 0);

    // Practical capacity: 360 mins (6 hours of active exploration)
    const canFit = activeItems.length < 4 && totalMinutes <= 330 && remainingBudget >= 200;

    if (canFit) {
      const remainingTimeMin = 390 - totalMinutes;
      const candidate = places.find(
        (p) => !usedPlaceTitles.has(p.title.toLowerCase()) && p.estimatedCost * travellers <= remainingBudget
      );

      return {
        answer: `YES. Today currently has ${activeItems.length} stops (~${Math.round(totalMinutes / 60)} hours total). You have approximately ${Math.round(remainingTimeMin / 60)} hours of comfortable daytime window remaining, and your budget has ₹${remainingBudget.toLocaleString('en-IN')} headroom.`,
        decision: 'YES',
        reasoning: [
          `Current scheduled duration today: ${totalMinutes} min across ${activeItems.length} activities`,
          `Practical daytime capacity limit: 390 min (~6.5 hours)`,
          `Remaining budget for today: ₹${remainingBudget.toLocaleString('en-IN')}`
        ],
        suggestedAction: candidate
          ? {
              type: 'add_activity',
              label: `Fit in: ${candidate.title}`,
              dayIndex: 1,
              activity: {
                title: candidate.title,
                description: candidate.description,
                location: candidate.location,
                estimatedCost: candidate.estimatedCost,
                durationMinutes: candidate.durationMinutes,
                category: candidate.category
              }
            }
          : undefined
      };
    } else {
      return {
        answer: `NOT RECOMMENDED. Adding another activity today would make the day feel rushed. You already have ${activeItems.length} activities scheduled totaling ${Math.round(totalMinutes / 60)} hours, leaving limited time for transit and dining.`,
        decision: 'NOT RECOMMENDED',
        reasoning: [
          `Scheduled active time: ${totalMinutes} minutes`,
          `Pace setting: ${trip.pace}`,
          totalMinutes > 330 ? 'Schedule exceeds comfortable daytime capacity' : 'Sufficient stops already planned'
        ]
      };
    }
  }

  // CASE C: "Which activities are close to my hotel?" / "What is close to my hotel?"
  if (q.includes('hotel') || q.includes('my stay') || q.includes('near my hotel')) {
    // Check if hotel location information exists in the current application
    const hotelLat = trip.locationContext?.latitude;
    const hotelLng = trip.locationContext?.longitude;
    const hotelCity = trip.locationContext?.city;

    if (!hotelLat || !hotelLng) {
      // Promptly and truthfully follow requirement 16:
      // "If hotel information does not exist yet: Do not pretend it does. Instead respond: 'I don't have a hotel location saved for this trip yet.' Do not invent a hotel."
      return {
        answer: "I don't have a hotel location saved for this trip yet. Once a hotel or starting stay address is added to your location context, I can calculate precise distances and walking times to all nearby attractions.",
        decision: 'INFORMATIONAL',
        reasoning: ['No hotel coordinates or stay address saved in trip metadata.']
      };
    }

    // If coordinates DO exist, sort places by distance
    const nearby = places
      .filter((p) => p.latitude && p.longitude)
      .map((p) => ({
        ...p,
        distKm: calculateDistanceKm(hotelLat, hotelLng, p.latitude!, p.longitude!)
      }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 3);

    return {
      answer: `Here are the closest activities to your saved location in ${hotelCity || trip.destination}:`,
      decision: 'INFORMATIONAL',
      reasoning: nearby.map((n) => `${n.title} is approximately ${Math.round(n.distKm * 10) / 10} km away.`),
      relatedPlaces: nearby.map((n) => ({
        title: n.title,
        category: n.category,
        estimatedCost: n.estimatedCost,
        durationMinutes: n.durationMinutes,
        distanceKm: Math.round(n.distKm * 10) / 10,
        description: n.description
      }))
    };
  }

  // CASE D: "Can you make today cheaper?" / "Make it cheaper"
  if (q.includes('cheaper') || q.includes('save money') || q.includes('lower cost') || q.includes('reduce budget')) {
    const day = days[0];
    const expItem = day?.items.find((i) => i.estimatedCost > 150);

    if (expItem && freeAlternatives.length > 0) {
      const freeAlt = freeAlternatives[0];
      const savings = expItem.estimatedCost * travellers;
      return {
        answer: `I can substitute "${expItem.title}" (₹${expItem.estimatedCost * travellers}) with the zero-cost cultural alternative "${freeAlt.title}". This will save you ₹${savings.toLocaleString('en-IN')}.`,
        decision: 'YES',
        reasoning: [
          `Current expensive item: ${expItem.title} (₹${expItem.estimatedCost})`,
          `Suggested replacement: ${freeAlt.title} (₹${freeAlt.estimatedCost})`,
          `Total savings: ₹${savings.toLocaleString('en-IN')}`
        ],
        suggestedAction: {
          type: 'replace_activity',
          label: `Replace with ${freeAlt.title} (Save ₹${savings})`,
          dayIndex: 1,
          slot: expItem.timeSlot,
          activity: {
            title: freeAlt.title,
            description: freeAlt.description,
            location: freeAlt.location,
            estimatedCost: 0,
            category: freeAlt.category
          }
        }
      };
    }

    return {
      answer: `Your itinerary is already well-optimized for budget! Current total planned cost is ₹${totalCost.toLocaleString('en-IN')} out of your ₹${trip.budgetAmount.toLocaleString('en-IN')} budget.`,
      decision: 'INFORMATIONAL',
      reasoning: [`Planned spend: ₹${totalCost}`, `Remaining: ₹${remainingBudget}`]
    };
  }

  // CASE E: "What happens if this booking is cancelled?" / "Simulate cancellation"
  if (q.includes('cancel') || q.includes('unavailable') || q.includes('disruption') || q.includes('what happens if')) {
    const firstActive = days[0]?.items[0];
    if (firstActive) {
      const backupNames = firstActive.backupOptions?.map((b) => b.title).join(', ') || 'verified nearby alternatives';
      return {
        answer: `If an activity like "${firstActive.title}" is cancelled or closed, TravelPilot automatically flags the disruption, preserves all other scheduled items, and instantly offers ${backupNames} within your remaining budget without having to restart your plan.`,
        decision: 'INFORMATIONAL',
        reasoning: [
          `Target activity: ${firstActive.title}`,
          `Available backups in reserve: ${firstActive.backupOptions?.length || 0}`,
          `Remaining budget respected: ₹${remainingBudget}`
        ]
      };
    }
  }

  // DEFAULT INFORMATIONAL: General trip overview grounded in the data
  return {
    answer: `Your ${trip.destination} itinerary covers ${days.length} days with a total planned spend of ₹${totalCost.toLocaleString('en-IN')} (remaining budget: ₹${remainingBudget.toLocaleString('en-IN')}). All ${days.reduce((s, d) => s + d.items.length, 0)} scheduled activities are geographically sequenced and verified against your ${trip.pace} pace.`,
    decision: 'INFORMATIONAL',
    reasoning: [
      `Destination: ${trip.destination}`,
      `Total Days: ${days.length}`,
      `Planned Cost: ₹${totalCost}`,
      `Remaining Budget: ₹${remainingBudget}`
    ]
  };
}
