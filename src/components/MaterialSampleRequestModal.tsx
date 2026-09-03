import React, { useState, useEffect } from 'react';
import {
  Package,
  X,
  Check,
  Sparkles,
  ShieldCheck,
  MapPin,
  Building2,
  User,
  Mail,
  Phone,
  Truck,
  Calendar,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  Trash2,
  Download,
} from 'lucide-react';
import { MaterialSampleRequest, SampleKitType } from '../types';

interface MaterialSampleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted?: (request: MaterialSampleRequest) => void;
  defaultProjectName?: string;
  defaultLocation?: string;
}

const SAMPLE_KITS: Array<{
  id: SampleKitType;
  title: string;
  badge: string;
  badgeColor: string;
  tagline: string;
  description: string;
  items: string[];
  recommendedFor: string;
}> = [
  {
    id: 'architect-master',
    title: 'Architect & Specifier Master Kit',
    badge: 'Most Popular',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    tagline: 'Comprehensive Physical Monoglass System Specimen Box',
    description:
      'Curated presentation box containing physical cured samples across all major Monoglass finishes, thicknesses, and hard-coat systems for architectural design reviews and client presentations.',
    items: [
      '2.0" (50mm) Monoglass Natural White Specimen (85% Light Reflectance)',
      '2.0" (50mm) Monoglass Black Charcoal Acoustic Matrix Specimen',
      'Sonoglaze Polymeric Hard-Coat Protective Skin Specimen Puck',
      'Direct-to-Galvanized Metal Deck Adhesion Puck',
      'Bound CSI Section 07 21 29 / 09 81 00 3-Part Master Specification Guide',
      'ASTM E84 (0/0) & ASTM E136 Non-Combustible Testing Laboratory Reports',
    ],
    recommendedFor: 'Architects, Specifiers, LEED AP Consultants, Interior Designers',
  },
  {
    id: 'acoustic-studio',
    title: 'Acoustic & Studio Design Kit',
    badge: 'NRC 0.95 - 1.00',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    tagline: 'Broadband Acoustic Absorption & Reverberation Control',
    description:
      'Engineered for recording studios, performing arts centers, broadcast stages, and high-reverberation open atriums where precise sound absorption and non-reflective finishes are paramount.',
    items: [
      '3.0" (75mm) Monoglass Black Matte Specimen (NRC 1.00 Acoustic Rating)',
      '2.5" (64mm) Tamped Smooth Natural White Specimen',
      'Sonoglaze Acoustic-Transparent Hard-Coat Specimen',
      'Broadband 125 Hz – 4000 Hz 1/3 Octave Band Sound Absorption Chart',
      'ASTM E859 High-Velocity Air Erosion Test Documentation',
    ],
    recommendedFor: 'Acousticians, Broadcast Engineers, Theater Designers, Worship Facilities',
  },
  {
    id: 'thermal-parkade',
    title: 'Parkade & Continuous Thermal Barrier Kit',
    badge: 'R-4.0 / Inch',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    tagline: 'Cold Soffit & Multi-Family Residential Thermal Breaks',
    description:
      'Physical specimens and documentation for underground unheated parkades beneath occupied residences, cantilevered podium soffits, and ASHRAE 90.1 energy code compliance.',
    items: [
      '4.5" (115mm) Monoglass White (R-18 Continuous Insulation Specimen)',
      'Post-Tensioned Concrete Direct-Adhesion Specimen (>200 lbs/sq ft bond)',
      'Stainless Steel Depth Pin Verification Calibration Gauge',
      'Parkade Soffit Energy Code Compliance Whitepaper (ASHRAE 90.1 / IBC C402)',
      'Condensation Risk & Dew Point Psychrometric Analysis Guidelines',
    ],
    recommendedFor: 'General Contractors, Structural Engineers, Envelope Consultants',
  },
  {
    id: 'sonoglaze-natatorium',
    title: 'Natatorium & Harsh Environment Kit',
    badge: 'Chloramine Shield',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    tagline: 'Indoor Aquatic Centers & High-Humidity Mechanical Plants',
    description:
      'Sample package featuring the Sonoglaze polymeric topcoat system engineered specifically to withstand chloramine pool vapors, warm condensation, and high humidity.',
    items: [
      '3.5" (88mm) Monoglass with Sonoglaze Factory Hard-Coat Skin (NRC 0.95)',
      'ASTM C1338 Zero-Mold / Fungal Defiance Certified Laboratory Summary',
      'Chloramine Chemical Exposure 5-Year Inspection Case Study',
      'Airless Spray Application & Topcoat Coverage Specification Sheet',
    ],
    recommendedFor: 'Aquatic Center Architects, Municipal Facilities, Natatorium Engineers',
  },
  {
    id: 'custom-selection',
    title: 'Custom Project-Specific Specimen Kit',
    badge: 'Tailored',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    tagline: 'Customized Sample Assembly for Complex Substrates',
    description:
      'Select individual custom thicknesses, specialty substrate mockups, and submittal bundles for unique project requirements.',
    items: [
      'Configurable thickness (1.0" to 5.0")',
      'Custom substrate mockups (Curved plaster, fluted steel, wood heavy timber)',
      'Complete CSI 3-Part Spec and Submittal USB Drive',
    ],
    recommendedFor: 'Custom Projects, Specialty Renovations & Complex Restorations',
  },
];

