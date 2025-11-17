// src/components/app/shared/AttachmentMenu.tsx
import React from 'react';
import { Image, File } from 'lucide-react';

interface AttachmentMenuProps {
  onSelectImage: () => void;
  onSelectFile: () => void;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ onSelectImage, onSelectFile }) => {
  return (
    <div className="flex flex-col w-40">
      <button
        className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg transition-colors text-card-foreground"
        onClick={onSelectImage}
      >
        <Image size={18} className="text-sky-600 dark:text-sky-400" />
        <span>รูปภาพ</span>
      </button>
      <button
        className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg transition-colors text-card-foreground"
        onClick={onSelectFile}
      >
        <File size={18} className="text-emerald-600 dark:text-emerald-400" />
        <span>ไฟล์</span>
      </button>
    </div>
  );
};

export default AttachmentMenu;