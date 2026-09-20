/**
 * Location Service for TravelPilot
 *
 * Provides:
 * 1. Native browser geolocation helper (single non-intrusive lookup, no continuous tracking).
 * 2. Great-circle distance calculations using Haversine formula.
 * 3. Spatial index of major Indian city centers for fast nearest-city resolution.
 * 4. Concept relevance scoring for candidate place ranking.
 */

import type { LocationContext } from '../types';
import type { ActivityCandidate } from '../data/destinationCatalog';

export interface CityCenter {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  aliases?: string[];
}

export const INDIAN_CITY_CENTERS: CityCenter[] = [
  // Maharashtra
  { city: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567, aliases: ['Poona', 'PNQ'] },
  { city: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, aliases: ['Bombay', 'BOM'] },
  { city: 'Lonavala', state: 'Maharashtra', latitude: 18.7557, longitude: 73.4091, aliases: ['Khandala'] },
  { city: 'Mahabaleshwar', state: 'Maharashtra', latitude: 17.9237, longitude: 73.6586 },
  { city: 'Alibaug', state: 'Maharashtra', latitude: 18.6414, longitude: 72.8722 },
  { city: 'Nashik', state: 'Maharashtra', latitude: 19.9975, longitude: 73.7898 },
  { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', latitude: 19.8762, longitude: 75.3433, aliases: ['Aurangabad'] },

  // Goa
  { city: 'Goa', state: 'Goa', latitude: 15.4909, longitude: 73.8278, aliases: ['Panaji', 'North Goa', 'South Goa', 'GOI'] },

  // Rajasthan
  { city: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873, aliases: ['Pink City', 'JAI'] },
  { city: 'Udaipur', state: 'Rajasthan', latitude: 24.5854, longitude: 73.7125, aliases: ['City of Lakes', 'UDR'] },
  { city: 'Jodhpur', state: 'Rajasthan', latitude: 26.2389, longitude: 73.0243, aliases: ['Blue City', 'JDH'] },
  { city: 'Jaisalmer', state: 'Rajasthan', latitude: 26.9157, longitude: 70.9083 },
  { city: 'Pushkar', state: 'Rajasthan', latitude: 26.4899, longitude: 74.5511 },

  // Delhi NCR
  { city: 'Delhi', state: 'Delhi NCR', latitude: 28.6139, longitude: 77.2090, aliases: ['New Delhi', 'NCR', 'DEL'] },

  // Karnataka
  { city: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946, aliases: ['Bangalore', 'BLR'] },
  { city: 'Mysuru', state: 'Karnataka', latitude: 12.2958, longitude: 76.6394, aliases: ['Mysore'] },
  { city: 'Coorg', state: 'Karnataka', latitude: 12.3375, longitude: 75.8069, aliases: ['Kodagu', 'Madikeri'] },
  { city: 'Hampi', state: 'Karnataka', latitude: 15.3350, longitude: 76.4600 },
  { city: 'Gokarna', state: 'Karnataka', latitude: 14.5479, longitude: 74.3188 },

  // Kerala
  { city: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673, aliases: ['Cochin', 'COK'] },
  { city: 'Munnar', state: 'Kerala', latitude: 10.0889, longitude: 77.0595 },
  { city: 'Alleppey', state: 'Kerala', latitude: 9.4981, longitude: 76.3388, aliases: ['Alappuzha'] },
  { city: 'Wayanad', state: 'Kerala', latitude: 11.6854, longitude: 76.1320 },
  { city: 'Varkala', state: 'Kerala', latitude: 8.7379, longitude: 76.7163 },

  // Telangana & Andhra Pradesh
  { city: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867, aliases: ['HYD'] },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', latitude: 17.6868, longitude: 83.2185, aliases: ['Vizag'] },

  // Tamil Nadu & Puducherry
  { city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, aliases: ['Madras', 'MAA'] },
  { city: 'Pondicherry', state: 'Puducherry', latitude: 11.9416, longitude: 79.8083, aliases: ['Puducherry'] },
  { city: 'Madurai', state: 'Tamil Nadu', latitude: 9.9252, longitude: 78.1198 },
  { city: 'Ooty', state: 'Tamil Nadu', latitude: 11.4102, longitude: 76.6950, aliases: ['Udhagamandalam'] },

  // West Bengal
  { city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639, aliases: ['Calcutta', 'CCU'] },
  { city: 'Darjeeling', state: 'West Bengal', latitude: 27.0410, longitude: 88.2663 },

  // Uttar Pradesh
  { city: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.3176, longitude: 82.9739, aliases: ['Banaras', 'Kashi'] },
  { city: 'Agra', state: 'Uttar Pradesh', latitude: 27.1767, longitude: 78.0081 },
  { city: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },

  // Uttarakhand & Himachal Pradesh
  { city: 'Rishikesh', state: 'Uttarakhand', latitude: 30.0869, longitude: 78.2676 },
  { city: 'Manali', state: 'Himachal Pradesh', latitude: 32.2432, longitude: 77.1892 },
  { city: 'Shimla', state: 'Himachal Pradesh', latitude: 31.1048, longitude: 77.1734 },
  { city: 'Bir Billing', state: 'Himachal Pradesh', latitude: 32.0494, longitude: 76.7176 }
];

/**
 * Calculates distance in kilometers between two geographic coordinates using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Finds the nearest known Indian city for a given latitude and longitude.
 */
export function findNearestIndianCity(
  latitude: number,
  longitude: number
): { city: string; state: string; distanceKm: number } {
  let nearestCity = INDIAN_CITY_CENTERS[0];
  let minDistance = Infinity;

  for (const center of INDIAN_CITY_CENTERS) {
    const dist = calculateDistanceKm(latitude, longitude, center.latitude, center.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = center;
    }
  }

  return {
    city: nearestCity.city,
    state: nearestCity.state,
    distanceKm: minDistance
  };
}

/**
 * Resolves coordinates for a known city name or search string.
 */
export function findCityCoordinates(cityName: string): { latitude: number; longitude: number; state: string } | null {
  const cleaned = cityName.toLowerCase().trim();
  for (const center of INDIAN_CITY_CENTERS) {
    if (
      cleaned.includes(center.city.toLowerCase()) ||
      center.city.toLowerCase().includes(cleaned) ||
      center.aliases?.some((a) => cleaned.includes(a.toLowerCase()))
    ) {
      return {
        latitude: center.latitude,
        longitude: center.longitude,
        state: center.state
      };
    }
  }
  return null;
}

export type GeolocationErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface GeolocationResult {
  latitude: number;
  longitude: number;
}

/**
 * Request single non-continuous location from browser Geolocation API.
 * Never tracks in background.
 */
export async function requestUserGeolocation(): Promise<GeolocationResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    const err = new Error('Browser does not support geolocation.');
    (err as any).code = 'NOT_SUPPORTED';
    throw err;
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let code: GeolocationErrorCode = 'UNKNOWN';
        if (error.code === error.PERMISSION_DENIED) {
          code = 'PERMISSION_DENIED';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          code = 'POSITION_UNAVAILABLE';
        } else if (error.code === error.TIMEOUT) {
          code = 'TIMEOUT';
        }

        const err = new Error(error.message || 'Failed to obtain location');
        (err as any).code = code;
        reject(err);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // Cache up to 5 minutes
      }
    );
  });
}

