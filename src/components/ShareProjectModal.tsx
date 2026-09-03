import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Share2,
  Copy,
  Check,
  X,
  Link,
  QrCode,
  Mail,
  MessageSquare,
  Users,
  Eye,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Download,
  FileCode,
  CheckCircle2,
  Smartphone,
  Layers,
} from 'lucide-react';
import { MultiRoomProject, ConsolidatedBom } from '../types';
import {
  buildCompressedShareUrl,
  createServerShareLink,
  generateShareDigest,
} from '../utils/shareUtils';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MultiRoomProject;
  bom: ConsolidatedBom;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  bom,
}) => {
  const [sharedBy, setSharedBy] = useState<string>('');
  const [accessMode, setAccessMode] = useState<'collaborative' | 'review' | 'subcontractor'>('collaborative');
  const [activeTab, setActiveTab] = useState<'link' | 'qrcode' | 'messages' | 'json'>('link');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  
  // Link state
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [isGeneratingShortUrl, setIsGeneratingShortUrl] = useState<boolean>(false);

  // Direct self-contained compressed URL
  const directCompressedUrl = useMemo(() => {
    if (!isOpen) return '';
    return buildCompressedShareUrl(project, {
      sharedBy: sharedBy.trim() || undefined,
      accessMode,
    });
  }, [isOpen, project, sharedBy, accessMode]);

  // Try creating a short server link whenever modal opens or project/author changes
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setIsGeneratingShortUrl(true);
      createServerShareLink(project, sharedBy.trim() || undefined, accessMode)
        .then((result) => {
          if (isMounted && result) {
            setShortUrl(result.fullUrl);
          }
        })
        .finally(() => {
          if (isMounted) setIsGeneratingShortUrl(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, project, sharedBy, accessMode]);

  const activeShareUrl = shortUrl || directCompressedUrl;

  const digests = useMemo(() => {
    return generateShareDigest(project, activeShareUrl, sharedBy);
  }, [project, activeShareUrl, sharedBy]);

  if (!isOpen) return null;

  const handleCopy = async (text: string, typeKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(typeKey);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error('Clipboard write failed:', err);
    }
  };

  const handleDownloadQrPng = () => {
    const svgElement = document.getElementById('project-share-qrcode-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 40, 40, 520, 520);
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${(project.name || 'Project').replace(/\s+/g, '_')}_QR_Share.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-project-title"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 font-mono">
                  Team Collaboration & Multi-User Sharing
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live Takeoff Sync
                </span>
              </div>
              <h3 id="share-project-title" className="text-xl font-bold text-white mt-0.5">
                Share Project Estimate: {project.name || 'Untitled Takeoff'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generate a unique link to send to architects, project managers, and spray contractors. Anyone with this link can instantly open the exact multi-room takeoff.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Scope Quick Badge Bar */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <strong>{project.rooms.filter((r) => r.enabled).length}</strong> Active Rooms
            </span>
            <span className="text-slate-600">•</span>
            <span>
              <strong>{project.unitSystem === 'metric' ? `${bom.totalEffectiveAreaSqM.toLocaleString()} m²` : `${bom.totalEffectiveAreaSqFt.toLocaleString()} sq ft`}</strong> Surface Area
            </span>
            <span className="text-slate-600">•</span>
            <span>
              <strong>{bom.totalBagsFiber.toLocaleString()}</strong> Monoglass Bags
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300 font-medium">
              {project.unitSystem === 'metric' ? `RSI ${bom.blendedRsi.toFixed(2)}` : `R-${bom.blendedRValue.toFixed(1)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Contributor:</span>
            <input
              type="text"
              value={sharedBy}
              onChange={(e) => setSharedBy(e.target.value)}
              placeholder="Your name / firm (optional)"
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500 w-44 font-sans"
            />
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 pt-2 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'link'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Unique Shareable URL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qrcode')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'qrcode'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mobile QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'messages'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email & Slack Invite</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Project JSON</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto bg-slate-950/50 space-y-5">
          {/* TAB 1: SHARE URL */}
          {activeTab === 'link' && (
            <div className="space-y-5">
              {/* Sharing Mode Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Collaboration Mode & Recipient Intent
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccessMode('collaborative')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      accessMode === 'collaborative'
                        ? 'bg-sky-500/10 border-sky-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Edit3 className={`w-4 h-4 ${accessMode === 'collaborative' ? 'text-sky-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-200">Full Collaboration</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Recipients can edit areas, adjust substrate flutes, or fork the estimate.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccessMode('review')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      accessMode === 'review'
                        ? 'bg-sky-500/10 border-sky-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className={`w-4 h-4 ${accessMode === 'review' ? 'text-sky-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-200">Architect Review</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Optimized for client sign-off, spec compliance, and thermal review.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccessMode('subcontractor')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      accessMode === 'subcontractor'
                        ? 'bg-sky-500/10 border-sky-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className={`w-4 h-4 ${accessMode === 'subcontractor' ? 'text-sky-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-200">Subcontractor Bid</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Focuses on bag counts, adhesive pails, equipment days, and BOM totals.
                    </p>
                  </button>
                </div>
              </div>

              {/* URL Display Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Link className="w-4 h-4 text-sky-400" />
                    Shareable Web Link
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                    {shortUrl ? 'Short Server Link' : 'Direct Encoded Link'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeShareUrl}
                    className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sky-300 font-mono text-xs select-all focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(activeShareUrl, 'primary-link')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                      copiedType === 'primary-link'
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                        : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/25 active:scale-95'
                    }`}
                  >
                    {copiedType === 'primary-link' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Includes all rooms, substrate multipliers, R-values & custom notes.</span>
                  </div>
                  <a
                    href={activeShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Test Link in New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Direct Link Alternative if using Short Link */}
              {shortUrl && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="text-slate-400">
                    <span className="font-semibold text-slate-300">Self-Contained Offline Link:</span> For environments without network server access, you can also use the fully compressed hash URL.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(directCompressedUrl, 'direct-compressed')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs border border-slate-700 shrink-0 transition-colors"
                  >
                    {copiedType === 'direct-compressed' ? 'Copied Encoded URL!' : 'Copy Direct URL'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MOBILE QR CODE */}
          {activeTab === 'qrcode' && (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
              <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-slate-800">
                <QRCodeSVG
                  id="project-share-qrcode-svg"
                  value={activeShareUrl}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="max-w-sm space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  Scan to Open on Mobile or Tablet
                </h4>
                <p className="text-xs text-slate-400">
                  Ideal for superintendents, field estimators, and applicators on the jobsite. Point your camera at the QR code to load the takeoff.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(activeShareUrl, 'qr-url-copy')}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                >
                  {copiedType === 'qr-url-copy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'qr-url-copy' ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL & SLACK INVITES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {/* Email Template */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-sky-400" />
                    Formal Email Message Template
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:?subject=${encodeURIComponent(digests.emailSubject)}&body=${encodeURIComponent(digests.emailBody)}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Open Mail App</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(digests.emailBody, 'email-digest')}
                      className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      {copiedType === 'email-digest' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedType === 'email-digest' ? 'Copied' : 'Copy Email Body'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {digests.emailBody}
                </div>
              </div>

              {/* Slack / Teams Template */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    Slack / Microsoft Teams Snippet
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(digests.slackMarkdown, 'slack-digest')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
                  >
                    {copiedType === 'slack-digest' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedType === 'slack-digest' ? 'Copied' : 'Copy Slack Text'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                  {digests.slackMarkdown}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAW PROJECT JSON */}
          {activeTab === 'json' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  Project JSON Payload
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(project, null, 2), 'raw-json')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
                >
                  {copiedType === 'raw-json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'raw-json' ? 'Copied JSON' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto select-all">
                {JSON.stringify(project, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Recipients can load, fork, or export the project without requiring account logins.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
