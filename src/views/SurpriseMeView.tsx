import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Sparkles,
  Compass,
  MapPin,
  ArrowRight,
  Landmark,
  Utensils,
  Trees,
  Flame,
  Mountain,
  Palette,
  Crown,
  Waves,
  Navigation,
  Building,
  Globe,
  AlertCircle,
  Check,
  RotateCcw,
  Sliders,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Coins,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  Wallet,
  Activity
} from 'lucide-react';
import { useTrip } from '../contexts/TripContext';
import { formatINR } from '../utils/currency';
import { DestinationAutocomplete } from '../components/DestinationAutocomplete';
import { requestUserGeolocation, findNearestIndianCity, findCityCoordinates } from '../services/locationService';
import { generateSurpriseOptions, SurpriseJourneyOption } from '../services/surpriseOptionsService';
import type { GroupType, ActivityLevel, Pace, BudgetTier, LocationContext, SurpriseScope } from '../types';

interface TravelConcept {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Landmark;
  colorBg: string;
  colorText: string;
  colorAccent: string;
  destinations: { city: string; state: string; type: 'city' | 'outstation' }[];
  pacing: Pace;
  interests: string[];
  description: string;
}

const TRAVEL_CONCEPTS: TravelConcept[] = [
  {
    id: 'heritage',
    title: 'Heritage & Architecture',
    subtitle: 'Stepwells, fortresses & historic stone',
    icon: Landmark,
    colorBg: 'bg-[#FAF8F5]',
    colorText: 'text-[#1D4E4F]',
    colorAccent: '#1D4E4F',
    destinations: [
      { city: 'Jaipur', state: 'Rajasthan', type: 'city' },
      { city: 'Pune', state: 'Maharashtra', type: 'city' },
      { city: 'Hampi', state: 'Karnataka', type: 'outstation' }
    ],
    pacing: 'balanced',
    interests: ['Culture & History', 'Architecture', 'Photography'],
    description: 'Centuries-old citadels, symmetrical stepwells, and monumental stone carvings.'
  },
  {
    id: 'food',
    title: 'Food & Local Markets',
    subtitle: 'Street flavours, heritage cafes & bazaars',
    icon: Utensils,
    colorBg: 'bg-[#F9EFEA]',
    colorText: 'text-[#D96B43]',
    colorAccent: '#D96B43',
    destinations: [
      { city: 'Mumbai', state: 'Maharashtra', type: 'city' },
      { city: 'Delhi', state: 'NCR', type: 'city' },
      { city: 'Lucknow', state: 'Uttar Pradesh', type: 'city' }
    ],
    pacing: 'balanced',
    interests: ['Food & Dining', 'Local Markets', 'Hidden Gems'],
    description: 'Iconic street food gullies, historic Irani bakeries, and bustling spice bazaars.'
  },
  {
    id: 'nature',
    title: 'Nature & Slow Travel',
    subtitle: 'Tea slopes, mountain mists & quiet trails',
    icon: Trees,
    colorBg: 'bg-[#EBF2F1]',
    colorText: 'text-[#1D4E4F]',
    colorAccent: '#1D4E4F',
    destinations: [
      { city: 'Munnar', state: 'Kerala', type: 'outstation' },
      { city: 'Coorg', state: 'Karnataka', type: 'outstation' },
      { city: 'Wayanad', state: 'Kerala', type: 'outstation' }
    ],
    pacing: 'relaxed',
    interests: ['Nature & Outdoors', 'Hidden Gems', 'Relaxation & Wellness'],
    description: 'Verdant cardamom hills, early morning canopy walks, and peaceful unhurried moments.'
  },
  {
    id: 'spiritual',
    title: 'Spiritual & Cultural',
    subtitle: 'Sacred river ghats, aartis & rituals',
    icon: Flame,
    colorBg: 'bg-[#FAF8F5]',
    colorText: 'text-[#D96B43]',
    colorAccent: '#D96B43',
    destinations: [
      { city: 'Varanasi', state: 'Uttar Pradesh', type: 'city' },
      { city: 'Rishikesh', state: 'Uttarakhand', type: 'outstation' },
      { city: 'Madurai', state: 'Tamil Nadu', type: 'city' }
    ],
    pacing: 'relaxed',
    interests: ['Culture & History', 'Local Markets', 'Photography'],
    description: 'Dawn wooden boat journeys, sacred lamps on the water, and ancient temple corridors.'
  },
  {
    id: 'adventure',
    title: 'Adventure & Outdoors',
    subtitle: 'Alpine valleys, river rapids & ridge hikes',
    icon: Mountain,
    colorBg: 'bg-[#EBF2F1]',
    colorText: 'text-[#1D4E4F]',
    colorAccent: '#1D4E4F',
    destinations: [
      { city: 'Manali', state: 'Himachal Pradesh', type: 'outstation' },
      { city: 'Rishikesh', state: 'Uttarakhand', type: 'outstation' },
      { city: 'Bir Billing', state: 'Himachal Pradesh', type: 'outstation' }
    ],
    pacing: 'packed',
    interests: ['Nature & Outdoors', 'Hidden Gems'],
    description: 'Pine-scented high altitudes, fast-flowing mountain rivers, and rugged Himalayan panoramas.'
  },
  {
    id: 'art-cafes',
    title: 'Art & Cafés',
    subtitle: 'Indie roasters, galleries & bohemian lanes',
    icon: Palette,
    colorBg: 'bg-[#FAF8F5]',
    colorText: 'text-[#1A202C]',
    colorAccent: '#1A202C',
    destinations: [
      { city: 'Mumbai', state: 'Maharashtra', type: 'city' },
      { city: 'Pondicherry', state: 'Puducherry', type: 'city' },
      { city: 'Bengaluru', state: 'Karnataka', type: 'city' }
    ],
    pacing: 'relaxed',
    interests: ['Art & Museums', 'Food & Dining', 'Photography'],
    description: 'Art Deco neighborhoods, heritage coffeehouses, and contemporary galleries.'
  },
  {
    id: 'royal-rajasthan',
    title: 'Royal Rajasthan',
    subtitle: 'Palatial courtyards & golden desert dunes',
    icon: Crown,
    colorBg: 'bg-[#F9EFEA]',
    colorText: 'text-[#D96B43]',
    colorAccent: '#D96B43',
    destinations: [
      { city: 'Jaipur', state: 'Rajasthan', type: 'city' },
      { city: 'Udaipur', state: 'Rajasthan', type: 'city' },
      { city: 'Jodhpur', state: 'Rajasthan', type: 'city' }
    ],
    pacing: 'balanced',
    interests: ['Culture & History', 'Architecture', 'Food & Dining'],
    description: 'Marble lake pavilions, majestic hilltop ramparts, and royal dining banquets.'
  },
  {
    id: 'coastal',
    title: 'Coastal Escape',
    subtitle: 'Sunkissed shores, seafood & colonial villas',
    icon: Waves,
    colorBg: 'bg-[#EBF2F1]',
    colorText: 'text-[#1D4E4F]',
    colorAccent: '#1D4E4F',
    destinations: [
      { city: 'Goa', state: 'Goa', type: 'outstation' },
      { city: 'Gokarna', state: 'Karnataka', type: 'outstation' },
      { city: 'Varkala', state: 'Kerala', type: 'outstation' }
    ],
    pacing: 'relaxed',
    interests: ['Nature & Outdoors', 'Food & Dining', 'Relaxation & Wellness'],
    description: 'Golden palm beaches, Portuguese heritage churches, and fresh beachside catch.'
  }
];

