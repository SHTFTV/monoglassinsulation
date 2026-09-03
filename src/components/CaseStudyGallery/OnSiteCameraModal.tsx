import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CaseStudy, CaseStudyImage } from '../../types';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  MapPin,
  Building2,
  Layers,
  Thermometer,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  FileText,
  User,
  Info,
  Maximize2,
  Crosshair,
  Volume2,
} from 'lucide-react';

interface OnSiteCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCaseStudy: (newCaseStudy: CaseStudy) => void;
}

export const OnSiteCameraModal: React.FC<OnSiteCameraModalProps> = ({
  isOpen,
  onClose,
  onSubmitCaseStudy,
}) => {
  // Camera state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [burnWatermark, setBurnWatermark] = useState<boolean>(true);
  const [step, setStep] = useState<'camera' | 'details' | 'success'>('camera');
  const [filterMode, setFilterMode] = useState<'normal' | 'contrast' | 'vibrant'>('normal');

  // Form Fields for the Jobsite Case Study
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('Denver, CO');
  const [facilityType, setFacilityType] = useState<string>('Commercial Parking Deck');
  const [substrate, setSubstrate] = useState<string>('Cast-in-Place Concrete');
  const [squareFootage, setSquareFootage] = useState<number>(14500);
  const [thicknessInches, setThicknessInches] = useState<number>(3.0);
  const [finishType, setFinishType] = useState<string>('Monoglass Natural White');
  const [stage, setStage] = useState<CaseStudyImage['stage']>('Finished Surface');
  const [contractorName, setContractorName] = useState<string>('');
  const [contractorCompany, setContractorCompany] = useState<string>('');
  const [submitterEmail, setSubmitterEmail] = useState<string>('');
  const [challenge, setChallenge] = useState<string>('');
  const [solution, setSolution] = useState<string>('');
  const [jobsiteNotes, setJobsiteNotes] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio shutter sound generator using Web Audio API
  const playShutterSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio context might be restricted before interaction; safe fallback
    }
  }, []);

  // Initialize or reconfigure camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) is not supported in this browser. You can still upload photos from file storage.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {
          // auto-play handle
        });
      }

      // Check if torch is supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : null;
      if (capabilities && 'torch' in capabilities) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let message = 'Unable to access camera. Please verify camera permissions in your browser or use the file upload option below.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser settings, or upload an installation photo from your device gallery.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No hardware camera detected. You can upload an installation photo directly from your device.';
      }
      setCameraError(message);
    }
  }, [facingMode]);

  // Handle opening and closing modal camera stream
  useEffect(() => {
    if (isOpen && step === 'camera') {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, step, facingMode]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch constraint error', err);
    }
  };

  // Flip Camera
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Snap photo from live video feed
  const capturePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    playShutterSound();

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // Apply color filters if selected
    if (filterMode === 'contrast') {
      ctx.filter = 'contrast(1.2) saturate(1.1)';
    } else if (filterMode === 'vibrant') {
      ctx.filter = 'saturate(1.3) brightness(1.05)';
    } else {
      ctx.filter = 'none';
    }

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // If burn watermark is active, stamp date & coordinates
    if (burnWatermark) {
      const now = new Date();
      const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const jobsiteBadge = `${facilityType.toUpperCase()} • MONOGLASS® ON-SITE QA`;

      ctx.save();
      // Bottom banner overlay
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, height - 60, width, 60);

      // Monoglass badge
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('MONOGLASS® FIELD VERIFICATION', 24, height - 34);

      // Timestamp & details
      ctx.font = '14px monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`${dateStr} | Substrate: ${substrate} | ${stage}`, 24, height - 14);

      // Top right pin
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.roundRect ? ctx.roundRect(width - 240, 20, 220, 40, 8) : ctx.fillRect(width - 240, 20, 220, 40);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('• GPS ON-SITE VERIFIED', width - 225, 45);

      ctx.restore();
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhotoUrl(dataUrl);
    setIsCapturing(false);
    setStep('details');

    // Pre-populate title with auto suggestion if blank
    if (!title) {
      setTitle(`${facilityType} - ${substrate} Monoglass Installation`);
    }
    if (!challenge) {
      setChallenge(`Required non-combustible continuous thermal R-${(thicknessInches * 4.0).toFixed(1)} insulation and acoustic NRC 0.95+ reverberation control over ${substrate.toLowerCase()}.`);
    }
    if (!solution) {
      setSolution(`Applied ${thicknessInches.toFixed(1)}" Monoglass ${finishType} with pneumatic liquid atomization rings directly to ${substrate.toLowerCase()} at ${location}.`);
    }
  };

  // Fallback: Upload from file picker (e.g. mobile photo roll or desktop file)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCapturedPhotoUrl(event.target.result);
        setStep('details');
        if (!title) {
          setTitle(`${facilityType} - ${substrate} Installation`);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Calculate R-Value and NRC based on thickness
  const calculatedRValue = (thicknessInches * 4.0).toFixed(1);
  const calculatedNrc = thicknessInches >= 3.0 ? 'NRC 1.00' : thicknessInches >= 2.0 ? 'NRC 0.95' : 'NRC 0.85';

  // Handle final submission to User-Submitted category
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedPhotoUrl) return;

    const newId = `cs-user-${Date.now().toString(36)}`;
    const finalTitle = title.trim() || `${facilityType} Installation`;

    const newCaseStudy: CaseStudy = {
      id: newId,
      title: finalTitle,
      location: location || 'Field Jobsite',
      category: 'user-submitted',
      facilityType: facilityType || 'Commercial Facility',
      squareFootage: Number(squareFootage) || 5000,
      thicknessApplied: `${thicknessInches.toFixed(1)}" (${(thicknessInches * 25.4).toFixed(0)} mm)`,
      thicknessInches: Number(thicknessInches),
      rValueAchieved: `R-${calculatedRValue} Continuous`,
      rValueNum: Number(calculatedRValue),
      nrcAchieved: calculatedNrc,
      nrcNum: thicknessInches >= 3 ? 1.0 : 0.95,
      finishType: finishType,
      substrate: substrate,
      yearCompleted: new Date().getFullYear(),
      architectOrEngineer: contractorCompany || contractorName || 'Verified Spray Applicator',
      contractorName: contractorName || 'On-Site Field Technician',
      contractorCompany: contractorCompany || 'Certified Insulation Contractor',
      submitterEmail: submitterEmail || 'contractor@jobsite.com',
      submitterRole: 'Certified Contractor / Jobsite Applicator',
      approvalStatus: 'pending', // Starts in pending review for moderation
      submittedAt: new Date().toISOString(),
      jobsiteNotes: jobsiteNotes || undefined,
      verifiedBadge: true,
      challenge:
        challenge ||
        `On-site installation required high-adhesion monolithic thermal R-${calculatedRValue} coverage and acoustic damping on ${substrate.toLowerCase()}.`,
      solution:
        solution ||
        `Sprayed ${thicknessInches.toFixed(1)}" Monoglass ${finishType} using certified high-output blower rigs with strict ASTM E605 pin-gauge depth verification.`,
      results: [
        `Achieved continuous R-${calculatedRValue} thermal insulation with zero thermal bridging`,
        `Delivered tested acoustic reverberation control (${calculatedNrc}) across ceiling envelope`,
        `Certified ASTM E84 Class 1 / Class A flame spread 0, smoke developed 0`,
        `Installed on-schedule by ${contractorCompany || 'certified spray crew'} with full substrate adhesion verification`,
      ],
      keyFeatures: [
        'On-site photo verification with jobsite timestamping',
        'Direct substrate adhesion without mechanical pins',
        'Inorganic glass fiber with zero fungal growth (ASTM C1338)',
        'Monolithic monolithic coverage around pipes & MEP ducts',
      ],
      imageUrl: capturedPhotoUrl,
      images: [
        {
          url: capturedPhotoUrl,
          caption: `${finalTitle} - ${stage} photographed on-site by ${contractorName || 'Contractor'}`,
          stage: stage,
        },
      ],
    };

    // Save to user case studies
    onSubmitCaseStudy(newCaseStudy);
    setStep('success');
  };

  const resetAndClose = () => {
    setCapturedPhotoUrl(null);
    setStep('camera');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                On-Site Camera & Jobsite Photo Submittal
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Camera API
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Snap or upload real-time jobsite photos to add to the User-Submitted gallery
              </p>
            </div>
          </div>

          <button
            onClick={resetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: CAMERA VIEWFINDER */}
          {step === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                /* Fallback when camera is unavailable or denied */
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h4 className="text-base font-bold text-white">Camera Access Notice</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-sky-400" /> Retry Camera Access
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" /> Upload Photo from Device
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                /* Live Camera Viewfinder */
                <div className="space-y-4">
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className={`w-full h-full object-cover transition-all ${
                        filterMode === 'contrast'
                          ? 'contrast-125 saturate-110'
                          : filterMode === 'vibrant'
                          ? 'saturate-150 brightness-105'
                          : ''
                      }`}
                    />

                    {/* Framing Reticle / Rule of Thirds Grid Overlay */}
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                        <div className="border-r border-b border-white/20" />
                        <div className="border-r border-b border-white/20" />
                        <div className="border-b border-white/20" />
                        <div className="border-r border-b border-white/20" />
                        <div className="border-r border-b border-white/20 flex items-center justify-center">
                          <Crosshair className="w-8 h-8 text-sky-400/40" />
                        </div>
                        <div className="border-b border-white/20" />
                        <div className="border-r border-white/20" />
                        <div className="border-r border-white/20" />
                        <div />
                      </div>
                    )}

                    {/* Top Overlay Controls */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                      <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-[11px] text-white font-mono">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-slate-300 font-semibold">LIVE CAMERA FEED</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasTorch && (
                          <button
                            type="button"
                            onClick={toggleTorch}
                            className={`p-2 rounded-lg backdrop-blur-md border text-xs font-bold transition-all ${
                              torchOn
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                                : 'bg-slate-950/80 text-slate-300 border-slate-700 hover:bg-slate-900'
                            }`}
                            title="Toggle Torch/Flash"
                          >
                            {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowGrid((prev) => !prev)}
                          className={`p-2 rounded-lg backdrop-blur-md border text-xs transition-all ${
                            showGrid
                              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                              : 'bg-slate-950/80 text-slate-400 border-slate-700 hover:text-slate-200'
                          }`}
                          title="Toggle Alignment Grid"
                        >
                          <Crosshair className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={flipCamera}
                          className="p-2 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                          title="Flip Camera (Front/Rear)"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Status Overlay */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[11px] pointer-events-none">
                      <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-slate-300">
                        Facing: <strong className="text-sky-400 capitalize">{facingMode}</strong>
                      </div>
                      <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-slate-300">
                        {burnWatermark ? '✓ QA Watermark Stamp ON' : 'QA Watermark OFF'}
                      </div>
                    </div>
                  </div>

                  {/* Camera Action Bar */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Filter & Watermark Options */}
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={burnWatermark}
                          onChange={(e) => setBurnWatermark(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
                        />
                        <span>Burn Monoglass QA Stamp</span>
                      </label>

                      <div className="h-4 w-px bg-slate-800" />

                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Filter:</span>
                        <select
                          value={filterMode}
                          onChange={(e) => setFilterMode(e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="contrast">High Contrast</option>
                          <option value="vibrant">Vibrant Deck</option>
                        </select>
                      </div>
                    </div>

                    {/* Main Shutter Trigger */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
                        title="Upload existing photo from gallery"
                      >
                        <UploadCloud className="w-4 h-4 text-sky-400" /> From Gallery
                      </button>

                      <button
                        type="button"
                        id="camera-shutter-btn"
                        onClick={capturePhoto}
                        disabled={isCapturing}
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-sky-500/30 active:scale-95 transition-all flex items-center gap-2.5"
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-950 animate-pulse" />
                        <span>SNAP ON-SITE PHOTO</span>
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: INSTALLATION METADATA & SUBMISSION FORM */}
          {step === 'details' && capturedPhotoUrl && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Photo Preview Column */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      Captured Field Photo
                    </span>
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-800 bg-black shadow-lg">
                      <img
                        src={capturedPhotoUrl}
                        alt="Captured installation"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedPhotoUrl(null);
                            setStep('camera');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1 shadow"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Retake
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Calculated Metrics Box */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                    <div className="font-bold text-white text-xs border-b border-slate-800 pb-1.5 flex items-center justify-between">
                      <span>Monoglass Spec Calibrations</span>
                      <span className="text-emerald-400 font-mono">ASTM Verified</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Thermal Resistance:</span>
                      <span className="font-mono font-bold text-sky-400">R-{calculatedRValue}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Acoustic Absorption:</span>
                      <span className="font-mono font-bold text-indigo-400">{calculatedNrc}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Flame / Smoke:</span>
                      <span className="font-mono font-bold text-emerald-400">Class A (0 / 0)</span>
                    </div>
                  </div>
                </div>

                {/* Metadata Fields Form */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Project Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Project / Installation Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Apex High-Rise Level 2 Cantilever Soffit"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Location & Facility Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">
                        Jobsite Location (City, State/Province) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Denver, CO"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Facility Type</label>
                      <select
                        value={facilityType}
                        onChange={(e) => setFacilityType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      >
                        <option value="Commercial Parking Deck">Commercial Parking Deck</option>
                        <option value="High-Rise Office Tower Soffit">High-Rise Office Tower Soffit</option>
                        <option value="Sports Arena & Natatorium">Sports Arena & Natatorium</option>
                        <option value="Industrial Logistics Warehouse">Industrial Logistics Warehouse</option>
                        <option value="Soundstage / Recording Studio">Soundstage / Recording Studio</option>
                        <option value="Mechanical Penthouse">Mechanical Penthouse</option>
                        <option value="Institutional Laboratory">Institutional Laboratory</option>
                      </select>
                    </div>
                  </div>

                  {/* Substrate & Finish */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Substrate Material</label>
                      <select
                        value={substrate}
                        onChange={(e) => setSubstrate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      >
                        <option value="Cast-in-Place Concrete">Cast-in-Place Concrete</option>
                        <option value="Fluted Metal Deck (1.5” profile)">Fluted Metal Deck (1.5” profile)</option>
                        <option value="Deep Rib Metal Deck (3.0” profile)">Deep Rib Metal Deck (3.0” profile)</option>
                        <option value="Open-Web Bar Joists & Structural Steel">Open-Web Bar Joists & Steel</option>
                        <option value="Wood Joists & Plywood Sheathing">Wood Joists & Sheathing</option>
                        <option value="Gypsum Sheathing / Plaster Ceiling">Gypsum Sheathing / Plaster</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Finish System</label>
                      <select
                        value={finishType}
                        onChange={(e) => setFinishType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      >
                        <option value="Monoglass Natural White">Monoglass Natural White (85% LR)</option>
                        <option value="Monoglass Black (Acoustic / Cinema)">Monoglass Black (Acoustic)</option>
                        <option value="Sonoglaze Protective Hard Coat">Sonoglaze Protective Hard Coat</option>
                        <option value="Hand-Tamped Smooth Architectural">Hand-Tamped Smooth Architectural</option>
                        <option value="K-Lastic Primed Substrate">K-Lastic Primed Substrate</option>
                      </select>
                    </div>
                  </div>

                  {/* Thickness Slider & Stage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-300">Applied Thickness:</span>
                        <span className="font-mono font-bold text-sky-400">{thicknessInches.toFixed(1)}" ({calculatedRValue} R-Value)</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.25"
                        value={thicknessInches}
                        onChange={(e) => setThicknessInches(parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Installation Stage</label>
                      <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      >
                        <option value="Finished Surface">Finished Surface</option>
                        <option value="In-Progress Spray">In-Progress Spray</option>
                        <option value="Substrate Prep">Substrate Prep</option>
                        <option value="Detail View">Detail View</option>
                        <option value="Before / Uninsulated">Before / Uninsulated</option>
                      </select>
                    </div>
                  </div>

                  {/* Contractor Submitter Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Contractor / Submitter Name</label>
                      <input
                        type="text"
                        value={contractorName}
                        onChange={(e) => setContractorName(e.target.value)}
                        placeholder="e.g. Mike Ross, Certified Applicator"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Company / Organization</label>
                      <input
                        type="text"
                        value={contractorCompany}
                        onChange={(e) => setContractorCompany(e.target.value)}
                        placeholder="e.g. Western Spray Systems Ltd."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Jobsite Notes / Engineering Solution */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Jobsite Notes & Engineering Solution Summary
                    </label>
                    <textarea
                      rows={2}
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="Brief notes on surface prep, adhesion test results, or pin-gauge depth verification..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPhotoUrl(null);
                    setStep('camera');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" /> Back to Camera
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    id="submit-case-study-btn"
                    className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 active:scale-98 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Submit to User Gallery for Approval
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Jobsite Photo Submitted!</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your on-site installation has been added to the <strong>User-Submitted</strong> gallery category under pending verification. You can review or approve it immediately.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPhotoUrl(null);
                    setStep('camera');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-sky-400" /> Snap Another Photo
                </button>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-lg shadow-sky-500/20"
                >
                  View in Gallery
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
