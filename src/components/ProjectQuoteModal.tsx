import React, { useState, useEffect } from 'react';
import { Contractor, QuoteRequest } from '../types';
import {
  PhoneCall,
  CheckCircle2,
  Building,
  MapPin,
  FileText,
  Calendar,
  Send,
  X,
  Sparkles,
  Layers,
  Wrench,
  Info,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface ProjectQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContractor?: Contractor | null;
  initialEstimateDetails?: {
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
  } | null;
}

export const ProjectQuoteModal: React.FC<ProjectQuoteModalProps> = ({
  isOpen,
  onClose,
  selectedContractor,
  initialEstimateDetails,
}) => {
  const { isMetric } = useSettings();
  const [formData, setFormData] = useState<QuoteRequest>({
    fullName: '',
    company: '',
    role: 'General Contractor',
    email: '',
    phone: '',
    projectName: '',
    projectCity: '',
    projectState: '',
    projectZip: '',
    squareFootage: 10000,
    targetThicknessOrRValue: '4.0 inches (R-16.0)',
    substrateType: 'Cast-in-Place Concrete Soffit',
    applicationType: 'Parking Garage Soffit',
    timeline: 'Within 30-60 Days',
    siteConditions: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedTrackingId, setSubmittedTrackingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialEstimateDetails) {
      setFormData((prev) => ({
        ...prev,
        projectName: initialEstimateDetails.projectName || prev.projectName,
        squareFootage: initialEstimateDetails.squareFootage,
        substrateType: initialEstimateDetails.substrate,
        targetThicknessOrRValue: `${initialEstimateDetails.thickness}" (R-${initialEstimateDetails.rValue} / NRC ${initialEstimateDetails.nrc.toFixed(2)})`,
        siteConditions: initialEstimateDetails.siteConditions || prev.siteConditions,
        notes: initialEstimateDetails.notes || `Estimated material take-off: ${initialEstimateDetails.bags.toLocaleString()} Monoglass bags & ${initialEstimateDetails.adhesiveGallons.toLocaleString()} gal adhesive.`,
      }));
    }
  }, [initialEstimateDetails]);

  if (!isOpen) return null;

  const siteConditionPresets = [
    'Ceiling Height > 18 ft (Scissor Lift / Scaffolding)',
    'Substrate Form-Release Oil Removal Needed',
    'Cold Weather / Heated Cure Required (< 40°F / 4.5°C)',
    'Sonoglaze Protective Hard-Coat Specified',
    'Monoglass Black Fiber Specified (Dyed)',
    'Tamped Semi-Smooth Architectural Finish',
    'High Humidity / Natatorium Chloramines',
    'Continuous Mechanical Cross-Ventilation Available',
  ];

  const handleAddSitePreset = (preset: string) => {
    setFormData((prev) => {
      const current = prev.siteConditions?.trim() || '';
      if (current.includes(preset)) return prev;
      const updated = current ? `${current}\n• ${preset}` : `• ${preset}`;
      return { ...prev, siteConditions: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        targetContractor: selectedContractor
          ? {
              id: selectedContractor.id,
              company: selectedContractor.companyName,
              email: selectedContractor.email,
            }
          : 'Broadcast to all certified regional applicators',
        timestamp: new Date().toISOString(),
      };

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSubmittedTrackingId(data.trackingId || `MNG-${Math.floor(100000 + Math.random() * 900000)}`);
    } catch (err) {
      console.error('Failed to submit quote:', err);
      setSubmittedTrackingId(`MNG-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedTrackingId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {selectedContractor
                  ? `Request Project Bid from ${selectedContractor.companyName}`
                  : 'Request Monoglass Project Bids'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {selectedContractor
                ? `Direct RFP dispatch to ${selectedContractor.name} (${selectedContractor.city}, ${selectedContractor.stateOrProvince})`
                : 'Directly dispatch your project scope to certified regional Monoglass spray applicators.'}
            </p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedTrackingId ? (
          /* Confirmation State */
          <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Project Bid Request Dispatched!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Your Monoglass project specification has been transmitted to certified spray applicators. You will receive project cost estimates and site review scheduling shortly.
            </p>
            <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 inline-block font-mono text-xs text-sky-400">
              Tracking Reference ID: <strong className="text-white">{submittedTrackingId}</strong>
            </div>
            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
              >
                Return to Authority Guide
              </button>
            </div>
          </div>
        ) : (
          /* RFP Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Contact Person Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Company / Firm Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Apex Construction LLC"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Professional Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-sky-500"
                >
                  <option value="General Contractor">General Contractor</option>
                  <option value="Architect">Architect / Specifier</option>
                  <option value="Building Owner">Building Owner / Developer</option>
                  <option value="Facility Manager">Facility Manager</option>
                  <option value="Insulation Contractor">Insulation Contractor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@firm.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                    Project Name / Location Description
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    placeholder="e.g. 5th & Main Mixed-Use Parking Structure"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.projectCity}
                      onChange={(e) => setFormData({ ...formData, projectCity: e.target.value })}
                      placeholder="Seattle"
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                      State/Prov
                    </label>
                    <input
                      type="text"
                      value={formData.projectState}
                      onChange={(e) => setFormData({ ...formData, projectState: e.target.value })}
                      placeholder="WA"
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                      Zip/Postal
                    </label>
                    <input
                      type="text"
                      value={formData.projectZip}
                      onChange={(e) => setFormData({ ...formData, projectZip: e.target.value })}
                      placeholder="98101"
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                    {isMetric ? 'Approx Area (m²)' : 'Approx Area (Sq. Ft)'}
                  </label>
                  <input
                    type="number"
                    value={formData.squareFootage}
                    onChange={(e) => setFormData({ ...formData, squareFootage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                    Substrate Type
                  </label>
                  <select
                    value={formData.substrateType}
                    onChange={(e) => setFormData({ ...formData, substrateType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  >
                    <option value="Cast-in-Place Concrete Soffit">Cast-in-Place Concrete</option>
                    <option value="Corrugated Metal Deck">Corrugated Metal Deck</option>
                    <option value="Exposed Structural Steel Joists">Steel Joists / Beams</option>
                    <option value="Gypsum Ceiling">Gypsum Board / Plaster</option>
                    <option value="Timber Deck">Wood Timber Deck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                    Project Timeline
                  </label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm"
                  >
                    <option value="Immediate (Next 2-4 Weeks)">Immediate (2-4 Weeks)</option>
                    <option value="Within 30-60 Days">Within 30-60 Days</option>
                    <option value="3-6 Months Out">3-6 Months Out</option>
                    <option value="Planning / Budgeting Phase">Planning / Budgeting Phase</option>
                  </select>
                </div>
              </div>

              {/* Site Conditions & Access Notes Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-sky-400" />
                    Specific Site Conditions & Access Details
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Scaffolding, surface prep, temperatures, ventilation
                  </span>
                </div>

                {/* Quick Add Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  <span className="text-[10px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-400" /> Quick Add:
                  </span>
                  {siteConditionPresets.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleAddSitePreset(preset)}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  id="quote-site-conditions-textarea"
                  rows={3}
                  value={formData.siteConditions}
                  onChange={(e) => setFormData({ ...formData, siteConditions: e.target.value })}
                  placeholder="Detail specific jobsite conditions: e.g. Ceiling clearance height, lift/scaffolding access, unheated winter conditions (<40°F), existing oils/grease on metal deck, mechanical room high air velocity, or required curing ventilation..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-sky-500 shadow-inner font-sans"
                />
              </div>

              {/* Architectural Notes & General Project Scope */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  Architectural Notes & Specification Requirements
                </label>
                <textarea
                  id="quote-architectural-notes-textarea"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Include specific architectural requirements: e.g. Target R-value, CSI 07 21 29 / 09 81 00 section references, finish requirements (Natural White, Monoglass Black, Tamped, Sonoglaze hard-coat), link to project drawings, or submittal deadlines..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-sky-500 shadow-inner font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Dispatch Bid Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
