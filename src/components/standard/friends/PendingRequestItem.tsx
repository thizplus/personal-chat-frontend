// src/components/friends/PendingRequestItem.tsx
import React from 'react';
import { User, UserCheck, UserX } from 'lucide-react';
import type { PendingRequestItem as PendingRequestItemType } from '@/types/user-friendship.types';

interface PendingRequestItemProps {
  request: PendingRequestItemType;
  onAccept: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
}

const PendingRequestItem: React.FC<PendingRequestItemProps> = ({ 
  request, 
  onAccept, 
  onReject 
}) => {
  // ตรวจสอบว่าคำขอเป็นเพื่อนถูกส่งโดยฉันหรือไม่
  // (อาจต้องปรับตามข้อมูลที่มีจริงในระบบของคุณ)
  const sentByMe = false; // ต้องตรวจสอบจากข้อมูลจริง
  
  const formatRequestDate = () => {
    const date = new Date(request.requested_at);
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const handleAccept = async () => {
    await onAccept(request.request_id);
  };

  const handleReject = async () => {
    await onReject(request.request_id);
  };

  return (
    <div className="p-4 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          {request.profile_image_url ? (
            <img 
              src={request.profile_image_url} 
              alt={request.display_name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <User size={20} className="text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-card-foreground">{request.display_name}</h3>
          <p className=" text-muted-foreground">{request.username}</p>
          <p className=" text-muted-foreground/70">ส่งคำขอเมื่อ {formatRequestDate()}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        {!sentByMe ? (
          <>
            <button 
              onClick={handleAccept}
              className="p-2 rounded-full bg-primary/10 text-primary"
              title="ยอมรับคำขอเป็นเพื่อน"
            >
              <UserCheck size={18} />
            </button>
            <button 
              onClick={handleReject}
              className="p-2 rounded-full bg-destructive/10 text-destructive"
              title="ปฏิเสธคำขอเป็นเพื่อน"
            >
              <UserX size={18} />
            </button>
          </>
        ) : (
          <span className=" text-muted-foreground">รอการตอบรับ</span>
        )}
      </div>
    </div>
  );
};

export default PendingRequestItem;