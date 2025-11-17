// src/components/layouts/standardLayout/Header.tsx

import React, { useEffect } from 'react';
import { User, Bell } from 'lucide-react';
import ConnectionStatus from '@/components/common/ConnectionStatus';
import { ModeToggle } from '@/components/theme/mode-toggle';
import useUser from '@/hooks/useUser';

const Header: React.FC = () => {
  // ใช้ useUser hook แทน useUserStore
  const { currentUser, getCurrentUser, loading } = useUser();

  // โหลดข้อมูล current user เมื่อ component ถูกโหลด
  useEffect(() => {
    if (!currentUser) {
      getCurrentUser();
    }
  }, [currentUser, getCurrentUser]);

  // เตรียมข้อมูลสำหรับแสดงผล
  const displayName = currentUser?.display_name || 'Guest';
  const email = currentUser?.email || '';
  const profileImageUrl = currentUser?.profile_image_url;

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-card-foreground">BREEZ CHAT</h1>
      
      <div className="flex items-center gap-4">
        <ModeToggle />
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors">
          <Bell size={20} />
        </button>
        
        <div className="flex items-center gap-2 ">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
            {loading ? (
              <div className="absolute inset-0 bg-muted animate-pulse"></div>
            ) : profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt={displayName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={20} className="text-muted-foreground" />
            )}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-card-foreground flex items-center">
              {loading ? (
                <div className="w-20 h-4 bg-muted animate-pulse rounded"></div>
              ) : (
                displayName
              )}
              <ConnectionStatus showText={true} showReconnectButton={true} />
            </div>
        
            <div className="text-xs text-muted-foreground">
              {loading ? (
                <div className="w-32 h-3 bg-muted animate-pulse rounded mt-1"></div>
              ) : (
                email
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;