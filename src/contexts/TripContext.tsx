import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react';
import { useAuth } from './AuthContext';
import {
  getUserTrips,
  getTripById,
  createTripDocument,
  updateTripDocument,
  deleteTripDocument
} from '../services/tripService';
import { validateItinerary, repairItinerary } from '../services/itineraryEngine';
import { getTripAccommodationCost } from '../utils/budget';
import type { Trip, TripFormData, TripConstraint, ValidationResult } from '../types';

interface TripContextType {
  trips: Trip[];
  loadingTrips: boolean;
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
  loadUserTrips: () => Promise<void>;
  createNewTrip: (formData: TripFormData) => Promise<Trip>;
  fetchTrip: (tripId: string) => Promise<Trip | null>;
  rejectItineraryItem: (tripId: string, itemId: string, reason: string) => Promise<void>;
  swapItineraryItem: (tripId: string, itemId: string, newItemData: Partial<import('../types').ItineraryItem>) => Promise<void>;
  toggleItemVisited: (tripId: string, itemId: string, isVisited?: boolean) => Promise<void>;
  toggleItemSkipped: (tripId: string, itemId: string, isSkipped?: boolean) => Promise<void>;
  markItemUnavailable: (tripId: string, itemId: string) => Promise<void>;
  autoRepairTrip: (tripId: string) => Promise<string>;
  addCustomConstraint: (tripId: string, constraint: Omit<TripConstraint, 'id' | 'appliedAt'>) => Promise<void>;
  updateTripAccommodation: (tripId: string, accommodation: import('../types').TripAccommodation) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<Trip[]>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState<boolean>(false);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const loadUserTrips = useCallback(async () => {
    if (!user) {
      setTrips([]);
      return;
    }
    setLoadingTrips(true);
    try {
      const userTrips = await getUserTrips(user.uid);
      setTrips(userTrips);
      if (!activeTrip && userTrips.length > 0) {
        setActiveTrip(userTrips[0]);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoadingTrips(false);
    }
  }, [user, activeTrip]);

  useEffect(() => {
    if (user) {
      loadUserTrips();
    } else {
      setTrips([]);
      setActiveTrip(null);
    }
  }, [user]);

  const createNewTrip = useCallback(async (formData: TripFormData): Promise<Trip> => {
    if (!user) {
      throw new Error('You must be signed in to create a trip.');
    }
    const created = await createTripDocument(user.uid, formData);
    setTrips((prev) => [created, ...prev]);
    setActiveTrip(created);
    return created;
  }, [user]);

  const fetchTrip = useCallback(async (tripId: string): Promise<Trip | null> => {
    try {
      const trip = await getTripById(tripId);
      if (trip) {
        setActiveTrip(trip);
      }
      return trip;
    } catch (err) {
      console.error('Error loading trip by ID:', err);
      return null;
    }
  }, []);

  const rejectItineraryItem = useCallback(async (tripId: string, itemId: string, reason: string) => {
    const current = trips.find((t) => t.id === tripId) || (activeTrip?.id === tripId ? activeTrip : null);
    if (!current || !current.days) return;

    let rejectedTitle = '';
    let rejectedPlaceId: string | undefined = undefined;

    const updatedDays = current.days.map((day) => ({
      ...day,
      items: day.items.map((item) => {
        if (item.id === itemId) {
          rejectedTitle = item.title;
          rejectedPlaceId = item.placeId;
          return {
            ...item,
            isRejected: true,
            rejectionReason: reason
          };
        }
        return item;
      })
    }));

    // Record structured constraint & update excluded IDs
    const newConstraint: TripConstraint = {
      id: `c-${Date.now()}`,
      type: 'exclusion',
      placeId: rejectedPlaceId || itemId,
      placeTitle: rejectedTitle,
      description: `Excluded: ${rejectedTitle}. Reason: ${reason}`,
      appliedAt: new Date().toISOString(),
      source: 'user-reject'
    };

    const currentConstraints = current.constraints || [];
    const currentExcluded = new Set(current.excludedPlaceIds || []);
    currentExcluded.add(itemId);
    if (rejectedPlaceId) currentExcluded.add(rejectedPlaceId);

    const updatedConstraints = [...currentConstraints, newConstraint];
    const updatedExcludedList = Array.from(currentExcluded);

    const updates = {
      days: updatedDays,
      constraints: updatedConstraints,
      excludedPlaceIds: updatedExcludedList
    };

    await updateTripDocument(tripId, updates);

    const updatedTrip = { ...current, ...updates };
    setTrips((prev) => prev.map((t) => (t.id === tripId ? updatedTrip : t)));
    if (activeTrip?.id === tripId) {
      setActiveTrip(updatedTrip);
    }
  }, [trips, activeTrip]);

  const markItemUnavailable = useCallback(async (tripId: string, itemId: string) => {
    const current = trips.find((t) => t.id === tripId) || (activeTrip?.id === tripId ? activeTrip : null);
    if (!current || !current.days) return;

    let itemTitle = '';
    const updatedDays = current.days.map((day) => ({
      ...day,
      items: day.items.map((item) => {
        if (item.id === itemId) {
          itemTitle = item.title;
          return {
            ...item,
            status: 'unavailable' as const,
            rejectionReason: 'Activity marked as unavailable / cancelled'
          };
        }
        return item;
      })
    }));

    await updateTripDocument(tripId, { days: updatedDays });

    const updatedTrip = { ...current, days: updatedDays };
    setTrips((prev) => prev.map((t) => (t.id === tripId ? updatedTrip : t)));
    if (activeTrip?.id === tripId) {
      setActiveTrip(updatedTrip);
    }
  }, [trips, activeTrip]);

  const autoRepairTrip = useCallback(async (tripId: string): Promise<string> => {
    const current = trips.find((t) => t.id === tripId) || (activeTrip?.id === tripId ? activeTrip : null);
    if (!current || !current.days) return 'No active trip data found to repair.';

    const accommodationCost = getTripAccommodationCost(current.accommodation);

    const valResult = validateItinerary(current.days, {
      budgetAmount: current.budgetAmount,
      travelerCount: current.travelerCount,
      excludedPlaceIds: current.excludedPlaceIds,
      constraints: current.constraints,
      accommodationCost
    });

    if (valResult.valid) {
      return 'Itinerary is already valid; all budget and schedule constraints are satisfied.';
    }

    const repaired = repairItinerary(current.days, valResult.conflicts, {
      destination: current.destination,
      budgetAmount: current.budgetAmount,
      travelerCount: current.travelerCount,
      excludedPlaceIds: current.excludedPlaceIds,
      constraints: current.constraints,
      accommodationCost
    });

    await updateTripDocument(tripId, { days: repaired.repairedDays });

    const updatedTrip = { ...current, days: repaired.repairedDays };
    setTrips((prev) => prev.map((t) => (t.id === tripId ? updatedTrip : t)));
    if (activeTrip?.id === tripId) {
      setActiveTrip(updatedTrip);
    }

    return repaired.explanation;
  }, [trips, activeTrip]);

  const addCustomConstraint = useCallback(async (
    tripId: string,
    constraint: Omit<TripConstraint, 'id' | 'appliedAt'>
  ) => {
    const current = trips.find((t) => t.id === tripId) || (activeTrip?.id === tripId ? activeTrip : null);
    if (!current) return;

    const fullConstraint: TripConstraint = {
      ...constraint,
      id: `c-${Date.now()}`,
      appliedAt: new Date().toISOString()
    };

    const updatedConstraints = [...(current.constraints || []), fullConstraint];
    await updateTripDocument(tripId, { constraints: updatedConstraints });

    const updatedTrip = { ...current, constraints: updatedConstraints };
    setTrips((prev) => prev.map((t) => (t.id === tripId ? updatedTrip : t)));
    if (activeTrip?.id === tripId) {
      setActiveTrip(updatedTrip);
    }
  }, [trips, activeTrip]);

  const swapItineraryItem = useCallback(async (
    tripId: string,
    itemId: string,
    newItemData: Partial<import('../types').ItineraryItem>
  ) => {
    const current = trips.find((t) => t.id === tripId) || (activeTrip?.id === tripId ? activeTrip : null);
    if (!current || !current.days) return;

    let swappedOutTitle = '';
    let swappedOutPlaceId: string | undefined = undefined;

    const updatedDays = current.days.map((day) => ({
      ...day,
      items: day.items.map((item) => {
        if (item.id === itemId) {
          swappedOutTitle = item.title;
          swappedOutPlaceId = item.placeId;
          const { alternativeSuggestion, rejectionReason, isRejected, isOverBudget, ...restOfItem } = item;
          return {
            ...restOfItem,
            ...newItemData,
            status: 'active' as const,
            isVisited: false,
            isSkipped: false,
            isRejected: false,
            rejectionReason: undefined,
            isOverBudget: false,
            alternativeSuggestion: undefined
          };
        }
        return item;
      })
    }));

    // Record exclusion constraint so the swapped-out place is not recommended again
    const currentExcluded = new Set(current.excludedPlaceIds || []);
    if (itemId) currentExcluded.add(itemId);
    if (swappedOutPlaceId) currentExcluded.add(swappedOutPlaceId);
    if (swappedOutTitle) {
      currentExcluded.add(`title:${swappedOutTitle.toLowerCase().trim()}`);
    }

    const currentConstraints = current.constraints || [];
    const newConstraint: TripConstraint = {
      id: `c-${Date.now()}`,
      type: 'exclusion',
      placeId: swappedOutPlaceId || itemId,
      placeTitle: swappedOutTitle,
      description: `Swapped out: ${swappedOutTitle}`,
      appliedAt: new Date().toISOString(),
      source: 'user-reject'
    };

    const updates = {
      days: updatedDays,
      constraints: [...currentConstraints, newConstraint],
      excludedPlaceIds: Array.from(currentExcluded)
    };

    await updateTripDocument(tripId, updates);

    const updatedTrip = { ...current, ...updates };
    setTrips((prev) => prev.map((t) => (t.id === tripId ? updatedTrip : t)));
    if (activeTrip?.id === tripId) {
      setActiveTrip(updatedTrip);
    }
  }, [trips, activeTrip]);

  const toggleItemVisited = useCallback(async (
    tripId: string,
    itemId: string,
    explicitVisited?: boolean
  ) => {
    const current = trips.find((t) => t.id === tripId) || (activeTrip?.id === tripId ? activeTrip : null);
    if (!current || !current.days) return;

    const updatedDays = current.days.map((day) => ({
      ...day,
      items: day.items.map((item) => {
        if (item.id === itemId) {
          const nextVisited = explicitVisited !== undefined ? explicitVisited : !item.isVisited;
          return {
            ...item,
            isVisited: nextVisited,
            // If marked as visited, it cannot be skipped
            isSkipped: nextVisited ? false : item.isSkipped,
            status: nextVisited ? ('completed' as const) : ('active' as const)
          };
        }
        return item;
      })
    }));

    await updateTripDocument(tripId, { days: updatedDays });

    const updatedTrip = { ...current, days: updatedDays };
    setTrips((prev) => prev.map((t) => (t.id === tripId ? updatedTrip : t)));
    if (activeTrip?.id === tripId) {
      setActiveTrip(updatedTrip);
    }
  }, [trips, activeTrip]);

  const toggleItemSkipped = useCallback(async (
    tripId: string,
    itemId: string,
    explicitSkipped?: boolean
  ) => {
    const current = trips.find((t) => t.id === tripId) || (activeTrip?.id === tripId ? activeTrip : null);
    if (!current || !current.days) return;

    const updatedDays = current.days.map((day) => ({
      ...day,
      items: day.items.map((item) => {
        if (item.id === itemId) {
          const nextSkipped = explicitSkipped !== undefined ? explicitSkipped : !item.isSkipped;
          return {
            ...item,
            isSkipped: nextSkipped,
            // If marked as skipped, it cannot be visited
            isVisited: nextSkipped ? false : item.isVisited,
            status: nextSkipped ? ('skipped' as const) : ('active' as const)
          };
        }
        return item;
      })
    }));

    await updateTripDocument(tripId, { days: updatedDays });

    const updatedTrip = { ...current, days: updatedDays };
    setTrips((prev) => prev.map((t) => (t.id === tripId ? updatedTrip : t)));
    if (activeTrip?.id === tripId) {
      setActiveTrip(updatedTrip);
    }
  }, [trips, activeTrip]);

  const updateTripAccommodation = useCallback(
    async (tripId: string, accommodation: import('../types').TripAccommodation) => {
      const current = trips.find((t) => t.id === tripId) || (activeTrip?.id === tripId ? activeTrip : null);
      if (!current) return;

      await updateTripDocument(tripId, { accommodation });
      const updatedTrip = { ...current, accommodation };
      setTrips((prev) => prev.map((t) => (t.id === tripId ? updatedTrip : t)));
      if (activeTrip?.id === tripId) {
        setActiveTrip(updatedTrip);
      }
    },
    [trips, activeTrip]
  );

  const deleteTrip = useCallback(async (tripId: string): Promise<Trip[]> => {
    await deleteTripDocument(tripId);
    let remainingTrips: Trip[] = [];
    setTrips((prev) => {
      remainingTrips = prev.filter((t) => t.id !== tripId);
      return remainingTrips;
    });
    if (activeTrip?.id === tripId) {
      setActiveTrip(null);
    }
    return remainingTrips;
  }, [activeTrip]);

  return (
    <TripContext.Provider
      value={{
        trips,
        loadingTrips,
        activeTrip,
        setActiveTrip,
        loadUserTrips,
        createNewTrip,
        fetchTrip,
        rejectItineraryItem,
        swapItineraryItem,
        toggleItemVisited,
        toggleItemSkipped,
        markItemUnavailable,
        autoRepairTrip,
        addCustomConstraint,
        updateTripAccommodation,
        deleteTrip
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip(): TripContextType {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}
