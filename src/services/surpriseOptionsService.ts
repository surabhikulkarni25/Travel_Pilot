/**
 * Spontaneous Journey Option Generator
 *
 * Provides flexible, diverse candidate proposals for the Surprise Me experience
 * so the user can inspect transparent trip concepts, highlight stops, travel radius,
 * and estimated costs before making a final decision.
 */

import { DESTINATION_CATALOGS, ActivityCandidate } from '../data/destinationCatalog';
import { calculateDistanceKm, findCityCoordinates } from './locationService';
import type {
  TripFormData,
  LocationContext,
  SurpriseScope,
  Pace,
  ActivityLevel,
  GroupType,
  BudgetTier
} from '../types';

export interface JourneyHighlightStop {
  title: string;
  category: string;
  location: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  distanceKm?: number;
  estimatedCost: number;
}

export interface SurpriseJourneyOption {
  id: string;
  title: string;
  tagline: string;
  vibeBadge: string;
  destination: string;
  estimatedSpend: number;
  pace: Pace;
  radiusDescription: string;
  maxDistanceKm: number;
  highlightStops: JourneyHighlightStop[];
  suitability: string;
  themeSummary: string;
  formData: TripFormData;
}

interface GenerateOptionsParams {
  scope: SurpriseScope;
  activeCityName: string;
  activeStateName: string;
  locationContext: LocationContext;
  durationDays: number;
  budgetAmount: number;
  isBudgetFlexible: boolean;
  travelerCount: number;
  groupType: GroupType;
  activityLevel: ActivityLevel;
  radiusKm: number | null;
  selectedVibes: string[];
}

