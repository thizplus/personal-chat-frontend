// src/components/standard/conversation/EmptyConversationView.tsx
import React from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * คอมโพเนนต์แสดงเมื่อไม่มีการสนทนาที่ถูกเลือก
 */
const EmptyConversationView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background">
      <div className="text-muted-foreground mb-4">
        <MessageCircle size={48} strokeWidth={1} />
      </div>
      <h2 className="text-lg font-medium text-foreground mb-1">ยังไม่มีการสนทนา</h2>
      <p className="text-sm text-muted-foreground">เลือกห้องแชทหรือสร้างห้องแชทใหม่</p>
    </div>
  );
};

export default EmptyConversationView;