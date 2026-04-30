import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ 
  images, 
  initialIndex = 0, 
  isOpen, 
  onClose 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const isVideo = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.startsWith('data:video/');
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white z-10">
        <div className="text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setZoom(z => Math.min(z + 0.5, 3))}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setZoom(z => Math.max(z - 0.5, 1))}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {images.length > 1 && (
          <button 
            onClick={handlePrev}
            className="absolute left-4 z-10 p-3 hover:bg-white/10 rounded-full text-white transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        <div 
          className="w-full h-full flex items-center justify-center p-4"
          style={{ transition: 'transform 0.2s ease-out', transform: `scale(${zoom})` }}
        >
          {isVideo(images[currentIndex]) ? (
            <video 
              src={images[currentIndex]} 
              controls 
              autoPlay 
              className="max-w-full max-h-full rounded-lg shadow-2xl"
            />
          ) : (
            <img 
              src={images[currentIndex]} 
              alt={`Image ${currentIndex + 1}`} 
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          )}
        </div>

        {images.length > 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-4 z-10 p-3 hover:bg-white/10 rounded-full text-white transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* Thumbnails (Only if multiple images) */}
      {images.length > 1 && (
        <div className="p-4 flex items-center justify-center gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); setZoom(1); }}
              className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                idx === currentIndex ? 'border-[#E01515] scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              {isVideo(img) ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Maximize className="w-6 h-6 text-white/50" />
                </div>
              ) : (
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
