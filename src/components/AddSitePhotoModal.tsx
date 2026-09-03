import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Sparkles,
  Layers,
  Tag,
  Maximize2,
  Trash2,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { ProjectRoomItem, ProjectSitePhoto } from '../types';
import {
  processAndCompressImageFile,
  PHOTO_CATEGORIES,
} from '../utils/imageUtils';

interface AddSitePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPhoto: (photo: ProjectSitePhoto) => void;
  rooms: ProjectRoomItem[];
  defaultRoomId?: string;
  projectName?: string;
}

export const AddSitePhotoModal: React.FC<AddSitePhotoModalProps> = ({
  isOpen,
  onClose,
  onAddPhoto,
  rooms,
  defaultRoomId = 'project-level',
  projectName = 'Project Estimate',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [category, setCategory] = useState<ProjectSitePhoto['category']>('existing-substrate');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(defaultRoomId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP, etc.)');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);

    // Default caption based on file name or timestamp
    if (!caption) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setCaption(cleanName);
    }

    // Generate quick preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      setErrorMsg('Please choose or take a photo first.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let roomName = 'Project Wide / General Site';
      if (selectedRoomId !== 'project-level') {
        const found = rooms.find((r) => r.id === selectedRoomId);
        if (found) roomName = found.name;
      }

      if (selectedFile) {
        const processed = await processAndCompressImageFile(selectedFile, {
          caption: caption.trim() || 'Site Photo',
          category,
          roomRefId: selectedRoomId,
          roomName,
          maxWidth: 1400,
          maxHeight: 1050,
          quality: 0.84,
        });

        onAddPhoto(processed);
      }

      // Reset and close
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      onClose();
    } catch (err: any) {
      console.error('Failed to compress site photo:', err);
      setErrorMsg(err?.message || 'Failed to process image. Please try another photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Add Site Photo to Estimate
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Auto-Saved Locally
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Associate field photos of substrates, fluting, or MEP staging with <strong className="text-slate-300">"{projectName}"</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Photo Capture / Upload Area */}
          {!previewUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center space-y-4 ${
                isDragging
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shadow-inner">
                <Camera className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  Capture or Upload Project Site Photo
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Drag and drop an image here, snap a live photo using your phone/tablet camera, or browse your files.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {/* Take Photo button (Camera) */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Live Photo (Camera)</span>
                </button>

                {/* Browse Files button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center gap-2 active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Browse Photos / Files</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Supports JPG, PNG, WebP, HEIC • Auto-compressed for seamless localStorage persistence
              </p>

              {/* Hidden Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            /* Selected Photo Preview Box */
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-3 space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 max-h-72 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Site Preview"
                  className="max-h-72 w-auto object-contain rounded-lg shadow-md"
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-lg"
                  title="Change photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 font-mono flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB source` : 'Camera Image'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Form: Caption, Category, and Room Association */}
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Photo Caption / Field Description
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Parkade soffit post-tensioned slab inspection, North Bay"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-400" /> Photo Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-sky-500 transition-colors"
                >
                  {PHOTO_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room / Zone Association */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" /> Associate with Zone / Room
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="project-level">Entire Project / General Site</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room: {room.name} ({room.planArea} {room.substrateType})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!previewUrl || isProcessing}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                previewUrl && !isProcessing
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Compressing & Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Attach Site Photo to Estimate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
