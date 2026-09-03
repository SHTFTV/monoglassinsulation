import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before: Bare Substrate',
  afterLabel = 'After: Monoglass Installed',
  aspectRatio = 'aspect-[16/10]',
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    },
    [handleMove]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    },
    [isDragging, handleMove]
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-xl border border-slate-700 bg-slate-950 group cursor-ew-resize ${aspectRatio} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onClick={(e) => handleMove(e.clientX)}
    >
      {/* After Image (Background / Full Width) */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Before Image (Clipped Overlay) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover max-w-none"
          style={{
            width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
            height: '100%',
          }}
          loading="lazy"
        />
        {/* Darkening tint on 'Before' image for contrast */}
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      </div>

      {/* Slider Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] z-10 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/95 text-slate-900 shadow-xl flex items-center justify-center border-2 border-sky-500 pointer-events-auto cursor-ew-resize transition-transform group-hover:scale-110">
          <svg
            className="w-4 h-4 text-slate-900"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 3 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-amber-300 shadow-lg">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          {beforeLabel}
        </span>
      </div>

      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-sky-500/40 text-[11px] font-semibold text-sky-300 shadow-lg">
          <Sparkles className="w-3 h-3 text-sky-400" />
          {afterLabel}
        </span>
      </div>

      {/* Hint at bottom */}
      <div className="absolute bottom-2 inset-x-0 flex justify-center z-10 pointer-events-none">
        <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-medium text-slate-300 tracking-wide border border-white/10">
          Drag or click to compare
        </span>
      </div>
    </div>
  );
};