const LOCAL_STORAGE_KEY = 'monoglass_sample_requests';

export const MaterialSampleRequestModal: React.FC<MaterialSampleRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted,
  defaultProjectName = '',
  defaultLocation = '',
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [selectedKit, setSelectedKit] = useState<SampleKitType>('architect-master');
  const [includePhysicalBinders, setIncludePhysicalBinders] = useState(true);
  const [includeUsbDrive, setIncludeUsbDrive] = useState(true);

  // Form State
  const [projectName, setProjectName] = useState(defaultProjectName);
  const [projectLocation, setProjectLocation] = useState(defaultLocation);
  const [projectType, setProjectType] = useState('Commercial High-Rise / Parkade');
  const [estimatedSqFt, setEstimatedSqFt] = useState<string>('25000');

  const [recipientName, setRecipientName] = useState('');
  const [companyOrFirm, setCompanyOrFirm] = useState('');
  const [role, setRole] = useState<MaterialSampleRequest['role']>('Architect / Specifier');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [suiteOrApt, setSuiteOrApt] = useState('');
  const [city, setCity] = useState('');
  const [stateOrProvince, setStateOrProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState<'USA' | 'Canada' | 'International'>('USA');
  const [shippingNotes, setShippingNotes] = useState('');
  const [urgency, setUrgency] = useState<MaterialSampleRequest['urgency']>('Standard Ground (3-5 days)');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<MaterialSampleRequest | null>(null);
  const [savedRequests, setSavedRequests] = useState<MaterialSampleRequest[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load saved requests on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedRequests(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load sample requests from localStorage:', e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !companyOrFirm.trim() || !email.trim() || !streetAddress.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMsg('Please complete all required shipping contact fields marked with an asterisk (*).');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    const kitDef = SAMPLE_KITS.find((k) => k.id === selectedKit)!;
    const trackingNumber = `MGS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newRequest: MaterialSampleRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      trackingNumber,
      requestDate: new Date().toISOString(),
      status: 'Received',
      kitType: selectedKit,
      kitTitle: kitDef.title,
      requestedSpecimens: kitDef.items,
      includePhysicalBinders,
      includeUsbDrive,
      projectName: projectName.trim() || 'Unassigned Project',
      projectCity: projectLocation.trim() || city.trim(),
      projectStateOrProvince: stateOrProvince.trim(),
      projectType,
      estimatedSqFt: estimatedSqFt ? parseInt(estimatedSqFt, 10) : undefined,
      recipientName: recipientName.trim(),
      companyOrFirm: companyOrFirm.trim(),
      role,
      email: email.trim(),
      phone: phone.trim(),
      streetAddress: streetAddress.trim(),
      suiteOrApt: suiteOrApt.trim() || undefined,
      city: city.trim(),
      stateOrProvince: stateOrProvince.trim(),
      postalCode: postalCode.trim(),
      country,
      shippingNotes: shippingNotes.trim() || undefined,
      urgency,
    };

    setTimeout(() => {
      try {
        const updatedList = [newRequest, ...savedRequests];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
        setSavedRequests(updatedList);
        setSubmittedRequest(newRequest);
        if (onRequestSubmitted) {
          onRequestSubmitted(newRequest);
        }
      } catch (err) {
        console.error('Failed to save sample request to localStorage:', err);
      } finally {
        setIsSubmitting(false);
      }
    }, 600);
  };

  const handleDeleteRequest = (id: string) => {
    if (window.confirm('Remove this sample request record from your history?')) {
      const updated = savedRequests.filter((r) => r.id !== id);
      setSavedRequests(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const resetForm = () => {
    setSubmittedRequest(null);
    setRecipientName('');
    setEmail('');
    setPhone('');
    setStreetAddress('');
    setCity('');
    setPostalCode('');
    setErrorMsg(null);
  };

  const selectedKitDef = SAMPLE_KITS.find((k) => k.id === selectedKit)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Request Physical Monoglass Sample Kit
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Complimentary for AEC Pros
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical cured specimens, hard-coat pucks, and bound CSI 07 21 29 submittal binders delivered to your office or job site.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedRequests.length > 0 && (
              <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('request')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    activeTab === 'request'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  New Request
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>My Requests</span>
                  <span className="px-1.5 py-0.2 bg-slate-800 text-sky-400 text-[10px] font-mono rounded-full">
                    {savedRequests.length}
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* SUCCESS CONFIRMATION VIEW */}
          {submittedRequest ? (
            <div className="py-6 px-4 space-y-6 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-xl font-bold text-white">Sample Kit Request Dispatched!</h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Your physical Monoglass sample package has been queued for warehouse assembly. Tracking and shipping details have been securely logged in your local workspace.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 max-w-xl mx-auto text-left space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tracking Code</div>
                    <div className="text-sm font-mono font-bold text-sky-400">{submittedRequest.trackingNumber}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> {submittedRequest.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Kit Selected:</span>
                    <p className="font-bold text-white mt-0.5">{submittedRequest.kitTitle}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Recipient:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {submittedRequest.recipientName} ({submittedRequest.companyOrFirm})
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Destination:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {submittedRequest.streetAddress}
                      {submittedRequest.suiteOrApt ? `, ${submittedRequest.suiteOrApt}` : ''}, {submittedRequest.city},{' '}
                      {submittedRequest.stateOrProvince} {submittedRequest.postalCode} ({submittedRequest.country})
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Project Name:</span>
                    <p className="font-semibold text-white mt-0.5">{submittedRequest.projectName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Dispatch Speed:</span>
                    <p className="font-semibold text-sky-300 mt-0.5">{submittedRequest.urgency}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 mb-1.5">Package Contents:</div>
                  <ul className="space-y-1">
                    {submittedRequest.requestedSpecimens.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                >
                  Request Another Sample Kit
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
                >
                  Done
                </button>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            /* SAVED REQUESTS HISTORY TAB */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>Your Sample Kit Requests History</span>
                </h4>
                <button
                  onClick={() => setActiveTab('request')}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300"
                >
                  + Request New Kit
                </button>
              </div>

              {savedRequests.length === 0 ? (
                <div className="text-center py-12 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <Package className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No previous sample kit requests found in your local storage.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{req.kitTitle}</span>
                            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                              {req.trackingNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Project: <strong className="text-slate-200">{req.projectName}</strong> • {req.recipientName} ({req.companyOrFirm})
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            {req.status}
                          </span>
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-850">
                        <div>
                          <span className="text-slate-500">Destination:</span> {req.city}, {req.stateOrProvince}
                        </div>
                        <div>
                          <span className="text-slate-500">Requested:</span> {new Date(req.requestDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-slate-500">Speed:</span> {req.urgency}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* NEW SAMPLE REQUEST FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Select Sample Kit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-sky-400" />
                    <span>Step 1: Choose Sample Kit Type</span>
                  </label>
                  <span className="text-xs text-slate-400">All kits provided free of charge</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SAMPLE_KITS.map((kit) => {
                    const isSelected = selectedKit === kit.id;
                    return (
                      <div
                        key={kit.id}
                        onClick={() => setSelectedKit(kit.id)}
                        className={`border rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500/50 shadow-lg shadow-sky-500/10'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${kit.badgeColor}`}>
                              {kit.badge}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                          </div>
                          <h4 className="text-xs font-bold text-white leading-snug">{kit.title}</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{kit.tagline}</p>
                        </div>

                        <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                          {kit.items.length} specimens & documentation
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Kit Preview Details */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Included in {selectedKitDef.title}:</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Best for: {selectedKitDef.recommendedFor}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  {selectedKitDef.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                      <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span className="text-[11px]">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Optional Inclusions */}
                <div className="pt-3 border-t border-slate-850 flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={includePhysicalBinders}
                      onChange={(e) => setIncludePhysicalBinders(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20"
                    />
                    <span>Include 3-Ring CSI Master Binder</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeUsbDrive}
                      onChange={(e) => setIncludeUsbDrive(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20"
                    />
                    <span>Include CAD/BIM Detail Flash Drive</span>
                  </label>
                </div>
              </div>

              {/* Step 2: Project Information */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Step 2: Project Specifications</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. West End Towers Soffit"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Project Location / City</label>
                    <input
                      type="text"
                      value={projectLocation}
                      onChange={(e) => setProjectLocation(e.target.value)}
                      placeholder="e.g. Seattle, WA"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Building Application</label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    >
                      <option value="Commercial High-Rise / Parkade">Underground Parkade / Soffit</option>
                      <option value="Acoustic Studio / Theater">Theater / Broadcast Soundstage</option>
                      <option value="Sports Arena / Ice Rink">Arena / Ice Rink / Natatorium</option>
                      <option value="Industrial Warehouse / Plant">Industrial Facility / Warehouse</option>
                      <option value="Curtain Wall Spandrel">Shadow-Box Glass Spandrel</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3: Shipping & Contact Details */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Step 3: Shipping & Contact Recipient</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Recipient Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Company / Architecture Firm <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyOrFirm}
                      onChange={(e) => setCompanyOrFirm(e.target.value)}
                      placeholder="e.g. Perkins & Will Architects"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Your Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    >
                      <option value="Architect / Specifier">Architect / Specifier</option>
                      <option value="General Contractor">General Contractor</option>
                      <option value="Acoustic Consultant">Acoustic Consultant</option>
                      <option value="Building Owner / Developer">Building Owner / Developer</option>
                      <option value="Insulation Contractor">Insulation Contractor</option>
                      <option value="Other">Other Design Professional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah@firm.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 019-2834"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    >
                      <option value="USA">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="International">UK & International</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Street Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="1200 4th Avenue, Suite 1800"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Suite / Floor / Dept</label>
                    <input
                      type="text"
                      value={suiteOrApt}
                      onChange={(e) => setSuiteOrApt(e.target.value)}
                      placeholder="Attn: Architecture Library"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      City <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Seattle"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      State / Province <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={stateOrProvince}
                      onChange={(e) => setStateOrProvince(e.target.value)}
                      placeholder="WA"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Postal / ZIP Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="98101"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Delivery Urgency</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    >
                      <option value="Standard Ground (3-5 days)">Standard Ground (3-5 business days) - Free</option>
                      <option value="Priority Express (1-2 days)">Priority Express (1-2 business days) - Free for Specifiers</option>
                      <option value="Urgent Bid Submittal (Next Day)">Urgent Bid Submittal (Next Day Morning)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Special Shipping Notes</label>
                    <input
                      type="text"
                      value={shippingNotes}
                      onChange={(e) => setShippingNotes(e.target.value)}
                      placeholder="e.g. Leave with building front desk"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Submit */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Processing Request...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      <span>Submit Sample Kit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
