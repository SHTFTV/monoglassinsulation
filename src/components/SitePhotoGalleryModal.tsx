import React, { useState } from 'react';
import {
  Camera,
  X,
  Trash2,
  Download,
  Calendar,
  Layers,
  Tag,
  Maximize2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { ProjectSitePhoto, ProjectRoomItem } from '../types';
import { PHOTO_CATEGORIES } from '../utils/imageUtils';

interface SitePhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: ProjectSitePhoto[];
  onDeletePhoto: (photoId: string) => void;
  onUpdatePhotoCaption: (photoId: string, caption: string) => void;
  onOpenAddModal: () => void;
  projectName?: string;
  rooms?: ProjectRoomItem[];
}

export const SitePhotoGalleryModal: React.FC<SitePhotoGalleryModalProps> = ({
  isOpen,
  onClose,
  photos,
  onDeletePhoto,
  onUpdatePhotoCaption,
  onOpenAddModal,
  projectName = 'Project Estimate',
  rooms = [],
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [editingCaptionText, setEditingCaptionText] = useState<string>('');

  if (!isOpen) return null;

  const filteredPhotos = photos.filter((p) => {
    if (filterCategory === 'all') return true;
    return p.category === filterCategory;
  });

  const activePhoto =
    selectedPhotoIndex !== null && filteredPhotos[selectedPhotoIndex]
      ? filteredPhotos[selectedPhotoIndex]
      : null;

  const handleDownload = (photo: ProjectSitePhoto) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = `${photo.caption.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'site_photo'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartEditCaption = (photo: ProjectSitePhoto) => {
    setEditingCaptionId(photo.id);
    setEditingCaptionText(photo.caption);
  };

  const handleSaveCaption = (photoId: string) => {
    if (editingCaptionText.trim()) {
      onUpdatePhotoCaption(photoId, editingCaptionText.trim());
    }
    setEditingCaptionId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scaleUp"
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
                  Project Site Photos Gallery
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {photos.length} Photo{photos.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Attached to estimate: <strong className="text-slate-300">"{projectName}"</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Site Photo</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="bg-slate-950/70 border-b border-slate-800 p-3 sm:px-6 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setFilterCategory('all');
              setSelectedPhotoIndex(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterCategory === 'all'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Photos ({photos.length})
          </button>
          {PHOTO_CATEGORIES.map((cat) => {
            const count = photos.filter((p) => p.category === cat.id).length;
            if (count === 0 && filterCategory !== cat.id) return null;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setFilterCategory(cat.id);
                  setSelectedPhotoIndex(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  filterCategory === cat.id
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Body Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 text-slate-500 mx-auto flex items-center justify-center">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">No Site Photos Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Capture or attach photos of existing steel decking, post-tensioned concrete, or MEP clearances to document site conditions.
                </p>
              </div>
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20 inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Add First Site Photo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPhotos.map((photo, index) => {
                const catDef = PHOTO_CATEGORIES.find((c) => c.id === photo.category);
                const isEditing = editingCaptionId === photo.id;

                return (
                  <div
                    key={photo.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-all group flex flex-col"
                  >
                    {/* Thumbnail Image Container */}
                    <div
                      onClick={() => setSelectedPhotoIndex(index)}
                      className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer group-hover:opacity-95 transition-opacity"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={photo.caption}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                        <span className="text-[11px] font-bold text-white flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-sm">
                          <Maximize2 className="w-3 h-3 text-sky-400" /> Click to Zoom
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono bg-slate-950/80 px-2 py-0.5 rounded">
                          {photo.fileSizeKb} KB
                        </span>
                      </div>
                    </div>

                    {/* Metadata and Actions */}
                    <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              catDef?.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {catDef?.label || photo.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(photo.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              value={editingCaptionText}
                              onChange={(e) => setEditingCaptionText(e.target.value)}
                              className="w-full px-2.5 py-1 bg-slate-900 border border-sky-500 rounded-lg text-white text-xs font-semibold focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveCaption(photo.id);
                                if (e.key === 'Escape') setEditingCaptionId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveCaption(photo.id)}
                              className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                              title="Save Caption"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <h4
                            onClick={() => handleStartEditCaption(photo)}
                            className="text-xs font-bold text-white line-clamp-2 hover:text-sky-300 cursor-pointer flex items-center gap-1 group/title"
                            title="Click to edit caption"
                          >
                            <span>{photo.caption}</span>
                            <Edit2 className="w-3 h-3 text-slate-400 group-hover/title:text-sky-400 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                          </h4>
                        )}

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                          <Layers className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{photo.roomName || 'Project Wide'}</span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleDownload(photo)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                          title="Download photo"
                        >
                          <Download className="w-3 h-3" />
                          <span>Save JPG</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('Delete this site photo from the estimate?')) {
                              onDeletePhoto(photo.id);
                            }
                          }}
                          className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Full-Screen Lightbox Modal when an image is clicked */}
        {activePhoto && (
          <div
            className="fixed inset-0 z-60 bg-slate-950/95 flex flex-col items-center justify-center p-4 backdrop-blur-lg animate-fadeIn"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <div
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Topbar */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{activePhoto.caption}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{activePhoto.roomName || 'Project Wide'}</span>
                    <span>•</span>
                    <span className="font-mono">{new Date(activePhoto.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(activePhoto)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setSelectedPhotoIndex(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Image Stage */}
              <div className="relative flex-1 bg-slate-950 p-2 flex items-center justify-center overflow-hidden min-h-[300px]">
                <img
                  src={activePhoto.dataUrl}
                  alt={activePhoto.caption}
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-xl"
                />

                {/* Nav arrows */}
                {selectedPhotoIndex !== null && selectedPhotoIndex > 0 && (
                  <button
                    onClick={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
                    className="absolute left-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {selectedPhotoIndex !== null && selectedPhotoIndex < filteredPhotos.length - 1 && (
                  <button
                    onClick={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
                    className="absolute right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
