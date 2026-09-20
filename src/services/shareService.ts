import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateTripBudget } from '../utils/budget';
import type { Trip, SharedTripRecord } from '../types';

/**
 * Generates a cryptographically secure, random 32-character hexadecimal token.
 * Does not leak Firebase UIDs or private document IDs.
 */
export function generateSecureShareToken(): string {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for non-standard environments
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Builds the full public shareable URL for a given token.
 */
export function buildShareUrl(shareToken: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/shared-trip/${shareToken}`;
  }
  return `/shared-trip/${shareToken}`;
}

/**
 * Enables sharing for a trip:
 * - Generates or retains a secure share token
 * - Creates/updates the /sharedTrips/{shareToken} mapping doc in Firestore
 * - Updates the trip document with isShared: true and shareToken
 */
export async function enableTripSharing(trip: Trip): Promise<{ shareToken: string; shareUrl: string }> {
  const now = new Date().toISOString();
  const shareToken = trip.shareToken || generateSecureShareToken();

  // 1. Create or enable the public token lookup document
  const sharedTripRef = doc(db, 'sharedTrips', shareToken);
  const sharedRecord: SharedTripRecord = {
    tripId: trip.id,
    ownerId: trip.userId,
    enabled: true,
    createdAt: trip.createdAt || now,
    updatedAt: now
  };
  await setDoc(sharedTripRef, sharedRecord, { merge: true });

  // 2. Update the trip document to mark isShared: true and set shareToken
  const tripRef = doc(db, 'trips', trip.id);
  await updateDoc(tripRef, {
    isShared: true,
    shareToken,
    updatedAt: now
  });

  return {
    shareToken,
    shareUrl: buildShareUrl(shareToken)
  };
}

/**
 * Disables sharing for a trip:
 * - Updates /sharedTrips/{shareToken} with enabled: false
 * - Updates the trip document with isShared: false
 */
export async function disableTripSharing(tripId: string, shareToken?: string): Promise<void> {
  const now = new Date().toISOString();

  // 1. Disable token document in Firestore if token exists
  if (shareToken) {
    try {
      const sharedTripRef = doc(db, 'sharedTrips', shareToken);
      await updateDoc(sharedTripRef, {
        enabled: false,
        updatedAt: now
      });
    } catch (err) {
      console.warn('Could not update sharedTrips token doc during disable:', err);
    }
  }

  // 2. Disable on the trip document itself
  const tripRef = doc(db, 'trips', tripId);
  await updateDoc(tripRef, {
    isShared: false,
    updatedAt: now
  });
}

export type SharedTripFetchResult =
  | { status: 'active'; trip: Trip }
  | { status: 'disabled' }
  | { status: 'not_found' };

/**
 * Fetches a shared trip by token for public unauthenticated visitors:
 * - Direct document lookup on /sharedTrips/{shareToken} (no collection query or enumeration)
 * - If active, direct document lookup on /trips/{tripId} (allowed by rule if isShared is true)
 */
export async function getSharedTripByToken(shareToken: string): Promise<SharedTripFetchResult> {
  if (!shareToken || shareToken.trim().length === 0) {
    return { status: 'not_found' };
  }

  try {
    const sharedDocRef = doc(db, 'sharedTrips', shareToken);
    const sharedSnap = await getDoc(sharedDocRef);

    if (!sharedSnap.exists()) {
      return { status: 'not_found' };
    }

    const shareData = sharedSnap.data() as SharedTripRecord;
    if (!shareData || shareData.enabled !== true || !shareData.tripId) {
      return { status: 'disabled' };
    }

    // Now fetch the actual trip document
    const tripDocRef = doc(db, 'trips', shareData.tripId);
    const tripSnap = await getDoc(tripDocRef);

    if (!tripSnap.exists()) {
      return { status: 'not_found' };
    }

    const tripData = tripSnap.data() as Omit<Trip, 'id'>;
    if (!tripData || tripData.isShared !== true) {
      return { status: 'disabled' };
    }

    return {
      status: 'active',
      trip: {
        id: tripSnap.id,
        ...tripData
      }
    };
  } catch (error: any) {
    // If Firestore rules return permission-denied because sharing is disabled or trip is private:
    if (error?.code === 'permission-denied') {
      return { status: 'disabled' };
    }
    console.error('Error fetching shared trip by token:', error);
    return { status: 'not_found' };
  }
}

/**
 * Formats a clean, readable text summary of the trip itinerary
 * suitable for sharing directly in WhatsApp, Messages, or Email.
 */
export function formatTripSummaryText(trip: Trip, shareUrl?: string): string {
  const destination = trip.destination || 'Upcoming Trip';
  const dates = trip.startDate && trip.endDate ? `${trip.startDate} to ${trip.endDate}` : '';
  const daysCount = trip.days?.length || 0;
  const budget = calculateTripBudget(trip);
  
  const hotel = trip.accommodation?.hotel;
  const stay = hotel
    ? `${hotel.name}${hotel.estimatedTotal ? ` (₹${hotel.estimatedTotal.toLocaleString('en-IN')})` : ''}`
    : trip.accommodation?.customStayDetails?.name
    ? trip.accommodation.customStayDetails.name
    : null;

  const lines: string[] = [];
  lines.push(`✈️ ${destination} • Itinerary Summary`);
  if (dates) {
    lines.push(`📅 Dates: ${dates} (${daysCount} ${daysCount === 1 ? 'day' : 'days'})`);
  }
  if (trip.travelerCount) {
    lines.push(`👥 Travellers: ${trip.travelerCount} (${trip.groupType || 'Traveller'})`);
  }
  if (stay) {
    lines.push(`🏨 Stay: ${stay}`);
  }
  if (budget.targetBudget > 0) {
    if (budget.totalPlannedSpend > 0) {
      lines.push(
        `💰 Target Budget: ₹${budget.targetBudget.toLocaleString('en-IN')} (Planned Spend: ₹${budget.totalPlannedSpend.toLocaleString('en-IN')})`
      );
    } else {
      lines.push(`💰 Estimated Budget: ₹${budget.targetBudget.toLocaleString('en-IN')}`);
    }
  }

  if (trip.days && trip.days.length > 0) {
    lines.push('');
    lines.push('🗓️ Schedule:');
    trip.days.forEach((day) => {
      const activeItems = (day.items || []).filter((item) => !item.isRejected);
      const stops = activeItems.map((item) => item.title).filter(Boolean);
      const stopsText = stops.length > 0 ? stops.join(' ➔ ') : 'Free exploration';
      lines.push(`• Day ${day.dayIndex}${day.theme ? ` (${day.theme})` : ''}: ${stopsText}`);
    });
  }

  const url = shareUrl || (trip.shareToken ? buildShareUrl(trip.shareToken) : '');
  if (url) {
    lines.push('');
    lines.push(`🔗 View complete itinerary: ${url}`);
  }

  return lines.join('\n');
}

