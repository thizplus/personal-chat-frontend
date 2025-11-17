// src/components/shared/message/MessageStatusIndicator.tsx
import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';

interface MessageStatusIndicatorProps {
  status?: string;
}

/**
 * คอมโพเนนต์แสดงสถานะข้อความ
 */
const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({ status }) => {
  switch (status) {
    case 'sending':
      return <Clock size={14} className="text-muted-foreground" />;
      
    case 'sent':
      return <Check size={14} className="text-muted-foreground" />;
      
    case 'delivered':
      return <CheckCheck size={14} className="text-muted-foreground" />;
      
    case 'read':
      return <CheckCheck size={14} className="text-primary" />;
      
    case 'failed':
      return <span className=" text-destructive">ส่งไม่สำเร็จ</span>;
      
    default:
      return null;
  }
};

export default MessageStatusIndicator;