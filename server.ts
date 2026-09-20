import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  generatePlanSync,
  validateItinerary,
  repairItinerary,
  getAvailableCandidates,
  answerTripAssistantQuestion
} from './src/services/itineraryEngine';
import type { GeneratePlanParams, Trip, TripConstraint, TripDay } from './src/types';

// Lazy Gemini SDK client initialization
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      genAiClient = new GoogleGenAI({ apiKey });
    }
  }
  return genAiClient;
}

/**
 * Executes Gemini generation with graceful fallback across available aliases
 * to handle temporary high-demand spikes (503 / 429) before deterministic fallback.
 */
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  config?: { responseMimeType?: string }
): Promise<string | null> {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config
      });
      const text = response.text?.trim();
      if (text) return text;
    } catch (err: any) {
      console.warn(`[Server Gemini] Model ${model} unavailable (${err?.status || err?.message || '503'}), attempting next fallback...`);
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // -------------------------------------------------------------
  // API Routes (mounted BEFORE Vite middleware)
  // -------------------------------------------------------------

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'TravelPilot AI Engine' });
  });

  /**
   * GET /api/itinerary/candidates
   * Returns structured catalog places and free alternatives for a destination
   */
  app.get('/api/itinerary/candidates', (req, res) => {
    try {
      const destination = String(req.query.destination || '');
      const excluded = (req.query.excluded as string)?.split(',').filter(Boolean) || [];
      const data = getAvailableCandidates(destination, new Set(excluded));
      res.json({
        destination,
        placesCount: data.places.length,
        freeCount: data.freeAlternatives.length,
        places: data.places,
        freeAlternatives: data.freeAlternatives
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/itinerary/plan
   * Generates or regenerates an itinerary using Gemini reasoning over structured candidates
   * Followed by strict application-side budget and geographic validation.
   */
  app.post('/api/itinerary/plan', async (req, res) => {
    try {
      const params: GeneratePlanParams = req.body;
      const destination = params.destination;
      const budget = Math.max(200, Number(params.budget) || 25000);
      const travellers = Math.max(1, params.travellers || 1);
      const excludedSet = new Set(params.excludedPlaceIds || []);

      // 1. Gather structured candidate places from the catalog
      const { places, freeAlternatives } = getAvailableCandidates(
        destination,
        excludedSet,
        params.constraints || []
      );

      // Start with the deterministic engine as the robust baseline
      let planDays: TripDay[] = generatePlanSync(params);

      // 2. If Gemini is available and scope is full-trip, ask Gemini to reason, theme, and sequence
      const ai = getGeminiClient();
      if (ai && params.scope !== 'single-slot' && places.length >= 6) {
        try {
          const candidateSummaries = places.slice(0, 18).map((p) => ({
            id: p.id,
            title: p.title,
            slot: p.timeSlot,
            cost: p.estimatedCost,
            duration: p.durationMinutes,
            category: p.category,
            desc: p.description
          }));

          const prompt = `You are the Itinerary Reasoning Layer for TravelPilot.
Your task is to select and organize activities for a trip to "${destination}".

TRIP PARAMETERS:
- Duration: ${params.duration || 3} days
- Group: ${params.groupType || 'solo'} (${travellers} travelers)
- Pace: ${params.pace || 'balanced'}
- Interests: ${(params.interests || []).join(', ') || 'Culture, Food, Sights'}
- Total Budget: ₹${budget} (Per-person max: ~₹${Math.round(budget / travellers)})
- Style/Theme: ${params.conceptTitle || 'Cultural Discovery'}

AVAILABLE STRUCTURED CANDIDATES (Choose ONLY from these IDs, DO NOT invent places or change costs):
${JSON.stringify(candidateSummaries, null, 2)}

INSTRUCTIONS:
1. For each day, assign a Morning, Afternoon, and Evening activity using candidate IDs from the list.
2. Provide a cohesive, thematic day title and daily theme.
3. Keep the sum of (cost * ${travellers}) within ₹${budget}.
4. Avoid repeating places.

Respond strictly with valid JSON conforming to this schema:
{
  "days": [
    {
      "dayIndex": 1,
      "title": "Day 1: ...",
      "theme": "...",
      "morningId": "candidate_id",
      "afternoonId": "candidate_id",
      "eveningId": "candidate_id"
    }
  ]
}`;

          const rawText = await callGeminiWithFallback(ai, prompt, {
            responseMimeType: 'application/json'
          });

          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed.days && Array.isArray(parsed.days)) {
              const candidateMap = new Map(places.map((p) => [p.id, p]));
              const aiDays: TripDay[] = [];

              for (const d of parsed.days) {
                const dayIndex = d.dayIndex || aiDays.length + 1;
                const morningCandidate = candidateMap.get(d.morningId);
                const afternoonCandidate = candidateMap.get(d.afternoonId);
                const eveningCandidate = candidateMap.get(d.eveningId);

                // If AI picked valid candidates, construct the day
                if (morningCandidate && afternoonCandidate && eveningCandidate) {
                  const items = [
                    { cand: morningCandidate, slot: 'morning' as const },
                    { cand: afternoonCandidate, slot: 'afternoon' as const },
                    { cand: eveningCandidate, slot: 'evening' as const }
                  ].map(({ cand, slot }, sIdx) => ({
                    id: `item-${dayIndex}-${sIdx + 1}`,
                    placeId: cand.id,
                    dayIndex,
                    timeSlot: slot,
                    bestVisited: cand.bestVisited || ((slot.charAt(0).toUpperCase() + slot.slice(1)) as any),
                    title: cand.title,
                    description: cand.description,
                    location: cand.location,
                    estimatedCost: cand.estimatedCost,
                    durationMinutes: cand.durationMinutes,
                    category: cand.category,
                    status: 'active' as const,
                    latitude: cand.latitude,
                    longitude: cand.longitude,
                    openingHours: cand.openingHours
                  }));

                  aiDays.push({
                    dayIndex,
                    date: planDays[dayIndex - 1]?.date || `Day ${dayIndex}`,
                    title: d.title || `Day ${dayIndex}: Exploration`,
                    theme: d.theme || 'Discovery',
                    items
                  });
                }
              }

              if (aiDays.length === (params.duration || 3)) {
                planDays = aiDays;
              }
            }
          }
        } catch (geminiErr) {
          console.warn('[Server Gemini] Reasoning fallback to deterministic engine:', geminiErr);
        }
      }

      // 3. APPLICATION-SIDE VALIDATION & REPAIR (Mandatory!)
      const valResult = validateItinerary(planDays, {
        budgetAmount: budget,
        travelerCount: travellers,
        excludedPlaceIds: Array.from(excludedSet),
        constraints: params.constraints
      });

      if (!valResult.valid) {
        const repaired = repairItinerary(planDays, valResult.conflicts, {
          destination,
          budgetAmount: budget,
          travelerCount: travellers,
          excludedPlaceIds: Array.from(excludedSet),
          constraints: params.constraints
        });
        planDays = repaired.repairedDays;
      }

      const finalValidation = validateItinerary(planDays, {
        budgetAmount: budget,
        travelerCount: travellers,
        excludedPlaceIds: Array.from(excludedSet),
        constraints: params.constraints
      });

      res.json({
        days: planDays,
        validation: finalValidation
      });
    } catch (err: any) {
      console.error('[Server] Plan error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/itinerary/validate
   * Validates an itinerary against budget and constraints
   */
  app.post('/api/itinerary/validate', (req, res) => {
    try {
      const { days, context } = req.body;
      const result = validateItinerary(days || [], context || { budgetAmount: 25000 });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/itinerary/repair
   * Automatically repairs conflicts in an itinerary
   */
  app.post('/api/itinerary/repair', (req, res) => {
    try {
      const { days, conflicts, context } = req.body;
      const result = repairItinerary(days || [], conflicts || [], context || { destination: '', budgetAmount: 25000 });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/itinerary/assistant
   * Answers natural-language questions grounded strictly in current trip data
   */
  app.post('/api/itinerary/assistant', async (req, res) => {
    try {
      const { trip, question }: { trip: Trip; question: string } = req.body;

      // First run local grounded logic to verify facts and actions
      const groundedBase = answerTripAssistantQuestion(trip, question);

      // If Gemini is available, enhance with personalized conversational tone while maintaining grounded facts
      const ai = getGeminiClient();
      if (ai) {
        try {
          const daysSummary = (trip.days || []).map((d) => ({
            day: d.dayIndex,
            title: d.title,
            items: d.items.map((i) => `${i.title} (${i.timeSlot}, ₹${i.estimatedCost}, ~${i.durationMinutes}m)`)
          }));

          const prompt = `You are TravelPilot's AI Trip Assistant.
A traveler is asking about their current trip to ${trip.destination}.

CURRENT TRIP CONTEXT:
- Destination: ${trip.destination}
- Dates: ${trip.startDate} to ${trip.endDate} (${trip.days?.length || 0} days)
- Pace: ${trip.pace}, Travelers: ${trip.travelerCount || 1}
- Budget: ₹${trip.budgetAmount}
- Planned Items by Day: ${JSON.stringify(daysSummary)}
- Hotel Coordinates Saved?: ${trip.locationContext?.latitude ? 'YES' : 'NO'}

GROUNDED FACTS / DECISION FROM ENGINE:
- Decision: ${groundedBase.decision || 'INFORMATIONAL'}
- Key Fact: ${groundedBase.answer}
- Reasoning points: ${JSON.stringify(groundedBase.reasoning)}

QUESTION: "${question}"

CRITICAL RULES:
1. If hotel info does not exist, DO NOT invent a hotel. State clearly: "I don't have a hotel location saved for this trip yet."
2. Do not invent facts, opening hours, or prices outside what is provided.
3. If asked "Can I fit another activity today?", output a concise YES or NOT RECOMMENDED with the exact time/budget explanation.
4. Keep answer concise, elegant, and directly helpful (under 4 sentences).`;

          const enhancedAnswer = await callGeminiWithFallback(ai, prompt);
          if (enhancedAnswer) {
            res.json({
              ...groundedBase,
              answer: enhancedAnswer
            });
            return;
          }
        } catch (geminiErr) {
          console.warn('[Server Gemini Assistant] Fallback to engine:', geminiErr);
        }
      }

      res.json(groundedBase);
    } catch (err: any) {
      console.error('[Server] Assistant error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // Vite Middleware (Development) / Static Files (Production)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TravelPilot Engine server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
