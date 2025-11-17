// src/components/layouts/standardLayout/DesktopSidebar.tsx

import React from 'react';
import { LogOut } from 'lucide-react';
import { MENU_ITEMS } from '@/configs/standLayouts/menuConfig';
import NavButton from './NavButton';

interface DesktopSidebarProps {
  activeMenu: (path: string) => boolean;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ activeMenu, onNavigate, onLogout }) => {
  // สร้างตัวแปรสำหรับไอคอนแรก
  const FirstIcon = MENU_ITEMS[0].icon;

  return (
    <div className="w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6">
      {/* Logo */}
      <div className="mb-8">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-xl">
          <FirstIcon size={24} />
        </div>
      </div>

      {/* เมนูนำทาง */}
      <nav className="flex-1 flex flex-col items-center gap-6">
        {MENU_ITEMS.map((item) => (
          <NavButton 
            key={item.path}
            icon={item.icon} 
            size={item.size.desktop}
            isActive={activeMenu(item.path)} 
            onClick={() => onNavigate(item.path)} 
          />
        ))}
      </nav>

      {/* ผู้ใช้ */}
      <div className="mt-auto">
        <button 
          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-sidebar-accent text-destructive transition-colors"
          onClick={onLogout}
        >
          <LogOut size={24} />
        </button>
      </div>
    </div>
  );
};

export default DesktopSidebar;