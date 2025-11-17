// src/components/standard/friends/EmptyState.tsx
import React from 'react';
import type { FriendCategory } from '@/pages/standard/friend/FriendsPage';

interface EmptyStateProps {
  category: FriendCategory;
}

const EmptyState: React.FC<EmptyStateProps> = ({ category }) => {
  return (
    <div className="p-6 text-center">
      {category === 'all' && <p className="text-muted-foreground">ยังไม่มีเพื่อนในรายชื่อ</p>}
      {category === 'groups' && <p className="text-muted-foreground">คุณยังไม่มีกลุ่มสนทนา</p>}
      {category === 'pending' && <p className="text-muted-foreground">ไม่มีคำขอเป็นเพื่อนในขณะนี้</p>}
      {category === 'blocked' && <p className="text-muted-foreground">ไม่มีผู้ใช้ที่ถูกบล็อก</p>}
    </div>
  );
};

export default EmptyState;