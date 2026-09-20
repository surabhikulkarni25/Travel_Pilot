import { useState } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  Clock,
  Coins,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Info,
  AlertCircle
} from 'lucide-react';
import { answerTripAssistantQuestion } from '../services/itineraryEngine';
import type { Trip, AssistantAnswer } from '../types';

interface TripAssistantPanelProps {
  trip: Trip;
  onAutoRepair?: () => Promise<void>;
  onTriggerReplacer?: (itemId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  reasoning?: string[];
  actionSuggestion?: string;
  decision?: 'FEASIBLE' | 'NOT_RECOMMENDED' | 'INFORMATIONAL' | 'YES' | 'NO' | 'NOT RECOMMENDED';
}

const QUICK_PROMPTS = [
  'Can I fit another activity today?',
  'Are we within our budget limit?',
  'What should we do if our morning stop is closed?',
  'How is our daily travel pace balanced?'
];

export function TripAssistantPanel({
  trip,
  onAutoRepair,
  onTriggerReplacer
}: TripAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I'm your TravelPilot Itinerary Intelligence Assistant. I am grounded in your ${trip.destination} schedule, ₹${trip.budgetAmount.toLocaleString('en-IN')} budget, and saved constraints. How can I help fine-tune your journey today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAskQuestion = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      let assistantData: AssistantAnswer | null = null;

      // Try server AI endpoint first
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('/api/itinerary/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trip, question: queryText }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          assistantData = await res.json();
        }
      } catch {
        // Fallback silently to client engine
      }

      if (!assistantData) {
        assistantData = answerTripAssistantQuestion(trip, queryText);
      }

      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: assistantData.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reasoning: assistantData.reasoning,
        actionSuggestion: assistantData.actionSuggestion,
        decision: assistantData.decision
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Error answering assistant query:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I encountered an issue analyzing the itinerary. Please try asking again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E7E2D9] shadow-xs overflow-hidden mb-8">
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5]/50 transition-colors"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif text-lg font-bold text-[#1A202C]">
                AI Itinerary Intelligence Assistant
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#EBF2F1] text-[#1D4E4F] font-mono-meta text-[10px] font-bold">
                Live Grounded
              </span>
            </div>
            <p className="text-xs text-[#576574] mt-0.5">
              Ask contextual questions about schedule feasibility, cancellations, budget headroom, or timings.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-xs font-semibold text-[#1D4E4F] flex items-center space-x-1"
        >
          <span>{isOpen ? 'Collapse' : 'Ask Assistant'}</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="p-5 sm:p-6 border-t border-[#E7E2D9] bg-[#FAF8F5]/30">
          {/* Quick Prompts */}
          <div className="mb-4">
            <span className="font-mono-meta text-[11px] uppercase tracking-wider text-[#576574] block mb-2">
              Suggested Contextual Inquiries:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleAskQuestion(prompt)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-[#EBF2F1] border border-[#E7E2D9] text-[#1A202C] hover:text-[#1D4E4F] transition-all cursor-pointer disabled:opacity-50 text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation History */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1 mb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#1D4E4F] text-white rounded-br-none'
                      : 'bg-white border border-[#E7E2D9] text-[#1A202C] rounded-bl-none shadow-2xs'
                  }`}
                >
                  {msg.decision && (
                    <div className="mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono-meta text-[10px] font-bold ${
                          msg.decision === 'FEASIBLE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : msg.decision === 'NOT_RECOMMENDED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {msg.decision === 'FEASIBLE' && '✓ Feasible'}
                        {msg.decision === 'NOT_RECOMMENDED' && '⚠️ Not Recommended'}
                        {msg.decision === 'INFORMATIONAL' && 'ℹ️ Info'}
                      </span>
                    </div>
                  )}

                  <p className="whitespace-pre-line">{msg.text}</p>

                  {msg.reasoning && msg.reasoning.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E7E2D9]/60 space-y-1">
                      <span className="font-mono-meta text-[10px] uppercase text-[#576574] font-semibold block">
                        Engine Reasoning Points:
                      </span>
                      {msg.reasoning.map((r, i) => (
                        <div key={i} className="text-[11px] text-[#576574] flex items-start space-x-1.5">
                          <span className="text-[#1D4E4F] font-bold">•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.actionSuggestion && onAutoRepair && (
                    <div className="mt-3 pt-2">
                      <button
                        type="button"
                        onClick={onAutoRepair}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#EBF2F1] text-[#1D4E4F] font-semibold text-[11px] hover:bg-[#1D4E4F] hover:text-white transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Apply Auto-Repair Recommendation</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-mono-meta text-[#576574] mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-[#576574] p-2 bg-white rounded-xl border border-[#E7E2D9] w-max animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-[#1D4E4F] animate-spin" />
                <span>Analyzing itinerary constraints...</span>
              </div>
            )}
          </div>

          {/* Query Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskQuestion(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask about timings, pace, budget, or cancellations in ${trip.destination}...`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#E7E2D9] text-xs text-[#1A202C] placeholder-[#576574] focus:outline-none focus:border-[#1D4E4F]"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-[#1D4E4F] hover:bg-[#153B3C] text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
