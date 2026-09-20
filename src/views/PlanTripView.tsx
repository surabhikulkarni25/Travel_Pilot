import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Users,
  Sliders,
  Check,
  MapPin,
  Sparkles,
  Building,
  Building2,
  Trees,
  Mountain
} from 'lucide-react';
import { useTrip } from '../contexts/TripContext';
import { DestinationAutocomplete } from '../components/DestinationAutocomplete';
import { HotelDiscoverySection } from '../components/HotelDiscoverySection';
import { formatINR } from '../utils/currency';
import { calculateCalendarDays, formatDateRange, calculateHotelNights } from '../utils/date';
import type {
  TripFormData,
  DestinationType,
  GroupType,
  Pace,
  ActivityLevel,
  BudgetTier,
  HotelOption,
  TripAccommodation
} from '../types';

const INTEREST_OPTIONS = [
  'Culture & History',
  'Food & Dining',
  'Art & Museums',
  'Nature & Outdoors',
  'Architecture',
  'Hidden Gems',
  'Local Markets',
  'Nightlife & Social',
  'Relaxation & Wellness',
  'Photography'
];

export function PlanTripView() {
  const [, setLocation] = useLocation();
  const { createNewTrip } = useTrip();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State initialized with Indian defaults and INR currency
  const [formData, setFormData] = useState<TripFormData>({
    destination: 'Jaipur, Rajasthan',
    destinationType: 'city',
    startDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0],
    budgetTier: 'moderate',
    budgetAmount: 35000,
    groupType: 'solo',
    travelerCount: 1,
    pace: 'balanced',
    activityLevel: 'medium',
    interests: ['Culture & History', 'Food & Dining', 'Architecture']
  });

  const updateField = <K extends keyof TripFormData>(key: K, value: TripFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      if (exists) {
        return { ...prev, interests: prev.interests.filter((i) => i !== interest) };
      } else {
        return { ...prev, interests: [...prev.interests, interest] };
      }
    });
  };

  const hotelNights = calculateHotelNights(formData.startDate, formData.endDate);
  const isOutstationWithStays = formData.destinationType === 'outstation' && hotelNights > 0;

  const steps = isOutstationWithStays
    ? [
        { id: 'destination', title: 'Destination' },
        { id: 'dates-budget', title: 'Dates & Budget' },
        { id: 'travellers', title: 'Travellers' },
        { id: 'preferences', title: 'Preferences' },
        { id: 'accommodation', title: 'Find Your Stay' },
        { id: 'review', title: 'Review' }
      ]
    : [
        { id: 'destination', title: 'Destination' },
        { id: 'dates-budget', title: 'Dates & Budget' },
        { id: 'travellers', title: 'Travellers' },
        { id: 'preferences', title: 'Preferences' },
        { id: 'review', title: 'Review' }
      ];

  const totalSteps = steps.length;
  const currentStepDef = steps[currentStep - 1] || steps[0];

  const handleNext = () => {
    if (currentStep === 1 && !formData.destination.trim()) {
      setErrorMsg('Please enter or select an Indian destination.');
      return;
    }
    setErrorMsg(null);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreateTrip = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const createdTrip = await createNewTrip(formData);
      setLocation(`/trip/${createdTrip.id}`);
    } catch (err: any) {
      console.error('Failed to create trip:', err);
      setErrorMsg(err.message || 'Failed to initialize trip in Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Wizard Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono-meta text-xs uppercase tracking-wider text-[#1D4E4F] font-semibold">
            Trip Planner • Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs text-[#576574] font-mono-meta">
            {currentStepDef.title}
          </span>
        </div>
        <div className="w-full bg-[#E7E2D9] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#1D4E4F] h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-[#F9EFEA] border border-[#D96B43]/30 rounded-2xl text-xs text-[#D96B43]">
          {errorMsg}
        </div>
      )}

      {/* Wizard Card Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E7E2D9] shadow-xs">
        {/* STEP 1: DESTINATION */}
        {currentStepDef.id === 'destination' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="font-mono-meta text-xs uppercase tracking-wider text-[#576574]">
                Step 1
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1A202C] mt-1">
                Where in India are you going?
              </h2>
              <p className="text-sm text-[#576574] mt-1">
                Search or select any city, heritage center, hill station, or coastal destination across India.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C] mb-2">
                Destination in India
              </label>
              <DestinationAutocomplete
                value={formData.destination}
                onChange={(name, item) => {
                  updateField('destination', name);
                  if (item?.type) {
                    updateField('destinationType', item.type);
                  }
                }}
                placeholder="Type or select e.g. Mumbai, Goa, Jaipur, Pune, Bengaluru..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C]">
                  Destination Setting
                </label>
                <span className="text-[11px] font-mono-meta text-[#576574]">
                  Tailors pacing, transit & accommodation
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => updateField('destinationType', 'city')}
                  className={`group relative p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.destinationType === 'city'
                      ? 'border-[#1D4E4F] bg-[#F4F8F7] shadow-xs ring-1 ring-[#1D4E4F]/30'
                      : 'border-[#E7E2D9] bg-white hover:border-[#1D4E4F]/40 hover:bg-[#FAF8F5]/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        formData.destinationType === 'city'
                          ? 'bg-[#1D4E4F] text-white shadow-2xs'
                          : 'bg-[#EBF2F1] text-[#1D4E4F]'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    {formData.destinationType === 'city' && (
                      <span className="inline-flex items-center space-x-1 font-mono-meta text-[10px] uppercase tracking-wider text-[#1D4E4F] bg-white/90 border border-[#1D4E4F]/25 px-2 py-0.5 rounded-full font-semibold">
                        <Check className="w-3 h-3 text-[#1D4E4F]" />
                        <span>Selected</span>
                      </span>
                    )}
                  </div>
                  <div className="font-mono-meta text-[10px] uppercase tracking-widest text-[#1D4E4F] font-semibold mb-0.5">
                    Urban & Heritage
                  </div>
                  <div className="font-serif text-xl font-bold tracking-tight text-[#1A202C]">
                    Within City
                  </div>
                  <div className="text-xs text-[#576574] leading-relaxed mt-1">
                    Historic quarters, monuments, culinary trails & vibrant local bazaars
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('destinationType', 'outstation')}
                  className={`group relative p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.destinationType === 'outstation'
                      ? 'border-[#D96B43] bg-[#FDF9F7] shadow-xs ring-1 ring-[#D96B43]/30'
                      : 'border-[#E7E2D9] bg-white hover:border-[#D96B43]/40 hover:bg-[#FAF8F5]/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        formData.destinationType === 'outstation'
                          ? 'bg-[#D96B43] text-white shadow-2xs'
                          : 'bg-[#FDF2EC] text-[#D96B43]'
                      }`}
                    >
                      <Mountain className="w-5 h-5" />
                    </div>
                    {formData.destinationType === 'outstation' && (
                      <span className="inline-flex items-center space-x-1 font-mono-meta text-[10px] uppercase tracking-wider text-[#D96B43] bg-white/90 border border-[#D96B43]/25 px-2 py-0.5 rounded-full font-semibold">
                        <Check className="w-3 h-3 text-[#D96B43]" />
                        <span>Selected</span>
                      </span>
                    )}
                  </div>
                  <div className="font-mono-meta text-[10px] uppercase tracking-widest text-[#D96B43] font-semibold mb-0.5">
                    Getaways & Escapes
                  </div>
                  <div className="font-serif text-xl font-bold tracking-tight text-[#1A202C]">
                    Outside City
                  </div>
                  <div className="text-xs text-[#576574] leading-relaxed mt-1">
                    Hill stations, tranquil backwaters, coastal shores & scenic retreats
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DATES & BUDGET */}
        {currentStepDef.id === 'dates-budget' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="font-mono-meta text-xs uppercase tracking-wider text-[#576574]">
                Step 2
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1A202C] mt-1">
                Dates and budget targets
              </h2>
              <p className="text-sm text-[#576574] mt-1">
                TravelPilot projects costs in Indian Rupees (₹) to prevent unexpected overruns.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C] mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#576574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#1D4E4F] text-sm text-[#1A202C] bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C] mb-2">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#576574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#1D4E4F] text-sm text-[#1A202C] bg-[#FAF8F5]"
                  />
                </div>
              </div>
            </div>

            {/* Calculated duration display */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#EBF2F1] border border-[#1D4E4F]/20 text-xs">
              <span className="text-[#1D4E4F] font-semibold">
                Duration: {calculateCalendarDays(formData.startDate, formData.endDate)} {calculateCalendarDays(formData.startDate, formData.endDate) === 1 ? 'day' : 'days'}
              </span>
              <span className="text-[11px] text-[#576574] font-mono-meta">
                {formatDateRange(formData.startDate, formData.endDate)} (inclusive calendar calculation)
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C] mb-2">
                Budget Tier
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'budget' as const, label: 'Budget', desc: '~₹2,500/day' },
                  { tier: 'moderate' as const, label: 'Moderate', desc: '~₹6,500/day' },
                  { tier: 'luxury' as const, label: 'Luxury', desc: '~₹15,000+/day' }
                ].map(({ tier, label, desc }) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => {
                      updateField('budgetTier', tier);
                      if (tier === 'budget' && formData.budgetAmount > 25000) updateField('budgetAmount', 10000);
                      if (tier === 'moderate' && (formData.budgetAmount < 15000 || formData.budgetAmount > 60000)) updateField('budgetAmount', 35000);
                      if (tier === 'luxury' && formData.budgetAmount < 50000) updateField('budgetAmount', 75000);
                    }}
                    className={`py-3 px-2 rounded-xl border text-center transition-all ${
                      formData.budgetTier === tier
                        ? 'border-[#1D4E4F] bg-[#1D4E4F] text-white'
                        : 'border-[#E7E2D9] hover:bg-[#FAF8F5] text-[#1A202C]'
                    }`}
                  >
                    <div className="font-semibold text-xs capitalize">{label}</div>
                    <div className={`text-[10px] mt-0.5 ${formData.budgetTier === tier ? 'text-white/80' : 'text-[#576574]'}`}>
                      {desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C]">
                  Estimated Total Target (INR)
                </label>
                <span className="font-mono-meta text-xs font-semibold text-[#1D4E4F]">
                  {formatINR(formData.budgetAmount)}
                </span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-serif font-bold text-sm text-[#1D4E4F]">
                  ₹
                </div>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={formData.budgetAmount}
                  onChange={(e) => updateField('budgetAmount', Math.max(100, Number(e.target.value)))}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#1D4E4F] text-sm text-[#1A202C] bg-[#FAF8F5] font-mono-meta"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[11px] text-[#576574] font-mono-meta">Quick presets:</span>
                {[1000, 5000, 15000, 35000, 75000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => updateField('budgetAmount', amt)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-md border transition-colors ${
                      formData.budgetAmount === amt
                        ? 'bg-[#1D4E4F] text-white border-[#1D4E4F]'
                        : 'bg-[#FAF8F5] text-[#1A202C] border-[#E7E2D9] hover:bg-[#EBF2F1]'
                    }`}
                  >
                    {formatINR(amt)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TRAVELLERS */}
        {currentStepDef.id === 'travellers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="font-mono-meta text-xs uppercase tracking-wider text-[#576574]">
                Step 3
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1A202C] mt-1">
                Who is traveling?
              </h2>
              <p className="text-sm text-[#576574] mt-1">
                Transport modes, dining reservations, and hotel room requirements adapt to group dynamics.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C] mb-2">
                Travel Party
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['solo', 'friends', 'family'] as GroupType[]).map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => {
                      updateField('groupType', grp);
                      if (grp === 'solo') updateField('travelerCount', 1);
                    }}
                    className={`py-3.5 px-3 rounded-2xl border text-center transition-all ${
                      formData.groupType === grp
                        ? 'border-[#1D4E4F] bg-[#EBF2F1] text-[#1D4E4F] font-semibold'
                        : 'border-[#E7E2D9] hover:bg-[#FAF8F5] text-[#1A202C]'
                    }`}
                  >
                    <div className="capitalize text-sm font-semibold">{grp}</div>
                  </button>
                ))}
              </div>
            </div>

            {formData.groupType !== 'solo' && (
              <div>
                <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C] mb-2">
                  Total Travelers Count
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="2"
                    max="16"
                    value={formData.travelerCount}
                    onChange={(e) => updateField('travelerCount', Math.max(2, Number(e.target.value)))}
                    className="w-32 px-4 py-3 rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#1D4E4F] text-sm text-[#1A202C] bg-[#FAF8F5]"
                  />
                  <span className="text-xs text-[#576574]">people sharing this itinerary</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: PREFERENCES */}
        {currentStepDef.id === 'preferences' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="font-mono-meta text-xs uppercase tracking-wider text-[#576574]">
                Step 4
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1A202C] mt-1">
                Pacing and interest tags
              </h2>
              <p className="text-sm text-[#576574] mt-1">
                Tune daily stops, walking stamina, and focal themes for your journey.
              </p>
            </div>

            {/* Pace */}
            <div>
              <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C] mb-2">
                Daily Pace
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['relaxed', 'balanced', 'packed'] as Pace[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateField('pace', p)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all capitalize text-xs font-semibold ${
                      formData.pace === p
                        ? 'border-[#1D4E4F] bg-[#1D4E4F] text-white'
                        : 'border-[#E7E2D9] hover:bg-[#FAF8F5] text-[#1A202C]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C] mb-2">
                Activity & Walking Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as ActivityLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateField('activityLevel', lvl)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all capitalize text-xs font-semibold ${
                      formData.activityLevel === lvl
                        ? 'border-[#1D4E4F] bg-[#1D4E4F] text-white'
                        : 'border-[#E7E2D9] hover:bg-[#FAF8F5] text-[#1A202C]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-xs font-mono-meta uppercase tracking-wider text-[#1A202C] mb-2">
                Interests & Themes
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center space-x-1.5 ${
                        selected
                          ? 'bg-[#1D4E4F] text-white border border-[#1D4E4F]'
                          : 'bg-[#FAF8F5] text-[#1A202C] border border-[#E7E2D9] hover:border-[#1D4E4F]'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP: ACCOMMODATION (For Outstation Trips with Overnight Stays) */}
        {currentStepDef.id === 'accommodation' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="font-mono-meta text-xs uppercase tracking-wider text-[#1D4E4F] font-semibold">
                Step {currentStep} • Stay Recommendations
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1A202C] mt-1">
                Choose your stay in {formData.destination.split(',')[0].trim()}
              </h2>
              <p className="text-sm text-[#576574] mt-1">
                Outstation journeys require accommodation. Explore options scored for your budget and travel party, or mark your stay as already arranged.
              </p>
            </div>

            <HotelDiscoverySection
              destination={formData.destination}
              startDate={formData.startDate}
              endDate={formData.endDate}
              nights={hotelNights}
              travellers={formData.travelerCount}
              rooms={Math.max(1, Math.ceil(formData.travelerCount / 2))}
              budgetAmount={formData.budgetAmount}
              selectedAccommodation={formData.accommodation}
              onSelectHotel={(hotel: HotelOption) => {
                updateField('accommodation', {
                  required: true,
                  status: 'selected',
                  checkIn: formData.startDate,
                  checkOut: formData.endDate,
                  nights: hotelNights,
                  rooms: Math.max(1, Math.ceil(formData.travelerCount / 2)),
                  hotel
                });
              }}
              onSetAlreadyArranged={(stayName?: string) => {
                updateField('accommodation', {
                  required: true,
                  status: 'already-arranged',
                  checkIn: formData.startDate,
                  checkOut: formData.endDate,
                  nights: hotelNights,
                  rooms: Math.max(1, Math.ceil(formData.travelerCount / 2)),
                  customStayDetails: {
                    name: stayName || 'Self-arranged Stay'
                  }
                });
              }}
              onClearAccommodation={() => {
                updateField('accommodation', {
                  required: true,
                  status: 'not-selected',
                  checkIn: formData.startDate,
                  checkOut: formData.endDate,
                  nights: hotelNights,
                  rooms: Math.max(1, Math.ceil(formData.travelerCount / 2))
                });
              }}
            />
          </div>
        )}

        {/* STEP: REVIEW */}
        {currentStepDef.id === 'review' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="font-mono-meta text-xs uppercase tracking-wider text-[#1D4E4F] font-semibold">
                Step {totalSteps} • Final Review
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1A202C] mt-1">
                Confirm your itinerary parameters
              </h2>
              <p className="text-sm text-[#576574] mt-1">
                Your trip structure will be generated and saved to your Cloud Firestore profile.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]">
                <div>
                  <span className="font-mono-meta text-[10px] uppercase text-[#576574]">Destination</span>
                  <p className="font-serif text-2xl font-bold text-[#1A202C]">{formData.destination}</p>
                </div>
                <span className="font-mono-meta text-xs uppercase bg-white px-2.5 py-1 rounded-md border border-[#E7E2D9] font-medium text-[#1D4E4F]">
                  {formData.destinationType === 'outstation' ? 'Outside City' : 'Within City'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-mono-meta text-[#576574] block">Dates & Duration</span>
                  <span className="font-semibold text-[#1A202C]">
                    {formatDateRange(formData.startDate, formData.endDate)} ({calculateCalendarDays(formData.startDate, formData.endDate)} {calculateCalendarDays(formData.startDate, formData.endDate) === 1 ? 'day' : 'days'})
                  </span>
                </div>
                <div>
                  <span className="font-mono-meta text-[#576574] block">Budget Target</span>
                  <span className="font-semibold text-[#1A202C]">{formatINR(formData.budgetAmount)} ({formData.budgetTier})</span>
                </div>
                <div>
                  <span className="font-mono-meta text-[#576574] block">Travelers</span>
                  <span className="font-semibold text-[#1A202C]">{formData.travelerCount} ({formData.groupType})</span>
                </div>
                <div>
                  <span className="font-mono-meta text-[#576574] block">Pacing & Activity</span>
                  <span className="font-semibold text-[#1A202C]">{formData.pace} pace • {formData.activityLevel} activity</span>
                </div>
              </div>

              {/* Accommodation Summary in Review for Outstation Trips */}
              {isOutstationWithStays && (
                <div className="pt-3 border-t border-[#E7E2D9]">
                  <span className="font-mono-meta text-[10px] uppercase text-[#576574] block mb-1 font-semibold">
                    Accommodation ({hotelNights} {hotelNights === 1 ? 'Night' : 'Nights'})
                  </span>
                  {formData.accommodation?.status === 'selected' && formData.accommodation.hotel ? (
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E7E2D9]">
                      <div>
                        <span className="font-semibold text-[#1A202C] text-sm block">
                          {formData.accommodation.hotel.name}
                        </span>
                        <span className="text-xs text-[#576574]">
                          {formData.accommodation.hotel.stayType} • {formatINR(formData.accommodation.hotel.estimatedTotal)} estimated total
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-[#EBF2F1] text-[#1D4E4F] font-mono-meta text-xs font-semibold">
                        Selected
                      </span>
                    </div>
                  ) : formData.accommodation?.status === 'already-arranged' ? (
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E7E2D9]">
                      <div>
                        <span className="font-semibold text-[#1A202C] text-sm block">
                          Self-arranged Accommodation
                        </span>
                        <span className="text-xs text-[#576574]">
                          {formData.accommodation.customStayDetails?.name || 'Arranged independently'}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E7E2D9] text-[#1A202C] font-mono-meta text-xs">
                        Arranged
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-[#576574] bg-white p-3 rounded-xl border border-[#E7E2D9]">
                      <span>No hotel selected yet</span>
                      <span className="font-mono-meta text-[11px] text-[#1D4E4F]">Can discover anytime from itinerary</span>
                    </div>
                  )}
                </div>
              )}

              {formData.interests.length > 0 && (
                <div className="pt-2 border-t border-[#E7E2D9]">
                  <span className="font-mono-meta text-[10px] text-[#576574] block mb-1.5">Selected Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.interests.map((tag) => (
                      <span key={tag} className="px-2.5 py-0.5 rounded-full text-[11px] bg-white border border-[#E7E2D9] text-[#1D4E4F] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-[#E7E2D9] flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-[#E7E2D9] text-xs font-semibold text-[#1A202C] hover:bg-[#FAF8F5] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateTrip}
              disabled={submitting}
              className="flex items-center space-x-2 px-7 py-3 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-sm font-semibold shadow-sm disabled:opacity-60 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{submitting ? 'Saving to Firestore...' : 'Create & View Itinerary'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
