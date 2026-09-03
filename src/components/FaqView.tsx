import React, { useState, useMemo, useRef } from 'react';
import {
  HelpCircle,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Wrench,
  Layers,
  Flame,
  ShieldAlert,
  Volume2,
  Droplets,
  Paintbrush,
  Copy,
  Check,
  Send,
  Bot,
  RefreshCw,
  SlidersHorizontal,
  BookmarkCheck,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { MONOGLASS_FAQS, FAQ_CATEGORIES } from '../data/faqsData';
import { FaqItem, FaqCategoryType } from '../types';
import { useSettings } from '../context/SettingsContext';

interface FaqViewProps {
  onNavigateToCalculator?: () => void;
  onNavigateToSpecBuilder?: () => void;
  onNavigateToContractors?: () => void;
}

export const FaqView: React.FC<FaqViewProps> = ({
  onNavigateToCalculator,
  onNavigateToSpecBuilder,
  onNavigateToContractors,
}) => {
  const { isMetric } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategoryType | 'ALL'>('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-equip-setup');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Gemini AI Interactive State
  const [aiCustomQuestion, setAiCustomQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiActiveFaqId, setAiActiveFaqId] = useState<string | null>(null);
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [customAiAnswer, setCustomAiAnswer] = useState<string | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

  // Project Scenario Solver State
  const [scenarioSubstrate, setScenarioSubstrate] = useState('Cast-in-Place Concrete');
  const [scenarioApplication, setScenarioApplication] = useState('Unheated Parking Garage Soffit');
  const [scenarioTargetRValue, setScenarioTargetRValue] = useState('R-20 (5.0 inches / 127 mm)');
  const [scenarioClimate, setScenarioClimate] = useState('Climate Zone 5 (Cold Winter < 40°F / 4.5°C)');
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<string | null>(null);

  const aiResultRef = useRef<HTMLDivElement>(null);

  // Filtered FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    return MONOGLASS_FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'ALL' || faq.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        faq.question.toLowerCase().includes(q) ||
        faq.shortAnswer.toLowerCase().includes(q) ||
        faq.detailedAnswer.toLowerCase().includes(q) ||
        faq.tags.some((t) => t.toLowerCase().includes(q)) ||
        faq.applicableStandards?.some((s) => s.toLowerCase().includes(q)) ||
        faq.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wrench':
        return <Wrench className="w-4 h-4" />;
      case 'Layers':
        return <Layers className="w-4 h-4" />;
      case 'Flame':
        return <Flame className="w-4 h-4" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-4 h-4" />;
      case 'Volume2':
        return <Volume2 className="w-4 h-4" />;
      case 'Droplets':
        return <Droplets className="w-4 h-4" />;
      case 'Paintbrush':
        return <Paintbrush className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit custom question to Gemini API
  const handleAskGemini = async (questionToAsk?: string, faqId?: string, categoryName?: string) => {
    const query = questionToAsk || aiCustomQuestion;
    if (!query.trim() || aiLoading) return;

    setAiLoading(true);
    if (faqId) {
      setAiActiveFaqId(faqId);
    } else {
      setCustomAiAnswer(null);
    }

    try {
      const response = await fetch('/api/faqs/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query.trim(),
          category: categoryName || selectedCategory !== 'ALL' ? selectedCategory : 'General Specification',
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini FAQ API responded with status ${response.status}`);
      }

      const data = await response.json();
      const answer = data.response || 'No response returned from Gemini API.';

      if (faqId) {
        setAiAnswers((prev) => ({ ...prev, [faqId]: answer }));
      } else {
        setCustomAiAnswer(answer);
        setTimeout(() => {
          aiResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    } catch (err: any) {
      console.error('Gemini FAQ Error:', err);
      const fallbackText = `**Technical Note on Monoglass Specification:**\n\nFor your inquiry regarding "${query}":\n\n- **Substrate & Temperature**: Substrates must be clean, structurally sound, and $\\ge 40^\\circ\\text{F}$ ($4.5^\\circ\\text{C}$). Unpainted concrete and standard galvanized metal deck require zero primer.\n- **Thermal & Fire Ratings**: Monoglass delivers R-4.00/inch, Class 1 / Class A fire rating (Flame Spread 0, Smoke Developed 0 per ASTM E84), and 100% non-combustible classification (ASTM E136).\n- **Adhesion & Passes**: Minimum 200+ lbs/sq ft bond strength (ASTM E736), single-pass spray up to 5.0" (127 mm / R-20).\n\n*(Configure GEMINI_API_KEY in the Settings menu for live custom calculations)*`;
      if (faqId) {
        setAiAnswers((prev) => ({ ...prev, [faqId]: fallbackText }));
      } else {
        setCustomAiAnswer(fallbackText);
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Generate customized project scenario checklist via Gemini API
  const handleGenerateScenarioChecklist = async () => {
    if (scenarioLoading) return;
    setScenarioLoading(true);
    setScenarioResult(null);

    const promptText = `Generate an authoritative, step-by-step Monoglass Installation, Substrate Preparation, and Quality Assurance Protocol for the following project parameters:
- Substrate Type: ${scenarioSubstrate}
- Application / Facility Type: ${scenarioApplication}
- Target Insulation Spec: ${scenarioTargetRValue}
- Environmental & Climatic Condition: ${scenarioClimate}

Please provide:
1. Substrate Cleanliness & Primer Determination (including ASTM E736 bond criteria)
2. Equipment & Adhesive Mix Ratio (Concentrate-to-water dilution and atomizing liquid PSI)
3. Application Spray Passes & Curing Ventilation Controls (mitigating cold weather or high humidity)
4. Field Inspection, Quality Control Checklist & ASTM Verification Standards.`;

    try {
      const response = await fetch('/api/faqs/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: promptText,
          category: 'Installation Best Practices & Substrate Engineering',
          contextData: {
            substrate: scenarioSubstrate,
            application: scenarioApplication,
            targetRValue: scenarioTargetRValue,
            climate: scenarioClimate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const data = await response.json();
      setScenarioResult(data.response || 'Specification generated successfully.');
    } catch (err: any) {
      console.error('Scenario generation error:', err);
      setScenarioResult(`### Monoglass Project Protocol: ${scenarioSubstrate} (${scenarioApplication})

1. **Substrate Preparation**:
   - Clean cast-in-place concrete or metal deck free of form-release oils, curing compounds, and moisture.
   - Temperature must be $\\ge 40^\\circ\\text{F}$ ($4.5^\\circ\\text{C}$) and rising.
   - No primer required on clean unpainted concrete or standard galvanized steel decking.

2. **Adhesive & Equipment Protocol**:
   - Mix Monoglass Adhesive Concentrate 3:1 to 4:1 with clean potable water.
   - Set pump pressure to 30–45 PSI at the 4/6-nozzle atomizing ring.

3. **Application & Thermal Specification**:
   - Target: ${scenarioTargetRValue} (R-4.00 per inch continuous insulation).
   - Single-pass installation up to 5.0 inches (127 mm).

4. **Curing & Environmental Control**:
   - Provide 2–4 air changes per hour cross-ventilation.
   - For cold weather (<40°F), utilize indirect-fired vented heaters for minimum 24 hours.`);
    } finally {
      setScenarioLoading(false);
    }
  };

  const quickAiQuestions = [
    'What substrate preparation is required for oily galvanized metal deck?',
    'Can Monoglass be applied in freezing weather below 40°F (4.5°C)?',
    'How does Monoglass adhere to painted concrete ceilings?',
    'What is the difference between natural white Monoglass and Sonoglaze hard-coat?',
    'How do I calculate bag counts and adhesive gallons for a 15,000 sq ft parkade?',
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Hero Banner */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Gemini AI Technical Knowledge Base</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>CSI 07 21 29 / 09 81 00 Standards</span>
            </div>
          </div>

          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Monoglass Technical FAQs & Installation Authority
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Authoritative, ASTM-verified answers to critical technical questions regarding installation best practices, substrate adhesion requirements, thermal R-values, fire life safety, and acoustic reverberation control.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-sky-400">R-4.00 / in</div>
              <div className="text-[11px] text-slate-400">Continuous Thermal (ci)</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-emerald-400">0 / 0 Class A</div>
              <div className="text-[11px] text-slate-400">ASTM E84 Flame / Smoke</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-indigo-400">&gt; 200 lbs/sq ft</div>
              <div className="text-[11px] text-slate-400">ASTM E736 Bond Strength</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-amber-400">5.0" (127 mm)</div>
              <div className="text-[11px] text-slate-400">Max Single Pass (R-20)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Gemini AI Live Query Box */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-sky-500/30 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Ask Gemini AI Any Technical Query
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Live API
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Get real-time code-compliant answers on substrate adhesion, adhesive ratios, spray equipment, or climate limits.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
          >
            {isAiPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isAiPanelOpen ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>

        {isAiPanelOpen && (
          <div className="space-y-4 pt-1">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskGemini();
              }}
              className="relative flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                value={aiCustomQuestion}
                onChange={(e) => setAiCustomQuestion(e.target.value)}
                placeholder="Ask about installation steps, adhesive dilution, substrate temperature, or code compliance..."
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 shadow-inner"
              />
              <button
                type="submit"
                disabled={!aiCustomQuestion.trim() || aiLoading}
                className="px-5 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 shrink-0"
              >
                {aiLoading ? (
                  <>
                    <Bot className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Ask Gemini</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick suggested prompt buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-sky-400" /> Popular Prompts:
              </span>
              {quickAiQuestions.map((qText, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiCustomQuestion(qText);
                    handleAskGemini(qText);
                  }}
                  className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-lg transition-colors text-left"
                >
                  {qText}
                </button>
              ))}
            </div>

            {/* Custom Gemini AI Result Box */}
            {customAiAnswer && (
              <div
                ref={aiResultRef}
                className="mt-4 bg-slate-950 border border-sky-500/40 rounded-2xl p-5 space-y-3 relative shadow-2xl animate-fade-in"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                      Gemini Technical Advisory Response
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText('custom-ai', customAiAnswer)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 transition-colors"
                    >
                      {copiedId === 'custom-ai' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Answer</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setCustomAiAnswer(null)}
                      className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                <div className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {customAiAnswer}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    ASTM C518 • ASTM E84 (0/0) • ASTM E136 Non-Combustible • ASTM E736
                  </span>
                  {onNavigateToSpecBuilder && (
                    <button
                      onClick={onNavigateToSpecBuilder}
                      className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Insert into CSI 07 21 29 Spec Generator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Main FAQ Search & Category Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, ASTM standard, substrate (e.g. concrete, metal deck), or topic..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="text-white font-bold">{filteredFaqs.length}</span> technical articles
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>All Categories ({MONOGLASS_FAQS.length})</span>
          </button>

          {FAQ_CATEGORIES.map((cat) => {
            const count = MONOGLASS_FAQS.filter((f) => f.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.shortLabel}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No technical articles found for "{searchQuery}"</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try searching with different keywords or ask Gemini directly using the live AI prompt box above.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            const hasAiAnswer = !!aiAnswers[faq.id];
            const isThisAiLoading = aiLoading && aiActiveFaqId === faq.id;

            return (
              <div
                key={faq.id}
                id={faq.id}
                className={`bg-slate-900 border transition-all rounded-2xl overflow-hidden shadow-lg ${
                  isExpanded ? 'border-sky-500/40 ring-1 ring-sky-500/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none bg-slate-900 hover:bg-slate-850 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                        {faq.category}
                      </span>
                      {faq.difficulty && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            faq.difficulty === 'Essential'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : faq.difficulty === 'Contractor Pro'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {faq.difficulty}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {faq.question}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {faq.shortAnswer}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 pt-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Content */}
                {isExpanded && (
                  <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-slate-800/80 bg-slate-950/60 space-y-5">
                    {/* Deep Technical Explanation */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Technical Specification & Engineering Details:
                      </h4>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {faq.detailedAnswer}
                      </p>
                    </div>

                    {/* Key Points Checklist */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
                      <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Key Execution Requirements:
                      </h5>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                        {faq.keyPoints.map((point, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Standards & Tags Footnote */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-500 font-semibold">Standards:</span>
                        {faq.applicableStandards?.map((std, sIdx) => (
                          <span
                            key={sIdx}
                            className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-700"
                          >
                            {std}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleCopyText(faq.id, `${faq.question}\n\n${faq.detailedAnswer}\n\nKey Points:\n- ${faq.keyPoints.join('\n- ')}`)}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                        >
                          {copiedId === faq.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Article</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleAskGemini(faq.question, faq.id, faq.category)}
                          disabled={isThisAiLoading}
                          className="text-xs bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-sky-200 border border-sky-500/30 px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                          <span>{isThisAiLoading ? 'Analyzing...' : 'Deep Dive with Gemini AI'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Gemini AI Deep-Dive Expansion Box */}
                    {hasAiAnswer && (
                      <div className="bg-slate-950 border border-sky-500/40 rounded-xl p-4 sm:p-5 space-y-3 animate-fade-in shadow-inner">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-sky-400" />
                            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                              Gemini Technical Advisory Deep-Dive
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyText(`ai-${faq.id}`, aiAnswers[faq.id])}
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                          >
                            {copiedId === `ai-${faq.id}` ? (
                              <span className="text-emerald-400">Copied</span>
                            ) : (
                              <span>Copy AI Analysis</span>
                            )}
                          </button>
                        </div>
                        <div className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                          {aiAnswers[faq.id]}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Project Scenario AI Protocol Generator */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
              <SlidersHorizontal className="w-4 h-4" /> Project Customizer
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Generate Custom Substrate & Installation Protocol
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Configure your specific project conditions to generate a personalized Gemini AI specification, adhesion requirements, and equipment setup checklist.
            </p>
          </div>
        </div>

        {/* 4-Field Scenario Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Substrate */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Substrate Type:
            </label>
            <select
              value={scenarioSubstrate}
              onChange={(e) => setScenarioSubstrate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Cast-in-Place Concrete (Form-Release Tested)">Cast-in-Place Concrete</option>
              <option value="Precast Hollow-Core Concrete Slabs">Precast Hollow-Core Slabs</option>
              <option value="Corrugated Galvanized Steel Deck (G60/G90)">Galvanized Steel Deck</option>
              <option value="Oily Mill-Finish Metal Deck (Degreasing Needed)">Oily Mill-Finish Metal Deck</option>
              <option value="Primed Structural Steel Beams & Bar Joists">Primed Steel Beams & Joists</option>
              <option value="Gypsum Wallboard / Cement Board">Gypsum Board / Cement Backer</option>
              <option value="Existing Painted Concrete (Aged Ceiling)">Existing Painted Ceiling</option>
              <option value="Wood Framing & OSB Subfloor">Wood Framing & OSB Subfloor</option>
            </select>
          </div>

          {/* 2. Application */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Facility / Application:
            </label>
            <select
              value={scenarioApplication}
              onChange={(e) => setScenarioApplication(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Unheated Parking Garage Soffit below Condos">Unheated Parking Garage Soffit</option>
              <option value="Indoor Natatorium / Swimming Pool Ceiling">Indoor Swimming Pool (Natatorium)</option>
              <option value="Ice Hockey Arena Roof Deck (Anti-Drip)">Ice Hockey Arena Roof Deck</option>
              <option value="Auditorium / Theater Acoustic Treatment">Auditorium / Theater (Acoustic)</option>
              <option value="Commercial High-Velocity Mechanical Room">Mechanical Fan Room (&gt;10k FPM)</option>
              <option value="Transit Tunnel / Subway Station">Transit Subway Station</option>
              <option value="Metal Building / Industrial Warehouse">Metal Building / Warehouse</option>
            </select>
          </div>

          {/* 3. Target Thickness / R-Value */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Target Thermal & Acoustic:
            </label>
            <select
              value={scenarioTargetRValue}
              onChange={(e) => setScenarioTargetRValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="R-14 (3.5 inches / 89 mm) - IECC Zone 4">R-14 (3.5" / 89 mm) - NRC 0.95</option>
              <option value="R-16 (4.0 inches / 100 mm) - Zone 5">R-16 (4.0" / 100 mm) - NRC 0.95</option>
              <option value="R-20 (5.0 inches / 127 mm) - Single Pass Max">R-20 (5.0" / 127 mm) - NRC 1.00</option>
              <option value="R-24 (6.0 inches / 152 mm) - 2 Passes">R-24 (6.0" / 152 mm) - 2 Passes</option>
              <option value="R-28 (7.0 inches / 178 mm) - Extreme Thermal">R-28 (7.0" / 178 mm) - Extreme</option>
              <option value="Acoustic Only: 1.5 inches (38 mm) - NRC 0.85">Acoustic: 1.5" (38 mm) - NRC 0.85</option>
              <option value="Acoustic Only: 2.5 inches (64 mm) - NRC 0.95">Acoustic: 2.5" (64 mm) - NRC 0.95</option>
            </select>
          </div>

          {/* 4. Climate / Temperature */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Climate & Ambient Temp:
            </label>
            <select
              value={scenarioClimate}
              onChange={(e) => setScenarioClimate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Temperate / Normal (50°F to 75°F / 10°C to 24°C)">Standard (50°F–75°F / 10°C–24°C)</option>
              <option value="Cold Winter (< 40°F / 4.5°C) - Vented Heaters Required">Cold Winter (&lt;40°F / Vented Heat)</option>
              <option value="Hot & Humid (> 80°F, 75% RH) - Extended Curing">Hot & Humid (&gt;80°F, High RH)</option>
              <option value="High Chloramine Indoor Vapor Pressure">High Chloramine Indoor Vapor</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateScenarioChecklist}
            disabled={scenarioLoading}
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2"
          >
            {scenarioLoading ? (
              <>
                <Bot className="w-4 h-4 animate-spin" />
                <span>Computing Engineering Protocol...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Custom Project Protocol via Gemini</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Protocol Output */}
        {scenarioResult && (
          <div className="bg-slate-950 border border-sky-500/40 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Custom Monoglass Protocol: {scenarioSubstrate}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {scenarioApplication} • {scenarioTargetRValue} • {scenarioClimate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyText('scenario-result', scenarioResult)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
                >
                  {copiedId === 'scenario-result' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Protocol</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {scenarioResult}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-400">
                <span>ASTM E736 &gt; 200 lbs/sq ft</span>
                <span>•</span>
                <span>ASTM E84 0/0</span>
                <span>•</span>
                <span>ASTM E136 Non-Combustible</span>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateToCalculator && (
                  <button
                    onClick={onNavigateToCalculator}
                    className="text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    Open R-Value Calculator →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Quick Action Navigation Footer */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-bold text-white">Need certified contractors or a submittal package?</h4>
          <p className="text-xs text-slate-400">
            Connect with certified Monoglass spray applicators or generate a 3-part CSI 07 21 29 submittal spec.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToContractors && (
            <button
              onClick={onNavigateToContractors}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Find Contractors
            </button>
          )}
          {onNavigateToSpecBuilder && (
            <button
              onClick={onNavigateToSpecBuilder}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-sky-500/20"
            >
              Generate CSI Spec
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
