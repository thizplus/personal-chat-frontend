// src/components/layouts/standardLayout/NavButton.tsx

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface NavButtonProps {
  icon: LucideIcon;
  size: number;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, size, isActive, onClick }) => (
  <button 
    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground'
    }`}
    onClick={onClick}
  >
    <Icon size={size} />
  </button>
);

export default NavButton;