/**
 * Computes semantic matching score between an ActivityCandidate and a concept/interests.
 */
export function getConceptMatchScore(
  candidate: ActivityCandidate,
  conceptTitle?: string,
  interests?: string[]
): number {
  let score = 0;
  if (!conceptTitle && (!interests || interests.length === 0)) {
    return 10;
  }

  const cTitle = (conceptTitle || '').toLowerCase();
  const cat = (candidate.category || '').toLowerCase();
  const desc = (candidate.description || '').toLowerCase();
  const title = (candidate.title || '').toLowerCase();
  const tags = (candidate.tags || []).map((t) => t.toLowerCase());

  // Concept title keywords mapping
  if (cTitle.includes('nature') || cTitle.includes('slow')) {
    if (cat.includes('nature') || cat.includes('lake') || cat.includes('trek') || cat.includes('botanical') || cat.includes('ridge')) score += 40;
    if (tags.some((t) => ['nature', 'trek', 'lake', 'sunset', 'viewpoint', 'garden'].includes(t))) score += 20;
    if (desc.includes('lake') || desc.includes('tree') || desc.includes('hill') || desc.includes('breeze') || desc.includes('garden')) score += 15;
  } else if (cTitle.includes('heritage') || cTitle.includes('architecture') || cTitle.includes('royal')) {
    if (cat.includes('heritage') || cat.includes('fort') || cat.includes('palace') || cat.includes('museum') || cat.includes('archaeology')) score += 40;
    if (tags.some((t) => ['heritage', 'palace', 'history', 'architecture', 'monument', 'stepwell'].includes(t))) score += 20;
    if (desc.includes('citadel') || desc.includes('fort') || desc.includes('century') || desc.includes('palace') || desc.includes('carved')) score += 15;
  } else if (cTitle.includes('food') || cTitle.includes('market')) {
    if (cat.includes('cafe') || cat.includes('culinary') || cat.includes('market') || cat.includes('bazaar') || cat.includes('dining')) score += 40;
    if (tags.some((t) => ['food', 'bazaar', 'cafe', 'sweets', 'spices'].includes(t))) score += 20;
    if (desc.includes('bazaar') || desc.includes('food') || desc.includes('chaat') || desc.includes('cafe') || desc.includes('bakery')) score += 15;
  } else if (cTitle.includes('spiritual') || cTitle.includes('cultural')) {
    if (cat.includes('spiritual') || cat.includes('temple') || cat.includes('worship') || cat.includes('sanctum') || cat.includes('culture')) score += 40;
    if (tags.some((t) => ['spiritual', 'temple', 'ghat', 'culture'].includes(t))) score += 20;
  } else if (cTitle.includes('art') || cTitle.includes('cafe')) {
    if (cat.includes('cafe') || cat.includes('art') || cat.includes('culinary') || cat.includes('museum')) score += 40;
    if (tags.some((t) => ['art', 'cafe', 'museum', 'culture'].includes(t))) score += 20;
  } else if (cTitle.includes('adventure') || cTitle.includes('outdoor')) {
    if (cat.includes('trek') || cat.includes('mountain') || cat.includes('outdoors') || cat.includes('lake')) score += 40;
    if (tags.some((t) => ['trek', 'adventure', 'outdoors', 'hill'].includes(t))) score += 20;
  } else if (cTitle.includes('coastal')) {
    if (cat.includes('beach') || cat.includes('coastal') || cat.includes('waterfront') || cat.includes('island')) score += 40;
    if (tags.some((t) => ['beach', 'sea', 'coast', 'sunset'].includes(t))) score += 20;
  }

  // Interests matching
  if (interests && interests.length > 0) {
    for (const interest of interests) {
      const iLower = interest.toLowerCase();
      if (cat.includes(iLower) || desc.includes(iLower) || title.includes(iLower)) {
        score += 10;
      }
    }
  }

  return score;
}
