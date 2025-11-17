// src/components/standard/friends/FriendTabs.tsx
import React from 'react';
import type { FriendCategory } from '@/pages/standard/friend/FriendsPage';


interface FriendTabsProps {
  activeCategory: FriendCategory;
  onCategoryChange: (category: FriendCategory) => void;
  pendingRequestCount: number; // เพิ่ม prop นี้เพื่อแสดงจำนวนคำขอเป็นเพื่อน
}

const FriendTabs: React.FC<FriendTabsProps> = ({
  activeCategory,
  onCategoryChange,
  pendingRequestCount
}) => {
  return (
    <div className="px-6">
      <div className="flex gap-2 mb-6 border-b border-border pb-0.5">
        <button 
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeCategory === 'all' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => onCategoryChange('all')}
        >
          เพื่อน
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeCategory === 'groups' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => onCategoryChange('groups')}
        >
          กลุ่ม
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap relative ${activeCategory === 'pending' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => onCategoryChange('pending')}
        >
          คำขอเป็นเพื่อน
          {pendingRequestCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground  rounded-full w-5 h-5 flex items-center justify-center">
              {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
            </span>
          )}
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeCategory === 'blocked' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => onCategoryChange('blocked')}
        >
          บล็อก
        </button>
      </div>
    </div>
  );
};

export default FriendTabs;