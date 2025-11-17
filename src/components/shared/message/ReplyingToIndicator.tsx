// src/components/shared/message/ReplyingToIndicator.tsx
import React from 'react';
import { X } from 'lucide-react';

interface ReplyingToIndicatorProps {
  replyingTo: { id: string; text: string; sender: string };
  onCancelReply?: () => void;
}

/**
 * คอมโพเนนต์แสดงข้อความที่กำลังตอบกลับ
 */
const ReplyingToIndicator: React.FC<ReplyingToIndicatorProps> = ({
  replyingTo,
  onCancelReply
}) => {
  return (
    <div className="mb-2 px-3 py-2 bg-accent border-l-2 border-primary rounded flex justify-between items-start">
      <div>
        <p className=" text-primary mb-1">กำลังตอบกลับ {replyingTo.sender}</p>
        <p className="text-sm text-muted-foreground truncate">{replyingTo.text}</p>
      </div>
      {onCancelReply && (
        <button 
          onClick={onCancelReply}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="ยกเลิกการตอบกลับ"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ReplyingToIndicator;