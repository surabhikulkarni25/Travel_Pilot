import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generatePlan, generateStructuredItinerary } from './itineraryGenerator';
import { removeUndefinedFields } from '../utils/firestore';
import type { Trip, TripFormData, TripDay } from '../types';

export { generatePlan, generateStructuredItinerary };

export async function getUserTrips(userId: string): Promise<Trip[]> {
  const path = 'trips';
  try {
    const tripsRef = collection(db, 'trips');
    // Security Rule: allow list if resource.data.userId == request.auth.uid
    const q = query(tripsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const trips: Trip[] = [];
    querySnapshot.forEach((docSnap) => {
      trips.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Trip, 'id'>),
      });
    });

    // Sort client-side by createdAt descending
    return trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getTripById(tripId: string): Promise<Trip | null> {
  const path = `trips/${tripId}`;
  try {
    const tripRef = doc(db, 'trips', tripId);
    const snapshot = await getDoc(tripRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...(snapshot.data() as Omit<Trip, 'id'>),
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function createTripDocument(userId: string, formData: TripFormData): Promise<Trip> {
  const tripsRef = collection(db, 'trips');
  const newTripRef = doc(tripsRef);
  const path = `trips/${newTripRef.id}`;

  const now = new Date().toISOString();
  
  // Use central engine to generate plan with AI/validation
  let generatedDays: TripDay[] = [];
  try {
    generatedDays = await generatePlan({
      destination: formData.destination,
      destinationType: formData.destinationType,
      startDate: formData.startDate,
      endDate: formData.endDate,
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
    });
  } catch {
    generatedDays = generateStructuredItinerary(formData);
  }

  const rawTripData: Omit<Trip, 'id'> = {
    userId,
    destination: formData.destination,
    destinationType: formData.destinationType || 'city',
    startDate: formData.startDate,
    endDate: formData.endDate,
    budgetTier: formData.budgetTier || 'moderate',
    budgetAmount: Number(formData.budgetAmount) || 25000,
    groupType: formData.groupType || 'solo',
    travelerCount: Number(formData.travelerCount) || 1,
    pace: formData.pace || 'balanced',
    activityLevel: formData.activityLevel || 'medium',
    interests: formData.interests || [],
    status: 'planning',
    days: generatedDays,
    ...(formData.accommodation ? { accommodation: formData.accommodation } : {}),
    ...(formData.conceptTitle ? { conceptTitle: formData.conceptTitle } : {}),
    ...(formData.scope ? { scope: formData.scope } : {}),
    ...(formData.locationContext ? { locationContext: formData.locationContext } : {}),
    ...(formData.constraints ? { constraints: formData.constraints } : {}),
    ...(formData.excludedPlaceIds ? { excludedPlaceIds: formData.excludedPlaceIds } : {}),
    createdAt: now,
    updatedAt: now,
  };

  const tripData = removeUndefinedFields(rawTripData);

  try {
    await setDoc(newTripRef, tripData);
    return {
      id: newTripRef.id,
      ...tripData,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateTripDocument(tripId: string, updates: Partial<Trip>): Promise<void> {
  const path = `trips/${tripId}`;
  try {
    const tripRef = doc(db, 'trips', tripId);
    const cleanedUpdates = removeUndefinedFields({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(tripRef, cleanedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteTripDocument(tripId: string): Promise<void> {
  const path = `trips/${tripId}`;
  try {
    const tripRef = doc(db, 'trips', tripId);
    const deleteOp = deleteDoc(tripRef);
    const timeoutOp = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Deletion operation timed out. Please verify your connection.')), 8000)
    );
    await Promise.race([deleteOp, timeoutOp]);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}
