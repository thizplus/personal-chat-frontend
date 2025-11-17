// src/components/friends/BlockedUserItem.tsx
import React from 'react';
import { User } from 'lucide-react';
import type { BlockedUserItem as BlockedUserItemType } from '@/types/user-friendship.types';

interface BlockedUserItemProps {
  user: BlockedUserItemType;
  onUnblock: (id: string) => Promise<boolean>;
}

const BlockedUserItem: React.FC<BlockedUserItemProps> = ({ user, onUnblock }) => {
  const handleUnblock = async () => {
    if (window.confirm(`คุณต้องการยกเลิกการบล็อก ${user.display_name} ใช่หรือไม่?`)) {
      await onUnblock(user.id);
    }
  };

  return (
    <div className="p-4 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          {user.profile_image_url ? (
            <img 
              src={user.profile_image_url} 
              alt={user.display_name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <User size={20} className="text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-card-foreground">{user.display_name}</h3>
          <p className=" text-muted-foreground">{user.username}</p>
        </div>
      </div>
      
      <div>
        <button 
          onClick={handleUnblock}
          className=" text-primary hover:underline"
        >
          ยกเลิกการบล็อก
        </button>
      </div>
    </div>
  );
};

export default BlockedUserItem;