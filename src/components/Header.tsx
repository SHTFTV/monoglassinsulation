import React from 'react';
import {
  Shield,
  Search,
  Layers,
  Calculator,
  FileText,
  Users,
  Award,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Building2,
  Printer,
  Eye,
  Globe,
  HelpCircle,
  Package,
  Calendar,
  CalendarCheck,
  DollarSign,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { UnitToggle } from './UnitToggle';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuoteModal: () => void;
  onOpenRegisterModal: () => void;
  onOpenPrintPreview?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuoteModal,
  onOpenRegisterModal,
  onOpenPrintPreview,
}) => {
  const { isMetric } = useSettings();
  const navItems = [
    { id: 'guide', label: 'Technical Guide', icon: FileText, badge: 'ASTM Data' },
    { id: 'calculator', label: 'R-Value & Acoustic Calc', icon: Calculator, badge: 'Interactive' },
    { id: 'estimator', label: 'Project Estimator', icon: Package, badge: 'Multi-Room BOM' },
    { id: 'cost-estimator', label: 'Cost Estimator', icon: DollarSign, badge: 'Labor & Budget' },
    { id: 'schedule', label: 'Schedule Estimator', icon: Calendar, badge: 'Timeline' },
    { id: 'calendar', label: 'Timeline Calendar', icon: CalendarCheck, badge: 'Deliveries' },
    { id: 'comparison', label: 'Material Comparison', icon: Layers },
    { id: 'spec-builder', label: 'CSI Spec Generator', icon: Shield, badge: '07 21 29' },
    { id: 'case-studies', label: 'Case Studies', icon: Building2 },
    { id: 'directory', label: 'Find Contractors', icon: Users, badge: 'Verified' },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle, badge: 'Gemini AI' },
    { id: 'advisor', label: 'AI Code & Spec Advisor', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-xl no-print">
      {/* Top Authority Micro-Bar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> ASTM E84 Flame Spread 0 / Smoke 0
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-sky-400 font-medium">
              <Award className="w-3.5 h-3.5" /> ASTM E136 100% Non-Combustible
            </span>
            <span className="hidden lg:inline text-slate-400">
              {isMetric
                ? 'RSI 0.70 / 25 mm (λ = 0.036 W/m·K) Continuous Thermal Barrier & NRC 0.95+'
                : 'R-4.00 / inch Continuous Thermal Barrier & NRC 0.95+'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Units:</span>
              <UnitToggle variant="header" />
            </div>
            <span className="text-slate-700">|</span>
            <button
              onClick={onOpenRegisterModal}
              className="text-xs text-slate-300 hover:text-white transition-colors underline-offset-4 hover:underline hidden sm:inline"
            >
              Are you an Insulator? List Your Business
            </button>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <button
              onClick={onOpenQuoteModal}
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium text-xs"
            >
              <PhoneCall className="w-3 h-3" /> Request Project Bids
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Authority Title */}
          <div
            onClick={() => setActiveTab('guide')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Shield className="w-6 h-6 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                  MONOGLASS<span className="text-sky-400">INSULATION</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  AUTHORITY GUIDE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Technical Specification & Certified Applicator Directory
              </p>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex items-center gap-2.5">
            {onOpenPrintPreview && (
              <button
                id="header-print-preview-btn"
                onClick={onOpenPrintPreview}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-sm font-medium border border-slate-700 transition-colors"
                title="Preview Paper & PDF Submittal layout on screen"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Print Preview</span>
              </button>
            )}

            <button
              id="header-print-guide-btn"
              onClick={() => window.print()}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
              title="Print Technical Guide / Save as PDF"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Print</span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
            >
              <Search className="w-4 h-4 text-sky-400" />
              <span>Find Insulators</span>
            </button>

            <button
              onClick={onOpenQuoteModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold shadow-md shadow-sky-500/25 transition-all transform active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Get Contractor Bids</span>
            </button>
          </div>
        </div>


        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 py-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      isActive
                        ? 'bg-sky-500/30 text-sky-200'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