export function generateSurpriseOptions({
  scope,
  activeCityName,
  activeStateName,
  locationContext,
  durationDays,
  budgetAmount,
  isBudgetFlexible,
  travelerCount,
  groupType,
  activityLevel,
  radiusKm,
  selectedVibes
}: GenerateOptionsParams): SurpriseJourneyOption[] {
  const cityKey = activeCityName.toLowerCase();
  const catalog = DESTINATION_CATALOGS[cityKey];
  const anchorCoords = locationContext.latitude && locationContext.longitude
    ? { latitude: locationContext.latitude, longitude: locationContext.longitude }
    : findCityCoordinates(activeCityName) || { latitude: 18.5204, longitude: 73.8567 };

  // Calculate budget tier
  const perPersonPerDay = budgetAmount / (Math.max(1, travelerCount) * Math.max(1, durationDays));
  const budgetTier: BudgetTier = perPersonPerDay < 1500 ? 'budget' : perPersonPerDay < 3500 ? 'moderate' : 'luxury';

  const baseFormData: Omit<TripFormData, 'destination' | 'interests' | 'conceptTitle' | 'pace'> = {
    destinationType: scope === 'india' ? 'outstation' : 'city',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + Math.max(1, durationDays - 1) * 86400000).toISOString().split('T')[0],
    budgetTier,
    budgetAmount: isBudgetFlexible ? Math.max(budgetAmount, 15000) : budgetAmount,
    groupType,
    travelerCount,
    activityLevel,
    scope,
    locationContext
  };

  // 1. NEAR-ME or MY-CITY SCOPES
  if (scope === 'near-me' || scope === 'my-city') {
    const cityName = activeCityName;
    const destName = `${cityName}, ${activeStateName || 'India'}`;

    // Filter places by radius if set
    let places = catalog ? [...catalog.places, ...catalog.freeAlternatives] : [];
    if (radiusKm && places.length > 0) {
      places = places.map((p) => {
        if (p.latitude !== undefined && p.longitude !== undefined) {
          const d = calculateDistanceKm(anchorCoords.latitude, anchorCoords.longitude, p.latitude, p.longitude);
          return { ...p, calculatedDistance: Math.round(d * 10) / 10 };
        }
        return p;
      });
    }

    // Helper to extract stops matching categories
    const getStopsForTags = (tags: string[], fallbackOffset = 0): JourneyHighlightStop[] => {
      let matched = places.filter((p) => p.tags && p.tags.some((t) => tags.includes(t)));
      if (matched.length < 3) {
        matched = places.slice(fallbackOffset, fallbackOffset + 4);
      }
      return matched.slice(0, 3).map((p) => {
        let dist: number | undefined = undefined;
        if (p.latitude !== undefined && p.longitude !== undefined) {
          dist = Math.round(calculateDistanceKm(anchorCoords.latitude, anchorCoords.longitude, p.latitude, p.longitude) * 10) / 10;
        }
        return {
          title: p.title,
          category: p.category,
          location: p.location,
          timeSlot: p.timeSlot,
          distanceKm: dist,
          estimatedCost: p.estimatedCost
        };
      });
    };

    // Option 1: Heritage & Ancient Foundations
    const heritageStops = getStopsForTags(['heritage', 'history', 'architecture'], 0);
    const heritageSpend = heritageStops.reduce((sum, s) => sum + s.estimatedCost, 0) * travelerCount + 500;
    const heritageMaxDist = Math.max(...heritageStops.map((s) => s.distanceKm || 6), 8);

    // Option 2: Nature, Ridges & Fresh Air
    const natureStops = getStopsForTags(['nature', 'garden', 'lake', 'scenic', 'outdoors'], 3);
    const natureSpend = natureStops.reduce((sum, s) => sum + s.estimatedCost, 0) * travelerCount + 400;
    const natureMaxDist = Math.max(...natureStops.map((s) => s.distanceKm || 10), 12);

    // Option 3: Cafes, Local Bazaars & Street Food
    const foodStops = getStopsForTags(['food', 'cafe', 'bazaar', 'culture'], 1);
    const foodSpend = foodStops.reduce((sum, s) => sum + s.estimatedCost, 0) * travelerCount + 650;
    const foodMaxDist = Math.max(...foodStops.map((s) => s.distanceKm || 5), 7);

    return [
      {
        id: 'opt-heritage',
        title: `Historic Core & Heritage Quarter`,
        tagline: `Fortress gates, ancient stone shrines & historic streets`,
        vibeBadge: '🏛 Heritage & Culture',
        destination: destName,
        estimatedSpend: heritageSpend,
        pace: 'balanced',
        radiusDescription: `Within ~${Math.round(heritageMaxDist)} km of ${cityName}`,
        maxDistanceKm: heritageMaxDist,
        highlightStops: heritageStops,
        suitability: 'Ideal for architecture lovers, history buffs & unhurried city exploration.',
        themeSummary: 'Centuries-old Maratha/regional legacy, fortified gateways, and stone temple courtyards.',
        formData: {
          ...baseFormData,
          destination: destName,
          conceptTitle: 'Heritage & Architecture',
          interests: ['Culture & History', 'Architecture', 'Photography'],
          pace: 'balanced'
        }
      },
      {
        id: 'opt-nature',
        title: `Lakeside Breeze, Hills & Botanical Trails`,
        tagline: `Shaded canopy walks, freshwater ridges & scenic evening skies`,
        vibeBadge: '🍃 Nature & Lakes',
        destination: destName,
        estimatedSpend: natureSpend,
        pace: 'relaxed',
        radiusDescription: `Within ~${Math.round(natureMaxDist)} km of ${cityName}`,
        maxDistanceKm: natureMaxDist,
        highlightStops: natureStops,
        suitability: 'Best for slow travel, morning bird watching & golden hour landscapes.',
        themeSummary: 'Quiet lake sanctuaries, Japanese landscape gardens, and hill ridge sunsets.',
        formData: {
          ...baseFormData,
          destination: destName,
          conceptTitle: 'Nature & Slow Travel',
          interests: ['Nature & Outdoors', 'Hidden Gems', 'Relaxation & Wellness'],
          pace: 'relaxed'
        }
      },
      {
        id: 'opt-food',
        title: `Indie Cafes, Bazaars & Cultural Streets`,
        tagline: `Vintage Irani bakeries, artisanal brews & traditional spice lanes`,
        vibeBadge: '☕ Food & Cafes',
        destination: destName,
        estimatedSpend: foodSpend,
        pace: 'balanced',
        radiusDescription: `Within ~${Math.round(foodMaxDist)} km of ${cityName}`,
        maxDistanceKm: foodMaxDist,
        highlightStops: foodStops,
        suitability: 'Perfect for culinary enthusiasts, student quarter vibes & lively market strolls.',
        themeSummary: 'Bustling food gullies, historic college avenues, brass utensil bazaars, and chai roasters.',
        formData: {
          ...baseFormData,
          destination: destName,
          conceptTitle: 'Food & Local Markets',
          interests: ['Food & Dining', 'Local Markets', 'Hidden Gems'],
          pace: 'balanced'
        }
      }
    ];
  }

  // 2. ANYWHERE IN INDIA SCOPE
  return [
    {
      id: 'opt-india-rajasthan',
      title: 'Royal Rajasthan: Jaipur & Amber Heritage',
      tagline: 'Terracotta citadels, hill ramparts & palatial courtyards',
      vibeBadge: '👑 Royal Heritage',
      destination: 'Jaipur, Rajasthan',
      estimatedSpend: Math.min(budgetAmount, 12000),
      pace: 'balanced',
      radiusDescription: 'Northern Cultural Hub',
      maxDistanceKm: 350,
      highlightStops: [
        {
          title: 'Amer Fort & Maota Lake Panorama',
          category: 'Historic Fortress',
          location: 'Amer, Jaipur',
          timeSlot: 'morning',
          estimatedCost: 200
        },
        {
          title: 'Panna Meena Ka Kund Stepwell Geometry',
          category: 'Ancient Stepwell',
          location: 'Amer Town, Jaipur',
          timeSlot: 'afternoon',
          estimatedCost: 50
        },
        {
          title: 'Nahargarh Fort Ridge Sunset Overlook',
          category: 'Scenic Viewpoint',
          location: 'Aravalli Hills, Jaipur',
          timeSlot: 'evening',
          estimatedCost: 100
        }
      ],
      suitability: 'Grand architecture, vibrant hand-block textiles, and monumental desert forts.',
      themeSummary: 'Imposing hill ramparts overlooking pink sandstone boulevards and stepwells.',
      formData: {
        ...baseFormData,
        destination: 'Jaipur, Rajasthan',
        conceptTitle: 'Royal Rajasthan',
        interests: ['Culture & History', 'Architecture', 'Local Markets'],
        pace: 'balanced'
      }
    },
    {
      id: 'opt-india-south-nature',
      title: 'Western Ghats Mist & Highland Tea Slopes',
      tagline: 'Cardamom plantations, mountain mists & quiet canopy trails',
      vibeBadge: '🍃 Mountain Serenity',
      destination: 'Munnar, Kerala',
      estimatedSpend: Math.min(budgetAmount, 9500),
      pace: 'relaxed',
      radiusDescription: 'Western Ghats Rainforest',
      maxDistanceKm: 420,
      highlightStops: [
        {
          title: 'Lockhart Tea Estate Sunrise Walk',
          category: 'Highland Plantation',
          location: 'Devikulam, Munnar',
          timeSlot: 'morning',
          estimatedCost: 150
        },
        {
          title: 'Mattupetty Lake & Shola Forest Promenade',
          category: 'Lake & Outdoors',
          location: 'Mattupetty, Munnar',
          timeSlot: 'afternoon',
          estimatedCost: 100
        },
        {
          title: 'Pothamedu Viewpoint Dusk Panorama',
          category: 'Scenic Ridge',
          location: 'Pothamedu, Munnar',
          timeSlot: 'evening',
          estimatedCost: 50
        }
      ],
      suitability: 'Crisp mountain air, quiet tea terraces, and rejuvenating slow travel.',
      themeSummary: 'Rolling emerald plantations, cool highland breezes, and deep tranquility.',
      formData: {
        ...baseFormData,
        destination: 'Munnar, Kerala',
        conceptTitle: 'Nature & Slow Travel',
        interests: ['Nature & Outdoors', 'Hidden Gems', 'Relaxation & Wellness'],
        pace: 'relaxed'
      }
    },
    {
      id: 'opt-india-coastal',
      title: 'Portuguese Heritage & Sunkissed Coastlines',
      tagline: 'Golden sands, Latin quarters, and seaside colonial chapels',
      vibeBadge: '🌊 Coastal Escape',
      destination: 'Goa',
      estimatedSpend: Math.min(budgetAmount, 14000),
      pace: 'relaxed',
      radiusDescription: 'Konkan Coastline',
      maxDistanceKm: 300,
      highlightStops: [
        {
          title: 'Fontainhas Latin Quarter Architectural Stroll',
          category: 'Colonial Architecture',
          location: 'Panaji, Goa',
          timeSlot: 'morning',
          estimatedCost: 100
        },
        {
          title: 'Reis Magos Fort River Mouth Viewpoint',
          category: 'Coastal Bastion',
          location: 'Verem, Bardez, Goa',
          timeSlot: 'afternoon',
          estimatedCost: 150
        },
        {
          title: 'Ashwem Beach Quiet Twilight Sands',
          category: 'Secluded Shore',
          location: 'Morjim-Ashwem, North Goa',
          timeSlot: 'evening',
          estimatedCost: 100
        }
      ],
      suitability: 'Artisanal seaside cafes, historic Portuguese churches, and unhurried beach sunsets.',
      themeSummary: 'Pastel-washed colonial alleys, calm coconut groves, and sea breeze.',
      formData: {
        ...baseFormData,
        destination: 'Goa',
        conceptTitle: 'Coastal Escape',
        interests: ['Nature & Outdoors', 'Food & Dining', 'Relaxation & Wellness'],
        pace: 'relaxed'
      }
    }
  ];
}
