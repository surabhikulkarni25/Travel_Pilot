import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { MapPin, Search, X, Check, Building2, Mountain, ChevronDown } from 'lucide-react';
import { INDIAN_DESTINATIONS, searchDestinations, DestinationItem } from '../data/indianDestinations';

interface DestinationAutocompleteProps {
  value: string;
  destinationItem?: DestinationItem | null;
  onChange: (destinationName: string, item?: DestinationItem) => void;
  placeholder?: string;
  className?: string;
}

export function DestinationAutocomplete({
  value,
  destinationItem,
  onChange,
  placeholder = 'Search Indian cities, hill stations, or regions...',
  className = ''
}: DestinationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = searchDestinations(query);

  const handleSelect = (item: DestinationItem) => {
    const formatted = `${item.name}, ${item.state}`;
    setQuery(formatted);
    onChange(formatted, item);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    onChange('', undefined);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      } else if (query.trim()) {
        // Custom input fallback
        onChange(query.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input container */}
      <div className="relative flex items-center">
        <MapPin className="w-5 h-5 text-[#D96B43] absolute left-4 pointer-events-none transition-colors" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-[#E7E2D9] focus:outline-none focus:border-[#1D4E4F] focus:ring-2 focus:ring-[#1D4E4F]/10 text-base text-[#1A202C] bg-[#FAF8F5] transition-all"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />

        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 p-1 rounded-full text-[#576574] hover:text-[#1A202C] hover:bg-[#E7E2D9] transition-colors"
            title="Clear destination"
            aria-label="Clear destination"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <ChevronDown className="w-4 h-4 text-[#576574] absolute right-4 pointer-events-none opacity-60" />
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#E7E2D9] shadow-lg py-2 z-50 max-h-72 overflow-y-auto animate-in fade-in-50 duration-100">
          <div className="px-3 py-1.5 border-b border-[#E7E2D9] flex items-center justify-between text-[11px] font-mono-meta uppercase tracking-wider text-[#576574]">
            <span>Destinations in India</span>
            <span>{suggestions.length} suggestions</span>
          </div>

          {suggestions.length > 0 ? (
            <ul role="listbox" className="p-1 space-y-0.5">
              {suggestions.map((item, idx) => {
                const isSelected = value.toLowerCase().includes(item.name.toLowerCase());
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                      isHighlighted ? 'bg-[#EBF2F1] text-[#1D4E4F]' : 'hover:bg-[#FAF8F5] text-[#1A202C]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#E7E2D9] flex items-center justify-center shrink-0">
                        {item.type === 'city' ? (
                          <Building2 className="w-3.5 h-3.5 text-[#1D4E4F]" />
                        ) : (
                          <Mountain className="w-3.5 h-3.5 text-[#D96B43]" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm leading-tight flex items-center space-x-2">
                          <span>{item.name}</span>
                          <span className="text-xs font-normal text-[#576574]">
                            {item.state}, {item.country}
                          </span>
                        </div>
                        {item.popularFor && (
                          <p className="text-[11px] text-[#576574] truncate max-w-xs mt-0.5">
                            {item.popularFor}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono-meta text-[10px] uppercase text-[#576574] px-2 py-0.5 rounded-md bg-white border border-[#E7E2D9] font-medium">
                        {item.type === 'city' ? 'Within City' : 'Outside City'}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#1D4E4F]" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-4 text-center text-xs text-[#576574]">
              <p>Press Enter to use &ldquo;<span className="font-semibold text-[#1A202C]">{query}</span>&rdquo;</p>
              <p className="mt-1 text-[11px] opacity-80">You can plan any custom destination across India or globally.</p>
            </div>
          )}

          {/* Quick Popular Pills */}
          <div className="px-3 pt-2.5 pb-1 border-t border-[#E7E2D9] mt-1">
            <span className="font-mono-meta text-[10px] uppercase tracking-wider text-[#576574] block mb-1.5">
              Popular starting points
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['Mumbai', 'Pune', 'Goa', 'Jaipur', 'Udaipur', 'Bengaluru', 'Manali'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    const match = INDIAN_DESTINATIONS.find((d) => d.name === c);
                    if (match) handleSelect(match);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-[#FAF8F5] hover:bg-[#EBF2F1] hover:text-[#1D4E4F] border border-[#E7E2D9] transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
