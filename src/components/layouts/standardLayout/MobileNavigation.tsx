// src/components/layouts/standardLayout/MobileNavigation.tsx

import React from 'react';
import { MENU_ITEMS } from '@/configs/standLayouts/menuConfig';
import MobileNavButton from './MobileNavButton';

interface MobileNavigationProps {
  activeMenu: (path: string) => boolean;
  onNavigate: (path: string) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ activeMenu, onNavigate }) => (
  <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-10">
    {MENU_ITEMS.map((item) => (
      <MobileNavButton 
        key={item.path}
        icon={item.icon} 
        size={item.size.mobile}
        label={item.label} 
        isActive={activeMenu(item.path)} 
        onClick={() => onNavigate(item.path)} 
      />
    ))}
  </nav>
);

export default MobileNavigation;