const POPULAR_CITIES = [
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Delhi', state: 'NCR' }
];

export function SurpriseMeView() {
  const [, setLocation] = useLocation();
  const { createNewTrip } = useTrip();

  // Exploration Scope & Location State
  const [scope, setScope] = useState<SurpriseScope>('near-me');
  const [locationContext, setLocationContext] = useState<LocationContext>({
    mode: 'current-location',
    latitude: null,
    longitude: null,
    city: null,
    state: null,
    country: 'India'
  });

  // Geolocation interaction state
  const [showLocationPrompt, setShowLocationPrompt] = useState<boolean>(false);
  const [requestingLocation, setRequestingLocation] = useState<boolean>(false);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [manualCityInput, setManualCityInput] = useState<string>('Pune, Maharashtra');
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);

  // User constraints (Flexible & Dynamic)
  const [durationDays, setDurationDays] = useState<number>(2);
  const [budgetAmount, setBudgetAmount] = useState<number>(6000);
  const [isBudgetFlexible, setIsBudgetFlexible] = useState<boolean>(false);
  const [groupType, setGroupType] = useState<GroupType>('solo');
  const [travelerCount, setTravelerCount] = useState<number>(1);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('medium');
  const [radiusKm, setRadiusKm] = useState<number | null>(25); // null = any distance
  const [selectedVibe, setSelectedVibe] = useState<string>('all');
  const [generating, setGenerating] = useState<boolean>(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string>('nature');
  const [showThematicConcepts, setShowThematicConcepts] = useState<boolean>(false);
  const [randomSeed, setRandomSeed] = useState<number>(0);

  // Handle switching exploration scope
  const handleSelectScope = (newScope: SurpriseScope) => {
    setScope(newScope);
    if (newScope === 'near-me') {
      // If we don't have user coordinates yet, show explanation prompt
      if (!locationContext.latitude || !locationContext.longitude) {
        setShowLocationPrompt(true);
      } else {
        setLocationContext((prev) => ({ ...prev, mode: 'current-location' }));
      }
    } else if (newScope === 'my-city') {
      setShowLocationPrompt(false);
      // Ensure we have a selected city
      const city = locationContext.city || 'Pune';
      const state = locationContext.state || 'Maharashtra';
      const coords = findCityCoordinates(city);
      setLocationContext({
        mode: 'selected-city',
        city,
        state,
        country: 'India',
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null
      });
    } else {
      // Anywhere in India
      setShowLocationPrompt(false);
      setLocationDenied(false);
      setLocationContext({
        mode: 'india',
        latitude: null,
        longitude: null,
        city: null,
        state: null,
        country: 'India'
      });
    }
  };

  // Trigger browser geolocation with user consent
  const handleAllowLocation = async () => {
    setRequestingLocation(true);
    setLocationDenied(false);
    try {
      const coords = await requestUserGeolocation();
      const nearest = findNearestIndianCity(coords.latitude, coords.longitude);
      setLocationContext({
        mode: 'current-location',
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: nearest.city,
        state: nearest.state,
        country: 'India'
      });
      setShowLocationPrompt(false);
    } catch {
      setLocationDenied(true);
      setShowLocationPrompt(false);
    } finally {
      setRequestingLocation(false);
    }
  };

  const handleSelectManualCity = (cityName: string, stateName: string) => {
    const coords = findCityCoordinates(cityName);
    setLocationContext({
      mode: 'selected-city',
      city: cityName,
      state: stateName,
      country: 'India',
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null
    });
    setManualCityInput(`${cityName}, ${stateName}`);
    setScope('my-city');
    setShowCityPicker(false);
    setLocationDenied(false);
    setShowLocationPrompt(false);
  };

  const activeCityName = locationContext.city || (scope === 'near-me' ? 'Pune' : 'Pune');
  const activeStateName = locationContext.state || 'Maharashtra';

  // Live calculation of 3 tailored journey proposals for decision making
  const surpriseOptions: SurpriseJourneyOption[] = useMemo(() => {
    return generateSurpriseOptions({
      scope,
      activeCityName: scope === 'india' ? 'Jaipur' : activeCityName,
      activeStateName: scope === 'india' ? 'Rajasthan' : activeStateName,
      locationContext,
      durationDays,
      budgetAmount,
      isBudgetFlexible,
      travelerCount,
      groupType,
      activityLevel,
      radiusKm,
      selectedVibes: selectedVibe === 'all' ? [] : [selectedVibe]
    });
  }, [
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
    selectedVibe,
    randomSeed
  ]);

  const handleSelectOption = async (option: SurpriseJourneyOption) => {
    setGenerating(true);
    try {
      const created = await createNewTrip(option.formData);
      setLocation(`/trip/${created.id}`);
    } catch (err) {
      console.error('Error creating trip from option:', err);
      setGenerating(false);
    }
  };

  const handleShuffleOptions = () => {
    setRandomSeed((prev) => prev + 1);
  };

  const handleGenerateForConcept = async (concept: TravelConcept) => {
    setGenerating(true);
    try {
      let destinationString = '';
      let destinationType: 'city' | 'outstation' = 'city';

      if (scope === 'near-me' || scope === 'my-city') {
        // Within my city / nearby: STRICTLY use the determined local city
        const city = locationContext.city || 'Pune';
        const state = locationContext.state || 'Maharashtra';
        destinationString = `${city}, ${state}`;
        destinationType = 'city';
      } else {
        // Anywhere in India: Broad discovery mode
        const destObj = concept.destinations[Math.floor(Math.random() * concept.destinations.length)];
        destinationString = `${destObj.city}, ${destObj.state}`;
        destinationType = destObj.type;
      }

      // Spontaneous date setup: starts tomorrow or upcoming weekend for near-me
      const daysAhead = scope === 'near-me' ? 1 : 14;
      const startDateObj = new Date(Date.now() + 86400000 * daysAhead);
      const endDateObj = new Date(startDateObj.getTime() + 86400000 * (durationDays - 1));

      const startDateStr = startDateObj.toISOString().split('T')[0];
      const endDateStr = endDateObj.toISOString().split('T')[0];

      let budgetTier: BudgetTier = 'moderate';
      if (budgetAmount <= 6000) budgetTier = 'budget';
      else if (budgetAmount >= 30000) budgetTier = 'luxury';

      const created = await createNewTrip({
        destination: destinationString,
        destinationType,
        startDate: startDateStr,
        endDate: endDateStr,
        budgetTier,
        budgetAmount: isBudgetFlexible ? 25000 : budgetAmount,
        groupType,
        travelerCount,
        pace: concept.pacing,
        activityLevel,
        interests: concept.interests,
        conceptTitle: concept.title,
        scope,
        locationContext
      });

      setLocation(`/trip/${created.id}`);
    } catch (err) {
      console.error('Error generating surprise trip:', err);
      setGenerating(false);
    }
  };

  const handleSurpriseAny = () => {
    if (surpriseOptions.length > 0) {
      const randomOption = surpriseOptions[Math.floor(Math.random() * surpriseOptions.length)];
      handleSelectOption(randomOption);
      return;
    }
    const randomConcept = TRAVEL_CONCEPTS[Math.floor(Math.random() * TRAVEL_CONCEPTS.length)];
    setSelectedConceptId(randomConcept.id);
    handleGenerateForConcept(randomConcept);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#F9EFEA] text-[#D96B43] text-xs font-mono-meta uppercase tracking-wider mb-4 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Spontaneous Discovery • India</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1A202C] tracking-tight">
          Surprise Me
        </h1>
        <p className="text-sm sm:text-base text-[#576574] mt-2 leading-relaxed">
          Spontaneous, location-aware travel itineraries crafted within your exact budget, duration, and party size.
        </p>
      </div>

      {/* Exploration Scope Selector (Compact Top Selector) */}
      <div className="max-w-2xl mx-auto mb-8 bg-white rounded-3xl p-5 sm:p-6 border border-[#E7E2D9] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-base font-bold text-[#1A202C]">
              Where should we explore?
            </h2>
            <p className="text-xs text-[#576574] mt-0.5">
              Choose your geographic exploration boundary.
            </p>
          </div>

          {/* Active Context Indicator */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E7E2D9] text-xs font-medium text-[#1A202C] shrink-0">
            {scope === 'near-me' && (
              <>
                <Navigation className="w-3.5 h-3.5 text-[#1D4E4F]" />
                <span>
                  {locationContext.latitude
                    ? `Near you • ${activeCityName}`
                    : `Near ${activeCityName}`}
                </span>
              </>
            )}
            {scope === 'my-city' && (
              <>
                <Building className="w-3.5 h-3.5 text-[#1D4E4F]" />
                <span>{activeCityName}, {activeStateName}</span>
              </>
            )}
            {scope === 'india' && (
              <>
                <Globe className="w-3.5 h-3.5 text-[#D96B43]" />
                <span>Anywhere in India</span>
              </>
            )}
          </div>
        </div>

        {/* 3 Scope Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleSelectScope('near-me')}
            className={`px-4 py-3 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              scope === 'near-me'
                ? 'bg-[#1D4E4F] text-white border-[#1D4E4F] shadow-xs'
                : 'bg-[#FAF8F5] text-[#1A202C] border-[#E7E2D9] hover:border-[#1D4E4F]'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Near Me</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScope('my-city')}
            className={`px-4 py-3 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              scope === 'my-city'
                ? 'bg-[#1D4E4F] text-white border-[#1D4E4F] shadow-xs'
                : 'bg-[#FAF8F5] text-[#1A202C] border-[#E7E2D9] hover:border-[#1D4E4F]'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>My City</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectScope('india')}
            className={`px-4 py-3 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              scope === 'india'
                ? 'bg-[#1D4E4F] text-white border-[#1D4E4F] shadow-xs'
                : 'bg-[#FAF8F5] text-[#1A202C] border-[#E7E2D9] hover:border-[#1D4E4F]'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Anywhere in India</span>
          </button>
        </div>

        {/* Friendly Explanation Prompt before requesting Location */}
        {showLocationPrompt && (
          <div className="mt-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#1D4E4F]/30 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center shrink-0 mt-0.5">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-sm font-bold text-[#1A202C]">
                  Find spontaneous experiences near you
                </h3>
                <p className="text-xs text-[#576574] mt-1 leading-relaxed">
                  TravelPilot uses your current location to find places that are practical to reach right now, prioritizing close proximity and minimizing transit time.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAllowLocation}
                    disabled={requestingLocation}
                    className="px-4 py-1.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <span>{requestingLocation ? 'Locating...' : 'Allow Location'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocationPrompt(false);
                      handleSelectScope('my-city');
                      setShowCityPicker(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E7E2D9] text-[#576574] hover:text-[#1A202C] text-xs font-medium transition-all cursor-pointer"
                  >
                    Choose City Instead
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permission Denied Fallback Notice */}
        {locationDenied && (
          <div className="mt-4 p-4 rounded-2xl bg-[#F9EFEA] border border-[#D96B43]/30 text-left">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-[#D96B43] shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-serif text-sm font-bold text-[#1A202C]">
                  Location access is off
                </h3>
                <p className="text-xs text-[#576574] mt-0.5">
                  Choose your city to discover nearby experiences without sharing location.
                </p>
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectScope('my-city');
                      setShowCityPicker(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#D96B43] hover:bg-[#B85530] text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Choose City
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* City Selector (when My City is selected or Choose City is clicked) */}
        {scope === 'my-city' && (
          <div className="mt-4 pt-4 border-t border-[#E7E2D9]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono-meta uppercase tracking-wider text-[#576574] font-semibold">
                Selected Exploration City
              </span>
              <button
                type="button"
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="text-xs text-[#1D4E4F] hover:underline font-medium cursor-pointer"
              >
                {showCityPicker ? 'Close' : 'Change City'}
              </button>
            </div>

            {showCityPicker ? (
              <div className="space-y-3">
                <DestinationAutocomplete
                  value={manualCityInput}
                  onChange={(destName, item) => {
                    setManualCityInput(destName);
                    if (item) {
                      handleSelectManualCity(item.name, item.state);
                    }
                  }}
                  placeholder="Type Indian city (e.g. Pune, Mumbai, Jaipur)..."
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono-meta text-[#576574]">Quick pick:</span>
                  {POPULAR_CITIES.map((c) => (
                    <button
                      key={c.city}
                      type="button"
                      onClick={() => handleSelectManualCity(c.city, c.state)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        activeCityName.toLowerCase() === c.city.toLowerCase()
                          ? 'bg-[#1D4E4F] text-white border-[#1D4E4F]'
                          : 'bg-[#FAF8F5] text-[#1A202C] border-[#E7E2D9] hover:border-[#1D4E4F]'
                      }`}
                    >
                      {c.city}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9]">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#D96B43]" />
                  <span className="text-sm font-semibold text-[#1A202C]">
                    {activeCityName}, {activeStateName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCityPicker(true)}
                  className="text-xs text-[#1D4E4F] hover:underline font-semibold cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bespoke Journey Parameters (Classy Editorial Concierge Bar) */}
      <div className="bg-white rounded-3xl p-6 sm:p-9 lg:p-10 border border-[#E7E2D9] shadow-2xs mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-7 border-b border-[#E7E2D9] mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-mono-meta uppercase tracking-widest text-[#8C7A6B] font-semibold mb-2">
              <Sliders className="w-3.5 h-3.5 text-[#1D4E4F]" />
              <span>Curation Criteria</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A202C] tracking-tight">
              Bespoke Journey Parameters
            </h2>
          </div>
          <p className="font-mono-meta text-xs text-[#576574] sm:text-right max-w-sm leading-relaxed">
            Refined parameters calibrated for authentic Indian transit, rhythm, and discovery
          </p>
        </div>

        {/* 6 Curated Parameter Blocks in a Fluid Editorial Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-8 sm:gap-y-10">
          {/* 01: Duration */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-[11px] font-mono-meta uppercase tracking-widest text-[#8C7A6B] font-semibold">
              <span>01</span>
              <span className="text-[#D5CEC5]">—</span>
              <span>Duration</span>
            </div>
            <div className="h-9 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={30}
                value={durationDays || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  if (val === '') {
                    setDurationDays(0);
                  } else if (!isNaN(val)) {
                    setDurationDays(Math.max(1, Math.min(30, val)));
                  }
                }}
                onBlur={() => {
                  if (!durationDays || durationDays < 1) setDurationDays(1);
                }}
                className="w-14 font-serif text-2xl font-bold text-[#1A202C] tracking-tight bg-[#FAF8F5] hover:bg-[#F3EFEA] focus:bg-white border border-[#E7E2D9] focus:border-[#1D4E4F] focus:ring-2 focus:ring-[#1D4E4F]/15 rounded-xl px-2 py-0 text-center outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                title="Click to enter custom days"
              />
              <span className="font-serif text-2xl font-bold text-[#1A202C] tracking-tight">
                {durationDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {[1, 2, 3, 4].map((d) => {
                const isSelected = durationDays === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationDays(d)}
                    className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF2F1] text-[#1D4E4F] font-semibold border border-[#1D4E4F]/35 shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#576574] border border-[#E7E2D9] hover:text-[#1A202C] hover:border-[#1D4E4F]/30 hover:bg-white'
                    }`}
                  >
                    {d} {d === 1 ? 'Day' : 'Days'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 02: Budget Tier */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-[11px] font-mono-meta uppercase tracking-widest text-[#8C7A6B] font-semibold">
              <span>02</span>
              <span className="text-[#D5CEC5]">—</span>
              <span>Budget Tier</span>
            </div>
            <div className="h-9 flex items-center gap-1.5">
              <span className="font-serif text-2xl font-bold text-[#1A202C] tracking-tight">₹</span>
              <input
                type="number"
                min={500}
                step={500}
                max={500000}
                value={isBudgetFlexible ? '' : (budgetAmount || '')}
                placeholder={isBudgetFlexible ? 'Open' : '6000'}
                onChange={(e) => {
                  setIsBudgetFlexible(false);
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  if (val === '') {
                    setBudgetAmount(0);
                  } else if (!isNaN(val)) {
                    setBudgetAmount(Math.max(0, Math.min(500000, val)));
                  }
                }}
                onBlur={() => {
                  if (!isBudgetFlexible && (!budgetAmount || budgetAmount < 500)) {
                    setBudgetAmount(6000);
                  }
                }}
                className="w-28 font-serif text-2xl font-bold text-[#1A202C] tracking-tight bg-[#FAF8F5] hover:bg-[#F3EFEA] focus:bg-white border border-[#E7E2D9] focus:border-[#1D4E4F] focus:ring-2 focus:ring-[#1D4E4F]/15 rounded-xl px-2.5 py-0 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                title="Click to enter custom budget in ₹"
              />
              {isBudgetFlexible && (
                <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#1D4E4F] font-semibold bg-[#EBF2F1] px-2 py-0.5 rounded-md border border-[#1D4E4F]/20">
                  Flexible
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {[
                { label: '₹3K', amt: 3000, flex: false },
                { label: '₹7K', amt: 7000, flex: false },
                { label: '₹15K', amt: 15000, flex: false },
                { label: 'Open', amt: 25000, flex: true }
              ].map((tier) => {
                const isSelected = tier.flex
                  ? isBudgetFlexible
                  : !isBudgetFlexible && budgetAmount === tier.amt;
                return (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => {
                      if (tier.flex) {
                        setIsBudgetFlexible(true);
                      } else {
                        setIsBudgetFlexible(false);
                        setBudgetAmount(tier.amt);
                      }
                    }}
                    className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF2F1] text-[#1D4E4F] font-semibold border border-[#1D4E4F]/35 shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#576574] border border-[#E7E2D9] hover:text-[#1A202C] hover:border-[#1D4E4F]/30 hover:bg-white'
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 03: Party Size */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-[11px] font-mono-meta uppercase tracking-widest text-[#8C7A6B] font-semibold">
              <span>03</span>
              <span className="text-[#D5CEC5]">—</span>
              <span>Party Size</span>
            </div>
            <div className="h-9 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={30}
                value={travelerCount || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  if (val === '') {
                    setTravelerCount(0);
                  } else if (!isNaN(val)) {
                    const count = Math.max(1, Math.min(30, val));
                    setTravelerCount(count);
                    if (count === 1) setGroupType('solo');
                    else if (count === 2) setGroupType('friends');
                    else setGroupType('family');
                  }
                }}
                onBlur={() => {
                  if (!travelerCount || travelerCount < 1) {
                    setTravelerCount(1);
                    setGroupType('solo');
                  }
                }}
                className="w-14 font-serif text-2xl font-bold text-[#1A202C] tracking-tight bg-[#FAF8F5] hover:bg-[#F3EFEA] focus:bg-white border border-[#E7E2D9] focus:border-[#1D4E4F] focus:ring-2 focus:ring-[#1D4E4F]/15 rounded-xl px-2 py-0 text-center outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                title="Click to enter number of guests"
              />
              <span className="font-serif text-2xl font-bold text-[#1A202C] tracking-tight">
                {travelerCount === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {[
                { type: 'solo' as GroupType, count: 1, label: 'Solo' },
                { type: 'friends' as GroupType, count: 2, label: 'Duo' },
                { type: 'friends' as GroupType, count: 4, label: 'Group (4)' }
              ].map((p) => {
                const isSelected = travelerCount === p.count;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setGroupType(p.type);
                      setTravelerCount(p.count);
                    }}
                    className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF2F1] text-[#1D4E4F] font-semibold border border-[#1D4E4F]/35 shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#576574] border border-[#E7E2D9] hover:text-[#1A202C] hover:border-[#1D4E4F]/30 hover:bg-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 04: Pace & Rhythm */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-[11px] font-mono-meta uppercase tracking-widest text-[#8C7A6B] font-semibold">
              <span>04</span>
              <span className="text-[#D5CEC5]">—</span>
              <span>Pace & Rhythm</span>
            </div>
            <div className="font-serif text-2xl font-bold text-[#1A202C] tracking-tight capitalize h-9 flex items-center">
              {activityLevel === 'low' ? 'Gentle' : activityLevel === 'medium' ? 'Balanced' : 'Active'}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {[
                { level: 'low' as ActivityLevel, label: 'Gentle' },
                { level: 'medium' as ActivityLevel, label: 'Balanced' },
                { level: 'high' as ActivityLevel, label: 'Active' }
              ].map((a) => {
                const isSelected = activityLevel === a.level;
                return (
                  <button
                    key={a.level}
                    type="button"
                    onClick={() => setActivityLevel(a.level)}
                    className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF2F1] text-[#1D4E4F] font-semibold border border-[#1D4E4F]/35 shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#576574] border border-[#E7E2D9] hover:text-[#1A202C] hover:border-[#1D4E4F]/30 hover:bg-white'
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 05: Transit Radius */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-[11px] font-mono-meta uppercase tracking-widest text-[#8C7A6B] font-semibold">
              <span>05</span>
              <span className="text-[#D5CEC5]">—</span>
              <span>Transit Radius</span>
            </div>
            <div className="h-9 flex items-center gap-1.5">
              {radiusKm !== null && (
                <span className="font-serif text-2xl font-bold text-[#1A202C] tracking-tight">&lt;</span>
              )}
              <input
                type="number"
                min={1}
                max={1500}
                value={radiusKm ?? ''}
                placeholder="Any"
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  if (val === '') {
                    setRadiusKm(null);
                  } else if (!isNaN(val)) {
                    setRadiusKm(Math.max(1, Math.min(1500, val)));
                  }
                }}
                className="w-16 font-serif text-2xl font-bold text-[#1A202C] tracking-tight bg-[#FAF8F5] hover:bg-[#F3EFEA] focus:bg-white border border-[#E7E2D9] focus:border-[#1D4E4F] focus:ring-2 focus:ring-[#1D4E4F]/15 rounded-xl px-2 py-0 text-center outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                title="Click to enter custom radius in km or leave blank for Any"
              />
              <span className="font-serif text-2xl font-bold text-[#1A202C] tracking-tight">
                {radiusKm !== null ? 'km' : 'Distance'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {[
                { label: '<10km', val: 10, title: 'Local' },
                { label: '<25km', val: 25, title: 'City' },
                { label: '<60km', val: 60, title: 'Outskirts' },
                { label: 'Any', val: null, title: 'Any Distance' }
              ].map((r) => {
                const isSelected = radiusKm === r.val;
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => setRadiusKm(r.val)}
                    title={r.title}
                    className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF2F1] text-[#1D4E4F] font-semibold border border-[#1D4E4F]/35 shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#576574] border border-[#E7E2D9] hover:text-[#1A202C] hover:border-[#1D4E4F]/30 hover:bg-white'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 06: Atmosphere */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-[11px] font-mono-meta uppercase tracking-widest text-[#8C7A6B] font-semibold">
              <span>06</span>
              <span className="text-[#D5CEC5]">—</span>
              <span>Atmosphere</span>
            </div>
            <div className="font-serif text-2xl font-bold text-[#1A202C] tracking-tight h-9 flex items-center">
              {selectedVibe === 'all'
                ? 'All Aesthetics'
                : selectedVibe === 'heritage'
                ? 'Heritage'
                : selectedVibe === 'nature'
                ? 'Nature'
                : 'Culinary'}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'heritage', label: 'Heritage' },
                { id: 'nature', label: 'Nature' },
                { id: 'food', label: 'Culinary' }
              ].map((v) => {
                const isSelected = selectedVibe === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVibe(v.id)}
                    className={`px-3.5 py-1.5 text-xs rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF2F1] text-[#1D4E4F] font-semibold border border-[#1D4E4F]/35 shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#576574] border border-[#E7E2D9] hover:text-[#1A202C] hover:border-[#1D4E4F]/30 hover:bg-white'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Stage: 3 Curated Journey Options */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EBF2F1] text-[#1D4E4F] text-xs font-mono-meta font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bespoke Discovery · 3 Candidate Journeys</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A202C] tracking-tight">
              Select Your Preferred Journey
            </h3>
            <p className="text-xs sm:text-sm text-[#576574] mt-1 max-w-2xl">
              {scope === 'near-me' || scope === 'my-city'
                ? `Three distinct itineraries calibrated around ${activeCityName}. Compare stops, estimated spend, and radius to decide.`
                : 'Three diverse nationwide journeys across distinctive cultural regions of India.'}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleShuffleOptions}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E7E2D9] text-xs font-semibold text-[#1A202C] shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#576574]" />
              <span>Shuffle Options</span>
            </button>

            <button
              type="button"
              onClick={handleSurpriseAny}
              disabled={generating}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#EBF2F1]" />
              <span>Surprise Me Instantly</span>
            </button>
          </div>
        </div>

        {/* 3 Proposals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {surpriseOptions.map((option, idx) => {
            const proposalNumber = String(idx + 1).padStart(2, '0');
            return (
              <div
                key={option.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E2D9] hover:border-[#1D4E4F] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Proposal Masthead */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]/70 mb-4">
                    <span className="font-mono-meta text-[11px] uppercase tracking-[0.2em] text-[#8C7A6B] font-semibold">
                      Proposal No. {proposalNumber}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E7E2D9] text-[10px] font-mono-meta font-semibold text-[#1D4E4F]">
                      {option.vibeBadge}
                    </span>
                  </div>

                  <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#1A202C] mb-1.5 leading-snug">
                    {option.title}
                  </h4>

                  <p className="text-xs text-[#576574] leading-relaxed mb-4">
                    {option.tagline}
                  </p>

                  {/* Elegant Metrics Strip */}
                  <div className="grid grid-cols-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] mb-5 text-center text-xs font-mono-meta">
                    <div className="border-r border-[#E7E2D9]/80 pr-1">
                      <span className="text-[10px] text-[#8C7A6B] uppercase tracking-wider block">Range</span>
                      <strong className="text-[#1A202C] text-[11px] truncate block">{option.radiusDescription}</strong>
                    </div>
                    <div className="border-r border-[#E7E2D9]/80 px-1">
                      <span className="text-[10px] text-[#8C7A6B] uppercase tracking-wider block">Duration</span>
                      <strong className="text-[#1A202C] text-[11px] block">{durationDays} {durationDays === 1 ? 'Day' : 'Days'}</strong>
                    </div>
                    <div className="pl-1">
                      <span className="text-[10px] text-[#8C7A6B] uppercase tracking-wider block">Est. Cost</span>
                      <strong className="text-[#1D4E4F] text-[11px] block">{formatINR(option.estimatedSpend)}</strong>
                    </div>
                  </div>

                  {/* Highlight Stops Itinerary Timeline */}
                  <div className="mb-5">
                    <span className="text-[10px] font-mono-meta uppercase tracking-wider text-[#8C7A6B] font-semibold block mb-2.5">
                      Curated Daily Itinerary:
                    </span>
                    <div className="space-y-2 relative pl-2 border-l-2 border-[#EBF2F1]">
                      {option.highlightStops.map((stop, sIdx) => (
                        <div
                          key={sIdx}
                          className="relative pl-3 text-xs"
                        >
                          <div className="absolute -left-[13px] top-1.5 w-2 h-2 rounded-full bg-[#1D4E4F]" />
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono-meta uppercase tracking-wider text-[#8C7A6B] font-semibold">
                              {stop.timeSlot}
                            </span>
                            <span className="text-[10px] text-[#576574]">· {stop.category}</span>
                          </div>
                          <p className="font-semibold text-[#1A202C] text-xs">
                            {stop.title}
                          </p>
                          <p className="text-[11px] text-[#576574] truncate">
                            {stop.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#576574] leading-relaxed mb-6 italic border-t border-[#E7E2D9]/70 pt-3">
                    "{option.suitability}"
                  </p>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  disabled={generating}
                  className="w-full py-3 rounded-2xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  <span>Select This Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary: Collapsible Thematic Concepts */}
      <div className="border-t border-[#E7E2D9] pt-8 mb-8">
        <button
          type="button"
          onClick={() => setShowThematicConcepts(!showThematicConcepts)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E7E2D9] hover:bg-[#FAF8F5] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-[#1D4E4F]" />
            <div>
              <span className="text-xs font-bold text-[#1A202C] block">
                Looking for a specific theme? Browse 8 Classic Thematic Concepts
              </span>
              <span className="text-[11px] text-[#576574]">
                Heritage, Food & Markets, Nature, Adventure, Art & Cafes, Royal Rajasthan...
              </span>
            </div>
          </div>
          {showThematicConcepts ? (
            <ChevronUp className="w-4 h-4 text-[#576574]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#576574]" />
          )}
        </button>

        {showThematicConcepts && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TRAVEL_CONCEPTS.map((concept) => {
              const IconComponent = concept.icon;
              return (
                <div
                  key={concept.id}
                  className="bg-white rounded-3xl p-5 border border-[#E7E2D9] flex flex-col justify-between hover:shadow-xs transition-all"
                >
                  <div>
                    <div className={`w-10 h-10 rounded-2xl ${concept.colorBg} ${concept.colorText} flex items-center justify-center mb-3`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h4 className="font-serif text-lg font-bold text-[#1A202C] mb-1">
                      {concept.title}
                    </h4>
                    <p className="text-xs text-[#576574] leading-relaxed mb-3">
                      {concept.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConceptId(concept.id);
                      handleGenerateForConcept(concept);
                    }}
                    disabled={generating}
                    className="w-full py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#1D4E4F] hover:text-white border border-[#E7E2D9] text-xs font-semibold text-[#1A202C] transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <span>Build {concept.title}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/plan"
          className="inline-flex items-center space-x-2 text-xs font-mono-meta uppercase tracking-wider text-[#1D4E4F] hover:underline"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Prefer manual custom planning? Use the trip builder →</span>
        </Link>
      </div>
    </div>
  );
}
