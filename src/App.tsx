import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  Trash2, 
  Settings2, 
  Sparkles, 
  Code, 
  GraduationCap, 
  Flame, 
  Heart, 
  Info, 
  ExternalLink, 
  X, 
  AlertCircle,
  Clock,
  User,
  Bot,
  Menu,
  Check,
  Compass,
  FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Message, PresetType, Preset } from "./types";
import { PRESETS } from "./presets";
import { MarkdownRenderer } from "./components/MarkdownRenderer";

// Default welcome greeting following Aurelius style guidelines
const DEFAULT_SYSTEM_MEET: Message = {
  id: "welcome-system",
  role: "assistant",
  content: "Welcome, seeker of clarity. I am **Aurelius**, your intellectual assistant powered by **Gemini 3.5 Flash**.\n\nI approach your questions with a deliberate, analytical mind. We can explore philosophy, write modern optimized code, analyze complex academic topics, or compose creative narratives. \n\nSelect one of our classics on the left sidebar to begin, or compose your inquiry directly into the bar below. Access the **Persona Settings** panel above to alter our dynamic context.",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

// Classical pre-configured archive queries
const ARCHIVES = [
  {
    query: "Explain the concept of 'memento mori' and how it can be applied to modern productivity without being morbid.",
    label: "Stoic Memento Mori",
    preset: "academic" as PresetType,
    tag: "Philosophy"
  },
  {
    query: "Explain the quantum observer effect and how measuring a photon collapses its probability wave.",
    label: "Quantum observer effect",
    preset: "academic" as PresetType,
    tag: "Physics"
  },
  {
    query: "How do espresso roasting curves alter the acidity and body extraction inside light roast filters?",
    label: "Espresso roasting curves",
    preset: "creative" as PresetType,
    tag: "Coffee Chemistry"
  },
  {
    query: "Draft a modern TypeScript retry mechanism that fetches data safely with exponential backoff.",
    label: "TypeScript Backoff Retry",
    preset: "programmer" as PresetType,
    tag: "Software Design"
  },
  {
    query: "Write a short speculative fiction narrative exploring linguistic relativity in a deep-space contact scenario.",
    label: "Linguistic relativity scenario",
    preset: "creative" as PresetType,
    tag: "Creative Writing"
  },
  {
    query: "Explain optimal game theory foundations for cooperations inside the Prisoner's Dilemma.",
    label: "Game theory cooperation",
    preset: "academic" as PresetType,
    tag: "Economic Math"
  }
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [activePresetId, setActivePresetId] = useState<PresetType>("academic");
  const [temperature, setTemperature] = useState(0.4);
  const [isSending, setIsSending] = useState(false);
  const [isHealthCheckPending, setIsHealthCheckPending] = useState(true);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [currentUtcTime, setCurrentUtcTime] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  
  // Custom interface toggles
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer tracking
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // References
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Initialize data on mount
  useEffect(() => {
    // 1. Clock timer
    const updateTime = () => {
      const now = new Date();
      setCurrentUtcTime(now.toUTCString().replace("GMT", ""));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    // 2. Load cached messages from localStorage
    const savedMessages = localStorage.getItem("chat_messages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (err) {
        console.error("Failed to parse cached chat history.", err);
        setMessages([DEFAULT_SYSTEM_MEET]);
      }
    } else {
      setMessages([DEFAULT_SYSTEM_MEET]);
    }

    // 3. Load active preset configuration
    const savedPreset = localStorage.getItem("chat_preset_id");
    if (savedPreset) {
      setActivePresetId(savedPreset as PresetType);
      const matched = PRESETS.find(p => p.id === savedPreset);
      if (matched) {
        setTemperature(matched.temperature);
      }
    } else {
      // Aurelius defaults beautifully to academic style
      setActivePresetId("academic");
      setTemperature(0.4);
    }

    // 4. Verify Express + Gemini server health
    checkApiHealth();

    return () => clearInterval(interval);
  }, []);

  // Save messages to history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chat_messages", JSON.stringify(messages));
    } else {
      localStorage.removeItem("chat_messages");
    }
  }, [messages]);

  // Handle auto scrolling
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const checkApiHealth = async () => {
    try {
      setIsHealthCheckPending(true);
      const res = await fetch("/api/health");
      const data = await res.json();
      setIsApiConfigured(data.apiKeyAvailable);
    } catch (err) {
      console.error("Error communicating with health check API:", err);
      setIsApiConfigured(false);
    } finally {
      setIsHealthCheckPending(false);
    }
  };

  const handleSelectPreset = (presetId: PresetType) => {
    setActivePresetId(presetId);
    localStorage.setItem("chat_preset_id", presetId);
    
    const matched = PRESETS.find(p => p.id === presetId);
    if (matched) {
      setTemperature(matched.temperature);
    }
  };

  // Immediate send triggers for sidebar queries
  const handleArchiveSelect = async (archive: typeof ARCHIVES[0]) => {
    // Select styling / preset
    handleSelectPreset(archive.preset);
    
    // Auto populate query
    setInputVal(archive.query);
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const handleResetChat = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      setMessages([DEFAULT_SYSTEM_MEET]);
      setServerError(null);
    }
  };

  // Export full discussion markdown transcript with nice formatting
  const handleExportTranscript = async () => {
    try {
      const textToCopy = messages
        .map(m => `[${m.timestamp}] ${m.role === "user" ? "USER" : "AURELIUS"}:\n${m.content}`)
        .join("\n\n---\n\n");
        
      await navigator.clipboard.writeText(textToCopy);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch (err) {
      console.error("Failed to copy transcript:", err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isSending) return;

    const userText = inputVal.trim();
    setInputVal("");
    setServerError(null);

    const newUserMsg: Message = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update conversation state with user prompt
    const nextMessages = [...messages, newUserMsg];
    setMessages(nextMessages);
    setIsSending(true);

    try {
      const activePreset = PRESETS.find(p => p.id === activePresetId) || PRESETS[0];

      // Call Express proxy endpoint
      const result = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          systemInstruction: activePreset.systemInstruction,
          temperature: temperature
        })
      });

      if (!result.ok) {
        const errPayload = await result.json();
        throw new Error(errPayload.error || "The server returned an error response.");
      }

      const responseData = await result.json();

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: responseData.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (err: any) {
      console.error("Failed to generate response:", err);
      setServerError(err.message || "An expected connection error happened. Please try sending prompt again.");
    } finally {
      setIsSending(false);
    }
  };

  const activePreset = PRESETS.find(p => p.id === activePresetId) || PRESETS[0];

  // Helper to map preset icon tags to custom rendering components inside settings
  const getPresetIcon = (iconName: string, className?: string) => {
    switch (iconName) {
      case "Heart": return <Heart className={className} />;
      case "Code": return <Code className={className} />;
      case "GraduationCap": return <GraduationCap className={className} />;
      case "Sparkles": return <Sparkles className={className} />;
      case "Flame": return <Flame className={className} />;
      default: return <MessageSquare className={className} />;
    }
  };

  // Recent user questions for sidebar display
  const userEnquiries = messages.filter(m => m.role === "user");

  return (
    <div className="min-h-screen bg-[#0C0C0C] font-sans text-zinc-300 antialiased flex overflow-hidden w-full relative">
      
      {/* LEFT SIDEBAR: Persistent on desktop md+, Slide-out on mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#0F0F0F] border-r border-white/10 flex flex-col transition-transform duration-300 md:relative md:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-0 hidden md:flex"}
      `}>
        {/* Sidebar Close trigger for mobile */}
        <div className="absolute right-4 top-4 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 active:scale-95 cursor-pointer"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Brand layout */}
        <div className="p-8 pb-4">
          <h1 className="font-serif italic text-2xl text-white tracking-tight leading-none">Aurelius</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mt-2 font-medium">Intellectual Assistant</p>
        </div>
        
        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 mt-6 overflow-y-auto space-y-6 scrollbar-none pb-4 select-none">
          {/* Recent conversation inputs */}
          {userEnquiries.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 px-4 flex items-center gap-1.5 font-bold leading-none">
                <Clock className="w-2.5 h-2.5 text-zinc-650" /> Recent Enquiries
              </p>
              <ul className="space-y-1">
                {userEnquiries.slice(-4).map((enq) => (
                  <li 
                    key={enq.id} 
                    onClick={() => setInputVal(enq.content)}
                    className="px-4 py-2 hover:bg-white/5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 truncate cursor-pointer border border-transparent hover:border-white/5 transition-all"
                    title={enq.content}
                  >
                    {enq.content}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Preset Classics / Archives */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-3 px-4 font-bold flex items-center gap-1.5 leading-none">
              <Compass className="w-2.5 h-2.5" /> Classical Archives
            </p>
            <ul className="space-y-1">
              {ARCHIVES.map((archive, i) => {
                const isActivePrompt = inputVal === archive.query;
                return (
                  <li 
                    key={i}
                    onClick={() => handleArchiveSelect(archive)}
                    className={`px-4 py-2 text-xs rounded-lg cursor-pointer transition-all border flex flex-col justify-start gap-1 ${
                      isActivePrompt
                        ? "bg-white/5 border-white/10 text-[#D4AF37]"
                        : "hover:bg-white/5 border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span className="font-serif italic text-[13px] tracking-tight leading-snug">{archive.label}</span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-650 leading-none">{archive.tag}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Sidebar profile footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center space-x-3 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#8E6E2D] flex-shrink-0 shadow-lg shadow-[#D4AF37]/5"></div>
            <div className="overflow-hidden">
              <p className="text-xs text-white truncate font-medium">Julian Thorne</p>
              <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 mt-0.5">Premium Scholar</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR BLACK BACKDROP */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative h-screen max-w-full overflow-hidden justify-between">
        
        {/* Dynamic header bar */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 sm:px-10 shrink-0 select-none bg-[#0C0C0C]/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger menu toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 md:hidden cursor-pointer"
              type="button"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-zinc-400">
                Active: Philosophical Inquiry ({activePreset.name})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Reset Chat button */}
            <button
               onClick={handleResetChat}
               disabled={messages.length <= 1}
               className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none"
               title="Clear Conversation"
               type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Persona Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-[11px] uppercase tracking-widest text-zinc-400 border border-white/10 px-4 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-all duration-150 active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
              type="button"
            >
              <Settings2 className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Settings</span>
            </button>

            {/* Export transcript */}
            <button 
              onClick={handleExportTranscript}
              className="text-[11px] uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-1.5 rounded-full hover:text-white hover:bg-[#D4AF37]/5 transition-all duration-150 flex items-center gap-1.5 select-none cursor-pointer"
              type="button"
            >
              {copiedTranscript ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Export Transcript</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Verification banner if key is initially unset */}
        {!isHealthCheckPending && !isApiConfigured && (
          <div className="mx-6 sm:mx-10 mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shrink-0 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider select-none">
                Credentials Needed
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed select-text">
                Your chatbot proxy is operational, but no <strong>Gemini API key</strong> is found in environment variables. 
                Configure your key in <strong>Settings &gt; Secrets</strong> workspace to unlock immediate responses.
              </p>
            </div>
          </div>
        )}

        {/* DIALOG CHAT WINDOW CONTAINER */}
        <section className="flex-1 px-4 sm:px-10 lg:px-20 py-6 overflow-y-auto flex flex-col justify-start">
          <div className="space-y-12 mb-8 flex-1">
            {messages.map((message, idx) => {
              const isBot = message.role === "assistant";
              return (
                <div 
                  key={message.id || idx} 
                  className={`flex flex-col ${isBot ? "items-start" : "items-end"} w-full`}
                >
                  {isBot ? (
                    // Bot response block styling
                    <div className="flex items-start space-x-6 max-w-3xl w-full select-text">
                      <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1 select-none bg-zinc-900/60 shadow-lg">
                        <span className="font-serif italic text-[#D4AF37] text-lg font-bold">A</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {idx === 0 ? (
                          // Custom italic serif intro style for welcome
                          <p className="font-serif text-[18px] text-white/95 leading-relaxed italic mb-4">
                            "{message.content.split("\n\n")[0].replace("---", "")}"
                          </p>
                        ) : null}
                        
                        <div className="prose prose-invert max-w-none text-[15px] text-zinc-350 select-text leading-relaxed">
                          {idx === 0 ? (
                            <MarkdownRenderer content={message.content.split("\n\n").slice(1).join("\n\n")} />
                          ) : (
                            <MarkdownRenderer content={message.content} />
                          )}
                        </div>

                        {/* Metallic tag tags inside chatbot responses */}
                        <div className="flex flex-wrap gap-2 mt-5 select-none">
                          <span className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 rounded text-zinc-500 capitalize">
                            Companion: {activePreset.name}
                          </span>
                          <span className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 rounded text-zinc-500">
                            Temp: {temperature}
                          </span>
                          <span className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 rounded text-zinc-500">
                            Model: Gemini 3.5
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // User prompt block styling
                    <div className="flex flex-col items-end max-w-lg select-text pl-12 text-right">
                      <div className="bg-zinc-800 text-white px-6 py-4 rounded-t-2xl rounded-bl-2xl font-sans text-[15px] leading-relaxed shadow-md border border-white/5 select-text">
                        <p>{message.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Date and delivery parameters indicators */}
                  <p className={`text-[10px] text-zinc-650 mt-2.5 uppercase tracking-tighter select-none ${isBot ? "ml-16" : "mr-1"}`}>
                    {message.timestamp} — {isBot ? "Generated" : "Sent"}
                  </p>
                </div>
              );
            })}

            {/* Model is thinking bubble skeleton */}
            {isSending && (
              <div className="flex flex-col items-start w-full">
                <div className="flex items-start space-x-6 max-w-2xl select-none">
                  <div className="w-10 h-10 border border-white/15 rounded-full flex items-center justify-center flex-shrink-0 bg-transparent shrink-0">
                    <Bot className="h-4 w-4 text-[#D4AF37] animate-spin" />
                  </div>
                  <div className="flex-1 mt-1.5 flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] animate-pulse">
                      Consulting context
                    </span>
                    <div className="h-1 w-1 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-1 w-1 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-1 w-1 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error notifications display box */}
            {serverError && (
              <div className="self-center w-full max-w-md my-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-200 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold select-none">Transmission Failure</p>
                  <p className="text-[11px] text-red-300 leading-normal mt-0.5 select-text">
                    {serverError}
                  </p>
                  <button
                    onClick={() => setServerError(null)}
                    className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] hover:text-white flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry Prompt
                  </button>
                </div>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>
        </section>

        {/* INPUT PROMPT CONTROL FOOTER */}
        <footer className="p-4 sm:p-10 pt-0 shrink-0 bg-[#0C0C0C]">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-2xl focus-within:border-white/25 transition-all">
              <textarea 
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-transparent border-none text-white focus:outline-none placeholder-zinc-650 resize-none h-14 pr-28 py-2 px-2 scrollbar-none font-sans text-[15px]" 
                placeholder={`Ask Aurelius anything (using ${activePreset.name})...`}
              />
              
              <div className="absolute bottom-4 right-4 flex items-center space-x-3 select-none">
                <span className="hidden sm:inline-block text-[9px] text-zinc-600 border border-white/5 px-2 py-1 rounded font-mono">
                  ENTER TO SEND
                </span>
                
                <button 
                  disabled={!inputVal.trim() || isSending}
                  className="w-10 h-10 bg-[#D4AF37] text-black rounded-xl flex items-center justify-center hover:bg-[#B3932D] transition-colors cursor-pointer select-none disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 inline-flex"
                  type="submit"
                  title="Submit enquiry"
                >
                  <Send className="w-4 h-4 fill-black text-black" />
                </button>
              </div>
            </form>

            <p className="text-center text-[9px] text-zinc-600 mt-4 tracking-widest uppercase select-none">
              Deep reasoning active • Context window optimized • Clock: {currentUtcTime || "2026-05-22 UTC"}
            </p>
          </div>
        </footer>

      </main>

      {/* FLOATING PERSONA DRAWER IN RE-CONFIGURED STYLES */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
            {/* Backdrop filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            
            {/* Slideout drawer panels */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="relative w-full max-w-md h-full bg-[#111111] border-l border-white/10 shadow-2xl overflow-y-auto py-6 px-6 flex flex-col justify-start text-zinc-100"
            >
              {/* Drawer Title Block */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4.5 w-4.5 text-[#D4AF37]" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-serif italic">
                    Configure Aurelius Presets
                  </h2>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-md cursor-pointer transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Main selectors */}
              <div className="flex-1 space-y-6">
                
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
                    Companion Dialect Presets
                  </span>
                  
                  <div className="flex flex-col gap-2">
                    {PRESETS.map((preset) => {
                      const isSelected = preset.id === activePresetId;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset.id)}
                          type="button"
                          className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex gap-3 ${
                            isSelected 
                              ? "bg-zinc-900 border-[#D4AF37] text-white shadow-xl" 
                              : "bg-[#181818]/60 border-white/5 text-zinc-400 hover:border-white/15 hover:bg-zinc-900"
                          }`}
                        >
                          <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                            isSelected ? "bg-zinc-800 text-[#D4AF37]" : "bg-zinc-900 text-zinc-500"
                          }`}>
                            {getPresetIcon(preset.icon, "h-4 w-4")}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold tracking-tight block ${isSelected ? "text-white" : "text-zinc-300"}`}>
                              {preset.name}
                            </span>
                            <span className="text-[11px] leading-relaxed block mt-0.5 line-clamp-2 text-zinc-500">
                              {preset.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accuracy temperature parameters adjuster */}
                <div className="space-y-2.5 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
                      Analytical Temperature
                    </span>
                    <span className="font-mono text-xs font-bold text-[#D4AF37] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {temperature}
                    </span>
                  </div>
                  
                  <div className="py-2 select-none">
                    <input 
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-[#D4AF37] cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 mt-1.5 select-none font-mono tracking-tight">
                      <span>0.1 (Precise Stoic Research)</span>
                      <span>1.0 (Artistic Dialogue Creative)</span>
                    </div>
                  </div>
                </div>

                {/* Active systemic instruction instructions output box */}
                <div className="space-y-1.5 bg-black/45 rounded-xl p-3.5 border border-white/5">
                  <span className="text-[9px] font-bold text-zinc-650 uppercase tracking-widest block font-mono">
                    Underlying System prompt
                  </span>
                  <p className="text-[11px] leading-relaxed text-zinc-400 select-text max-h-[140px] overflow-y-auto font-mono scrollbar-none">
                    {activePreset.systemInstruction}
                  </p>
                </div>

              </div>

              {/* Apply settings block footer element */}
              <div className="pt-4 border-t border-white/5 space-y-3 shrink-0">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-3 bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer select-none text-center shadow-md hover:bg-[#B3932D] transition-colors"
                  type="button"
                >
                  Apply context
                </button>
                <div className="text-[10px] text-zinc-600 text-center select-none font-mono">
                  Context adjustments reflect immediately on next inquiry.
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
