export type DestinationType = 'city' | 'outstation';
export type GroupType = 'solo' | 'friends' | 'family';
export type Pace = 'relaxed' | 'balanced' | 'packed';
export type ActivityLevel = 'low' | 'medium' | 'high';
export type BudgetTier = 'budget' | 'moderate' | 'luxury';
export type TripStatus = 'planning' | 'confirmed' | 'archived';
export type SurpriseScope = 'near-me' | 'my-city' | 'india';

export interface LocationContext {
  mode: 'current-location' | 'selected-city' | 'india';
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: 'India';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  // Extensible fields for future features (friends, preferences)
  friends?: string[];
  preferences?: {
    defaultCurrency?: string;
    travelStyle?: string;
  };
}

export interface BackupCandidate {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  durationMinutes: number;
  estimatedCost: number;
  openingHours?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  reason?: string;
}

export interface TripConstraint {
  id: string;
  type: 'exclusion' | 'budget' | 'distance' | 'preference' | 'time' | 'category';
  category?: string;
  placeId?: string;
  placeTitle?: string;
  description: string;
  appliedAt: string;
  source: 'user-reject' | 'user-input' | 'system-detected';
}

export interface ItineraryConflict {
  id: string;
  type:
    | 'budget'
    | 'travel-time'
    | 'opening-hours'
    | 'duration-overlap'
    | 'duplicate-place'
    | 'excluded-place'
    | 'unavailable-activity';
  dayIndex: number;
  slot?: 'morning' | 'afternoon' | 'evening';
  itemIds: string[];
  itemTitles: string[];
  severity: 'error' | 'warning';
  message: string;
  suggestedRepair?: string;
}

export interface ValidationResult {
  valid: boolean;
  conflicts: ItineraryConflict[];
  totalCost: number;
  budgetRemaining: number;
  summary: string;
}

export interface ItineraryItem {
  id: string;
  dayIndex: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  title: string;
  description: string;
  location: string;
  estimatedCost: number;
  durationMinutes: number;
  bestVisited?: 'Morning' | 'Afternoon' | 'Evening';
  category?: string;
  openingHours?: string;
  placeId?: string;
  status?: 'active' | 'unavailable' | 'completed' | 'visited' | 'skipped';
  isVisited?: boolean;
  isSkipped?: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
  isOverBudget?: boolean;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  backupOptions?: BackupCandidate[];
  alternativeSuggestion?: {
    title: string;
    description: string;
    location: string;
    estimatedCost: number;
    category?: string;
    reason?: string;
  };
  noReplacementAvailable?: boolean;
}

export interface TripDay {
  dayIndex: number;
  date: string;
  title: string;
  theme?: string;
  items: ItineraryItem[];
}

export type StayType =
  | 'Hotel'
  | 'Hostel'
  | 'Homestay'
  | 'Resort'
  | 'Guesthouse'
  | 'Heritage Haveli'
  | 'Villa';

export interface ProviderOffer {
  provider: 'MakeMyTrip' | 'Booking.com' | 'Agoda' | 'Goibibo' | string;
  providerLogo?: string;
  pricePerNight: number;
  estimatedTotal: number;
  currency: 'INR' | string;
  roomType?: string;
  cancellationPolicy?: string;
  availability?: string;
  bookingUrl: string;
  isEstimated?: boolean;
}

export interface HotelOption {
  id: string;
  name: string;
  destination: string;
  city: string;
  state?: string;
  stayType: StayType;
  starRating?: number;
  userRating?: number;
  reviewCount?: number;
  address: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  estimatedTotal: number;
  currency: 'INR' | string;
  amenities: string[];
  tags: string[];
  matchReasons: string[];
  distanceToItineraryKm?: number;
  travelTimeToItineraryMinutes?: number;
  proximityScore?: number;
  overallScore?: number;
  isBestForTrip?: boolean;
  isWithinBudget?: boolean;
  roomType?: string;
  cancellationPolicy?: string;
  providerOffers: ProviderOffer[];
  deepLinks: {
    makeMyTrip: string;
    bookingCom: string;
    agoda: string;
    goibibo: string;
    googleHotels?: string;
    googleMaps: string;
  };
}

export interface TripAccommodation {
  required: boolean;
  status: 'none' | 'not-selected' | 'selected' | 'booking-externally' | 'already-arranged';
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  hotel?: HotelOption;
  customStayDetails?: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    estimatedCost?: number;
  };
  notes?: string;
}

export interface Trip {
  id: string;
  userId: string;
  destination: string;
  destinationType: DestinationType;
  startDate: string;
  endDate: string;
  budgetTier: BudgetTier;
  budgetAmount: number;
  groupType: GroupType;
  travelerCount: number;
  pace: Pace;
  activityLevel: ActivityLevel;
  interests: string[];
  status: TripStatus;
  days?: TripDay[];
  accommodation?: TripAccommodation;
  conceptTitle?: string;
  scope?: SurpriseScope;
  locationContext?: LocationContext;
  constraints?: TripConstraint[];
  excludedPlaceIds?: string[];
  isShared?: boolean;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedTripRecord {
  tripId: string;
  ownerId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripFormData {
  destination: string;
  destinationType: DestinationType;
  startDate: string;
  endDate: string;
  budgetTier: BudgetTier;
  budgetAmount: number;
  groupType: GroupType;
  travelerCount: number;
  pace: Pace;
  activityLevel: ActivityLevel;
  interests: string[];
  accommodation?: TripAccommodation;
  conceptTitle?: string;
  scope?: SurpriseScope;
  locationContext?: LocationContext;
  constraints?: TripConstraint[];
  excludedPlaceIds?: string[];
}

export interface GeneratePlanParams {
  destination: string;
  destinationType?: DestinationType;
  startDate: string;
  endDate: string;
  duration?: number;
  budget: number;
  travellers: number;
  groupType?: GroupType;
  pace?: Pace;
  activityLevel?: ActivityLevel;
  interests?: string[];
  conceptTitle?: string;
  placePreference?: string;
  locationContext?: LocationContext;
  constraints?: TripConstraint[];
  excludedPlaceIds?: string[];
  existingItinerary?: TripDay[];
  scope?: 'full-trip' | 'single-day' | 'single-slot';
  targetDayIndex?: number;
  targetSlot?: 'morning' | 'afternoon' | 'evening';
  targetItemId?: string;
}

export interface TripAssistantResponse {
  answer: string;
  decision?: 'YES' | 'NOT RECOMMENDED' | 'INFORMATIONAL' | 'FEASIBLE' | 'NO';
  reasoning: string[];
  actionSuggestion?: string;
  suggestedAction?: {
    type: 'add_activity' | 'replace_activity' | 'repair_budget' | 'relax_constraint';
    label: string;
    dayIndex?: number;
    slot?: 'morning' | 'afternoon' | 'evening';
    activity?: Partial<ItineraryItem>;
  };
  relatedPlaces?: Array<{
    title: string;
    category?: string;
    estimatedCost: number;
    durationMinutes: number;
    distanceKm?: number;
    description: string;
  }>;
}

export type AssistantAnswer = TripAssistantResponse;
