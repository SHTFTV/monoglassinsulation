import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Header } from './components/Header';
import { TechGuideView } from './components/TechGuideView';
import { ContractorDirectoryView } from './components/ContractorDirectoryView';
import { CalculatorView } from './components/CalculatorView';
import { ComparisonView } from './components/ComparisonView';
import { SpecBuilderView } from './components/SpecBuilderView';
import { CaseStudiesView } from './components/CaseStudiesView';
import { ProjectScheduleEstimator } from './components/ProjectScheduleEstimator';
import { AiAdvisorView } from './components/AiAdvisorView';
import { FaqView } from './components/FaqView';
import { ProjectEstimatorView } from './components/ProjectEstimatorView';
import { ProjectCostEstimator } from './components/ProjectCostEstimator';
import { ProjectTimelineCalendar } from './components/ProjectTimelineCalendar';
import { ProjectQuoteModal } from './components/ProjectQuoteModal';
import { ContractorRegisterModal } from './components/ContractorRegisterModal';
import { FloatingPrintButton } from './components/FloatingPrintButton';
import { PrintPreviewBar } from './components/PrintPreviewBar';
import { useSettings } from './context/SettingsContext';
import { Contractor } from './types';
import {
  Shield,
  Award,
  PhoneCall,
  Mail,
  MapPin,
  ExternalLink,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const { getEffectiveWatermark } = useSettings();
  const [activeTab, setActiveTab] = useState<string>('guide');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedContractorForQuote, setSelectedContractorForQuote] = useState<Contractor | null>(null);
  const [currentAppUrl, setCurrentAppUrl] = useState<string>('https://monoglassinsulation.com');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showPreviewGuides, setShowPreviewGuides] = useState(true);
  const [initialEstimateDetails, setInitialEstimateDetails] = useState<{
    projectName?: string;
    squareFootage: number;
    substrate: string;
    thickness: number;
    rValue: number;
    nrc: number;
    bags: number;
    adhesiveGallons: number;
    siteConditions?: string;
    notes?: string;
  } | null>(null);

  const [importedCalculatorData, setImportedCalculatorData] = useState<{
    areaInput: number;
    substrateType: string;
    targetThicknessInches: number;
    targetRValue: number;
    unitSystem: 'imperial' | 'metric';
  } | null>(null);

  const getDocType = (): 'estimate' | 'spec' | 'technical' | 'comparison' => {
    if (activeTab === 'calculator' || activeTab === 'estimator' || activeTab === 'cost-estimator' || activeTab === 'schedule' || activeTab === 'calendar') return 'estimate';
    if (activeTab === 'spec-builder') return 'spec';
    if (activeTab === 'comparison') return 'comparison';
    return 'technical';
  };

  const effectiveWatermark = getEffectiveWatermark(getDocType());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.href) {
        setCurrentAppUrl(window.location.href);
      }

      // Check if URL has a shared project hash or query parameter
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('project=') || search.includes('share=') || search.includes('p=')) {
        setActiveTab('estimator');
      }
    }
  }, []);

  const handleSelectContractorForQuote = (contractor: Contractor) => {
    setSelectedContractorForQuote(contractor);
    setIsQuoteModalOpen(true);
  };

  const handleSendEstimateToQuote = (details: {
    projectName?: string;
    squareFootage: number;
    substrate: string;
    thickness: number;
    rValue: number;
    nrc: number;
    bags: number;
    adhesiveGallons: number;
    siteConditions?: string;
    notes?: string;
  }) => {
    setInitialEstimateDetails(details);
    setSelectedContractorForQuote(null);
    setIsQuoteModalOpen(true);
  };

  const handleAddToProjectEstimator = (data: {
    areaInput: number;
    substrateType: string;
    targetThicknessInches: number;
    targetRValue: number;
    unitSystem: 'imperial' | 'metric';
  }) => {
    setImportedCalculatorData(data);
    setActiveTab('estimator');
  };

  const renderTabContent = () => (
    <>
      {activeTab === 'guide' && (
        <TechGuideView
          onNavigateToCalculator={() => setActiveTab('calculator')}
          onNavigateToContractors={() => setActiveTab('directory')}
          onNavigateToSpecBuilder={() => setActiveTab('spec-builder')}
          onOpenPrintPreview={() => setIsPreviewMode(true)}
        />
      )}

      {activeTab === 'faqs' && (
        <FaqView
          onNavigateToCalculator={() => setActiveTab('calculator')}
          onNavigateToSpecBuilder={() => setActiveTab('spec-builder')}
          onNavigateToContractors={() => setActiveTab('directory')}
        />
      )}

      {activeTab === 'directory' && (
        <ContractorDirectoryView
          onSelectContractorForQuote={handleSelectContractorForQuote}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        />
      )}

      {activeTab === 'calculator' && (
        <CalculatorView
          onSendEstimateToQuote={handleSendEstimateToQuote}
          onAddToProjectEstimator={handleAddToProjectEstimator}
          onNavigateToScheduleEstimator={(data) => {
            setActiveTab('schedule');
          }}
        />
      )}

      {activeTab === 'estimator' && (
        <ProjectEstimatorView
          onSendProjectToQuote={handleSendEstimateToQuote}
          importedCalculatorData={importedCalculatorData}
          onClearImportedData={() => setImportedCalculatorData(null)}
          onNavigateToCostEstimator={() => setActiveTab('cost-estimator')}
        />
      )}

      {activeTab === 'cost-estimator' && (
        <ProjectCostEstimator
          onSendToQuote={handleSendEstimateToQuote}
          onNavigateToMultiRoom={() => setActiveTab('estimator')}
          onNavigateToCalculator={() => setActiveTab('calculator')}
        />
      )}

      {activeTab === 'schedule' && (
        <ProjectScheduleEstimator
          onSendProjectToQuote={handleSendEstimateToQuote}
          onNavigateToCalculator={(data) => {
            setActiveTab('calculator');
          }}
          onNavigateToEstimator={(data) => {
            setImportedCalculatorData({
              areaInput: data.areaInput,
              substrateType: data.substrateType,
              targetThicknessInches: data.targetThicknessInches,
              targetRValue: data.targetRValue,
              unitSystem: data.unitSystem,
            });
            setActiveTab('estimator');
          }}
        />
      )}

      {activeTab === 'calendar' && (
        <ProjectTimelineCalendar
          onNavigateToScheduleEstimator={() => setActiveTab('schedule')}
          onSendToQuote={handleSendEstimateToQuote}
        />
      )}

      {activeTab === 'comparison' && <ComparisonView />}

      {activeTab === 'spec-builder' && (
        <SpecBuilderView onOpenPrintPreview={() => setIsPreviewMode(true)} />
      )}

      {activeTab === 'case-studies' && (
        <CaseStudiesView
          onFindContractors={() => setActiveTab('directory')}
          onRequestBid={(caseStudy) => {
            if (caseStudy) {
              setInitialEstimateDetails({
                projectName: `${caseStudy.title} - Scope Inquiry`,
                squareFootage: caseStudy.squareFootage,
                substrate: caseStudy.substrate,
                thickness: caseStudy.thicknessInches || 3.5,
                rValue: caseStudy.rValueNum || 14.0,
                nrc: caseStudy.nrcNum || 0.95,
                bags: Math.ceil((caseStudy.squareFootage * (caseStudy.thicknessInches || 3.5)) / 115),
                adhesiveGallons: Math.ceil(
                  ((caseStudy.squareFootage * (caseStudy.thicknessInches || 3.5)) / 115) * 0.75
                ),
                siteConditions: `Referencing Case Study: ${caseStudy.title} (${caseStudy.location}). Category: ${caseStudy.category}. Finish: ${caseStudy.finishType}.`,
                notes: `Substrate: ${caseStudy.substrate}. Documented Performance: ${caseStudy.rValueAchieved}, ${caseStudy.nrcAchieved}.`,
              });
            } else {
              setInitialEstimateDetails(null);
            }
            setSelectedContractorForQuote(null);
            setIsQuoteModalOpen(true);
          }}
          onNavigateToCalculator={() => {
            setActiveTab('calculator');
          }}
          onNavigateToEstimator={(caseStudy) => {
            setImportedCalculatorData({
              areaInput: caseStudy.squareFootage,
              substrateType:
                caseStudy.substrate.includes('Fluted') || caseStudy.substrate.includes('Deck')
                  ? 'fluted-deck-1.5'
                  : caseStudy.substrate.includes('Joist')
                  ? 'bar-joists'
                  : 'flat-concrete',
              targetThicknessInches: caseStudy.thicknessInches || 3.5,
              targetRValue: caseStudy.rValueNum || 14.0,
              unitSystem: 'imperial',
            });
            setActiveTab('estimator');
          }}
        />
      )}

      {activeTab === 'advisor' && <AiAdvisorView />}
    </>
  );

  const renderPrintQrFooter = () => (
    <div className="flex items-center justify-between gap-6">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-900 shrink-0" />
          <span className="font-black text-sm tracking-tight text-slate-900 uppercase">
            Monoglass® Spray-Applied Glass Fiber Insulation
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
            CSI 07 21 29 / 09 81 00
          </span>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-900">
            Mobile Access & Interactive Architectural Tools:
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            Scan this QR code with any smartphone camera to access the live Monoglass web app. Calculate custom R-values and acoustic NRC ratings, locate certified spray applicators, request project bids, and generate downloadable CSI 3-part specifications.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Direct Link:</span>
          <span className="text-[11px] font-mono font-bold text-slate-900 underline break-all">
            {currentAppUrl}
          </span>
        </div>

        <div className="text-[9.5pt] text-slate-500 pt-1 border-t border-slate-300 mt-2 flex flex-wrap items-center justify-between gap-2">
          <span>ASTM E84 Class A (0/0) • ASTM E136 Non-Combustible • R-4.00/in</span>
          <span>Document generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* QR Code Container */}
      <div className="flex flex-col items-center justify-center p-2.5 bg-white border-2 border-slate-900 rounded-lg shrink-0 text-center">
        <QRCodeSVG
          value={currentAppUrl}
          size={88}
          level="M"
          fgColor="#0f172a"
          bgColor="#ffffff"
          includeMargin={false}
        />
        <span className="text-[8.5pt] font-black text-slate-900 uppercase tracking-wider mt-1.5">
          Scan for Mobile
        </span>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isPreviewMode ? 'print-preview-active bg-slate-950/90' : 'bg-slate-950'} text-slate-100 font-sans selection:bg-sky-500 selection:text-slate-950 flex flex-col transition-colors duration-200`}>
      {/* Print Preview Top Banner (When active) */}
      {isPreviewMode && (
        <PrintPreviewBar
          onClose={() => setIsPreviewMode(false)}
          onPrint={() => window.print()}
          showGuides={showPreviewGuides}
          onToggleGuides={() => setShowPreviewGuides(!showPreviewGuides)}
          activeTab={activeTab}
        />
      )}

      {/* Header (Hidden in native print and print preview) */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        onOpenQuoteModal={() => {
          setSelectedContractorForQuote(null);
          setIsQuoteModalOpen(true);
        }}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenPrintPreview={() => setIsPreviewMode(true)}
      />

      {/* Main Content Area: Standard vs Print Preview Sheet */}
      {isPreviewMode ? (
        <div className="print-preview-container w-full px-4 py-6 flex-1">
          <div
            className={`print-preview-sheet max-w-4xl mx-auto transition-all relative ${
              showPreviewGuides ? 'show-paper-guides' : ''
            }`}
          >
            {/* Visual watermark overlay for preview sheet */}
            {effectiveWatermark && (
              <div
                className="watermark-overlay absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-20"
                aria-hidden="true"
              >
                <span className="transform -rotate-30 text-4xl sm:text-6xl md:text-7xl font-black text-slate-400/[0.07] tracking-widest uppercase whitespace-nowrap">
                  {effectiveWatermark}
                </span>
              </div>
            )}

            {renderTabContent()}

            {/* Print Footer Preview */}
            <div className="print-qr-footer mt-8">
              {renderPrintQrFooter()}
            </div>
          </div>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative">
          {/* Print media watermark layer */}
          {effectiveWatermark && (
            <div className="watermark-print-layer hidden print:flex fixed inset-0 items-center justify-center pointer-events-none select-none z-50">
              <span className="transform -rotate-35 text-6xl font-black text-slate-900/[0.08] tracking-widest uppercase whitespace-nowrap">
                {effectiveWatermark}
              </span>
            </div>
          )}
          {renderTabContent()}
        </main>
      )}

      {/* Authority Footer (Screen mode) */}
      <footer id="app-footer" className="mt-auto">
        {/* Standard Screen Footer (Hidden on Print & Preview) */}
        <div id="screen-footer-content" className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand / Mission */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-base text-white tracking-tight">
                    MONOGLASS<span className="text-sky-400">INSULATION</span>
                  </span>
                </div>
                <p className="leading-relaxed">
                  The definitive technical resource and certified spray contractor locator for Monoglass spray-applied glass fiber thermal and acoustical insulation.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ASTM E84 0/0 • ASTM E136 Non-Combustible
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-2.5">
                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Technical Guide & Tools
                </div>
                <ul className="space-y-1.5">
                  <li>
                    <button onClick={() => setActiveTab('guide')} className="hover:text-white transition-colors">
                      Technical Specifications & Testing
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveTab('calculator')} className="hover:text-white transition-colors">
                      R-Value & Acoustic Calculator
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveTab('spec-builder')} className="hover:text-white transition-colors">
                      CSI Section 07 21 29 3-Part Spec
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveTab('comparison')} className="hover:text-white transition-colors">
                      Monoglass vs Spray Foam & Cellulose
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveTab('case-studies')} className="hover:text-white transition-colors">
                      Architectural Case Histories
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsPreviewMode(true)}
                      className="hover:text-sky-400 transition-colors text-sky-400 font-medium"
                    >
                      Print Preview Mode (Paper Simulation)
                    </button>
                  </li>
                </ul>
              </div>

              {/* Contractor Network */}
              <div className="space-y-2.5">
                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Contractors & Bidding
                </div>
                <ul className="space-y-1.5">
                  <li>
                    <button onClick={() => setActiveTab('directory')} className="hover:text-white transition-colors">
                      Find Certified Spray Applicators
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setIsQuoteModalOpen(true)} className="hover:text-white transition-colors">
                      Request Project Bids / RFP
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setIsRegisterModalOpen(true)} className="hover:text-white transition-colors">
                      Contractor Directory Registration
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveTab('advisor')} className="hover:text-white transition-colors text-sky-400">
                      AI Building Code & Spec Advisor
                    </button>
                  </li>
                </ul>
              </div>

              {/* Standards & Certifications */}
              <div className="space-y-2.5">
                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Compliance & Standards
                </div>
                <div className="space-y-1 text-[11px]">
                  <div>• ASTM C518: Thermal Transmission (R-4.00/in)</div>
                  <div>• ASTM E84: Flame Spread 0 / Smoke 0</div>
                  <div>• ASTM E136: Non-Combustibility</div>
                  <div>• ASTM C423: Sound Absorption (NRC 0.95+)</div>
                  <div>• ASTM E736: Bond Adhesion (&gt;200 lbs/sq ft)</div>
                  <div>• ASTM E859: Zero Air Erosion at 10,000 FPM</div>
                  <div>• CAN/ULC S102 Surface Burning</div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
              <div>
                © {new Date().getFullYear()} Monoglass Insulation Authority Directory. Technical guide for architectural and construction professionals.
              </div>
              <div className="flex items-center gap-4">
                <span>CSI MasterFormat 07 21 29 / 09 81 00</span>
                <span>•</span>
                <span>All trademarks belong to their respective owners</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Print-Only Footer Div with QR Code for Native Browser Print */}
        <div
          id="print-qr-code-footer"
          className="print-only hidden print:block print-qr-footer"
        >
          {renderPrintQrFooter()}
        </div>
      </footer>

      {/* Floating Print Technical Guide Action Button (Screen Only) */}
      <FloatingPrintButton
        activeTab={activeTab}
        onOpenPrintPreview={() => setIsPreviewMode(true)}
        isPrintPreviewActive={isPreviewMode}
      />

      {/* Modals */}
      <ProjectQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        selectedContractor={selectedContractorForQuote}
        initialEstimateDetails={initialEstimateDetails}
      />

      <ContractorRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
}

