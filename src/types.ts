export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type PresetType = "friendly" | "programmer" | "academic" | "creative" | "sarcastic";

export interface Preset {
  id: PresetType;
  name: string;
  description: string;
  systemInstruction: string;
  temperature: number;
  icon: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  presetId: PresetType;
  customSystemInstruction?: string;
  temperature: number;
  createdAt: string;
}
