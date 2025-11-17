// src/components/shared/message/MessageLightbox.tsx
import React from 'react';
import { X } from 'lucide-react';

interface MessageLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

/**
 * คอมโพเนนต์แสดงรูปภาพขนาดใหญ่ (Lightbox)
 */
const MessageLightbox: React.FC<MessageLightboxProps> = ({ imageUrl, onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 dark:bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black/50 dark:bg-black/70 text-white rounded-full p-2 hover:bg-black/70 dark:hover:bg-black/80 transition-colors"
        aria-label="ปิด"
      >
        <X size={20} />
      </button>
      
      <div 
        className="relative max-w-2xl max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt="รูปภาพขยาย"
          className="w-full h-full max-w-[80vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

export default MessageLightbox;