// src/components/layouts/standardLayout/MobileNavButton.tsx

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MobileNavButtonProps {
  icon: LucideIcon;
  size: number;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const MobileNavButton: React.FC<MobileNavButtonProps> = ({ 
  icon: Icon, 
  size, 
  label, 
  isActive, 
  onClick 
}) => (
  <button 
    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
      isActive ? 'text-primary' : 'text-muted-foreground'
    }`}
    onClick={onClick}
  >
    <Icon size={size} />
    <span className=" mt-1">{label}</span>
  </button>
);

export default MobileNavButton;