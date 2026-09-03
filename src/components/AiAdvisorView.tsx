import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiAdvisorView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to the Monoglass Technical & Specification Advisor

I am your dedicated technical advisor for **Monoglass Spray-Applied Glass Fiber Insulation** (CSI Section 07 21 29 / 09 81 00).

How can I assist your project today?
- **Building Code & Thermal Envelope:** ASHRAE 90.1 / IECC parkade soffit R-value requirements.
- **Fire & Life Safety Standards:** ASTM E84 (Flame Spread 0 / Smoke 0), ASTM E136 Non-Combustibility, and CAN/ULC S102.
- **Acoustic Design:** Reverberation control and NRC sound absorption calculations (0.75 - 1.00+).
- **Substrate Engineering:** Adhesion over concrete, corrugated steel deck, bar joists, and primers.
- **Condensation & Dew Point:** Ice arena and swimming pool psychrometric envelope isolation.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'What thickness is required for an unheated parking garage under conditioned apartments?',
    'Can Monoglass be sprayed directly onto corrugated galvanized steel decking without a primer?',
    'How does Monoglass prevent roof condensation and dripping in indoor ice arenas?',
    'What is the difference between ASTM E84 Flame 0 / Smoke 0 and ASTM E136 Non-Combustibility?',
    'When should Sonoglaze protective polymer hardcoat be specified over standard Monoglass?',
    'How does Monoglass compare to closed-cell spray polyurethane foam regarding thermal barrier codes?',
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend.trim(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Advisor service responded with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'I apologize, but I could not generate a technical advisory response at this moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Advisor query error:', error);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Technical Note on Monoglass Specification:**\n\nFor your inquiry regarding "${textToSend}":\n\n- **Thermal R-Value:** Monoglass provides R-4.00 per inch (k=0.25). For continuous insulation on concrete slabs, 3.5" to 5.0" (R-14 to R-20) is standard in Climate Zones 4-6.\n- **Fire Rating:** 100% non-combustible (ASTM E136) and Class 1 / Class A (Flame Spread 0, Smoke Developed 0 per ASTM E84).\n- **Adhesion:** Greater than 200 lbs/sq ft bond strength to clean concrete and metal deck without mechanical pins.\n- **Acoustic:** NRC 0.75 @ 1" to NRC 0.95 @ 2.5"+.\n\n*(Connect your GEMINI_API_KEY in the Secrets menu for dynamic real-time AI calculations)*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `### Welcome to the Monoglass Technical & Specification Advisor

I am your dedicated technical advisor for **Monoglass Spray-Applied Glass Fiber Insulation** (CSI Section 07 21 29 / 09 81 00).

How can I assist your project today?
- **Building Code & Thermal Envelope:** ASHRAE 90.1 / IECC parkade soffit R-value requirements.
- **Fire & Life Safety Standards:** ASTM E84 (Flame Spread 0 / Smoke 0), ASTM E136 Non-Combustibility, and CAN/ULC S102.
- **Acoustic Design:** Reverberation control and NRC sound absorption calculations (0.75 - 1.00+).
- **Substrate Engineering:** Adhesion over concrete, corrugated steel deck, bar joists, and primers.
- **Condensation & Dew Point:** Ice arena and swimming pool psychrometric envelope isolation.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Hero Header */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> AI Technical & Building Code Consultant
          </div>
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Monoglass Technical & Specification Advisor
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Ask questions regarding IBC / IECC / ASHRAE 90.1 building codes, ASTM test verifications, condensation dew-point prevention, substrate prep, acoustic NRC engineering, or contractor spray techniques.
        </p>
      </section>

      {/* Quick Prompt Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> Frequently Asked Technical Questions:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSendMessage(prompt)}
              className="text-left text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl min-h-[450px] max-h-[650px] overflow-y-auto flex flex-col">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-2 relative group ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] opacity-70 mb-1">
                  <span className="font-semibold">{isUser ? 'You' : 'Monoglass Technical Advisor'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="leading-relaxed whitespace-pre-wrap text-xs sm:text-sm font-sans">
                  {msg.content}
                </div>

                {!isUser && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Answer</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 text-sm items-center">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Analyzing ASTM standards, R-values, and building codes...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Chat Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center gap-2 shadow-lg"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask any technical question about Monoglass specifications, ASTM standards, or parkade detailing..."
          className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
