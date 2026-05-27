import React from "react";
import { Sparkles, GraduationCap, Code, Compass, MessageSquare } from "lucide-react";
import { PresetType } from "../types";

interface Suggestion {
  id: string;
  text: string;
  label: string;
  preset: PresetType;
  icon: React.ComponentType<{ className?: string }>;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: "quantum",
    text: "Explain quantum computers like I am 10 years old.",
    label: "Explain Quantum Computers",
    preset: "academic",
    icon: GraduationCap,
  },
  {
    id: "ts-func",
    text: "Write a clean TypeScript function that fetches API data with timeout and retry logic.",
    label: "TypeScript Retry Fetch",
    preset: "programmer",
    icon: Code,
  },
  {
    id: "patagonia",
    text: "Draft a beautifully rich, sensory paragraph describing a cozy cabin in a Patagonia snowstorm.",
    label: "Scenic Creative Writing",
    preset: "creative",
    icon: Compass,
  },
  {
    id: "joke",
    text: "Review the concept of a 'Monday' from an existential viewpoint.",
    label: "Existential Humorous Review",
    preset: "sarcastic",
    icon: MessageSquare,
  }
];

interface PromptSuggestionsProps {
  onSelect: (text: string, preset: PresetType) => void;
}

export function PromptSuggestions({ onSelect }: PromptSuggestionsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-zinc-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 select-none">
          Suggested Starters
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {SUGGESTIONS.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.id}
              onClick={() => onSelect(suggestion.text, suggestion.preset)}
              type="button"
              className="flex items-start text-left gap-2.5 p-3 rounded-lg border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-200 cursor-pointer group active:scale-[0.99] select-none"
            >
              <div className="p-1.5 rounded-md bg-zinc-100 text-zinc-650 group-hover:bg-zinc-200 transition-colors mt-0.5">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-zinc-800 tracking-tight leading-snug group-hover:text-zinc-900 truncate">
                  {suggestion.label}
                </div>
                <div className="text-[11px] text-zinc-450 truncate mt-0.5 leading-normal">
                  "{suggestion.text}"
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
