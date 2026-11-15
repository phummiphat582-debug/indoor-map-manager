import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import type { EquipmentPhoto } from '../../types';

interface LightboxProps {
  photos: EquipmentPhoto[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(photos.length - 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0);
    }
  }, [currentIndex, photos.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ดูรูปภาพขนาดเต็ม"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Top Header Controls */}
      <div
        className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium text-slate-200 truncate max-w-[200px] sm:max-w-md">
            {currentPhoto.name || 'รูปภาพอุปกรณ์'}
          </span>
          <span className="text-xs text-slate-400 ml-2 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          aria-label="ปิดมุมมองรูปภาพ"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image View */}
      <div
        className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.dataUrl}
          alt={currentPhoto.name || `รูปที่ ${currentIndex + 1}`}
          className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
        />

        {/* Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition border border-white/10 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="รูปก่อนหน้า"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition border border-white/10 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="รูปถัดไป"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 px-4 overflow-x-auto py-2"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((photo, idx) => (
            <button
              key={photo.id || idx}
              onClick={() => onNavigate(idx)}
              className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                idx === currentIndex
                  ? 'border-indigo-500 scale-110 shadow-lg'
                  : 'border-white/20 opacity-50 hover:opacity-90'
              }`}
            >
              <img
                src={photo.dataUrl}
                alt={`thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
