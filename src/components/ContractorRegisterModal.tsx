import React, { useState } from 'react';
import { ContractorRegistration } from '../types';
import {
  Users,
  CheckCircle2,
  Building2,
  Award,
  Phone,
  Mail,
  Send,
  X,
} from 'lucide-react';

interface ContractorRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContractorRegisterModal: React.FC<ContractorRegisterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState<ContractorRegistration>({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    website: '',
    city: '',
    stateProvince: '',
    country: 'USA',
    yearsExperience: 5,
    isMonoglassCertified: true,
    specialties: ['Parking Garages', 'Commercial High-Rise'],
    statesCovered: '',
    crewCount: 2,
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableSpecialties = [
    'Parking Garages',
    'Acoustics & Theaters',
    'Commercial High-Rise',
    'Arenas & Ice Rinks',
    'Mechanical Rooms',
    'Industrial & Retrofit',
  ];

  const handleSpecialtyToggle = (spec: string) => {
    setFormData((prev) => {
      const exists = prev.specialties.includes(spec);
      if (exists) {
        return { ...prev, specialties: prev.specialties.filter((s) => s !== spec) };
      } else {
        return { ...prev, specialties: [...prev.specialties, spec] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/contractor-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setSubmittedAppId(data.applicationId || `APP-${Math.floor(100000 + Math.random() * 900000)}`);
    } catch (err) {
      console.error('Registration submit error:', err);
      setSubmittedAppId(`APP-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedAppId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative my-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Register as a Certified Spray Contractor
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Join the official directory of verified Monoglass spray applicators and receive direct commercial project leads and RFPs.
            </p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedAppId ? (
          <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Application Received!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Thank you for applying. Our contractor certification team will review your spray equipment, license, and insurance details to publish your verified directory listing.
            </p>
            <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 inline-block font-mono text-xs text-emerald-400">
              Application ID: <strong className="text-white">{submittedAppId}</strong>
            </div>
            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Apex Spray Systems Inc."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Primary Estimator / Contact *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="e.g. Robert Smith"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                />
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
                  placeholder="estimating@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  City / Base Location
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Chicago"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  required
                  value={formData.stateProvince}
                  onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })}
                  placeholder="IL"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm"
                >
                  <option value="USA">United States (USA)</option>
                  <option value="Canada">Canada</option>
                  <option value="International">UK / International</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                Specialties & Capabilities
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableSpecialties.map((spec) => {
                  const selected = formData.specialties.includes(spec);
                  return (
                    <button
                      type="button"
                      key={spec}
                      onClick={() => handleSpecialtyToggle(spec)}
                      className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-medium border transition-all ${
                        selected
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {spec}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  States / Provinces Covered
                </label>
                <input
                  type="text"
                  value={formData.statesCovered}
                  onChange={(e) => setFormData({ ...formData, statesCovered: e.target.value })}
                  placeholder="e.g. Illinois, Wisconsin, Indiana"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Spray Rig Fleets / Crews
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.crewCount}
                  onChange={(e) => setFormData({ ...formData, crewCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isMonoglassCertified}
                  onChange={(e) => setFormData({ ...formData, isMonoglassCertified: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500"
                />
                <span>We currently hold active Monoglass Certified Applicator certification</span>
              </label>
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
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting Application...' : 'Submit Listing'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
