import type { Trip, TripDay, ItineraryItem } from '../types';

export interface GeoPoint {
  lat?: number;
  lng?: number;
  name: string;
}

/**
 * Resolves the best known origin for a local ride/navigation action in strict order:
 * 1. Previous itinerary activity on the same day, if one exists
 * 2. Selected hotel, if this is the first activity of the day
 * 3. User's current location, only when explicitly available/allowed
 * Never invents an origin.
 */
export function resolveLocalOrigin(
  trip: Trip,
  currentDay: TripDay,
  currentItem: ItineraryItem
): GeoPoint | null {
  const items = currentDay?.items || [];
  const idx = items.findIndex((i) => i.id === currentItem.id);

  // 1. Previous itinerary activity, if one exists
  if (idx > 0) {
    for (let i = idx - 1; i >= 0; i--) {
      const prev = items[i];
      if (prev && prev.title) {
        return {
          lat: prev.latitude,
          lng: prev.longitude,
          name: prev.title
        };
      }
    }
  }

  // 2. Selected hotel, if this is the first activity of the day
  const hotel = trip.accommodation?.hotel;
  if (hotel && hotel.name) {
    return {
      lat: hotel.latitude,
      lng: hotel.longitude,
      name: hotel.name
    };
  }

  // 3. User's current location, only when explicitly available/allowed
  if (trip.locationContext?.latitude && trip.locationContext?.longitude) {
    return {
      lat: trip.locationContext.latitude,
      lng: trip.locationContext.longitude,
      name: trip.locationContext.city || 'Current Location'
    };
  }

  // Do not invent an origin
  return null;
}

/**
 * Constructs an official Uber Universal Link prefilling pickup & dropoff.
 * Where coordinates are known, they are appended along with place names.
 */
export function buildUberLink(origin: GeoPoint, destination: GeoPoint): string {
  const params = new URLSearchParams({
    action: 'setPickup',
    'pickup[nickname]': origin.name,
    'dropoff[nickname]': destination.name
  });

  if (origin.lat !== undefined && origin.lng !== undefined) {
    params.set('pickup[latitude]', String(origin.lat));
    params.set('pickup[longitude]', String(origin.lng));
  }

  if (destination.lat !== undefined && destination.lng !== undefined) {
    params.set('dropoff[latitude]', String(destination.lat));
    params.set('dropoff[longitude]', String(destination.lng));
  }

  return `https://m.uber.com/ul/?${params.toString()}`;
}

/**
 * Ola and Rapido do not provide a publicly documented web URL parameter spec
 * for prefilling pickup and dropoff. Rather than invent fake parameters, we link
 * directly to their official ride portals.
 */
export function buildOlaLink(): string {
  return 'https://www.olacabs.com/';
}

export function buildRapidoLink(): string {
  return 'https://www.rapido.bike/';
}

/**
 * Builds standard Google Maps directions link with origin and destination.
 */
export function buildGoogleMapsDirectionsLink(origin: GeoPoint, destination: GeoPoint): string {
  const originParam =
    origin.lat !== undefined && origin.lng !== undefined
      ? `${origin.lat},${origin.lng}`
      : encodeURIComponent(origin.name);

  const destParam =
    destination.lat !== undefined && destination.lng !== undefined
      ? `${destination.lat},${destination.lng}`
      : encodeURIComponent(destination.name);

  return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}`;
}
